import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, requireAdmin } from "@/lib/auth";
import { getEffectiveStatus } from "@/lib/contest-status";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await getAuthSession();
    const isAdmin = session?.role === "ADMIN";

    // Query either by ID or by Slug
    const contest = await prisma.contest.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        topics: {
          orderBy: { orderIndex: "asc" },
        },
        participants: isAdmin
          ? {
              select: {
                id: true,
                email: true,
                name: true,
                inviteToken: true,
                status: true,
                userId: true,
                createdAt: true,
              },
            }
          : false,
        jurors: isAdmin
          ? {
              select: {
                id: true,
                email: true,
                name: true,
                inviteToken: true,
                status: true,
                userId: true,
              },
            }
          : false,
        _count: {
          select: {
            submissions: true,
            participants: true,
            jurors: true,
          },
        },
      },
    });

    if (!contest) {
      return NextResponse.json({ error: "Wettbewerb nicht gefunden" }, { status: 404 });
    }

    // Check if current user is participant or juror
    let userParticipation = null;
    let userJuror = null;
    if (session) {
      userParticipation = await prisma.contestParticipant.findFirst({
        where: {
          contestId: contest.id,
          OR: [{ userId: session.userId }, { email: session.email }],
        },
      });
      userJuror = await prisma.contestJuror.findFirst({
        where: {
          contestId: contest.id,
          OR: [{ userId: session.userId }, { email: session.email }],
        },
      });
    }

    const effectiveStatus = getEffectiveStatus(contest);

    return NextResponse.json({
      contest: {
        ...contest,
        effectiveStatus,
        isParticipant: !!userParticipation,
        isJuror: !!userJuror || (contest.votingMode === "PEER_REVIEW" && !!userParticipation),
      },
    });
  } catch (error) {
    console.error("Get contest error:", error);
    return NextResponse.json({ error: "Fehler beim Laden des Wettbewerbs" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;
    const data = await req.json();

    const contest = await prisma.contest.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        description: data.description !== undefined ? data.description : undefined,
        status: data.status !== undefined ? data.status : undefined,
        accessType: data.accessType !== undefined ? data.accessType : undefined,
        maxParticipants: data.maxParticipants !== undefined ? (data.maxParticipants ? parseInt(data.maxParticipants, 10) : null) : undefined,
        submissionStart: data.submissionStart ? new Date(data.submissionStart) : undefined,
        submissionEnd: data.submissionEnd ? new Date(data.submissionEnd) : undefined,
        ratingStart: data.ratingStart ? new Date(data.ratingStart) : undefined,
        ratingEnd: data.ratingEnd ? new Date(data.ratingEnd) : undefined,
        votingMode: data.votingMode !== undefined ? data.votingMode : undefined,
        anonymousJudging: data.anonymousJudging !== undefined ? !!data.anonymousJudging : undefined,
        maxFileSizeMb: data.maxFileSizeMb !== undefined ? parseFloat(data.maxFileSizeMb) : undefined,
        allowedFormats: data.allowedFormats !== undefined ? data.allowedFormats : undefined,
        minWidth: data.minWidth !== undefined ? (data.minWidth ? parseInt(data.minWidth, 10) : null) : undefined,
        minHeight: data.minHeight !== undefined ? (data.minHeight ? parseInt(data.minHeight, 10) : null) : undefined,
        maxWidth: data.maxWidth !== undefined ? (data.maxWidth ? parseInt(data.maxWidth, 10) : null) : undefined,
        maxHeight: data.maxHeight !== undefined ? (data.maxHeight ? parseInt(data.maxHeight, 10) : null) : undefined,
        aspectRatio: data.aspectRatio !== undefined ? data.aspectRatio : undefined,
        namingPattern: data.namingPattern !== undefined ? data.namingPattern : undefined,
      },
    });

    // Handle topics update if provided
    if (Array.isArray(data.topics)) {
      const currentTopics = await prisma.topic.findMany({
        where: { contestId: contest.id },
      });

      const currentTopicIds = new Set(currentTopics.map((t) => t.id));
      const incomingTopicIds = new Set(
        data.topics
          .filter((t: { id?: string }) => t.id && !t.id.startsWith("temp-"))
          .map((t: { id: string }) => t.id)
      );

      // Check which topics are being removed
      for (const curr of currentTopics) {
        if (!incomingTopicIds.has(curr.id)) {
          const submissionCount = await prisma.submission.count({
            where: { topicId: curr.id },
          });
          if (submissionCount > 0) {
            return NextResponse.json(
              {
                error: `Das Thema "${curr.title}" kann nicht gelöscht werden, da dafür bereits ${submissionCount} Foto(s) eingereicht wurden.`,
              },
              { status: 400 }
            );
          }
          await prisma.topic.delete({ where: { id: curr.id } });
        }
      }

      // Update or create incoming topics
      for (let idx = 0; idx < data.topics.length; idx++) {
        const t = data.topics[idx];
        const isExisting = t.id && currentTopicIds.has(t.id);

        if (isExisting) {
          await prisma.topic.update({
            where: { id: t.id },
            data: {
              title: t.title?.trim() || "Thema",
              description: t.description?.trim() || null,
              maxSubmissionsPerUser: Number(t.maxSubmissionsPerUser) || 1,
              orderIndex: idx,
            },
          });
        } else {
          await prisma.topic.create({
            data: {
              contestId: contest.id,
              title: t.title?.trim() || "Thema",
              description: t.description?.trim() || null,
              maxSubmissionsPerUser: Number(t.maxSubmissionsPerUser) || 1,
              orderIndex: idx,
            },
          });
        }
      }
    }

    const updatedContest = await prisma.contest.findUnique({
      where: { id: contest.id },
      include: { topics: { orderBy: { orderIndex: "asc" } } },
    });

    return NextResponse.json({ success: true, contest: updatedContest });
  } catch (error) {
    console.error("Update contest error:", error);
    return NextResponse.json({ error: "Fehler beim Aktualisieren des Wettbewerbs" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;

    await prisma.contest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete contest error:", error);
    return NextResponse.json({ error: "Fehler beim Löschen des Wettbewerbs" }, { status: 500 });
  }
}
