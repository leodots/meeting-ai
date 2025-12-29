"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Folder, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectChange: (project: Project | null) => void;
  onCreateProject?: (name: string) => Promise<Project | null>;
  placeholder?: string;
  className?: string;
}

const PROJECT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export function ProjectSelector({
  projects,
  selectedProject,
  onProjectChange,
  onCreateProject,
  placeholder = "Select project...",
  className,
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  const canCreateNew =
    search.trim() &&
    !projects.some((p) => p.name.toLowerCase() === search.toLowerCase()) &&
    onCreateProject;

  const handleSelect = (project: Project | null) => {
    onProjectChange(project);
    setIsOpen(false);
    setSearch("");
  };

  const handleCreate = async () => {
    if (!onCreateProject || !search.trim()) return;
    setIsCreating(true);
    try {
      const newProject = await onCreateProject(search.trim());
      if (newProject) {
        handleSelect(newProject);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        className={cn(
          "flex h-[42px] w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-left transition-colors dark:border-zinc-800 dark:bg-zinc-950",
          isOpen && "ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-950"
        )}
      >
        {selectedProject ? (
          <>
            {selectedProject.icon ? (
              <span className="text-base">{selectedProject.icon}</span>
            ) : (
              <Folder
                className="h-4 w-4"
                style={{ color: selectedProject.color }}
              />
            )}
            <span className="flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100">
              {selectedProject.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <Folder className="h-4 w-4 text-zinc-400" />
            <span className="flex-1 text-sm text-zinc-400">{placeholder}</span>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="border-b border-zinc-100 p-2 dark:border-zinc-800">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search or create..."
                className="w-full bg-transparent px-2 py-1 text-sm outline-none placeholder:text-zinc-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (canCreateNew) {
                      handleCreate();
                    }
                  }
                }}
              />
            </div>

            <div className="max-h-[200px] overflow-auto p-1">
              {selectedProject && (
                <button
                  onClick={() => handleSelect(null)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <X className="h-4 w-4" />
                  <span>No project</span>
                </button>
              )}

              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  {project.icon ? (
                    <span className="text-base">{project.icon}</span>
                  ) : (
                    <Folder className="h-4 w-4" style={{ color: project.color }} />
                  )}
                  <span className="flex-1 text-zinc-700 dark:text-zinc-300">
                    {project.name}
                  </span>
                  {selectedProject?.id === project.id && (
                    <Check className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                  )}
                </button>
              ))}

              {canCreateNew && (
                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create &quot;{search}&quot;</span>
                </button>
              )}

              {filteredProjects.length === 0 && !canCreateNew && !selectedProject && (
                <p className="px-2 py-4 text-center text-sm text-zinc-400">
                  No projects yet
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
