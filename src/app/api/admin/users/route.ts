import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { sendAccountApprovedEmail } from "@/lib/email";
import crypto from "crypto";

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustSetPassword: true,
        createdAt: true,
        _count: {
          select: {
            submissions: true,
            ratings: true,
            participants: true,
            jurorEntries: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Error fetching users:", err);
    return NextResponse.json({ error: "Fehler beim Laden der Benutzer" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { name, email, role, password, sendInviteEmail } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name und E-Mail-Adresse sind Pflichtfelder." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanRole = ["ADMIN", "JUROR", "PARTICIPANT"].includes(role)
      ? role
      : "PARTICIPANT";

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits." },
        { status: 409 }
      );
    }

    let passwordHash: string | null = null;
    let mustSetPassword = false;

    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Das Passwort muss mindestens 6 Zeichen lang sein." },
          { status: 400 }
        );
      }
      passwordHash = await hashPassword(password);
    } else {
      // User must set password on first login
      mustSetPassword = true;
    }

    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        role: cleanRole,
        passwordHash,
        mustSetPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustSetPassword: true,
        createdAt: true,
      },
    });

    let setupUrl: string | null = null;
    let emailSent = false;

    // Send invitation / password setup link if requested or if no password was set
    const shouldSendEmail = sendInviteEmail !== false && (mustSetPassword || sendInviteEmail === true);
    if (shouldSendEmail) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await prisma.passwordResetToken.create({
        data: {
          email: newUser.email,
          token,
          expiresAt,
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      setupUrl = `${appUrl}/reset-password?token=${token}`;

      try {
        const mailRes = await sendAccountApprovedEmail({
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          setupUrl,
        });
        emailSent = mailRes.success;
      } catch (err) {
        console.error("Failed to send welcome email:", err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: newUser,
        setupUrl,
        emailSent,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Error creating user:", err);
    return NextResponse.json({ error: "Fehler beim Anlegen des Benutzers" }, { status: 500 });
  }
}
