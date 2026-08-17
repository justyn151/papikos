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

describe("derived prices", () => {
  const room = (id: string, price: number) => ({
    id,
    name: "Kamar",
    size: "3 × 3 m",
    price,
    availableRooms: 1,
    bathroom: "shared",
    furnishings: [],
  });

  it("takes the headline price from the cheapest room, not the record", () => {
    const override = normalizeOverride({
      listingId: "senja-setiabudi",
      // A record claiming a price no room offers is the contradiction this
      // derivation exists to remove.
      price: 9_000_000,
      rooms: [room("a", 2_000_000), room("b", 1_500_000)],
    });

    expect(override?.price).toBe(1_500_000);
  });

  it("recomputes the promo from the percentage the owner chose", () => {
    const override = normalizeOverride({
      listingId: "senja-setiabudi",
      discountPercent: 10,
      promoPrice: 1,
      rooms: [room("a", 1_000_000)],
    });

    expect(override?.discountPercent).toBe(10);
    expect(override?.promoPrice).toBe(900_000);
  });

  it("treats a nonsense discount as no discount", () => {
    for (const percent of [0, -5, 120, "half"]) {
      const override = normalizeOverride({
        listingId: "senja-setiabudi",
        discountPercent: percent,
        rooms: [room("a", 1_000_000)],
      });

      expect(override?.discountPercent).toBeNull();
      expect(override?.promoPrice).toBeNull();
    }
  });

  it("ignores an empty room list rather than pricing a kos at zero", () => {
    const override = normalizeOverride({
      listingId: "senja-setiabudi",
      rooms: [],
    });

    expect(override?.rooms).toBeUndefined();
    expect(override?.price).toBeUndefined();
  });

  it("keeps a room's details and defaults a broken bathroom to shared", () => {
    const override = normalizeOverride({
      listingId: "senja-setiabudi",
      rooms: [
        {
          id: "a",
          name: " Kamar Atas ",
          size: "4 × 4 m",
          price: 2_000_000,
          availableRooms: 3,
          bathroom: "elsewhere",
          furnishings: ["Kasur", "", 7],
        },
      ],
    });

    expect(override?.rooms?.[0]).toEqual({
      id: "a",
      name: "Kamar Atas",
      size: "4 × 4 m",
      price: 2_000_000,
      availableRooms: 3,
      bathroom: "shared",
      furnishings: ["Kasur"],
    });
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
      { id: "ok", dataUrl: "data:image/jpeg;base64,AAAA", category: "room" },
    ]);
  });

  it("keeps a photo's tag, and files an untagged or unknown one as a room", () => {
    const override = normalizeOverride({
      listingId: "senja-setiabudi",
      photos: [
        { id: "a", dataUrl: "data:image/jpeg;base64,AAAA", category: "exterior" },
        // Records written before tagging existed, and anything hand-edited.
        { id: "b", dataUrl: "data:image/jpeg;base64,AAAA" },
        { id: "c", dataUrl: "data:image/jpeg;base64,AAAA", category: "garage" },
      ],
    });

    expect(override?.photos?.map((photo) => photo.category)).toEqual([
      "exterior",
      "room",
      "room",
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
