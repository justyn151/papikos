import type { Metadata } from "next";

import { AdminOverviewPage } from "@/features/admin/admin-overview-page";

export const metadata: Metadata = {
  title: "Ringkasan admin — Papikos",
  description: "Angka dasar marketplace dari data prototipe.",
};

export default function Route() {
  return <AdminOverviewPage />;
}
