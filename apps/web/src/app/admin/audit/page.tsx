import type { Metadata } from "next";

import { AdminAuditPage } from "@/features/admin/admin-audit-page";

export const metadata: Metadata = {
  title: "Jejak audit — Papikos",
  description: "Riwayat perubahan istimewa beserta pelakunya.",
};

export default function Route() {
  return <AdminAuditPage />;
}
