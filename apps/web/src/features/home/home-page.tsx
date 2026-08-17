"use client";

import { KeyRound, Map as MapIcon, MapPin, Search, UserRoundSearch } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import { copy } from "./copy";
import {
  defaultFilters,
  effectivePrice,
  formatPrice,
  serializeFilters,
} from "./home-utils";
import { cities, listings } from "./mock-listings";
import { ListingCard } from "@/features/listings/listing-card";
import { BrandMark } from "@/features/navigation/brand-mark";
import { PrototypeRoleBar } from "@/features/navigation/prototype-role-bar";
import { SiteHeader } from "@/features/navigation/site-header";
import {
  useLocaleTransition,
  useTheme,
} from "@/features/preferences/preferences";
import { Reveal } from "@/features/shared/reveal";
import { FAVORITES_STORAGE_KEY } from "@/features/shared/storage-keys";
import { usePersistentState } from "@/features/shared/use-persistent-state";

export function HomePage() {
  const { changeLocale, locale, selectedLocale, transitionState } =
    useLocaleTransition();
  const { theme, toggleTheme } = useTheme();
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>(
    FAVORITES_STORAGE_KEY,
    [],
  );
  const [headerQuery, setHeaderQuery] = useState("");
  const [heroQuery, setHeroQuery] = useState("");
  const [headerSearchRevealed, setHeaderSearchRevealed] = useState(false);
  const heroSearchRef = useRef<HTMLFormElement>(null);
  const [toast, setToast] = useState("");
  const resultsRef = useRef<HTMLElement>(null);
  const t = copy[locale];

  useEffect(() => {
    document.documentElement.dataset.papikosReady = "true";
    return () => {
      delete document.documentElement.dataset.papikosReady;
    };
  }, []);

  // The header search is the same control as the hero one, so it stays out of
  // the way until the hero field has scrolled off the top.
  useEffect(() => {
    const node = heroSearchRef.current;
    if (!node || !("IntersectionObserver" in window)) {
      // Without the observer there is no way to know when to reveal it, and a
      // reader who cannot search at all is worse than one who sees it twice.
      setHeaderSearchRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) =>
        setHeaderSearchRevealed(
          !entry.isIntersecting && entry.boundingClientRect.top < 0,
        ),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const previewListings = useMemo(() => listings.slice(0, 8), []);

  // Counts, not claims: everything here is read off the listings, so it stays
  // true as they change rather than being copy someone has to remember.
  const cityCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const listing of listings) {
      counts.set(listing.city, (counts.get(listing.city) ?? 0) + 1);
    }
    return counts;
  }, []);

  const cheapest = useMemo(
    () => Math.min(...listings.map((listing) => effectivePrice(listing))),
    [],
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

  const comingSoon = () => announce(t.prototypeNotice);

  const goToSearch = (query: string) => {
    window.location.assign(
      `/kos${serializeFilters({ ...defaultFilters, query })}`,
    );
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
        onSearchSubmit={goToSearch}
        searchRevealed={headerSearchRevealed}
      />

      <main
        className="locale-content"
        data-locale-transition={transitionState}
        id="main-content"
      >
        {/* One thing to do here, so one control: the search field, with the
            cities people actually search as shortcuts under it. The panel this
            replaced was a drawn map, which promised a feature the app does not
            have. */}
        <section className="relative overflow-hidden bg-[#f7faff] dark:bg-slate-950">
          <div className="hero-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20">
            <h1
              className="hero-enter text-4xl font-black leading-[1.04] tracking-[-0.05em] text-slate-950 dark:text-slate-50 sm:text-5xl lg:text-6xl"
              style={{ "--hero-delay": "40ms" } as CSSProperties}
            >
              {t.heroTitleStart}{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {t.heroTitleAccent}
              </span>
            </h1>

            <form
              className="hero-enter mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-slate-200 bg-white py-2 pl-5 pr-2 text-left shadow-[0_18px_50px_-32px_rgba(15,23,42,0.4)] transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-blue-950"
              onSubmit={(event) => {
                event.preventDefault();
                goToSearch(heroQuery.trim());
              }}
              ref={heroSearchRef}
              style={{ "--hero-delay": "120ms" } as CSSProperties}
            >
              <label className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="sr-only">{t.location}</span>
                <Search
                  size={18}
                  className="shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  onChange={(event) => setHeroQuery(event.target.value)}
                  placeholder={t.locationPlaceholder}
                  value={heroQuery}
                />
              </label>
              <button
                className="search-button inline-flex shrink-0 items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
                type="submit"
              >
                <Search className="search-icon" size={16} aria-hidden="true" />
                {t.search}
              </button>
            </form>

            <div
              className="hero-enter mt-5 flex flex-wrap items-center justify-center gap-2"
              style={{ "--hero-delay": "200ms" } as CSSProperties}
            >
              {cities.map((city) => (
                <Link
                  className="filter-chip inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-blue-950/35 dark:hover:text-blue-300"
                  href={`/kos?q=${encodeURIComponent(city)}`}
                  key={city}
                >
                  <MapPin size={14} aria-hidden="true" />
                  {city}
                  <span
                    aria-hidden="true"
                    className="rounded-full bg-slate-100 px-1.5 text-xs font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  >
                    {cityCounts.get(city) ?? 0}
                  </span>
                </Link>
              ))}
            </div>

            <p
              className="hero-enter mt-6 text-sm font-semibold text-slate-500 dark:text-slate-400"
              style={{ "--hero-delay": "280ms" } as CSSProperties}
            >
              {t.heroSummary
                .replace("{kos}", String(listings.length))
                .replace("{cities}", String(cityCounts.size))
                .replace("{price}", formatPrice(cheapest, locale))}
            </p>
          </div>
        </section>

        <section
          className="contour-surface scroll-mt-24 bg-white dark:bg-slate-900 py-12 sm:py-16"
          id="featured"
          ref={resultsRef}
        >
          <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="section-title">{t.featured}</h2>
              </div>
              <Link className="btn-secondary" href="/kos">
                {t.exploreAllCta}
              </Link>
            </Reveal>

            <Reveal className="mt-7">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {previewListings.map((listing, index) => (
                  <ListingCard
                    animationIndex={index}
                    detailHref={`/kos/${listing.id}`}
                    favorite={favoriteIds.includes(listing.id)}
                    key={listing.id}
                    listing={listing}
                    locale={locale}
                    onFavorite={() => toggleFavorite(listing.id)}
                  />
                ))}
              </div>
            </Reveal>
          </div>
        </section>


        <section
          className="bg-[#f7faff] py-14 dark:bg-slate-950 sm:py-16"
          id="how-it-works"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-4xl">
                {t.howTitle}
              </h2>
            </Reveal>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {[UserRoundSearch, MapIcon, KeyRound].map((Icon, index) => (
                <Reveal
                  className="h-full"
                  delay={index * 70}
                  key={t.howSteps[index].title}
                >
                  <article className="workflow-card relative h-full rounded-[1.5rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
                    <span className="absolute right-5 top-5 text-4xl font-black text-blue-50">
                      0{index + 1}
                    </span>
                    <span className="grid size-11 place-items-center rounded-xl bg-blue-100 dark:bg-blue-900/45 text-blue-700 dark:text-blue-300">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-black tracking-[-0.025em] text-slate-950 dark:text-slate-50">
                      {t.howSteps[index].title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {t.howSteps[index].body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer
        className="locale-content border-t border-slate-200 dark:border-slate-700 bg-slate-950 text-white"
        data-locale-transition={transitionState}
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <BrandMark inverse />
            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-400">
              {t.footerTagline}
            </p>
          </div>
          {[
            [
              t.footerExplore,
              [
                [t.footerLinks.search, "/kos"],
              ],
            ],
            [
              t.footerCompany,
              [
                [t.footerLinks.about, "#"],
                [t.footerLinks.privacy, "#"],
                [t.footerLinks.terms, "#"],
              ],
            ],
            [
              t.footerHelp,
              [
                [t.footerLinks.help, "#"],
                [t.footerLinks.contact, "#"],
              ],
            ],
          ].map(([heading, links]) => (
            <div key={String(heading)}>
              <h2 className="text-sm font-black">{String(heading)}</h2>
              <ul className="mt-4 space-y-3">
                {(links as string[][]).map(([label, href]) => (
                  <li key={label}>
                    <a
                      className="text-sm text-slate-400 transition hover:text-white"
                      href={href}
                      onClick={(event) => {
                        if (href === "#") {
                          event.preventDefault();
                          comingSoon();
                        }
                      }}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>© 2026 Papikos. Prototype experience.</p>
            <p>Jakarta, Indonesia</p>
          </div>
        </div>
      </footer>

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
