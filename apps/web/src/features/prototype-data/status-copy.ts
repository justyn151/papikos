import type {
  BookingStatus,
  Locale,
  QuestionStatus,
  ReportStatus,
} from "@/features/listings/types";

export const bookingStatusLabels: Record<
  Locale,
  Record<BookingStatus, string>
> = {
  id: {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
    cancelled: "Dibatalkan",
  },
  en: {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  },
};

export const questionStatusLabels: Record<
  Locale,
  Record<QuestionStatus, string>
> = {
  id: { pending: "Belum dijawab", answered: "Sudah dijawab" },
  en: { pending: "Unanswered", answered: "Answered" },
};

export const reportStatusLabels: Record<Locale, Record<ReportStatus, string>> = {
  id: {
    submitted: "Baru",
    reviewing: "Ditinjau",
    resolved: "Selesai",
    dismissed: "Ditutup",
  },
  en: {
    submitted: "New",
    reviewing: "Reviewing",
    resolved: "Resolved",
    dismissed: "Dismissed",
  },
};

/** Shared badge styling so a status reads the same on every surface. */
export const statusTone: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  approved:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  rejected: "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200",
  cancelled:
    "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  answered:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  submitted: "bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200",
  reviewing:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  resolved:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  dismissed:
    "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};
