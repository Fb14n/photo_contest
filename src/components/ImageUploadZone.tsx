"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, XCircle, AlertCircle, Image as ImageIcon, Loader2 } from "lucide-react";

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

interface ImageUploadZoneProps {
  contestId: string;
  topics: TopicItem[];
  rules: UploadRules;
  onUploadSuccess: () => void;
}

export default function ImageUploadZone({
  contestId,
  topics,
  rules,
  onUploadSuccess,
}: ImageUploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [imageMeta, setImageMeta] = useState<{
    width: number;
    height: number;
    sizeMb: number;
    ratio: string;
    format: string;
  } | null>(null);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File) => {
    setErrorMessage(null);
    setValidationErrors([]);
    setFile(selectedFile);

    const sizeMb = selectedFile.size / (1024 * 1024);
    const format = selectedFile.type || selectedFile.name.split(".").pop() || "";

    // Create object URL for client preview
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Load image into HTML Image object for client dimension validation
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const ratioNum = width / height;
      const ratioStr = `${width}:${height}`;

      const meta = {
        width,
        height,
        sizeMb,
        ratio: ratioStr,
        format,
      };
      setImageMeta(meta);

      // Validate rules on client
      const errors: string[] = [];

      if (sizeMb > rules.maxFileSizeMb) {
        errors.push(
          `Dateigröße (${sizeMb.toFixed(1)} MB) ist größer als erlaubt (${rules.maxFileSizeMb} MB).`
        );
      }

      if (rules.minWidth && width < rules.minWidth) {
        errors.push(`Breite (${width}px) ist kleiner als Mindestbreite von ${rules.minWidth}px.`);
      }

      if (rules.minHeight && height < rules.minHeight) {
        errors.push(`Höhe (${height}px) ist kleiner als Mindesthöhe von ${rules.minHeight}px.`);
      }

      if (rules.maxWidth && width > rules.maxWidth) {
        errors.push(`Breite (${width}px) überschreitet Maximalbreite von ${rules.maxWidth}px.`);
      }

      if (rules.maxHeight && height > rules.maxHeight) {
        errors.push(`Höhe (${height}px) überschreitet Maximalhöhe von ${rules.maxHeight}px.`);
      }

      // Check aspect ratio if not free
      if (rules.aspectRatio && rules.aspectRatio !== "free") {
        const parts = rules.aspectRatio.split(":").map(Number);
        if (parts.length === 2 && parts[0] && parts[1]) {
          const target = parts[0] / parts[1];
          const diffNormal = Math.abs(ratioNum - target);
          const diffInvert = Math.abs(ratioNum - 1 / target);
          if (diffNormal > 0.05 && diffInvert > 0.05) {
            errors.push(`Seitenverhältnis entspricht nicht der Vorgabe (${rules.aspectRatio}).`);
          }
        }
      }

      setValidationErrors(errors);
    };

    img.onerror = () => {
      setValidationErrors(["Die Bilddatei konnte nicht im Browser analysiert werden."]);
    };

    img.src = url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedTopicId || !title.trim()) {
      setErrorMessage("Bitte wähle ein Bild, ein Thema und gib einen Titel ein.");
      return;
    }

    if (validationErrors.length > 0) {
      setErrorMessage("Bitte behebe die Regel-Verstöße vor dem Hochladen.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("topicId", selectedTopicId);
      formData.append("title", title.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      const res = await fetch(`/api/contests/${contestId}/submissions`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Fehler beim Upload.");
        if (data.details) {
          setValidationErrors(data.details);
        }
        return;
      }

      // Reset
      setFile(null);
      setPreviewUrl(null);
      setImageMeta(null);
      setTitle("");
      setDescription("");
      onUploadSuccess();
    } catch {
      setErrorMessage("Netzwerkfehler beim Hochladen.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur">
      <h3 className="text-lg font-bold text-white mb-1">Neues Foto einreichen</h3>
      <p className="text-xs text-neutral-400 mb-6">
        Wähle das Thema aus und lade deine Originaldatei hoch. Das Bild wird automatisch auf die
        Wettbewerbsregeln geprüft.
      </p>

      {errorMessage && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic selection */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
            Thema / Kategorie *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {topics.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setSelectedTopicId(t.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  selectedTopicId === t.id
                    ? "border-sky-500 bg-sky-500/10 text-white shadow-sm"
                    : "border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <div className="text-xs font-semibold text-neutral-200">{t.title}</div>
                {t.description && (
                  <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{t.description}</div>
                )}
                <div className="text-[10px] text-sky-400/80 mt-1.5">
                  Max. {t.maxSubmissionsPerUser} {t.maxSubmissionsPerUser === 1 ? "Bild" : "Bilder"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dropzone */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
            Bilddatei *
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
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
              isDragging
                ? "border-sky-500 bg-sky-500/10"
                : previewUrl
                ? "border-neutral-700 bg-neutral-950/40"
                : "border-neutral-800 bg-neutral-950/30 hover:border-neutral-700 hover:bg-neutral-950/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {previewUrl ? (
              <div className="flex flex-col items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Vorschau"
                  className="max-h-64 rounded-xl object-contain shadow-2xl border border-neutral-800"
                />
                <div className="text-xs text-neutral-400">
                  <span className="font-semibold text-white">{file?.name}</span> •{" "}
                  {(file ? file.size / (1024 * 1024) : 0).toFixed(2)} MB
                </div>
                <button
                  type="button"
                  className="text-xs text-sky-400 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Anderes Bild auswählen
                </button>
              </div>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800 text-sky-400 group-hover:scale-110 transition-transform mb-3">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-white mb-1">
                  Bild hierher ziehen oder <span className="text-sky-400 underline">durchsuchen</span>
                </p>
                <p className="text-xs text-neutral-500">
                  Erlaubt: JPEG, PNG, WEBP • Max. {rules.maxFileSizeMb} MB • Min. {rules.minWidth || 0}x
                  {rules.minHeight || 0}px
                </p>
              </>
            )}
          </div>
        </div>

        {/* Live Rule Checklist after selecting image */}
        {imageMeta && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
              Live-Regelüberprüfung
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                {imageMeta.sizeMb <= rules.maxFileSizeMb ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span className="text-neutral-400">
                  Dateigröße:{" "}
                  <strong className="text-neutral-200">{imageMeta.sizeMb.toFixed(2)} MB</strong> (max.{" "}
                  {rules.maxFileSizeMb} MB)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(!rules.minWidth || imageMeta.width >= rules.minWidth) &&
                (!rules.minHeight || imageMeta.height >= rules.minHeight) ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span className="text-neutral-400">
                  Auflösung:{" "}
                  <strong className="text-neutral-200">
                    {imageMeta.width}x{imageMeta.height} px
                  </strong>{" "}
                  (min. {rules.minWidth || 0}x{rules.minHeight || 0})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {validationErrors.some((e) => e.includes("Seitenverhältnis")) ? (
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
                <span className="text-neutral-400">
                  Seitenverhältnis:{" "}
                  <strong className="text-neutral-200">
                    {rules.aspectRatio && rules.aspectRatio !== "free" ? rules.aspectRatio : "Freigestellt"}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-neutral-400">
                  Format: <strong className="text-neutral-200">{imageMeta.format.toUpperCase()}</strong>
                </span>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-400 space-y-1">
                {validationErrors.map((err, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Title and Description */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Bildtitel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Morgenröte im Moor"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Beschreibung / Bildgeschichte (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Hintergrund zur Aufnahme, Ort, besondere Lichtverhältnisse..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-sky-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!file || !title.trim() || validationErrors.length > 0 || isUploading}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Wird verarbeitet & hochgeladen...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Foto verbindlich einreichen
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
