import type { Metadata } from "next";

import { RequestsPage } from "@/features/account/requests-page";

export const metadata: Metadata = {
  title: "Permintaan sewa — Papikos",
  description: "Status permintaan sewa yang kamu ajukan ke pemilik kos.",
};

export default function RequestsRoute() {
  return <RequestsPage />;
}
