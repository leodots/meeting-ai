"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check, Copy } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  successMessage?: string;
}

export function CopyButton({
  text,
  label,
  className,
  variant = "outline",
  size = "sm",
  successMessage = "Copied to clipboard",
}: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard({ successMessage });

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => copy(text)}
      className={cn("relative", className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-1.5 text-green-600 dark:text-green-400"
          >
            <Check className="h-4 w-4" />
            {label && <span>Copied!</span>}
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-1.5"
          >
            <Copy className="h-4 w-4" />
            {label && <span>{label}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
