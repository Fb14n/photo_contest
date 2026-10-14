"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Plus,
  Mail,
  ExternalLink,
  Lock,
  Globe,
  AlertCircle,
  Download,
} from "lucide-react";
import InviteModal from "@/components/InviteModal";

interface PersonEntry {
  id: string;
  email: string;
  name?: string | null;
  inviteToken: string;
  status: string;
  userId?: string | null;
}

export default function AdminContestInvitesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  const [contest, setContest] = useState<any | null>(null);
  const [participants, setParticipants] = useState<PersonEntry[]>([]);
  const [jurors, setJurors] = useState<PersonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Invite Form
  const [newEmails, setNewEmails] = useState("");
  const [targetType, setTargetType] = useState<"participant" | "juror">("participant");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeInviteData, setActiveInviteData] = useState<{
    email: string;
    name?: string | null;
    inviteUrl: string;
    qrCode: string;
    role: "Teilnehmer" | "Juror";
  } | null>(null);

  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/contests/${resolvedParams.id}`);
      const data = await res.json();
      if (data.contest) {
        setContest(data.contest);
        setParticipants(data.contest.participants || []);
        setJurors(data.contest.jurors || []);
      } else {
        setError(data.error || "Wettbewerb nicht gefunden");
      }
    } catch {
      setError("Fehler beim Laden der Einladungen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedParams.id]);

  const handleCreateInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmails.trim() || !contest) return;

    const emailList = newEmails
      .split(/[\n,;]+/)
      .map((em) => em.trim().toLowerCase())
      .filter((em) => em && em.includes("@"));

    if (emailList.length === 0) {
      alert("Bitte mindestens eine gültige E-Mail-Adresse angeben.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/contests/${contest.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: targetType,
          emails: emailList,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewEmails("");
        await loadData();
        // If single invite created, open modal right away
        if (data.invites?.length === 1) {
          const inv = data.invites[0];
          setActiveInviteData({
            email: inv.email,
            name: inv.name,
            inviteUrl: inv.inviteUrl,
            qrCode: inv.qrCode,
            role: targetType === "participant" ? "Teilnehmer" : "Juror",
          });
          setModalOpen(true);
        }
      } else {
        alert(data.error || "Fehler beim Erstellen der Einladungen");
      }
    } catch {
      alert("Netzwerkfehler");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openQrModal = async (entry: PersonEntry, role: "Teilnehmer" | "Juror") => {
    const origin = window.location.origin;
    const inviteUrl = `${origin}/invite/${entry.inviteToken}`;

    // Request QR Code via invite creation endpoint or generate client QR
    try {
      const res = await fetch(`/api/contests/${contest.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: role === "Teilnehmer" ? "participant" : "juror",
          emails: [entry.email],
        }),
      });
      const data = await res.json();
      if (data.invites?.[0]) {
        setActiveInviteData({
          email: entry.email,
          name: entry.name,
          inviteUrl: data.invites[0].inviteUrl,
          qrCode: data.invites[0].qrCode,
          role,
        });
        setModalOpen(true);
      }
    } catch {
      alert("Fehler beim Öffnen des QR-Codes");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center animate-pulse">
        <div className="h-8 w-60 bg-neutral-900 rounded mx-auto mb-4" />
        <div className="h-96 bg-neutral-900/60 rounded-3xl" />
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">{error || "Wettbewerb nicht gefunden"}</h2>
        <Link href="/admin" className="text-xs text-purple-400 hover:underline">
          Zurück zum Admin-Dashboard
        </Link>
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const openContestUrl = `${origin}/contests/${contest.slug}`;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
        <Link href="/admin" className="hover:text-white transition flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Admin Dashboard
        </Link>
        <span>/</span>
        <span className="text-sky-400">Einladungen & QR-Codes</span>
      </div>

      <div className="border-b border-neutral-800 pb-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Zugangsverwaltung & Einladungen</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Wettbewerb: <strong className="text-neutral-200">{contest.title}</strong>
          </p>
        </div>

        <Link
          href={`/contests/${contest.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
        >
          <ExternalLink className="h-3.5 w-3.5 text-sky-400" />
          Wettbewerbsseite ansehen
        </Link>
      </div>

      {/* Public Open Link Banner (if OPEN) */}
      {contest.accessType === "OPEN" && (
        <div className="mb-8 rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-neutral-900 to-neutral-900 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-sky-400" />
            <h2 className="text-base font-semibold text-white">Öffentlicher Wettbewerbslink</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Dieser Wettbewerb ist offen konfiguriert. Jeder mit folgendem Direktlink kann sich registrieren und Fotos einreichen:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={openContestUrl}
              className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-mono text-sky-300 select-all"
            />
            <button
              onClick={() => copyToClipboard(openContestUrl)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-400 transition"
            >
              {copiedUrl === openContestUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedUrl === openContestUrl ? "Kopiert!" : "Link kopieren"}
            </button>
          </div>
        </div>
      )}

      {/* Add New Invites Form */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 mb-10">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <Mail className="h-4 w-4 text-purple-400" />
          Neue Einladungen versenden / generieren
        </h2>
        <p className="text-xs text-neutral-400 mb-5">
          Trage E-Mail-Adressen ein, um personalisierte Einladungslinks und QR-Codes zu erstellen.
        </p>

        <form onSubmit={handleCreateInvites} className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs text-neutral-300 font-medium">Zielgruppe / Rolle:</label>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-white">
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === "participant"}
                  onChange={() => setTargetType("participant")}
                  className="accent-sky-500"
                />
                📷 Teilnehmer (Fotos einreichen)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-white">
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === "juror"}
                  onChange={() => setTargetType("juror")}
                  className="accent-purple-500"
                />
                ⚖️ Juror (0–10 Punkte bewerten)
              </label>
            </div>
          </div>

          <div>
            <textarea
              required
              rows={3}
              value={newEmails}
              onChange={(e) => setNewEmails(e.target.value)}
              placeholder="fotograf@beispiel.de, juror@fotoclub.de (durch Kommas oder Zeilenumbrüche getrennt)"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 font-mono focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Wird generiert..." : "Einladungen erstellen & QR-Codes generieren"}
            </button>
          </div>
        </form>
      </div>

      {/* Grid: Participants Table & Jurors Table */}
      <div className="space-y-10">
        {/* Participants */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
          <div className="border-b border-neutral-800 bg-neutral-900/80 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white">Teilnehmer-Liste</h3>
            </div>
            <span className="text-xs text-neutral-400">{participants.length} Personen</span>
          </div>

          {participants.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              Noch keine Teilnehmer auf der Einladungsliste.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-neutral-800 bg-neutral-950/50 text-neutral-400">
                  <tr>
                    <th className="px-6 py-3">E-Mail</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Einladungszugang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {participants.map((p) => {
                    const inviteUrl = `${origin}/invite/${p.inviteToken}`;
                    return (
                      <tr key={p.id} className="hover:bg-neutral-900/50 transition">
                        <td className="px-6 py-3.5 font-medium text-white">{p.email}</td>
                        <td className="px-4 py-3.5 text-neutral-300">{p.name || "—"}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                              p.status === "REGISTERED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {p.status === "REGISTERED" ? "Registriert" : "Eingeladen"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(inviteUrl)}
                              title="Einladungslink kopieren"
                              className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 hover:text-sky-400 transition"
                            >
                              {copiedUrl === inviteUrl ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => openQrModal(p, "Teilnehmer")}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300 hover:bg-sky-500/20 transition"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              QR-Code
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

        {/* Jurors */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
          <div className="border-b border-neutral-800 bg-neutral-900/80 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Juroren-Liste</h3>
            </div>
            <span className="text-xs text-neutral-400">{jurors.length} Juroren</span>
          </div>

          {jurors.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              Noch keine Juroren eingetragen.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-neutral-800 bg-neutral-950/50 text-neutral-400">
                  <tr>
                    <th className="px-6 py-3">E-Mail</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Jury-Zugang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {jurors.map((j) => {
                    const inviteUrl = `${origin}/invite/${j.inviteToken}`;
                    return (
                      <tr key={j.id} className="hover:bg-neutral-900/50 transition">
                        <td className="px-6 py-3.5 font-medium text-white">{j.email}</td>
                        <td className="px-4 py-3.5 text-neutral-300">{j.name || "—"}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                              j.status === "ACTIVE"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {j.status === "ACTIVE" ? "Aktiv (Juror)" : "Eingeladen"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(inviteUrl)}
                              title="Jury-Link kopieren"
                              className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 hover:text-purple-400 transition"
                            >
                              {copiedUrl === inviteUrl ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => openQrModal(j, "Juror")}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              QR-Code
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
      </div>

      {/* QR Code and Direct URL Modal */}
      <InviteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        inviteData={activeInviteData}
      />
    </div>
  );
}
