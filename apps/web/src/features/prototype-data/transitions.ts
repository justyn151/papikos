import type {
  AuditEntry,
  BookingRequest,
  BookingStatus,
  ListingModeration,
  ListingReport,
  PrototypeRole,
  ReportStatus,
  SubmittedQuestion,
} from "@/features/listings/types";

/**
 * Pure state transitions for the prototype's local store. Kept free of React
 * and storage so the rules (who may do what, and what history is preserved)
 * can be tested directly.
 */

export interface TransitionResult<T> {
  record: T;
  audit: AuditEntry;
}

function createAuditId() {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function audit(
  actor: PrototypeRole,
  action: string,
  targetId: string,
  at: string,
  note?: string,
): AuditEntry {
  return {
    id: createAuditId(),
    actor,
    action,
    targetId,
    at,
    ...(note ? { note } : {}),
  };
}

/** Only a pending request can still be decided or withdrawn. */
export function canTransitionBooking(
  booking: BookingRequest,
  next: BookingStatus,
): boolean {
  if (booking.status !== "pending") return false;
  return next !== "pending";
}

export function transitionBooking(
  booking: BookingRequest,
  next: BookingStatus,
  by: PrototypeRole,
  now = new Date().toISOString(),
): TransitionResult<BookingRequest> | null {
  if (!canTransitionBooking(booking, next)) return null;

  return {
    record: {
      ...booking,
      status: next,
      statusHistory: [...booking.statusHistory, { status: next, at: now, by }],
    },
    audit: audit(by, `booking.${next}`, booking.id, now),
  };
}

export function approveBooking(booking: BookingRequest, now?: string) {
  return transitionBooking(booking, "approved", "owner", now);
}

export function rejectBooking(booking: BookingRequest, now?: string) {
  return transitionBooking(booking, "rejected", "owner", now);
}

export function cancelBooking(
  booking: BookingRequest,
  by: PrototypeRole = "renter",
  now?: string,
) {
  return transitionBooking(booking, "cancelled", by, now);
}

export function answerQuestion(
  question: SubmittedQuestion,
  answer: string,
  now = new Date().toISOString(),
): TransitionResult<SubmittedQuestion> | null {
  const trimmed = answer.trim();
  if (!trimmed) return null;

  return {
    record: {
      ...question,
      status: "answered",
      answer: trimmed,
      answeredAt: now,
    },
    audit: audit("owner", "question.answered", question.id, now),
  };
}

export function setReportStatus(
  report: ListingReport,
  next: ReportStatus,
  now = new Date().toISOString(),
): TransitionResult<ListingReport> | null {
  if (report.status === next) return null;

  return {
    record: {
      ...report,
      status: next,
      ...(next === "resolved" || next === "dismissed"
        ? { resolvedAt: now }
        : {}),
    },
    audit: audit("admin", `report.${next}`, report.id, now),
  };
}

export function defaultModeration(listingId: string): ListingModeration {
  return {
    listingId,
    published: true,
    suspended: false,
    verifiedOverride: null,
    updatedAt: new Date().toISOString(),
  };
}

export function setPublication(
  moderation: ListingModeration,
  published: boolean,
  by: PrototypeRole,
  now = new Date().toISOString(),
): TransitionResult<ListingModeration> {
  return {
    record: { ...moderation, published, updatedAt: now },
    audit: audit(
      by,
      published ? "listing.published" : "listing.unpublished",
      moderation.listingId,
      now,
    ),
  };
}

export function setSuspension(
  moderation: ListingModeration,
  suspended: boolean,
  now = new Date().toISOString(),
): TransitionResult<ListingModeration> {
  return {
    record: { ...moderation, suspended, updatedAt: now },
    audit: audit(
      "admin",
      suspended ? "listing.suspended" : "listing.unsuspended",
      moderation.listingId,
      now,
    ),
  };
}

export function setVerification(
  moderation: ListingModeration,
  verified: boolean,
  now = new Date().toISOString(),
): TransitionResult<ListingModeration> {
  return {
    record: { ...moderation, verifiedOverride: verified, updatedAt: now },
    audit: audit(
      "admin",
      verified ? "listing.verified" : "listing.unverified",
      moderation.listingId,
      now,
    ),
  };
}

/** A suspended or unpublished listing must not appear in renter search. */
export function isListingVisible(moderation: ListingModeration): boolean {
  return moderation.published && !moderation.suspended;
}
