"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import type { Locale, PrototypeRole } from "@/features/listings/types";
import { prototypeRoles, usePrototypeRole } from "@/features/prototype-data/role";

const roleCopy: Record<Locale, Record<PrototypeRole, string>> = {
  id: { renter: "Pencari kos", owner: "Pemilik kos", admin: "Admin" },
  en: { renter: "Renter", owner: "Owner", admin: "Admin" },
};

const roleHome: Record<PrototypeRole, string> = {
  renter: "/kos",
  owner: "/pemilik",
  admin: "/admin",
};

const barCopy: Record<Locale, { notice: string; label: string; open: string }> = {
  id: {
    notice: "Tampilan prototipe — belum ada autentikasi, semua halaman terbuka.",
    label: "Lihat sebagai",
    open: "Buka dasbor",
  },
  en: {
    notice: "Prototype view — no authentication yet, every page is open.",
    label: "View as",
    open: "Open dashboard",
  },
};

/**
 * Role preview for the prototype. This is emphatically not authorization:
 * AGENTS.md requires the API to enforce roles, and hiding client controls is
 * explicitly called out as insufficient. The banner keeps that honest.
 */
export function PrototypeRoleBar({ locale }: { locale: Locale }) {
  const { role, setRole } = usePrototypeRole();
  const t = barCopy[locale];

  return (
    <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
          <TriangleAlert size={14} className="shrink-0" aria-hidden="true" />
          {t.notice}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-[0.06em] text-amber-800/80 dark:text-amber-300/80">
            {t.label}
          </span>
          <div
            aria-label={t.label}
            className="flex items-center gap-1 rounded-full border border-amber-300 bg-white p-0.5 dark:border-amber-900 dark:bg-slate-900"
            role="group"
          >
            {prototypeRoles.map((item) => (
              <button
                aria-pressed={role === item}
                className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                  role === item
                    ? "bg-amber-500 text-white"
                    : "text-amber-900 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-950"
                }`}
                key={item}
                onClick={() => setRole(item)}
                type="button"
              >
                {roleCopy[locale][item]}
              </button>
            ))}
          </div>
          <Link
            className="rounded-full border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-900 transition hover:bg-amber-100 dark:border-amber-900 dark:text-amber-200 dark:hover:bg-amber-950"
            href={roleHome[role]}
          >
            {t.open}
          </Link>
        </div>
      </div>
    </div>
  );
}
