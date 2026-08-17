"use client";

import dynamic from "next/dynamic";

/**
 * Leaflet reaches for `window` as it loads, so the map cannot be part of the
 * server render. The placeholder holds the same box the map will fill, so the
 * page does not jump when it arrives.
 */
export const LazyListingMap = dynamic(
  () => import("./listing-map").then((module) => module.ListingMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-blue-100/60 dark:bg-blue-950/40" />
    ),
  },
);
