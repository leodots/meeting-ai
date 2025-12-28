"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquare,
  Play,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

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
  uploadedAt: string;
  processedAt: string | null;
  transcript: Transcript | null;
  analysis: Analysis | null;
  speakers: Speaker[];
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

  useEffect(() => {
    fetchMeeting();
  }, [id]);

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
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete meeting");
      }
      router.push("/meetings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete meeting");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
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
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {meeting.title}
              </h1>
              {meeting.description && (
                <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                  {meeting.description}
                </p>
              )}
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
            </div>
          </div>
          <div className="flex gap-2">
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
            <Button
              variant="outline"
              onClick={deleteMeeting}
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
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-zinc-400" />
                    Summary
                  </CardTitle>
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Full Transcript</CardTitle>
                  {/* Speaker Legend */}
                  <div className="flex flex-wrap gap-3">
                    {meeting.speakers.map((speaker) => (
                      <div
                        key={speaker.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: speaker.color }}
                        />
                        <span className="text-zinc-600 dark:text-zinc-300">
                          {speaker.label || `Speaker ${speaker.speakerIndex + 1}`}
                        </span>
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
