"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, BarChart2, AlertCircle } from "lucide-react";
import StatsView from "@/components/StatsView";

export default function AdminContestStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  const [contest, setContest] = useState<any | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch contest
    fetch(`/api/contests/${resolvedParams.id}`)
      .then((res) => res.json())
      .then(async (cData) => {
        if (cData.error) {
          setError(cData.error);
          setLoading(false);
          return;
        }
        setContest(cData.contest);

        // 2. Fetch admin stats
        const statsRes = await fetch(`/api/contests/${cData.contest.id}/stats`);
        const sData = await statsRes.json();
        if (sData.error) {
          setError(sData.error);
        } else {
          setStats(sData);
        }
      })
      .catch(() => setError("Fehler beim Laden der Admin-Statistiken"))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center animate-pulse">
        <div className="h-8 w-64 bg-neutral-900 rounded mx-auto mb-4" />
        <div className="h-96 bg-neutral-900/60 rounded-3xl" />
      </div>
    );
  }

  if (error || !stats || !contest) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">{error || "Statistiken nicht verfügbar"}</h2>
        <Link href="/admin" className="text-xs text-purple-400 hover:underline">
          Zurück zum Admin-Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
        <Link href="/admin" className="hover:text-white transition flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Admin Dashboard
        </Link>
        <span>/</span>
        <span className="text-purple-400">Statistiken & Jury-Fortschritt</span>
      </div>

      <StatsView
        contestTitle={contest.title}
        isAdmin={true}
        totalSubmissionsCount={stats.totalSubmissionsCount}
        overallRanking={stats.overallRanking}
        topicRankings={stats.topicRankings}
        topics={contest.topics}
        jurorProgress={stats.jurorProgress}
        scoreBuckets={stats.scoreBuckets}
      />
    </div>
  );
}
