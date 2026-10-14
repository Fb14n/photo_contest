import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getEffectiveStatus } from "@/lib/contest-status";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const { id } = await props.params;

    const contest = await prisma.contest.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!contest) {
      return NextResponse.json({ error: "Wettbewerb nicht gefunden" }, { status: 404 });
    }

    const ratings = await prisma.rating.findMany({
      where: {
        jurorId: session.userId,
        submission: {
          contestId: contest.id,
        },
      },
      select: {
        id: true,
        submissionId: true,
        score: true,
        comment: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ratings });
  } catch (error) {
    console.error("Get ratings error:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Bewertungen" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Bitte melde dich an, um abzustimmen." }, { status: 401 });
    }

    const { id } = await props.params;
    const { submissionId, score, comment } = await req.json();

    if (score === undefined || score === null || isNaN(Number(score))) {
      return NextResponse.json({ error: "Bitte eine Note von 0 bis 10 angeben." }, { status: 400 });
    }

    const numScore = parseFloat(score);
    if (numScore < 0 || numScore > 10) {
      return NextResponse.json({ error: "Die Bewertung muss zwischen 0 und 10 liegen." }, { status: 400 });
    }

    const contest = await prisma.contest.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!contest) {
      return NextResponse.json({ error: "Wettbewerb nicht gefunden." }, { status: 404 });
    }

    const isAdmin = session.role === "ADMIN";
    const effectiveStatus = getEffectiveStatus(contest);

    // Verify rating phase
    if (!isAdmin && effectiveStatus !== "RATING") {
      if (effectiveStatus === "FINISHED") {
        return NextResponse.json({ error: "Die Bewertungsphase ist bereits beendet." }, { status: 403 });
      }
      return NextResponse.json({ error: "Die Bewertungsphase hat noch nicht begonnen." }, { status: 403 });
    }

    // Verify submission belongs to this contest
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.contestId !== contest.id) {
      return NextResponse.json({ error: "Einreichung gehört nicht zu diesem Wettbewerb." }, { status: 400 });
    }

    // Check authorization based on votingMode
    if (!isAdmin) {
      if (contest.votingMode === "PEER_REVIEW") {
        // Can't rate your own picture!
        if (submission.userId === session.userId) {
          return NextResponse.json({ error: "Du kannst dein eigenes Bild nicht bewerten." }, { status: 400 });
        }

        const isParticipant = await prisma.contestParticipant.findFirst({
          where: {
            contestId: contest.id,
            OR: [{ userId: session.userId }, { email: session.email }],
          },
        });
        if (!isParticipant) {
          return NextResponse.json({ error: "Nur Teilnehmer dürfen an diesem Wettbewerb abstimmen." }, { status: 403 });
        }
      } else {
        // EXCLUSIVE_JURY: User must be an assigned juror
        const isJuror = await prisma.contestJuror.findFirst({
          where: {
            contestId: contest.id,
            OR: [{ userId: session.userId }, { email: session.email }],
          },
        });

        if (!isJuror && session.role !== "JUROR") {
          return NextResponse.json({ error: "Du bist für diesen Wettbewerb nicht als Juror eingeteilt." }, { status: 403 });
        }
      }
    }

    // Upsert rating (jurors can adjust their score anytime before deadline!)
    const rating = await prisma.rating.upsert({
      where: {
        submissionId_jurorId: {
          submissionId,
          jurorId: session.userId,
        },
      },
      create: {
        submissionId,
        jurorId: session.userId,
        score: numScore,
        comment: comment?.trim() || null,
      },
      update: {
        score: numScore,
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    console.error("Save rating error:", error);
    return NextResponse.json({ error: "Fehler beim Speichern der Bewertung" }, { status: 500 });
  }
}
