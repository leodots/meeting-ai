import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getBearerToken, isValidInternalToken } from "@/lib/server/internal-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!isValidInternalToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = process.env.JARVIS_UPLOAD_USER_EMAIL || process.env.AUTH_EMAIL;
  if (!userEmail) {
    return NextResponse.json(
      { error: "JARVIS_UPLOAD_USER_EMAIL or AUTH_EMAIL must be configured" },
      { status: 500 }
    );
  }

  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      status: true,
      processingError: true,
      uploadedAt: true,
      processedAt: true,
      user: { select: { email: true } },
      transcript: { select: { id: true } },
      analysis: { select: { id: true } },
    },
  });

  if (!meeting || meeting.user.email !== userEmail) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: meeting.id,
    title: meeting.title,
    status: meeting.status,
    error: meeting.processingError,
    uploadedAt: meeting.uploadedAt,
    processedAt: meeting.processedAt,
    hasTranscript: Boolean(meeting.transcript),
    hasAnalysis: Boolean(meeting.analysis),
    url: `/meetings/${meeting.id}`,
  });
}

