import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setAuthCookie } from "@/lib/auth";

export async function GET(
  req: Request,
  props: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await props.params;

    // Check ContestParticipant
    const participant = await prisma.contestParticipant.findUnique({
      where: { inviteToken: token },
      include: {
        contest: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            status: true,
            submissionStart: true,
            submissionEnd: true,
          },
        },
      },
    });

    if (participant) {
      const existingUser = await prisma.user.findUnique({
        where: { email: participant.email },
      });

      return NextResponse.json({
        valid: true,
        type: "PARTICIPANT",
        contest: participant.contest,
        email: participant.email,
        name: participant.name || existingUser?.name || "",
        hasPassword: !!existingUser?.passwordHash,
      });
    }

    // Check ContestJuror
    const juror = await prisma.contestJuror.findUnique({
      where: { inviteToken: token },
      include: {
        contest: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            status: true,
            ratingStart: true,
            ratingEnd: true,
          },
        },
      },
    });

    if (juror) {
      const existingUser = await prisma.user.findUnique({
        where: { email: juror.email },
      });

      return NextResponse.json({
        valid: true,
        type: "JUROR",
        contest: juror.contest,
        email: juror.email,
        name: juror.name || existingUser?.name || "",
        hasPassword: !!existingUser?.passwordHash,
      });
    }

    return NextResponse.json({ valid: false, error: "Ungültiger oder abgelaufener Einladungslink." }, { status: 404 });
  } catch (error) {
    console.error("Invite token check error:", error);
    return NextResponse.json({ error: "Fehler beim Prüfen des Einladungslinks" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await props.params;
    const body = await req.json().catch(() => ({}));
    const { password, name } = body;

    // 1. Participant check
    const participant = await prisma.contestParticipant.findUnique({
      where: { inviteToken: token },
      include: { contest: true },
    });

    if (participant) {
      let user = await prisma.user.findUnique({
        where: { email: participant.email },
      });

      let passwordHash: string | undefined = undefined;
      if (password && password.length >= 6) {
        passwordHash = await hashPassword(password);
      }

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: participant.email,
            name: name?.trim() || participant.name || participant.email.split("@")[0],
            passwordHash: passwordHash || null,
            role: "PARTICIPANT",
            mustSetPassword: !passwordHash,
          },
        });
      } else if (passwordHash) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            mustSetPassword: false,
            name: name?.trim() || user.name,
          },
        });
      }

      // Link participant
      await prisma.contestParticipant.update({
        where: { id: participant.id },
        data: {
          userId: user.id,
          status: "REGISTERED",
        },
      });

      const sessionToken = await createSessionToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      await setAuthCookie(sessionToken);

      return NextResponse.json({
        success: true,
        redirectUrl: `/contests/${participant.contest.slug}`,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    // 2. Juror check
    const juror = await prisma.contestJuror.findUnique({
      where: { inviteToken: token },
      include: { contest: true },
    });

    if (juror) {
      let user = await prisma.user.findUnique({
        where: { email: juror.email },
      });

      let passwordHash: string | undefined = undefined;
      if (password && password.length >= 6) {
        passwordHash = await hashPassword(password);
      }

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: juror.email,
            name: name?.trim() || juror.name || juror.email.split("@")[0],
            passwordHash: passwordHash || null,
            role: "JUROR",
            mustSetPassword: !passwordHash,
          },
        });
      } else {
        const updateData: { role?: string; passwordHash?: string; name?: string; mustSetPassword?: boolean } = {};
        if (user.role === "PARTICIPANT") updateData.role = "JUROR";
        if (passwordHash) {
          updateData.passwordHash = passwordHash;
          updateData.mustSetPassword = false;
        }
        if (name?.trim()) updateData.name = name.trim();

        if (Object.keys(updateData).length > 0) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        }
      }

      await prisma.contestJuror.update({
        where: { id: juror.id },
        data: {
          userId: user.id,
          status: "ACTIVE",
        },
      });

      const sessionToken = await createSessionToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      await setAuthCookie(sessionToken);

      return NextResponse.json({
        success: true,
        redirectUrl: `/contests/${juror.contest.slug}/judge`,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    return NextResponse.json({ error: "Einladungstoken ungültig" }, { status: 404 });
  } catch (error) {
    console.error("Invite claim error:", error);
    return NextResponse.json({ error: "Fehler beim Einlösen des Tokens" }, { status: 500 });
  }
}
