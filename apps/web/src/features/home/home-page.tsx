"use client";

import {
  ArrowRight,
  Building2,
  KeyRound,
  Map as MapIcon,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRoundSearch,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { amenityLabels, copy, typeLabels } from "./copy";
import {
  defaultFilters,
  formatPrice,
  rankListings,
  serializeFilters,
} from "./home-utils";
import { cities, listings, popularAmenities } from "./mock-listings";
import { ListingCard } from "@/features/listings/listing-card";
import { BrandMark } from "@/features/navigation/brand-mark";
import { PrototypeRoleBar } from "@/features/navigation/prototype-role-bar";
import { SiteHeader } from "@/features/navigation/site-header";
import {
  useLocaleTransition,
  useTheme,
} from "@/features/preferences/preferences";
import { Reveal } from "@/features/shared/reveal";
import {
  FAVORITES_STORAGE_KEY,
  SURVEY_STORAGE_KEY,
} from "@/features/shared/storage-keys";
import { usePersistentState } from "@/features/shared/use-persistent-state";
import type {
  Amenity,
  Listing,
  MatchResult,
  SurveyPreferences,
} from "./types";

const budgetOptions = [1000000, 1500000, 2000000, 2500000, 3000000];

function SurveyModal({
  open,
  locale,
  initialPreferences,
  onClose,
  onSubmit,
}: {
  open: boolean;
  locale: "id" | "en";
  initialPreferences: SurveyPreferences | null;
  onClose: () => void;
  onSubmit: (preferences: SurveyPreferences) => void;
}) {
  const t = copy[locale];
  const panelRef = useRef<HTMLDivElement>(null);
  const [preferences, setPreferences] = useState<SurveyPreferences>(
    initialPreferences ?? {
      city: cities[0],
      maxBudget: 2000000,
      roomType: "all",
      amenities: ["wifi", "privateBathroom"],
    },
  );

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("select, button, input")
        ?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const toggleAmenity = (amenity: Amenity) => {
    setPreferences((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), input:not([disabled])',
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white dark:bg-slate-900 p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="survey-title"
        aria-describedby="survey-description"
        onKeyDown={trapFocus}
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <span className="mb-3 inline-grid size-11 place-items-center rounded-2xl bg-blue-100 dark:bg-blue-900/45 text-blue-700 dark:text-blue-300">
              <Sparkles size={21} aria-hidden="true" />
            </span>
            <h2
              className="text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-50"
              id="survey-title"
            >
              {t.surveyDialogTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300" id="survey-description">
              {t.surveyDialogBody}
            </p>
          </div>
          <button
            className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-200"
            onClick={onClose}
            type="button"
            aria-label={t.close}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form
          className="mt-7 grid gap-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(preferences);
          }}
        >
          <label className="grid gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            {t.city}
            <select
              className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={preferences.city}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  city: event.target.value,
                }))
              }
            >
              {cities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            {t.maxBudget}
            <select
              className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={preferences.maxBudget}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  maxBudget: Number(event.target.value),
                }))
              }
            >
              {budgetOptions.map((budget) => (
                <option key={budget} value={budget}>
                  {formatPrice(budget, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 sm:col-span-2">
            {t.roomType}
            <select
              className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={preferences.roomType}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  roomType: event.target.value as SurveyPreferences["roomType"],
                }))
              }
            >
              {(["all", "putra", "putri", "campur"] as const).map((type) => (
                <option key={type} value={type}>
                  {typeLabels[locale][type]}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {t.desiredAmenities}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {popularAmenities.map((amenity) => {
                const selected = preferences.amenities.includes(amenity);
                return (
                  <button
                    className={`rounded-full border px-3.5 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-300"
                    }`}
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    type="button"
                    aria-pressed={selected}
                  >
                    {selected ? "✓ " : ""}
                    {amenityLabels[locale][amenity]}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <button
            className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:col-span-2"
            type="submit"
          >
            <Sparkles size={18} aria-hidden="true" />
            {t.showMatches}
          </button>
        </form>
      </div>
    </div>
  );
}

export function HomePage() {
  const { changeLocale, locale, selectedLocale, transitionState } =
    useLocaleTransition();
  const { theme, toggleTheme } = useTheme();
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>(
    FAVORITES_STORAGE_KEY,
    [],
  );
  const [savedSurvey, setSavedSurvey] =
    usePersistentState<SurveyPreferences | null>(SURVEY_STORAGE_KEY, null);
  const [headerQuery, setHeaderQuery] = useState("");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [toast, setToast] = useState("");
  const resultsRef = useRef<HTMLElement>(null);
  const surveyTriggerRef = useRef<HTMLButtonElement>(null);
  const t = copy[locale];

  useEffect(() => {
    document.documentElement.dataset.papikosReady = "true";
    return () => {
      delete document.documentElement.dataset.papikosReady;
    };
  }, []);

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const scrollToResults = () => {
    window.setTimeout(
      () => resultsRef.current?.scrollIntoView({ behavior: "smooth" }),
      0,
    );
  };

  const previewListings = useMemo(() => listings.slice(0, 8), []);

  const matchById = useMemo(
    () => new Map(matches.slice(0, 3).map((match) => [match.listingId, match])),
    [matches],
  );

  const visibleListings = useMemo(() => {
    if (matches.length === 0) return previewListings;
    const byId = new Map(listings.map((listing) => [listing.id, listing]));
    return matches
      .map((match) => byId.get(match.listingId))
      .filter((listing): listing is Listing => Boolean(listing));
  }, [matches, previewListings]);

  const resultsAnimationKey =
    matches.length > 0 ? matches.map((match) => match.listingId).join(",") : "preview";

  const toggleFavorite = (listingId: string) => {
    const favorite = favoriteIds.includes(listingId);
    setFavoriteIds((current) =>
      favorite
        ? current.filter((id) => id !== listingId)
        : [...current, listingId],
    );
    announce(favorite ? t.removed : t.saved);
  };

  const closeSurvey = () => {
    setSurveyOpen(false);
    window.setTimeout(() => surveyTriggerRef.current?.focus(), 0);
  };

  const submitSurvey = (preferences: SurveyPreferences) => {
    const ranked = rankListings(listings, preferences);
    setSavedSurvey(preferences);
    setMatches(ranked);
    closeSurvey();
    scrollToResults();
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
      />

      <main
        className="locale-content"
        data-locale-transition={transitionState}
        id="main-content"
      >
        <section className="relative overflow-hidden bg-[#f7faff] dark:bg-slate-950">
          <div className="hero-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_.92fr] lg:py-24">
            <div>
              <h1
                className="hero-enter max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.05em] text-slate-950 dark:text-slate-50 sm:text-5xl lg:text-6xl"
                style={{ "--hero-delay": "40ms" } as CSSProperties}
              >
                {t.heroTitleStart}{" "}
                <span className="text-blue-600 dark:text-blue-400">{t.heroTitleAccent}</span>
              </h1>
              <p
                className="hero-enter mt-5 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg"
                style={{ "--hero-delay": "120ms" } as CSSProperties}
              >
                {t.heroBody}
              </p>

              <Link
                className="search-button hero-enter mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-5 text-sm font-black text-white shadow-[0_24px_60px_-36px_rgba(30,64,175,0.45)] transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
                style={{ "--hero-delay": "200ms" } as CSSProperties}
                href="/kos"
              >
                <Search className="search-icon" size={18} aria-hidden="true" />
                <span>{t.heroSearchCta}</span>
              </Link>
            </div>

            <div className="relative mx-auto min-h-[280px] w-full max-w-[500px] sm:min-h-[340px]" aria-hidden="true">
              <div className="map-float absolute inset-3 overflow-hidden rounded-[2.5rem] border border-blue-100 bg-blue-50/80 dark:bg-blue-950/35 sm:inset-5">
                <div className="map-pattern absolute inset-0">
                  <div className="absolute left-[-8%] top-[34%] h-3 w-[116%] -rotate-6 rounded-full bg-white/90 dark:bg-slate-950/90" />
                  <div className="absolute left-[38%] top-[-14%] h-[130%] w-3 rotate-[18deg] rounded-full bg-white/90 dark:bg-slate-950/90" />
                  <div className="absolute bottom-[18%] left-[-5%] h-2.5 w-[92%] rotate-[10deg] rounded-full bg-white/80 dark:bg-slate-900/80" />
                  <div className="absolute left-[16%] top-[14%] size-24 rounded-[1.8rem] bg-blue-100/80 dark:bg-blue-900/45" />
                  <div className="absolute bottom-[12%] right-[10%] size-32 rounded-[2rem] bg-cyan-100/70" />
                  <div className="map-marker absolute left-1/2 top-1/2 grid size-16 place-items-center rounded-full border-[7px] border-white bg-blue-600 text-white shadow-lg shadow-blue-900/15">
                    <Building2 size={23} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Reveal className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-950 dark:text-slate-50">{t.popular}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.popularBody}</p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label={t.popular}>
              {["", ...cities].map((city) => (
                <Link
                  className="filter-chip inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/35 hover:text-blue-700 dark:hover:text-blue-300"
                  href={city ? `/kos?q=${encodeURIComponent(city)}` : "/kos"}
                  key={city || "all"}
                >
                  {city ? <MapPin size={14} aria-hidden="true" /> : null}
                  {city || t.allLocations}
                </Link>
              ))}
            </div>
          </Reveal>
        </section>

        <section
          className="contour-surface scroll-mt-24 bg-white dark:bg-slate-900 py-20 sm:py-24"
          id="featured"
          ref={resultsRef}
        >
          <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow">
                  <SlidersHorizontal size={15} aria-hidden="true" />
                  {matches.length > 0 ? t.yourMatches : t.featuredEyebrow}
                </p>
                <h2 className="section-title mt-4">{t.featured}</h2>
                <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-300">{t.featuredBody}</p>
              </div>
            </Reveal>

            {matches.length > 0 ? (
              <p
                className="result-count-enter mt-8 text-sm font-bold text-slate-500 dark:text-slate-400"
                key={`count:${resultsAnimationKey}`}
                aria-live="polite"
              >
                {visibleListings.length} {t.results}
              </p>
            ) : null}

            <Reveal className="mt-8">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleListings.map((listing, index) => (
                  <ListingCard
                    animationIndex={index}
                    detailHref={`/kos/${listing.id}`}
                    favorite={favoriteIds.includes(listing.id)}
                    key={`${resultsAnimationKey}:${listing.id}`}
                    listing={listing}
                    locale={locale}
                    match={matchById.get(listing.id)}
                    onFavorite={() => toggleFavorite(listing.id)}
                  />
                ))}
              </div>
            </Reveal>

            {matches.length === 0 ? (
              <div className="mt-10 flex justify-center">
                <Link className="btn-primary" href="/kos">
                  {t.exploreAllCta}
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section
          className="contour-surface contour-surface-soft scroll-mt-24 bg-white dark:bg-slate-900 py-14 sm:py-16"
          id="preference-survey"
        >
          <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="rounded-[2rem] border border-blue-100 bg-blue-50/80 dark:bg-blue-950/35 px-6 py-10 shadow-[0_22px_70px_-55px_rgba(37,99,235,0.45)] sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
              <div className="max-w-3xl">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                  <Sparkles size={15} aria-hidden="true" />
                  {t.surveyEyebrow}
                </p>
                <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-4xl">
                  {t.surveyTitle}
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
                  {t.surveyBody}
                </p>
              </div>
              <button
                ref={surveyTriggerRef}
                className="cta-button mt-7 inline-flex shrink-0 items-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 lg:mt-0"
                onClick={() => setSurveyOpen(true)}
                type="button"
              >
                {t.surveyCta}
                <ArrowRight
                  className="cta-arrow"
                  size={18}
                  aria-hidden="true"
                />
              </button>
            </Reveal>
          </div>
        </section>

        <section
          className="bg-[#f7faff] py-14 dark:bg-slate-950 sm:py-16"
          id="how-it-works"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow justify-center">{t.howEyebrow}</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-4xl">
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
                [t.footerLinks.survey, "#preference-survey"],
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

      {surveyOpen ? (
        <SurveyModal
          initialPreferences={savedSurvey}
          locale={locale}
          onClose={closeSurvey}
          onSubmit={submitSurvey}
          open
        />
      ) : null}

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
