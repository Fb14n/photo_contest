"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Award, ArrowLeft, AlertCircle, Clock, BarChart3, Users, Lock } from "lucide-react";
import StatsView from "@/components/StatsView";

export default function ContestResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);

  const [stats, setStats] = useState<any | null>(null);
  const [contest, setContest] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    // First fetch contest info to get id
    fetch(`/api/contests/${resolvedParams.slug}`)
      .then((res) => res.json())
      .then(async (cData) => {
        if (cData.error) {
          setError(cData.error);
          setLoading(false);
          return;
        }
        setContest(cData.contest);

        // Fetch statistics
        const statsRes = await fetch(`/api/contests/${cData.contest.id}/stats`);
        const sData = await statsRes.json();
        if (sData.error) {
          setError(sData.error);
        } else {
          setStats(sData);
        }
      })
      .catch(() => setError("Ergebnisse konnten nicht geladen werden"))
      .finally(() => setLoading(false));
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center animate-pulse">
        <div className="h-8 w-60 bg-neutral-900 rounded mx-auto mb-4" />
        <div className="h-96 bg-neutral-900/50 rounded-3xl" />
      </div>
    );
  }

  if (error || !stats || !contest) {
    const isRestricted = contest && !contest.publicResults && currentUser?.role !== "ADMIN";
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          isRestricted ? "bg-purple-500/10 text-purple-400" : "bg-amber-500/10 text-amber-400"
        }`}>
          {isRestricted ? <Lock className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          {isRestricted ? "Ergebnisse nicht öffentlich" : "Rangliste noch nicht verfügbar"}
        </h2>
        <p className="text-sm text-neutral-400 mb-6">
          {isRestricted
            ? "Die Auswertung und Rangliste dieses Wettbewerbs wird exklusiv durch die Wettbewerbsleitung eingesehen und ist nicht für Teilnehmer freigegeben."
            : error || "Die Ergebnisse werden erst nach Abschluss der Bewertungsphase freigeschaltet."}
        </p>
        <Link
          href={`/contests/${resolvedParams.slug}`}
          className="rounded-xl bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition"
        >
          Zurück zum Wettbewerb
        </Link>
      </div>
    );
  }

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
        <Link href={`/contests/${contest.slug}`} className="hover:text-white transition flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          {contest.title}
        </Link>
        <span>/</span>
        <span className="text-emerald-400">Ergebnisse & Rangliste</span>
      </div>

      <StatsView
        contestTitle={contest.title}
        isAdmin={isAdmin}
        totalSubmissionsCount={stats.totalSubmissionsCount}
        overallRanking={stats.overallRanking}
        topicRankings={stats.topicRankings}
        topics={contest.topics}
        jurorProgress={isAdmin ? stats.jurorProgress : undefined}
        scoreBuckets={stats.scoreBuckets}
      />
    </div>
  );
}
