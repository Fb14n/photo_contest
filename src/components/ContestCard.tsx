"use client";

import Link from "next/link";
import { ContestEffectiveStatus, getStatusBadgeInfo } from "@/lib/contest-status";
import { Calendar, Users, Image as ImageIcon, Award, ArrowRight, ShieldCheck, Lock, Edit } from "lucide-react";

export interface ContestCardData {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string | null;
  status: string;
  effectiveStatus: ContestEffectiveStatus;
  accessType: string;
  submissionStart: string | Date;
  submissionEnd: string | Date;
  ratingStart: string | Date;
  ratingEnd: string | Date;
  votingMode: string;
  isParticipant?: boolean;
  isJuror?: boolean;
  publicResults?: boolean;
  _count?: {
    submissions: number;
    participants: number;
    jurors: number;
  };
}

export default function ContestCard({
  contest,
  isAdmin = false,
}: {
  contest: ContestCardData;
  isAdmin?: boolean;
}) {
  const badge = getStatusBadgeInfo(contest.effectiveStatus);

  const formatDate = (d: string | Date) => {
    return new Date(d).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/80 hover:shadow-xl hover:shadow-neutral-950/50">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
            >
              {badge.label}
            </span>

            {contest.accessType === "INVITE_ONLY" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                <Lock className="h-3 w-3" />
                Geschlossen
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400">
                Offener Link
              </span>
            )}
          </div>

          <span className="text-[11px] text-neutral-400">
            {contest.votingMode === "PEER_REVIEW" ? "Peer-Bewertung" : "Fach-Jury"}
          </span>
        </div>

        {/* Title */}
        <Link href={`/contests/${contest.slug}`}>
          <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1">
            {contest.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="mt-2 text-sm text-neutral-400 line-clamp-2">
          {contest.description}
        </p>

        {/* Metadata grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-800/60 pt-4 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <span>
              Einreichung bis:{" "}
              <strong className="text-neutral-200">{formatDate(contest.submissionEnd)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-neutral-400" />
            <span>
              Bilder:{" "}
              <strong className="text-neutral-200">{contest._count?.submissions || 0}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-neutral-800/60 pt-4">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <Users className="h-4 w-4" />
          <span>{contest._count?.participants || 0} Teilnehmer</span>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href={`/admin/contests/${contest.id}/edit`}
              title="Wettbewerb bearbeiten"
              className="inline-flex items-center gap-1 rounded-xl border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
            >
              <Edit className="h-3.5 w-3.5 text-amber-400" />
              <span>Bearbeiten</span>
            </Link>
          )}

          {contest.effectiveStatus === "SUBMISSION" && (
            contest.accessType === "INVITE_ONLY" && !contest.isParticipant ? (
              <Link
                href={`/contests/${contest.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 transition"
              >
                Details ansehen
              </Link>
            ) : (
              <Link
                href={`/contests/${contest.slug}/submit`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400 transition"
              >
                Foto hochladen
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )
          )}

          {contest.effectiveStatus === "RATING" && (
            contest.votingMode === "PEER_REVIEW" || contest.isJuror ? (
              <Link
                href={`/contests/${contest.slug}/judge`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-purple-500 transition"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Jurieren (0–10)
              </Link>
            ) : (
              <Link
                href={`/contests/${contest.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition"
              >
                In Bewertung
              </Link>
            )
          )}

          {contest.effectiveStatus === "FINISHED" && (
            contest.publicResults !== false ? (
              <Link
                href={`/contests/${contest.slug}/results`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
              >
                <Award className="h-3.5 w-3.5" />
                Rangliste & Sieger
              </Link>
            ) : (
              <Link
                href={`/contests/${contest.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white transition"
              >
                <Lock className="h-3 w-3" />
                Beendet
              </Link>
            )
          )}

          {contest.effectiveStatus !== "SUBMISSION" &&
            contest.effectiveStatus !== "RATING" &&
            contest.effectiveStatus !== "FINISHED" && (
              <Link
                href={`/contests/${contest.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 transition"
              >
                Details ansehen
              </Link>
            )}
        </div>
      </div>
    </div>
  );
}
