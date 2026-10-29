import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const requests = await prisma.accountRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Error fetching account requests:", err);
    return NextResponse.json({ error: "Fehler beim Laden der Anfragen" }, { status: 500 });
  }
}
