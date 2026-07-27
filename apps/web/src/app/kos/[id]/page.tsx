import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getListingDetail,
  getRelatedListings,
  listingDetails,
} from "@/features/listings/mock-listings";
import { ListingDetailPage } from "@/features/listings/listing-detail-page";

type DetailRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

function safeReturnPath(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function generateStaticParams() {
  return listingDetails.map((listing) => ({ id: listing.id }));
}

export async function generateMetadata({
  params,
}: DetailRouteProps): Promise<Metadata> {
  const { id } = await params;
  const listing = getListingDetail(id);
  if (!listing) return {};

  return {
    title: `${listing.name} — Papikos`,
    description: `${listing.description.id} Mulai ${listing.price.toLocaleString(
      "id-ID",
    )} per bulan.`,
  };
}

export default async function DetailRoute({
  params,
  searchParams,
}: DetailRouteProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const listing = getListingDetail(id);
  if (!listing) notFound();

  return (
    <ListingDetailPage
      listing={listing}
      related={getRelatedListings(listing)}
      returnTo={safeReturnPath(query.from)}
    />
  );
}
