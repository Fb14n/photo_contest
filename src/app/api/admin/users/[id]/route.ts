import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // Delete any old tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const mailRes = await sendPasswordResetEmail(user.email, resetUrl, user.name);

    return NextResponse.json({
      success: true,
      resetUrl,
      emailSent: mailRes.success,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Error sending reset email:", err);
    return NextResponse.json(
      { error: "Fehler beim Versenden des Links" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;
    const body = await req.json();

    const { name, email, role, password } = body;

    const data: Record<string, unknown> = {};

    if (name !== undefined) data.name = name.trim();
    if (email !== undefined) data.email = email.toLowerCase().trim();
    if (role !== undefined && ["ADMIN", "JUROR", "PARTICIPANT"].includes(role)) {
      if (role !== "ADMIN") {
        const targetUser = await prisma.user.findUnique({
          where: { id },
          select: { role: true },
        });
        if (targetUser?.role === "ADMIN") {
          const adminCount = await prisma.user.count({
            where: { role: "ADMIN" },
          });
          if (adminCount <= 1) {
            return NextResponse.json(
              {
                error:
                  "Es muss immer mindestens ein Administrator im System existieren. Dem letzten Administrator kann die Admin-Rolle nicht entzogen werden.",
              },
              { status: 400 }
            );
          }
        }
      }
      data.role = role;
    }
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Das Passwort muss mindestens 6 Zeichen lang sein." },
          { status: 400 }
        );
      }
      data.passwordHash = await hashPassword(password);
      data.mustSetPassword = false;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustSetPassword: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Error updating user:", err);
    return NextResponse.json({ error: "Fehler beim Aktualisieren des Benutzers" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await props.params;

    if (session.userId === id) {
      return NextResponse.json(
        { error: "Du kannst deinen eigenen Administrator-Account nicht löschen." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Es muss immer mindestens ein Administrator im System existieren. Der letzte verbleibende Administrator-Account kann nicht gelöscht werden.",
          },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Error deleting user:", err);
    return NextResponse.json({ error: "Fehler beim Löschen des Benutzers" }, { status: 500 });
  }
}
