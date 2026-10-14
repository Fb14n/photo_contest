import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Das neue Passwort muss mindestens 6 Zeichen lang sein." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // If user already had a password, verify it
    if (user.passwordHash && currentPassword) {
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Das aktuelle Passwort ist falsch." },
          { status: 400 }
        );
      }
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustSetPassword: false,
      },
    });

    return NextResponse.json({ success: true, message: "Passwort erfolgreich geändert." });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Passwort konnte nicht geändert werden." },
      { status: 500 }
    );
  }
}
