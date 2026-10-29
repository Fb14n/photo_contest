import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, requireAdmin } from "@/lib/auth";
import { getEffectiveStatus } from "@/lib/contest-status";
import { sendContestInvitationEmail, sendExistingUserContestInvitationEmail } from "@/lib/email";

export async function GET() {
  try {
    const session = await getAuthSession();
    const isAdmin = session?.role === "ADMIN";

    let whereClause: any = {
      status: { not: "DRAFT" },
      accessType: "OPEN",
    };

    if (isAdmin) {
      whereClause = {};
    } else if (session) {
      const userEmail = session.email.toLowerCase();
      whereClause = {
        status: { not: "DRAFT" },
        OR: [
          { accessType: "OPEN" },
          {
            accessType: "INVITE_ONLY",
            participants: {
              some: {
                OR: [{ userId: session.userId }, { email: userEmail }],
              },
            },
          },
          {
            accessType: "INVITE_ONLY",
            jurors: {
              some: {
                OR: [{ userId: session.userId }, { email: userEmail }],
              },
            },
          },
        ],
      };
    }

    const contests = await prisma.contest.findMany({
      where: whereClause,
      include: {
        topics: {
          select: { id: true, title: true, maxSubmissionsPerUser: true },
          orderBy: { orderIndex: "asc" },
        },
        participants: session
          ? {
              where: {
                OR: [
                  { userId: session.userId },
                  { email: session.email.toLowerCase() },
                ],
              },
              select: { id: true, userId: true },
            }
          : false,
        jurors: session
          ? {
              where: {
                OR: [
                  { userId: session.userId },
                  { email: session.email.toLowerCase() },
                ],
              },
              select: { id: true, userId: true },
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
      orderBy: { createdAt: "desc" },
    });

    const enriched = contests.map((c: any) => {
      const isParticipant = Array.isArray(c.participants) && c.participants.length > 0;
      const isJuror = Array.isArray(c.jurors) && c.jurors.length > 0;
      const { participants, jurors, ...rest } = c;

      return {
        ...rest,
        effectiveStatus: getEffectiveStatus(c),
        isParticipant,
        isJuror: isJuror || (c.votingMode === "PEER_REVIEW" && isParticipant),
      };
    });

    return NextResponse.json({ contests: enriched });
  } catch (error) {
    console.error("List contests error:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Wettbewerbe" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = await req.json();

    const {
      title,
      description,
      coverImage,
      status = "SUBMISSION",
      accessType = "OPEN",
      maxParticipants,
      submissionStart,
      submissionEnd,
      ratingStart,
      ratingEnd,
      votingMode = "EXCLUSIVE_JURY",
      anonymousJudging = true,
      publicResults = true,
      allowParticipantUploads = true,
      sendNotificationEmails = true,
      maxFileSizeMb = 15.0,
      allowedFormats = "image/jpeg,image/png,image/webp",
      minWidth = 1200,
      minHeight = 800,
      maxWidth,
      maxHeight,
      aspectRatio = "free",
      namingPattern = "",
      topics = [],
      participantEmails = [],
      jurorEmails = [],
    } = data;

    if (!title || !description || !submissionStart || !submissionEnd || !ratingStart || !ratingEnd) {
      return NextResponse.json(
        { error: "Bitte fülle alle Pflichtfelder (Titel, Beschreibung, Zeiträume) aus." },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!baseSlug) baseSlug = "wettbewerb";

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.contest.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const contest = await prisma.contest.create({
      data: {
        title: title.trim(),
        slug,
        description: description.trim(),
        coverImage: coverImage || null,
        status,
        accessType,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        submissionStart: new Date(submissionStart),
        submissionEnd: new Date(submissionEnd),
        ratingStart: new Date(ratingStart),
        ratingEnd: new Date(ratingEnd),
        votingMode,
        anonymousJudging: !!anonymousJudging,
        publicResults: !!publicResults,
        allowParticipantUploads: !!allowParticipantUploads,
        maxFileSizeMb: parseFloat(maxFileSizeMb) || 15.0,
        allowedFormats,
        minWidth: minWidth ? parseInt(minWidth, 10) : null,
        minHeight: minHeight ? parseInt(minHeight, 10) : null,
        maxWidth: maxWidth ? parseInt(maxWidth, 10) : null,
        maxHeight: maxHeight ? parseInt(maxHeight, 10) : null,
        aspectRatio,
        namingPattern,
        topics: {
          create: topics.map((t: { title: string; description?: string; maxSubmissionsPerUser?: number }, index: number) => ({
            title: t.title.trim(),
            description: t.description?.trim() || null,
            maxSubmissionsPerUser: t.maxSubmissionsPerUser || 1,
            orderIndex: index,
          })),
        },
      },
      include: { topics: true },
    });

    const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Add pre-configured participants if any
    if (Array.isArray(participantEmails) && participantEmails.length > 0) {
      for (const email of participantEmails) {
        const clean = email.trim().toLowerCase();
        if (clean && clean.includes("@")) {
          const existingUser = await prisma.user.findUnique({ where: { email: clean } });
          const participant = await prisma.contestParticipant.create({
            data: {
              contestId: contest.id,
              userId: existingUser?.id || null,
              email: clean,
              name: existingUser?.name || null,
              status: existingUser ? "REGISTERED" : "INVITED",
              inviteSentAt: sendNotificationEmails ? new Date() : null,
            },
          });

          if (sendNotificationEmails) {
            try {
              if (existingUser) {
                await sendExistingUserContestInvitationEmail({
                  email: clean,
                  name: existingUser.name,
                  contestTitle: contest.title,
                  contestSlug: contest.slug,
                  role: "Teilnehmer",
                });
              } else {
                await sendContestInvitationEmail({
                  email: clean,
                  name: null,
                  contestTitle: contest.title,
                  role: "Teilnehmer",
                  inviteUrl: `${host}/invite/${participant.inviteToken}`,
                });
              }
            } catch (mailErr) {
              console.error("Error sending participant invitation email:", mailErr);
            }
          }
        }
      }
    }

    // Add pre-configured jurors if any
    if (Array.isArray(jurorEmails) && jurorEmails.length > 0) {
      for (const email of jurorEmails) {
        const clean = email.trim().toLowerCase();
        if (clean && clean.includes("@")) {
          const existingUser = await prisma.user.findUnique({ where: { email: clean } });
          const juror = await prisma.contestJuror.create({
            data: {
              contestId: contest.id,
              userId: existingUser?.id || null,
              email: clean,
              name: existingUser?.name || null,
              status: existingUser ? "ACTIVE" : "INVITED",
              inviteSentAt: sendNotificationEmails ? new Date() : null,
            },
          });

          if (sendNotificationEmails) {
            try {
              if (existingUser) {
                await sendExistingUserContestInvitationEmail({
                  email: clean,
                  name: existingUser.name,
                  contestTitle: contest.title,
                  contestSlug: contest.slug,
                  role: "Juror",
                });
              } else {
                await sendContestInvitationEmail({
                  email: clean,
                  name: null,
                  contestTitle: contest.title,
                  role: "Juror",
                  inviteUrl: `${host}/invite/${juror.inviteToken}`,
                });
              }
            } catch (mailErr) {
              console.error("Error sending juror invitation email:", mailErr);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, contest });
  } catch (error) {
    console.error("Create contest error:", error);
    return NextResponse.json({ error: "Fehler beim Erstellen des Wettbewerbs" }, { status: 500 });
  }
}
