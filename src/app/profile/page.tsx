"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  KeyRound,
  CheckCircle,
  AlertCircle,
  LogOut,
  ArrowLeft,
  Camera,
  Trophy,
  Scale,
  Calendar,
  Layers,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { getStatusBadgeInfo } from "@/lib/contest-status";

interface UserSubmission {
  id: string;
  title: string;
  description?: string | null;
  filePath: string;
  width: number;
  height: number;
  aspectRatio?: string | null;
  createdAt: string;
  contestId: string;
  contestTitle: string;
  contestSlug: string;
  contestStatus: string;
  topicTitle: string;
  ratingsCount: number;
}

interface ContestSummary {
  id: string;
  title: string;
  slug: string;
  status: string;
  effectiveStatus: any;
  submissionStart: string;
  submissionEnd: string;
  ratingStart: string;
  ratingEnd: string;
  myStatus?: string;
  juryStatus?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"submissions" | "contests" | "jury" | "security">("submissions");
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [myContests, setMyContests] = useState<ContestSummary[]>([]);
  const [juryContests, setJuryContests] = useState<ContestSummary[]>([]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/user/dashboard").then((res) => res.json()),
    ])
      .then(([meData, dashData]) => {
        if (meData.user) setUser(meData.user);
        if (dashData.submissions) setSubmissions(dashData.submissions);
        if (dashData.myContests) setMyContests(dashData.myContests);
        if (dashData.juryContests) setJuryContests(dashData.juryContests);
      })
      .catch((err) => console.error("Error loading profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Die Passwörter stimmen nicht überein.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Fehler beim Ändern des Passworts.");
      } else {
        setSuccessMessage("Passwort erfolgreich geändert!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch {
      setErrorMessage("Netzwerkfehler");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center animate-pulse">
        <div className="h-8 w-48 bg-neutral-900 rounded mx-auto mb-4" />
        <div className="h-64 bg-neutral-900/60 rounded-3xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <User className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Nicht angemeldet</h2>
        <p className="text-xs text-neutral-400 mb-6">Bitte melde dich an, um dein Profil zu verwalten.</p>
        <Link
          href="/login"
          className="rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-sky-400 transition"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
        <Link href="/" className="hover:text-white transition flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Startseite
        </Link>
        <span>/</span>
        <span className="text-neutral-200">Mein Profil & Dashboard</span>
      </div>

      {/* User Header Banner */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 backdrop-blur-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white text-2xl font-black shadow-lg shadow-sky-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user.name}</h1>
            <p className="text-xs text-neutral-400 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="rounded-md bg-neutral-800 border border-neutral-700 px-2.5 py-0.5 text-[11px] font-semibold text-sky-400">
                {user.role === "ADMIN" ? "Administrator" : user.role === "JUROR" ? "Juror" : "Teilnehmer"}
              </span>
              <span className="text-xs text-neutral-500">•</span>
              <span className="text-xs text-neutral-400">{submissions.length} Foto(s) eingereicht</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-300 hover:text-rose-400 hover:bg-neutral-800 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          Abmelden
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-8 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("submissions")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "submissions"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>Meine Fotos ({submissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("contests")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "contests"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Meine Wettbewerbe ({myContests.length})</span>
        </button>

        {(user.role === "JUROR" || user.role === "ADMIN" || juryContests.length > 0) && (
          <button
            onClick={() => setActiveTab("jury")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "jury"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>Jury-Aufgaben ({juryContests.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "security"
              ? "bg-neutral-800 text-white border border-neutral-700"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Sicherheit & Passwort</span>
        </button>
      </div>

      {/* Tab 1: Meine Fotos */}
      {activeTab === "submissions" && (
        <div className="space-y-6">
          {submissions.length === 0 ? (
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
              <Camera className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
              <h3 className="text-base font-bold text-white">Noch keine Fotos eingereicht</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Du hast bisher noch keine Fotos zu einem aktiven Wettbewerb hochgeladen. Schau dir die offenen Wettbewerbe an und nimm teil!
              </p>
              <div className="mt-5">
                <Link
                  href="/contests"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-400 transition"
                >
                  Zu den Wettbewerben
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((sub) => {
                const badge = getStatusBadgeInfo(sub.contestStatus as any);
                return (
                  <div
                    key={sub.id}
                    className="group rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden hover:border-neutral-700 transition flex flex-col"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sub.filePath}
                        alt={sub.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur border border-white/10">
                          {sub.topicTitle}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition truncate">
                          {sub.title}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5 truncate">{sub.contestTitle}</p>
                        <div className="text-[11px] text-neutral-500 mt-2 font-mono">
                          {sub.width} × {sub.height} px • {new Date(sub.createdAt).toLocaleDateString("de-DE")}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-400">
                          Stimmen: <strong className="text-white">{sub.ratingsCount}</strong>
                        </span>

                        <Link
                          href={`/contests/${sub.contestSlug}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300 transition"
                        >
                          Wettbewerb
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Meine Wettbewerbe */}
      {activeTab === "contests" && (
        <div className="space-y-4">
          {myContests.length === 0 ? (
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
              <h3 className="text-base font-bold text-white">Keine aktiven Wettbewerbe</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Du bist derzeit noch bei keinem Wettbewerb als Teilnehmer eingetragen.
              </p>
              <div className="mt-5">
                <Link
                  href="/contests"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-400 transition"
                >
                  Alle Wettbewerbe anzeigen
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/80 rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
              {myContests.map((c) => {
                const badge = getStatusBadgeInfo(c.effectiveStatus);
                const isSubmitting = c.effectiveStatus === "SUBMISSION";
                const isFinished = c.effectiveStatus === "FINISHED";

                return (
                  <div key={c.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-900/60 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                        <h3 className="text-sm font-bold text-white">{c.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-neutral-400">
                        <span>Einreichungsfrist: {new Date(c.submissionEnd).toLocaleDateString("de-DE")}</span>
                        <span>•</span>
                        <span>Jurierung bis: {new Date(c.ratingEnd).toLocaleDateString("de-DE")}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isSubmitting && (
                        <Link
                          href={`/contests/${c.slug}/submit`}
                          className="rounded-xl bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-400 transition"
                        >
                          Foto einreichen
                        </Link>
                      )}
                      {isFinished && (
                        <Link
                          href={`/contests/${c.slug}/results`}
                          className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                        >
                          Ergebnisse ansehen
                        </Link>
                      )}
                      <Link
                        href={`/contests/${c.slug}`}
                        className="rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white transition"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Jury-Aufgaben */}
      {activeTab === "jury" && (
        <div className="space-y-4">
          {juryContests.length === 0 ? (
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
              <Scale className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
              <h3 className="text-base font-bold text-white">Keine Jury-Einteilungen</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Du bist derzeit für keinen Wettbewerb als Juror zugewiesen.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/80 rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
              {juryContests.map((c) => {
                const badge = getStatusBadgeInfo(c.effectiveStatus);
                const isRatingActive = c.effectiveStatus === "RATING";

                return (
                  <div key={c.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-900/60 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                        <h3 className="text-sm font-bold text-white">{c.title}</h3>
                      </div>
                      <p className="text-xs text-neutral-400">
                        Bewertungszeitraum: {new Date(c.ratingStart).toLocaleDateString("de-DE")} bis {new Date(c.ratingEnd).toLocaleDateString("de-DE")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Link
                        href={`/contests/${c.slug}/judge`}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${
                          isRatingActive
                            ? "bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/20"
                            : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        }`}
                      >
                        {isRatingActive ? "Zum Jurierungsraum (0–10)" : "Vorschau Jurierungsraum"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Sicherheit & Passwort */}
      {activeTab === "security" && (
        <div className="max-w-xl mx-auto rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="h-4 w-4 text-purple-400" />
            <h2 className="text-base font-bold text-white">Passwort ändern</h2>
          </div>

          {successMessage && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Aktuelles Passwort (falls vergeben)
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Neues Passwort
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Neues Passwort wiederholen
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition disabled:opacity-50"
            >
              {isSaving ? "Wird gespeichert..." : "Passwort aktualisieren"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
