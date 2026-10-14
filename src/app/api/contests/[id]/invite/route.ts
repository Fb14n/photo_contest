import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generateQrCodeDataUrl } from "@/lib/qrcode";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;
    const { type, emails } = await req.json();

    if (!type || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Bitte Typ (participant oder juror) und E-Mail-Adressen angeben." },
        { status: 400 }
      );
    }

    const contest = await prisma.contest.findUnique({
      where: { id },
    });

    if (!contest) {
      return NextResponse.json({ error: "Wettbewerb nicht gefunden." }, { status: 404 });
    }

    const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const results = [];

    for (const rawEmail of emails) {
      const email = rawEmail.trim().toLowerCase();
      if (!email || !email.includes("@")) continue;

      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (type === "participant") {
        const entry = await prisma.contestParticipant.upsert({
          where: {
            contestId_email: {
              contestId: contest.id,
              email,
            },
          },
          create: {
            contestId: contest.id,
            email,
            userId: existingUser?.id || null,
            name: existingUser?.name || null,
            status: existingUser ? "REGISTERED" : "INVITED",
          },
          update: {
            userId: existingUser?.id || undefined,
            name: existingUser?.name || undefined,
          },
        });

        const inviteUrl = `${host}/invite/${entry.inviteToken}`;
        const qrCode = await generateQrCodeDataUrl(inviteUrl);

        results.push({
          id: entry.id,
          email: entry.email,
          name: entry.name,
          inviteToken: entry.inviteToken,
          inviteUrl,
          qrCode,
          status: entry.status,
        });
      } else if (type === "juror") {
        const entry = await prisma.contestJuror.upsert({
          where: {
            contestId_email: {
              contestId: contest.id,
              email,
            },
          },
          create: {
            contestId: contest.id,
            email,
            userId: existingUser?.id || null,
            name: existingUser?.name || null,
            status: existingUser ? "ACTIVE" : "INVITED",
          },
          update: {
            userId: existingUser?.id || undefined,
            name: existingUser?.name || undefined,
          },
        });

        const inviteUrl = `${host}/invite/${entry.inviteToken}`;
        const qrCode = await generateQrCodeDataUrl(inviteUrl);

        results.push({
          id: entry.id,
          email: entry.email,
          name: entry.name,
          inviteToken: entry.inviteToken,
          inviteUrl,
          qrCode,
          status: entry.status,
        });
      }
    }

    return NextResponse.json({ success: true, invites: results });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Fehler beim Erstellen der Einladungen" }, { status: 500 });
  }
}
