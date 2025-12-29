"use client";

import { motion } from "motion/react";
import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectBadgeProps {
  name: string;
  color: string;
  icon?: string | null;
  size?: "sm" | "md";
  className?: string;
}

export function ProjectBadge({
  name,
  color,
  icon,
  size = "sm",
  className,
}: ProjectBadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
      }}
    >
      {icon ? (
        <span className="text-sm">{icon}</span>
      ) : (
        <Folder className="h-3 w-3" style={{ color }} />
      )}
      {name}
    </motion.span>
  );
}
