import { describe, expect, it } from "vitest";

import { getListingDetail, listingDetails } from "./mock-listings";
import {
  MAX_PRIVACY_RADIUS,
  MIN_PRIVACY_RADIUS,
  approximate,
  clampPrivacyRadius,
  isPlausibleCoordinate,
} from "./location";

describe("approximate coordinates", () => {
  it("rounds to about a hundred metres", () => {
    expect(approximate({ lat: -6.2087634, lng: 106.8455931 })).toEqual({
      lat: -6.209,
      lng: 106.846,
    });
  });

  it("is idempotent, so re-saving cannot drift a kos across the map", () => {
    const once = approximate({ lat: -7.2874311, lng: 112.7952 });

    expect(approximate(once)).toEqual(once);
  });

  it("stays inside the smallest circle an owner can draw", () => {
    // The rounding is only honest if it cannot move a kos outside the privacy
    // circle that is supposed to contain it: ~110m against a 150m minimum.
    const worstCaseMetres = 0.001 * 111_320;

    expect(worstCaseMetres).toBeLessThan(MIN_PRIVACY_RADIUS);
  });
});

describe("coordinate validation", () => {
  it("accepts a point in Indonesia", () => {
    expect(isPlausibleCoordinate({ lat: -6.209, lng: 106.83 })).toBe(true);
  });

  it("rejects a swapped, partial, or absent pair", () => {
    // Swapping puts a Jakarta kos in Somalia, which the bounds catch.
    expect(isPlausibleCoordinate({ lat: 106.83, lng: -6.209 })).toBe(false);
    expect(isPlausibleCoordinate({ lat: -6.209 })).toBe(false);
    expect(isPlausibleCoordinate(null)).toBe(false);
    expect(isPlausibleCoordinate({ lat: "-6.2", lng: "106.8" })).toBe(false);
  });
});

describe("privacy radius", () => {
  it("clamps a radius that would point at a building or at a district", () => {
    expect(clampPrivacyRadius(10)).toBe(MIN_PRIVACY_RADIUS);
    expect(clampPrivacyRadius(50_000)).toBe(MAX_PRIVACY_RADIUS);
    expect(clampPrivacyRadius(450)).toBe(450);
  });
});

describe("the seeded listings", () => {
  it("all carry a plausible point, stored no more precisely than the app allows", () => {
    for (const listing of listingDetails) {
      const point = { lat: listing.lat, lng: listing.lng };

      expect(isPlausibleCoordinate(point)).toBe(true);
      expect(approximate(point)).toEqual(point);
    }
  });

  it("puts a kos near the city it claims", () => {
    // Jakarta and Yogyakarta are 430km apart; a mixed-up seed would show.
    const jakarta = getListingDetail("senja-setiabudi")!;
    const yogya = getListingDetail("kalyana-gejayan")!;

    expect(jakarta.lat).toBeCloseTo(-6.2, 0);
    expect(yogya.lat).toBeCloseTo(-7.8, 0);
  });
});
