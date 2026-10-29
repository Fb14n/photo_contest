import { NextResponse } from "next/server";
import { createGateToken, GATE_COOKIE_NAME, isGateEnabled, verifySitePassword } from "@/lib/gate";

export async function GET() {
  return NextResponse.json({
    enabled: isGateEnabled(),
  });
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!isGateEnabled()) {
      return NextResponse.json({ success: true, message: "Gate disabled" });
    }

    if (!password || !verifySitePassword(password)) {
      return NextResponse.json(
        { error: "Falsches Zugangspasswort. Bitte versuche es erneut." },
        { status: 401 }
      );
    }

    const token = await createGateToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set(GATE_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err) {
    console.error("Gate auth error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
