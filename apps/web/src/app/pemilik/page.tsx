import type { Metadata } from "next";

import { OwnerDashboardPage } from "@/features/owner/owner-dashboard-page";

export const metadata: Metadata = {
  title: "Dasbor pemilik — Papikos",
  description: "Ringkasan permintaan sewa, pertanyaan, dan kos yang tayang.",
};

export default function Route() {
  return <OwnerDashboardPage />;
}
