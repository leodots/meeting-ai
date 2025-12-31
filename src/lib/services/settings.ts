import { prisma } from "@/lib/db/prisma";
import { encrypt, decrypt, maskApiKey } from "@/lib/utils/encryption";
import { API_KEYS, type ApiKeyType } from "@/lib/config/models";

export interface ApiKeyInfo {
  key: ApiKeyType;
  displayName: string;
  maskedValue: string | null;
  isConfigured: boolean;
}

const API_KEY_DISPLAY_NAMES: Record<ApiKeyType, string> = {
  [API_KEYS.gemini]: "Gemini API",
  [API_KEYS.assemblyai]: "AssemblyAI API",
};

export async function getApiKey(key: ApiKeyType): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });

  if (!setting) {
    return null;
  }

  try {
    return decrypt(setting.value);
  } catch (error) {
    console.error(`Failed to decrypt API key ${key}:`, error);
    return null;
  }
}

export async function setApiKey(key: ApiKeyType, value: string): Promise<void> {
  const encryptedValue = encrypt(value);

  await prisma.setting.upsert({
    where: { key },
    update: { value: encryptedValue },
    create: { key, value: encryptedValue },
  });
}

export async function deleteApiKey(key: ApiKeyType): Promise<void> {
  await prisma.setting.delete({
    where: { key },
  }).catch(() => {
    // Ignore if not found
  });
}

export async function getAllApiKeys(): Promise<ApiKeyInfo[]> {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: Object.values(API_KEYS),
      },
    },
  });

  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  return Object.values(API_KEYS).map((key) => {
    const encryptedValue = settingsMap.get(key);
    let maskedValue: string | null = null;

    if (encryptedValue) {
      try {
        const decrypted = decrypt(encryptedValue);
        maskedValue = maskApiKey(decrypted);
      } catch {
        maskedValue = "••••••••";
      }
    }

    return {
      key,
      displayName: API_KEY_DISPLAY_NAMES[key],
      maskedValue,
      isConfigured: !!encryptedValue,
    };
  });
}

