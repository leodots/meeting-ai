import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/db/prisma";

// GET /api/meetings - List all meetings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const projectId = searchParams.get("project");
    const tagId = searchParams.get("tag");

    const where = {
      userId: session.user.id,
      ...(status && { status: status as any }),
      ...(projectId && { projectId }),
      ...(tagId && {
        tags: {
          some: { tagId },
        },
      }),
    };

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          language: true,
          status: true,
          duration: true,
          uploadedAt: true,
          processedAt: true,
          createdAt: true,
          projectId: true,
          project: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      }),
      prisma.meeting.count({ where }),
    ]);

    return NextResponse.json({
      meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List meetings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}
