import type { Metadata } from "next";

import { AdminReportsPage } from "@/features/admin/admin-reports-page";

export const metadata: Metadata = {
  title: "Laporan kos — Papikos",
  description: "Tinjau laporan dari penyewa.",
};

export default function Route() {
  return <AdminReportsPage />;
}
