import {
  BadgeCheck,
  Check,
  ChevronRight,
  Heart,
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { amenityLabels, copy, shortTypeLabels } from "@/features/home/copy";
import { formatPrice } from "@/features/home/home-utils";
import type {
  Listing,
  Locale,
  MatchReason,
  MatchResult,
} from "@/features/home/types";

function PropertyPlaceholder({ listing }: { listing: Listing }) {
  return (
    <div
      className={`relative h-48 overflow-hidden bg-gradient-to-br ${listing.tone}`}
      aria-hidden="true"
    >
      <div className="absolute -right-8 -top-10 size-36 rounded-full bg-white/10" />
      <div className="absolute -bottom-16 -left-10 size-44 rounded-full bg-cyan-100/15" />
      <div className="absolute bottom-0 left-8 right-8 h-32 rounded-t-[2rem] border border-white/25 bg-white/15 shadow-2xl backdrop-blur-sm">
        <div className="absolute left-1/2 top-[-25px] size-16 -translate-x-1/2 rotate-45 rounded-xl bg-white/20" />
        <div className="absolute inset-x-5 top-7 grid grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((window) => (
            <span
              className={`h-7 rounded-md ${
                window === 1 || window === 5
                  ? listing.accent
                  : "bg-white/35"
              }`}
              key={window}
            />
          ))}
        </div>
      </div>
      <div className="absolute left-4 top-4 rounded-full border border-white/25 bg-slate-950/25 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
        {listing.city}
      </div>
    </div>
  );
}

function reasonText(
  reason: MatchReason,
  locale: Locale,
  t: (typeof copy)[Locale],
) {
  if (reason.kind === "budget") return t.matchBudget;
  if (reason.kind === "location") return t.matchLocation;
  if (reason.kind === "roomType") return t.matchRoomType;
  return `${reason.matched}/${reason.total} ${t.matchAmenities}`;
}

export function ListingCard({
  listing,
  locale,
  favorite,
  onFavorite,
  detailHref,
  match,
  animationIndex,
}: {
  listing: Listing;
  locale: Locale;
  favorite: boolean;
  onFavorite: () => void;
  detailHref: string;
  match?: MatchResult;
  animationIndex: number;
}) {
  const t = copy[locale];

  return (
    <article
      className="listing-card result-card-enter group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_16px_50px_-32px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_65px_-30px_rgba(37,99,235,0.35)]"
      style={
        {
          "--card-delay": `${Math.min(animationIndex, 5) * 45}ms`,
        } as CSSProperties
      }
    >
      <div className="relative shrink-0">
        <PropertyPlaceholder listing={listing} />
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
        {match ? (
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-blue-950 px-3 py-1.5 text-xs font-black text-white shadow-lg">
            <Sparkles size={13} aria-hidden="true" />
            {match.score}% {t.match}
          </span>
        ) : null}
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
          {match && match.reasons.length > 0 ? (
            <ul className="mt-4 space-y-1.5 border-t border-dashed border-blue-200 pt-4">
              {match.reasons.slice(0, 3).map((reason) => (
                <li
                  className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-200"
                  key={reason.kind}
                >
                  <Check size={14} aria-hidden="true" />
                  {reasonText(reason, locale, t)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <p className="text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50">
              {formatPrice(listing.price, locale)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {listing.availableRooms} {t.roomsLeft} · {t.perMonth}
            </p>
          </div>
          <Link
            className="detail-button inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200"
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
