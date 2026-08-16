"use client";

import { Ban, ChevronRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
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
  const { listings } = useResolvedListings();

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
                            {moderation.published ? t.live : t.hidden}
                          </ListingStatusBadge>
                        )
                      }
                      primaryAction={
                        <Link
                          className={consoleCtaClass}
                          href={`/kos/${listing.id}`}
                        >
                          {a.viewListing}
                          <ChevronRight
                            className="cta-arrow"
                            size={15}
                            aria-hidden="true"
                          />
                        </Link>
                      }
                      actions={
                        <>
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
