import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings";

export async function GET() {
  try {
    await requireAdmin();
    const settings = getSiteSettings();
    return NextResponse.json({
      success: true,
      settings: {
        gateEnabled: settings.gateEnabled,
        gatePassword: settings.gatePassword || "",
        updatedAt: settings.updatedAt || null,
        updatedBy: settings.updatedBy || null,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Error fetching admin settings:", err);
    return NextResponse.json({ error: "Fehler beim Laden der Einstellungen" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { gateEnabled, gatePassword } = body;

    if (typeof gateEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Ungültiger Status für den Passwortschutz." },
        { status: 400 }
      );
    }

    if (gateEnabled && (!gatePassword || typeof gatePassword !== "string" || gatePassword.trim().length === 0)) {
      return NextResponse.json(
        { error: "Bitte gib ein Hauptpasswort ein, wenn der Website-Schutz aktiviert ist." },
        { status: 400 }
      );
    }

    const updated = saveSiteSettings({
      gateEnabled,
      gatePassword: gatePassword ? gatePassword.trim() : "",
      updatedBy: session.email,
    });

    return NextResponse.json({
      success: true,
      settings: {
        gateEnabled: updated.gateEnabled,
        gatePassword: updated.gatePassword,
        updatedAt: updated.updatedAt,
        updatedBy: updated.updatedBy,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Error updating admin settings:", err);
    return NextResponse.json({ error: "Fehler beim Speichern der Einstellungen" }, { status: 500 });
  }
}
