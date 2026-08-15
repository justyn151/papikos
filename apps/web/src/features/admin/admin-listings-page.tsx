"use client";

import { Ban, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { accountCopy } from "@/features/account/account-copy";
import { effectivePrice, formatPrice } from "@/features/home/home-utils";
import { listings } from "@/features/listings/mock-listings";
import { ConsoleShell } from "@/features/navigation/console-shell";
import { useAuditLog, useModeration } from "@/features/prototype-data/store";
import {
  setPublication,
  setSuspension,
} from "@/features/prototype-data/transitions";

import { adminCopy } from "./admin-copy";
import { adminNavItems } from "./admin-nav";

export function AdminListingsPage() {
  const { moderationFor, replace } = useModeration();
  const { append } = useAuditLog();
  const [toast, setToast] = useState("");

  return (
    <ConsoleShell
      activeId="listings"
      areaLabel={(locale) => adminCopy[locale].area}
      items={(locale) => adminNavItems(locale)}
      toast={toast}
    >
      {(locale) => {
        const t = adminCopy[locale];
        const a = accountCopy[locale];

        const announce = (message: string) => {
          setToast(message);
          window.setTimeout(() => setToast(""), 2600);
        };

        const togglePublished = (listingId: string, next: boolean) => {
          const result = setPublication(
            moderationFor(listingId),
            next,
            "admin",
          );
          replace(result.record);
          append(result.audit);
          announce(next ? t.publish : t.unpublish);
        };

        const toggleSuspended = (listingId: string, next: boolean) => {
          const result = setSuspension(moderationFor(listingId), next);
          replace(result.record);
          append(result.audit);
          announce(next ? t.suspendToast : t.unsuspendToast);
        };

        return (
          <>
            <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {t.listingsTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t.listingsBody}
            </p>


            <ul className="mt-8 grid gap-3">
              {listings.map((listing) => {
                const moderation = moderationFor(listing.id);
                return (
                  <li
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                    key={listing.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                          {listing.name}
                        </h2>
                        {moderation.suspended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                            <Ban size={12} aria-hidden="true" />
                            {t.suspended}
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-black ${
                              moderation.published
                                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {moderation.published ? t.live : t.hidden}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {listing.district}, {listing.city} ·{" "}
                        {formatPrice(effectivePrice(listing), locale)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link className="btn-secondary" href={`/kos/${listing.id}`}>
                        {a.viewListing}
                      </Link>
                      <button
                        className="btn-secondary gap-2"
                        onClick={() =>
                          togglePublished(listing.id, !moderation.published)
                        }
                        type="button"
                      >
                        {moderation.published ? (
                          <EyeOff size={16} aria-hidden="true" />
                        ) : (
                          <Eye size={16} aria-hidden="true" />
                        )}
                        {moderation.published ? t.unpublish : t.publish}
                      </button>
                      <button
                        className="btn-secondary gap-2"
                        onClick={() =>
                          toggleSuspended(listing.id, !moderation.suspended)
                        }
                        type="button"
                      >
                        {moderation.suspended ? (
                          <ShieldCheck size={16} aria-hidden="true" />
                        ) : (
                          <Ban size={16} aria-hidden="true" />
                        )}
                        {moderation.suspended ? t.unsuspend : t.suspend}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        );
      }}
    </ConsoleShell>
  );
}
