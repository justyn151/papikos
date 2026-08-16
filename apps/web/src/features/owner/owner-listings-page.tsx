"use client";

import { Ban, ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { accountCopy } from "@/features/account/account-copy";
import {
  ListingConsoleCard,
  ListingStatusBadge,
  consoleCtaClass,
} from "@/features/listings/listing-console-card";
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

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing, index) => {
                const moderation = moderationFor(listing.id);
                return (
                  <li key={listing.id}>
                    <ListingConsoleCard
                      animationIndex={index}
                      listing={listing}
                      locale={locale}
                      status={
                        moderation.suspended ? (
                          <ListingStatusBadge tone="suspended">
                            <Ban size={12} aria-hidden="true" />
                            {t.suspended}
                          </ListingStatusBadge>
                        ) : (
                          <ListingStatusBadge
                            tone={moderation.published ? "live" : "hidden"}
                          >
                            {moderation.published ? t.published : t.unpublished}
                          </ListingStatusBadge>
                        )
                      }
                      meta={
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {listing.availableRooms > 0
                            ? `${listing.availableRooms} ${t.roomsAvailable}`
                            : t.fullyBooked}
                        </p>
                      }
                      note={
                        moderation.suspended ? (
                          <p className="mt-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
                            {t.suspendedHint}
                          </p>
                        ) : null
                      }
                      primaryAction={
                        <Link
                          className={consoleCtaClass}
                          href={`/pemilik/kos/${listing.id}`}
                        >
                          {t.edit}
                          <ChevronRight
                            className="cta-arrow"
                            size={15}
                            aria-hidden="true"
                          />
                        </Link>
                      }
                      actions={
                        <>
                          <Link
                            className="btn-secondary"
                            href={`/kos/${listing.id}`}
                          >
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
                        </>
                      }
                    />
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
