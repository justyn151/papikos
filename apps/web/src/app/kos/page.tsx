import type { Metadata } from "next";

import { normalizeSearchParams } from "@/features/home/home-utils";
import { SearchPage } from "@/features/search/search-page";

type SearchRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Cari kos — Papikos",
  description:
    "Saring kos berdasarkan lokasi, tipe kamar, rentang harga, dan fasilitas.",
};

export default async function SearchRoute({ searchParams }: SearchRouteProps) {
  const params = await searchParams;
  return <SearchPage initialFilters={normalizeSearchParams(params)} />;
}
