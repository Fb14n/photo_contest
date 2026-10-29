"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Plus,
  Lock,
} from "lucide-react";

export interface UploadRules {
  maxFileSizeMb: number;
  allowedFormats: string;
  minWidth?: number | null;
  minHeight?: number | null;
  maxWidth?: number | null;
  maxHeight?: number | null;
  aspectRatio?: string | null;
  namingPattern?: string | null;
}

export interface TopicItem {
  id: string;
  title: string;
  description?: string | null;
  maxSubmissionsPerUser: number;
}

interface QueuedItem {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  description: string;
  topicId: string;
  meta: {
    width: number;
    height: number;
    sizeMb: number;
    ratio: string;
    format: string;
  } | null;
  validationErrors: string[];
}

interface ImageUploadZoneProps {
  contestId: string;
  topics: TopicItem[];
  rules: UploadRules;
  submissionCounts?: Record<string, number>;
  isAdmin?: boolean;
  onUploadSuccess: () => void;
}

export default function ImageUploadZone({
  contestId,
  topics,
  rules,
  submissionCounts = {},
  isAdmin = false,
  onUploadSuccess,
}: ImageUploadZoneProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || "");
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];
  const activeTopicCount = activeTopic ? submissionCounts[activeTopic.id] || 0 : 0;
  const isActiveTopicFull = isAdmin ? false : (activeTopic ? activeTopicCount >= activeTopic.maxSubmissionsPerUser : false);

  const validateFileAsync = (file: File): Promise<{
    meta: QueuedItem["meta"];
    errors: string[];
    previewUrl: string;
  }> => {
    return new Promise((resolve) => {
      const sizeMb = file.size / (1024 * 1024);
      const format = file.type || file.name.split(".").pop() || "";
      const url = URL.createObjectURL(file);
      const errors: string[] = [];

      if (sizeMb > rules.maxFileSizeMb) {
        errors.push(`Dateigröße (${sizeMb.toFixed(1)} MB) ist größer als erlaubt (${rules.maxFileSizeMb} MB).`);
      }

      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const ratioNum = width / height;
        const ratioStr = `${width}:${height}`;

        if (rules.minWidth && width < rules.minWidth) {
          errors.push(`Breite (${width}px) kleiner als Mindestbreite von ${rules.minWidth}px.`);
        }
        if (rules.minHeight && height < rules.minHeight) {
          errors.push(`Höhe (${height}px) kleiner als Mindesthöhe von ${rules.minHeight}px.`);
        }
        if (rules.maxWidth && width > rules.maxWidth) {
          errors.push(`Breite (${width}px) überschreitet Maximalbreite von ${rules.maxWidth}px.`);
        }
        if (rules.maxHeight && height > rules.maxHeight) {
          errors.push(`Höhe (${height}px) überschreitet Maximalhöhe von ${rules.maxHeight}px.`);
        }

        if (rules.aspectRatio && rules.aspectRatio !== "free") {
          const parts = rules.aspectRatio.split(":").map(Number);
          if (parts.length === 2 && parts[0] && parts[1]) {
            const target = parts[0] / parts[1];
            const diffNormal = Math.abs(ratioNum - target);
            const diffInvert = Math.abs(ratioNum - 1 / target);
            if (diffNormal > 0.05 && diffInvert > 0.05) {
              errors.push(`Seitenverhältnis weicht von Vorgabe (${rules.aspectRatio}) ab.`);
            }
          }
        }

        resolve({
          previewUrl: url,
          meta: { width, height, sizeMb, ratio: ratioStr, format },
          errors,
        });
      };

      img.onerror = () => {
        resolve({
          previewUrl: url,
          meta: null,
          errors: ["Die Bilddatei konnte im Browser nicht dekodiert werden."],
        });
      };

      img.src = url;
    });
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const newItems: QueuedItem[] = [];

    for (const f of files) {
      const baseName = f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
      const capitalizedTitle = baseName ? baseName.charAt(0).toUpperCase() + baseName.slice(1) : "Foto";
      const { meta, errors, previewUrl } = await validateFileAsync(f);

      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file: f,
        previewUrl,
        title: capitalizedTitle,
        description: "",
        topicId: selectedTopicId,
        meta,
        validationErrors: errors,
      });
    }

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleRemoveQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQueueItem = (id: string, field: "title" | "description" | "topicId", value: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleUploadAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (queue.length === 0) {
      setErrorMessage("Bitte wähle mindestens ein Foto zum Hochladen aus.");
      return;
    }

    // Check titles
    const missingTitle = queue.find((q) => !q.title.trim());
    if (missingTitle) {
      setErrorMessage(`Bitte gib für alle Bilder einen Titel an (fehlend bei: ${missingTitle.file.name}).`);
      return;
    }

    // Check rule errors
    const hasErrors = queue.find((q) => q.validationErrors.length > 0);
    if (hasErrors) {
      setErrorMessage(`Einige Bilder entsprechen nicht den Regeln (${hasErrors.validationErrors[0]}).`);
      return;
    }

    // Check category limit conflicts in queue + existing
    const plannedCounts: Record<string, number> = { ...submissionCounts };
    for (const q of queue) {
      const topic = topics.find((t) => t.id === q.topicId);
      const current = plannedCounts[q.topicId] || 0;
      const max = topic?.maxSubmissionsPerUser ?? 1;

      if (current + 1 > max) {
        setErrorMessage(
          `Thema „${topic?.title || "Kategorie"}“ hat das Limit (${max} ${
            max === 1 ? "Bild" : "Bilder"
          }) erreicht. Zu viele Bilder für dieses Thema in der Auswahl.`
        );
        return;
      }
      plannedCounts[q.topicId] = current + 1;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        setUploadProgress(`Lade Foto ${i + 1} von ${queue.length} hoch: „${item.title}“...`);

        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("topicId", item.topicId);
        formData.append("title", item.title.trim());
        if (item.description.trim()) {
          formData.append("description", item.description.trim());
        }

        const res = await fetch(`/api/contests/${contestId}/submissions`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Fehler beim Hochladen von „${item.title}“`);
        }
      }

      // Success
      setQueue([]);
      setUploadProgress(null);
      onUploadSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "Fehler beim Hochladen der Bilder.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Neues Foto einreichen</h3>
          <p className="text-xs text-neutral-400">
            Wähle das Thema aus und lade deine Originaldateien hoch (Mehrfachauswahl im Dateidialog unterstützt).
          </p>
        </div>
        {queue.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400 self-start sm:self-auto">
            <ImageIcon className="h-3.5 w-3.5" />
            {queue.length} {queue.length === 1 ? "Foto" : "Fotos"} in der Einreichungsliste
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Topic selection */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
          Standard-Thema / Kategorie *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topics.map((t) => {
            const count = submissionCounts[t.id] || 0;
            const isFull = isAdmin ? false : count >= t.maxSubmissionsPerUser;
            const isSelected = selectedTopicId === t.id;

            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setSelectedTopicId(t.id)}
                className={`rounded-xl border p-3.5 text-left transition relative ${
                  isSelected
                    ? "border-sky-500 bg-sky-500/10 text-white shadow-sm ring-1 ring-sky-500/30"
                    : isFull
                    ? "border-neutral-800/80 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700"
                    : "border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className="text-xs font-semibold text-neutral-200">{t.title}</div>
                  {isAdmin ? (
                    <span className="inline-block rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium">
                      Admin: {count} Bilder
                    </span>
                  ) : isFull ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      Voll ({count}/{t.maxSubmissionsPerUser})
                    </span>
                  ) : (
                    <span className="inline-block rounded bg-neutral-800 text-neutral-300 px-1.5 py-0.5 text-[10px] font-medium">
                      {count} / {t.maxSubmissionsPerUser}
                    </span>
                  )}
                </div>

                {t.description && (
                  <div className="text-[11px] text-neutral-500 line-clamp-1 mb-1.5">{t.description}</div>
                )}

                <div className="text-[10px] text-sky-400/80">
                  {isAdmin
                    ? "Admin-Upload: Unbegrenzt Fotos möglich"
                    : `Max. ${t.maxSubmissionsPerUser} ${t.maxSubmissionsPerUser === 1 ? "Bild" : "Bilder"} pro Person`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Category Full Banner */}
        {isActiveTopicFull && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 animate-in fade-in">
            <Lock className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">
                Dein persönliches Limit erreicht: Thema „{activeTopic?.title}“ ({activeTopicCount} von {activeTopic?.maxSubmissionsPerUser} Bildern eingereicht)
              </p>
              <p className="mt-1 text-amber-400/90 leading-relaxed">
                Du hast dein persönliches Kontingent für dieses Thema erreicht (jeder Teilnehmer darf max. {activeTopic?.maxSubmissionsPerUser} {activeTopic?.maxSubmissionsPerUser === 1 ? "Bild" : "Bilder"} einreichen).
                Bitte wähle oben ein anderes Thema aus oder lösche unten in deiner Galerie ein bestehendes Foto, um ein neues einzureichen.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dropzone with multi-select support */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
          Fotos auswählen (Dateien hierher ziehen oder durchsuchen) *
        </label>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
            isDragging
              ? "border-sky-500 bg-sky-500/10"
              : "border-neutral-800 bg-neutral-950/30 hover:border-neutral-700 hover:bg-neutral-950/50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
                e.target.value = ""; // Reset to allow re-selection of same file
              }
            }}
            className="hidden"
          />

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800 text-sky-400 group-hover:scale-110 transition-transform mb-3">
            <UploadCloud className="h-7 w-7" />
          </div>

          <p className="text-sm font-medium text-white mb-1">
            Bilder hierher ziehen oder <span className="text-sky-400 underline font-semibold">durchsuchen</span>
          </p>
          <p className="text-xs text-neutral-400">
            Tipp: Du kannst im Datei-Explorer mehrere Bilder gleichzeitig markieren (Multiselect).
          </p>
          <p className="text-[11px] text-neutral-500 mt-2">
            Erlaubt: JPEG, PNG, WEBP • Max. {rules.maxFileSizeMb} MB • Min. {rules.minWidth || 0}x
            {rules.minHeight || 0}px • Seitenverhältnis:{" "}
            {rules.aspectRatio && rules.aspectRatio !== "free" ? rules.aspectRatio : "Freigestellt"}
          </p>
        </div>
      </div>

      {/* Queue of Selected Files */}
      {queue.length > 0 && (
        <form onSubmit={handleUploadAll} className="space-y-6">
          <div className="border-t border-neutral-800/80 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Ausgewählte Bilder ({queue.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Weitere Bilder hinzufügen
              </button>
            </div>

            <div className="space-y-4">
              {queue.map((item, index) => {
                const itemTopic = topics.find((t) => t.id === item.topicId);
                const isItemValid = item.validationErrors.length === 0;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 transition hover:border-neutral-700/80"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      {/* Thumbnail Preview */}
                      <div className="relative aspect-[3/2] w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Inputs */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                            Bildtitel *
                          </label>
                          <input
                            type="text"
                            required
                            value={item.title}
                            onChange={(e) => handleUpdateQueueItem(item.id, "title", e.target.value)}
                            placeholder="Titel des Fotos"
                            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:border-sky-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                            Thema zuordnen *
                          </label>
                          <select
                            value={item.topicId}
                            onChange={(e) => handleUpdateQueueItem(item.id, "topicId", e.target.value)}
                            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                          >
                            {topics.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title} (max. {t.maxSubmissionsPerUser} pro Person)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateQueueItem(item.id, "description", e.target.value)}
                            placeholder="Optionale Bildbeschreibung / Hintergrund..."
                            className="w-full rounded-xl border border-neutral-800/80 bg-neutral-900/60 px-3 py-1 text-xs text-white placeholder-neutral-600 focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[11px] text-neutral-400">
                            {item.meta ? (
                              <span>
                                {item.meta.width}x{item.meta.height} px • {item.meta.sizeMb.toFixed(2)} MB
                              </span>
                            ) : (
                              <span>{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                            )}
                          </div>

                          <div className="mt-1">
                            {isItemValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Regelkonform
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                                <XCircle className="h-3 w-3" />
                                Regelverstoß
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQueueItem(item.id)}
                          className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-rose-400 transition"
                          title="Aus Auswahl entfernen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Rule Errors for this item */}
                    {item.validationErrors.length > 0 && (
                      <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-xs text-rose-400 space-y-0.5">
                        {item.validationErrors.map((err, errIdx) => (
                          <div key={errIdx} className="flex items-center gap-1.5">
                            <XCircle className="h-3 w-3 shrink-0" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-800/80 pt-4">
            <div className="text-xs text-neutral-400">
              {uploadProgress ? (
                <span className="text-sky-400 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {uploadProgress}
                </span>
              ) : (
                <span>
                  Bereit zum Einreichen von <strong>{queue.length}</strong> {queue.length === 1 ? "Foto" : "Fotos"}.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setQueue([])}
                disabled={isUploading}
                className="w-full sm:w-auto rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition disabled:opacity-50"
              >
                Auswahl leeren
              </button>

              <button
                type="submit"
                disabled={isUploading || queue.some((q) => q.validationErrors.length > 0 || !q.title.trim())}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird hochgeladen...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    {queue.length === 1 ? "1 Foto verbindlich einreichen" : `Alle ${queue.length} Fotos einreichen`}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
