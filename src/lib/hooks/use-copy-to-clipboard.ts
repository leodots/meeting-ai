"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseCopyToClipboardOptions {
  successMessage?: string;
  errorMessage?: string;
  timeout?: number;
}

export function useCopyToClipboard(options: UseCopyToClipboardOptions = {}) {
  const {
    successMessage = "Copied to clipboard",
    errorMessage = "Failed to copy",
    timeout = 2000,
  } = options;

  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(successMessage);
        setTimeout(() => setCopied(false), timeout);
        return true;
      } catch {
        toast.error(errorMessage);
        return false;
      }
    },
    [successMessage, errorMessage, timeout]
  );

  return { copied, copy };
}
