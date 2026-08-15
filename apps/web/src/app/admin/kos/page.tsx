import type { Metadata } from "next";

import { AdminListingsPage } from "@/features/admin/admin-listings-page";

export const metadata: Metadata = {
  title: "Kelola kos — Papikos",
  description: "Tayangkan atau tangguhkan kos.",
};

export default function Route() {
  return <AdminListingsPage />;
}
