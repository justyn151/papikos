import type { ListingDetail } from "./types";

/**
 * Renters see where a kos roughly is, not where it is. The approximation is
 * done to the stored coordinate rather than to the drawing of it: a map that
 * hides an exact point it was still sent is only pretending, since the point
 * is in the page source either way.
 *
 * Three decimals is about 110m at this latitude, which sits inside the
 * smallest privacy radius an owner can set, so the rounding never widens a
 * circle the owner thought was tight.
 */
export const COORDINATE_PRECISION = 3;

export interface Coordinates {
  lat: number;
  lng: number;
}

export function approximate({ lat, lng }: Coordinates): Coordinates {
  const factor = 10 ** COORDINATE_PRECISION;
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor,
  };
}

/** Indonesia's bounds, generously drawn: enough to catch a swapped lat/lng. */
export function isPlausibleCoordinate(value: unknown): value is Coordinates {
  if (typeof value !== "object" || value === null) return false;
  const { lat, lng } = value as Partial<Coordinates>;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -11 &&
    lat <= 6 &&
    lng >= 95 &&
    lng <= 141
  );
}

/**
 * The privacy circle is the location as far as a renter is concerned, so it is
 * clamped: too small and it points at a building, too large and the kos could
 * be in another district.
 */
export const MIN_PRIVACY_RADIUS = 150;
export const MAX_PRIVACY_RADIUS = 1500;

export function clampPrivacyRadius(meters: number): number {
  return Math.min(
    MAX_PRIVACY_RADIUS,
    Math.max(MIN_PRIVACY_RADIUS, Math.round(meters)),
  );
}

export function listingCoordinates(listing: ListingDetail): Coordinates {
  return { lat: listing.lat, lng: listing.lng };
}
