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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Layers,
} from "lucide-react";

export interface TopicInfo {
  id: string;
  title: string;
  description?: string | null;
}

export interface JurySubmission {
  id: string;
  contestId: string;
  topicId: string;
  topicTitle: string;
  title: string;
  description?: string | null;
  filePath: string;
  thumbnailUrl?: string;
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
  isOwn?: boolean;
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
  topics?: TopicInfo[];
  onRatingSaved: () => void;
}

export default function JuryEvaluationRoom({
  contestId,
  contestTitle,
  submissions,
  topics,
  onRatingSaved,
}: JuryEvaluationRoomProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "unrated" | "rated">("all");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine topics from props and from submissions
  const allTopics: TopicInfo[] = (() => {
    const map = new Map<string, TopicInfo>();
    if (topics && topics.length > 0) {
      for (const t of topics) {
        map.set(t.id, t);
      }
    }
    for (const sub of submissions) {
      if (sub.topicId && !map.has(sub.topicId)) {
        map.set(sub.topicId, {
          id: sub.topicId,
          title: sub.topicTitle || "Thema",
        });
      }
    }
    return Array.from(map.values());
  })();

  // Eligible submissions: exclude juror's own submissions from evaluation
  const eligibleSubmissions = submissions.filter((s) => !s.isOwn);

  // Filtered by Topic
  const topicSubmissions = eligibleSubmissions.filter((s) => {
    if (selectedTopicId === "all") return true;
    return s.topicId === selectedTopicId;
  });

  // Filtered by Rating Status (all / unrated / rated)
  const filteredSubmissions = topicSubmissions.filter((s) => {
    if (filter === "unrated") return !s.myRating;
    if (filter === "rated") return !!s.myRating;
    return true;
  });

  const currentSub = filteredSubmissions[currentIndex] || null;
  const activeTopicObj = allTopics.find((t) => t.id === selectedTopicId) || null;

  // Active score & comment for the currently viewed image (null if not yet rated)
  const [activeScore, setActiveScore] = useState<number | null>(
    currentSub?.myRating?.score !== undefined ? currentSub.myRating.score : null
  );
  const [activeComment, setActiveComment] = useState<string>(
    currentSub?.myRating?.comment || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExif, setShowExif] = useState(true);

  // Lightbox & Zoom State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showLightboxExif, setShowLightboxExif] = useState(true);

  const handleOpenLightbox = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Sync state whenever currentSub changes
  useEffect(() => {
    if (currentSub) {
      setActiveScore(currentSub.myRating?.score !== undefined ? currentSub.myRating.score : null);
      setActiveComment(currentSub.myRating?.comment || "");
      setSaveSuccess(false);
      setErrorMessage(null);
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [currentSub]);

  // Handle save rating
  const handleSaveScore = useCallback(
    async (scoreToSave: number | null, commentToSave: string) => {
      if (!currentSub || scoreToSave === null) return;
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
      if (e.key === "Escape") {
        if (lightboxOpen) {
          e.preventDefault();
          handleCloseLightbox();
        }
      } else if (e.key === "ArrowLeft") {
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
  }, [handlePrev, handleNext, handleSaveScore, activeComment, lightboxOpen]);

  const totalEligibleCount = eligibleSubmissions.length;
  const totalRatedCount = eligibleSubmissions.filter((s) => !!s.myRating).length;
  const overallProgressPercent = totalEligibleCount > 0 ? Math.round((totalRatedCount / totalEligibleCount) * 100) : 0;

  const currentScopeTotal = topicSubmissions.length;
  const currentScopeRated = topicSubmissions.filter((s) => !!s.myRating).length;
  const currentScopeProgressPercent = currentScopeTotal > 0 ? Math.round((currentScopeRated / currentScopeTotal) * 100) : 0;

  const currentTopicIndex = allTopics.findIndex((t) => t.id === selectedTopicId);
  const nextTopic = currentTopicIndex >= 0 && currentTopicIndex < allTopics.length - 1 ? allTopics[currentTopicIndex + 1] : null;

  if (eligibleSubmissions.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-12 text-center">
        <Camera className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
        <h3 className="text-lg font-bold text-white">Keine fremden Bilder zur Bewertung</h3>
        <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto">
          Es gibt aktuell keine Bilder anderer Teilnehmer, die du bewerten kannst. Eigene Einreichungen sind von deiner Bewertung ausgeschlossen.
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
              {selectedTopicId === "all" ? (
                <>
                  {totalRatedCount} von {totalEligibleCount} bewertet ({overallProgressPercent}%)
                </>
              ) : (
                <>
                  {currentScopeRated} von {currentScopeTotal} bewertet in „{activeTopicObj?.title}“ ({currentScopeProgressPercent}%)
                </>
              )}
            </span>
            <div className="mt-1.5 h-2 w-48 overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-sky-400 transition-all duration-300"
                style={{
                  width: `${selectedTopicId === "all" ? overallProgressPercent : currentScopeProgressPercent}%`,
                }}
              />
            </div>
            {selectedTopicId !== "all" && (
              <span className="text-[10px] text-neutral-500 mt-1 font-mono">
                Gesamtwettbewerb: {totalRatedCount}/{totalEligibleCount} ({overallProgressPercent}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Topic / Sparte Selector Bar */}
      {allTopics.length > 1 && (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              Sparte / Thema auswählen:
            </span>
            <span className="text-xs text-neutral-500 font-medium">
              {allTopics.length} Sparten im Wettbewerb
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedTopicId("all");
                setCurrentIndex(0);
              }}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border ${
                selectedTopicId === "all"
                  ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30"
                  : "bg-neutral-950/80 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white"
              }`}
            >
              <span>Alle Sparten</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                selectedTopicId === "all" ? "bg-black/40 text-purple-200" : "bg-neutral-800 text-neutral-400"
              }`}>
                {eligibleSubmissions.length}
              </span>
              {totalEligibleCount > 0 && totalRatedCount === totalEligibleCount && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              )}
            </button>

            {allTopics.map((topic, tIdx) => {
              const subsInThisTopic = eligibleSubmissions.filter((s) => s.topicId === topic.id);
              const ratedInThisTopic = subsInThisTopic.filter((s) => s.myRating).length;
              const isSelected = selectedTopicId === topic.id;
              const isComplete = subsInThisTopic.length > 0 && ratedInThisTopic === subsInThisTopic.length;

              return (
                <button
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopicId(topic.id);
                    setCurrentIndex(0);
                  }}
                  className={`rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border ${
                    isSelected
                      ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30"
                      : "bg-neutral-950/80 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white"
                  }`}
                >
                  <span className="text-neutral-500 font-mono text-[11px]">#{tIdx + 1}</span>
                  <span>{topic.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                      isSelected
                        ? "bg-black/40 text-purple-200 font-semibold"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {ratedInThisTopic} / {subsInThisTopic.length}
                  </span>
                  {isComplete && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs (All / Open / Rated in selected scope) */}
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
          Alle ({topicSubmissions.length})
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
          Noch offen ({topicSubmissions.length - currentScopeRated})
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
          Bereits bewertet ({currentScopeRated})
        </button>
      </div>

      {currentSub ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Photo Viewer (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="relative flex min-h-[500px] max-h-[700px] items-center justify-center overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSub.filePath}
                alt={currentSub.title}
                onClick={handleOpenLightbox}
                className="max-h-[660px] w-auto max-w-full rounded-xl object-contain select-none cursor-zoom-in transition group-hover:brightness-105"
                title="Klicken für 100% Zoom & Vollbild-Lupe"
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
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
                <span className="flex items-center gap-1.5 rounded-lg bg-black/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur border border-purple-500/40 shadow-lg">
                  <Layers className="h-3.5 w-3.5 text-purple-400" />
                  Sparte: {currentSub.topicTitle}
                </span>

                {currentSub.myRating ? (
                  <span className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur shadow-lg border border-emerald-400/30">
                    <Star className="h-3.5 w-3.5 fill-white" />
                    Bewertet: {currentSub.myRating.score} / 10
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-lg bg-amber-600/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur shadow-lg border border-amber-400/30">
                    Noch nicht bewertet
                  </span>
                )}
              </div>

              {/* Zoom & Fullscreen button */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={handleOpenLightbox}
                  className="flex items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur border border-white/15 hover:bg-purple-600 transition shadow-lg"
                  title="Vollbild & Zoom-Lupe öffnen"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                  <span>Zoom / Lupe</span>
                </button>
              </div>

              {/* Counter overlay */}
              <div className="absolute bottom-4 right-4 rounded-lg bg-black/80 px-3 py-1.5 text-xs font-mono font-bold text-neutral-200 backdrop-blur border border-white/10 shadow-lg">
                Foto {currentIndex + 1} von {filteredSubmissions.length}
                {selectedTopicId !== "all" && (
                  <span className="text-purple-300 font-normal ml-1">
                    (in {activeTopicObj?.title})
                  </span>
                )}
              </div>
            </div>

            {/* Camera Roll / Filmstrip with topic grouping */}
            <div className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-3 backdrop-blur">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-purple-400" />
                  {selectedTopicId === "all"
                    ? `Alle Sparten (${filteredSubmissions.length} Fotos in ${allTopics.length} Sparten)`
                    : `Sparte: ${activeTopicObj?.title} (${filteredSubmissions.length} Fotos)`}
                </span>
                <span className="text-neutral-400">
                  Auswahl: <strong className="text-white font-mono">{filteredSubmissions.length > 0 ? currentIndex + 1 : 0}</strong> / {filteredSubmissions.length}
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin items-center">
                {selectedTopicId === "all" ? (
                  // Grouped by Sparte with clear section capsules
                  allTopics.map((topic, tIdx) => {
                    const subsInTopic = filteredSubmissions.filter((s) => s.topicId === topic.id);
                    if (subsInTopic.length === 0) return null;
                    const ratedInTopic = subsInTopic.filter((s) => !!s.myRating).length;
                    const isTopicFinished = ratedInTopic === subsInTopic.length;

                    return (
                      <div
                        key={topic.id}
                        className="flex items-center gap-2.5 shrink-0 bg-neutral-950/80 p-2.5 rounded-2xl border border-neutral-800 shadow-md"
                      >
                        {/* Section Header Capsule */}
                        <div className="flex flex-col justify-center px-3 py-1.5 bg-neutral-900 rounded-xl border border-neutral-800 text-left shrink-0">
                          <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">
                            Sparte #{tIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-[120px]" title={topic.title}>
                            {topic.title}
                          </span>
                          <span className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                            <span>{ratedInTopic}/{subsInTopic.length} bewertet</span>
                            {isTopicFinished && <CheckCircle2 className="h-3 w-3 text-emerald-400 inline" />}
                          </span>
                        </div>

                        {/* Thumbnails in this Sparte */}
                        <div className="flex items-center gap-2">
                          {subsInTopic.map((sub) => {
                            const globalIdx = filteredSubmissions.findIndex((s) => s.id === sub.id);
                            const isSelected = globalIdx === currentIndex;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => setCurrentIndex(globalIdx)}
                                className={`group relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                                  isSelected
                                    ? "border-purple-500 ring-2 ring-purple-500/50 scale-105 z-10"
                                    : "border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-600"
                                }`}
                                title={`${sub.title} (${sub.topicTitle})`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={sub.thumbnailUrl || sub.filePath}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                                {sub.myRating ? (
                                  <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-md bg-emerald-600/90 backdrop-blur px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                                    <Star className="h-2.5 w-2.5 fill-white" />
                                    <span>{sub.myRating.score}</span>
                                  </div>
                                ) : (
                                  <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-black" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Single Topic Filmstrip
                  filteredSubmissions.map((sub, idx) => {
                    const isSelected = idx === currentIndex;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`group relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                          isSelected
                            ? "border-purple-500 ring-2 ring-purple-500/50 scale-105 z-10"
                            : "border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-600"
                        }`}
                        title={sub.title}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sub.thumbnailUrl || sub.filePath}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-mono font-bold text-neutral-300 backdrop-blur">
                          #{idx + 1}
                        </div>
                        {sub.myRating ? (
                          <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-md bg-emerald-600/90 backdrop-blur px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                            <Star className="h-2.5 w-2.5 fill-white" />
                            <span>{sub.myRating.score}</span>
                          </div>
                        ) : (
                          <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-black" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
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
                  {activeScore !== null ? (
                    <>
                      {activeScore.toFixed(1)}
                      <span className="text-xs font-normal text-purple-300">/ 10</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-neutral-400 italic">
                      Noch unbewertet
                    </span>
                  )}
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
                      activeScore !== null && Math.round(activeScore) === num
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
                  <span>{activeScore !== null ? `${activeScore.toFixed(1)} / 10` : "Nicht gesetzt"}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={activeScore !== null ? activeScore : 5}
                  onChange={(e) => setActiveScore(parseFloat(e.target.value))}
                  onMouseUp={() => {
                    if (activeScore !== null) {
                      handleSaveScore(activeScore, activeComment);
                    }
                  }}
                  onTouchEnd={() => {
                    if (activeScore !== null) {
                      handleSaveScore(activeScore, activeComment);
                    }
                  }}
                  className={`w-full accent-purple-500 cursor-pointer ${
                    activeScore === null ? "opacity-50" : ""
                  }`}
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
                  onClick={() => {
                    if (activeScore !== null) {
                      handleSaveScore(activeScore, activeComment);
                    }
                  }}
                  disabled={isSaving || activeScore === null}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Star className="h-3.5 w-3.5 fill-white" />
                  {activeScore === null
                    ? "Bitte Note wählen (0–10)"
                    : currentSub.myRating
                    ? "Bewertung aktualisieren"
                    : "Note speichern"}
                </button>

                {currentIndex < filteredSubmissions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
                    title="Nächstes Bild"
                  >
                    Weiter
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                ) : selectedTopicId !== "all" && nextTopic ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTopicId(nextTopic.id);
                      setCurrentIndex(0);
                    }}
                    className="flex items-center justify-center rounded-xl border border-purple-500/50 bg-purple-600/30 px-3.5 py-2.5 text-xs font-bold text-purple-200 hover:bg-purple-600/50 transition shadow-lg shadow-purple-600/20"
                    title={`Weiter zur nächsten Sparte: ${nextTopic.title}`}
                  >
                    <span>Nächste Sparte</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                ) : null}
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
          <h3 className="text-lg font-bold text-white">
            {selectedTopicId !== "all"
              ? `Alle Bilder in Sparte „${activeTopicObj?.title}“ bewertet!`
              : "Alles erledigt!"}
          </h3>
          <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto">
            {selectedTopicId !== "all" && nextTopic
              ? `Du hast diese Sparte vollständig abgeschlossen. Klicke unten, um direkt mit der nächsten Sparte „${nextTopic.title}“ fortzufahren.`
              : "Du hast alle Bilder in dieser Ansicht bewertet. Du kannst deine Noten bis zum Ende der Jurierungszeit jederzeit im Tab „Bereits bewertet“ anpassen."}
          </p>
          {selectedTopicId !== "all" && nextTopic && (
            <button
              onClick={() => {
                setSelectedTopicId(nextTopic.id);
                setCurrentIndex(0);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-600/30"
            >
              <span>Weiter zu Sparte: {nextTopic.title}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Lightbox / Zoom-Lupe Modal */}
      {lightboxOpen && currentSub && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onMouseUp={() => setIsDragging(false)}
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-950/90 z-20">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white truncate max-w-sm">
                {currentSub.title}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                ({currentIndex + 1} / {filteredSubmissions.length})
              </span>
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-purple-300">
                {currentSub.topicTitle}
              </span>
            </div>

            {/* Center: Zoom Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 transition"
                title="Verkleinern"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono font-semibold text-purple-400 px-2 py-1 bg-neutral-900 rounded-md border border-neutral-800">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomScale >= 4}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 transition"
                title="Vergrößern (bis 400%)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                title="Zoom zurücksetzen (100%)"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLightboxExif(!showLightboxExif)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  showLightboxExif
                    ? "bg-purple-600/20 text-purple-300 border-purple-500/30"
                    : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                }`}
                title="EXIF-Daten ein-/ausblenden"
              >
                <Info className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">EXIF</span>
              </button>

              <button
                onClick={handleCloseLightbox}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                title="Schließen (ESC)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main Stage */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              if (zoomScale > 1) {
                setIsDragging(true);
                setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
              }
            }}
            onMouseMove={(e) => {
              if (isDragging && zoomScale > 1) {
                setPanOffset({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y,
                });
              }
            }}
            onWheel={(e) => {
              e.preventDefault();
              if (e.deltaY < 0) {
                setZoomScale((prev) => Math.min(prev + 0.25, 4));
              } else {
                setZoomScale((prev) => {
                  const next = Math.max(prev - 0.25, 1);
                  if (next === 1) setPanOffset({ x: 0, y: 0 });
                  return next;
                });
              }
            }}
          >
            {/* Nav Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              disabled={currentIndex === 0}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900/80 text-white border border-neutral-700 backdrop-blur hover:bg-neutral-800 disabled:opacity-20 transition"
              title="Vorheriges Bild (Pfeil links)"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              disabled={currentIndex === filteredSubmissions.length - 1}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900/80 text-white border border-neutral-700 backdrop-blur hover:bg-neutral-800 disabled:opacity-20 transition"
              title="Nächstes Bild (Pfeil rechts)"
            >
              <ChevronRight className="h-7 w-7" />
            </button>

            {/* Scaled & Panned Image */}
            <div
              style={{
                transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              className="flex items-center justify-center max-w-full max-h-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSub.filePath}
                alt={currentSub.title}
                className="max-h-[82vh] max-w-[90vw] object-contain pointer-events-none select-none rounded shadow-2xl"
              />
            </div>
          </div>

          {/* Bottom EXIF / Hint Bar */}
          <div className="px-6 py-2.5 border-t border-neutral-800 bg-neutral-950/90 z-20 flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              {showLightboxExif && (
                <>
                  <span><strong>Auflösung:</strong> {currentSub.width} × {currentSub.height} px</span>
                  {currentSub.cameraModel && <span><strong>Kamera:</strong> {currentSub.cameraModel}</span>}
                  {currentSub.lens && <span><strong>Objektiv:</strong> {currentSub.lens}</span>}
                  {currentSub.focalLength && <span><strong>Brennweite:</strong> {currentSub.focalLength}</span>}
                  {currentSub.aperture && <span><strong>Blende:</strong> {currentSub.aperture}</span>}
                  {currentSub.shutterSpeed && <span><strong>Verschlusszeit:</strong> {currentSub.shutterSpeed}</span>}
                  {currentSub.iso && <span><strong>ISO:</strong> {currentSub.iso}</span>}
                </>
              )}
            </div>

            <div className="text-[11px] text-neutral-400 font-mono">
              Mausrad: Zoom | Ziehen: Verschieben | ESC: Schließen
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
