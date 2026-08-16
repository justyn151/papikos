import { describe, expect, it } from "vitest";

import { amenityLabels } from "@/features/home/copy";

import {
  amenities,
  amenitiesByCategory,
  amenityFacility,
  getListingDetail,
  getRelatedListings,
  listingDetails,
  listings,
  popularAmenities,
} from "./mock-listings";

describe("listing detail data", () => {
  it("provides a complete detail record for every homepage listing", () => {
    expect(listingDetails).toHaveLength(listings.length);

    for (const listing of listings) {
      const detail = getListingDetail(listing.id);
      expect(detail).toBeDefined();
      expect(detail?.gallery.length).toBeGreaterThanOrEqual(5);
      expect(detail?.rooms.length).toBeGreaterThanOrEqual(2);
      expect(detail?.costs.some((cost) => cost.id === "electricity")).toBe(true);
      expect(detail?.rules.length).toBeGreaterThan(0);
      expect(detail?.landmarks.length).toBeGreaterThan(0);
    }
  });

  it("uses unique room ids and excludes the current listing from alternatives", () => {
    const roomIds = listingDetails.flatMap((listing) =>
      listing.rooms.map((room) => room.id),
    );
    expect(new Set(roomIds).size).toBe(roomIds.length);

    const listing = listingDetails[0];
    const related = getRelatedListings(listing);
    expect(related).toHaveLength(3);
    expect(related.some((item) => item.id === listing.id)).toBe(false);
  });
});

describe("the amenity taxonomy", () => {
  it("gives every amenity a facility entry and a label in both locales", () => {
    // The facility entry is what puts an amenity in a category, so an amenity
    // missing one would vanish from the grouped filter and editor panels.
    for (const amenity of amenities) {
      expect(amenityFacility[amenity]).toBeDefined();
      expect(amenityLabels.id[amenity]).toBeTruthy();
      expect(amenityLabels.en[amenity]).toBeTruthy();
    }
  });

  it("uses a unique facility id per amenity", () => {
    const ids = amenities.map((amenity) => amenityFacility[amenity].id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers the whole list exactly once when grouped by category", () => {
    const grouped = amenitiesByCategory.flatMap((group) => group.items);
    expect(grouped).toHaveLength(amenities.length);
    expect(new Set(grouped)).toEqual(new Set(amenities));
  });

  it("keeps the short homepage survey to a subset of the real amenities", () => {
    expect(popularAmenities.length).toBeLessThan(amenities.length);
    for (const amenity of popularAmenities) {
      expect(amenities).toContain(amenity);
    }
  });

  it("advertises only the amenities a listing actually has", () => {
    for (const detail of listingDetails) {
      expect(detail.facilities).toHaveLength(detail.amenities.length);
      // Every amenity is filterable, so a facility with no matching amenity
      // would be a claim search could never find.
      for (const facility of detail.facilities) {
        expect(
          detail.amenities.some(
            (amenity) => amenityFacility[amenity].id === facility.id,
          ),
        ).toBe(true);
      }
    }
  });

  it("varies amenities across the sample so the facet counts mean something", () => {
    // Wi-Fi is the one amenity every sample kos has, which is realistic; any
    // other universal amenity would make its filter chip a no-op.
    for (const amenity of amenities) {
      const withIt = listings.filter((listing) =>
        listing.amenities.includes(amenity),
      ).length;
      expect(withIt).toBeGreaterThan(0);
      if (amenity !== "wifi") {
        expect(withIt).toBeLessThan(listings.length);
      }
    }
  });
});
