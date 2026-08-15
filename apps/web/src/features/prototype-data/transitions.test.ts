import { describe, expect, it } from "vitest";

import type {
  BookingRequest,
  ListingReport,
  SubmittedQuestion,
} from "@/features/listings/types";

import {
  answerQuestion,
  approveBooking,
  cancelBooking,
  defaultModeration,
  isListingVisible,
  rejectBooking,
  setPublication,
  setReportStatus,
  setSuspension,
  setVerification,
} from "./transitions";

const pendingBooking: BookingRequest = {
  id: "booking-1",
  listingId: "senja-setiabudi",
  roomId: "senja-setiabudi-standard",
  moveInDate: "2026-09-01",
  durationMonths: 3,
  note: "",
  status: "pending",
  statusHistory: [
    { status: "pending", at: "2026-08-01T00:00:00.000Z", by: "renter" },
  ],
  createdAt: "2026-08-01T00:00:00.000Z",
};

describe("booking transitions", () => {
  it("approves a pending request and appends to its history", () => {
    const result = approveBooking(pendingBooking, "2026-08-02T00:00:00.000Z");

    expect(result?.record.status).toBe("approved");
    expect(result?.record.statusHistory).toEqual([
      { status: "pending", at: "2026-08-01T00:00:00.000Z", by: "renter" },
      { status: "approved", at: "2026-08-02T00:00:00.000Z", by: "owner" },
    ]);
    expect(result?.audit).toMatchObject({
      actor: "owner",
      action: "booking.approved",
      targetId: "booking-1",
    });
  });

  it("never rewrites earlier history entries", () => {
    const rejected = rejectBooking(pendingBooking, "2026-08-02T00:00:00.000Z");

    expect(rejected?.record.statusHistory[0]).toEqual(
      pendingBooking.statusHistory[0],
    );
    expect(rejected?.record.statusHistory).toHaveLength(2);
  });

  it("lets a renter cancel while still pending", () => {
    const result = cancelBooking(pendingBooking);

    expect(result?.record.status).toBe("cancelled");
    expect(result?.audit.actor).toBe("renter");
  });

  it("refuses to decide a request that is already resolved", () => {
    const approved = approveBooking(pendingBooking)!.record;

    // Without this guard an owner could approve an already-cancelled request,
    // or flip a decision after the fact.
    expect(rejectBooking(approved)).toBeNull();
    expect(cancelBooking(approved)).toBeNull();
    expect(approveBooking(approved)).toBeNull();
  });
});

describe("question transitions", () => {
  const question: SubmittedQuestion = {
    id: "q-1",
    listingId: "senja-setiabudi",
    question: "Apakah listrik termasuk?",
    status: "pending",
    createdAt: "2026-08-01T00:00:00.000Z",
  };

  it("stores a trimmed answer and marks the question answered", () => {
    const result = answerQuestion(question, "  Sudah termasuk.  ");

    expect(result?.record).toMatchObject({
      status: "answered",
      answer: "Sudah termasuk.",
    });
    expect(result?.record.answeredAt).toBeTruthy();
    expect(result?.audit.action).toBe("question.answered");
  });

  it("rejects an empty answer", () => {
    expect(answerQuestion(question, "   ")).toBeNull();
  });
});

describe("report transitions", () => {
  const report: ListingReport = {
    id: "report-1",
    listingId: "senja-setiabudi",
    reason: "price",
    details: "Harga tidak sesuai",
    status: "submitted",
    createdAt: "2026-08-01T00:00:00.000Z",
  };

  it("moves a report through review and stamps resolution", () => {
    const reviewing = setReportStatus(report, "reviewing");
    expect(reviewing?.record.status).toBe("reviewing");
    expect(reviewing?.record.resolvedAt).toBeUndefined();

    const resolved = setReportStatus(reviewing!.record, "resolved");
    expect(resolved?.record.resolvedAt).toBeTruthy();
    expect(resolved?.audit.actor).toBe("admin");
  });

  it("ignores a no-op status change", () => {
    expect(setReportStatus(report, "submitted")).toBeNull();
  });
});

describe("listing moderation", () => {
  const moderation = defaultModeration("senja-setiabudi");

  it("treats a listing with no overrides as visible", () => {
    expect(isListingVisible(moderation)).toBe(true);
  });

  it("hides unpublished and suspended listings from renters", () => {
    expect(
      isListingVisible(setPublication(moderation, false, "owner").record),
    ).toBe(false);
    expect(isListingVisible(setSuspension(moderation, true).record)).toBe(false);
  });

  it("records who performed each privileged change", () => {
    expect(setPublication(moderation, false, "owner").audit).toMatchObject({
      actor: "owner",
      action: "listing.unpublished",
      targetId: "senja-setiabudi",
    });
    expect(setSuspension(moderation, true).audit.actor).toBe("admin");
    expect(setVerification(moderation, true).audit).toMatchObject({
      actor: "admin",
      action: "listing.verified",
    });
  });
});
