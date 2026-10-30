"use client";

import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Plus,
  ShieldCheck,
  User,
  Users,
  Calendar,
  Layers,
  Camera,
  ExternalLink,
  Edit,
  Eye,
  X,
  FileCheck,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { getStatusBadgeInfo } from "@/lib/contest-status";

interface Topic {
  id: string;
  title: string;
  description?: string | null;
  maxSubmissionsPerUser: number;
}

interface ContestData {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  effectiveStatus: string;
  accessType: string;
  maxFileSizeMb: number;
  allowedFormats: string;
  minWidth?: number | null;
  minHeight?: number | null;
  maxWidth?: number | null;
  maxHeight?: number | null;
  aspectRatio?: string | null;
  namingPattern?: string | null;
  topics: Topic[];
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ExistingSubmission {
  id: string;
  contestId: string;
  topicId: string;
  topicTitle: string;
  title: string;
  description?: string | null;
  filePath: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  cameraModel?: string | null;
  lens?: string | null;
  iso?: number | null;
  aperture?: string | null;
  shutterSpeed?: string | null;
  createdAt: string;
  photographerName: string;
  photographerEmail?: string;
  userId?: string | null;
}

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  description: string;
  topicId: string;
  assignMode: "UNASSIGNED" | "USER";
  assignedUserId: string;
  submitterName: string;
  sizeMb: number;
}

export default function AdminContestSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [contest, setContest] = useState<ContestData | null>(null);
  const [currentUser, setCurrentUser] = useState<{ role: string; email: string } | null>(null);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [submissions, setSubmissions] = useState<ExistingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [defaultTopicId, setDefaultTopicId] = useState<string>("");
  const [defaultAssignMode, setDefaultAssignMode] = useState<"UNASSIGNED" | "USER">("UNASSIGNED");
  const [defaultUserId, setDefaultUserId] = useState<string>("");
  const [defaultSubmitterName, setDefaultSubmitterName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery filter & actions
  const [filterTopicId, setFilterTopicId] = useState<string>("ALL");
  const [previewSubmission, setPreviewSubmission] = useState<ExistingSubmission | null>(null);
  const [subToDelete, setSubToDelete] = useState<ExistingSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (!authData.user || authData.user.role !== "ADMIN") {
        setError("Nur Administratoren haben Zugriff auf diese Seite.");
        setLoading(false);
        return;
      }
      setCurrentUser(authData.user);

      // Load Contest
      const contestRes = await fetch(`/api/contests/${resolvedParams.id}`);
      const contestData = await contestRes.json();
      if (!contestRes.ok || !contestData.contest) {
        setError(contestData.error || "Wettbewerb nicht gefunden.");
        setLoading(false);
        return;
      }
      setContest(contestData.contest);
      if (contestData.contest.topics?.length > 0) {
        setDefaultTopicId(contestData.contest.topics[0].id);
      }

      // Load Users for attribution
      const usersRes = await fetch("/api/admin/users");
      const usersData = await usersRes.json();
      if (Array.isArray(usersData.users)) {
        setUsers(usersData.users);
        if (usersData.users.length > 0) {
          setDefaultUserId(usersData.users[0].id);
        }
      }

      // Load All Submissions
      const subRes = await fetch(`/api/contests/${contestData.contest.id}/submissions`);
      const subData = await subRes.json();
      if (Array.isArray(subData.submissions)) {
        setSubmissions(subData.submissions);
      }
    } catch {
      setError("Fehler beim Laden der Wettbewerbsdaten.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedParams.id]);

  const handleFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0 || !contest) return;

    const newStaged: StagedFile[] = files.map((f) => {
      const baseName = f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
      const capitalized = baseName ? baseName.charAt(0).toUpperCase() + baseName.slice(1) : "Foto";
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
        title: capitalized,
        description: "",
        topicId: defaultTopicId || (contest.topics[0]?.id ?? ""),
        assignMode: defaultAssignMode,
        assignedUserId: defaultUserId,
        submitterName: defaultSubmitterName,
        sizeMb: parseFloat((f.size / (1024 * 1024)).toFixed(2)),
      };
    });

    setStagedFiles((prev) => [...prev, ...newStaged]);
  };

  const handleRemoveStaged = (id: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleClearStaged = () => {
    stagedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setStagedFiles([]);
  };

  const handleUploadAll = async () => {
    if (!contest || stagedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`0 von ${stagedFiles.length} Bildern hochgeladen...`);
    setUploadSuccessMessage(null);

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < stagedFiles.length; i++) {
      const item = stagedFiles[i];
      setUploadProgress(`${i + 1} von ${stagedFiles.length}: „${item.title}“ wird verarbeitet...`);

      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("topicId", item.topicId);
        formData.append("title", item.title.trim() || "Ohne Titel");
        if (item.description.trim()) {
          formData.append("description", item.description.trim());
        }

        // God-mode flags
        formData.append("isAdminFeed", "true");

        if (item.assignMode === "USER" && item.assignedUserId) {
          formData.append("assignUserId", item.assignedUserId);
        } else {
          formData.append("assignUserId", "unassigned");
          if (item.submitterName.trim()) {
            formData.append("submitterName", item.submitterName.trim());
          }
        }

        const res = await fetch(`/api/contests/${contest.id}/submissions`, {
          method: "POST",
          body: formData,
        });

        let resData: any = {};
        try {
          resData = await res.json();
        } catch {
          resData = { error: `Server-Antwort ungültig (${res.status} ${res.statusText})` };
        }

        if (!res.ok) {
          const detailsStr = Array.isArray(resData.details) && resData.details.length > 0 ? `: ${resData.details.join("; ")}` : "";
          errors.push(`„${item.file.name}“: ${resData.error || "Fehler"}${detailsStr}`);
        } else {
          successCount++;
        }
      } catch (err: any) {
        errors.push(`„${item.file.name}“: ${err.message || "Netzwerkfehler"}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (successCount > 0) {
      setUploadSuccessMessage(
        `${successCount} ${successCount === 1 ? "Foto" : "Fotos"} erfolgreich im Gott-Modus eingespeist!`
      );
      handleClearStaged();
      await loadData();
    }

    if (errors.length > 0) {
      alert(`Hinweise bei einigen Uploads:\n\n${errors.join("\n")}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!contest || !subToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/contests/${contest.id}/submissions/${subToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissions((prev) => prev.filter((s) => s.id !== subToDelete.id));
        setSubToDelete(null);
      } else {
        alert(data.error || "Fehler beim Löschen");
      }
    } catch {
      alert("Fehler beim Löschen des Bildes");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center animate-pulse">
        <div className="h-8 w-64 bg-neutral-900 rounded mx-auto mb-4" />
        <div className="h-48 bg-neutral-900/60 rounded-2xl" />
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">{error || "Zugriff verweigert"}</h2>
        <Link href="/admin" className="text-xs text-sky-400 hover:underline">
          Zurück zum Admin Dashboard
        </Link>
      </div>
    );
  }

  const badge = getStatusBadgeInfo(contest.effectiveStatus as any);
  const filteredSubmissions = submissions.filter((s) => {
    if (filterTopicId === "ALL") return true;
    return s.topicId === filterTopicId;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Link href="/admin" className="hover:text-white transition flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Admin Dashboard
          </Link>
          <span>/</span>
          <Link href={`/contests/${contest.slug}`} className="hover:text-white transition">
            {contest.title}
          </Link>
          <span>/</span>
          <span className="text-purple-400 font-medium">Fotos einspeisen (Gott-Modus)</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/contests/${contest.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
          >
            <Eye className="h-3.5 w-3.5 text-sky-400" />
            Wettbewerbsansicht
          </Link>
          <Link
            href={`/admin/contests/${contest.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
          >
            <Edit className="h-3.5 w-3.5 text-amber-400" />
            Wettbewerb bearbeiten
          </Link>
          <Link
            href={`/admin/contests/${contest.id}/invites`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
          >
            <Users className="h-3.5 w-3.5 text-sky-400" />
            Einladungen
          </Link>
        </div>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-neutral-900/60 to-neutral-900/40 p-6 sm:p-8 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
            {badge.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Gott-Modus
          </span>
          <span className="text-xs text-neutral-400">
            {submissions.length} {submissions.length === 1 ? "Foto" : "Fotos"} im Wettbewerb
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Admin-Fotoeinspeisung & Bestandsverwaltung
        </h1>
        <p className="mt-2 text-sm text-neutral-300 max-w-3xl leading-relaxed">
          Speise unbegrenzt viele Fotos ohne Teilnehmerlimits in beliebige Sparten ein. Du kannst Fotos entweder keinem Konto zuweisen (vollkommen anonym, sodass auch du sie bewerten kannst) oder einem registrierten Nutzerkonto zuschreiben.
        </p>
      </div>

      {uploadSuccessMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{uploadSuccessMessage}</span>
          </div>
          <button
            onClick={() => setUploadSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: Gott-Modus Upload Panel */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-purple-400" />
              Fotos einspeisen (Batch Upload)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Wähle Thema und Zuweisung, ziehe mehrere Bilder hierher oder wähle sie im Dateidialog aus.
            </p>
          </div>
        </div>

        {/* Global Preset Controls for the Batch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800">
          {/* Topic Preset */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Ziel-Thema / Sparte *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {contest.topics.map((t) => {
                const isSelected = defaultTopicId === t.id;
                const count = submissions.filter((s) => s.topicId === t.id).length;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => {
                      setDefaultTopicId(t.id);
                      // Update any staged files to this topic if desired
                      setStagedFiles((prev) => prev.map((f) => ({ ...f, topicId: t.id })));
                    }}
                    className={`rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-purple-500 bg-purple-500/10 text-white shadow-sm ring-1 ring-purple-500/30"
                        : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">{t.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-1">
                      Bereits {count} {count === 1 ? "Foto" : "Fotos"} im System
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Attribution Preset */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Zuweisung / Urheber *
            </label>
            <div className="space-y-3">
              <label
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                  defaultAssignMode === "UNASSIGNED"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700"
                }`}
              >
                <input
                  type="radio"
                  name="defaultAssignMode"
                  checked={defaultAssignMode === "UNASSIGNED"}
                  onChange={() => {
                    setDefaultAssignMode("UNASSIGNED");
                    setStagedFiles((prev) => prev.map((f) => ({ ...f, assignMode: "UNASSIGNED" })));
                  }}
                  className="mt-0.5 accent-purple-500"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white">Keinem Benutzerkonto zuweisen (Anonym)</div>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    💡 Diese Fotos haben keinen Nutzerlink. Dadurch kannst du als Admin diese Fotos in der Jurierung neutral bewerten.
                  </p>
                  {defaultAssignMode === "UNASSIGNED" && (
                    <input
                      type="text"
                      placeholder="Optionaler Name (z. B. Archiv oder Gastfotograf)"
                      value={defaultSubmitterName}
                      onChange={(e) => {
                        setDefaultSubmitterName(e.target.value);
                        setStagedFiles((prev) => prev.map((f) => ({ ...f, submitterName: e.target.value })));
                      }}
                      className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
                    />
                  )}
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                  defaultAssignMode === "USER"
                    ? "border-sky-500 bg-sky-500/10"
                    : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700"
                }`}
              >
                <input
                  type="radio"
                  name="defaultAssignMode"
                  checked={defaultAssignMode === "USER"}
                  onChange={() => {
                    setDefaultAssignMode("USER");
                    setStagedFiles((prev) => prev.map((f) => ({ ...f, assignMode: "USER" })));
                  }}
                  className="mt-0.5 accent-sky-500"
                />
                <div className="text-xs flex-1">
                  <div className="font-semibold text-white">Bestehendem Benutzer zuweisen</div>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Die Fotos werden offiziell dem ausgewählten Plattform-Nutzer gutgeschrieben.
                  </p>
                  {defaultAssignMode === "USER" && (
                    <div className="mt-2">
                      <select
                        value={defaultUserId}
                        onChange={(e) => {
                          setDefaultUserId(e.target.value);
                          setStagedFiles((prev) => prev.map((f) => ({ ...f, assignedUserId: e.target.value })));
                        }}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email}) [{u.role}]
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Dropzone with Multi-Select */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length > 0) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
            isDragging
              ? "border-purple-500 bg-purple-500/10"
              : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-950/60"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) {
                handleFiles(e.target.files);
                e.target.value = "";
              }
            }}
            className="hidden"
          />

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800 text-purple-400 group-hover:scale-110 transition-transform mb-3">
            <UploadCloud className="h-7 w-7" />
          </div>

          <p className="text-sm font-semibold text-white mb-1">
            Bilder hierher ziehen oder <span className="text-purple-400 underline">Dateien auswählen</span>
          </p>
          <p className="text-xs text-neutral-400">
            Explorer-Mehrfachauswahl (Multiselect) aktiv. Du kannst 10, 20 oder mehr Bilder auf einmal auswählen.
          </p>
          <p className="text-[11px] text-neutral-500 mt-2">
            Formate: JPEG, PNG, WebP • Keine Mengenbeschränkung im Admin-Modus
          </p>
        </div>

        {/* Staged Queue */}
        {stagedFiles.length > 0 && (
          <div className="space-y-4 border-t border-neutral-800/80 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Bereit zum Einspeisen ({stagedFiles.length} Fotos)</span>
              </h3>
              <button
                type="button"
                onClick={handleClearStaged}
                className="text-xs text-neutral-400 hover:text-rose-400 transition"
              >
                Liste leeren
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
              {stagedFiles.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3 items-start"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.title}
                    className="h-20 w-24 object-cover rounded-xl border border-neutral-800 shrink-0 bg-neutral-900"
                  />
                  <div className="flex-1 min-w-0 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-white truncate max-w-[150px]">
                        #{idx + 1} {item.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStaged(item.id)}
                        className="text-neutral-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Bildtitel"
                      value={item.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStagedFiles((prev) =>
                          prev.map((f) => (f.id === item.id ? { ...f, title: val } : f))
                        );
                      }}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
                    />

                    <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                      <span>{item.sizeMb} MB</span>
                      <span>•</span>
                      <span className="text-purple-300">
                        {contest.topics.find((t) => t.id === item.topicId)?.title}
                      </span>
                      <span>•</span>
                      <span className="text-sky-300">
                        {item.assignMode === "USER"
                          ? users.find((u) => u.id === item.assignedUserId)?.name || "Benutzer"
                          : item.submitterName || "Anonym"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {uploadProgress && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-300 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                <span>{uploadProgress}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isUploading}
              onClick={handleUploadAll}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fotos werden eingespeist...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Alle {stagedFiles.length} Fotos im Gott-Modus einspeisen
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: Submissions Manager Gallery */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="h-5 w-5 text-sky-400" />
              Aktuelle Einreichungen im Wettbewerb ({filteredSubmissions.length})
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Alle im Wettbewerb vorhandenen Fotos (von Teilnehmern eingereicht oder von Admins eingespeist).
            </p>
          </div>

          {/* Topic Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterTopicId("ALL")}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                filterTopicId === "ALL"
                  ? "bg-purple-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Alle Sparten ({submissions.length})
            </button>
            {contest.topics.map((t) => {
              const count = submissions.filter((s) => s.topicId === t.id).length;
              return (
                <button
                  key={t.id}
                  onClick={() => setFilterTopicId(t.id)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    filterTopicId === t.id
                      ? "bg-purple-600 text-white"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {t.title} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-12 text-center">
            <ImageIcon className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">Keine Fotos vorhanden</h3>
            <p className="text-xs text-neutral-400">
              Nutze das Upload-Feld oben, um im Gott-Modus erste Fotos für diesen Wettbewerb einzuspeisen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 transition hover:border-neutral-700 hover:shadow-lg"
              >
                <div>
                  {/* Thumbnail */}
                  <div
                    onClick={() => setPreviewSubmission(sub)}
                    className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800/80 cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sub.thumbnailUrl || sub.filePath}
                      alt={sub.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="rounded-md bg-neutral-950/80 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-neutral-800">
                        {sub.topicTitle}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-white line-clamp-1">{sub.title}</h3>
                    {sub.description && (
                      <p className="text-xs text-neutral-400 line-clamp-2 mt-1">{sub.description}</p>
                    )}
                  </div>
                </div>

                {/* Attribution & Actions footer */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                  <div>
                    {sub.userId ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 text-[10px] font-medium">
                        <User className="h-3 w-3" />
                        {sub.photographerName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 text-[10px] font-medium">
                        <ShieldCheck className="h-3 w-3" />
                        {sub.photographerName || "Anonym / Nicht zugewiesen"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewSubmission(sub)}
                      title="Vorschau anzeigen"
                      className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubToDelete(sub)}
                      title="Foto aus Wettbewerb entfernen"
                      className="rounded-lg p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={!!subToDelete}
        title="Foto endgültig löschen?"
        message={`Möchtest du das Foto „${subToDelete?.title}“ wirklich unwiderruflich aus diesem Wettbewerb entfernen?`}
        confirmText="Foto löschen"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setSubToDelete(null)}
      />

      {/* Large Image Preview Modal */}
      {previewSubmission && (
        <div
          onClick={() => setPreviewSubmission(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="relative aspect-[3/2] w-full bg-neutral-950 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSubmission.filePath}
                alt={previewSubmission.title}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
              <button
                onClick={() => setPreviewSubmission(null)}
                className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/90 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{previewSubmission.title}</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Thema: <strong className="text-purple-400">{previewSubmission.topicTitle}</strong> • Urheber:{" "}
                    <strong className="text-sky-400">{previewSubmission.photographerName}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewSubmission.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Originaldatei
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const target = previewSubmission;
                      setPreviewSubmission(null);
                      setSubToDelete(target);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Löschen
                  </button>
                </div>
              </div>

              {previewSubmission.description && (
                <p className="text-xs text-neutral-300 mt-3 whitespace-pre-line bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
                  {previewSubmission.description}
                </p>
              )}

              {/* EXIF Data */}
              {(previewSubmission.cameraModel || previewSubmission.iso || previewSubmission.aperture) && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 border-t border-neutral-800 pt-3">
                  {previewSubmission.cameraModel && (
                    <span className="flex items-center gap-1">
                      <Camera className="h-3 w-3 text-neutral-500" />
                      {previewSubmission.cameraModel}
                    </span>
                  )}
                  {previewSubmission.lens && <span>Objektiv: {previewSubmission.lens}</span>}
                  {previewSubmission.aperture && <span>Blende: {previewSubmission.aperture}</span>}
                  {previewSubmission.shutterSpeed && <span>Verschluss: {previewSubmission.shutterSpeed}</span>}
                  {previewSubmission.iso && <span>ISO: {previewSubmission.iso}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
