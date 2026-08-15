import type {
  AuditEntry,
  BookingRequest,
  BookingStatus,
  ListingModeration,
  ListingReport,
  PrototypeRole,
  QuestionStatus,
  ReportStatus,
  SubmittedQuestion,
} from "@/features/listings/types";

/**
 * Records written before owner/admin surfaces existed only ever carried a
 * single hardcoded status and no history, and browsers still hold them. Every
 * read goes through these so stale data widens into the current shape instead
 * of crashing a page that expects `statusHistory` to exist.
 */

const bookingStatuses: BookingStatus[] = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
];
const questionStatuses: QuestionStatus[] = ["pending", "answered"];
const reportStatuses: ReportStatus[] = [
  "submitted",
  "reviewing",
  "resolved",
  "dismissed",
];
const roles: PrototypeRole[] = ["renter", "owner", "admin"];

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function oneOf<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeBooking(value: unknown): BookingRequest | null {
  const raw = asRecord(value);
  if (!raw || !asString(raw.id) || !asString(raw.listingId)) return null;

  const status = oneOf(raw.status, bookingStatuses, "pending");
  const createdAt = asString(raw.createdAt, new Date().toISOString());
  const history = Array.isArray(raw.statusHistory)
    ? raw.statusHistory
        .map((entry) => {
          const item = asRecord(entry);
          if (!item) return null;
          return {
            status: oneOf(item.status, bookingStatuses, "pending"),
            at: asString(item.at, createdAt),
            by: oneOf(item.by, roles, "renter"),
          };
        })
        .filter((entry): entry is BookingRequest["statusHistory"][number] =>
          Boolean(entry),
        )
    : [];

  return {
    id: asString(raw.id),
    listingId: asString(raw.listingId),
    roomId: asString(raw.roomId),
    moveInDate: asString(raw.moveInDate),
    durationMonths: asNumber(raw.durationMonths, 1),
    note: asString(raw.note),
    status,
    // Legacy records predate history entirely; seed it from their creation.
    statusHistory:
      history.length > 0
        ? history
        : [{ status, at: createdAt, by: "renter" as const }],
    createdAt,
  };
}

export function normalizeQuestion(value: unknown): SubmittedQuestion | null {
  const raw = asRecord(value);
  if (!raw || !asString(raw.id) || !asString(raw.listingId)) return null;

  const answer = asString(raw.answer);
  return {
    id: asString(raw.id),
    listingId: asString(raw.listingId),
    question: asString(raw.question),
    // An older record carrying an answer but no status is clearly answered.
    status: oneOf(
      raw.status,
      questionStatuses,
      answer ? "answered" : "pending",
    ),
    ...(answer ? { answer } : {}),
    ...(asString(raw.answeredAt) ? { answeredAt: asString(raw.answeredAt) } : {}),
    createdAt: asString(raw.createdAt, new Date().toISOString()),
  };
}

export function normalizeReport(value: unknown): ListingReport | null {
  const raw = asRecord(value);
  if (!raw || !asString(raw.id) || !asString(raw.listingId)) return null;

  return {
    id: asString(raw.id),
    listingId: asString(raw.listingId),
    reason: asString(raw.reason),
    details: asString(raw.details),
    status: oneOf(raw.status, reportStatuses, "submitted"),
    createdAt: asString(raw.createdAt, new Date().toISOString()),
    ...(asString(raw.resolvedAt) ? { resolvedAt: asString(raw.resolvedAt) } : {}),
  };
}

export function normalizeModeration(value: unknown): ListingModeration | null {
  const raw = asRecord(value);
  if (!raw || !asString(raw.listingId)) return null;

  return {
    listingId: asString(raw.listingId),
    published: typeof raw.published === "boolean" ? raw.published : true,
    suspended: typeof raw.suspended === "boolean" ? raw.suspended : false,
    verifiedOverride:
      typeof raw.verifiedOverride === "boolean" ? raw.verifiedOverride : null,
    updatedAt: asString(raw.updatedAt, new Date().toISOString()),
  };
}

export function normalizeAuditEntry(value: unknown): AuditEntry | null {
  const raw = asRecord(value);
  if (!raw || !asString(raw.id)) return null;

  return {
    id: asString(raw.id),
    actor: oneOf(raw.actor, roles, "admin"),
    action: asString(raw.action),
    targetId: asString(raw.targetId),
    at: asString(raw.at, new Date().toISOString()),
    ...(asString(raw.note) ? { note: asString(raw.note) } : {}),
  };
}

/** Drops anything unreadable rather than letting one bad record break a page. */
export function normalizeList<T>(
  value: unknown,
  normalizeItem: (item: unknown) => T | null,
): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeItem(item))
    .filter((item): item is T => item !== null);
}
