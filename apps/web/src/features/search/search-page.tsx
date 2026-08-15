"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { copy } from "@/features/home/copy";
import {
  defaultFilters,
  filterListings,
  serializeFilters,
} from "@/features/home/home-utils";
import type { SearchFilters } from "@/features/home/types";
import { ListingCard } from "@/features/listings/listing-card";
import { PrototypeRoleBar } from "@/features/navigation/prototype-role-bar";
import { SiteHeader } from "@/features/navigation/site-header";
import { useResolvedListings } from "@/features/prototype-data/use-resolved-listings";
import { useModeration } from "@/features/prototype-data/store";
import { isListingVisible } from "@/features/prototype-data/transitions";
import {
  useLocaleTransition,
  useTheme,
} from "@/features/preferences/preferences";
import { Reveal } from "@/features/shared/reveal";
import { FAVORITES_STORAGE_KEY } from "@/features/shared/storage-keys";
import { usePersistentState } from "@/features/shared/use-persistent-state";

import { searchCopy } from "./search-copy";
import { SearchFiltersPanel } from "./search-filters-panel";

const URL_SYNC_DELAY_MS = 180;

export function SearchPage({
  initialFilters,
}: {
  initialFilters: SearchFilters;
}) {
  const { changeLocale, locale, selectedLocale, transitionState } =
    useLocaleTransition();
  const { theme, toggleTheme } = useTheme();
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>(
    FAVORITES_STORAGE_KEY,
    [],
  );
  const { moderationFor } = useModeration();
  const { listings } = useResolvedListings();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [headerQuery, setHeaderQuery] = useState(initialFilters.query);
  const [syncedQuery, setSyncedQuery] = useState(initialFilters.query);
  const [toast, setToast] = useState("");
  const urlSyncTimerRef = useRef<number | null>(null);
  const t = copy[locale];
  const st = searchCopy[locale];

  if (filters.query !== syncedQuery) {
    setSyncedQuery(filters.query);
    setHeaderQuery(filters.query);
  }

  useEffect(() => {
    document.documentElement.dataset.papikosReady = "true";
    return () => {
      delete document.documentElement.dataset.papikosReady;
    };
  }, []);

  useEffect(
    () => () => {
      if (urlSyncTimerRef.current) {
        window.clearTimeout(urlSyncTimerRef.current);
      }
    },
    [],
  );

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  // Dragging a price slider emits an input event per pixel. Writing the URL on
  // each one trips the browser's history-throttling limit and re-triggers a
  // prefetch for every result link, so the address bar is settled separately
  // from the (immediate) filter state.
  const applyFilters = (next: SearchFilters) => {
    setFilters(next);
    if (urlSyncTimerRef.current) {
      window.clearTimeout(urlSyncTimerRef.current);
    }
    urlSyncTimerRef.current = window.setTimeout(() => {
      window.history.replaceState(null, "", `/kos${serializeFilters(next)}`);
      urlSyncTimerRef.current = null;
    }, URL_SYNC_DELAY_MS);
  };

  // Unpublished and admin-suspended listings must not reach renters at all,
  // so visibility is applied before any filtering or facet counting.
  const visibleListings = useMemo(
    () => listings.filter((listing) => isListingVisible(moderationFor(listing.id))),
    [listings, moderationFor],
  );

  const results = useMemo(
    () => filterListings(visibleListings, filters),
    [filters, visibleListings],
  );

  const countFor = useCallback(
    (next: SearchFilters) => filterListings(visibleListings, next).length,
    [visibleListings],
  );

  const toggleFavorite = (listingId: string) => {
    const favorite = favoriteIds.includes(listingId);
    setFavoriteIds((current) =>
      favorite
        ? current.filter((id) => id !== listingId)
        : [...current, listingId],
    );
    announce(favorite ? t.removed : t.saved);
  };

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition focus:translate-y-0"
      >
        {t.skip}
      </a>

      <PrototypeRoleBar locale={locale} />

      <SiteHeader
        locale={locale}
        selectedLocale={selectedLocale}
        onChangeLocale={changeLocale}
        theme={theme}
        onToggleTheme={toggleTheme}
        loginHref="/masuk"
        loginLabel={t.login}
        favoritesHref="/favorit"
        favoritesLabel={t.favorites}
        languageLabel={t.language}
        searchLabel={t.location}
        searchPlaceholder={t.locationPlaceholder}
        searchButtonLabel={t.search}
        searchValue={headerQuery}
        onSearchChange={setHeaderQuery}
        onSearchSubmit={(value) => applyFilters({ ...filters, query: value })}
      />

      <main
        className="locale-content"
        data-locale-transition={transitionState}
        id="main-content"
      >
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
            {st.resultsHeading}
          </h1>
          <p
            className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400"
            aria-live="polite"
          >
            {results.length} {t.results}
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
            <SearchFiltersPanel
              countFor={countFor}
              filters={filters}
              locale={locale}
              onChange={applyFilters}
              onClear={() => applyFilters(defaultFilters)}
            />

            <div>
              {results.length > 0 ? (
                <Reveal>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {results.map((listing, index) => (
                      <ListingCard
                        animationIndex={index}
                        detailHref={`/kos/${listing.id}?from=${encodeURIComponent(
                          `/kos${serializeFilters(filters)}`,
                        )}`}
                        favorite={favoriteIds.includes(listing.id)}
                        key={listing.id}
                        listing={listing}
                        locale={locale}
                        onFavorite={() => toggleFavorite(listing.id)}
                      />
                    ))}
                  </div>
                </Reveal>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-blue-200 bg-blue-50 dark:bg-blue-950/35 px-6 py-16 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm">
                    <Search size={24} aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-slate-50">
                    {t.emptyTitle}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {t.emptyBody}
                  </p>
                  <button
                    className="btn-primary mt-5"
                    onClick={() => applyFilters(defaultFilters)}
                    type="button"
                  >
                    {t.reset}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div
        className={`fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white shadow-2xl transition ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </>
  );
}
