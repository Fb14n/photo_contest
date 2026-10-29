"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Layers,
  FileCheck,
  Users,
  ShieldCheck,
  Award,
  ArrowRight,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize,
  SlidersHorizontal,
  Edit,
  BarChart2,
  Camera,
} from "lucide-react";
import { getStatusBadgeInfo, ContestEffectiveStatus } from "@/lib/contest-status";

interface Topic {
  id: string;
  title: string;
  description?: string | null;
  maxSubmissionsPerUser: number;
  userSubmissionCount?: number;
}

interface ContestDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string | null;
  status: string;
  effectiveStatus: ContestEffectiveStatus;
  accessType: "OPEN" | "INVITE_ONLY";
  maxParticipants?: number | null;
  submissionStart: string;
  submissionEnd: string;
  ratingStart: string;
  ratingEnd: string;
  votingMode: "PEER_REVIEW" | "EXCLUSIVE_JURY";
  anonymousJudging: boolean;
  publicResults?: boolean;
  allowParticipantUploads?: boolean;
  maxFileSizeMb: number;
  allowedFormats: string;
  minWidth?: number | null;
  minHeight?: number | null;
  maxWidth?: number | null;
  maxHeight?: number | null;
  aspectRatio?: string | null;
  namingPattern?: string | null;
  topics: Topic[];
  isParticipant?: boolean;
  isJuror?: boolean;
  userTotalSubmissions?: number;
  _count?: {
    submissions: number;
    participants: number;
    jurors: number;
  };
}

export default function ContestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<{ userId: string; role: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    fetch(`/api/contests/${resolvedParams.slug}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else if (d.contest) setContest(d.contest);
      })
      .catch(() => setError("Wettbewerb konnte nicht geladen werden"))
      .finally(() => setLoading(false));
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 animate-pulse">
        <div className="h-10 w-2/3 bg-neutral-900 rounded-xl mb-4" />
        <div className="h-4 w-1/3 bg-neutral-900 rounded mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-neutral-900 rounded-2xl" />
          <div className="h-96 bg-neutral-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Wettbewerb nicht gefunden</h2>
        <p className="text-sm text-neutral-400 mb-6">{error || "Der angeforderte Wettbewerb existiert nicht."}</p>
        <Link
          href="/contests"
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2 text-sm text-white hover:bg-neutral-700 transition"
        >
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const badge = getStatusBadgeInfo(contest.effectiveStatus);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between mb-6 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Link href="/contests" className="hover:text-white transition">
            Wettbewerbe
          </Link>
          <span>/</span>
          <span className="text-neutral-200 truncate max-w-xs">{contest.title}</span>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/contests/${contest.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:text-white hover:bg-amber-500/20 transition"
            >
              <Edit className="h-3.5 w-3.5" />
              Wettbewerb bearbeiten
            </Link>
            <Link
              href={`/admin/contests/${contest.id}/submissions`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300 hover:text-white hover:bg-purple-500/20 transition"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Fotos einspeisen (Gott-Modus)
            </Link>
            <Link
              href={`/admin/contests/${contest.id}/invites`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200 hover:text-white hover:bg-neutral-700 transition"
            >
              <Users className="h-3.5 w-3.5 text-sky-400" />
              Einladungen
            </Link>
            <Link
              href={`/admin/contests/${contest.id}/stats`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200 hover:text-white hover:bg-neutral-700 transition"
            >
              <BarChart2 className="h-3.5 w-3.5 text-purple-400" />
              Admin-Statistik
            </Link>
          </div>
        )}
      </div>

      {/* Main Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
          >
            {badge.label}
          </span>

          {contest.accessType === "INVITE_ONLY" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
              <Lock className="h-3 w-3" />
              Geschlossen (Nur mit Einladung)
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400">
              Offener Link für alle
            </span>
          )}

          <span className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300">
            {contest.votingMode === "PEER_REVIEW" ? "Peer-Bewertung (Teilnehmer)" : "Exklusive Fach-Jury"}
          </span>

          {contest.anonymousJudging && (
            <span className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-400">
              Anonyme Bewertung
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {contest.title}
        </h1>

        <p className="mt-4 text-base text-neutral-300 max-w-3xl leading-relaxed whitespace-pre-line">
          {contest.description}
        </p>

        {/* Action Button Bar */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-neutral-800/80 pt-6">
          {contest.effectiveStatus === "SUBMISSION" && (
            contest.allowParticipantUploads === false && !isAdmin ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-xs font-medium text-sky-300">
                <Camera className="h-4 w-4 text-sky-400" />
                Fotos werden von der Administration bereitgestellt (Teilnehmer-Uploads deaktiviert)
              </div>
            ) : contest.accessType === "INVITE_ONLY" && !contest.isParticipant && !isAdmin ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-300">
                <Lock className="h-4 w-4 text-amber-400" />
                Geschlossener Wettbewerb (Nur für geladene Teilnehmer)
              </div>
            ) : (
              <Link
                href={`/contests/${contest.slug}/submit`}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition"
              >
                Foto jetzt einreichen
                <ArrowRight className="h-4 w-4" />
              </Link>
            )
          )}

          {contest.effectiveStatus === "RATING" && (
            <Link
              href={`/contests/${contest.slug}/judge`}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition"
            >
              <ShieldCheck className="h-4 w-4" />
              Zur Jurierung (0–10 Punkte)
            </Link>
          )}

          {contest.effectiveStatus === "FINISHED" && (
            contest.publicResults !== false || isAdmin ? (
              <Link
                href={`/contests/${contest.slug}/results`}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition"
              >
                <Award className="h-4 w-4" />
                Sieger & Rangliste ansehen
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-xs font-medium text-neutral-300">
                <Lock className="h-4 w-4 text-neutral-400" />
                Wettbewerb abgeschlossen (Ergebnisse privat)
              </div>
            )
          )}

          {/* Admin Specific Action Buttons */}
          {isAdmin && (
            <>
              <Link
                href={`/admin/contests/${contest.id}/submissions`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin: Fotos einspeisen (Gott-Modus)
              </Link>

              <Link
                href={`/admin/contests/${contest.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition"
              >
                <Edit className="h-3.5 w-3.5 text-amber-400" />
                Wettbewerb bearbeiten
              </Link>

              {contest.effectiveStatus !== "SUBMISSION" && (
                <Link
                  href={`/contests/${contest.slug}/submit`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20 transition"
                >
                  <Camera className="h-3.5 w-3.5 text-sky-400" />
                  Regulär einreichen (Test)
                </Link>
              )}
            </>
          )}

          {currentUser && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3.5 py-2 text-xs font-medium text-sky-300">
              <Camera className="h-4 w-4 text-sky-400" />
              <span>
                Deine Einreichungen: <strong>{contest.userTotalSubmissions ?? 0}</strong>{" "}
                {(contest.userTotalSubmissions ?? 0) === 1 ? "Bild" : "Bilder"} eingereicht
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-neutral-400 ml-auto">
            <span>
              <strong className="text-white font-medium">{contest._count?.submissions || 0}</strong> Fotos
            </span>
            <span>•</span>
            <span>
              <strong className="text-white font-medium">{contest._count?.participants || 0}</strong> Teilnehmer
            </span>
            {contest.votingMode === "EXCLUSIVE_JURY" && (
              <>
                <span>•</span>
                <span>
                  <strong className="text-white font-medium">{contest._count?.jurors || 0}</strong> Juroren
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Topics & Rules */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Topics / Themen */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white">Wettbewerbsthemen</h2>
            </div>
            <p className="text-xs text-neutral-400 mb-6">
              Jeder Teilnehmer kann Fotos zu folgenden vom Administrator festgelegten Themen einreichen:
            </p>

            <div className="space-y-4">
              {contest.topics.map((topic, index) => {
                const userCount = topic.userSubmissionCount ?? 0;
                const isFull = userCount >= topic.maxSubmissionsPerUser;
                const percent = Math.min(100, Math.round((userCount / topic.maxSubmissionsPerUser) * 100));

                return (
                  <div
                    key={topic.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 transition hover:border-neutral-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-xs font-bold text-sky-400">
                          {index + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-white">{topic.title}</h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:self-auto self-start pl-8 sm:pl-0">
                        {currentUser && (
                          <span
                            className={`rounded-md border px-2.5 py-0.5 text-[11px] font-medium flex items-center gap-1.5 ${
                              isFull
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold"
                                : userCount > 0
                                ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                                : "border-neutral-800 bg-neutral-900/80 text-neutral-400"
                            }`}
                          >
                            {isFull && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                            <span>
                              {userCount} von {topic.maxSubmissionsPerUser} von dir eingereicht
                              {isFull && " (Voll)"}
                            </span>
                          </span>
                        )}

                        <span className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[11px] text-neutral-400">
                          Max. {topic.maxSubmissionsPerUser} {topic.maxSubmissionsPerUser === 1 ? "Bild" : "Bilder"} pro Person
                        </span>
                      </div>
                    </div>

                    {topic.description && (
                      <p className="mt-2 text-xs text-neutral-400 pl-8">{topic.description}</p>
                    )}

                    {currentUser && (
                      <div className="mt-3 pl-8 pr-1">
                        <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isFull ? "bg-emerald-500" : "bg-sky-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline and Dates */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Zeitplan & Fristen</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  1. Einreichungsphase
                </span>
                <div className="mt-2 space-y-1 text-xs text-neutral-300">
                  <div>
                    Start: <strong>{formatDate(contest.submissionStart)}</strong>
                  </div>
                  <div>
                    Ende: <strong>{formatDate(contest.submissionEnd)}</strong>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                  2. Jurierungsphase (0-10 Punkte)
                </span>
                <div className="mt-2 space-y-1 text-xs text-neutral-300">
                  <div>
                    Start: <strong>{formatDate(contest.ratingStart)}</strong>
                  </div>
                  <div>
                    Ende: <strong>{formatDate(contest.ratingEnd)}</strong>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-neutral-400">
                  Juroren können vergebene Noten bis Fristende jederzeit überarbeiten.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upload Rules & Guidelines */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Vorgaben & Bildregeln</h2>
            </div>
            <p className="text-xs text-neutral-400 mb-5">
              Beim Upload werden folgende Parameter automatisch technisch geprüft:
            </p>

            <ul className="space-y-3 text-xs">
              <li className="flex items-start justify-between border-b border-neutral-800/80 pb-2.5">
                <span className="text-neutral-400">Maximale Dateigröße:</span>
                <strong className="text-white font-medium">{contest.maxFileSizeMb} MB</strong>
              </li>

              <li className="flex items-start justify-between border-b border-neutral-800/80 pb-2.5">
                <span className="text-neutral-400">Erlaubte Formate:</span>
                <span className="text-sky-400 font-mono text-[11px]">
                  {contest.allowedFormats.replace(/image\//g, "").toUpperCase()}
                </span>
              </li>

              <li className="flex items-start justify-between border-b border-neutral-800/80 pb-2.5">
                <span className="text-neutral-400">Mindestauflösung:</span>
                <strong className="text-white font-medium">
                  {contest.minWidth && contest.minHeight
                    ? `${contest.minWidth} × ${contest.minHeight} px`
                    : "Keine Beschränkung"}
                </strong>
              </li>

              <li className="flex items-start justify-between border-b border-neutral-800/80 pb-2.5">
                <span className="text-neutral-400">Maximalauflösung:</span>
                <strong className="text-white font-medium">
                  {contest.maxWidth && contest.maxHeight
                    ? `${contest.maxWidth} × ${contest.maxHeight} px`
                    : "Keine Obergrenze"}
                </strong>
              </li>

              <li className="flex items-start justify-between border-b border-neutral-800/80 pb-2.5">
                <span className="text-neutral-400">Seitenverhältnis:</span>
                <strong className="text-white font-medium">
                  {contest.aspectRatio && contest.aspectRatio !== "free"
                    ? `${contest.aspectRatio} (Hoch- oder Querformat)`
                    : "Frei wählbar"}
                </strong>
              </li>

              {contest.namingPattern && (
                <li className="flex flex-col gap-1 border-b border-neutral-800/80 pb-2.5">
                  <span className="text-neutral-400">Dateinamens-Muster:</span>
                  <code className="text-[11px] text-amber-400 bg-neutral-950 px-2 py-1 rounded">
                    {contest.namingPattern}
                  </code>
                </li>
              )}
            </ul>
          </div>

          {/* Quick Action Card (Phase-dependent) */}
          {contest.effectiveStatus === "SUBMISSION" && (
            <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent p-6">
              <h3 className="text-sm font-semibold text-white mb-2">
                {contest.allowParticipantUploads === false ? "Vorbereitung / Uploads aktiv" : "Einreichung aktiv"}
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                {contest.allowParticipantUploads === false
                  ? "Die Fotos für diesen Wettbewerb werden von der Administration bereitgestellt. Teilnehmer-Uploads sind deaktiviert."
                  : currentUser
                  ? `Reiche deine besten Fotos zu den Themen ein. Angemeldet als ${currentUser.email}.`
                  : "Melde dich an, um eigene Fotos zu den Themen einzureichen."}
              </p>

              {isAdmin && (
                <Link
                  href={`/admin/contests/${contest.id}/submissions`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-purple-500 transition mb-2.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin: Fotos einspeisen (Gott-Modus)
                </Link>
              )}

              {contest.allowParticipantUploads === false && !isAdmin ? (
                <div className="w-full text-center rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-2.5 text-xs font-medium text-sky-300">
                  Jurierung startet in Kürze
                </div>
              ) : currentUser ? (
                contest.accessType === "INVITE_ONLY" && !contest.isParticipant && !isAdmin ? (
                  <div className="w-full text-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-300">
                    Geschlossener Wettbewerb
                  </div>
                ) : (
                  <Link
                    href={`/contests/${contest.slug}/submit`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400 transition"
                  >
                    Foto jetzt einreichen
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )
              ) : (
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-neutral-700 transition"
                >
                  Jetzt Anmelden / Registrieren
                </Link>
              )}
            </div>
          )}

          {contest.effectiveStatus === "RATING" && (
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent p-6">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <ShieldCheck className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-white">Jurierungsphase aktiv</h3>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                Die Einreichungsfrist ist beendet. Die eingereichten Fotos werden nun von der Fach-Jury bewertet.
              </p>

              {contest.isJuror || isAdmin ? (
                <Link
                  href={`/contests/${contest.slug}/judge`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-purple-500 transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Zur Jurierung (0–10 Punkte)
                </Link>
              ) : (
                <div className="w-full text-center rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-xs font-medium text-purple-300">
                  Jurierung läuft
                </div>
              )}
            </div>
          )}

          {contest.effectiveStatus === "FINISHED" && (
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent p-6">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Award className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-white">Wettbewerb beendet</h3>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                {contest.publicResults !== false || isAdmin
                  ? "Alle Bewertungen sind abgeschlossen. Entdecke jetzt die Sieger und die finale Rangliste!"
                  : "Die Bewertungen wurden abgeschlossen. Die Ergebnisse werden exklusiv durch die Wettbewerbsleitung ausgewertet."}
              </p>

              {contest.publicResults !== false || isAdmin ? (
                <Link
                  href={`/contests/${contest.slug}/results`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
                >
                  <Award className="h-3.5 w-3.5" />
                  Sieger & Rangliste ansehen
                </Link>
              ) : (
                <div className="w-full text-center rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-2.5 text-xs font-medium text-neutral-400">
                  Ergebnisse privat (nur Admin)
                </div>
              )}
            </div>
          )}

          {contest.effectiveStatus === "UPCOMING" && (
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-6">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Clock className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-white">Startet in Kürze</h3>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                Die Einreichungsphase beginnt am {new Date(contest.submissionStart).toLocaleDateString("de-DE")}.
              </p>
              {!currentUser && (
                <Link
                  href="/register"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-neutral-700 transition"
                >
                  Jetzt registrieren
                </Link>
              )}
            </div>
          )}

          {(contest.effectiveStatus === "DRAFT" || contest.effectiveStatus === "ARCHIVED") && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
              <h3 className="text-sm font-semibold text-white mb-2">Wettbewerb nicht aktiv</h3>
              <p className="text-xs text-neutral-400">
                Dieser Wettbewerb ist derzeit als {contest.effectiveStatus === "DRAFT" ? "Entwurf" : "Archiviert"} markiert.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
