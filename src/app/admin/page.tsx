"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  PlusCircle,
  Camera,
  Users,
  Award,
  Calendar,
  BarChart2,
  Edit,
  Trash2,
  ExternalLink,
  QrCode,
  Lock,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { getStatusBadgeInfo, ContestEffectiveStatus } from "@/lib/contest-status";

interface AdminContest {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  effectiveStatus: ContestEffectiveStatus;
  accessType: string;
  votingMode: string;
  submissionStart: string;
  submissionEnd: string;
  ratingStart: string;
  ratingEnd: string;
  _count: {
    submissions: number;
    participants: number;
    jurors: number;
  };
  topics: { id: string; title: string }[];
}

export default function AdminDashboardPage() {
  const [contests, setContests] = useState<AdminContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: string; email: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [contestToDelete, setContestToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingContest, setIsDeletingContest] = useState(false);

  const loadContests = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      setCurrentUser(authData.user);

      if (authData.user?.role !== "ADMIN") {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/contests");
      const data = await res.json();
      if (data.contests) {
        setContests(data.contests);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContests();
  }, []);

  const handleDeleteContest = (id: string, title: string) => {
    setContestToDelete({ id, title });
  };

  const handleConfirmDeleteContest = async () => {
    if (!contestToDelete) return;
    const { id, title } = contestToDelete;

    try {
      setIsDeletingContest(true);
      setDeletingId(id);
      const res = await fetch(`/api/contests/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Wettbewerb "${title}" wurde erfolgreich gelöscht.`);
        setTimeout(() => setActionSuccess(null), 3000);
        setContestToDelete(null);
        await loadContests();
      } else {
        alert(data.error || "Löschen fehlgeschlagen");
      }
    } catch {
      alert("Fehler beim Löschen des Wettbewerbs");
    } finally {
      setIsDeletingContest(false);
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 animate-pulse">
        <div className="h-8 w-64 bg-neutral-900 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-neutral-900/60 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-neutral-900/40 rounded-2xl" />
      </div>
    );
  }

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Shield className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Zugriff verweigert</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Dieser Bereich ist nur für Administratoren zugänglich. Bitte melde dich mit einem Administrator-Konto an.
        </p>
        <Link
          href="/login"
          className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  // Summary statistics
  const totalContests = contests.length;
  const activeSubmissions = contests.filter((c) => c.effectiveStatus === "SUBMISSION").length;
  const activeRating = contests.filter((c) => c.effectiveStatus === "RATING").length;
  const totalImages = contests.reduce((acc, c) => acc + (c._count?.submissions || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 mb-2">
            <Shield className="h-3.5 w-3.5" />
            Admin-Kontrollzentrum
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Wettbewerbe verwalten
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Erstelle neue Fotowettbewerbe, verwalte Teilnehmer & Juroren und überwache den aktuellen Fortschritt.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition shadow-sm"
          >
            <Settings className="h-4 w-4 text-purple-400" />
            Einstellungen & Schutz
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition shadow-sm"
          >
            <Users className="h-4 w-4 text-purple-400" />
            Nutzerverwaltung
          </Link>
          <Link
            href="/admin/contests/new"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Neuen Wettbewerb anlegen
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Gesamt-Wettbewerbe</span>
            <Award className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{totalContests}</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Einreichung aktiv</span>
            <Camera className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-400">{activeSubmissions}</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Jurierung aktiv</span>
            <Clock className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-purple-400">{activeRating}</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Eingereichte Bilder</span>
            <Users className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{totalImages}</p>
        </div>
      </div>

      {/* Contests Management Table */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40">
        <div className="border-b border-neutral-800 bg-neutral-900/80 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Alle Wettbewerbe</h2>
          <span className="text-xs text-neutral-400">{contests.length} Einträge</span>
        </div>

        {contests.length === 0 ? (
          <div className="p-12 text-center">
            <Camera className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
            <p className="text-sm text-neutral-300">Noch keine Fotowettbewerbe vorhanden.</p>
            <Link
              href="/admin/contests/new"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              Jetzt ersten Wettbewerb erstellen →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 bg-neutral-950/50 text-neutral-400 font-medium">
                <tr>
                  <th className="px-6 py-3.5">Wettbewerb</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Modus & Zugang</th>
                  <th className="px-4 py-3.5">Themen</th>
                  <th className="px-4 py-3.5">Bilder</th>
                  <th className="px-4 py-3.5">Teilnehmer</th>
                  <th className="px-6 py-3.5 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {contests.map((c) => {
                  const badge = getStatusBadgeInfo(c.effectiveStatus);
                  return (
                    <tr key={c.id} className="hover:bg-neutral-900/60 transition">
                      <td className="px-6 py-4">
                        <Link
                          href={`/contests/${c.slug}`}
                          className="font-semibold text-white hover:text-sky-400 transition flex items-center gap-1.5"
                        >
                          {c.title}
                          <ExternalLink className="h-3 w-3 text-neutral-400" />
                        </Link>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Frist: {new Date(c.submissionEnd).toLocaleDateString("de-DE")} • Jury bis:{" "}
                          {new Date(c.ratingEnd).toLocaleDateString("de-DE")}
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-neutral-300">
                        <div className="flex items-center gap-1">
                          {c.accessType === "INVITE_ONLY" ? (
                            <span className="text-amber-400 flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Geschlossen
                            </span>
                          ) : (
                            <span className="text-sky-400">Offener Link</span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {c.votingMode === "PEER_REVIEW" ? "Peer-Review" : "Jury-Account"}
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-neutral-300">
                        {c.topics?.length || 0} Themen
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap font-medium text-white">
                        {c._count?.submissions || 0}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-neutral-300">
                        {c._count?.participants || 0}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/admin/contests/${c.id}/stats`}
                            title="Statistiken & Juror-Auswertung"
                            className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 hover:text-purple-400 hover:border-purple-500/30 transition"
                          >
                            <BarChart2 className="h-4 w-4" />
                          </Link>

                          <Link
                            href={`/admin/contests/${c.id}/invites`}
                            title="Einladungen & QR-Codes"
                            className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 hover:text-sky-400 hover:border-sky-500/30 transition"
                          >
                            <QrCode className="h-4 w-4" />
                          </Link>

                          <Link
                            href={`/admin/contests/${c.id}/edit`}
                            title="Einstellungen bearbeiten"
                            className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 hover:text-emerald-400 hover:border-emerald-500/30 transition"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>

                          <button
                            onClick={() => handleDeleteContest(c.id, c.title)}
                            disabled={deletingId === c.id}
                            title="Wettbewerb löschen"
                            className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-400 hover:text-rose-400 hover:border-rose-500/30 transition disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!contestToDelete}
        title="Wettbewerb unwiderruflich löschen?"
        message={`Möchtest du den Wettbewerb „${contestToDelete?.title}“ und alle zugehörigen Themen, eingereichten Fotos, Bewertungen und Einladungen wirklich unwiderruflich löschen?`}
        confirmText="Wettbewerb endgültig löschen"
        cancelText="Abbrechen"
        variant="danger"
        isLoading={isDeletingContest}
        onConfirm={handleConfirmDeleteContest}
        onClose={() => {
          if (!isDeletingContest) setContestToDelete(null);
        }}
      />
    </div>
  );
}
