import { describe, expect, it } from "vitest";

import { getListingDetail, listings } from "@/features/listings/mock-listings";
import type {
  ListingOverride,
  ListingPhoto,
  OverrideRoom,
  RoomOption,
} from "@/features/listings/types";

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

/** A seeded room in the shape the editor stores it, optionally edited. */
function asOverrideRoom(
  room: RoomOption,
  patch: Partial<OverrideRoom> = {},
): OverrideRoom {
  return {
    id: room.id,
    name: room.name.id,
    size: room.size,
    price: room.price,
    availableRooms: room.availableRooms,
    bathroom: room.bathroom,
    furnishings: room.furnishings.map((item) => item.id),
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

  it("applies a room edit and leaves the untouched room identical", () => {
    const merged = resolveListingDetail(
      seedDetail,
      override({
        rooms: [
          asOverrideRoom(seedDetail.rooms[0], {
            price: 111_000,
            availableRooms: 7,
          }),
          asOverrideRoom(seedDetail.rooms[1]),
        ],
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
        rooms: seedDetail.rooms.map((room) =>
          asOverrideRoom(room, { availableRooms: 0 }),
        ),
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

describe("adding and removing rooms", () => {
  it("keeps only the rooms the owner kept", () => {
    // The override is the whole list, so a seeded room the owner deleted must
    // not survive by falling through to the seed.
    const merged = resolveListingDetail(
      seedDetail,
      override({ rooms: [asOverrideRoom(seedDetail.rooms[1])] }),
    );

    expect(merged.rooms).toHaveLength(1);
    expect(merged.rooms[0].id).toBe(seedDetail.rooms[1].id);
  });

  it("carries a room the owner added, in their own words", () => {
    const merged = resolveListingDetail(
      seedDetail,
      override({
        rooms: [
          ...seedDetail.rooms.map((room) => asOverrideRoom(room)),
          {
            id: "room-new",
            name: "Kamar Atas",
            size: "4 × 4 m",
            price: 3_000_000,
            availableRooms: 2,
            bathroom: "private",
            furnishings: ["Tempat tidur", "AC"],
          },
        ],
      }),
    );

    expect(merged.rooms).toHaveLength(seedDetail.rooms.length + 1);
    expect(merged.rooms.at(-1)).toMatchObject({
      id: "room-new",
      name: { id: "Kamar Atas", en: "Kamar Atas" },
      bathroom: "private",
    });
    expect(merged.availableRooms).toBe(
      seedDetail.rooms.reduce((total, room) => total + room.availableRooms, 0) +
        2,
    );
  });

  it("keeps the seeded translation for a name the owner left alone", () => {
    const merged = resolveListingDetail(
      seedDetail,
      override({
        rooms: [asOverrideRoom(seedDetail.rooms[0], { price: 999_000 })],
      }),
    );

    // Editing a price in one language must not flatten the other one.
    expect(merged.rooms[0].name).toEqual(seedDetail.rooms[0].name);
    expect(merged.rooms[0].furnishings).toEqual(
      seedDetail.rooms[0].furnishings,
    );
  });

  it("takes the owner's wording in both languages once renamed", () => {
    const merged = resolveListingDetail(
      seedDetail,
      override({
        rooms: [asOverrideRoom(seedDetail.rooms[0], { name: "Kamar Depan" })],
      }),
    );

    expect(merged.rooms[0].name).toEqual({
      id: "Kamar Depan",
      en: "Kamar Depan",
    });
  });
});

describe("cost rows", () => {
  it("drops a seeded cost the owner removed", () => {
    const removed = seedDetail.costs[1];
    const merged = resolveListingDetail(
      seedDetail,
      override({
        costs: [{ id: removed.id, amount: null, included: false, removed: true }],
      }),
    );

    expect(merged.costs.map((cost) => cost.id)).not.toContain(removed.id);
    expect(merged.costs).toHaveLength(seedDetail.costs.length - 1);
  });

  it("appends the owner's own cost rows after the seeded ones", () => {
    const merged = resolveListingDetail(
      seedDetail,
      override({
        customCosts: [
          {
            id: "cost-1",
            label: "Iuran kebersihan",
            amount: 50_000,
            included: false,
            note: "Ditagih tiap awal bulan",
          },
        ],
      }),
    );

    expect(merged.costs.slice(0, seedDetail.costs.length)).toEqual(
      seedDetail.costs,
    );
    // The note is the only explanation an added charge can have: there is no
    // seeded copy for a fee Papikos has never heard of.
    expect(merged.costs.at(-1)).toEqual({
      id: "cost-1",
      label: { id: "Iuran kebersihan", en: "Iuran kebersihan" },
      amount: 50_000,
      included: false,
      note: { id: "Ditagih tiap awal bulan", en: "Ditagih tiap awal bulan" },
    });
  });

  it("leaves an added charge without a note rather than inventing one", () => {
    const merged = resolveListingDetail(
      seedDetail,
      override({
        customCosts: [
          { id: "cost-2", label: "Iuran RT", amount: null, included: false },
        ],
      }),
    );

    expect(merged.costs.at(-1)?.note).toBeUndefined();
  });

  it("keeps the seeded explanation when the owner did not touch it", () => {
    const explained = seedDetail.costs.find((cost) => cost.note)!;
    const merged = resolveListingDetail(
      seedDetail,
      override({
        costs: [
          {
            id: explained.id,
            amount: 90_000,
            included: false,
            note: explained.note!.id,
          },
        ],
      }),
    );

    expect(merged.costs.find((cost) => cost.id === explained.id)?.note).toEqual(
      explained.note,
    );
  });

  it("clears the seeded explanation when the owner emptied it", () => {
    const explained = seedDetail.costs.find((cost) => cost.note)!;
    const merged = resolveListingDetail(
      seedDetail,
      override({
        costs: [{ id: explained.id, amount: null, included: false, note: "" }],
      }),
    );

    expect(merged.costs.find((cost) => cost.id === explained.id)?.note)
      .toBeUndefined();
  });
});

describe("the fields renters read but only owners set", () => {
  it("carries stay terms and location privacy through the merge", () => {
    const merged = resolveListingDetail(
      seedDetail,
      override({
        availableFrom: "2026-12-01",
        minimumStayMonths: 6,
        approximateArea: "Dekat kampus",
        privacyRadiusMeters: 250,
      }),
    );

    expect(merged).toMatchObject({
      availableFrom: "2026-12-01",
      minimumStayMonths: 6,
      approximateArea: "Dekat kampus",
      privacyRadiusMeters: 250,
    });
  });

  it("moves the kos when the city changes, so search follows it", () => {
    expect(resolveListing(seed, override({ city: "Malang" })).city).toBe(
      "Malang",
    );
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
  const photos: ListingPhoto[] = [
    { id: "photo-1", dataUrl: "data:image/jpeg;base64,AAAA", category: "room" },
    {
      id: "photo-2",
      dataUrl: "data:image/jpeg;base64,BBBB",
      category: "exterior",
    },
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
