import { describe, expect, it } from "vitest";

import { MAX_PHOTOS } from "@/features/owner/photo-upload";

import {
  normalizeBooking,
  normalizeList,
  normalizeModeration,
  normalizeOverride,
  normalizeQuestion,
  normalizeReport,
} from "./normalize";

describe("legacy record migration", () => {
  it("gives a pre-history booking a seeded status history", () => {
    // Exactly what browsers already hold from before owner surfaces existed.
    const legacy = {
      id: "booking-1",
      listingId: "senja-setiabudi",
      roomId: "senja-setiabudi-standard",
      moveInDate: "2026-09-01",
      durationMonths: 3,
      note: "",
      status: "pending",
      createdAt: "2026-08-01T00:00:00.000Z",
    };

    expect(normalizeBooking(legacy)?.statusHistory).toEqual([
      { status: "pending", at: "2026-08-01T00:00:00.000Z", by: "renter" },
    ]);
  });

  it("infers answered status from a legacy question that carries an answer", () => {
    const legacy = {
      id: "q-1",
      listingId: "senja-setiabudi",
      question: "Listrik termasuk?",
      answer: "Sudah termasuk.",
      createdAt: "2026-08-01T00:00:00.000Z",
    };

    expect(normalizeQuestion(legacy)?.status).toBe("answered");
  });

  it("falls back to a safe status when the stored one is unknown", () => {
    expect(
      normalizeBooking({
        id: "b",
        listingId: "l",
        status: "nonsense",
        createdAt: "2026-08-01T00:00:00.000Z",
      })?.status,
    ).toBe("pending");

    expect(
      normalizeReport({ id: "r", listingId: "l", status: 42 })?.status,
    ).toBe("submitted");
  });

  it("defaults moderation to published and unsuspended", () => {
    expect(normalizeModeration({ listingId: "senja-setiabudi" })).toMatchObject({
      published: true,
      suspended: false,
      verifiedOverride: null,
    });
  });
});

describe("defensive parsing", () => {
  it("rejects records missing their identifiers", () => {
    expect(normalizeBooking({ listingId: "l" })).toBeNull();
    expect(normalizeQuestion(null)).toBeNull();
    expect(normalizeReport("not an object")).toBeNull();
  });

  it("drops unreadable items instead of failing the whole list", () => {
    const stored = [
      { id: "b1", listingId: "l", createdAt: "2026-08-01T00:00:00.000Z" },
      null,
      "garbage",
      { missingId: true },
    ];

    expect(normalizeList(stored, normalizeBooking)).toHaveLength(1);
  });

  it("returns an empty list when storage holds something that is not an array", () => {
    expect(normalizeList({ nope: true }, normalizeBooking)).toEqual([]);
    expect(normalizeList(undefined, normalizeBooking)).toEqual([]);
  });
});

describe("stored photos", () => {
  it("keeps inline images and drops anything else", () => {
    const override = normalizeOverride({
      listingId: "senja-setiabudi",
      photos: [
        { id: "ok", dataUrl: "data:image/jpeg;base64,AAAA" },
        // A remote URL here would turn a stored record into an off-origin
        // request the page never intended to make.
        { id: "remote", dataUrl: "https://example.com/photo.jpg" },
        { id: "", dataUrl: "data:image/png;base64,AAAA" },
        { dataUrl: "data:text/html;base64,AAAA" },
        "garbage",
      ],
    });

    expect(override?.photos).toEqual([
      { id: "ok", dataUrl: "data:image/jpeg;base64,AAAA" },
    ]);
  });

  it("enforces the photo cap on read, not only on upload", () => {
    const override = normalizeOverride({
      listingId: "senja-setiabudi",
      photos: Array.from({ length: MAX_PHOTOS + 3 }, (_, index) => ({
        id: `photo-${index}`,
        dataUrl: "data:image/jpeg;base64,AAAA",
      })),
    });

    expect(override?.photos).toHaveLength(MAX_PHOTOS);
  });

  it("leaves photos absent when the record has none", () => {
    expect(normalizeOverride({ listingId: "x" })?.photos).toBeUndefined();
  });
});
