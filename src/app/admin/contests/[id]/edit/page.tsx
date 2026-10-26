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
} from "lucide-react";

interface EditableTopic {
  id?: string;
  title: string;
  description: string;
  maxSubmissionsPerUser: number;
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("SUBMISSION");
  const [accessType, setAccessType] = useState("OPEN");
  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [submissionStart, setSubmissionStart] = useState("");
  const [submissionEnd, setSubmissionEnd] = useState("");
  const [ratingStart, setRatingStart] = useState("");
  const [ratingEnd, setRatingEnd] = useState("");
  const [votingMode, setVotingMode] = useState("EXCLUSIVE_JURY");
  const [anonymousJudging, setAnonymousJudging] = useState(true);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(15.0);
  const [allowedFormats, setAllowedFormats] = useState("image/jpeg,image/png,image/webp");
  const [minWidth, setMinWidth] = useState<number | "">("");
  const [minHeight, setMinHeight] = useState<number | "">("");
  const [maxWidth, setMaxWidth] = useState<number | "">("");
  const [maxHeight, setMaxHeight] = useState<number | "">("");
  const [aspectRatio, setAspectRatio] = useState("free");
  const [namingPattern, setNamingPattern] = useState("");
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
          setTitle(c.title);
          setDescription(c.description);
          setStatus(c.status);
          setAccessType(c.accessType);
          setMaxParticipants(c.maxParticipants ? String(c.maxParticipants) : "");
          setSubmissionStart(new Date(c.submissionStart).toISOString().slice(0, 16));
          setSubmissionEnd(new Date(c.submissionEnd).toISOString().slice(0, 16));
          setRatingStart(new Date(c.ratingStart).toISOString().slice(0, 16));
          setRatingEnd(new Date(c.ratingEnd).toISOString().slice(0, 16));
          setVotingMode(c.votingMode);
          setAnonymousJudging(c.anonymousJudging);
          setMaxFileSizeMb(c.maxFileSizeMb);
          setAllowedFormats(c.allowedFormats);
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
      .catch(() => setErrorMessage("Fehler beim Laden"))
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
          title,
          description,
          status,
          accessType,
          maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
          submissionStart,
          submissionEnd,
          ratingStart,
          ratingEnd,
          votingMode,
          anonymousJudging,
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
      if (data.success) {
        setSuccessMessage("Wettbewerb erfolgreich aktualisiert.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.error || "Aktualisierung fehlgeschlagen");
      }
    } catch {
      setErrorMessage("Fehler beim Speichern");
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
        <span className="text-emerald-400">Wettbewerb bearbeiten</span>
      </div>

      <div className="border-b border-neutral-800 pb-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Wettbewerb bearbeiten</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Passe Fristen, Regeln oder Status für <strong className="text-neutral-200">{title}</strong> an.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/contests/${resolvedParams.id}/stats`}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800"
          >
            Statistiken
          </Link>
          <Link
            href={`/admin/contests/${resolvedParams.id}/invites`}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800"
          >
            Einladungen
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Status override */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Status & Veröffentlichung</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Manueller Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white"
              >
                <option value="SUBMISSION">SUBMISSION (Einreichungsphase)</option>
                <option value="RATING">RATING (Jurierungsphase)</option>
                <option value="FINISHED">FINISHED (Abgeschlossen)</option>
                <option value="DRAFT">DRAFT (Entwurf / Verborgen)</option>
                <option value="ARCHIVED">ARCHIVED (Archiv)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Zugangstyp</label>
              <select
                value={accessType}
                onChange={(e) => setAccessType(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white"
              >
                <option value="OPEN">Offener Link (Öffentlich)</option>
                <option value="INVITE_ONLY">Geschlossen (Nur mit Einladung)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Max. Teilnehmer</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Unbegrenzt"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Basic fields */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Allgemeine Angaben</h2>
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Titel</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Beschreibung</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-sm text-white"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Zeiträume</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Einreichung Start</label>
              <input
                type="datetime-local"
                value={submissionStart}
                onChange={(e) => setSubmissionStart(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Einreichung Ende</label>
              <input
                type="datetime-local"
                value={submissionEnd}
                onChange={(e) => setSubmissionEnd(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Jurierung Start</label>
              <input
                type="datetime-local"
                value={ratingStart}
                onChange={(e) => setRatingStart(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Jurierung Ende</label>
              <input
                type="datetime-local"
                value={ratingEnd}
                onChange={(e) => setRatingEnd(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Topics / Categories */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                Themenkategorien ({topics.length})
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Verwalte Themen für diesen Wettbewerb. Hinweis: Themen mit bestehenden Fotoeinreichungen können zum Schutz vor Datenverlust nicht gelöscht werden.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTopic}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Thema hinzufügen
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {topics.map((topic, index) => (
              <div
                key={topic.id || `topic-${index}`}
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-semibold text-purple-400 w-5">#{index + 1}</span>
                    <input
                      type="text"
                      required
                      placeholder="Thementitel (z. B. Schwarzweiß, Makro, Landschaft)"
                      value={topic.title}
                      onChange={(e) => handleTopicChange(index, "title", e.target.value)}
                      className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] text-neutral-400 whitespace-nowrap">Max. Fotos / Fotograf:</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={topic.maxSubmissionsPerUser}
                        onChange={(e) => handleTopicChange(index, "maxSubmissionsPerUser", parseInt(e.target.value, 10) || 1)}
                        className="w-16 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-center text-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(index)}
                      disabled={topics.length <= 1}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-20"
                      title="Thema entfernen"
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

        {/* Photo rules */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Bildregeln</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Max. Dateigröße (MB)</label>
              <input
                type="number"
                step="0.5"
                value={maxFileSizeMb}
                onChange={(e) => setMaxFileSizeMb(parseFloat(e.target.value) || 15)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Seitenverhältnis</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              >
                <option value="free">Frei wählbar</option>
                <option value="3:2">3:2</option>
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="1:1">1:1</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Erlaubte Formate</label>
              <input
                type="text"
                value={allowedFormats}
                onChange={(e) => setAllowedFormats(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
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
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Min. Höhe (px)</label>
              <input
                type="number"
                value={minHeight}
                onChange={(e) => setMinHeight(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Max. Breite (px)</label>
              <input
                type="number"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Max. Höhe (px)</label>
              <input
                type="number"
                value={maxHeight}
                onChange={(e) => setMaxHeight(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <Link
            href="/admin"
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white"
          >
            Zurück
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition disabled:opacity-50"
          >
            {isSaving ? "Wird gespeichert..." : "Änderungen speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
