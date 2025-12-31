"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import {
  Briefcase,
  Building2,
  Target,
  Flag,
  Bookmark,
  Star,
  MessageSquare,
  Users,
  Phone,
  Video,
  Mail,
  UserCircle,
  Calendar,
  Clock,
  Timer,
  CalendarCheck,
  History,
  Bell,
  CheckCircle,
  Zap,
  TrendingUp,
  Lightbulb,
  Rocket,
  Sparkles,
  Folder,
  FileText,
  Archive,
  Database,
  Layers,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  color?: string;
  className?: string;
}

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  Building2,
  Target,
  Flag,
  Bookmark,
  Star,
  MessageSquare,
  Users,
  Phone,
  Video,
  Mail,
  UserCircle,
  Calendar,
  Clock,
  Timer,
  CalendarCheck,
  History,
  Bell,
  CheckCircle,
  Zap,
  TrendingUp,
  Lightbulb,
  Rocket,
  Sparkles,
  Folder,
  FileText,
  Archive,
  Database,
  Layers,
  FolderOpen,
};

// Curated icons organized by category
const ICON_CATEGORIES = {
  Work: ["Briefcase", "Building2", "Target", "Flag", "Bookmark", "Star"],
  Communication: ["MessageSquare", "Users", "Phone", "Video", "Mail", "UserCircle"],
  Time: ["Calendar", "Clock", "Timer", "CalendarCheck", "History", "Bell"],
  Status: ["CheckCircle", "Zap", "TrendingUp", "Lightbulb", "Rocket", "Sparkles"],
  Files: ["Folder", "FileText", "Archive", "Database", "Layers", "FolderOpen"],
};

// Helper component to render icon by name
export function DynamicIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const IconComponent = ICON_MAP[name] || Folder;
  return <IconComponent className={className} style={style} />;
}

export function IconPicker({ value, onChange, color = "#3b82f6", className }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const SelectedIcon = value ? ICON_MAP[value] : null;

  return (
    <>
      <div className={cn("relative", className)}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          className={cn(
            "flex h-10 w-20 cursor-pointer items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white transition-colors dark:border-zinc-800 dark:bg-zinc-950",
            "hover:border-zinc-300 dark:hover:border-zinc-700"
          )}
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon className="h-5 w-5" style={{ color }} />
              <button
                type="button"
                onClick={handleClear}
                className="rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <span className="text-sm text-zinc-400">Pick</span>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Choose an Icon
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Preview */}
              {value && SelectedIcon && (
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <SelectedIcon className="h-6 w-6" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Selected Icon
                    </p>
                    <p className="text-xs text-zinc-500">{value}</p>
                  </div>
                </div>
              )}

              {/* Icon Grid */}
              <div className="max-h-[320px] space-y-4 overflow-auto">
                {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
                  <div key={category}>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      {category}
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {icons.map((iconName) => {
                        const IconComponent = ICON_MAP[iconName];
                        const isSelected = value === iconName;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => handleSelect(iconName)}
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-xl transition-all hover:scale-110",
                              isSelected
                                ? "ring-2 ring-offset-2 dark:ring-offset-zinc-950"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                            style={{
                              backgroundColor: isSelected ? `${color}15` : undefined,
                              // @ts-expect-error - CSS variable for Tailwind ring color
                              "--tw-ring-color": isSelected ? color : undefined,
                            }}
                            title={iconName}
                          >
                            <IconComponent
                              className="h-5 w-5"
                              style={{ color: isSelected ? color : undefined }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear button */}
              {value && (
                <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleSelect("")}
                    className="w-full rounded-xl py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    Remove Icon
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
