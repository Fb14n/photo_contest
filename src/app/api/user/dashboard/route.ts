import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getEffectiveStatus } from "@/lib/contest-status";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    // 1. Fetch user's submissions
    const submissions = await prisma.submission.findMany({
      where: { userId: session.userId },
      include: {
        contest: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            submissionStart: true,
            submissionEnd: true,
            ratingStart: true,
            ratingEnd: true,
          },
        },
        topic: {
          select: { id: true, title: true },
        },
        _count: {
          select: { ratings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch contests where user is invited/registered as participant
    const participantEntries = await prisma.contestParticipant.findMany({
      where: {
        OR: [{ userId: session.userId }, { email: session.email }],
      },
      include: {
        contest: {
          include: {
            _count: {
              select: { submissions: true },
            },
          },
        },
      },
    });

    // 3. Fetch contests where user is assigned as juror
    const jurorEntries = await prisma.contestJuror.findMany({
      where: {
        OR: [{ userId: session.userId }, { email: session.email }],
      },
      include: {
        contest: {
          include: {
            _count: {
              select: { submissions: true },
            },
          },
        },
      },
    });

    // Also include contests user submitted to even if not in participant table (e.g. open contest)
    const submittedContestIds = new Set(submissions.map((s) => s.contest.id));
    const participantContests: any[] = participantEntries.map((p) => ({
      ...p.contest,
      effectiveStatus: getEffectiveStatus(p.contest),
      myStatus: p.status,
      inviteToken: p.inviteToken,
    }));

    // Find any additional open contests user submitted to
    for (const sub of submissions) {
      if (!participantContests.some((pc) => pc.id === sub.contest.id)) {
        participantContests.push({
          ...sub.contest,
          effectiveStatus: getEffectiveStatus(sub.contest),
          myStatus: "REGISTERED",
          inviteToken: "",
          _count: { submissions: 0 },
        });
      }
    }

    const juryContests = jurorEntries.map((j) => ({
      ...j.contest,
      effectiveStatus: getEffectiveStatus(j.contest),
      juryStatus: j.status,
      inviteToken: j.inviteToken,
    }));

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "submissions");

    const formattedSubmissions = submissions.map((s) => {
      const baseFilename = path.parse(s.storedFilename).name;
      const thumbFile = `thumb-${baseFilename}.webp`;
      const hasThumb = fs.existsSync(path.join(uploadsDir, thumbFile));
      const thumbnailUrl = hasThumb ? `/uploads/submissions/${thumbFile}` : s.filePath;

      return {
        id: s.id,
        title: s.title,
        description: s.description,
        filePath: s.filePath,
        thumbnailUrl,
        width: s.width,
        height: s.height,
        aspectRatio: s.aspectRatio,
        fileSize: s.fileSize,
        createdAt: s.createdAt,
        contestId: s.contest.id,
        contestTitle: s.contest.title,
        contestSlug: s.contest.slug,
        contestStatus: getEffectiveStatus(s.contest),
        topicTitle: s.topic.title,
        ratingsCount: s._count.ratings,
      };
    });

    return NextResponse.json({
      submissions: formattedSubmissions,
      myContests: participantContests,
      juryContests,
    });
  } catch (error) {
    console.error("User dashboard error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden des Dashboards" },
      { status: 500 }
    );
  }
}
