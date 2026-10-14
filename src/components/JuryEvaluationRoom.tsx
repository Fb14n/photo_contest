"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
  Clock,
  Camera,
  Info,
  Maximize2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export interface JurySubmission {
  id: string;
  contestId: string;
  topicId: string;
  topicTitle: string;
  title: string;
  description?: string | null;
  filePath: string;
  width: number;
  height: number;
  aspectRatio?: string | null;
  cameraModel?: string | null;
  lens?: string | null;
  focalLength?: string | null;
  iso?: number | null;
  aperture?: string | null;
  shutterSpeed?: string | null;
  takenAt?: string | null;
  photographerName: string;
  myRating?: {
    id: string;
    score: number;
    comment?: string | null;
  } | null;
}

interface JuryEvaluationRoomProps {
  contestId: string;
  contestTitle: string;
  votingMode: string;
  anonymousJudging: boolean;
  submissions: JurySubmission[];
  onRatingSaved: () => void;
}

export default function JuryEvaluationRoom({
  contestId,
  contestTitle,
  submissions,
  onRatingSaved,
}: JuryEvaluationRoomProps) {
  const [filter, setFilter] = useState<"all" | "unrated" | "rated">("all");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (filter === "unrated") return !s.myRating;
    if (filter === "rated") return !!s.myRating;
    return true;
  });

  const currentSub = filteredSubmissions[currentIndex] || null;

  // Active score & comment for the currently viewed image
  const [activeScore, setActiveScore] = useState<number>(
    currentSub?.myRating?.score !== undefined ? currentSub.myRating.score : 7
  );
  const [activeComment, setActiveComment] = useState<string>(
    currentSub?.myRating?.comment || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExif, setShowExif] = useState(true);

  // Sync state whenever currentSub changes
  useEffect(() => {
    if (currentSub) {
      setActiveScore(currentSub.myRating?.score !== undefined ? currentSub.myRating.score : 7);
      setActiveComment(currentSub.myRating?.comment || "");
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  }, [currentSub]);

  // Handle save rating
  const handleSaveScore = useCallback(
    async (scoreToSave: number, commentToSave: string) => {
      if (!currentSub) return;
      try {
        setIsSaving(true);
        setErrorMessage(null);

        const res = await fetch(`/api/contests/${contestId}/ratings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: currentSub.id,
            score: scoreToSave,
            comment: commentToSave,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error || "Fehler beim Speichern der Bewertung.");
          return;
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        onRatingSaved();
      } catch {
        setErrorMessage("Netzwerkfehler.");
      } finally {
        setIsSaving(false);
      }
    },
    [contestId, currentSub, onRatingSaved]
  );

  // Navigation helpers
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < filteredSubmissions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, filteredSubmissions.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key >= "0" && e.key <= "9") {
        const num = parseInt(e.key, 10);
        setActiveScore(num);
        handleSaveScore(num, activeComment);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, handleSaveScore, activeComment]);

  const ratedCount = submissions.filter((s) => s.myRating).length;
  const totalCount = submissions.length;
  const progressPercent = totalCount > 0 ? Math.round((ratedCount / totalCount) * 100) : 0;

  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-12 text-center">
        <Camera className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
        <h3 className="text-lg font-bold text-white">Noch keine Einreichungen vorhanden</h3>
        <p className="text-sm text-neutral-400 mt-1">
          Für diesen Wettbewerb wurden bisher noch keine Bilder hochgeladen.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 backdrop-blur">
        <div>
          <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold">
            Jury-Bewertungsraum (0 – 10 Punkte)
          </span>
          <h2 className="text-xl font-extrabold text-white">{contestTitle}</h2>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-neutral-300">
              {ratedCount} von {totalCount} bewertet ({progressPercent}%)
            </span>
            <div className="mt-1.5 h-2 w-44 overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-sky-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setFilter("all");
            setCurrentIndex(0);
          }}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            filter === "all"
              ? "bg-neutral-800 text-white border border-neutral-700"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          Alle Bilder ({submissions.length})
        </button>
        <button
          onClick={() => {
            setFilter("unrated");
            setCurrentIndex(0);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            filter === "unrated"
              ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Noch offen ({submissions.length - ratedCount})
        </button>
        <button
          onClick={() => {
            setFilter("rated");
            setCurrentIndex(0);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            filter === "rated"
              ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Bereits bewertet ({ratedCount})
        </button>
      </div>

      {currentSub ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Photo Viewer (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="relative flex min-h-[500px] max-h-[700px] items-center justify-center overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSub.filePath}
                alt={currentSub.title}
                className="max-h-[660px] w-auto max-w-full rounded-xl object-contain select-none"
              />

              {/* Navigation overlays */}
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/90 disabled:opacity-20 disabled:cursor-not-allowed transition"
                title="Vorheriges Bild (Pfeil links)"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === filteredSubmissions.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/90 disabled:opacity-20 disabled:cursor-not-allowed transition"
                title="Nächstes Bild (Pfeil rechts)"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Status Tag on image */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur border border-white/10">
                  {currentSub.topicTitle}
                </span>

                {currentSub.myRating ? (
                  <span className="flex items-center gap-1 rounded-lg bg-emerald-500/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur shadow">
                    <Star className="h-3.5 w-3.5 fill-white" />
                    Bewertet: {currentSub.myRating.score} / 10
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-lg bg-amber-500/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                    Noch nicht bewertet
                  </span>
                )}
              </div>

              {/* Counter overlay */}
              <div className="absolute bottom-4 right-4 rounded-lg bg-black/70 px-3 py-1 text-xs font-mono text-neutral-300 backdrop-blur border border-white/10">
                {currentIndex + 1} / {filteredSubmissions.length}
              </div>
            </div>

            {/* Thumbnail Carousel */}
            <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {filteredSubmissions.map((sub, idx) => (
                <button
                  key={sub.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`group relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    idx === currentIndex
                      ? "border-purple-500 ring-2 ring-purple-500/40"
                      : "border-neutral-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sub.filePath} alt="" className="h-full w-full object-cover" />
                  {sub.myRating && (
                    <div className="absolute bottom-1 right-1 rounded-full bg-emerald-500 p-0.5 text-white shadow">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Sidebar & Info (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Image Details Card */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white leading-snug">{currentSub.title}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Fotograf: <span className="text-neutral-200 font-medium">{currentSub.photographerName}</span>
                  </p>
                </div>

                <button
                  onClick={() => setShowExif(!showExif)}
                  className="rounded-lg border border-neutral-800 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                  title="EXIF-Kameradaten anzeigen/ausblenden"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              {currentSub.description && (
                <p className="text-xs text-neutral-300 bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/80 my-3">
                  &ldquo;{currentSub.description}&rdquo;
                </p>
              )}

              {/* EXIF Data */}
              {showExif && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-3">
                  {currentSub.cameraModel && (
                    <div className="col-span-2 flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{currentSub.cameraModel}</span>
                    </div>
                  )}
                  {currentSub.lens && (
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="text-neutral-500">Objektiv:</span>
                      <span className="truncate text-neutral-300">{currentSub.lens}</span>
                    </div>
                  )}
                  {currentSub.aperture && (
                    <div>
                      Blende: <strong className="text-neutral-200">{currentSub.aperture}</strong>
                    </div>
                  )}
                  {currentSub.shutterSpeed && (
                    <div>
                      Zeit: <strong className="text-neutral-200">{currentSub.shutterSpeed}</strong>
                    </div>
                  )}
                  {currentSub.iso && (
                    <div>
                      ISO: <strong className="text-neutral-200">{currentSub.iso}</strong>
                    </div>
                  )}
                  {currentSub.focalLength && (
                    <div>
                      Brennweite: <strong className="text-neutral-200">{currentSub.focalLength}</strong>
                    </div>
                  )}
                  <div className="col-span-2 text-neutral-500">
                    Auflösung: {currentSub.width} x {currentSub.height} px ({currentSub.aspectRatio})
                  </div>
                </div>
              )}
            </div>

            {/* Rating Controls Card */}
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 backdrop-blur shadow-xl shadow-purple-950/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                  Bewertung (0 bis 10)
                </span>
                <span className="text-3xl font-black text-white flex items-center gap-1">
                  {activeScore.toFixed(1)}
                  <span className="text-xs font-normal text-purple-300">/ 10</span>
                </span>
              </div>

              {/* Quick Number Buttons 0 to 10 */}
              <div className="grid grid-cols-6 gap-1.5 mb-4">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setActiveScore(num);
                      handleSaveScore(num, activeComment);
                    }}
                    className={`rounded-xl py-2 text-xs font-bold transition ${
                      Math.round(activeScore) === num
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105"
                        : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-purple-500/50 hover:bg-neutral-800"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Fine-Tuning Slider */}
              <div className="mb-4">
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Feinabstimmung (Slider)</span>
                  <span>{activeScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={activeScore}
                  onChange={(e) => setActiveScore(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Juror Comment */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                  Begründung / Jury-Feedback (optional)
                </label>
                <textarea
                  value={activeComment}
                  onChange={(e) => setActiveComment(e.target.value)}
                  rows={2}
                  placeholder="Kritik, Lob zu Komposition, Farbharmonie, Bildausschnitt..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Feedback messages */}
              {errorMessage && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-emerald-400 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Bewertung erfolgreich gespeichert!</span>
                </div>
              )}

              {/* Save & Next Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveScore(activeScore, activeComment)}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50 transition"
                >
                  <Star className="h-3.5 w-3.5 fill-white" />
                  {currentSub.myRating ? "Bewertung ändern" : "Note speichern"}
                </button>

                {currentIndex < filteredSubmissions.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
                    title="Nächstes Bild"
                  >
                    Weiter
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                )}
              </div>

              <p className="mt-3 text-[10px] text-center text-neutral-400">
                Tipp: Tasten <kbd className="px-1 py-0.5 bg-neutral-800 rounded">0-9</kbd> bewerten direkt,{" "}
                <kbd className="px-1 py-0.5 bg-neutral-800 rounded">←</kbd> /{" "}
                <kbd className="px-1 py-0.5 bg-neutral-800 rounded">→</kbd> wechseln das Foto.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
          <h3 className="text-lg font-bold text-white">Alles erledigt!</h3>
          <p className="text-sm text-neutral-400 mt-1">
            Du hast alle Bilder in diesem Filter bewertet. Du kannst deine Noten bis zum Ende der
            Jurierungszeit jederzeit im Tab &bdquo;Bereits bewertet&ldquo; ändern.
          </p>
        </div>
      )}
    </div>
  );
}
