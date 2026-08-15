import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getListingDetail,
  listingDetails,
} from "@/features/listings/mock-listings";
import { OwnerEditPage } from "@/features/owner/owner-edit-page";

type EditRouteProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Ubah kos — Papikos",
  description: "Ubah detail kos, kamar, fasilitas, peraturan, dan biaya.",
};

export function generateStaticParams() {
  return listingDetails.map((listing) => ({ id: listing.id }));
}

export default async function OwnerEditRoute({ params }: EditRouteProps) {
  const { id } = await params;
  const listing = getListingDetail(id);
  if (!listing) notFound();

  return <OwnerEditPage listing={listing} />;
}
