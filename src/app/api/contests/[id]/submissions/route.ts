import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { inspectImageBuffer, validateImageRules, createOptimizedPreview } from "@/lib/image";
import { getEffectiveStatus } from "@/lib/contest-status";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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
    });

    if (!contest) {
      return NextResponse.json({ error: "Wettbewerb nicht gefunden." }, { status: 404 });
    }

    const effectiveStatus = getEffectiveStatus(contest);

    const { searchParams } = new URL(req.url);
    const onlyMine = searchParams.get("mine") === "true";
    const forJudging = searchParams.get("forJudging") === "true";

    // Filter logic
    let whereClause: Record<string, unknown> = { contestId: contest.id };

    if (onlyMine) {
      // Explicitly requested only own submissions (e.g. upload page /submit)
      if (!session) {
        return NextResponse.json({ submissions: [] });
      }
      whereClause = {
        contestId: contest.id,
        userId: session.userId,
      };
    } else if (forJudging) {
      // In the jury evaluation room (/contests/[slug]/judge):
      if (!contest.allowParticipantUploads) {
        // Direct rating contest:
        // All photos were provided by the admin/organizer as the contest gallery to be rated.
        // Nobody was a competing participant submitter.
        // Therefore, EVERY judge (including Admin and all jurors/participants)
        // MUST see and evaluate ALL photos in the contest, including photos created by admin or without author!
        whereClause = { contestId: contest.id };
      } else {
        // Regular contest with participant submissions:
        // Exclude the current user's own submissions so they don't vote on themselves.
        // CRITICAL SQLITE FIX: Using { not: session.userId } on nullable userId drops NULL in SQL!
        // We MUST explicitly include { userId: null } so authorless/admin-injected photos are visible!
        if (session && !isAdmin) {
          whereClause = {
            contestId: contest.id,
            OR: [
              { userId: null },
              { userId: { not: session.userId } },
            ],
          };
        } else {
          whereClause = { contestId: contest.id };
        }
      }
    } else {
      // General viewing (Admin management page, Finished results, etc.)
      if (isAdmin) {
        // Admin always sees ALL submissions without any exclusion!
        whereClause = { contestId: contest.id };
      } else {
        if (effectiveStatus === "DRAFT") {
          return NextResponse.json({ submissions: [] });
        }

        if (effectiveStatus === "SUBMISSION" || effectiveStatus === "UPCOMING") {
          if (!contest.allowParticipantUploads) {
            // Direct rating: preparation phase, show contest submissions
            whereClause = { contestId: contest.id };
          } else {
            // Regular contest during submission phase: non-admins only see their own submissions
            if (!session) {
              return NextResponse.json({ submissions: [] });
            }
            whereClause = {
              contestId: contest.id,
              userId: session.userId,
            };
          }
        } else {
          // In RATING or FINISHED phase: non-admins can see all submissions (sanitized)
          whereClause = { contestId: contest.id };
        }
      }
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        topic: {
          select: { id: true, title: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        ratings: session
          ? {
              where: { jurorId: session.userId },
              select: { id: true, score: true, comment: true },
            }
          : false,
        _count: {
          select: { ratings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Anonymize user info if judging is anonymous and viewer is not admin
    const anonymize =
      !isAdmin &&
      contest.anonymousJudging &&
      (effectiveStatus === "RATING" || contest.status === "RATING");

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "submissions");

    const sanitized = submissions.map((sub) => {
      const myRating = Array.isArray(sub.ratings) && sub.ratings.length > 0 ? sub.ratings[0] : null;

      // Check if optimized thumbnail exists
      const baseFilename = path.parse(sub.storedFilename).name;
      const thumbFile = `thumb-${baseFilename}.webp`;
      const hasThumb = fs.existsSync(path.join(uploadsDir, thumbFile));
      const thumbnailUrl = hasThumb ? `/uploads/submissions/${thumbFile}` : sub.filePath;

      return {
        id: sub.id,
        contestId: sub.contestId,
        topicId: sub.topicId,
        topicTitle: sub.topic.title,
        title: sub.title,
        description: sub.description,
        filePath: sub.filePath,
        thumbnailUrl,
        width: sub.width,
        height: sub.height,
        aspectRatio: sub.aspectRatio,
        fileSize: sub.fileSize,
        mimeType: sub.mimeType,
        cameraModel: sub.cameraModel,
        lens: sub.lens,
        focalLength: sub.focalLength,
        iso: sub.iso,
        aperture: sub.aperture,
        shutterSpeed: sub.shutterSpeed,
        takenAt: sub.takenAt,
        createdAt: sub.createdAt,
        photographerName: anonymize
          ? "Anonymer Teilnehmer"
          : (sub.user?.name || sub.submitterName || "Nicht zugewiesen"),
        photographerEmail: anonymize ? undefined : (sub.user?.email || undefined),
        userId: sub.userId,
        isOwn: session && sub.userId ? sub.userId === session.userId : false,
        myRating,
        totalRatingsCount: sub._count.ratings,
      };
    });

    return NextResponse.json({ submissions: sanitized });
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Einreichungen" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht angemeldet. Bitte einloggen." }, { status: 401 });
    }

    const { id } = await props.params;

    const contest = await prisma.contest.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { topics: true },
    });

    if (!contest) {
      return NextResponse.json({ error: "Wettbewerb nicht gefunden." }, { status: 404 });
    }

    const effectiveStatus = getEffectiveStatus(contest);
    const isAdmin = session.role === "ADMIN";

    // Only allow during SUBMISSION phase (or Admin override)
    if (effectiveStatus !== "SUBMISSION" && !isAdmin) {
      return NextResponse.json(
        { error: "Die Einreichungsphase für diesen Wettbewerb ist momentan nicht aktiv." },
        { status: 403 }
      );
    }

    if (!contest.allowParticipantUploads && !isAdmin) {
      return NextResponse.json(
        { error: "Für diesen Wettbewerb sind Einreichungen durch Teilnehmer deaktiviert. Die Bilder wurden von der Administration bereitgestellt." },
        { status: 403 }
      );
    }

    const userEmail = session.email.toLowerCase();

    // Access control for closed (INVITE_ONLY) contests
    let userParticipant = null;
    if (contest.accessType === "INVITE_ONLY" && !isAdmin) {
      userParticipant = await prisma.contestParticipant.findFirst({
        where: {
          contestId: contest.id,
          OR: [{ userId: session.userId }, { email: userEmail }],
        },
      });

      if (!userParticipant) {
        return NextResponse.json(
          {
            error: "Dieser Wettbewerb ist nur für geladene Teilnehmer zugänglich. Du wurdest zu diesem Wettbewerb nicht eingeladen.",
          },
          { status: 403 }
        );
      }

      // Link participant record to user account if not yet linked
      if (!userParticipant.userId) {
        await prisma.contestParticipant.update({
          where: { id: userParticipant.id },
          data: { userId: session.userId, status: "REGISTERED" },
        });
      }
    }

    // Check max participants for OPEN contests if not already joined
    if (contest.accessType === "OPEN" && contest.maxParticipants && !isAdmin) {
      const isAlreadyParticipant = await prisma.contestParticipant.findFirst({
        where: {
          contestId: contest.id,
          OR: [{ userId: session.userId }, { email: userEmail }],
        },
      });

      if (!isAlreadyParticipant) {
        const participantCount = await prisma.contestParticipant.count({
          where: { contestId: contest.id },
        });
        if (participantCount >= contest.maxParticipants) {
          return NextResponse.json(
            { error: "Die maximale Teilnehmeranzahl für diesen Wettbewerb ist bereits erreicht." },
            { status: 403 }
          );
        }
      }
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (err: any) {
      console.error("FormData parse error:", err);
      return NextResponse.json(
        {
          error: "Die Bilddatei konnte nicht vollständig übertragen werden (Upload-Stream abgebrochen oder Datei zu groß).",
        },
        { status: 400 }
      );
    }
    const file = formData.get("file") as File | null;
    const topicId = formData.get("topicId") as string | null;
    const title = (formData.get("title") as string | null)?.trim() || "";
    const description = (formData.get("description") as string | null)?.trim() || null;
    const isAdminFeed = formData.get("isAdminFeed") === "true" && isAdmin;
    const assignUserId = (formData.get("assignUserId") as string | null)?.trim() || null;
    const customSubmitterName = (formData.get("submitterName") as string | null)?.trim() || null;

    if (!file || !topicId || !title) {
      return NextResponse.json(
        { error: "Bitte Bilddatei, Thema und einen Bildtitel angeben." },
        { status: 400 }
      );
    }

    // Verify topic belongs to contest
    const topic = contest.topics.find((t) => t.id === topicId);
    if (!topic) {
      return NextResponse.json({ error: "Ungültiges Thema ausgewählt." }, { status: 400 });
    }

    // Determine target user and submitter attribution
    let targetUserId: string | null = session.userId;
    let submitterName: string | null = null;

    if (isAdminFeed) {
      // Admin God-mode: assign to selected user, or unassigned/anonymous
      if (assignUserId && assignUserId !== "none" && assignUserId !== "unassigned") {
        const targetUser = await prisma.user.findUnique({ where: { id: assignUserId } });
        if (targetUser) {
          targetUserId = targetUser.id;
          submitterName = customSubmitterName || targetUser.name;
        } else {
          targetUserId = null;
          submitterName = customSubmitterName || "Nicht zugewiesen";
        }
      } else {
        targetUserId = null;
        submitterName = customSubmitterName || "Nicht zugewiesen";
      }
    } else {
      // Regular participant submission (even if user is Admin, when participating normally)
      if (!contest.allowParticipantUploads && !isAdmin) {
        return NextResponse.json(
          { error: "Für diesen Wettbewerb sind Einreichungen durch Teilnehmer deaktiviert." },
          { status: 403 }
        );
      }

      // Check submission count for this user in this topic
      const existingCount = await prisma.submission.count({
        where: {
          contestId: contest.id,
          topicId: topic.id,
          userId: session.userId,
        },
      });

      if (existingCount >= topic.maxSubmissionsPerUser) {
        return NextResponse.json(
          {
            error: `Du hast für das Thema "${topic.title}" bereits die maximale Anzahl an Bildern (${topic.maxSubmissionsPerUser}) eingereicht.`,
          },
          { status: 400 }
        );
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Inspect image via sharp
    let imageMeta;
    try {
      imageMeta = await inspectImageBuffer(buffer, file.size);
    } catch (e) {
      console.error("Image decode error:", e);
      return NextResponse.json(
        { error: "Die hochgeladene Datei konnte nicht als gültiges Bild verarbeitet werden." },
        { status: 400 }
      );
    }

    // Validate contest rules
    const validation = validateImageRules(
      imageMeta,
      {
        maxFileSizeMb: contest.maxFileSizeMb,
        allowedFormats: contest.allowedFormats,
        minWidth: contest.minWidth,
        minHeight: contest.minHeight,
        maxWidth: contest.maxWidth,
        maxHeight: contest.maxHeight,
        aspectRatio: contest.aspectRatio,
        namingPattern: contest.namingPattern,
      },
      file.name
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Das Bild entspricht nicht den Wettbewerbsregeln.",
          details: validation.errors,
        },
        { status: 422 }
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "submissions");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || `.${imageMeta.format}`;
    const randomHex = crypto.randomBytes(8).toString("hex");
    const fileId = `${Date.now()}-${randomHex}`;
    const storedFilename = `${fileId}${ext}`;
    const targetFilePath = path.join(uploadsDir, storedFilename);

    await fs.promises.writeFile(targetFilePath, buffer);
    const publicUrl = `/uploads/submissions/${storedFilename}`;

    // Create fast preview thumbnail (WebP 1200px max)
    const thumbFilename = `thumb-${fileId}.webp`;
    const thumbFilePath = path.join(uploadsDir, thumbFilename);
    try {
      await createOptimizedPreview(buffer, thumbFilePath, 1200);
    } catch (e) {
      console.warn("Could not generate thumbnail:", e);
    }

    const submission = await prisma.submission.create({
      data: {
        contestId: contest.id,
        topicId: topic.id,
        userId: targetUserId,
        submitterName,
        title,
        description,
        originalFilename: file.name,
        storedFilename,
        filePath: publicUrl,
        mimeType: file.type || `image/${imageMeta.format}`,
        fileSize: file.size,
        width: imageMeta.width,
        height: imageMeta.height,
        aspectRatio: imageMeta.aspectRatio,
        cameraModel: imageMeta.cameraModel,
        lens: imageMeta.lens,
        focalLength: imageMeta.focalLength,
        iso: imageMeta.iso,
        aperture: imageMeta.aperture,
        shutterSpeed: imageMeta.shutterSpeed,
        takenAt: imageMeta.takenAt,
      },
    });

    // Ensure user is registered as participant in contest
    const existingPart = await prisma.contestParticipant.findFirst({
      where: {
        contestId: contest.id,
        OR: [{ userId: session.userId }, { email: userEmail }],
      },
    });

    if (!existingPart) {
      await prisma.contestParticipant.create({
        data: {
          contestId: contest.id,
          userId: session.userId,
          email: userEmail,
          name: session.name,
          status: "REGISTERED",
        },
      });
    } else if (!existingPart.userId) {
      await prisma.contestParticipant.update({
        where: { id: existingPart.id },
        data: { userId: session.userId, status: "REGISTERED" },
      });
    }

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("Upload submission error:", error);
    return NextResponse.json({ error: "Fehler beim Hochladen des Bildes." }, { status: 500 });
  }
}
