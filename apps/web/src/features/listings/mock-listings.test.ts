import { describe, expect, it } from "vitest";

import {
  getListingDetail,
  getRelatedListings,
  listingDetails,
  listings,
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
