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

    return NextResponse.json({ success: true, contest });
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
