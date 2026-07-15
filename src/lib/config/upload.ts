export const DEFAULT_MAX_UPLOAD_SIZE_MB = 300;

export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/wave",
  "audio/ogg",
  "audio/opus",
] as const;

export function getMaxUploadSizeMb(): number {
  const value = Number.parseInt(
    process.env.MAX_FILE_SIZE_MB || String(DEFAULT_MAX_UPLOAD_SIZE_MB),
    10
  );

  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_UPLOAD_SIZE_MB;
}

export function getPublicMaxUploadSizeMb(): number {
  const value = Number.parseInt(
    process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || String(DEFAULT_MAX_UPLOAD_SIZE_MB),
    10
  );

  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_UPLOAD_SIZE_MB;
}

export function getMaxUploadSizeBytes(): number {
  return getMaxUploadSizeMb() * 1024 * 1024;
}
