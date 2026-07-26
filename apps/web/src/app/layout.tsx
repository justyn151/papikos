import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Papikos — Temukan kos yang pas dengan hidupmu",
  description:
    "Prototype pencarian kos bilingual dengan filter transparan dan rekomendasi berbasis preferensi.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
