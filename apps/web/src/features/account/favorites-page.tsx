"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { copy } from "@/features/home/copy";
import { ListingCard } from "@/features/listings/listing-card";
import { AppShell } from "@/features/navigation/app-shell";
import { useResolvedListings } from "@/features/prototype-data/use-resolved-listings";
import { FAVORITES_STORAGE_KEY } from "@/features/shared/storage-keys";
import { usePersistentState } from "@/features/shared/use-persistent-state";

import { accountCopy } from "./account-copy";

export function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>(
    FAVORITES_STORAGE_KEY,
    [],
  );
  const [toast, setToast] = useState("");
  const { listings } = useResolvedListings();

  // Preserve the order listings are defined in, not the order they were saved.
  const saved = useMemo(
    () => listings.filter((listing) => favoriteIds.includes(listing.id)),
    [favoriteIds, listings],
  );

  return (
    <AppShell toast={toast}>
      {(locale) => {
        const t = copy[locale];
        const a = accountCopy[locale];

        const remove = (listingId: string) => {
          setFavoriteIds((current) => current.filter((id) => id !== listingId));
          setToast(t.removed);
          window.setTimeout(() => setToast(""), 2600);
        };

        return (
          <>
            <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {a.favoritesTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {a.favoritesBody}
            </p>
            <p
              className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400"
              aria-live="polite"
            >
              {saved.length} {a.savedCount}
            </p>

            {saved.length > 0 ? (
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {saved.map((listing, index) => (
                  <ListingCard
                    animationIndex={index}
                    detailHref={`/kos/${listing.id}`}
                    favorite
                    key={listing.id}
                    listing={listing}
                    locale={locale}
                    onFavorite={() => remove(listing.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-[2rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-16 text-center dark:bg-blue-950/35">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-rose-500 shadow-sm dark:bg-slate-900">
                  <Heart size={24} aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-slate-50">
                  {a.favoritesEmptyTitle}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {a.favoritesEmptyBody}
                </p>
                <Link className="btn-primary mt-5" href="/kos">
                  {a.favoritesEmptyCta}
                </Link>
              </div>
            )}
          </>
        );
      }}
    </AppShell>
  );
}
