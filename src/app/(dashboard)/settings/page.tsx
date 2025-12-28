"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Settings,
  Key,
  Database,
  Info,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Check,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/layout";
import { AI_MODELS } from "@/lib/config/models";

interface ApiKeyInfo {
  key: string;
  displayName: string;
  maskedValue: string | null;
  isConfigured: boolean;
}

interface ApiKeyConfig {
  key: string;
  displayName: string;
  description: string;
  link: string;
  linkText: string;
}

const API_KEY_CONFIGS: ApiKeyConfig[] = [
  {
    key: "ASSEMBLYAI_API_KEY",
    displayName: "AssemblyAI API",
    description:
      "Used for audio transcription with speaker diarization and automatic language detection.",
    link: "https://www.assemblyai.com/dashboard/signup",
    linkText: "assemblyai.com",
  },
  {
    key: "GEMINI_API_KEY",
    displayName: "Gemini API",
    description: "Used for AI-powered meeting analysis.",
    link: "https://aistudio.google.com/apikey",
    linkText: "aistudio.google.com",
  },
];

function ApiKeyCard({
  config,
  apiKeyInfo,
  onSave,
  onDelete,
}: {
  config: ApiKeyConfig;
  apiKeyInfo: ApiKeyInfo | undefined;
  onSave: (key: string, value: string) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showValue, setShowValue] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfigured = apiKeyInfo?.isConfigured ?? false;

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    setIsSaving(true);
    try {
      await onSave(config.key, inputValue.trim());
      setInputValue("");
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(config.key);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setInputValue("");
    setIsEditing(false);
    setShowValue(false);
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {config.displayName}
            </h4>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Check className="h-3 w-3" />
                Configured
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <X className="h-3 w-3" />
                Not configured
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {config.description} Get your API key at{" "}
            <a
              href={config.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
            >
              {config.linkText}
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>

      {isConfigured && !isEditing && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded border border-zinc-200 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800">
            {showValue ? apiKeyInfo?.maskedValue : "••••••••••••••••"}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowValue(!showValue)}
            className="h-9 w-9"
          >
            {showValue ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="h-9 w-9"
          >
            <Key className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {(isEditing || !isConfigured) && (
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="password"
            placeholder="Enter your API key..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 font-mono text-sm"
          />
          <Button
            variant="default"
            size="icon"
            onClick={handleSave}
            disabled={!inputValue.trim() || isSaving}
            className="h-9 w-9"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
          {isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleSave = async (key: string, value: string) => {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });

    if (response.ok) {
      await fetchApiKeys();
    }
  };

  const handleDelete = async (key: string) => {
    const response = await fetch("/api/settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });

    if (response.ok) {
      await fetchApiKeys();
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Manage your application settings and API configuration.
          </p>
        </div>

        {/* API Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-zinc-400" />
                <CardTitle className="text-lg">API Configuration</CardTitle>
              </div>
              <CardDescription>
                Configure your API keys for transcription and AI analysis
                services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : (
                API_KEY_CONFIGS.map((config) => (
                  <ApiKeyCard
                    key={config.key}
                    config={config}
                    apiKeyInfo={apiKeys.find((k) => k.key === config.key)}
                    onSave={handleSave}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Storage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-zinc-400" />
                <CardTitle className="text-lg">Storage</CardTitle>
              </div>
              <CardDescription>
                Audio files and transcripts are stored locally.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Upload Directory
                  </span>
                  <code className="rounded bg-zinc-200 px-2 py-1 text-xs dark:bg-zinc-800">
                    ./uploads
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-zinc-400" />
                <CardTitle className="text-lg">About</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Version
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    0.1.0
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Framework
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Next.js 16
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Transcription
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {AI_MODELS.transcription.displayName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    AI Analysis
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {AI_MODELS.gemini.displayName}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageContainer>
  );
}
