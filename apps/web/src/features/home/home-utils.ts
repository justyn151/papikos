import type {
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
  maxPrice: null,
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
  const rawMax = Array.isArray(params.max) ? params.max[0] : params.max;
  const parsedMax = rawMax ? Number(rawMax) : null;

  return {
    query: rawQuery?.trim() ?? "",
    type: validTypes.includes(rawType as ListingTypeFilter)
      ? (rawType as ListingTypeFilter)
      : "all",
    maxPrice:
      parsedMax && Number.isFinite(parsedMax) && parsedMax > 0
        ? parsedMax
        : null,
  };
}

export function serializeFilters(filters: SearchFilters): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.maxPrice) params.set("max", String(filters.maxPrice));
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
    const matchesPrice =
      filters.maxPrice === null || listing.price <= filters.maxPrice;

    return matchesQuery && matchesType && matchesPrice;
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

      if (listing.price <= preferences.maxBudget) {
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
