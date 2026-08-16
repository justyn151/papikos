import { describe, expect, it } from "vitest";

import { getListingDetail, listings } from "@/features/listings/mock-listings";
import type { ListingOverride } from "@/features/listings/types";

import { resolveListing, resolveListingDetail } from "./resolve-listing";

const seed = listings[0];
const seedDetail = getListingDetail(seed.id)!;

function override(patch: Partial<ListingOverride> = {}): ListingOverride {
  return {
    listingId: seed.id,
    updatedAt: "2026-08-02T00:00:00.000Z",
    ...patch,
  };
}

describe("listing override merge", () => {
  it("returns the seed untouched when there is no override", () => {
    expect(resolveListing(seed, undefined)).toBe(seed);
  });

  it("applies only the fields the owner actually edited", () => {
    const merged = resolveListing(seed, override({ price: 1_000_000 }));

    expect(merged.price).toBe(1_000_000);
    // Everything else must fall through to the seed.
    expect(merged.name).toBe(seed.name);
    expect(merged.amenities).toEqual(seed.amenities);
  });

  it("treats a null promo as clearing the discount, not as absent", () => {
    const discounted = { ...seed, promoPrice: 900_000 };

    expect(resolveListing(discounted, override({ promoPrice: null })).promoPrice)
      .toBeNull();
    expect(resolveListing(discounted, override()).promoPrice).toBe(900_000);
  });

  it("merges room edits by id and leaves untouched rooms alone", () => {
    const target = seedDetail.rooms[0];
    const merged = resolveListingDetail(
      seedDetail,
      override({
        rooms: [{ id: target.id, price: 111_000, availableRooms: 7 }],
      }),
    );

    expect(merged.rooms[0]).toMatchObject({ price: 111_000, availableRooms: 7 });
    expect(merged.rooms[1]).toEqual(seedDetail.rooms[1]);
  });

  it("derives listing availability from the edited rooms", () => {
    // Otherwise the card, the availability filter, and the room list could
    // disagree about whether the kos has space.
    const merged = resolveListingDetail(
      seedDetail,
      override({
        rooms: seedDetail.rooms.map((room) => ({
          id: room.id,
          price: room.price,
          availableRooms: 0,
        })),
      }),
    );

    expect(merged.availableRooms).toBe(0);
  });

  it("merges cost and rule edits by id", () => {
    const cost = seedDetail.costs[1];
    const rule = seedDetail.rules[0];
    const merged = resolveListingDetail(
      seedDetail,
      override({
        costs: [{ id: cost.id, amount: 75_000, included: false }],
        rules: [{ id: rule.id, allowed: !rule.allowed }],
      }),
    );

    expect(merged.costs[1]).toMatchObject({ amount: 75_000, included: false });
    expect(merged.costs[0]).toEqual(seedDetail.costs[0]);
    expect(merged.rules[0].allowed).toBe(!rule.allowed);
  });
});

describe("custom house rules", () => {
  it("adds the owner's rules without dropping the standard ones", () => {
    const merged = resolveListingDetail(
      seedDetail,
      override({
        customRules: [
          { id: "rule-1", label: "Jam tamu maksimal 21.00", allowed: false },
        ],
      }),
    );

    expect(merged.rules.slice(0, seedDetail.rules.length)).toEqual(
      seedDetail.rules,
    );
    expect(merged.rules.at(-1)).toEqual({
      id: "rule-1",
      label: { id: "Jam tamu maksimal 21.00", en: "Jam tamu maksimal 21.00" },
      allowed: false,
    });
  });

  it("still applies standard-rule edits alongside custom ones", () => {
    const rule = seedDetail.rules[0];
    const merged = resolveListingDetail(
      seedDetail,
      override({
        rules: [{ id: rule.id, allowed: !rule.allowed }],
        customRules: [{ id: "rule-1", label: "Dilarang merokok", allowed: false }],
      }),
    );

    expect(merged.rules[0].allowed).toBe(!rule.allowed);
    expect(merged.rules).toHaveLength(seedDetail.rules.length + 1);
  });

  it("leaves the rules alone when there are no custom ones", () => {
    expect(
      resolveListingDetail(seedDetail, override({ customRules: [] })).rules,
    ).toEqual(seedDetail.rules);
  });
});

describe("uploaded photos", () => {
  const photos = [
    { id: "photo-1", dataUrl: "data:image/jpeg;base64,AAAA" },
    { id: "photo-2", dataUrl: "data:image/jpeg;base64,BBBB" },
  ];

  it("puts the cover first and keeps the generated artwork behind it", () => {
    const merged = resolveListingDetail(seedDetail, override({ photos }));

    expect(merged.gallery[0]).toMatchObject({
      id: "photo-1",
      dataUrl: photos[0].dataUrl,
    });
    expect(merged.gallery[1].dataUrl).toBe(photos[1].dataUrl);
    // The seeded artwork still covers every category a renter expects.
    expect(merged.gallery.slice(2)).toEqual(seedDetail.gallery);
  });

  it("keeps the seeded gallery when the owner uploaded nothing", () => {
    expect(resolveListingDetail(seedDetail, override({ photos: [] })).gallery)
      .toEqual(seedDetail.gallery);
    expect(resolveListingDetail(seedDetail, override()).gallery).toEqual(
      seedDetail.gallery,
    );
  });
});
