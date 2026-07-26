export type Locale = "id" | "en";

export type ListingType = "putra" | "putri" | "campur";

export type ListingTypeFilter = ListingType | "all";

export type Amenity =
  | "wifi"
  | "ac"
  | "privateBathroom"
  | "motorParking"
  | "kitchen"
  | "laundry";

export interface Listing {
  id: string;
  name: string;
  city: string;
  district: string;
  type: ListingType;
  price: number;
  amenities: Amenity[];
  availableRooms: number;
  verified: boolean;
  tone: string;
  accent: string;
}

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
