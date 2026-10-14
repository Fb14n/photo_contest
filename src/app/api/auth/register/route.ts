import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name, contestId } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Bitte Name, E-Mail und Passwort angeben." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Das Passwort muss mindestens 6 Zeichen lang sein." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name.trim(),
        passwordHash,
        role: "PARTICIPANT",
      },
    });

    // If a contestId was passed, automatically register as participant in that contest
    if (contestId) {
      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        include: { _count: { select: { participants: true } } },
      });

      if (contest) {
        if (contest.maxParticipants && contest._count.participants >= contest.maxParticipants) {
          // Limit reached
        } else {
          await prisma.contestParticipant.upsert({
            where: {
              contestId_email: {
                contestId: contest.id,
                email: cleanEmail,
              },
            },
            create: {
              contestId: contest.id,
              userId: user.id,
              email: cleanEmail,
              name: user.name,
              status: "REGISTERED",
            },
            update: {
              userId: user.id,
              status: "REGISTERED",
            },
          });
        }
      }
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Registrierung fehlgeschlagen." },
      { status: 500 }
    );
  }
}
