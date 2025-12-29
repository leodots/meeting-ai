"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  color: string;
  size?: "sm" | "md";
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function TagBadge({
  name,
  color,
  size = "sm",
  removable = false,
  onRemove,
  className,
}: TagBadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}40`,
        borderWidth: "1px",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.span>
  );
}
