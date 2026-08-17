import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const themeBootstrapScript = `
  (() => {
    try {
      const stored = JSON.parse(localStorage.getItem("papikos.theme"));
      const theme = stored === "light" || stored === "dark"
        ? stored
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch {
      const theme = matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    }
  })();
`;

export const metadata: Metadata = {
  title: "Papikos — Temukan kos yang pas dengan hidupmu",
  description:
    "Prototype pencarian kos bilingual dengan filter transparan dan rekomendasi berbasis preferensi.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
