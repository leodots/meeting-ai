"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Edit2,
  Folder,
  Loader2,
  Mic,
  MoreHorizontal,
  Plus,
  Tag as TagIcon,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker, DynamicIcon } from "@/components/ui/icon-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { refreshProjects } from "@/lib/hooks/use-projects";
import { refreshTags } from "@/lib/hooks/use-tags";

interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  _count?: { meetings: number };
}

interface Tag {
  id: string;
  name: string;
  color: string;
  _count?: { meetings: number };
}

const COLORS = [
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

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "h-6 w-6 rounded-full transition-all hover:scale-110",
            value === color && "ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-950"
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
  onClick,
  isMenuOpen,
  onMenuToggle,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onClick: (project: Project) => void;
  isMenuOpen: boolean;
  onMenuToggle: (id: string | null) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const meetingCount = project._count?.meetings || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick(project)}
      className="group relative flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Color accent bar */}
      <motion.div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: project.color }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: isHovered ? 1 : 0.3 }}
        transition={{ duration: 0.2 }}
      />

      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${project.color}15` }}
      >
        {project.icon ? (
          <DynamicIcon name={project.icon} className="h-6 w-6" style={{ color: project.color }} />
        ) : (
          <Folder className="h-6 w-6" style={{ color: project.color }} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
          {project.name}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Mic className="h-3 w-3" />
          <span>{meetingCount} {meetingCount === 1 ? 'meeting' : 'meetings'}</span>
        </div>
      </div>

      {/* Arrow indicator - hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -5 }}
        className="mr-8 hidden text-zinc-400 sm:block"
      >
        <ArrowRight className="h-4 w-4" />
      </motion.div>

      {/* Menu button - always visible on mobile, hover on desktop */}
      <div
        className="relative"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMenuToggle(isMenuOpen ? null : `project-${project.id}`);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMenuToggle(null);
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="absolute bottom-full right-0 z-50 mb-1 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMenuToggle(null);
                    onEdit(project);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMenuToggle(null);
                    onDelete(project);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function TagCard({
  tag,
  onEdit,
  onDelete,
  onClick,
  isMenuOpen,
  onMenuToggle,
}: {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
  onClick: (tag: Tag) => void;
  isMenuOpen: boolean;
  onMenuToggle: (id: string | null) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const meetingCount = tag._count?.meetings || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick(tag)}
      className="group relative flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Colored dot with pulse effect when menu is open */}
      <motion.div
        className="relative shrink-0"
        animate={{ scale: isMenuOpen ? 1.2 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <span
          className="block h-4 w-4 rounded-full"
          style={{ backgroundColor: tag.color }}
        />
        {isMenuOpen && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: tag.color }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6, repeat: 2 }}
          />
        )}
      </motion.div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
          {tag.name}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {meetingCount} {meetingCount === 1 ? 'meeting' : 'meetings'}
        </p>
      </div>

      {/* Arrow indicator - hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -5 }}
        className="mr-6 hidden text-zinc-400 sm:block"
      >
        <ArrowRight className="h-4 w-4" />
      </motion.div>

      {/* Menu button - always visible on mobile, hover on desktop */}
      <div
        className="relative"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMenuToggle(isMenuOpen ? null : `tag-${tag.id}`);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMenuToggle(null);
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="absolute bottom-full right-0 z-50 mb-1 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMenuToggle(null);
                    onEdit(tag);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMenuToggle(null);
                    onDelete(tag);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function OrganizePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  // Global menu state - only one menu open at a time
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState(COLORS[5]);
  const [projectIcon, setProjectIcon] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(COLORS[5]);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation dialogs
  const [deleteProjectDialog, setDeleteProjectDialog] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });
  const [deleteTagDialog, setDeleteTagDialog] = useState<{ open: boolean; tag: Tag | null }>({ open: false, tag: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTags();
  }, []);

  const handleProjectClick = (project: Project) => {
    router.push(`/meetings?project=${project.id}`);
  };

  const handleTagClick = (tag: Tag) => {
    router.push(`/meetings?tag=${tag.id}`);
  };

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  }

  async function fetchTags() {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    } finally {
      setIsLoadingTags(false);
    }
  }

  const resetProjectForm = () => {
    setProjectName("");
    setProjectColor(COLORS[5]);
    setProjectIcon("");
    setEditingProject(null);
    setShowProjectForm(false);
  };

  const resetTagForm = () => {
    setTagName("");
    setTagColor(COLORS[5]);
    setEditingTag(null);
    setShowTagForm(false);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectColor(project.color);
    setProjectIcon(project.icon || "");
    setShowProjectForm(true);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setShowTagForm(true);
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) return;
    setIsSaving(true);

    try {
      const url = editingProject
        ? `/api/projects/${editingProject.id}`
        : "/api/projects";
      const method = editingProject ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          color: projectColor,
          icon: projectIcon || null,
        }),
      });

      if (response.ok) {
        await fetchProjects();
        await refreshProjects(); // Invalidate SWR cache to update sidebar
        resetProjectForm();
        toast.success(editingProject ? "Project updated" : "Project created");
      } else {
        toast.error("Failed to save project");
      }
    } catch (error) {
      console.error("Failed to save project:", error);
      toast.error("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTag = async () => {
    if (!tagName.trim()) return;
    setIsSaving(true);

    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : "/api/tags";
      const method = editingTag ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tagName.trim(),
          color: tagColor,
        }),
      });

      if (response.ok) {
        await fetchTags();
        await refreshTags(); // Invalidate SWR cache
        resetTagForm();
        toast.success(editingTag ? "Tag updated" : "Tag created");
      } else {
        toast.error("Failed to save tag");
      }
    } catch (error) {
      console.error("Failed to save tag:", error);
      toast.error("Failed to save tag");
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteProjectDialog = (project: Project) => {
    setDeleteProjectDialog({ open: true, project });
  };

  const openDeleteTagDialog = (tag: Tag) => {
    setDeleteTagDialog({ open: true, tag });
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectDialog.project) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${deleteProjectDialog.project.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteProjectDialog.project!.id));
        await refreshProjects(); // Invalidate SWR cache to update sidebar
        toast.success("Project deleted");
        setDeleteProjectDialog({ open: false, project: null });
      } else {
        toast.error("Failed to delete project");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!deleteTagDialog.tag) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tags/${deleteTagDialog.tag.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTags((prev) => prev.filter((t) => t.id !== deleteTagDialog.tag!.id));
        await refreshTags(); // Invalidate SWR cache
        toast.success("Tag deleted");
        setDeleteTagDialog({ open: false, tag: null });
      } else {
        toast.error("Failed to delete tag");
      }
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast.error("Failed to delete tag");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Projects & Tags
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Organize your meetings with projects and tags.
          </p>
        </div>

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-zinc-400" />
                  <CardTitle className="text-lg">Projects</CardTitle>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    resetProjectForm();
                    setShowProjectForm(true);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  New Project
                </Button>
              </div>
              <CardDescription>
                Group related meetings together in projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="popLayout">
                {showProjectForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {editingProject ? "Edit Project" : "New Project"}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={resetProjectForm}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="Project name..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon (optional)</Label>
                        <IconPicker
                          value={projectIcon}
                          onChange={setProjectIcon}
                          color={projectColor}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <ColorPicker
                          value={projectColor}
                          onChange={setProjectColor}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={resetProjectForm}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProject}
                          disabled={!projectName.trim() || isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {editingProject ? "Save Changes" : "Create Project"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoadingProjects ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : projects.length === 0 ? (
                <div className="py-8 text-center">
                  <Folder className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-700" />
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    No projects yet. Create one to get started.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onEdit={handleEditProject}
                        onDelete={openDeleteProjectDialog}
                        onClick={handleProjectClick}
                        isMenuOpen={openMenuId === `project-${project.id}`}
                        onMenuToggle={setOpenMenuId}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tags Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-5 w-5 text-zinc-400" />
                  <CardTitle className="text-lg">Tags</CardTitle>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    resetTagForm();
                    setShowTagForm(true);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  New Tag
                </Button>
              </div>
              <CardDescription>
                Add labels to meetings for easy filtering and search.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="popLayout">
                {showTagForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {editingTag ? "Edit Tag" : "New Tag"}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={resetTagForm}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={tagName}
                          onChange={(e) => setTagName(e.target.value)}
                          placeholder="Tag name..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <ColorPicker value={tagColor} onChange={setTagColor} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={resetTagForm}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveTag}
                          disabled={!tagName.trim() || isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {editingTag ? "Save Changes" : "Create Tag"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoadingTags ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : tags.length === 0 ? (
                <div className="py-8 text-center">
                  <TagIcon className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-700" />
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    No tags yet. Create one to get started.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {tags.map((tag) => (
                      <TagCard
                        key={tag.id}
                        tag={tag}
                        onEdit={handleEditTag}
                        onDelete={openDeleteTagDialog}
                        onClick={handleTagClick}
                        isMenuOpen={openMenuId === `tag-${tag.id}`}
                        onMenuToggle={setOpenMenuId}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Project Dialog */}
      <AlertDialog
        open={deleteProjectDialog.open}
        onOpenChange={(open) => setDeleteProjectDialog({ open, project: open ? deleteProjectDialog.project : null })}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteProjectDialog.project?.name}"? Meetings in this project will not be deleted, but will no longer be associated with this project.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteProject}
        isLoading={isDeleting}
      />

      {/* Delete Tag Dialog */}
      <AlertDialog
        open={deleteTagDialog.open}
        onOpenChange={(open) => setDeleteTagDialog({ open, tag: open ? deleteTagDialog.tag : null })}
        title="Delete Tag"
        description={`Are you sure you want to delete "${deleteTagDialog.tag?.name}"? This tag will be removed from all meetings.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteTag}
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
