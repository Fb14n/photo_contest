import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;

    const contest = await prisma.contest.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!contest) {
      return NextResponse.json({ error: "Wettbewerb nicht gefunden." }, { status: 404 });
    }

    let targetId = "";
    let type: "participant" | "juror" = "participant";
    let deleteSubmissions = true;
    let deleteRatings = true;

    try {
      const body = await req.json();
      if (body) {
        targetId = body.targetId || "";
        type = body.type === "juror" ? "juror" : "participant";
        deleteSubmissions = body.deleteSubmissions !== undefined ? Boolean(body.deleteSubmissions) : true;
        deleteRatings = body.deleteRatings !== undefined ? Boolean(body.deleteRatings) : true;
      }
    } catch {
      const url = new URL(req.url);
      targetId = url.searchParams.get("targetId") || "";
      type = url.searchParams.get("type") === "juror" ? "juror" : "participant";
      deleteSubmissions = url.searchParams.get("deleteSubmissions") !== "false";
      deleteRatings = url.searchParams.get("deleteRatings") !== "false";
    }

    if (!targetId) {
      return NextResponse.json(
        { error: "targetId der zu entfernenden Person ist erforderlich." },
        { status: 400 }
      );
    }

    if (type === "participant") {
      const participant = await prisma.contestParticipant.findUnique({
        where: { id: targetId },
      });

      if (!participant || participant.contestId !== contest.id) {
        return NextResponse.json(
          { error: "Teilnehmer in diesem Wettbewerb nicht gefunden." },
          { status: 404 }
        );
      }

      const userId = participant.userId;
      const email = participant.email.toLowerCase().trim();

      // 1. Handle Submissions in this contest
      const whereCondition = userId
        ? { contestId: contest.id, OR: [{ userId }, { user: { email } }] }
        : { contestId: contest.id, user: { email } };

      const submissions = await prisma.submission.findMany({
        where: whereCondition,
        select: { id: true, filePath: true, storedFilename: true },
      });

      if (deleteSubmissions) {
        for (const sub of submissions) {
          try {
            const diskPath = path.join(process.cwd(), "public", sub.filePath.replace(/^\//, ""));
            if (fs.existsSync(diskPath)) {
              await fs.promises.unlink(diskPath);
            }
            if (sub.storedFilename) {
              const baseFilename = path.parse(sub.storedFilename).name;
              const thumbDiskPath = path.join(process.cwd(), "public", "uploads", "submissions", `thumb-${baseFilename}.webp`);
              if (fs.existsSync(thumbDiskPath)) {
                await fs.promises.unlink(thumbDiskPath);
              }
            }
          } catch (e) {
            console.warn("Could not delete file from disk:", e);
          }
        }

        if (submissions.length > 0) {
          await prisma.submission.deleteMany({
            where: { id: { in: submissions.map((s) => s.id) } },
          });
        }
      } else if (submissions.length > 0) {
        // Keep submissions, but decouple userId and set submitterName
        await prisma.submission.updateMany({
          where: { id: { in: submissions.map((s) => s.id) } },
          data: {
            userId: null,
            submitterName: participant.name || participant.email,
          },
        });
      }

      // 2. Handle Ratings in this contest
      if (deleteRatings && userId) {
        await prisma.rating.deleteMany({
          where: {
            jurorId: userId,
            submission: { contestId: contest.id },
          },
        });
      }

      // 3. Remove ContestParticipant entry
      await prisma.contestParticipant.delete({
        where: { id: targetId },
      });

      return NextResponse.json({
        success: true,
        message: `Teilnehmer "${participant.name || participant.email}" wurde aus dem Wettbewerb entfernt.`,
        deletedSubmissionsCount: deleteSubmissions ? submissions.length : 0,
      });
    } else {
      // Juror
      const juror = await prisma.contestJuror.findUnique({
        where: { id: targetId },
      });

      if (!juror || juror.contestId !== contest.id) {
        return NextResponse.json(
          { error: "Juror in diesem Wettbewerb nicht gefunden." },
          { status: 404 }
        );
      }

      const userId = juror.userId;

      // Handle Ratings in this contest
      if (deleteRatings && userId) {
        await prisma.rating.deleteMany({
          where: {
            jurorId: userId,
            submission: { contestId: contest.id },
          },
        });
      }

      // Remove ContestJuror entry
      await prisma.contestJuror.delete({
        where: { id: targetId },
      });

      return NextResponse.json({
        success: true,
        message: `Juror "${juror.name || juror.email}" wurde aus dem Wettbewerb entfernt.`,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Error removing participant/juror from contest:", err);
    return NextResponse.json(
      { error: "Fehler beim Entfernen aus dem Wettbewerb." },
      { status: 500 }
    );
  }
}
