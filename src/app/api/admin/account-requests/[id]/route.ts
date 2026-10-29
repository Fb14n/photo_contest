import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { sendAccountApprovedEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;
    const body = await req.json();
    const { action, role, initialPassword } = body;

    const request = await prisma.accountRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ error: "Anfrage nicht gefunden" }, { status: 404 });
    }

    if (action === "REJECT") {
      const updated = await prisma.accountRequest.update({
        where: { id },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ success: true, request: updated });
    }

    if (action === "APPROVE") {
      const targetRole = ["ADMIN", "JUROR", "PARTICIPANT"].includes(role)
        ? role
        : "PARTICIPANT";

      // 1. Create or update user
      let passwordHash: string | null = null;
      let mustSetPassword = false;

      if (initialPassword && initialPassword.trim().length >= 6) {
        passwordHash = await hashPassword(initialPassword.trim());
      } else {
        mustSetPassword = true;
      }

      const user = await prisma.user.upsert({
        where: { email: request.email },
        create: {
          name: request.name,
          email: request.email,
          role: targetRole,
          passwordHash,
          mustSetPassword,
        },
        update: {
          name: request.name,
          role: targetRole,
          ...(passwordHash ? { passwordHash, mustSetPassword: false } : {}),
        },
      });

      // 2. Generate a password reset/activation token valid for 7 days
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
      const setupUrl = `${appUrl}/reset-password?token=${token}`;

      // 3. Send email to user
      try {
        await sendAccountApprovedEmail({
          email: user.email,
          name: user.name,
          role: user.role,
          setupUrl,
        });
      } catch (err) {
        console.error("Failed to send approval email:", err);
      }

      // 4. Update request status to APPROVED
      const updatedRequest = await prisma.accountRequest.update({
        where: { id },
        data: { status: "APPROVED" },
      });

      return NextResponse.json({
        success: true,
        request: updatedRequest,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        setupUrl,
      });
    }

    return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Error managing account request:", err);
    return NextResponse.json({ error: "Fehler beim Bearbeiten der Anfrage" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;

    await prisma.accountRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Error deleting account request:", err);
    return NextResponse.json({ error: "Fehler beim Löschen der Anfrage" }, { status: 500 });
  }
}
