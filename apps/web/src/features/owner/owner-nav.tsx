"use client";

import Link from "next/link";

import type { Locale } from "@/features/listings/types";

import { ownerCopy } from "./owner-copy";

export type OwnerTab = "dashboard" | "listings" | "requests" | "questions";

const tabs: { id: OwnerTab; href: string }[] = [
  { id: "dashboard", href: "/pemilik" },
  { id: "listings", href: "/pemilik/kos" },
  { id: "requests", href: "/pemilik/permintaan" },
  { id: "questions", href: "/pemilik/tanya-jawab" },
];

export function OwnerNav({
  active,
  locale,
  badges = {},
}: {
  active: OwnerTab;
  locale: Locale;
  badges?: Partial<Record<OwnerTab, number>>;
}) {
  const t = ownerCopy[locale];

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
