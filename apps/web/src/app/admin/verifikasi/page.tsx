import type { Metadata } from "next";

import { AdminVerificationPage } from "@/features/admin/admin-verification-page";

export const metadata: Metadata = {
  title: "Verifikasi kos — Papikos",
  description: "Tandai kos yang sudah diperiksa.",
};

export default function Route() {
  return <AdminVerificationPage />;
}
