"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Layers,
  FileCheck,
  Users,
  ShieldCheck,
  Info,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Lock,
  Camera,
  Mail,
} from "lucide-react";
import UserPicker from "@/components/UserPicker";

interface TopicInput {
  title: string;
  description: string;
  maxSubmissionsPerUser: number;
}

export default function NewContestPage() {
  const router = useRouter();

  // Basic Information
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Dates
  const [submissionStart, setSubmissionStart] = useState("");
  const [submissionEnd, setSubmissionEnd] = useState("");
  const [ratingStart, setRatingStart] = useState("");
  const [ratingEnd, setRatingEnd] = useState("");

  useEffect(() => {
    const now = new Date();
    const defaultSubStart = new Date(now.getTime()).toISOString().slice(0, 16);
    const defaultSubEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const defaultRateStart = defaultSubEnd;
    const defaultRateEnd = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

    setSubmissionStart(defaultSubStart);
    setSubmissionEnd(defaultSubEnd);
    setRatingStart(defaultRateStart);
    setRatingEnd(defaultRateEnd);
  }, []);

  // Contest Flow & Upload Mode
  const [contestFlowMode, setContestFlowMode] = useState<"STANDARD" | "DIRECT_RATING">("STANDARD");

  // Access & Participants
  const [accessType, setAccessType] = useState<"OPEN" | "INVITE_ONLY">("OPEN");
  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [participantEmails, setParticipantEmails] = useState("");
  const [selectedParticipantUsers, setSelectedParticipantUsers] = useState<string[]>([]);

  // Voting Mode & Jury
  const [votingMode, setVotingMode] = useState<"EXCLUSIVE_JURY" | "PEER_REVIEW">("EXCLUSIVE_JURY");
  const [anonymousJudging, setAnonymousJudging] = useState(true);
  const [publicResults, setPublicResults] = useState(true);
  const [jurorEmails, setJurorEmails] = useState("");
  const [selectedJurorUsers, setSelectedJurorUsers] = useState<string[]>([]);
  const [sendNotificationEmails, setSendNotificationEmails] = useState(true);

  // Image Rules
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(15.0);
  const [allowedFormats, setAllowedFormats] = useState("image/jpeg,image/png,image/webp");
  const [minWidth, setMinWidth] = useState<number | "">(1200);
  const [minHeight, setMinHeight] = useState<number | "">(800);
  const [maxWidth, setMaxWidth] = useState<number | "">("");
  const [maxHeight, setMaxHeight] = useState<number | "">("");
  const [aspectRatio, setAspectRatio] = useState("free");
  const [namingPattern, setNamingPattern] = useState("");

  // Topics
  const [topics, setTopics] = useState<TopicInput[]>([
    { title: "Hauptkategorie", description: "Allgemeine Einsendungen zum Wettbewerbsthema", maxSubmissionsPerUser: 2 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddTopic = () => {
    setTopics([...topics, { title: "", description: "", maxSubmissionsPerUser: 1 }]);
  };

  const handleRemoveTopic = (index: number) => {
    if (topics.length <= 1) return;
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleTopicChange = (index: number, field: keyof TopicInput, value: any) => {
    const updated = [...topics];
    updated[index] = { ...updated[index], [field]: value };
    setTopics(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !description.trim()) {
      setErrorMessage("Bitte Titel und Beschreibung angeben.");
      return;
    }

    if (topics.some((t) => !t.title.trim())) {
      setErrorMessage("Jedes Thema muss einen Namen haben.");
      return;
    }

    const parsedParticipants = participantEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));

    const parsedJurors = jurorEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));

    const allParticipantEmails = Array.from(new Set([...selectedParticipantUsers, ...parsedParticipants]));
    const allJurorEmails = Array.from(new Set([...selectedJurorUsers, ...parsedJurors]));

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          status: contestFlowMode === "DIRECT_RATING" ? "RATING" : "SUBMISSION",
          allowParticipantUploads: contestFlowMode !== "DIRECT_RATING",
          accessType,
          maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
          submissionStart,
          submissionEnd,
          ratingStart,
          ratingEnd,
          votingMode,
          anonymousJudging,
          publicResults,
          maxFileSizeMb,
          allowedFormats,
          minWidth: minWidth ? Number(minWidth) : null,
          minHeight: minHeight ? Number(minHeight) : null,
          maxWidth: maxWidth ? Number(maxWidth) : null,
          maxHeight: maxHeight ? Number(maxHeight) : null,
          aspectRatio,
          namingPattern,
          topics,
          participantEmails: allParticipantEmails,
          jurorEmails: allJurorEmails,
          sendNotificationEmails,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Fehler beim Erstellen des Wettbewerbs");
        setIsSubmitting(false);
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setErrorMessage("Netzwerkfehler beim Anlegen des Wettbewerbs.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
        <Link href="/admin" className="hover:text-white transition flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Admin Dashboard
        </Link>
        <span>/</span>
        <span className="text-purple-400">Neuer Wettbewerb</span>
      </div>

      <div className="border-b border-neutral-800 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold text-white">Neuen Fotowettbewerb anlegen</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Konfiguriere Zugang, Themen, Bildvorgaben, Fristen und das Bewertungssystem.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-8 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* SECTION 1: Grunddaten */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h2 className="text-base font-semibold text-white">1. Basis-Informationen</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Titel des Wettbewerbs *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Herbst- & Naturfotografie 2026"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Beschreibung & Teilnahmebedingungen *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Erläutere die Idee des Wettbewerbs, Hintergründe, Preise oder worauf die Jury besonderen Wert legt..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Ablauf-Modus & Uploads */}
          <div className="pt-2 border-t border-neutral-800/80">
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Ablauf-Modus & Upload-Rechte *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition ${
                  contestFlowMode === "STANDARD"
                    ? "border-sky-500 bg-sky-500/10"
                    : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-sky-400" />
                      Regulärer Wettbewerb
                    </span>
                    <input
                      type="radio"
                      name="contestFlowMode"
                      checked={contestFlowMode === "STANDARD"}
                      onChange={() => setContestFlowMode("STANDARD")}
                      className="accent-sky-500"
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    Teilnehmer laden während der Einreichungsphase ihre eigenen Fotos hoch. Nach Ablauf der Frist beginnt die Jurierung.
                  </p>
                </div>
              </label>

              <label
                className={`flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition ${
                  contestFlowMode === "DIRECT_RATING"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-purple-400" />
                      Direkte Jurierung (Admin lädt Fotos hoch)
                    </span>
                    <input
                      type="radio"
                      name="contestFlowMode"
                      checked={contestFlowMode === "DIRECT_RATING"}
                      onChange={() => setContestFlowMode("DIRECT_RATING")}
                      className="accent-purple-500"
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    Teilnehmer-Uploads sind gesperrt. Du als Admin lädst alle Fotos vorab hoch und Teilnehmer/Juroren werden direkt zum Bewerten eingeladen.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 2: Zugang & Teilnehmer */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Users className="h-4 w-4 text-sky-400" />
            <h2 className="text-base font-semibold text-white">2. Teilnehmerzugang & Einladungen</h2>
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
                  Jeder mit dem Link kann teilnehmen, indem er sich mit Name & E-Mail anmeldet und Fotos hochlädt.
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
                  Nur Personen auf der Teilnehmerliste erhalten Zugang per personalisiertem Link / QR-Code.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Teilnehmer-Begrenzung (optional)
              </label>
              <input
                type="number"
                min={1}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="z. B. 25 (leer lassen für unbegrenzt)"
                className="w-full sm:w-1/2 rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Maximale Gesamtanzahl an Personen, die am Wettbewerb teilnehmen dürfen.
              </span>
            </div>
          </div>

          {/* User Picker for existing registered users */}
          <div className="pt-3 border-t border-neutral-800/80">
            <UserPicker
              label="Registrierte Benutzer als Teilnehmer auswählen"
              description="Wähle direkt bestehende Benutzerkonten aus der Plattform aus. Diese Nutzer erhalten eine personalisierte Einladung ohne erneute Passwortvergabe."
              selectedEmails={selectedParticipantUsers}
              onChange={setSelectedParticipantUsers}
              accentColor="sky"
            />
          </div>

          {/* Additional manual email addresses */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Weitere externe E-Mail-Adressen (optional für noch nicht registrierte Personen)
            </label>
            <textarea
              rows={2}
              value={participantEmails}
              onChange={(e) => setParticipantEmails(e.target.value)}
              placeholder="neueteilnehmerin@mail.de, gast@mail.de (oder Zeile für Zeile)"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none font-mono"
            />
            <span className="text-[11px] text-neutral-400 mt-1 block">
              Erzeugt automatische Einladungslinks und Einladungs-E-Mails zur Passwortvergabe für neue Personen.
            </span>
          </div>
        </div>

        {/* SECTION 3: Zeiträume & Fristen */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">3. Fristen & Zeiträume</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block">
                Einreichungsphase
              </span>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Beginn der Einreichung</label>
                <input
                  type="datetime-local"
                  required
                  value={submissionStart}
                  onChange={(e) => setSubmissionStart(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Ende der Einreichung (Deadline)</label>
                <input
                  type="datetime-local"
                  required
                  value={submissionEnd}
                  onChange={(e) => {
                    setSubmissionEnd(e.target.value);
                    if (ratingStart < e.target.value) setRatingStart(e.target.value);
                  }}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 block">
                Jurierungsphase (0-10 Punkte)
              </span>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Start der Bewertung</label>
                <input
                  type="datetime-local"
                  required
                  value={ratingStart}
                  onChange={(e) => setRatingStart(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Ende der Bewertung (Ergebnis steht fest)</label>
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

        {/* SECTION 4: Bewertungssystem & Jury */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            <h2 className="text-base font-semibold text-white">4. Bewertung & Jury-Modus</h2>
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
                  <span className="font-semibold text-sm text-white">Exklusive Fach-Jury</span>
                  <input
                    type="radio"
                    name="votingMode"
                    checked={votingMode === "EXCLUSIVE_JURY"}
                    onChange={() => setVotingMode("EXCLUSIVE_JURY")}
                    className="accent-purple-500"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  Teilnehmer können die Bilder nicht bewerten. Nur bestimmte Juroren mit Jury-Zugang bewerten (0-10 Punkte).
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
                  <span className="font-semibold text-sm text-white">Teilnehmer-Bewertung (Peer-Review)</span>
                  <input
                    type="radio"
                    name="votingMode"
                    checked={votingMode === "PEER_REVIEW"}
                    onChange={() => setVotingMode("PEER_REVIEW")}
                    className="accent-purple-500"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  Alle Teilnehmer dürfen nach Fristende die Bilder der anderen mitbewerten (eigenes Bild gesperrt).
                </p>
              </div>
            </label>
          </div>

          {votingMode === "EXCLUSIVE_JURY" && (
            <div className="space-y-4 pt-2 border-t border-neutral-800/80">
              <UserPicker
                label="Registrierte Benutzer als Juroren auswählen"
                description="Wähle bestehende Nutzer als Fach-Juroren aus. Diese erhalten eine Einladung zur Jurierung."
                selectedEmails={selectedJurorUsers}
                onChange={setSelectedJurorUsers}
                accentColor="purple"
              />

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Weitere externe Jury-E-Mails (optional)
                </label>
                <textarea
                  rows={2}
                  value={jurorEmails}
                  onChange={(e) => setJurorEmails(e.target.value)}
                  placeholder="gastjuror@fotoclub.de, experte@mail.de (oder Zeile für Zeile)"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none font-mono"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Diese Personen erhalten direkten Jury-Status und können mit 0–10 Punkten bewerten.
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymousJudging}
                onChange={(e) => setAnonymousJudging(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-800 bg-neutral-950 accent-purple-500"
              />
              <span className="text-xs text-neutral-300 font-medium">
                Anonyme Bewertung aktivieren (Namen der Fotografen werden für Juroren ausgeblendet)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={publicResults}
                onChange={(e) => setPublicResults(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-800 bg-neutral-950 accent-purple-500"
              />
              <span className="text-xs text-neutral-300 font-medium">
                Ergebnisse für Teilnehmer öffentlich freischalten (wenn deaktiviert, kann nur der Admin die Rangliste sehen)
              </span>
            </label>
          </div>
        </div>

        {/* SECTION 5: Bildregeln & technische Vorgaben */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <FileCheck className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">5. Bildregeln & Technische Vorgaben</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Max. Dateigröße (MB)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="50"
                value={maxFileSizeMb}
                onChange={(e) => setMaxFileSizeMb(parseFloat(e.target.value) || 15)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Seitenverhältnis
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="free">Frei wählbar</option>
                <option value="3:2">3:2 (Standard DSLR)</option>
                <option value="16:9">16:9 (Breitbild)</option>
                <option value="4:3">4:3 (MFT / Mittelformat)</option>
                <option value="1:1">1:1 (Quadratisch)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Dateiformate
              </label>
              <input
                type="text"
                value={allowedFormats}
                onChange={(e) => setAllowedFormats(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
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
              <label className="block text-xs text-neutral-400 mb-1">Max. Breite (optional)</label>
              <input
                type="number"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value ? Number(e.target.value) : "")}
                placeholder="z. B. 4000"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Max. Höhe (optional)</label>
              <input
                type="number"
                value={maxHeight}
                onChange={(e) => setMaxHeight(e.target.value ? Number(e.target.value) : "")}
                placeholder="z. B. 3000"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Namenskonvention / Vorgabe (optional)
            </label>
            <input
              type="text"
              value={namingPattern}
              onChange={(e) => setNamingPattern(e.target.value)}
              placeholder="z. B. Thema_Fotograf_Titel"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION 6: Themen / Kategorien */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              <h2 className="text-base font-semibold text-white">6. Themen / Kategorien</h2>
            </div>

            <button
              type="button"
              onClick={handleAddTopic}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Thema hinzufügen
            </button>
          </div>

          <div className="space-y-4">
            {topics.map((t, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400">Thema #{idx + 1}</span>
                  {topics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="text-neutral-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-neutral-400 mb-1">Titel des Themas *</label>
                    <input
                      type="text"
                      required
                      value={t.title}
                      onChange={(e) => handleTopicChange(idx, "title", e.target.value)}
                      placeholder="z. B. Makrowelt oder Schwarzweiß"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Max. Bilder pro Person
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={t.maxSubmissionsPerUser}
                      onChange={(e) =>
                        handleTopicChange(idx, "maxSubmissionsPerUser", parseInt(e.target.value, 10) || 1)
                      }
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Themenbeschreibung / Leitfaden
                  </label>
                  <input
                    type="text"
                    value={t.description}
                    onChange={(e) => handleTopicChange(idx, "description", e.target.value)}
                    placeholder="Kurze Notiz für Teilnehmer, was erlaubt ist..."
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification settings */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendNotificationEmails}
              onChange={(e) => setSendNotificationEmails(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-800 bg-neutral-950 accent-purple-500 mt-0.5"
            />
            <div className="text-xs">
              <span className="font-semibold text-white block">
                Einladungs-E-Mails jetzt direkt an alle ausgewählten Teilnehmer & Juroren versenden
              </span>
              <span className="text-neutral-400 block mt-0.5">
                Bestehende Benutzer erhalten eine direkte Einladung zum Wettbewerb. Noch nicht registrierte Personen erhalten ihren Aktivierungslink.
              </span>
            </div>
          </label>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <Link
            href="/admin"
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition disabled:opacity-50"
          >
            {isSubmitting ? "Wettbewerb wird erstellt..." : "Wettbewerb jetzt veröffentlichen"}
          </button>
        </div>
      </form>
    </div>
  );
}
