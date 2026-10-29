"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Camera,
  Award,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Sliders,
  FileCheck,
  Lock,
  Layers,
  ChevronRight,
  LogIn,
} from "lucide-react";
import ContestCard, { ContestCardData } from "@/components/ContestCard";

export default function HomePage() {
  const [contests, setContests] = useState<ContestCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoUserLoading, setDemoUserLoading] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; email: string } | null>(null);

  useEffect(() => {
    // Check current user
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    // Fetch contests
    fetch("/api/contests")
      .then((res) => res.json())
      .then((data) => {
        if (data.contests) {
          setContests(data.contests);
        }
      })
      .catch((err) => console.error("Error fetching contests:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleDemoLogin = async (email: string, pass: string) => {
    try {
      setDemoUserLoading(email);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDemoUserLoading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-800 bg-gradient-to-b from-neutral-900/50 via-neutral-950 to-neutral-950 py-16 sm:py-24">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-sky-600/15 via-indigo-600/15 to-purple-600/15 blur-3xl pointer-events-none rounded-full" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-medium text-sky-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fotowettbewerbe online erstellen & jurieren</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl max-w-4xl mx-auto leading-tight">
            Fotowettbewerbe einfach{" "}
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              erstellen, verwalten & jurieren
            </span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg text-neutral-400 leading-relaxed">
            Die Komplettlösung für Fotoclubs, Communities und Veranstalter: Offene oder geschlossene
            Wettbewerbe mit Einladungslinks & QR-Codes, automatische Bildregeln-Prüfung, flexible
            0–10 Punkte Jurierung und detaillierte Statistiken.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contests"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition"
            >
              Wettbewerbe ansehen
              <ArrowRight className="h-4 w-4" />
            </Link>

            {currentUser ? (
              currentUser.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-6 py-3 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition"
                >
                  <Shield className="h-4 w-4 text-purple-400" />
                  Zum Admin-Dashboard
                </Link>
              ) : (
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-6 py-3 text-sm font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
                >
                  <Users className="h-4 w-4 text-sky-400" />
                  Mein Profil & Dashboard
                </Link>
              )
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-6 py-3 text-sm font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
              >
                <LogIn className="h-4 w-4 text-sky-400" />
                Anmelden / Registrieren
              </Link>
            )}
          </div>

          {/* Quick Demo-Login Bar for Local Testing (Only shown if NEXT_PUBLIC_SHOW_DEMO=true) */}
          {process.env.NEXT_PUBLIC_SHOW_DEMO === "true" && (
            <div className="mt-12 mx-auto max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                    Schnelltest-Modus
                  </span>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Mit 1 Klick als vorgefertigte Testrolle anmelden:
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleDemoLogin("admin@fotowettbewerb.local", "Admin123!")}
                    disabled={demoUserLoading !== null}
                    className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition disabled:opacity-50"
                  >
                    {demoUserLoading === "admin@fotowettbewerb.local" ? "Lädt..." : "👑 Admin"}
                  </button>
                  <button
                    onClick={() => handleDemoLogin("juror.anna@fotowettbewerb.local", "Jury123!")}
                    disabled={demoUserLoading !== null}
                    className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition disabled:opacity-50"
                  >
                    {demoUserLoading === "juror.anna@fotowettbewerb.local" ? "Lädt..." : "⚖️ Juror (Anna)"}
                  </button>
                  <button
                    onClick={() => handleDemoLogin("clara.fotografin@fotowettbewerb.local", "User123!")}
                    disabled={demoUserLoading !== null}
                    className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20 transition disabled:opacity-50"
                  >
                    {demoUserLoading === "clara.fotografin@fotowettbewerb.local" ? "Lädt..." : "📷 Teilnehmer (Clara)"}
                  </button>
                </div>
              </div>
              {currentUser && (
                <div className="mt-3 pt-3 border-t border-neutral-800/80 text-xs text-emerald-400 flex items-center justify-between">
                  <span>
                    ✓ Aktuell angemeldet als: <strong>{currentUser.name}</strong> ({currentUser.role})
                  </span>
                  <Link href="/profile" className="text-neutral-400 hover:text-white underline">
                    Profil ansehen
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-neutral-950 border-b border-neutral-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Alles, was du für deinen Fotowettbewerb brauchst
            </h2>
            <p className="mt-3 text-sm text-neutral-400">
              Vollständige Kontrolle für Administratoren, einfaches Einreichen für Fotografen und ein
              fokussierter Raum für Juroren.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 hover:border-neutral-700 transition">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Offen oder Begrenzt mit Einladung</h3>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                Erstelle öffentliche Wettbewerbe per Direktlink oder schränke den Zugang auf eine
                feste Teilnehmeranzahl ein. Hinterlege E-Mail-Listen und erstelle QR-Codes & Magic-Links.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 hover:border-neutral-700 transition">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Themen & Strenge Bildregeln</h3>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                Definiere mehrere Themenkategorien pro Wettbewerb. Validiere Dateigröße,
                Mindest-/Maximalabmessungen, Seitenverhältnisse und lese Kamera-EXIF-Daten direkt aus.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 hover:border-neutral-700 transition">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">0–10 Punkte Jurierung & Ranglisten</h3>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                Juroren bewerten Fotos im Vollbildmodus und können Bewertungen bis Fristende
                jederzeit anpassen. Wähle zwischen Fach-Jury oder Teilnehmer-Bewertung (Peer-Review).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live / Available Contests Section */}
      <section className="py-16 bg-neutral-950 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Aktuelle Wettbewerbe</h2>
              <p className="text-sm text-neutral-400 mt-1">
                Hier siehst du alle laufenden und geplanten Fotowettbewerbe
              </p>
            </div>

            <Link
              href="/contests"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300 transition"
            >
              Alle Wettbewerbe ansehen
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl border border-neutral-800 bg-neutral-900/40 animate-pulse"
                />
              ))}
            </div>
          ) : contests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-12 text-center">
              <Camera className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white">Noch keine Wettbewerbe angelegt</h3>
              <p className="mt-1 text-sm text-neutral-400 max-w-sm mx-auto">
                Melde dich als Administrator an, um den ersten Fotowettbewerb zu konfigurieren.
              </p>
              <Link
                href="/admin/contests/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-400 transition"
              >
                Ersten Wettbewerb erstellen
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contests.slice(0, 6).map((c) => (
                <ContestCard
                  key={c.id}
                  contest={c}
                  isAdmin={currentUser?.role === "ADMIN"}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
