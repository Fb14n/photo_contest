"use client";

import { useState } from "react";
import { Award, Trophy, Medal, Download, BarChart3, Users, Star, MessageSquare } from "lucide-react";

export interface RankedSubmission {
  id: string;
  title: string;
  description?: string | null;
  filePath: string;
  topicId: string;
  topicTitle: string;
  photographerName: string;
  photographerEmail?: string;
  avgScore: number;
  voteCount: number;
  minScore: number;
  maxScore: number;
  ratings?: {
    jurorName: string;
    score: number;
    comment?: string | null;
  }[];
}

export interface JurorProgress {
  email: string;
  name: string;
  ratedCount: number;
  totalSubmissions: number;
  percentage: number;
  status: string;
}

interface StatsViewProps {
  contestTitle: string;
  isAdmin: boolean;
  totalSubmissionsCount: number;
  overallRanking: RankedSubmission[];
  topicRankings: Record<string, RankedSubmission[]>;
  topics: { id: string; title: string }[];
  jurorProgress?: JurorProgress[];
  scoreBuckets: Record<string, number>;
}

export default function StatsView({
  contestTitle,
  isAdmin,
  totalSubmissionsCount,
  overallRanking,
  topicRankings,
  topics,
  jurorProgress,
  scoreBuckets,
}: StatsViewProps) {
  const [activeTab, setActiveTab] = useState<string>("overall");

  const currentList =
    activeTab === "overall" ? overallRanking : topicRankings[activeTab] || [];

  const top3 = currentList.slice(0, 3);
  const remainingList = currentList.slice(3);

  // CSV Export helper
  const handleExportCsv = () => {
    const headers = ["Rang", "Titel", "Thema", "Fotograf", "Durchschnittsnote", "Anzahl_Stimmen", "Min_Note", "Max_Note"];
    const rows = currentList.map((item, idx) => [
      idx + 1,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.topicTitle.replace(/"/g, '""')}"`,
      `"${item.photographerName.replace(/"/g, '""')}"`,
      item.avgScore,
      item.voteCount,
      item.minScore,
      item.maxScore,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${contestTitle.replace(/\s+/g, "_")}_Auswertung.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <Trophy className="h-4 w-4" />
            Ergebnisse & Statistische Auswertung
          </span>
          <h2 className="text-2xl font-black text-white mt-1">{contestTitle}</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Gesamt: {totalSubmissionsCount} eingereichte Bilder
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-neutral-700 hover:border-neutral-600 transition shadow"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            CSV-Export (Excel)
          </button>
        )}
      </div>

      {/* Admin Juror Progress Overview */}
      {isAdmin && jurorProgress && jurorProgress.length > 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-purple-400" />
            Jurierungs-Fortschritt der Jury-Mitglieder
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jurorProgress.map((juror) => (
              <div
                key={juror.email}
                className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{juror.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{juror.email}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      juror.percentage === 100
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {juror.percentage}%
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Bewertet</span>
                  <span>
                    {juror.ratedCount} / {juror.totalSubmissions} Bilder
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${juror.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score distribution histogram */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-sky-400" />
          Notenverteilung (Notenspiegel)
        </h3>
        <div className="grid grid-cols-5 gap-3 text-center">
          {Object.entries(scoreBuckets).map(([bucket, count]) => (
            <div key={bucket} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
              <span className="text-xs text-neutral-400 font-mono">Note {bucket}</span>
              <p className="text-xl font-extrabold text-white mt-1">{count}</p>
              <span className="text-[10px] text-neutral-500">Bilder</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveTab("overall")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "overall"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-850"
          }`}
        >
          <Trophy className="h-4 w-4" />
          Gesamtwertung ({overallRanking.length})
        </button>

        {topics.map((t) => {
          const count = topicRankings[t.id]?.length || 0;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === t.id
                  ? "bg-neutral-800 text-white border border-neutral-700 shadow"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-850"
              }`}
            >
              Thema: {t.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Podium for Top 3 */}
      {top3.length > 0 ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {top3.map((item, index) => {
              const medalStyles = [
                {
                  border: "border-amber-400/50",
                  bg: "bg-amber-500/10",
                  badge: "bg-amber-400 text-neutral-950",
                  label: "1. Platz (Gold)",
                  icon: Trophy,
                  order: "order-1 md:order-2 md:-mt-4", // gold in center
                },
                {
                  border: "border-slate-300/40",
                  bg: "bg-slate-300/10",
                  badge: "bg-slate-300 text-neutral-950",
                  label: "2. Platz (Silber)",
                  icon: Medal,
                  order: "order-2 md:order-1",
                },
                {
                  border: "border-amber-700/40",
                  bg: "bg-amber-700/10",
                  badge: "bg-amber-700 text-white",
                  label: "3. Platz (Bronze)",
                  icon: Award,
                  order: "order-3 md:order-3",
                },
              ][index];

              const Icon = medalStyles.icon;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-2xl border ${medalStyles.border} bg-neutral-900/80 p-5 backdrop-blur shadow-xl ${medalStyles.order}`}
                >
                  <div>
                    {/* Header with rank badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow ${medalStyles.badge}`}
                      >
                        <Icon className="h-4 w-4" />
                        {medalStyles.label}
                      </span>
                      <span className="flex items-center gap-1 text-base font-black text-white">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {item.avgScore.toFixed(2)}
                      </span>
                    </div>

                    {/* Image Preview */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 mb-3 shadow">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.filePath}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    <h4 className="text-base font-bold text-white line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      von <strong className="text-neutral-200">{item.photographerName}</strong>
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                      {item.topicTitle}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-neutral-800/80 pt-3 text-[11px] text-neutral-400 flex justify-between">
                    <span>{item.voteCount} Bewertungen</span>
                    <span>
                      Notenspanne: {item.minScore} – {item.maxScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remaining Submissions Table */}
          {remainingList.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur">
              <div className="px-6 py-4 border-b border-neutral-800">
                <h4 className="text-sm font-bold text-white">Weitere Platzierungen (ab Platz 4)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950/60 text-neutral-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3">Rang</th>
                      <th className="px-6 py-3">Vorschau & Titel</th>
                      <th className="px-6 py-3">Kategorie</th>
                      <th className="px-6 py-3">Fotograf</th>
                      <th className="px-6 py-3 text-right">Durchschnitt</th>
                      <th className="px-6 py-3 text-right">Stimmen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300">
                    {remainingList.map((sub, idx) => (
                      <tr key={sub.id} className="hover:bg-neutral-800/40 transition">
                        <td className="px-6 py-4 font-mono font-bold text-neutral-400">
                          #{idx + 4}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={sub.filePath}
                              alt=""
                              className="h-10 w-14 rounded-lg object-cover border border-neutral-800"
                            />
                            <div>
                              <p className="font-semibold text-white">{sub.title}</p>
                              {sub.description && (
                                <p className="text-[11px] text-neutral-500 line-clamp-1">{sub.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-neutral-400">{sub.topicTitle}</td>
                        <td className="px-6 py-4 font-medium text-neutral-200">
                          {sub.photographerName}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-white text-sm">
                          {sub.avgScore.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-neutral-400">{sub.voteCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center text-neutral-400">
          Keine bewerteten Bilder in dieser Kategorie gefunden.
        </div>
      )}
    </div>
  );
}
