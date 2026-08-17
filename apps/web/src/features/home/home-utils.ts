import { amenities as knownAmenities } from "@/features/listings/mock-listings";

import type {
  Amenity,
  Listing,
  ListingTypeFilter,
  Locale,
  MatchReason,
  MatchResult,
  SearchFilters,
  SurveyPreferences,
} from "./types";

export const defaultFilters: SearchFilters = {
  query: "",
  type: "all",
  minPrice: null,
  maxPrice: null,
  amenities: [],
  availableOnly: false,
  verifiedOnly: false,
};

const validTypes: ListingTypeFilter[] = [
  "all",
  "putra",
  "putri",
  "campur",
];

export function normalizeSearchParams(
  params: Record<string, string | string[] | undefined>,
): SearchFilters {
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type;
  const rawMin = Array.isArray(params.min) ? params.min[0] : params.min;
  const rawMax = Array.isArray(params.max) ? params.max[0] : params.max;
  const rawAmenities = Array.isArray(params.amenities)
    ? params.amenities[0]
    : params.amenities;
  const rawAvailable = Array.isArray(params.available)
    ? params.available[0]
    : params.available;
  const rawVerified = Array.isArray(params.verified)
    ? params.verified[0]
    : params.verified;
  const parsedMin = rawMin ? Number(rawMin) : null;
  const parsedMax = rawMax ? Number(rawMax) : null;
  const knownAmenitySet = new Set<string>(knownAmenities);
  const parsedAmenities = Array.from(
    new Set(
      (rawAmenities ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => knownAmenitySet.has(item)),
    ),
  ) as Amenity[];

  return {
    query: rawQuery?.trim() ?? "",
    type: validTypes.includes(rawType as ListingTypeFilter)
      ? (rawType as ListingTypeFilter)
      : "all",
    minPrice:
      parsedMin && Number.isFinite(parsedMin) && parsedMin > 0
        ? parsedMin
        : null,
    maxPrice:
      parsedMax && Number.isFinite(parsedMax) && parsedMax > 0
        ? parsedMax
        : null,
    amenities: parsedAmenities,
    availableOnly: rawAvailable === "1",
    verifiedOnly: rawVerified === "1",
  };
}

export function serializeFilters(filters: SearchFilters): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.minPrice) params.set("min", String(filters.minPrice));
  if (filters.maxPrice) params.set("max", String(filters.maxPrice));
  if (filters.amenities.length > 0) {
    params.set("amenities", filters.amenities.join(","));
  }
  if (filters.availableOnly) params.set("available", "1");
  if (filters.verifiedOnly) params.set("verified", "1");
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function filterListings(
  source: Listing[],
  filters: SearchFilters,
): Listing[] {
  const query = filters.query.trim().toLocaleLowerCase("id-ID");

  return source.filter((listing) => {
    const searchable = `${listing.name} ${listing.city} ${listing.district}`.toLocaleLowerCase(
      "id-ID",
    );
    const matchesQuery = !query || searchable.includes(query);
    const matchesType =
      filters.type === "all" || listing.type === filters.type;
    const price = effectivePrice(listing);
    const matchesMinPrice =
      filters.minPrice === null || price >= filters.minPrice;
    const matchesMaxPrice =
      filters.maxPrice === null || price <= filters.maxPrice;
    const matchesAmenities =
      filters.amenities.length === 0 ||
      filters.amenities.every((amenity) =>
        listing.amenities.includes(amenity),
      );
    const matchesAvailability =
      !filters.availableOnly || listing.availableRooms > 0;
    const matchesVerified = !filters.verifiedOnly || listing.verified;

    return (
      matchesQuery &&
      matchesType &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesAmenities &&
      matchesAvailability &&
      matchesVerified
    );
  });
}

export function rankListings(
  source: Listing[],
  preferences: SurveyPreferences,
): MatchResult[] {
  return source
    .map((listing, index) => {
      let score = 0;
      const reasons: MatchReason[] = [];

      if (effectivePrice(listing) <= preferences.maxBudget) {
        score += 35;
        reasons.push({ kind: "budget" });
      }

      if (listing.city === preferences.city) {
        score += 30;
        reasons.push({ kind: "location" });
      }

      if (
        preferences.roomType === "all" ||
        listing.type === preferences.roomType
      ) {
        score += 20;
        reasons.push({ kind: "roomType" });
      }

      if (preferences.amenities.length > 0) {
        const matched = preferences.amenities.filter((amenity) =>
          listing.amenities.includes(amenity),
        ).length;
        const amenityScore = Math.round(
          (matched / preferences.amenities.length) * 15,
        );
        score += amenityScore;
        if (matched > 0) {
          reasons.push({
            kind: "amenities",
            matched,
            total: preferences.amenities.length,
          });
        }
      } else {
        score += 15;
      }

      return { listingId: listing.id, score, reasons, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((result) => ({
      listingId: result.listingId,
      score: result.score,
      reasons: result.reasons,
    }));
}

/**
 * The price a renter would actually pay. Filtering, matching, and sorting must
 * use this rather than `listing.price`, otherwise a kos discounted below a
 * renter's budget would be hidden by a filter it genuinely satisfies.
 */
export function effectivePrice(listing: Listing): number {
  return listing.promoPrice ?? listing.price;
}

/**
 * How much is taken off the headline rate, in rupiah.
 */
export function discountDelta(listing: Listing): number {
  return Math.max(0, listing.price - effectivePrice(listing));
}

/**
 * The price after a whole-percent discount, rounded to the nearest thousand
 * rupiah. Owners decide a percentage, not an amount, and no kos is quoted in
 * loose change — a thousand is close enough that the badge still reads back as
 * the percentage that was entered.
 */
export function discountedPrice(price: number, percent: number): number {
  if (percent <= 0) return price;
  return Math.max(0, Math.round((price * (100 - percent)) / 100 / 1000) * 1000);
}

/**
 * A room's rate after the listing's promo is applied. The promo is a
 * percentage, so the same percentage comes off every room: taking a fixed
 * rupiah amount off instead would quietly give the pricier rooms a smaller
 * discount than the badge promises.
 */
export function roomEffectivePrice(listing: Listing, roomPrice: number): number {
  const promo = effectivePrice(listing);
  if (listing.price <= 0 || promo >= listing.price) return roomPrice;

  // The ratio rather than the rounded percentage, so the headline room's rate
  // lands exactly on the advertised promo price instead of a thousand off it.
  const rate = (roomPrice * promo) / listing.price;
  return Math.max(0, Math.round(rate / 1000) * 1000);
}

/** Whole-percent discount, or null when the kos is not discounted. */
export function discountPercent(listing: Listing): number | null {
  if (listing.promoPrice === null || listing.promoPrice >= listing.price) {
    return null;
  }
  return Math.round(
    ((listing.price - listing.promoPrice) / listing.price) * 100,
  );
}

export function formatPrice(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}
