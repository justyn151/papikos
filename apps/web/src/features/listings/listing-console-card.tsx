import { BadgeCheck, MapPin } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { amenityLabels, copy, shortTypeLabels } from "@/features/home/copy";
import {
  discountPercent,
  effectivePrice,
  formatPrice,
} from "@/features/home/home-utils";
import type { Listing, Locale } from "@/features/home/types";

import { ListingArtwork } from "./listing-artwork";

/**
 * Status of a kos as the console sees it. Solid fills rather than the tinted
 * chips used in the page body: this badge sits on the artwork, whose colour
 * differs per listing.
 */
export function ListingStatusBadge({
  tone,
  children,
}: {
  tone: "live" | "hidden" | "suspended";
  children: ReactNode;
}) {
  const fill = {
    live: "bg-emerald-600",
    hidden: "bg-slate-900/85",
    suspended: "bg-rose-600",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black text-white shadow-lg ${fill}`}
    >
      {children}
    </span>
  );
}

/**
 * The console's main call to action, styled as the renter card's detail button
 * so the primary action sits in the same place on every card.
 */
export const consoleCtaClass =
  "detail-button inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200";

/**
 * The console counterpart of `listing-card.tsx`: the same artwork, name, and
 * price hierarchy a renter sees, with the favorite and detail controls replaced
 * by whatever the owner or administrator may do with the kos. Owners recognise
 * their listings by how they look on the homepage, so the two should not drift.
 */
export function ListingConsoleCard({
  listing,
  locale,
  status,
  meta,
  note,
  primaryAction,
  actions,
  animationIndex,
}: {
  listing: Listing;
  locale: Locale;
  status: ReactNode;
  /** Replaces the default availability line under the price. */
  meta?: ReactNode;
  note?: ReactNode;
  primaryAction: ReactNode;
  actions?: ReactNode;
  animationIndex: number;
}) {
  const t = copy[locale];
  const discount = discountPercent(listing);

  return (
    <article
      className="result-card-enter @container flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_16px_50px_-32px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900"
      style={
        {
          "--card-delay": `${Math.min(animationIndex, 5) * 45}ms`,
        } as CSSProperties
      }
    >
      <div className="relative shrink-0">
        <ListingArtwork listing={listing} />
        <div className="absolute right-4 top-4">{status}</div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300">
              {shortTypeLabels[locale][listing.type]}
            </span>
            {listing.verified ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                <BadgeCheck size={14} aria-hidden="true" />
                {t.verified}
              </span>
            ) : null}
          </div>
          <h2 className="text-lg font-black tracking-[-0.025em] text-slate-950 dark:text-slate-50">
            {listing.name}
          </h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <MapPin size={15} aria-hidden="true" />
            {listing.district}, {listing.city}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {listing.amenities.slice(0, 3).map((amenity) => (
              <span
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                key={amenity}
              >
                {amenityLabels[locale][amenity]}
              </span>
            ))}
          </div>
          {note}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          {/* Same rule as the renter card: below 20rem the price and the
              primary action stop sharing a row. */}
          <div className="flex flex-col gap-3 @[20rem]:flex-row @[20rem]:items-end @[20rem]:justify-between">
            <div>
              {discount ? (
                <p className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400 line-through dark:text-slate-500">
                    {formatPrice(listing.price, locale)}
                  </span>
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[0.7rem] font-black text-white">
                    -{discount}%
                  </span>
                </p>
              ) : null}
              <p className="text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50">
                {formatPrice(effectivePrice(listing), locale)}
              </p>
              {meta ?? (
                // No "per month" here: the console column is narrower than the
                // renter grid, and the price period is not what an
                // administrator is scanning for.
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {listing.availableRooms} {t.roomsLeft}
                </p>
              )}
            </div>
            {primaryAction}
          </div>
          {actions ? (
            <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
