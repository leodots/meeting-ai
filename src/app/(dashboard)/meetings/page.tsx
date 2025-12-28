"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  Loader2,
  Mic,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  language: string;
  status: "PENDING" | "TRANSCRIBING" | "ANALYZING" | "COMPLETED" | "FAILED";
  duration: number | null;
  uploadedAt: string;
  processedAt: string | null;
  createdAt: string;
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  TRANSCRIBING: {
    label: "Transcribing",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  ANALYZING: {
    label: "Analyzing",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMeetings();
  }, []);

  async function fetchMeetings() {
    try {
      setLoading(true);
      const response = await fetch("/api/meetings");
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
  }

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
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Meetings
            </h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              View and manage all your meeting recordings.
            </p>
          </div>
          <Link href="/meetings/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Meeting
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search meetings..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
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
        )}

        {/* Meetings List */}
        {!loading && !error && filteredMeetings.length > 0 && (
          <div className="grid gap-4">
            {filteredMeetings.map((meeting, index) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/meetings/${meeting.id}`}>
                  <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <Mic className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                            {meeting.title}
                          </h3>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                              statusConfig[meeting.status].className
                            )}
                          >
                            {statusConfig[meeting.status].label}
                          </span>
                        </div>
                        {meeting.description && (
                          <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                            {meeting.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
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
