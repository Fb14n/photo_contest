import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAccountRequestNotificationToAdmin } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { name, email, reason } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Bitte gib deinen Namen und deine E-Mail-Adresse an." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanReason = reason ? String(reason).trim() : null;

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Bitte gib eine gültige E-Mail-Adresse an." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Für diese E-Mail-Adresse existiert bereits ein Benutzerkonto. Bitte melde dich an." },
        { status: 409 }
      );
    }

    // Check if request is already pending
    const existingRequest = await prisma.accountRequest.findUnique({
      where: { email: cleanEmail },
    });

    if (existingRequest && existingRequest.status === "PENDING") {
      return NextResponse.json(
        { error: "Für diese E-Mail-Adresse liegt bereits eine offene Anfrage vor. Ein Administrator wird diese in Kürze bearbeiten." },
        { status: 409 }
      );
    }

    // Upsert or create new request
    const request = await prisma.accountRequest.upsert({
      where: { email: cleanEmail },
      create: {
        name: cleanName,
        email: cleanEmail,
        reason: cleanReason,
        status: "PENDING",
      },
      update: {
        name: cleanName,
        reason: cleanReason,
        status: "PENDING",
      },
    });

    // Notify admin asynchronously
    try {
      await sendAccountRequestNotificationToAdmin({
        name: cleanName,
        email: cleanEmail,
        reason: cleanReason,
      });
    } catch (err) {
      console.error("Failed to send admin notification email:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Konto-Anfrage erfolgreich eingereicht.",
      id: request.id,
    });
  } catch (err) {
    console.error("Error creating account request:", err);
    return NextResponse.json(
      { error: "Fehler beim Absenden der Anfrage. Bitte versuche es später erneut." },
      { status: 500 }
    );
  }
}
