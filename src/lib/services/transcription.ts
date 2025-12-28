import { readFile } from "fs/promises";
import { Language } from "@prisma/client";
import { getApiKey } from "./settings";
import { API_KEYS } from "@/lib/config/models";

const BASE_URL = "https://api.assemblyai.com";

// Interfaces
export interface Utterance {
  speaker: number;
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptionResult {
  utterances: Utterance[];
  speakers: number[];
  duration: number;
  fullText: string;
  detectedLanguage: Language;
  rawResponse: object;
}

// Speaker color palette (distinct colors for easy differentiation)
const speakerColors = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
];

export function getSpeakerColor(speakerIndex: number): string {
  return speakerColors[speakerIndex % speakerColors.length];
}

// AssemblyAI language code to Prisma Language enum mapping
const languageCodeToEnum: Record<string, Language> = {
  en: "ENGLISH",
  en_us: "ENGLISH",
  en_uk: "ENGLISH",
  en_au: "ENGLISH",
  pt: "PORTUGUESE_BR",
  es: "SPANISH",
};

function mapLanguageCode(code: string | null): Language {
  if (!code) return "ENGLISH";
  const normalized = code.toLowerCase().replace("-", "_");
  return languageCodeToEnum[normalized] || "ENGLISH";
}

async function getAssemblyAIApiKey(): Promise<string> {
  const apiKey = await getApiKey(API_KEYS.assemblyai);
  if (!apiKey) {
    throw new Error(
      "AssemblyAI API key not configured. Please add it in Settings."
    );
  }
  return apiKey;
}

interface AssemblyAIUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence: number;
}

interface AssemblyAITranscript {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text: string;
  utterances: AssemblyAIUtterance[] | null;
  audio_duration: number;
  language_code: string | null;
  error?: string;
}

async function uploadAudio(
  audioBuffer: Buffer,
  apiKey: string
): Promise<string> {
  const response = await fetch(`${BASE_URL}/v2/upload`, {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(audioBuffer),
  });

  if (!response.ok) {
    throw new Error(`AssemblyAI upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.upload_url;
}

async function createTranscript(
  audioUrl: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(`${BASE_URL}/v2/transcript`, {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      language_detection: true,
      speaker_labels: true,
      punctuate: true,
      format_text: true,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `AssemblyAI transcript creation failed: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.id;
}

async function pollTranscript(
  transcriptId: string,
  apiKey: string
): Promise<AssemblyAITranscript> {
  const pollingEndpoint = `${BASE_URL}/v2/transcript/${transcriptId}`;

  while (true) {
    const response = await fetch(pollingEndpoint, {
      headers: { authorization: apiKey },
    });

    if (!response.ok) {
      throw new Error(`AssemblyAI polling failed: ${response.statusText}`);
    }

    const result: AssemblyAITranscript = await response.json();

    if (result.status === "completed") {
      return result;
    } else if (result.status === "error") {
      throw new Error(`AssemblyAI transcription failed: ${result.error}`);
    }

    // Wait 3 seconds before polling again
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

function mapSpeakerToIndex(
  speaker: string,
  speakerMap: Map<string, number>
): number {
  if (!speakerMap.has(speaker)) {
    speakerMap.set(speaker, speakerMap.size);
  }
  return speakerMap.get(speaker)!;
}

export async function transcribeAudio(
  audioPath: string
): Promise<TranscriptionResult> {
  const apiKey = await getAssemblyAIApiKey();
  const audioBuffer = await readFile(audioPath);

  // Step 1: Upload audio file
  console.log("[AssemblyAI] Uploading audio file...");
  const audioUrl = await uploadAudio(audioBuffer, apiKey);

  // Step 2: Create transcription request with automatic language detection
  console.log("[AssemblyAI] Starting transcription with language detection...");
  const transcriptId = await createTranscript(audioUrl, apiKey);

  // Step 3: Poll for completion
  console.log("[AssemblyAI] Waiting for transcription to complete...");
  const result = await pollTranscript(transcriptId, apiKey);

  // Step 4: Map response to TranscriptionResult format
  const speakerMap = new Map<string, number>();

  const utterances: Utterance[] =
    result.utterances?.map((u) => ({
      speaker: mapSpeakerToIndex(u.speaker, speakerMap),
      text: u.text,
      start: u.start / 1000, // ms to seconds
      end: u.end / 1000,
      confidence: u.confidence,
    })) || [];

  // Get unique speakers (already numeric from our mapping)
  const speakers = [...new Set(utterances.map((u) => u.speaker))].sort();

  // Create full transcript text
  const fullText = utterances
    .map((u) => `[Speaker ${u.speaker}]: ${u.text}`)
    .join("\n\n");

  // Map detected language to enum
  const detectedLanguage = mapLanguageCode(result.language_code);

  console.log(
    `[AssemblyAI] Transcription complete. ${utterances.length} utterances, ${speakers.length} speakers. Language: ${detectedLanguage}`
  );

  return {
    utterances,
    speakers,
    duration: result.audio_duration,
    fullText,
    detectedLanguage,
    rawResponse: result,
  };
}
