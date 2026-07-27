import type {
  Amenity,
  ListingTypeFilter,
} from "@/features/listings/types";

export type {
  Amenity,
  Listing,
  ListingType,
  ListingTypeFilter,
  Locale,
} from "@/features/listings/types";

export interface SearchFilters {
  query: string;
  type: ListingTypeFilter;
  maxPrice: number | null;
}

export interface SurveyPreferences {
  city: string;
  maxBudget: number;
  roomType: ListingTypeFilter;
  amenities: Amenity[];
}

export type MatchReasonKind =
  | "budget"
  | "location"
  | "roomType"
  | "amenities";

export interface MatchReason {
  kind: MatchReasonKind;
  matched?: number;
  total?: number;
}

export interface MatchResult {
  listingId: string;
  score: number;
  reasons: MatchReason[];
}
