import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Ungültiger oder fehlender Token." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Das Passwort muss mindestens 6 Zeichen lang sein." },
        { status: 400 }
      );
    }

    // Find token in database
    const resetEntry = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetEntry || resetEntry.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen. Bitte fordere einen neuen an." },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: resetEntry.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Benutzerkonto nicht gefunden." },
        { status: 404 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Update user password and clear mustSetPassword flag
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustSetPassword: false,
      },
    });

    // Delete token
    await prisma.passwordResetToken.delete({
      where: { id: resetEntry.id },
    });

    // Automatically log user in
    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setAuthCookie(sessionToken);

    return NextResponse.json({
      success: true,
      message: "Passwort erfolgreich geändert.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Fehler beim Zurücksetzen des Passworts." },
      { status: 500 }
    );
  }
}
