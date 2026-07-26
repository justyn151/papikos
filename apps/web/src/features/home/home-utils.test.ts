import { describe, expect, it } from "vitest";

import { listings } from "./mock-listings";
import {
  filterListings,
  formatPrice,
  normalizeSearchParams,
  rankListings,
  serializeFilters,
} from "./home-utils";

describe("homepage search utilities", () => {
  it("normalizes malformed URL filters safely", () => {
    expect(
      normalizeSearchParams({
        q: "  Bandung ",
        type: "unknown",
        max: "-50",
      }),
    ).toEqual({
      query: "Bandung",
      type: "all",
      maxPrice: null,
    });
  });

  it("serializes only active filters", () => {
    expect(
      serializeFilters({
        query: "Yogyakarta",
        type: "putri",
        maxPrice: 1500000,
      }),
    ).toBe("?q=Yogyakarta&type=putri&max=1500000");
  });

  it("combines location, type, and budget filters", () => {
    const result = filterListings(listings, {
      query: "Bandung",
      type: "putri",
      maxPrice: 1700000,
    });

    expect(result.map((listing) => listing.id)).toEqual(["asri-dago"]);
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
