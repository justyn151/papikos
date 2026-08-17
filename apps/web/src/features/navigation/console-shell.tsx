"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { Locale } from "@/features/listings/types";

import { AppShell } from "./app-shell";

export interface ConsoleNavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

function Badge({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-xs font-black tabular-nums ${
        active
          ? "bg-white/25 text-white"
          : "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
      }`}
    >
      {count}
    </span>
  );
}

/**
 * Shared chrome for the owner and admin consoles: a sidebar from `lg` up and a
 * fixed bottom bar below it. Replaces the horizontal chip rows these consoles
 * used to navigate with, which were visually identical to the search page's
 * filter chips and so read as filtering rather than navigation.
 */
export function ConsoleShell({
  activeId,
  areaLabel,
  children,
  items,
  toast,
}: {
  activeId: string;
  /** Labels the console area and the nav landmark; locale-aware. */
  areaLabel: (locale: Locale) => string;
  children: (locale: Locale) => ReactNode;
  items: (locale: Locale) => ConsoleNavItem[];
  toast?: string;
}) {
  return (
    <AppShell toast={toast}>
      {(locale) => {
        const navItems = items(locale);
        const label = areaLabel(locale);

        return (
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <nav
            aria-label={label}
            className="hidden lg:block"
          >
            <p className="px-3 text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
              {label}
            </p>
            <ul className="mt-4 grid gap-1">
              {navItems.map((item) => {
                const active = item.id === activeId;
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                      href={item.href}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <Badge active={active} count={item.badge} />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom padding keeps the fixed bar off the last row on mobile.
              min-w-0 lets a scrolling child (the editor's section tabs) shrink
              instead of stretching this grid column past the viewport. */}
          <div className="min-w-0 pb-24 lg:pb-0">{children(locale)}</div>

          <nav
            aria-label={label}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/95 lg:hidden"
          >
            <ul
              className="mx-auto flex max-w-3xl items-stretch"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {navItems.map((item) => {
                const active = item.id === activeId;
                const Icon = item.icon;
                return (
                  <li className="flex-1" key={item.id}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`relative flex flex-col items-center gap-1 px-1 py-2.5 text-[0.7rem] font-bold transition ${
                        active
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                      href={item.href}
                    >
                      <span className="relative">
                        <Icon size={20} aria-hidden="true" />
                        {item.badge ? (
                          <span className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[0.6rem] font-black text-white">
                            {item.badge}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-center leading-tight">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        );
      }}
    </AppShell>
  );
}
