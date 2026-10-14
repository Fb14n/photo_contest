"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Camera, Award, PlusCircle } from "lucide-react";
import Link from "next/link";
import ContestCard, { ContestCardData } from "@/components/ContestCard";

export default function ContestsListPage() {
  const [contests, setContests] = useState<ContestCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    fetch("/api/contests")
      .then((res) => res.json())
      .then((data) => {
        if (data.contests) {
          setContests(data.contests);
        }
      })
      .catch((err) => console.error("Error loading contests:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = contests.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "ALL") return true;
    return c.effectiveStatus === filterStatus;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Fotowettbewerbe</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Finde aktive Wettbewerbe zum Einreichen, Jurieren oder Betrachten der Siegergalerien.
          </p>
        </div>

        {currentUser?.role === "ADMIN" && (
          <Link
            href="/admin/contests/new"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Neuer Wettbewerb
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Wettbewerb suchen..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-neutral-800 bg-neutral-900/50">
          {[
            { id: "ALL", label: "Alle" },
            { id: "SUBMISSION", label: "Einreichung aktiv" },
            { id: "RATING", label: "Jurierung" },
            { id: "FINISHED", label: "Abgeschlossen" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === item.id
                  ? "bg-neutral-800 text-white shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results grid */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl border border-neutral-800 bg-neutral-900/40 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/20 p-12 text-center">
            <Camera className="h-10 w-10 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-base font-medium text-white">Keine Wettbewerbe gefunden</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Es wurden keine Wettbewerbe für diese Filtereinstellungen gefunden.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
