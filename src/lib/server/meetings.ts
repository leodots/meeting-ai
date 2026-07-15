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

export interface CreateMeetingFromStoredFileInput {
  userId: string;
  originalFileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  title: string;
  description?: string | null;
  aiInstructions?: string | null;
  projectId?: string | null;
  tagIds?: string[];
}

export function getUploadDir(): string {
  return UPLOAD_DIR;
}

export function validateAudioFile(mimeType: string, fileSize: number): string | null {
  if (!ALLOWED_AUDIO_TYPES.includes(mimeType as (typeof ALLOWED_AUDIO_TYPES)[number])) {
    return "Invalid file type. Please upload an m4a, mp3, wav, or ogg file.";
  }

  if (fileSize > getMaxUploadSizeBytes()) {
    return `File is too large. Maximum size is ${getMaxUploadSizeMb()}MB.`;
  }

  return null;
}

export function validateAudioUpload(file: File): string | null {
  return validateAudioFile(file.type, file.size);
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

  return createMeetingFromStoredFile({
    userId,
    originalFileName: file.name,
    storagePath: filepath,
    fileSize: file.size,
    mimeType: file.type,
    title,
    description,
    aiInstructions,
    projectId,
    tagIds,
  });
}

export async function createMeetingFromStoredFile(input: CreateMeetingFromStoredFileInput) {
  const {
    userId,
    originalFileName,
    storagePath,
    fileSize,
    mimeType,
    title,
    description,
    aiInstructions,
    projectId,
    tagIds = [],
  } = input;

  return prisma.meeting.create({
    data: {
      userId,
      title: title.trim(),
      description: description?.trim() || null,
      aiInstructions: aiInstructions?.trim() || null,
      originalFileName,
      storagePath,
      fileSize,
      mimeType,
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
