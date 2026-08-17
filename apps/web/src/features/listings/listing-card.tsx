import { BadgeCheck, ChevronRight, Heart, MapPin } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { amenityLabels, copy, shortTypeLabels } from "@/features/home/copy";
import {
  discountPercent,
  effectivePrice,
  formatPrice,
} from "@/features/home/home-utils";
import type { Listing, Locale } from "@/features/home/types";

import { ListingArtwork } from "./listing-artwork";

export function ListingCard({
  listing,
  locale,
  favorite,
  onFavorite,
  detailHref,
  animationIndex,
}: {
  listing: Listing;
  locale: Locale;
  favorite: boolean;
  onFavorite: () => void;
  detailHref: string;
  animationIndex: number;
}) {
  const t = copy[locale];
  const discount = discountPercent(listing);

  return (
    <article
      className="listing-card result-card-enter group @container flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_16px_50px_-32px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_65px_-30px_rgba(37,99,235,0.35)]"
      style={
        {
          "--card-delay": `${Math.min(animationIndex, 5) * 45}ms`,
        } as CSSProperties
      }
    >
      <div className="relative shrink-0">
        <ListingArtwork listing={listing} />
        <button
          className="favorite-button absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-lg transition hover:scale-105 hover:text-rose-500 focus:outline-none focus:ring-4 focus:ring-blue-200"
          onClick={onFavorite}
          type="button"
          aria-label={favorite ? t.favoriteRemove : t.favoriteAdd}
          aria-pressed={favorite}
        >
          <Heart
            size={19}
            className={`favorite-heart ${
              favorite ? "is-favorite fill-rose-500 text-rose-500" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-blue-50 dark:bg-blue-950/35 px-2.5 py-1 text-blue-700 dark:text-blue-300">
              {shortTypeLabels[locale][listing.type]}
            </span>
            {listing.verified ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                <BadgeCheck size={14} aria-hidden="true" />
                {t.verified}
              </span>
            ) : null}
          </div>
          <h3 className="text-lg font-black tracking-[-0.025em] text-slate-950 dark:text-slate-50">
            {listing.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <MapPin size={15} aria-hidden="true" />
            {listing.district}, {listing.city}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {listing.amenities.slice(0, 3).map((amenity) => (
              <span
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300"
                key={amenity}
              >
                {amenityLabels[locale][amenity]}
              </span>
            ))}
          </div>
        </div>
        {/* The card decides this from its own width, not the viewport's: the
            same card sits in a three-column search grid, a two-column
            favorites list, and the homepage. Below 20rem the price and the
            button stop sharing a row instead of squeezing each other. */}
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 @[20rem]:flex-row @[20rem]:items-end @[20rem]:justify-between">
          <div>
            {discount ? (
              // Beside the price it applies to rather than stacked under the
              // favorite button, where it read as a second control.
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {listing.availableRooms} {t.roomsLeft} · {t.perMonth}
            </p>
          </div>
          <Link
            className="detail-button inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200"
            href={detailHref}
            // The href carries the live filter state, so leaving prefetch on
            // re-requests every card's RSC payload each time a filter changes.
            prefetch={false}
          >
            {t.viewDetail}
            <ChevronRight
              className="cta-arrow"
              size={15}
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
