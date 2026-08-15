import { describe, expect, it } from "vitest";

import { listings } from "./mock-listings";
import {
  defaultFilters,
  filterListings,
  formatPrice,
  normalizeSearchParams,
  rankListings,
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
    expect(result.every((listing) => listing.price >= 1500000)).toBe(true);
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

describe("preference matching", () => {
  it("uses the documented 35/30/20/15 weighting", () => {
    const results = rankListings(listings, {
      city: "Jakarta",
      maxBudget: 2500000,
      roomType: "campur",
      amenities: ["wifi", "ac", "privateBathroom"],
    });

    expect(results[0]).toMatchObject({
      listingId: "senja-setiabudi",
      score: 100,
    });
    expect(results[0].reasons.map((reason) => reason.kind)).toEqual([
      "budget",
      "location",
      "roomType",
      "amenities",
    ]);
  });
});

describe("currency formatting", () => {
  it("uses Indonesian and English locale conventions", () => {
    expect(formatPrice(1500000, "id")).toContain("1.500.000");
    expect(formatPrice(1500000, "en")).toContain("1,500,000");
  });
});
