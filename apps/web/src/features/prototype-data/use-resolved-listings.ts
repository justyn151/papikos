"use client";

import { useCallback, useMemo } from "react";

import {
  getListingDetail,
  listings as seedListings,
} from "@/features/listings/mock-listings";
import type { Listing, ListingDetail } from "@/features/listings/types";

import { resolveListing, resolveListingDetail } from "./resolve-listing";
import { useOverrides } from "./store";

/**
 * Seeded listings with the owner's edits applied. Every renter- and
 * console-facing surface reads through this rather than importing the mock
 * data directly, otherwise an edit would appear on some pages and not others.
 */
export function useResolvedListings() {
  const { overrideFor } = useOverrides();

  const listings: Listing[] = useMemo(
    () => seedListings.map((seed) => resolveListing(seed, overrideFor(seed.id))),
    [overrideFor],
  );

  const detailFor = useCallback(
    (listingId: string): ListingDetail | undefined => {
      const seed = getListingDetail(listingId);
      return seed ? resolveListingDetail(seed, overrideFor(listingId)) : undefined;
    },
    [overrideFor],
  );

  return { listings, detailFor };
}
