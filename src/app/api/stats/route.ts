import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total completed meetings
    const totalMeetings = await prisma.meeting.count({
      where: {
        userId,
        status: "COMPLETED",
      },
    });

    // Get total duration in seconds
    const durationResult = await prisma.meeting.aggregate({
      where: {
        userId,
        status: "COMPLETED",
      },
      _sum: {
        duration: true,
      },
    });
    const totalSeconds = durationResult._sum.duration || 0;
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10; // 1 decimal

    // Get total action items from all analyses
    const analyses = await prisma.analysis.findMany({
      where: {
        meeting: {
          userId,
          status: "COMPLETED",
        },
      },
      select: {
        actionItems: true,
      },
    });

    let totalActionItems = 0;
    for (const analysis of analyses) {
      if (Array.isArray(analysis.actionItems)) {
        totalActionItems += analysis.actionItems.length;
      }
    }

    // Get recent meetings (last 5)
    const recentMeetings = await prisma.meeting.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        duration: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json({
      stats: {
        totalMeetings,
        totalHours,
        totalActionItems,
      },
      recentMeetings,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
