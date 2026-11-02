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
  Trash2,
} from "lucide-react";
import InviteModal from "@/components/InviteModal";
import UserPicker from "@/components/UserPicker";

interface PersonEntry {
  id: string;
  email: string;
  name?: string | null;
  inviteToken: string;
  status: string;
  userId?: string | null;
  inviteSentAt?: string | null;
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [targetType, setTargetType] = useState<"participant" | "juror">("participant");
  const [sendEmailsDirectly, setSendEmailsDirectly] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);
  const [emailStatusToast, setEmailStatusToast] = useState<string | null>(null);

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

  // Removal Modal State
  const [personToRemove, setPersonToRemove] = useState<{
    entry: PersonEntry;
    type: "participant" | "juror";
  } | null>(null);
  const [deletePersonSubmissions, setDeletePersonSubmissions] = useState(true);
  const [deletePersonRatings, setDeletePersonRatings] = useState(true);
  const [isRemovingPerson, setIsRemovingPerson] = useState(false);

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
    if (!contest) return;

    const manualList = newEmails
      .split(/[\n,;]+/)
      .map((em) => em.trim().toLowerCase())
      .filter((em) => em && em.includes("@"));

    const combinedList = Array.from(new Set([...selectedUsers, ...manualList]));

    if (combinedList.length === 0) {
      alert("Bitte mindestens einen registrierten Nutzer auswählen oder eine gültige E-Mail-Adresse angeben.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/contests/${contest.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: targetType,
          emails: combinedList,
          sendEmail: sendEmailsDirectly,
        }),
      });

      const data = await res.json();
      if (data.success || Array.isArray(data)) {
        setNewEmails("");
        setSelectedUsers([]);
        setEmailStatusToast(
          sendEmailsDirectly
            ? `${combinedList.length} Einladung(en) erstellt und per E-Mail versendet!`
            : `${combinedList.length} Einladung(en) erstellt!`
        );
        setTimeout(() => setEmailStatusToast(null), 4000);
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

  const handleResendEmail = async (email: string, type: "participant" | "juror") => {
    if (!contest) return;
    setSendingEmailFor(email);
    try {
      const res = await fetch(`/api/contests/${contest.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend",
          email,
          type,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatusToast(`Einladungs-E-Mail an ${email} erneut versendet.`);
        setTimeout(() => setEmailStatusToast(null), 3000);
        await loadData();
      } else {
        alert(data.error || "Fehler beim Versenden der E-Mail");
      }
    } catch {
      alert("Fehler beim Senden");
    } finally {
      setSendingEmailFor(null);
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

  const handleOpenRemoveModal = (entry: PersonEntry, type: "participant" | "juror") => {
    setPersonToRemove({ entry, type });
    setDeletePersonSubmissions(true);
    setDeletePersonRatings(true);
  };

  const handleConfirmRemovePerson = async () => {
    if (!personToRemove || !contest) return;
    setIsRemovingPerson(true);
    try {
      const res = await fetch(`/api/contests/${contest.id}/participants`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: personToRemove.entry.id,
          type: personToRemove.type,
          deleteSubmissions: personToRemove.type === "participant" ? deletePersonSubmissions : false,
          deleteRatings: deletePersonRatings,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || "Fehler beim Entfernen");
      } else {
        setEmailStatusToast(data.message || "Person erfolgreich aus dem Wettbewerb entfernt.");
        setTimeout(() => setEmailStatusToast(null), 4000);
        setPersonToRemove(null);
        await loadData();
      }
    } catch {
      alert("Netzwerkfehler beim Entfernen");
    } finally {
      setIsRemovingPerson(false);
    }
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

      {emailStatusToast && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{emailStatusToast}</span>
        </div>
      )}

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

          <div className="pt-2">
            <UserPicker
              label="Registrierte Benutzer auswählen"
              description="Wähle bereits registrierte Nutzer der Plattform aus, um sie mit einem Klick hinzuzufügen."
              selectedEmails={selectedUsers}
              onChange={setSelectedUsers}
              accentColor={targetType === "juror" ? "purple" : "sky"}
              excludeEmails={(targetType === "participant" ? participants : jurors).map((p) => p.email)}
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Weitere externe E-Mail-Adressen (optional für noch nicht registrierte Personen)
            </label>
            <textarea
              rows={2}
              value={newEmails}
              onChange={(e) => setNewEmails(e.target.value)}
              placeholder="fotograf@beispiel.de, juror@fotoclub.de (durch Kommas oder Zeilenumbrüche getrennt)"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 font-mono focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={sendEmailsDirectly}
                onChange={(e) => setSendEmailsDirectly(e.target.checked)}
                className="rounded accent-purple-500 h-4 w-4"
              />
              <span>Einladungs-E-Mail direkt per Mail versenden</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Wird verarbeitet..." : "Einladungen erstellen & QR-Codes generieren"}
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
                              onClick={() => handleResendEmail(p.email, "participant")}
                              disabled={sendingEmailFor === p.email}
                              title="Einladungs-E-Mail senden"
                              className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 hover:text-sky-400 hover:border-sky-500/40 transition disabled:opacity-40"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </button>
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
                            <button
                              onClick={() => handleOpenRemoveModal(p, "participant")}
                              title="Teilnehmer aus Wettbewerb entfernen"
                              className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-400 hover:text-red-400 hover:border-red-500/40 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
                              onClick={() => handleResendEmail(j.email, "juror")}
                              disabled={sendingEmailFor === j.email}
                              title="Jury-Einladungs-E-Mail senden"
                              className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 hover:text-purple-400 hover:border-purple-500/40 transition disabled:opacity-40"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </button>
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
                            <button
                              onClick={() => handleOpenRemoveModal(j, "juror")}
                              title="Juror aus Wettbewerb entfernen"
                              className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-400 hover:text-red-400 hover:border-red-500/40 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

      {/* Confirmation Modal for Removing Person from Contest with Toggles */}
      {personToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl p-6 text-white space-y-5">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {personToRemove.type === "participant" ? "Teilnehmer entfernen" : "Juror entfernen"}
                </h3>
                <p className="text-xs text-neutral-400">
                  Person aus dem Wettbewerb „{contest.title}“ entfernen.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white block">
                    {personToRemove.entry.name || "Kein Name hinterlegt"}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {personToRemove.entry.email}
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-300">
                  {personToRemove.type === "participant" ? "📷 Teilnehmer" : "⚖️ Juror"}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-neutral-300">Lösch-Optionen:</p>

              {personToRemove.type === "participant" && (
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70 hover:bg-neutral-900/60 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={deletePersonSubmissions}
                    onChange={(e) => setDeletePersonSubmissions(e.target.checked)}
                    className="mt-0.5 rounded accent-red-500 h-4 w-4"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-semibold text-white block">
                      Eingereichte Fotos dieses Teilnehmers löschen
                    </span>
                    <span className="text-neutral-400 block mt-0.5">
                      {deletePersonSubmissions
                        ? "Alle Fotos dieser Person in diesem Wettbewerb werden mitsamt den Bilddateien unwiderruflich gelöscht."
                        : "Fotos bleiben im Wettbewerb erhalten (Name wird als Urheber beibehalten, Verknüpfung gelöst)."}
                    </span>
                  </div>
                </label>
              )}

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70 hover:bg-neutral-900/60 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={deletePersonRatings}
                  onChange={(e) => setDeletePersonRatings(e.target.checked)}
                  className="mt-0.5 rounded accent-red-500 h-4 w-4"
                />
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-white block">
                    Abgegebene Bewertungen dieser Person löschen
                  </span>
                  <span className="text-neutral-400 block mt-0.5">
                    {deletePersonRatings
                      ? "Alle vergebenen Punkte und Notizen dieser Person für Bilder in diesem Wettbewerb werden gelöscht."
                      : "Vergebene Bewertungen bleiben in den Wettbewerbsergebnissen zur Wertung erhalten."}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isRemovingPerson}
                onClick={() => setPersonToRemove(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={isRemovingPerson}
                onClick={handleConfirmRemovePerson}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20 transition disabled:opacity-50"
              >
                {isRemovingPerson ? "Wird entfernt..." : "Aus Wettbewerb entfernen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
