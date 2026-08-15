"use client";

import { Building2, CircleHelp, Inbox, LayoutDashboard } from "lucide-react";

import type { Locale } from "@/features/listings/types";
import type { ConsoleNavItem } from "@/features/navigation/console-shell";

import { ownerCopy } from "./owner-copy";

export type OwnerTab = "dashboard" | "listings" | "requests" | "questions";

export function ownerNavItems(
  locale: Locale,
  badges: Partial<Record<OwnerTab, number>> = {},
): ConsoleNavItem[] {
  const t = ownerCopy[locale];
  return [
    {
      id: "dashboard",
      href: "/pemilik",
      label: t.dashboard,
      icon: LayoutDashboard,
      badge: badges.dashboard,
    },
    {
      id: "listings",
      href: "/pemilik/kos",
      label: t.listings,
      icon: Building2,
      badge: badges.listings,
    },
    {
      id: "requests",
      href: "/pemilik/permintaan",
      label: t.requests,
      icon: Inbox,
      badge: badges.requests,
    },
    {
      id: "questions",
      href: "/pemilik/tanya-jawab",
      label: t.questions,
      icon: CircleHelp,
      badge: badges.questions,
    },
  ];
}
