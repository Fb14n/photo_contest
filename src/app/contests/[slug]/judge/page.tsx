"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  Lock,
  Clock,
  Sparkles,
  Camera,
  CheckCircle,
} from "lucide-react";
import JuryEvaluationRoom, { JurySubmission } from "@/components/JuryEvaluationRoom";

export default function JudgeContestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [contest, setContest] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; role: string; name: string } | null>(null);
  const [submissions, setSubmissions] = useState<JurySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      // 1. Session check
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (!authData.user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      setCurrentUser(authData.user);

      // 2. Contest details
      const contestRes = await fetch(`/api/contests/${resolvedParams.slug}`);
      const contestData = await contestRes.json();
      if (contestData.error) {
        setError(contestData.error);
        setLoading(false);
        return;
      }
      setContest(contestData.contest);

      // 3. Submissions for jury evaluation (excluding juror's own submissions)
      const subRes = await fetch(`/api/contests/${contestData.contest.id}/submissions?forJudging=true`);
      const subData = await subRes.json();
      if (subData.submissions) {
        setSubmissions(subData.submissions);
      }
    } catch {
      setError("Fehler beim Laden des Jurierungsbereichs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center animate-pulse">
        <div className="h-8 w-64 bg-neutral-900 rounded mx-auto mb-4" />
        <div className="h-96 bg-neutral-900/60 rounded-3xl" />
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-5">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Juror-Anmeldung erforderlich</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Melde dich mit deinem Jury-Account an, um Zugang zur Punktevergabe zu erhalten.
        </p>
        <Link
          href="/login"
          className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">{error || "Wettbewerb nicht gefunden"}</h2>
        <Link href="/contests" className="text-xs text-sky-400 hover:underline">
          Zurück zu allen Wettbewerben
        </Link>
      </div>
    );
  }

  const isAdmin = currentUser.role === "ADMIN";
  const isJuror = contest.isJuror || isAdmin;

  // Authorization check
  if (!isJuror) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Kein Juror-Zugang</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Dieser Wettbewerb nutzt eine exklusive Fach-Jury. Dein Account ({currentUser.email}) ist nicht
          als Juror für diesen Wettbewerb eingeteilt.
        </p>
        <Link
          href={`/contests/${contest.slug}`}
          className="rounded-xl bg-neutral-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition"
        >
          Zurück zur Wettbewerbsseite
        </Link>
      </div>
    );
  }

  // Phase check
  if (!isAdmin && contest.effectiveStatus !== "RATING") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="h-14 w-14 rounded-2xl bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-5">
          <Clock className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {contest.effectiveStatus === "FINISHED"
            ? "Jurierung ist abgeschlossen"
            : "Jurierungsphase noch nicht gestartet"}
        </h2>
        <p className="text-sm text-neutral-400 mb-6">
          {contest.effectiveStatus === "FINISHED"
            ? "Die Frist für die Punktevergabe ist abgelaufen. Die Ergebnisse stehen nun fest."
            : `Die Bewertung startet erst am ${new Date(contest.ratingStart).toLocaleString("de-DE")}.`}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href={`/contests/${contest.slug}`}
            className="rounded-xl bg-neutral-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition"
          >
            Details ansehen
          </Link>
          {contest.effectiveStatus === "FINISHED" && (
            <Link
              href={`/contests/${contest.slug}/results`}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
            >
              Rangliste ansehen
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Camera className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Keine Bilder vorhanden</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Für diesen Wettbewerb wurden bisher keine Bilder eingereicht, die juriert werden können.
        </p>
        <Link
          href={`/contests/${contest.slug}`}
          className="rounded-xl bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition"
        >
          Zurück zum Wettbewerb
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <Link href={`/contests/${contest.slug}`} className="hover:text-white transition flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              {contest.title}
            </Link>
            <span>/</span>
            <span className="text-purple-400">Jury-Bewertung</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-purple-400" />
            Jurierungsraum (0 – 10 Punkte)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300">
            Juror: <strong className="text-white">{currentUser.name}</strong> ({currentUser.email})
          </div>
        </div>
      </div>

      {/* Main interactive evaluation room */}
      <JuryEvaluationRoom
        contestId={contest.id}
        contestTitle={contest.title}
        votingMode={contest.votingMode}
        anonymousJudging={contest.anonymousJudging}
        submissions={submissions}
        topics={contest.topics}
        onRatingSaved={() => {
          loadData();
        }}
      />
    </div>
  );
}
