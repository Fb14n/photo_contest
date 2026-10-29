import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getEffectiveStatus } from "@/lib/contest-status";
import fs from "fs";
import path from "path";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const { id, subId } = await props.params;

    const submission = await prisma.submission.findUnique({
      where: { id: subId },
      include: { contest: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Einreichung nicht gefunden." }, { status: 404 });
    }

    const isAdmin = session.role === "ADMIN";
    const isAuthor = submission.userId === session.userId;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: "Keine Berechtigung zum Löschen dieses Bildes." }, { status: 403 });
    }

    const effectiveStatus = getEffectiveStatus(submission.contest);
    if (!isAdmin && effectiveStatus !== "SUBMISSION") {
      return NextResponse.json(
        { error: "Bilder können nach Ablauf der Einreichungsfrist nicht mehr gelöscht werden." },
        { status: 403 }
      );
    }

    // Try deleting file and preview thumbnail from disk
    try {
      const diskPath = path.join(process.cwd(), "public", submission.filePath.replace(/^\//, ""));
      if (fs.existsSync(diskPath)) {
        await fs.promises.unlink(diskPath);
      }

      if (submission.storedFilename) {
        const baseFilename = path.parse(submission.storedFilename).name;
        const thumbDiskPath = path.join(process.cwd(), "public", "uploads", "submissions", `thumb-${baseFilename}.webp`);
        if (fs.existsSync(thumbDiskPath)) {
          await fs.promises.unlink(thumbDiskPath);
        }
      }
    } catch (e) {
      console.warn("Could not delete file from disk:", e);
    }

    await prisma.submission.delete({
      where: { id: subId },
    });

    return NextResponse.json({ success: true, message: "Bild erfolgreich gelöscht." });
  } catch (error) {
    console.error("Delete submission error:", error);
    return NextResponse.json({ error: "Fehler beim Löschen des Bildes" }, { status: 500 });
  }
}
