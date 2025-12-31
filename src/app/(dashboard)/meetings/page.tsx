"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  Folder,
  Mic,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DynamicIcon } from "@/components/ui/icon-picker";
import { PageContainer } from "@/components/layout";
import { TagBadge } from "@/components/organization";
import { SkeletonMeetingList } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/format";
import { statusConfig } from "@/lib/config/status";
import { toast } from "sonner";
import { useDeferredLoading } from "@/lib/hooks/use-deferred-loading";

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

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  language: string;
  status: "PENDING" | "TRANSCRIBING" | "ANALYZING" | "COMPLETED" | "FAILED";
  duration: number | null;
  favorite: boolean;
  uploadedAt: string;
  processedAt: string | null;
  createdAt: string;
  projectId: string | null;
  project: Project | null;
  tags: { tag: Tag }[];
}

interface MeetingsResponse {
  meetings: Meeting[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function MeetingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDeferredLoading(loading);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const projectId = searchParams.get("project");
  const tagId = searchParams.get("tag");
  const showFavorites = searchParams.get("favorite") === "true";

  // Fetch active project info if filtered by project
  useEffect(() => {
    async function fetchProject() {
      if (!projectId) {
        setActiveProject(null);
        return;
      }
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const project = await response.json();
          setActiveProject(project);
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      }
    }
    fetchProject();
  }, [projectId]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setAllTags(data);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (projectId) params.set("project", projectId);
      if (tagId) params.set("tag", tagId);
      if (showFavorites) params.set("favorite", "true");

      const response = await fetch(`/api/meetings?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meetings");
      }
      const data: MeetingsResponse = await response.json();
      setMeetings(data.meetings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [projectId, tagId, showFavorites]);

  useEffect(() => {
    fetchMeetings();
    fetchTags();
  }, [fetchMeetings, fetchTags]);

  const clearFilters = () => {
    router.push("/meetings");
  };

  const filterByTag = (tagIdToFilter: string) => {
    const params = new URLSearchParams();
    if (projectId) params.set("project", projectId);
    params.set("tag", tagIdToFilter);
    router.push(`/meetings?${params.toString()}`);
  };

  const removeTagFilter = () => {
    const params = new URLSearchParams();
    if (projectId) params.set("project", projectId);
    if (showFavorites) params.set("favorite", "true");
    router.push(`/meetings?${params.toString()}`);
  };

  const toggleFavoritesFilter = () => {
    const params = new URLSearchParams();
    if (projectId) params.set("project", projectId);
    if (tagId) params.set("tag", tagId);
    if (!showFavorites) params.set("favorite", "true");
    router.push(`/meetings?${params.toString()}`);
  };

  const toggleFavorite = async (e: React.MouseEvent, meetingId: string, currentFavorite: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    // Helper to sort meetings: favorites first, then by date
    const sortMeetings = (meetings: Meeting[]) =>
      [...meetings].sort((a, b) => {
        if (a.favorite !== b.favorite) return b.favorite ? 1 : -1;
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      });

    // Optimistically update UI and reorder
    setMeetings((prev) =>
      sortMeetings(
        prev.map((m) =>
          m.id === meetingId ? { ...m, favorite: !currentFavorite } : m
        )
      )
    );

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !currentFavorite }),
      });

      if (!response.ok) {
        throw new Error("Failed to update favorite");
      }

      toast.success(currentFavorite ? "Removed from favorites" : "Added to favorites");
    } catch {
      // Revert on error and reorder back
      setMeetings((prev) =>
        sortMeetings(
          prev.map((m) =>
            m.id === meetingId ? { ...m, favorite: currentFavorite } : m
          )
        )
      );
      toast.error("Failed to update favorite");
    }
  };

  const filteredMeetings = meetings.filter(
    (meeting) =>
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                {activeProject ? activeProject.name : "Meetings"}
              </h1>
              {activeProject && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {activeProject.icon ? (
                    <DynamicIcon name={activeProject.icon} className="h-6 w-6" style={{ color: activeProject.color }} />
                  ) : (
                    <Folder className="h-6 w-6" style={{ color: activeProject.color }} />
                  )}
                </motion.div>
              )}
            </div>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              {activeProject
                ? `Meetings in this project`
                : "View and manage all your meeting recordings."}
            </p>
          </div>
          <Link href="/meetings/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Meeting
            </Button>
          </Link>
        </div>

        {/* Active Filters */}
        <AnimatePresence>
          {(projectId || tagId || showFavorites) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Filters:
                </span>
                {showFavorites && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={toggleFavoritesFilter}
                    className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300 bg-yellow-50 px-2.5 py-1 text-sm font-medium text-yellow-700 transition-colors hover:bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
                  >
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Favorites
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                )}
                {activeProject && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    {activeProject.icon ? (
                      <DynamicIcon name={activeProject.icon} className="h-3.5 w-3.5" style={{ color: activeProject.color }} />
                    ) : (
                      <Folder className="h-3.5 w-3.5" style={{ color: activeProject.color }} />
                    )}
                    {activeProject.name}
                    <X className="h-3.5 w-3.5 text-zinc-400" />
                  </motion.button>
                )}
                {tagId && allTags.find((t) => t.id === tagId) && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <TagBadge
                      name={allTags.find((t) => t.id === tagId)!.name}
                      color={allTags.find((t) => t.id === tagId)!.color}
                      size="md"
                      removable
                      onRemove={removeTagFilter}
                    />
                  </motion.div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 text-xs text-zinc-500"
                >
                  Clear all
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Tag Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search meetings..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant={showFavorites ? "default" : "outline"}
            size="sm"
            onClick={toggleFavoritesFilter}
            className={cn(
              "gap-1.5",
              showFavorites && "bg-yellow-500 text-white hover:bg-yellow-600"
            )}
          >
            <Star className={cn("h-4 w-4", showFavorites && "fill-current")} />
            Favorites
          </Button>
          {allTags.length > 0 && !tagId && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Tags:</span>
              {allTags.slice(0, 5).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => filterByTag(tag.id)}
                  className="rounded-full px-2 py-0.5 text-xs font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    border: `1px solid ${tag.color}40`,
                  }}
                >
                  {tag.name}
                </button>
              ))}
              {allTags.length > 5 && (
                <span className="text-xs text-zinc-400">+{allTags.length - 5} more</span>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {showSkeleton && <SkeletonMeetingList count={5} />}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: [0, -5, 5, -5, 0] }}
            transition={{
              opacity: { duration: 0.3 },
              x: { duration: 0.4, delay: 0.1 }
            }}
          >
            <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
              <CardContent className="py-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={fetchMeetings}
                >
                  Try again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Meetings Grid */}
        {!loading && !error && filteredMeetings.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMeetings.map((meeting, index) => (
              <motion.div
                key={meeting.id}
                layout
                layoutId={meeting.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.03,
                  layout: { type: "spring", stiffness: 350, damping: 30 }
                }}
              >
                <Link href={`/meetings/${meeting.id}`}>
                  <Card className="h-full transition-all hover:bg-zinc-50 hover:shadow-md dark:hover:bg-zinc-900">
                    <CardContent className="flex h-full flex-col p-4">
                      {/* Header: Icon + Status + Favorite */}
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            {meeting.project?.icon ? (
                              <DynamicIcon name={meeting.project.icon} className="h-5 w-5" style={{ color: meeting.project.color }} />
                            ) : meeting.project ? (
                              <Folder className="h-4 w-4" style={{ color: meeting.project.color }} />
                            ) : (
                              <Mic className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              statusConfig[meeting.status].className
                            )}
                          >
                            {statusConfig[meeting.status].label}
                          </span>
                        </div>
                        <button
                          onClick={(e) => toggleFavorite(e, meeting.id, meeting.favorite)}
                          className={cn(
                            "shrink-0 rounded-full p-1.5 transition-colors",
                            meeting.favorite
                              ? "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                              : "text-zinc-300 hover:bg-zinc-100 hover:text-yellow-500 dark:text-zinc-600 dark:hover:bg-zinc-800"
                          )}
                          title={meeting.favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className={cn("h-4 w-4", meeting.favorite && "fill-current")} />
                        </button>
                      </div>

                      {/* Title & Description */}
                      <div className="mb-3 flex-1">
                        <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-50">
                          {meeting.title}
                        </h3>
                        {meeting.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                            {meeting.description}
                          </p>
                        )}
                      </div>

                      {/* Tags */}
                      {meeting.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {meeting.tags.slice(0, 3).map(({ tag }) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {meeting.tags.length > 3 && (
                            <span className="text-[10px] text-zinc-400">
                              +{meeting.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer: Date & Duration */}
                      <div className="flex items-center gap-3 border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(meeting.uploadedAt).toLocaleDateString()}
                        </span>
                        {meeting.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(meeting.duration)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredMeetings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                  <Mic className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {searchQuery ? "No meetings found" : "No meetings yet"}
                </h3>
                <p className="mb-6 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                  {searchQuery
                    ? "Try a different search term."
                    : "Get started by uploading your first meeting recording. We support m4a, mp3, and wav audio files."}
                </p>
                {!searchQuery && (
                  <Link href="/meetings/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Meeting
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </PageContainer>
  );
}
