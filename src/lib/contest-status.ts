export type ContestEffectiveStatus =
  | "DRAFT"
  | "UPCOMING"
  | "SUBMISSION"
  | "RATING"
  | "FINISHED"
  | "ARCHIVED";

export interface ContestDates {
  status: string;
  submissionStart: Date | string;
  submissionEnd: Date | string;
  ratingStart: Date | string;
  ratingEnd: Date | string;
}

export function getEffectiveStatus(contest: ContestDates): ContestEffectiveStatus {
  if (contest.status === "DRAFT") return "DRAFT";
  if (contest.status === "ARCHIVED") return "ARCHIVED";
  if (contest.status === "FINISHED") return "FINISHED";

  const now = new Date().getTime();
  const subStart = new Date(contest.submissionStart).getTime();
  const subEnd = new Date(contest.submissionEnd).getTime();
  const rateEnd = new Date(contest.ratingEnd).getTime();

  if (now < subStart) {
    return "UPCOMING";
  }
  if (now >= subStart && now < subEnd) {
    return "SUBMISSION";
  }
  if (now >= subEnd && now < rateEnd) {
    return "RATING";
  }
  return "FINISHED";
}

export function getStatusBadgeInfo(status: ContestEffectiveStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case "DRAFT":
      return {
        label: "Entwurf",
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        border: "border-amber-500/20",
      };
    case "UPCOMING":
      return {
        label: "Startet bald",
        bg: "bg-sky-500/10",
        text: "text-sky-500",
        border: "border-sky-500/20",
      };
    case "SUBMISSION":
      return {
        label: "Einreichung aktiv",
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        border: "border-emerald-500/20",
      };
    case "RATING":
      return {
        label: "Jurierung aktiv",
        bg: "bg-purple-500/10",
        text: "text-purple-500",
        border: "border-purple-500/20",
      };
    case "FINISHED":
      return {
        label: "Abgeschlossen",
        bg: "bg-blue-500/10",
        text: "text-blue-500",
        border: "border-blue-500/20",
      };
    case "ARCHIVED":
      return {
        label: "Archiviert",
        bg: "bg-neutral-500/10",
        text: "text-neutral-400",
        border: "border-neutral-500/20",
      };
  }
}
