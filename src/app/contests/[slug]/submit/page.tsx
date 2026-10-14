"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Camera,
  Info,
  Calendar,
  Lock,
} from "lucide-react";
import ImageUploadZone, { UploadRules, TopicItem } from "@/components/ImageUploadZone";

interface UserSubmission {
  id: string;
  title: string;
  description?: string | null;
  filePath: string;
  topicId: string;
  topicTitle: string;
  width: number;
  height: number;
  fileSize: number;
  cameraModel?: string | null;
  lens?: string | null;
  focalLength?: string | null;
  iso?: number | null;
  aperture?: string | null;
  shutterSpeed?: string | null;
  createdAt: string;
}

export default function SubmitPhotoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [contest, setContest] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; name: string; role: string } | null>(null);
  const [mySubmissions, setMySubmissions] = useState<UserSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      // 1. Session check
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (!authData.user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      setCurrentUser(authData.user);

      // 2. Contest details
      const contestRes = await fetch(`/api/contests/${resolvedParams.slug}`);
      const contestData = await contestRes.json();
      if (contestData.error) {
        setError(contestData.error);
        setLoading(false);
        return;
      }
      setContest(contestData.contest);

      // 3. User submissions for this contest
      const subRes = await fetch(`/api/contests/${contestData.contest.id}/submissions`);
      const subData = await subRes.json();
      if (subData.submissions) {
        setMySubmissions(subData.submissions);
      }
    } catch (e) {
      setError("Fehler beim Laden der Einreichungsseite.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedParams.slug]);

  const handleDelete = async (subId: string) => {
    if (!contest) return;
    if (!confirm("Möchtest du dieses Bild wirklich aus dem Wettbewerb löschen?")) return;

    try {
      setDeletingId(subId);
      const res = await fetch(`/api/contests/${contest.id}/submissions/${subId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDeleteSuccess("Bild erfolgreich entfernt.");
        setTimeout(() => setDeleteSuccess(null), 3000);
        await loadData();
      } else {
        alert(data.error || "Fehler beim Löschen");
      }
    } catch {
      alert("Fehler beim Löschen des Bildes");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="h-8 w-48 bg-neutral-900 rounded mx-auto mb-4 animate-pulse" />
        <div className="h-64 bg-neutral-900/60 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="h-14 w-14 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-5">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Anmeldung erforderlich</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Um Fotos zu diesem Wettbewerb einzureichen, musst du angemeldet oder registriert sein.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-400 transition"
          >
            Jetzt Anmelden
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            Konto erstellen
          </Link>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">{error || "Wettbewerb nicht verfügbar"}</h2>
        <Link href="/contests" className="text-xs text-sky-400 hover:underline">
          Zurück zu den Wettbewerben
        </Link>
      </div>
    );
  }

  const isSubmissionActive = contest.effectiveStatus === "SUBMISSION" || currentUser.role === "ADMIN";

  const rules: UploadRules = {
    maxFileSizeMb: contest.maxFileSizeMb,
    allowedFormats: contest.allowedFormats,
    minWidth: contest.minWidth,
    minHeight: contest.minHeight,
    maxWidth: contest.maxWidth,
    maxHeight: contest.maxHeight,
    aspectRatio: contest.aspectRatio,
    namingPattern: contest.namingPattern,
  };

  const topics: TopicItem[] = contest.topics.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    maxSubmissionsPerUser: t.maxSubmissionsPerUser,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
        <Link href={`/contests/${contest.slug}`} className="hover:text-white transition flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          {contest.title}
        </Link>
        <span>/</span>
        <span className="text-neutral-200">Foto einreichen</span>
      </div>

      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Foto einreichen</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Wettbewerb: <strong className="text-neutral-200">{contest.title}</strong>
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs text-neutral-300">
            Angemeldet als: <span className="text-sky-400 font-medium">{currentUser.email}</span>
          </div>
        </div>

        {!isSubmissionActive && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              Die Einreichungsfrist für diesen Wettbewerb ist momentan nicht aktiv (Status: {contest.effectiveStatus}).
              Einreichungen sind deaktiviert.
            </span>
          </div>
        )}

        {deleteSuccess && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{deleteSuccess}</span>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      {isSubmissionActive && (
        <div className="mb-14">
          <ImageUploadZone
            contestId={contest.id}
            topics={topics}
            rules={rules}
            onUploadSuccess={() => {
              loadData();
            }}
          />
        </div>
      )}

      {/* Existing User Submissions Gallery */}
      <div className="border-t border-neutral-800 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Deine eingereichten Fotos</h2>
          </div>
          <span className="text-xs text-neutral-400">
            {mySubmissions.length} {mySubmissions.length === 1 ? "Bild" : "Bilder"} hochgeladen
          </span>
        </div>

        {mySubmissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10 text-center">
            <Camera className="h-10 w-10 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-300">Du hast für diesen Wettbewerb noch kein Foto eingereicht.</p>
            <p className="text-xs text-neutral-400 mt-1">
              Nutze den Upload-Bereich oben, um dein Bild hochzuladen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySubmissions.map((sub) => (
              <div
                key={sub.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 transition hover:border-neutral-700"
              >
                <div>
                  {/* Image Preview with aspect wrapper */}
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-neutral-950 mb-3 border border-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sub.filePath}
                      alt={sub.title}
                      className="h-full w-full object-cover group-hover:scale-102 transition duration-300"
                    />
                  </div>

                  {/* Topic badge */}
                  <div className="mb-2">
                    <span className="inline-block rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400">
                      {sub.topicTitle}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-white text-base truncate">{sub.title}</h3>
                  {sub.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1">{sub.description}</p>
                  )}

                  {/* Technical Metadata */}
                  <div className="mt-3 grid grid-cols-2 gap-1 text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-2.5">
                    <div>Auflösung: {sub.width} × {sub.height}</div>
                    <div>Größe: {(sub.fileSize / (1024 * 1024)).toFixed(2)} MB</div>
                    {sub.cameraModel && (
                      <div className="col-span-2 truncate">Kamera: {sub.cameraModel}</div>
                    )}
                    {sub.lens && <div className="col-span-2 truncate">Objektiv: {sub.lens}</div>}
                    {(sub.aperture || sub.shutterSpeed || sub.iso) && (
                      <div className="col-span-2 truncate text-neutral-400">
                        {[sub.aperture, sub.shutterSpeed, sub.iso ? `ISO ${sub.iso}` : null]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer action (Delete) */}
                {isSubmissionActive && (
                  <div className="mt-4 border-t border-neutral-800/80 pt-3 flex justify-end">
                    <button
                      onClick={() => handleDelete(sub.id)}
                      disabled={deletingId === sub.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === sub.id ? "Wird gelöscht..." : "Löschen"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
