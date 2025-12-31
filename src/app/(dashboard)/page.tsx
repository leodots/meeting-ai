"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Calendar,
  Clock,
  Mic,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import { SkeletonCard } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/format";
import { statusConfig } from "@/lib/config/status";
import { useDeferredLoading } from "@/lib/hooks/use-deferred-loading";

interface Stats {
  totalMeetings: number;
  totalHours: number;
  totalActionItems: number;
}

interface RecentMeeting {
  id: string;
  title: string;
  status: string;
  duration: number | null;
  uploadedAt: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDeferredLoading(loading);
  const [stats, setStats] = useState<Stats>({
    totalMeetings: 0,
    totalHours: 0,
    totalActionItems: 0,
  });
  const [recentMeetings, setRecentMeetings] = useState<RecentMeeting[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentMeetings(data.recentMeetings);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: "Total Meetings",
      value: loading ? "-" : stats.totalMeetings.toString(),
      icon: Mic,
      description: "Meetings processed",
    },
    {
      title: "Hours Analyzed",
      value: loading ? "-" : `${stats.totalHours}h`,
      icon: Clock,
      description: "Of audio transcribed",
    },
    {
      title: "Action Items",
      value: loading ? "-" : stats.totalActionItems.toString(),
      icon: TrendingUp,
      description: "Generated from meetings",
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              Welcome back! Here&apos;s an overview of your meeting insights.
            </p>
          </div>
          <Link href="/meetings/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Meeting
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {stat.value}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Meetings or Empty State */}
        {showSkeleton && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
        {!loading && (recentMeetings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Meetings</CardTitle>
                <Link href="/meetings">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentMeetings.map((meeting, index) => (
                    <motion.div
                      key={meeting.id}
                      layout
                      layoutId={`dashboard-meeting-${meeting.id}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: index * 0.05,
                        layout: { type: "spring", stiffness: 350, damping: 30 }
                      }}
                    >
                      <Link
                        href={`/meetings/${meeting.id}`}
                        className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <Mic className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                              {meeting.title}
                            </p>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                                statusConfig[meeting.status]?.className ||
                                  statusConfig.PENDING.className
                              )}
                            >
                              {statusConfig[meeting.status]?.label || meeting.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
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
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                  <Mic className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  No meetings yet
                </h3>
                <p className="mb-6 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                  Upload your first meeting recording to get started with
                  AI-powered transcription and analysis.
                </p>
                <Link href="/meetings/new">
                  <Button>
                    Upload your first meeting
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    1
                  </span>
                  <span>
                    Record meetings on your iOS device using Voice Memos or any
                    recording app
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    2
                  </span>
                  <span>
                    Upload the audio file (m4a, mp3, or wav) to Meeting AI
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    3
                  </span>
                  <span>
                    Get automatic speaker detection, transcription, and
                    AI-powered insights
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageContainer>
  );
}
