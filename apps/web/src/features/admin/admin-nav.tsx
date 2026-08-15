"use client";

import {
  BadgeCheck,
  Building2,
  ChartNoAxesColumn,
  Flag,
  ScrollText,
} from "lucide-react";

import type { Locale } from "@/features/listings/types";
import type { ConsoleNavItem } from "@/features/navigation/console-shell";

import { adminCopy } from "./admin-copy";

export type AdminTab =
  | "overview"
  | "verification"
  | "reports"
  | "listings"
  | "audit";

export function adminNavItems(
  locale: Locale,
  badges: Partial<Record<AdminTab, number>> = {},
): ConsoleNavItem[] {
  const t = adminCopy[locale];
  return [
    {
      id: "overview",
      href: "/admin",
      label: t.overview,
      icon: ChartNoAxesColumn,
      badge: badges.overview,
    },
    {
      id: "verification",
      href: "/admin/verifikasi",
      label: t.verification,
      icon: BadgeCheck,
      badge: badges.verification,
    },
    {
      id: "reports",
      href: "/admin/laporan",
      label: t.reports,
      icon: Flag,
      badge: badges.reports,
    },
    {
      id: "listings",
      href: "/admin/kos",
      label: t.listings,
      icon: Building2,
      badge: badges.listings,
    },
    {
      id: "audit",
      href: "/admin/audit",
      label: t.audit,
      icon: ScrollText,
      badge: badges.audit,
    },
  ];
}
