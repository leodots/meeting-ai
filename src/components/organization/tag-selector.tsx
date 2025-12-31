"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Plus, Tag as TagIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TagBadge } from "./tag-badge";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onCreateTag?: (name: string) => Promise<Tag | null>;
  placeholder?: string;
  className?: string;
}

const TAG_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#71717a", // gray
];

export function TagSelector({
  availableTags,
  selectedTags,
  onTagsChange,
  onCreateTag,
  placeholder = "Add tags...",
  className,
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedTags.some((t) => t.id === tag.id)
  );

  const canCreateNew =
    search.trim() &&
    !availableTags.some(
      (t) => t.name.toLowerCase() === search.toLowerCase()
    ) &&
    onCreateTag;

  const handleSelect = (tag: Tag) => {
    onTagsChange([...selectedTags, tag]);
    setSearch("");
    inputRef.current?.focus();
  };

  const handleRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleCreate = async () => {
    if (!onCreateTag || !search.trim()) return;
    setIsCreating(true);
    try {
      const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      const newTag = await onCreateTag(search.trim());
      if (newTag) {
        handleSelect(newTag);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canCreateNew) {
        handleCreate();
      }
    } else if (e.key === "Backspace" && !search && selectedTags.length > 0) {
      handleRemove(selectedTags[selectedTags.length - 1].id);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearch("");
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={cn(
          "flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 transition-colors dark:border-zinc-800 dark:bg-zinc-950",
          isOpen && "ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-950"
        )}
      >
        <TagIcon className="h-4 w-4 shrink-0 text-zinc-400" />

        <AnimatePresence mode="popLayout">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              color={tag.color}
              removable
              onRemove={() => handleRemove(tag.id)}
            />
          ))}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          className="min-w-[100px] flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
        />
      </div>

      <AnimatePresence>
        {isOpen && (filteredTags.length > 0 || canCreateNew) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[200px] overflow-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            {filteredTags.map((tag) => (
              <button
                type="button"
                key={tag.id}
                onClick={() => handleSelect(tag)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 text-zinc-700 dark:text-zinc-300">
                  {tag.name}
                </span>
              </button>
            ))}

            {canCreateNew && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                <Plus className="h-3 w-3" />
                <span>
                  Create &quot;{search}&quot;
                </span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
