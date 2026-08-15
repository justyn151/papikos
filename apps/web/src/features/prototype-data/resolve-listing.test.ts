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
