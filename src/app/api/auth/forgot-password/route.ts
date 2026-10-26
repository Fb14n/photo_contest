import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Bitte eine gültige E-Mail-Adresse angeben." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    // Always return a neutral success message for security, but only create token if user exists
    if (user) {
      // Delete any previous tokens for this email
      await prisma.passwordResetToken.deleteMany({
        where: { email: cleanEmail },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          email: cleanEmail,
          token,
          expiresAt,
        },
      });

      const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetUrl = `${host}/reset-password?token=${token}`;

      await sendPasswordResetEmail(cleanEmail, resetUrl, user.name);
    }

    return NextResponse.json({
      success: true,
      message: "Falls ein Account mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen gesendet.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Fehler beim Verarbeiten der Anfrage." },
      { status: 500 }
    );
  }
}
