import type { Metadata } from "next";

import { OwnerRequestsPage } from "@/features/owner/owner-requests-page";

export const metadata: Metadata = {
  title: "Permintaan sewa — Papikos",
  description: "Setujui atau tolak permintaan sewa dari penyewa.",
};

export default function Route() {
  return <OwnerRequestsPage />;
}
