"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileCheck,
  ShieldCheck,
  Lock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Award,
  Users,
  Camera,
  Info,
  ExternalLink,
} from "lucide-react";

interface EditableTopic {
  id?: string;
  title: string;
  description: string;
  maxSubmissionsPerUser: number;
}

function toLocalDatetimeString(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EditContestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Contest basic details
  const [contestSlug, setContestSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Status & Publication
  const [status, setStatus] = useState("AUTO");
  const [accessType, setAccessType] = useState<"OPEN" | "INVITE_ONLY">("OPEN");
  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [allowParticipantUploads, setAllowParticipantUploads] = useState(true);

  // Dates
  const [submissionStart, setSubmissionStart] = useState("");
  const [submissionEnd, setSubmissionEnd] = useState("");
  const [ratingStart, setRatingStart] = useState("");
  const [ratingEnd, setRatingEnd] = useState("");

  // Voting Mode & Jury
  const [votingMode, setVotingMode] = useState<"EXCLUSIVE_JURY" | "PEER_REVIEW">("EXCLUSIVE_JURY");
  const [anonymousJudging, setAnonymousJudging] = useState(true);
  const [publicResults, setPublicResults] = useState(true);

  // Image rules
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(15.0);
  const [allowedFormats, setAllowedFormats] = useState("image/jpeg,image/png,image/webp");
  const [minWidth, setMinWidth] = useState<number | "">("");
  const [minHeight, setMinHeight] = useState<number | "">("");
  const [maxWidth, setMaxWidth] = useState<number | "">("");
  const [maxHeight, setMaxHeight] = useState<number | "">("");
  const [aspectRatio, setAspectRatio] = useState("free");
  const [namingPattern, setNamingPattern] = useState("");

  // Topics
  const [topics, setTopics] = useState<EditableTopic[]>([]);

  const handleAddTopic = () => {
    setTopics([...topics, { title: "", description: "", maxSubmissionsPerUser: 1 }]);
  };

  const handleRemoveTopic = (index: number) => {
    if (topics.length <= 1) {
      alert("Mindestens ein Thema muss im Wettbewerb vorhanden sein.");
      return;
    }
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleTopicChange = (index: number, field: keyof EditableTopic, value: any) => {
    const updated = [...topics];
    updated[index] = { ...updated[index], [field]: value };
    setTopics(updated);
  };

  useEffect(() => {
    fetch(`/api/contests/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.contest) {
          const c = d.contest;
          setContestSlug(c.slug || c.id);
          setTitle(c.title);
          setDescription(c.description);
          setStatus(c.status || "AUTO");
          setAccessType(c.accessType || "OPEN");
          setMaxParticipants(c.maxParticipants ? String(c.maxParticipants) : "");
          setSubmissionStart(toLocalDatetimeString(c.submissionStart));
          setSubmissionEnd(toLocalDatetimeString(c.submissionEnd));
          setRatingStart(toLocalDatetimeString(c.ratingStart));
          setRatingEnd(toLocalDatetimeString(c.ratingEnd));
          setVotingMode(c.votingMode || "EXCLUSIVE_JURY");
          setAnonymousJudging(c.anonymousJudging !== undefined ? Boolean(c.anonymousJudging) : true);
          setPublicResults(c.publicResults !== undefined ? Boolean(c.publicResults) : true);
          setAllowParticipantUploads(
            c.allowParticipantUploads !== undefined ? Boolean(c.allowParticipantUploads) : true
          );
          setMaxFileSizeMb(c.maxFileSizeMb || 15.0);
          setAllowedFormats(c.allowedFormats || "image/jpeg,image/png,image/webp");
          setMinWidth(c.minWidth || "");
          setMinHeight(c.minHeight || "");
          setMaxWidth(c.maxWidth || "");
          setMaxHeight(c.maxHeight || "");
          setAspectRatio(c.aspectRatio || "free");
          setNamingPattern(c.namingPattern || "");
          if (Array.isArray(c.topics) && c.topics.length > 0) {
            setTopics(
              c.topics.map((t: any) => ({
                id: t.id,
                title: t.title,
                description: t.description || "",
                maxSubmissionsPerUser: t.maxSubmissionsPerUser || 1,
              }))
            );
          } else {
            setTopics([{ title: "Hauptkategorie", description: "", maxSubmissionsPerUser: 1 }]);
          }
        } else {
          setErrorMessage("Wettbewerb nicht gefunden");
        }
      })
      .catch(() => setErrorMessage("Fehler beim Laden des Wettbewerbs"))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/contests/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          status,
          accessType,
          maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
          submissionStart: allowParticipantUploads && submissionStart ? submissionStart : undefined,
          submissionEnd: allowParticipantUploads && submissionEnd ? submissionEnd : undefined,
          ratingStart,
          ratingEnd,
          votingMode,
          anonymousJudging,
          publicResults,
          allowParticipantUploads,
          maxFileSizeMb,
          allowedFormats,
          minWidth: minWidth ? Number(minWidth) : null,
          minHeight: minHeight ? Number(minHeight) : null,
          maxWidth: maxWidth ? Number(maxWidth) : null,
          maxHeight: maxHeight ? Number(maxHeight) : null,
          aspectRatio,
          namingPattern,
          topics: topics.map((t) => ({
            id: t.id,
            title: t.title.trim(),
            description: t.description.trim() || null,
            maxSubmissionsPerUser: Number(t.maxSubmissionsPerUser) || 1,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage("Alle Einstellungen wurden erfolgreich und sicher aktualisiert!");
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || "Aktualisierung fehlgeschlagen.");
      }
    } catch {
      setErrorMessage("Netzwerkfehler beim Speichern der Einstellungen.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center animate-pulse">
        <div className="h-8 w-48 bg-neutral-900 rounded mx-auto mb-4" />
        <div className="h-96 bg-neutral-900/60 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
        <Link href="/admin" className="hover:text-white transition flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Admin Dashboard
        </Link>
        <span>/</span>
        <span className="text-purple-400 font-medium">Wettbewerb bearbeiten</span>
      </div>

      {/* Header bar */}
      <div className="border-b border-neutral-800 pb-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Wettbewerb bearbeiten</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Passe Fristen, Zugangsarten, Bewertungsmodi und Regeln für <strong className="text-white font-semibold">{title}</strong> an.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {contestSlug && (
            <Link
              href={`/contests/${contestSlug}`}
              target="_blank"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-1.5 transition"
            >
              <span>Vorschau</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          <Link
            href={`/admin/contests/${resolvedParams.id}/submissions`}
            className="rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition flex items-center gap-1.5"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Gott-Modus Bilder</span>
          </Link>
          <Link
            href={`/admin/contests/${resolvedParams.id}/invites`}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition flex items-center gap-1.5"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Einladungen</span>
          </Link>
          <Link
            href={`/admin/contests/${resolvedParams.id}/stats`}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            Statistiken
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Status & Veröffentlichung */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h2 className="text-base font-semibold text-white">1. Status & Manuelle Steuerung</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Wettbewerbs-Status (Phasen-Steuerung)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="AUTO">Automatisch (Phasen wechseln nach Fristen / Zeitplan)</option>
                <option value="SUBMISSION">SUBMISSION (Manuell: Einreichungsphase aktiv halten)</option>
                <option value="RATING">RATING (Manuell: Jurierungsphase sofort aktivieren)</option>
                <option value="FINISHED">FINISHED (Manuell: Wettbewerb abschließen & auswerten)</option>
                <option value="DRAFT">DRAFT (Entwurf / für Teilnehmer verborgen)</option>
                <option value="ARCHIVED">ARCHIVED (Archiv)</option>
              </select>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Wähle <em>Automatisch</em>, damit sich die Phase pünktlich nach den Fristen unten richtet, oder überschreibe die Phase manuell.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Ablauf-Modus & Upload-Rechte
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAllowParticipantUploads(true)}
                  className={`rounded-xl p-2.5 text-xs font-bold border text-left transition flex flex-col justify-between ${
                    allowParticipantUploads
                      ? "border-sky-500 bg-sky-500/10 text-white shadow-sm"
                      : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Camera className="h-3.5 w-3.5" />
                    Regulär
                  </span>
                  <span className="text-[10px] font-normal text-neutral-400 mt-1">
                    Teilnehmer laden eigene Fotos hoch
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAllowParticipantUploads(false)}
                  className={`rounded-xl p-2.5 text-xs font-bold border text-left transition flex flex-col justify-between ${
                    !allowParticipantUploads
                      ? "border-purple-500 bg-purple-500/10 text-white shadow-sm"
                      : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Direkt-Jurierung
                  </span>
                  <span className="text-[10px] font-normal text-neutral-400 mt-1">
                    Admin stellt alle Bilder bereit
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Allgemeine Angaben */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Info className="h-4 w-4 text-neutral-400" />
            <h2 className="text-base font-semibold text-white">2. Allgemeine Angaben</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Titel des Wettbewerbs *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Beschreibung & Teilnahmebedingungen *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION 3: Zugang & Teilnehmer */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Users className="h-4 w-4 text-sky-400" />
            <h2 className="text-base font-semibold text-white">3. Zugang & Teilnehmer-Rechte</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition ${
                accessType === "OPEN"
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white">Offener Link (Öffentlich)</span>
                  <input
                    type="radio"
                    name="accessType"
                    checked={accessType === "OPEN"}
                    onChange={() => setAccessType("OPEN")}
                    className="accent-sky-500"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  Jeder mit dem Link kann teilnehmen, indem er sich anmeldet und Fotos einreicht.
                </p>
              </div>
            </label>

            <label
              className={`flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition ${
                accessType === "INVITE_ONLY"
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    Geschlossen (Nur mit Einladung)
                  </span>
                  <input
                    type="radio"
                    name="accessType"
                    checked={accessType === "INVITE_ONLY"}
                    onChange={() => setAccessType("INVITE_ONLY")}
                    className="accent-amber-500"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  Nur Personen auf der Teilnehmer- oder Jury-Liste erhalten Zugang per persönlichem Link.
                </p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Max. Teilnehmer (optional)
              </label>
              <input
                type="number"
                min={1}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Unbegrenzt (leer lassen)"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Begrenzt die Gesamtzahl an teilnehmenden Personen bei offenen Wettbewerben.
              </span>
            </div>

            <div className="flex flex-col justify-center bg-neutral-950/50 p-3.5 rounded-xl border border-neutral-800">
              <span className="text-xs font-semibold text-white mb-1">Teilnehmer- & Jury-Listen verwalten</span>
              <p className="text-[11px] text-neutral-400 mb-2">
                Weitere Personen per E-Mail einladen oder Einladungslinks kopieren:
              </p>
              <Link
                href={`/admin/contests/${resolvedParams.id}/invites`}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                <span>Zur Einladungsverwaltung öffnen</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION 4: Fristen & Zeiträume */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">4. Fristen & Zeiträume</h2>
          </div>

          {!allowParticipantUploads ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs text-purple-300 flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-purple-400" />
                <span>
                  <strong>Direkte Jurierung aktiv:</strong> Da Teilnehmer keine Fotos hochladen, entfällt die Einreichungsphase. Die Bewertung kann sofort oder nach individuellem Zeitplan stattfinden.
                </span>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 block">
                  Jurierungsphase (0–10 Punkte)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Start der Bewertung *</label>
                    <input
                      type="datetime-local"
                      required
                      value={ratingStart}
                      onChange={(e) => setRatingStart(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Ende der Bewertung (Deadline) *</label>
                    <input
                      type="datetime-local"
                      required
                      value={ratingEnd}
                      onChange={(e) => setRatingEnd(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block">
                  1. Einreichungsphase
                </span>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Beginn der Einreichung</label>
                  <input
                    type="datetime-local"
                    value={submissionStart}
                    onChange={(e) => setSubmissionStart(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Datum, ab dem Teilnehmer Fotos hochladen dürfen.
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Ende der Einreichung (Deadline) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={submissionEnd}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setSubmissionEnd(newEnd);
                      // Auto-sync rating start to seamlessly follow submission end
                      setRatingStart(newEnd);
                      if (ratingEnd && ratingEnd <= newEnd) {
                        const d = new Date(newEnd);
                        d.setDate(d.getDate() + 7);
                        setRatingEnd(d.toISOString().slice(0, 16));
                      }
                    }}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Ab diesem Moment schließt der Foto-Upload für Teilnehmer.
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 block">
                  2. Jurierungsphase (0–10 Punkte)
                </span>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Start der Bewertung *</label>
                  <input
                    type="datetime-local"
                    required
                    value={ratingStart}
                    onChange={(e) => setRatingStart(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Schließt im Idealfall direkt an die Einreichungs-Deadline an.
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Ende der Bewertung (Ergebnis steht fest) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={ratingEnd}
                    onChange={(e) => setRatingEnd(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Fristende für alle Noten.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: Bewertungssystem & Jury-Modus */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            <h2 className="text-base font-semibold text-white">5. Bewertung & Jury-Modus</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition ${
                votingMode === "EXCLUSIVE_JURY"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-purple-400" />
                    Exklusive Fach-Jury
                  </span>
                  <input
                    type="radio"
                    name="votingMode"
                    checked={votingMode === "EXCLUSIVE_JURY"}
                    onChange={() => setVotingMode("EXCLUSIVE_JURY")}
                    className="accent-purple-500"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Normale Teilnehmer können die Bilder nicht bewerten. Nur ausgewählte Personen mit Jury-Zugang vergeben Punkte (0 bis 10).
                </p>
              </div>
            </label>

            <label
              className={`flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition ${
                votingMode === "PEER_REVIEW"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-purple-400" />
                    Teilnehmer-Bewertung (Peer-Review)
                  </span>
                  <input
                    type="radio"
                    name="votingMode"
                    checked={votingMode === "PEER_REVIEW"}
                    onChange={() => setVotingMode("PEER_REVIEW")}
                    className="accent-purple-500"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Alle registrierten Teilnehmer bewerten sich gegenseitig. Das eigene Bild ist bei jedem Teilnehmer automatisch von der Bewertung ausgeschlossen.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 space-y-3">
            {/* Anonymous judging toggle */}
            <div className="flex items-start justify-between gap-4 border border-neutral-800/80 bg-neutral-950/60 p-4 rounded-xl">
              <div>
                <label className="text-xs font-semibold text-white block">
                  Anonyme Bewertung aktivieren
                </label>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
                  Namen der Fotografen werden für Juroren während der Bewertung ausgeblendet, um neutrale Punktevergabe sicherzustellen.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={anonymousJudging}
                onClick={() => setAnonymousJudging(!anonymousJudging)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  anonymousJudging ? "bg-purple-600" : "bg-neutral-700"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    anonymousJudging ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Public results toggle */}
            <div className="flex items-start justify-between gap-4 border border-neutral-800/80 bg-neutral-950/60 p-4 rounded-xl">
              <div>
                <label className="text-xs font-semibold text-white block">
                  Ergebnisse für Teilnehmer öffentlich freischalten
                </label>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
                  Wenn aktiviert, können alle Teilnehmer nach Ablauf der Jurierungsphase die Rangliste und Punkte einsehen. Wenn deaktiviert, kann nur der Admin die Ergebnisse einsehen.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={publicResults}
                onClick={() => setPublicResults(!publicResults)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  publicResults ? "bg-emerald-600" : "bg-neutral-700"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    publicResults ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 6: Themenkategorien (Sparten) */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                6. Themenkategorien / Sparten ({topics.length})
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Verwalte die Sparten des Wettbewerbs. Themen mit bereits vorhandenen Einreichungen sind vor versehentlichem Löschen geschützt.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTopic}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Sparte hinzufügen
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {topics.map((topic, index) => (
              <div
                key={topic.id || `topic-${index}`}
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 w-full">
                    <span className="text-xs font-bold text-purple-400 w-6">#{index + 1}</span>
                    <input
                      type="text"
                      required
                      placeholder="Thementitel (z. B. Freies Thema, Architektur, Makro)"
                      value={topic.title}
                      onChange={(e) => handleTopicChange(index, "title", e.target.value)}
                      className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] text-neutral-400 whitespace-nowrap">Max. Fotos / Person:</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={topic.maxSubmissionsPerUser}
                        onChange={(e) =>
                          handleTopicChange(index, "maxSubmissionsPerUser", parseInt(e.target.value, 10) || 1)
                        }
                        className="w-16 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-center text-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(index)}
                      disabled={topics.length <= 1}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-20"
                      title="Sparte entfernen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Optionale Beschreibung oder Vorgaben zu diesem Thema..."
                    value={topic.description}
                    onChange={(e) => handleTopicChange(index, "description", e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs text-neutral-300 placeholder-neutral-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 7: Bildregeln & Technische Vorgaben */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <FileCheck className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">7. Bildregeln & Technische Vorgaben</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Max. Dateigröße (MB)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="100"
                value={maxFileSizeMb}
                onChange={(e) => setMaxFileSizeMb(parseFloat(e.target.value) || 15)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Seitenverhältnis</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white"
              >
                <option value="free">Frei wählbar</option>
                <option value="3:2">3:2 (Standard Kleinbild / DSLR)</option>
                <option value="16:9">16:9 (Breitbild)</option>
                <option value="4:3">4:3 (MFT / Kompakt)</option>
                <option value="1:1">1:1 (Quadratisch)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Erlaubte Dateiformate</label>
              <input
                type="text"
                value={allowedFormats}
                onChange={(e) => setAllowedFormats(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Min. Breite (px)</label>
              <input
                type="number"
                value={minWidth}
                onChange={(e) => setMinWidth(e.target.value ? Number(e.target.value) : "")}
                placeholder="z. B. 1200"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Min. Höhe (px)</label>
              <input
                type="number"
                value={minHeight}
                onChange={(e) => setMinHeight(e.target.value ? Number(e.target.value) : "")}
                placeholder="z. B. 800"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Max. Breite (px)</label>
              <input
                type="number"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value ? Number(e.target.value) : "")}
                placeholder="Optional"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Max. Höhe (px)</label>
              <input
                type="number"
                value={maxHeight}
                onChange={(e) => setMaxHeight(e.target.value ? Number(e.target.value) : "")}
                placeholder="Optional"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <Link
            href="/admin"
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Wird gespeichert...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Änderungen speichern</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
