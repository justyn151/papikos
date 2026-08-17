import { describe, expect, it } from "vitest";

import { listings } from "./mock-listings";
import {
  defaultFilters,
  discountPercent,
  discountedPrice,
  effectivePrice,
  filterListings,
  formatPrice,
  roomEffectivePrice,
  normalizeSearchParams,
  serializeFilters,
} from "./home-utils";
import type { SearchFilters } from "./types";

describe("homepage search utilities", () => {
  it("normalizes malformed URL filters safely", () => {
    expect(
      normalizeSearchParams({
        q: "  Bandung ",
        type: "unknown",
        min: "-10",
        max: "-50",
        amenities: "wifi,not-real,ac",
      }),
    ).toEqual({
      ...defaultFilters,
      query: "Bandung",
      type: "all",
      amenities: ["wifi", "ac"],
    });
  });

  it("serializes only active filters", () => {
    expect(
      serializeFilters({
        ...defaultFilters,
        query: "Yogyakarta",
        type: "putri",
        maxPrice: 1500000,
      }),
    ).toBe("?q=Yogyakarta&type=putri&max=1500000");
  });

  it("serializes minPrice and amenities", () => {
    expect(
      serializeFilters({
        ...defaultFilters,
        minPrice: 800000,
        amenities: ["wifi", "ac"],
      }),
    ).toBe("?min=800000&amenities=wifi%2Cac");
  });

  it("serializes the availability and verified toggles", () => {
    expect(
      serializeFilters({
        ...defaultFilters,
        availableOnly: true,
        verifiedOnly: true,
      }),
    ).toBe("?available=1&verified=1");
  });

  it("round-trips a full filter set through serialize and normalize", () => {
    const original: SearchFilters = {
      query: "Jakarta",
      type: "campur",
      minPrice: 1000000,
      maxPrice: 3000000,
      amenities: ["wifi", "ac"],
      availableOnly: true,
      verifiedOnly: true,
    };

    const serialized = serializeFilters(original);
    const params = Object.fromEntries(new URLSearchParams(serialized));

    expect(normalizeSearchParams(params)).toEqual(original);
  });

  it("combines location, type, and budget filters", () => {
    const result = filterListings(listings, {
      ...defaultFilters,
      query: "Bandung",
      type: "putri",
      maxPrice: 1700000,
    });

    expect(result.map((listing) => listing.id)).toEqual(["asri-dago"]);
  });

  it("filters out listings below the minimum price", () => {
    const result = filterListings(listings, {
      ...defaultFilters,
      minPrice: 1500000,
    });

    expect(result.length).toBeLessThan(listings.length);
    // effectivePrice, not price: the bound applies to what is actually paid.
    expect(result.every((listing) => effectivePrice(listing) >= 1500000)).toBe(
      true,
    );
  });

  it("keeps only listings with free rooms when availableOnly is set", () => {
    const result = filterListings(listings, {
      ...defaultFilters,
      availableOnly: true,
    });

    expect(result.length).toBeLessThan(listings.length);
    expect(result.every((listing) => listing.availableRooms > 0)).toBe(true);
  });

  it("keeps only verified listings when verifiedOnly is set", () => {
    const result = filterListings(listings, {
      ...defaultFilters,
      verifiedOnly: true,
    });

    expect(result.length).toBeLessThan(listings.length);
    expect(result.every((listing) => listing.verified)).toBe(true);
  });

  it("requires every selected amenity to be present (AND semantics)", () => {
    const result = filterListings(listings, {
      ...defaultFilters,
      amenities: ["kitchen", "laundry"],
    });

    expect(result.length).toBeLessThan(listings.length);
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (listing) =>
          listing.amenities.includes("kitchen") &&
          listing.amenities.includes("laundry"),
      ),
    ).toBe(true);
  });
});

describe("currency formatting", () => {
  it("uses Indonesian and English locale conventions", () => {
    expect(formatPrice(1500000, "id")).toContain("1.500.000");
    expect(formatPrice(1500000, "en")).toContain("1,500,000");
  });
});

describe("discounted pricing", () => {
  const full = listings.find((item) => item.promoPrice === null)!;
  const discounted = listings.find((item) => item.promoPrice !== null)!;

  it("uses the promo price when one is set", () => {
    expect(effectivePrice(full)).toBe(full.price);
    expect(effectivePrice(discounted)).toBe(discounted.promoPrice);
  });

  it("reports a whole-percent discount, or none", () => {
    expect(discountPercent(full)).toBeNull();
    expect(discountPercent(discounted)).toBeGreaterThan(0);
    // A "promo" that is not cheaper is not a discount.
    expect(discountPercent({ ...full, promoPrice: full.price })).toBeNull();
  });

  it("takes the same percentage off every room rate", () => {
    const dearer = discounted.price + 250_000;
    const rate = roomEffectivePrice(discounted, dearer);
    const headlineShare = discounted.promoPrice! / discounted.price;

    // A fixed rupiah cut would quietly give the pricier room a smaller
    // discount than the badge on the card promises.
    expect(rate / dearer).toBeCloseTo(headlineShare, 3);
    expect(rate).toBeLessThan(dearer);
  });

  it("lands the headline room exactly on the advertised promo price", () => {
    expect(roomEffectivePrice(discounted, discounted.price)).toBe(
      discounted.promoPrice,
    );
    expect(roomEffectivePrice(full, full.price)).toBe(full.price);
  });

  it("rounds a percentage discount to whole thousands", () => {
    expect(discountedPrice(1_350_000, 15)).toBe(1_148_000);
    expect(discountedPrice(1_000_000, 10)).toBe(900_000);
    // No discount means no rounding either.
    expect(discountedPrice(1_234_567, 0)).toBe(1_234_567);
  });

  it("filters on what the renter would actually pay", () => {
    // The bug this exists to prevent: a kos discounted under the budget being
    // hidden by a max-price filter it genuinely satisfies.
    const budget = discounted.promoPrice!;
    expect(budget).toBeLessThan(discounted.price);

    const result = filterListings([discounted], {
      ...defaultFilters,
      maxPrice: budget,
    });

    expect(result).toHaveLength(1);
  });
});
