import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/db/prisma";
import { apiRateLimiter, RATE_LIMITS } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || "100") * 1024 * 1024);

const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/wave",
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit uploads per user
    const rateLimitResult = apiRateLimiter.check(
      `upload:${session.user.id}`,
      RATE_LIMITS.upload.limit,
      RATE_LIMITS.upload.windowMs
    );

    if (!rateLimitResult.success) {
      log.rateLimitExceeded(session.user.id, "upload");
      return NextResponse.json(
        { error: `Upload limit reached. Try again in ${rateLimitResult.resetIn} seconds.` },
        { status: 429, headers: { "Retry-After": String(rateLimitResult.resetIn) } }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const aiInstructions = formData.get("aiInstructions") as string | null;
    const projectId = formData.get("projectId") as string | null;
    const tagIdsRaw = formData.get("tagIds") as string | null;
    const tagIds = tagIdsRaw ? JSON.parse(tagIdsRaw) as string[] : [];

    // Validate file
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an m4a, mp3, or wav file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Validate title
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const fileId = nanoid();
    const extension = file.name.split(".").pop() || "m4a";
    const filename = `${fileId}.${extension}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create meeting record in database (language will be detected during transcription)
    const meeting = await prisma.meeting.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        aiInstructions: aiInstructions?.trim() || null,
        originalFileName: file.name,
        storagePath: filepath,
        fileSize: file.size,
        mimeType: file.type,
        projectId: projectId || null,
        tags: tagIds.length > 0 ? {
          create: tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        } : undefined,
      },
    });

    log.fileUpload(file.name, file.size, session.user.id);

    return NextResponse.json({
      id: meeting.id,
      message: "File uploaded successfully",
    });
  } catch (error) {
    log.error("Upload failed", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
