"use client";

import Link from "next/link";

import type { Locale } from "@/features/listings/types";

import { adminCopy } from "./admin-copy";

export type AdminTab =
  | "overview"
  | "verification"
  | "reports"
  | "listings"
  | "audit";

const tabs: { id: AdminTab; href: string }[] = [
  { id: "overview", href: "/admin" },
  { id: "verification", href: "/admin/verifikasi" },
  { id: "reports", href: "/admin/laporan" },
  { id: "listings", href: "/admin/kos" },
  { id: "audit", href: "/admin/audit" },
];

export function AdminNav({
  active,
  locale,
  badges = {},
}: {
  active: AdminTab;
  locale: Locale;
  badges?: Partial<Record<AdminTab, number>>;
}) {
  const t = adminCopy[locale];

  return (
    <nav aria-label={t.area} className="mt-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const count = badges[tab.id] ?? 0;
        const current = tab.id === active;
        return (
          <Link
            aria-current={current ? "page" : undefined}
            className={`filter-chip inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
              current
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
            href={tab.href}
            key={tab.id}
          >
            {t[tab.id]}
            {count > 0 ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-black ${
                  current
                    ? "bg-white/25 text-white"
                    : "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                }`}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
