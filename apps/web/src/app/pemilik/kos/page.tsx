import type { Metadata } from "next";

import { OwnerListingsPage } from "@/features/owner/owner-listings-page";

export const metadata: Metadata = {
  title: "Kos saya — Papikos",
  description: "Atur kos mana yang tayang untuk pencari kos.",
};

export default function Route() {
  return <OwnerListingsPage />;
}
