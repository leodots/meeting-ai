import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { join } from "path";
import { nanoid } from "nanoid";
import { getUploadDir } from "@/lib/server/meetings";

export const CHUNK_SIZE_BYTES = 8 * 1024 * 1024;

export interface ChunkedUploadMetadata {
  uploadId: string;
  userId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  title: string;
  description: string | null;
  aiInstructions: string | null;
  projectId: string | null;
  tagIds: string[];
  chunkSize: number;
  totalChunks: number;
  createdAt: string;
}

export function createUploadId(): string {
  return nanoid();
}

export function isValidUploadId(uploadId: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(uploadId);
}

export function getChunkUploadDir(uploadId: string): string {
  return join(getUploadDir(), ".chunks", uploadId);
}

export function getChunkPath(uploadId: string, chunkIndex: number): string {
  return join(getChunkUploadDir(uploadId), `${chunkIndex}.part`);
}

export async function saveChunkedUploadMetadata(metadata: ChunkedUploadMetadata) {
  const dir = getChunkUploadDir(metadata.uploadId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "metadata.json"), JSON.stringify(metadata, null, 2));
}

export async function readChunkedUploadMetadata(uploadId: string) {
  const raw = await readFile(join(getChunkUploadDir(uploadId), "metadata.json"), "utf8");
  return JSON.parse(raw) as ChunkedUploadMetadata;
}

export async function removeChunkedUpload(uploadId: string) {
  await rm(getChunkUploadDir(uploadId), { recursive: true, force: true });
}

export async function writeChunk(uploadId: string, chunkIndex: number, chunk: File) {
  const bytes = await chunk.arrayBuffer();
  await writeFile(getChunkPath(uploadId, chunkIndex), Buffer.from(bytes));
}

export async function combineChunks(uploadId: string, outputPath: string, totalChunks: number) {
  await mkdir(getUploadDir(), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(outputPath);
    output.on("error", reject);
    output.on("finish", resolve);

    let index = 0;

    const appendNext = () => {
      if (index >= totalChunks) {
        output.end();
        return;
      }

      const input = createReadStream(getChunkPath(uploadId, index));
      input.on("error", reject);
      input.on("end", () => {
        index += 1;
        appendNext();
      });
      input.pipe(output, { end: false });
    };

    appendNext();
  });
}

