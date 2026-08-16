"use client";

import { useCallback } from "react";

import type {
  AuditEntry,
  BookingRequest,
  ListingModeration,
  ListingOverride,
  ListingReport,
  SubmittedQuestion,
} from "@/features/listings/types";
import {
  AUDIT_STORAGE_KEY,
  BOOKINGS_STORAGE_KEY,
  MODERATION_STORAGE_KEY,
  OVERRIDES_STORAGE_KEY,
  QUESTIONS_STORAGE_KEY,
  REPORTS_STORAGE_KEY,
} from "@/features/shared/storage-keys";
import { usePersistentState } from "@/features/shared/use-persistent-state";

import {
  normalizeAuditEntry,
  normalizeBooking,
  normalizeList,
  normalizeModeration,
  normalizeOverride,
  normalizeQuestion,
  normalizeReport,
} from "./normalize";
import { defaultModeration } from "./transitions";

/**
 * The prototype's shared local store. Renter, owner, and admin surfaces all
 * read and write these same keys, which is what makes submitted requests
 * actually actionable without a backend.
 */

export function useBookings() {
  const [raw, setRaw] = usePersistentState<unknown>(BOOKINGS_STORAGE_KEY, []);
  const bookings = normalizeList<BookingRequest>(raw, normalizeBooking);

  const replace = useCallback(
    (next: BookingRequest) =>
      setRaw((current: unknown) =>
        normalizeList<BookingRequest>(current, normalizeBooking).map((item) =>
          item.id === next.id ? next : item,
        ),
      ),
    [setRaw],
  );

  const add = useCallback(
    (next: BookingRequest) =>
      setRaw((current: unknown) => [
        next,
        ...normalizeList<BookingRequest>(current, normalizeBooking),
      ]),
    [setRaw],
  );

  return { bookings, replace, add };
}

export function useQuestions() {
  const [raw, setRaw] = usePersistentState<unknown>(QUESTIONS_STORAGE_KEY, []);
  const questions = normalizeList<SubmittedQuestion>(raw, normalizeQuestion);

  const replace = useCallback(
    (next: SubmittedQuestion) =>
      setRaw((current: unknown) =>
        normalizeList<SubmittedQuestion>(current, normalizeQuestion).map(
          (item) => (item.id === next.id ? next : item),
        ),
      ),
    [setRaw],
  );

  return { questions, replace };
}

export function useReports() {
  const [raw, setRaw] = usePersistentState<unknown>(REPORTS_STORAGE_KEY, []);
  const reports = normalizeList<ListingReport>(raw, normalizeReport);

  const replace = useCallback(
    (next: ListingReport) =>
      setRaw((current: unknown) =>
        normalizeList<ListingReport>(current, normalizeReport).map((item) =>
          item.id === next.id ? next : item,
        ),
      ),
    [setRaw],
  );

  return { reports, replace };
}

export function useModeration() {
  const [raw, setRaw] = usePersistentState<unknown>(MODERATION_STORAGE_KEY, []);
  const entries = normalizeList<ListingModeration>(raw, normalizeModeration);

  // Listings without an explicit override are published and unsuspended.
  const moderationFor = useCallback(
    (listingId: string): ListingModeration =>
      entries.find((entry) => entry.listingId === listingId) ??
      defaultModeration(listingId),
    [entries],
  );

  const replace = useCallback(
    (next: ListingModeration) =>
      setRaw((current: unknown) => {
        const list = normalizeList<ListingModeration>(
          current,
          normalizeModeration,
        );
        const exists = list.some((item) => item.listingId === next.listingId);
        return exists
          ? list.map((item) =>
              item.listingId === next.listingId ? next : item,
            )
          : [...list, next];
      }),
    [setRaw],
  );

  return { entries, moderationFor, replace };
}

export function useAuditLog() {
  const [raw, setRaw] = usePersistentState<unknown>(AUDIT_STORAGE_KEY, []);
  const entries = normalizeList<AuditEntry>(raw, normalizeAuditEntry);

  const append = useCallback(
    (entry: AuditEntry) =>
      setRaw((current: unknown) => [
        entry,
        ...normalizeList<AuditEntry>(current, normalizeAuditEntry),
      ]),
    [setRaw],
  );

  return { entries, append };
}

export function useOverrides() {
  // Overrides are the one store that can hold uploaded photos, so this is the
  // one whose write can realistically exhaust the origin's storage budget.
  const [raw, setRaw, writeError] = usePersistentState<unknown>(
    OVERRIDES_STORAGE_KEY,
    [],
  );
  const entries = normalizeList<ListingOverride>(raw, normalizeOverride);

  const overrideFor = useCallback(
    (listingId: string) =>
      entries.find((entry) => entry.listingId === listingId),
    [entries],
  );

  const replace = useCallback(
    (next: ListingOverride) =>
      setRaw((current: unknown) => {
        const list = normalizeList<ListingOverride>(current, normalizeOverride);
        const exists = list.some((item) => item.listingId === next.listingId);
        return exists
          ? list.map((item) =>
              item.listingId === next.listingId ? next : item,
            )
          : [...list, next];
      }),
    [setRaw],
  );

  /** Resetting is a delete, so the seeded values simply show through again. */
  const clear = useCallback(
    (listingId: string) =>
      setRaw((current: unknown) =>
        normalizeList<ListingOverride>(current, normalizeOverride).filter(
          (item) => item.listingId !== listingId,
        ),
      ),
    [setRaw],
  );

  return { entries, overrideFor, replace, clear, writeError };
}
