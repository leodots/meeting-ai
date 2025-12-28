export const AI_MODELS = {
  gemini: {
    id: "gemini-3-flash-preview",
    displayName: "Gemini 3 Flash Preview",
  },
  transcription: {
    provider: "AssemblyAI",
    displayName: "AssemblyAI",
  },
} as const;

export const API_KEYS = {
  gemini: "GEMINI_API_KEY",
  assemblyai: "ASSEMBLYAI_API_KEY",
} as const;

export type ApiKeyType = (typeof API_KEYS)[keyof typeof API_KEYS];
