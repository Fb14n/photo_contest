import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generateQrCodeDataUrl } from "@/lib/qrcode";
import { sendContestInvitationEmail } from "@/lib/email";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;
    const body = await req.json();

    const contest = await prisma.contest.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!contest) {
      return NextResponse.json({ error: "Wettbewerb nicht gefunden." }, { status: 404 });
    }

    const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Handle single email resend
    if (body.action === "resend") {
      const { email, type } = body;
      if (!email || !type) {
        return NextResponse.json({ error: "E-Mail und Typ erforderlich." }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      let token = "";
      let personName: string | null = null;

      if (type === "participant") {
        const participant = await prisma.contestParticipant.findFirst({
          where: { contestId: contest.id, email: cleanEmail },
        });
        if (!participant) {
          return NextResponse.json({ error: "Teilnehmer nicht gefunden." }, { status: 404 });
        }
        token = participant.inviteToken;
        personName = participant.name;
        await prisma.contestParticipant.update({
          where: { id: participant.id },
          data: { inviteSentAt: new Date() },
        });
      } else {
        const juror = await prisma.contestJuror.findFirst({
          where: { contestId: contest.id, email: cleanEmail },
        });
        if (!juror) {
          return NextResponse.json({ error: "Juror nicht gefunden." }, { status: 404 });
        }
        token = juror.inviteToken;
        personName = juror.name;
        await prisma.contestJuror.update({
          where: { id: juror.id },
          data: { inviteSentAt: new Date() },
        });
      }

      const inviteUrl = `${host}/invite/${token}`;
      await sendContestInvitationEmail({
        email: cleanEmail,
        name: personName,
        contestTitle: contest.title,
        role: type === "juror" ? "Juror" : "Teilnehmer",
        inviteUrl,
      });

      return NextResponse.json({
        success: true,
        message: `Einladungs-E-Mail an ${cleanEmail} wurde erfolgreich versendet.`,
      });
    }

    const { type, emails, sendEmail = true } = body;

    if (!type || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Bitte Typ (participant oder juror) und E-Mail-Adressen angeben." },
        { status: 400 }
      );
    }

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
            inviteSentAt: sendEmail ? new Date() : null,
          },
          update: {
            userId: existingUser?.id || undefined,
            name: existingUser?.name || undefined,
            inviteSentAt: sendEmail ? new Date() : undefined,
          },
        });

        const inviteUrl = `${host}/invite/${entry.inviteToken}`;
        const qrCode = await generateQrCodeDataUrl(inviteUrl);

        if (sendEmail) {
          await sendContestInvitationEmail({
            email,
            name: entry.name,
            contestTitle: contest.title,
            role: "Teilnehmer",
            inviteUrl,
          });
        }

        results.push({
          id: entry.id,
          email: entry.email,
          name: entry.name,
          inviteToken: entry.inviteToken,
          inviteUrl,
          qrCode,
          status: entry.status,
          inviteSentAt: entry.inviteSentAt,
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
            inviteSentAt: sendEmail ? new Date() : null,
          },
          update: {
            userId: existingUser?.id || undefined,
            name: existingUser?.name || undefined,
            inviteSentAt: sendEmail ? new Date() : undefined,
          },
        });

        const inviteUrl = `${host}/invite/${entry.inviteToken}`;
        const qrCode = await generateQrCodeDataUrl(inviteUrl);

        if (sendEmail) {
          await sendContestInvitationEmail({
            email,
            name: entry.name,
            contestTitle: contest.title,
            role: "Juror",
            inviteUrl,
          });
        }

        results.push({
          id: entry.id,
          email: entry.email,
          name: entry.name,
          inviteToken: entry.inviteToken,
          inviteUrl,
          qrCode,
          status: entry.status,
          inviteSentAt: entry.inviteSentAt,
        });
      }
    }

    return NextResponse.json({ success: true, invites: results });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Fehler beim Erstellen der Einladungen" }, { status: 500 });
  }
}
