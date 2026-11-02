import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getEffectiveStatus } from "@/lib/contest-status";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await getAuthSession();
    const isAdmin = session?.role === "ADMIN";

    const contest = await prisma.contest.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        topics: { orderBy: { orderIndex: "asc" } },
        jurors: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!contest) {
      return NextResponse.json({ error: "Wettbewerb nicht gefunden." }, { status: 404 });
    }

    const effectiveStatus = getEffectiveStatus(contest);

    // If not admin and not finished, restrict access to full statistics
    if (!isAdmin && effectiveStatus !== "FINISHED") {
      return NextResponse.json(
        { error: "Die Auswertung und Rangliste wird erst nach Abschluss der Bewertungsphase veröffentlicht." },
        { status: 403 }
      );
    }

    // If contest has publicResults disabled, only Admins can view results!
    if (!isAdmin && !contest.publicResults) {
      return NextResponse.json(
        {
          error: "Die Rangliste und Ergebnisse dieses Wettbewerbs werden exklusiv durch die Wettbewerbsleitung ausgewertet und sind nicht öffentlich freigegeben.",
          restricted: true,
        },
        { status: 403 }
      );
    }

    // Fetch all submissions with ratings
    const submissions = await prisma.submission.findMany({
      where: { contestId: contest.id },
      include: {
        topic: true,
        user: { select: { id: true, name: true, email: true } },
        ratings: {
          include: {
            juror: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const totalSubmissionsCount = submissions.length;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "submissions");

    // Calculate score metrics for each submission
    const scoredSubmissions = submissions.map((sub) => {
      const scores = sub.ratings.map((r) => r.score);
      const voteCount = scores.length;
      const totalScore = scores.reduce((sum, s) => sum + s, 0);
      const avgScore = voteCount > 0 ? Number((totalScore / voteCount).toFixed(2)) : 0;
      const minScore = voteCount > 0 ? Math.min(...scores) : 0;
      const maxScore = voteCount > 0 ? Math.max(...scores) : 0;

      const baseFilename = path.parse(sub.storedFilename).name;
      const thumbFile = `thumb-${baseFilename}.webp`;
      const hasThumb = fs.existsSync(path.join(uploadsDir, thumbFile));
      const thumbnailUrl = hasThumb ? `/uploads/submissions/${thumbFile}` : sub.filePath;

      return {
        id: sub.id,
        title: sub.title,
        description: sub.description,
        filePath: sub.filePath,
        thumbnailUrl,
        width: sub.width,
        height: sub.height,
        aspectRatio: sub.aspectRatio,
        cameraModel: sub.cameraModel,
        lens: sub.lens,
        iso: sub.iso,
        aperture: sub.aperture,
        shutterSpeed: sub.shutterSpeed,
        topicId: sub.topicId,
        topicTitle: sub.topic.title,
        photographerName: sub.user?.name || sub.submitterName || "Nicht zugewiesen",
        photographerEmail: isAdmin ? (sub.user?.email || undefined) : undefined,
        avgScore,
        voteCount,
        minScore,
        maxScore,
        ratings: isAdmin
          ? sub.ratings.map((r) => ({
              jurorName: r.juror?.name || "Ehemaliger Juror",
              score: r.score,
              comment: r.comment,
            }))
          : [],
      };
    });

    // Overall leaderboard sorted by avgScore descending, then by voteCount descending
    const overallRanking = [...scoredSubmissions].sort((a, b) => {
      if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
      return b.voteCount - a.voteCount;
    });

    // Topic rankings
    const topicRankings: Record<string, typeof overallRanking> = {};
    for (const topic of contest.topics) {
      topicRankings[topic.id] = scoredSubmissions
        .filter((s) => s.topicId === topic.id)
        .sort((a, b) => {
          if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
          return b.voteCount - a.voteCount;
        });
    }

    // Juror evaluation progress
    const jurorProgress = [];
    if (isAdmin) {
      for (const jurorEntry of contest.jurors) {
        const jurorId = jurorEntry.userId;
        let ratedCount = 0;
        if (jurorId) {
          ratedCount = await prisma.rating.count({
            where: {
              jurorId,
              submission: { contestId: contest.id },
            },
          });
        }

        const percentage =
          totalSubmissionsCount > 0
            ? Math.round((ratedCount / totalSubmissionsCount) * 100)
            : 0;

        jurorProgress.push({
          email: jurorEntry.email,
          name: jurorEntry.name || jurorEntry.user?.name || jurorEntry.email,
          ratedCount,
          totalSubmissions: totalSubmissionsCount,
          percentage,
          status: jurorEntry.status,
        });
      }
    }

    // Score distribution buckets
    const scoreBuckets = {
      "0-2": 0,
      "2-4": 0,
      "4-6": 0,
      "6-8": 0,
      "8-10": 0,
    };

    for (const sub of scoredSubmissions) {
      if (sub.voteCount === 0) continue;
      const s = sub.avgScore;
      if (s <= 2) scoreBuckets["0-2"]++;
      else if (s <= 4) scoreBuckets["2-4"]++;
      else if (s <= 6) scoreBuckets["4-6"]++;
      else if (s <= 8) scoreBuckets["6-8"]++;
      else scoreBuckets["8-10"]++;
    }

    return NextResponse.json({
      contestTitle: contest.title,
      effectiveStatus,
      totalSubmissionsCount,
      overallRanking,
      topicRankings,
      jurorProgress,
      scoreBuckets,
    });
  } catch (error) {
    console.error("Contest stats error:", error);
    return NextResponse.json({ error: "Fehler beim Berechnen der Statistiken" }, { status: 500 });
  }
}
