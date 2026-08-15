import type { Metadata } from "next";

import { FavoritesPage } from "@/features/account/favorites-page";

export const metadata: Metadata = {
  title: "Kos favorit — Papikos",
  description: "Kos yang kamu simpan untuk dibandingkan nanti.",
};

export default function FavoritesRoute() {
  return <FavoritesPage />;
}
