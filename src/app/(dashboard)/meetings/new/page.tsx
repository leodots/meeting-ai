"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  FileAudio,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  aiInstructions: z.string().max(1000, "Instructions are too long").optional(),
});

type FormData = z.infer<typeof formSchema>;

const acceptedFormats = {
  "audio/mpeg": [".mp3"],
  "audio/mp4": [".m4a"],
  "audio/x-m4a": [".m4a"],
  "audio/wav": [".wav"],
  "audio/wave": [".wav"],
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function NewMeetingPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      aiInstructions: "",
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection.errors[0]?.code === "file-too-large") {
        setUploadError("File is too large. Maximum size is 100MB.");
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        setUploadError("Invalid file type. Please upload an m4a, mp3, or wav file.");
      } else {
        setUploadError("Failed to upload file. Please try again.");
      }
    },
  });

  const removeFile = () => {
    setFile(null);
    setUploadError(null);
  };

  const [uploadStage, setUploadStage] = useState<"idle" | "uploading" | "processing">("idle");

  const onSubmit = async (data: FormData) => {
    if (!file) {
      setUploadError("Please select an audio file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadStage("uploading");
    setUploadError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", data.title);
      if (data.description) {
        formData.append("description", data.description);
      }
      if (data.aiInstructions) {
        formData.append("aiInstructions", data.aiInstructions);
      }

      // Upload file
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const result = await response.json();

      // Start processing automatically
      setUploadStage("processing");
      const processResponse = await fetch(`/api/process/${result.id}`, {
        method: "POST",
      });

      if (!processResponse.ok) {
        console.warn("Failed to start processing automatically");
      }

      // Redirect to the meeting page
      router.push(`/meetings/${result.id}`);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "An error occurred"
      );
      setUploadStage("idle");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/meetings">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Upload Recording
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Upload a meeting recording to transcribe and analyze.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audio File</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div
                    key="dropzone"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div
                      {...getRootProps()}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors duration-200",
                        isDragActive
                          ? "border-zinc-400 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-900"
                          : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="mb-4 rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
                        <Upload className="h-6 w-6 text-zinc-400" />
                      </div>
                      <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {isDragActive
                          ? "Drop the file here"
                          : "Drag & drop your audio file here"}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        or click to browse (m4a, mp3, wav up to 100MB)
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="file-preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800">
                      <FileAudio className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {file.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {uploadError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-red-500"
                >
                  {uploadError}
                </motion.p>
              )}
            </CardContent>
          </Card>

          {/* Meeting Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Weekly Team Sync"
                  {...register("title")}
                  disabled={isUploading}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the meeting..."
                  {...register("description")}
                  disabled={isUploading}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiInstructions" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-zinc-400" />
                  AI Instructions (optional)
                </Label>
                <Textarea
                  id="aiInstructions"
                  placeholder="e.g., Divide the summary by technology discussed, focus on action items for the development team, highlight any deadlines mentioned..."
                  {...register("aiInstructions")}
                  disabled={isUploading}
                  rows={3}
                />
                {errors.aiInstructions && (
                  <p className="text-sm text-red-500">
                    {errors.aiInstructions.message}
                  </p>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Provide custom instructions for the AI analysis. These will guide how the summary and topics are generated.
                </p>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Language will be detected automatically during transcription.
              </p>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/meetings">
              <Button type="button" variant="outline" disabled={isUploading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadStage === "processing" ? "Starting processing..." : "Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
