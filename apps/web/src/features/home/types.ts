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
  minPrice: number | null;
  maxPrice: number | null;
  amenities: Amenity[];
  availableOnly: boolean;
  verifiedOnly: boolean;
}

