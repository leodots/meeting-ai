import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db/prisma";
import {
  ALLOWED_AUDIO_TYPES,
  getMaxUploadSizeBytes,
  getMaxUploadSizeMb,
} from "@/lib/config/upload";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export interface CreateMeetingFromUploadInput {
  userId: string;
  file: File;
  title: string;
  description?: string | null;
  aiInstructions?: string | null;
  projectId?: string | null;
  tagIds?: string[];
}

export function validateAudioUpload(file: File): string | null {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type as (typeof ALLOWED_AUDIO_TYPES)[number])) {
    return "Invalid file type. Please upload an m4a, mp3, wav, or ogg file.";
  }

  if (file.size > getMaxUploadSizeBytes()) {
    return `File is too large. Maximum size is ${getMaxUploadSizeMb()}MB.`;
  }

  return null;
}

export async function createMeetingFromUpload(input: CreateMeetingFromUploadInput) {
  const { userId, file, title, description, aiInstructions, projectId, tagIds = [] } = input;

  await mkdir(UPLOAD_DIR, { recursive: true });

  const fileId = nanoid();
  const extension = file.name.split(".").pop() || "m4a";
  const filename = `${fileId}.${extension}`;
  const filepath = join(/* turbopackIgnore: true */ UPLOAD_DIR, filename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);

  return prisma.meeting.create({
    data: {
      userId,
      title: title.trim(),
      description: description?.trim() || null,
      aiInstructions: aiInstructions?.trim() || null,
      originalFileName: file.name,
      storagePath: filepath,
      fileSize: file.size,
      mimeType: file.type,
      projectId: projectId || null,
      tags:
        tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
    },
  });
}
