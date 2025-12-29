"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Download,
  Edit2,
  FileText,
  Folder,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquare,
  Pencil,
  Play,
  Printer,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/layout";
import { ProjectSelector, TagSelector } from "@/components/organization";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { SkeletonMeetingDetail } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Speaker {
  id: string;
  speakerIndex: number;
  label: string | null;
  color: string;
}

interface Utterance {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  speaker: Speaker;
}

interface Transcript {
  fullText: string;
  utterances: Utterance[];
}

interface Topic {
  title: string;
  description: string;
  importance: number;
}

interface KeyPoint {
  point: string;
  context?: string;
}

interface ActionItem {
  item: string;
  assignee?: string;
  priority?: string;
}

interface Analysis {
  summary: string;
  topics: Topic[];
  keyPoints: KeyPoint[];
  actionItems: ActionItem[];
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  language: string;
  status: string;
  duration: number | null;
  favorite: boolean;
  uploadedAt: string;
  processedAt: string | null;
  transcript: Transcript | null;
  analysis: Analysis | null;
  speakers: Speaker[];
  project: Project | null;
  tags: { tag: Tag }[];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "transcript">(
    "overview"
  );
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Organization editing state
  const [isEditingOrganization, setIsEditingOrganization] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [savingOrganization, setSavingOrganization] = useState(false);

  // Title/Description editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  // Speaker editing state
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [editingSpeakerLabel, setEditingSpeakerLabel] = useState("");
  const [savingSpeaker, setSavingSpeaker] = useState(false);

  useEffect(() => {
    fetchMeeting();
    fetchProjectsAndTags();
  }, [id]);

  // Sync selected project/tags when meeting loads
  useEffect(() => {
    if (meeting) {
      setSelectedProject(meeting.project);
      setSelectedTags(meeting.tags.map((t) => t.tag));
    }
  }, [meeting]);

  async function fetchProjectsAndTags() {
    try {
      const [projectsRes, tagsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tags"),
      ]);
      if (projectsRes.ok) {
        setAllProjects(await projectsRes.json());
      }
      if (tagsRes.ok) {
        setAllTags(await tagsRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch projects/tags:", err);
    }
  }

  async function handleCreateProject(name: string): Promise<Project | null> {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        const newProject = await response.json();
        setAllProjects((prev) => [...prev, newProject]);
        return newProject;
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    }
    return null;
  }

  async function handleCreateTag(name: string): Promise<Tag | null> {
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        const newTag = await response.json();
        setAllTags((prev) => [...prev, newTag]);
        return newTag;
      }
    } catch (err) {
      console.error("Failed to create tag:", err);
    }
    return null;
  }

  async function saveOrganization() {
    if (!meeting) return;
    setSavingOrganization(true);
    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject?.id || null,
          tagIds: selectedTags.map((t) => t.id),
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setMeeting((prev) => prev ? { ...prev, project: updated.project, tags: updated.tags } : null);
        setIsEditingOrganization(false);
        toast.success("Organization updated");
      } else {
        toast.error("Failed to update organization");
      }
    } catch (err) {
      console.error("Failed to save organization:", err);
      toast.error("Failed to update organization");
    } finally {
      setSavingOrganization(false);
    }
  }

  function cancelEditOrganization() {
    if (meeting) {
      setSelectedProject(meeting.project);
      setSelectedTags(meeting.tags.map((t) => t.tag));
    }
    setIsEditingOrganization(false);
  }

  // Toggle favorite
  async function toggleFavorite() {
    if (!meeting) return;
    const newFavorite = !meeting.favorite;

    // Optimistic update
    setMeeting((prev) => prev ? { ...prev, favorite: newFavorite } : null);

    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: newFavorite }),
      });
      if (!response.ok) throw new Error("Failed to update");
      toast.success(newFavorite ? "Added to favorites" : "Removed from favorites");
    } catch {
      // Revert on error
      setMeeting((prev) => prev ? { ...prev, favorite: !newFavorite } : null);
      toast.error("Failed to update favorite");
    }
  }

  // Start editing title/description
  function startEditingTitle() {
    if (meeting) {
      setEditTitle(meeting.title);
      setEditDescription(meeting.description || "");
      setIsEditingTitle(true);
    }
  }

  // Save title/description
  async function saveTitle() {
    if (!meeting || !editTitle.trim()) return;
    setSavingTitle(true);
    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        }),
      });
      if (response.ok) {
        setMeeting((prev) => prev ? { ...prev, title: editTitle.trim(), description: editDescription.trim() || null } : null);
        setIsEditingTitle(false);
        toast.success("Meeting updated");
      } else {
        toast.error("Failed to update meeting");
      }
    } catch {
      toast.error("Failed to update meeting");
    } finally {
      setSavingTitle(false);
    }
  }

  function cancelEditTitle() {
    setIsEditingTitle(false);
    setEditTitle("");
    setEditDescription("");
  }

  // Start editing speaker label
  function startEditingSpeaker(speaker: Speaker) {
    setEditingSpeakerId(speaker.id);
    setEditingSpeakerLabel(speaker.label || "");
  }

  // Save speaker label
  async function saveSpeakerLabel() {
    if (!editingSpeakerId) return;
    setSavingSpeaker(true);
    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speakers: [{ id: editingSpeakerId, label: editingSpeakerLabel.trim() || null }],
        }),
      });
      if (response.ok) {
        const newLabel = editingSpeakerLabel.trim() || null;
        setMeeting((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            speakers: prev.speakers.map((s) =>
              s.id === editingSpeakerId ? { ...s, label: newLabel } : s
            ),
            // Also update speaker labels in transcript utterances
            transcript: prev.transcript ? {
              ...prev.transcript,
              utterances: prev.transcript.utterances.map((u) =>
                u.speaker.id === editingSpeakerId
                  ? { ...u, speaker: { ...u.speaker, label: newLabel } }
                  : u
              ),
            } : null,
          };
        });
        toast.success("Speaker renamed");
        setEditingSpeakerId(null);
        setEditingSpeakerLabel("");
      } else {
        toast.error("Failed to rename speaker");
      }
    } catch {
      toast.error("Failed to rename speaker");
    } finally {
      setSavingSpeaker(false);
    }
  }

  function cancelEditSpeaker() {
    setEditingSpeakerId(null);
    setEditingSpeakerLabel("");
  }

  // Poll for updates while processing
  useEffect(() => {
    if (
      meeting?.status === "TRANSCRIBING" ||
      meeting?.status === "ANALYZING"
    ) {
      const interval = setInterval(fetchMeeting, 3000);
      return () => clearInterval(interval);
    }
  }, [meeting?.status]);

  async function fetchMeeting() {
    try {
      const response = await fetch(`/api/meetings/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meeting");
      }
      const data = await response.json();
      setMeeting(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function startProcessing() {
    setProcessing(true);
    try {
      const response = await fetch(`/api/process/${id}`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to start processing");
      }
      fetchMeeting();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start processing");
    } finally {
      setProcessing(false);
    }
  }

  async function deleteMeeting() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete meeting");
      }
      toast.success("Meeting deleted");
      router.push("/meetings");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete meeting");
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  async function exportMarkdown() {
    try {
      const response = await fetch(`/api/meetings/${id}/export?format=md`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meeting?.title || "meeting"}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Markdown exported");
    } catch (err) {
      toast.error("Failed to export markdown");
    }
  }

  async function exportHTML() {
    try {
      const response = await fetch(`/api/meetings/${id}/export?format=html`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meeting?.title || "meeting"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("HTML exported");
    } catch (err) {
      toast.error("Failed to export HTML");
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <SkeletonMeetingDetail />
      </PageContainer>
    );
  }

  if (error || !meeting) {
    return (
      <PageContainer>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-red-500">{error || "Meeting not found"}</p>
          <Link href="/meetings">
            <Button variant="outline">Back to Meetings</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const isProcessing =
    meeting.status === "TRANSCRIBING" || meeting.status === "ANALYZING";
  const isCompleted = meeting.status === "COMPLETED";
  const isPending = meeting.status === "PENDING" || meeting.status === "FAILED";

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Link href="/meetings">
              <Button variant="ghost" size="icon" className="shrink-0 mt-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {isEditingTitle ? (
                  <motion.div
                    key="editing-title"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Meeting title"
                      className="text-lg font-semibold"
                      autoFocus
                    />
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveTitle} disabled={savingTitle || !editTitle.trim()}>
                        {savingTitle ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditTitle} disabled={savingTitle}>
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="display-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {meeting.title}
                      </h1>
                      <button
                        onClick={toggleFavorite}
                        className={cn(
                          "rounded-full p-1.5 transition-colors",
                          meeting.favorite
                            ? "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                            : "text-zinc-300 hover:bg-zinc-100 hover:text-yellow-500 dark:text-zinc-600 dark:hover:bg-zinc-800"
                        )}
                        title={meeting.favorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className={cn("h-5 w-5", meeting.favorite && "fill-current")} />
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        onClick={startEditingTitle}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    {meeting.description && (
                      <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                        {meeting.description}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(meeting.uploadedAt).toLocaleDateString()}
                </span>
                {meeting.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(meeting.duration)}
                  </span>
                )}
                {meeting.speakers.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {meeting.speakers.length} speakers
                  </span>
                )}
              </div>

              {/* Organization - Project & Tags */}
              <AnimatePresence mode="wait">
                {isEditingOrganization ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Edit Organization
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditOrganization}
                          disabled={savingOrganization}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveOrganization}
                          disabled={savingOrganization}
                        >
                          {savingOrganization ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-1 h-4 w-4" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Project
                        </label>
                        <ProjectSelector
                          projects={allProjects}
                          selectedProject={selectedProject}
                          onProjectChange={setSelectedProject}
                          onCreateProject={handleCreateProject}
                          placeholder="Select project..."
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Tags
                        </label>
                        <TagSelector
                          availableTags={allTags}
                          selectedTags={selectedTags}
                          onTagsChange={setSelectedTags}
                          onCreateTag={handleCreateTag}
                          placeholder="Add tags..."
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex flex-wrap items-center gap-2"
                  >
                    {/* Project badge */}
                    {meeting.project ? (
                      <Link href={`/meetings?project=${meeting.project.id}`}>
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          {meeting.project.icon ? (
                            <span>{meeting.project.icon}</span>
                          ) : (
                            <Folder className="h-3.5 w-3.5" style={{ color: meeting.project.color }} />
                          )}
                          {meeting.project.name}
                        </motion.span>
                      </Link>
                    ) : null}

                    {/* Tag badges */}
                    {meeting.tags.map(({ tag }) => (
                      <Link key={tag.id} href={`/meetings?tag=${tag.id}`}>
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: `${tag.color}15`,
                            color: tag.color,
                            border: `1px solid ${tag.color}30`,
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </motion.span>
                      </Link>
                    ))}

                    {/* Edit button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingOrganization(true)}
                      className="h-7 px-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span className="ml-1 text-xs">
                        {meeting.project || meeting.tags.length > 0 ? "Edit" : "Add project/tags"}
                      </span>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isPending && (
              <Button onClick={startProcessing} disabled={processing}>
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {meeting.status === "FAILED" ? "Retry" : "Process"}
              </Button>
            )}
            {isCompleted && (
              <>
                <Button variant="outline" onClick={exportMarkdown}>
                  <Download className="mr-2 h-4 w-4" />
                  Markdown
                </Button>
                <Button variant="outline" onClick={exportHTML}>
                  <Printer className="mr-2 h-4 w-4" />
                  HTML
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
              className="text-red-500 hover:text-red-600"
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Meeting"
          description={`Are you sure you want to delete "${meeting.title}"? This action cannot be undone and will permanently remove the meeting, transcript, and analysis.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={deleteMeeting}
          isLoading={deleting}
        />

        {/* Processing Status */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
              <CardContent className="flex items-center gap-4 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                <div>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    {meeting.status === "TRANSCRIBING"
                      ? "Transcribing audio..."
                      : "Analyzing meeting..."}
                  </p>
                  <p className="text-sm text-zinc-500">
                    This may take a few minutes depending on the audio length.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Failed Status */}
        {meeting.status === "FAILED" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
              <CardContent className="py-4">
                <p className="font-medium text-red-700 dark:text-red-300">
                  Processing failed
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Click &quot;Retry&quot; to try again. Make sure your API keys
                  are configured correctly.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        {isCompleted && (
          <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "overview"
                  ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              )}
            >
              <FileText className="mr-2 inline h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "transcript"
                  ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              )}
            >
              <MessageSquare className="mr-2 inline h-4 w-4" />
              Transcript
            </button>
          </div>
        )}

        {/* Content */}
        {isCompleted && activeTab === "overview" && meeting.analysis && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-zinc-400" />
                      Summary
                    </CardTitle>
                    <CopyButton
                      text={meeting.analysis.summary}
                      label="Copy"
                      successMessage="Summary copied"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
                    {meeting.analysis.summary}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Topics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5 text-zinc-400" />
                    Topics Discussed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {meeting.analysis.topics.map((topic, i) => (
                      <li key={i} className="border-l-2 border-zinc-200 pl-3 dark:border-zinc-700">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {topic.title}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {topic.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListChecks className="h-5 w-5 text-zinc-400" />
                    Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {meeting.analysis.actionItems.length > 0 ? (
                    <ul className="space-y-3">
                      {meeting.analysis.actionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                              item.priority === "high"
                                ? "bg-red-500"
                                : item.priority === "low"
                                ? "bg-green-500"
                                : "bg-yellow-500"
                            )}
                          />
                          <div>
                            <p className="text-zinc-900 dark:text-zinc-100">
                              {item.item}
                            </p>
                            {item.assignee && (
                              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Assigned to: {item.assignee}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-500 dark:text-zinc-400">
                      No action items identified.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Transcript Tab */}
        {isCompleted && activeTab === "transcript" && meeting.transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">Full Transcript</CardTitle>
                    <CopyButton
                      text={meeting.transcript.fullText}
                      label="Copy"
                      successMessage="Transcript copied"
                    />
                  </div>
                  {/* Speaker Legend with Rename */}
                  <div className="flex flex-wrap gap-3">
                    {meeting.speakers.map((speaker) => (
                      <div key={speaker.id} className="flex items-center gap-2 text-sm">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: speaker.color }}
                        />
                        {editingSpeakerId === speaker.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editingSpeakerLabel}
                              onChange={(e) => setEditingSpeakerLabel(e.target.value)}
                              placeholder={`Speaker ${speaker.speakerIndex + 1}`}
                              className="h-7 w-32 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveSpeakerLabel();
                                if (e.key === "Escape") cancelEditSpeaker();
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={saveSpeakerLabel}
                              disabled={savingSpeaker}
                            >
                              {savingSpeaker ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={cancelEditSpeaker}
                              disabled={savingSpeaker}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditingSpeaker(speaker)}
                            className="group flex items-center gap-1 rounded px-1 py-0.5 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            title="Click to rename"
                          >
                            {speaker.label || `Speaker ${speaker.speakerIndex + 1}`}
                            <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {meeting.transcript.utterances.map((utterance, i) => (
                    <div
                      key={utterance.id}
                      className="flex gap-4 rounded-lg p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <div className="flex shrink-0 flex-col items-center gap-1">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: utterance.speaker.color }}
                        >
                          {utterance.speaker.speakerIndex + 1}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {formatTimestamp(utterance.startTime)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {utterance.speaker.label ||
                            `Speaker ${utterance.speaker.speakerIndex + 1}`}
                        </p>
                        <p className="text-zinc-700 dark:text-zinc-300">
                          {utterance.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pending State */}
        {isPending && !isProcessing && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                <Play className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Ready to process
              </h3>
              <p className="mb-6 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                Click the button above to start transcribing and analyzing this
                meeting recording.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
