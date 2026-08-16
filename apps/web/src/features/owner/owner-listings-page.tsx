"use client";

import { Ban, Eye, EyeOff, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { accountCopy } from "@/features/account/account-copy";
import { effectivePrice, formatPrice } from "@/features/home/home-utils";
import { ListingThumbnail } from "@/features/listings/listing-thumbnail";
import { ConsoleShell } from "@/features/navigation/console-shell";
import { useResolvedListings } from "@/features/prototype-data/use-resolved-listings";
import { useAuditLog, useModeration } from "@/features/prototype-data/store";
import { setPublication } from "@/features/prototype-data/transitions";

import { ownerCopy } from "./owner-copy";
import { ownerNavItems } from "./owner-nav";

export function OwnerListingsPage() {
  const { moderationFor, replace } = useModeration();
  const { append } = useAuditLog();
  const [toast, setToast] = useState("");
  const { listings } = useResolvedListings();

  return (
    <ConsoleShell
      activeId="listings"
      areaLabel={(locale) => ownerCopy[locale].area}
      items={(locale) => ownerNavItems(locale)}
      toast={toast}
    >
      {(locale) => {
        const t = ownerCopy[locale];
        const a = accountCopy[locale];

        const togglePublished = (listingId: string, next: boolean) => {
          const result = setPublication(
            moderationFor(listingId),
            next,
            "owner",
          );
          replace(result.record);
          append(result.audit);
          setToast(next ? t.publishedToast : t.unpublishedToast);
          window.setTimeout(() => setToast(""), 2600);
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
                    className="flex flex-wrap items-start justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                    key={listing.id}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <ListingThumbnail listing={listing} />
                      <div className="min-w-0">
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
                              {moderation.published
                                ? t.published
                                : t.unpublished}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                          <MapPin size={14} aria-hidden="true" />
                          {listing.district}, {listing.city}
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                          {formatPrice(effectivePrice(listing), locale)}
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            {" · "}
                            {listing.availableRooms > 0
                              ? `${listing.availableRooms} ${t.roomsAvailable}`
                              : t.fullyBooked}
                          </span>
                        </p>
                        {moderation.suspended ? (
                          <p className="mt-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                            {t.suspendedHint}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        className="btn-secondary"
                        href={`/pemilik/kos/${listing.id}`}
                      >
                        {t.edit}
                      </Link>
                      <Link className="btn-secondary" href={`/kos/${listing.id}`}>
                        {a.viewListing}
                      </Link>
                      <button
                        className="btn-secondary gap-2"
                        disabled={moderation.suspended}
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
