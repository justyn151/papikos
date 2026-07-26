"use client";

import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Building2,
  Check,
  ChevronRight,
  Heart,
  KeyRound,
  Map as MapIcon,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRoundSearch,
  Wifi,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { amenityLabels, copy, shortTypeLabels, typeLabels } from "./copy";
import {
  defaultFilters,
  filterListings,
  formatPrice,
  rankListings,
  readStoredValue,
  serializeFilters,
} from "./home-utils";
import { amenities, cities, listings } from "./mock-listings";
import type {
  Amenity,
  Listing,
  Locale,
  MatchReason,
  MatchResult,
  SearchFilters,
  SurveyPreferences,
} from "./types";

const STORAGE_KEYS = {
  locale: "papikos.locale",
  favorites: "papikos.favorites",
  survey: "papikos.survey",
} as const;

const budgetOptions = [1000000, 1500000, 2000000, 2500000, 3000000];

function usePersistentState<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setValue(readStoredValue(key, initialRef.current));
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, ready, value]);

  return [value, setValue] as const;
}

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="Papikos">
      <span className="grid size-10 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
        <Building2 size={21} strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span
        className={`text-xl font-black tracking-[-0.04em] ${
          inverse ? "text-white" : "text-slate-950"
        }`}
      >
        papi<span className={inverse ? "text-cyan-300" : "text-blue-600"}>kos</span>
      </span>
    </span>
  );
}

function LanguageToggle({
  locale,
  onChange,
  label,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
  label: string;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm"
      aria-label={label}
      role="group"
    >
      {(["id", "en"] as const).map((item) => (
        <button
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            locale === item
              ? "bg-blue-600 text-white"
              : "text-slate-500 hover:text-slate-900"
          }`}
          key={item}
          onClick={() => onChange(item)}
          type="button"
          aria-pressed={locale === item}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

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

function ListingCard({
  listing,
  locale,
  favorite,
  onFavorite,
  onComingSoon,
  match,
}: {
  listing: Listing;
  locale: Locale;
  favorite: boolean;
  onFavorite: () => void;
  onComingSoon: () => void;
  match?: MatchResult;
}) {
  const t = copy[locale];

  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_16px_50px_-32px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_65px_-30px_rgba(37,99,235,0.35)]">
      <div className="relative">
        <PropertyPlaceholder listing={listing} />
        <button
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white text-slate-600 shadow-lg transition hover:scale-105 hover:text-rose-500 focus:outline-none focus:ring-4 focus:ring-blue-200"
          onClick={onFavorite}
          type="button"
          aria-label={favorite ? t.favoriteRemove : t.favoriteAdd}
          aria-pressed={favorite}
        >
          <Heart
            size={19}
            className={favorite ? "fill-rose-500 text-rose-500" : ""}
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
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
            {shortTypeLabels[locale][listing.type]}
          </span>
          {listing.verified ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <BadgeCheck size={14} aria-hidden="true" />
              {t.verified}
            </span>
          ) : null}
        </div>
        <h3 className="text-lg font-black tracking-[-0.025em] text-slate-950">
          {listing.name}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin size={15} aria-hidden="true" />
          {listing.district}, {listing.city}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {listing.amenities.slice(0, 3).map((amenity) => (
            <span
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600"
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
                className="flex items-center gap-2 text-xs font-semibold text-blue-800"
                key={reason.kind}
              >
                <Check size={14} aria-hidden="true" />
                {reasonText(reason, locale, t)}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-lg font-black tracking-[-0.03em] text-slate-950">
              {formatPrice(listing.price, locale)}
            </p>
            <p className="text-xs text-slate-500">
              {listing.availableRooms} {t.roomsLeft} · {t.perMonth}
            </p>
          </div>
          <button
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200"
            onClick={onComingSoon}
            type="button"
          >
            {t.viewDetail}
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function SurveyModal({
  open,
  locale,
  initialPreferences,
  onClose,
  onSubmit,
}: {
  open: boolean;
  locale: Locale;
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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="survey-title"
        aria-describedby="survey-description"
        onKeyDown={trapFocus}
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <span className="mb-3 inline-grid size-11 place-items-center rounded-2xl bg-blue-100 text-blue-700">
              <Sparkles size={21} aria-hidden="true" />
            </span>
            <h2
              className="text-2xl font-black tracking-[-0.04em] text-slate-950"
              id="survey-title"
            >
              {t.surveyDialogTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600" id="survey-description">
              {t.surveyDialogBody}
            </p>
          </div>
          <button
            className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-blue-200"
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
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            {t.city}
            <select
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            {t.maxBudget}
            <select
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
          <label className="grid gap-2 text-sm font-bold text-slate-800 sm:col-span-2">
            {t.roomType}
            <select
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            <legend className="text-sm font-bold text-slate-800">
              {t.desiredAmenities}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {amenities.map((amenity) => {
                const selected = preferences.amenities.includes(amenity);
                return (
                  <button
                    className={`rounded-full border px-3.5 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
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

export function HomePage({ initialFilters }: { initialFilters: SearchFilters }) {
  const [locale, setLocale] = usePersistentState<Locale>(
    STORAGE_KEYS.locale,
    "id",
  );
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>(
    STORAGE_KEYS.favorites,
    [],
  );
  const [savedSurvey, setSavedSurvey] =
    usePersistentState<SurveyPreferences | null>(STORAGE_KEYS.survey, null);
  const [draftFilters, setDraftFilters] =
    useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<SearchFilters>(initialFilters);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [toast, setToast] = useState("");
  const resultsRef = useRef<HTMLElement>(null);
  const surveyTriggerRef = useRef<HTMLButtonElement>(null);
  const t = copy[locale];

  useEffect(() => {
    document.documentElement.lang = locale === "id" ? "id" : "en";
  }, [locale]);

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

  const syncUrl = (filters: SearchFilters) => {
    window.history.replaceState(null, "", `/${serializeFilters(filters)}`);
  };

  const scrollToResults = () => {
    window.setTimeout(
      () => resultsRef.current?.scrollIntoView({ behavior: "smooth" }),
      0,
    );
  };

  const applySearch = (filters: SearchFilters, shouldAnnounce = true) => {
    setDraftFilters(filters);
    setAppliedFilters(filters);
    setMatches([]);
    syncUrl(filters);
    scrollToResults();
    if (shouldAnnounce) announce(t.searchUpdated);
  };

  const filtered = useMemo(
    () => filterListings(listings, appliedFilters),
    [appliedFilters],
  );

  const matchById = useMemo(
    () => new Map(matches.slice(0, 3).map((match) => [match.listingId, match])),
    [matches],
  );

  const visibleListings = useMemo(() => {
    if (matches.length === 0) return filtered;
    const byId = new Map(listings.map((listing) => [listing.id, listing]));
    return matches
      .map((match) => byId.get(match.listingId))
      .filter((listing): listing is Listing => Boolean(listing));
  }, [filtered, matches]);

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
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    syncUrl(defaultFilters);
    closeSurvey();
    scrollToResults();
  };

  const comingSoon = () => announce(t.prototypeNotice);

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition focus:translate-y-0"
      >
        {t.skip}
      </a>

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#" className="rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200">
            <BrandMark />
          </a>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            <a className="nav-link" href="#featured">
              {t.navDiscover}
            </a>
            <a className="nav-link" href="#how-it-works">
              {t.navHow}
            </a>
            <a className="nav-link" href="#owners">
              {t.navOwner}
            </a>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageToggle
              locale={locale}
              onChange={setLocale}
              label={t.language}
            />
            <button className="btn-secondary" onClick={comingSoon} type="button">
              {t.login}
            </button>
            <button className="btn-primary" onClick={comingSoon} type="button">
              {t.ownerCta}
            </button>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageToggle
              locale={locale}
              onChange={setLocale}
              label={t.language}
            />
            <button
              className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
              onClick={() => setMenuOpen((current) => !current)}
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t.closeMenu : t.menu}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav
            className="border-t border-slate-100 bg-white px-5 py-5 shadow-xl lg:hidden"
            id="mobile-menu"
            aria-label={t.mobileNav}
          >
            <div className="mx-auto grid max-w-7xl gap-2">
              {[
                [t.navDiscover, "#featured"],
                [t.navHow, "#how-it-works"],
                [t.navOwner, "#owners"],
              ].map(([label, href]) => (
                <a
                  className="rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  href={href}
                  key={href}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button className="btn-secondary" onClick={comingSoon} type="button">
                  {t.login}
                </button>
                <button className="btn-primary" onClick={comingSoon} type="button">
                  {t.ownerCta}
                </button>
              </div>
            </div>
          </nav>
        ) : null}
      </header>

      <main id="main-content">
        <section className="relative overflow-hidden bg-[#f7faff]">
          <div className="hero-grid absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.02fr_.98fr] lg:py-28">
            <div>
              <p className="eyebrow">
                <span className="size-2 rounded-full bg-blue-600" />
                {t.heroBadge}
              </p>
              <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
                {t.heroTitleStart}{" "}
                <span className="text-blue-600">{t.heroTitleAccent}</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                {t.heroBody}
              </p>

              <form
                className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_30px_80px_-35px_rgba(30,64,175,0.4)]"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  applySearch(draftFilters);
                }}
              >
                <p className="px-2 pb-3 text-sm font-black text-slate-900">
                  {t.searchTitle}
                </p>
                <div className="grid gap-2 md:grid-cols-[1.25fr_.8fr_.8fr_auto]">
                  <label className="search-field">
                    <span>{t.location}</span>
                    <span className="flex items-center gap-2">
                      <MapPin size={17} className="text-blue-600" aria-hidden="true" />
                      <input
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder={t.locationPlaceholder}
                        value={draftFilters.query}
                        onChange={(event) =>
                          setDraftFilters((current) => ({
                            ...current,
                            query: event.target.value,
                          }))
                        }
                      />
                    </span>
                  </label>
                  <label className="search-field">
                    <span>{t.roomType}</span>
                    <select
                      className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
                      value={draftFilters.type}
                      onChange={(event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          type: event.target.value as SearchFilters["type"],
                        }))
                      }
                    >
                      {(["all", "putra", "putri", "campur"] as const).map((type) => (
                        <option value={type} key={type}>
                          {typeLabels[locale][type]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="search-field">
                    <span>{t.maxBudget}</span>
                    <select
                      className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
                      value={draftFilters.maxPrice ?? ""}
                      onChange={(event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          maxPrice: event.target.value
                            ? Number(event.target.value)
                            : null,
                        }))
                      }
                    >
                      <option value="">{t.anyBudget}</option>
                      {budgetOptions.map((budget) => (
                        <option value={budget} key={budget}>
                          {formatPrice(budget, locale)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
                    type="submit"
                  >
                    <Search size={18} aria-hidden="true" />
                    <span className="md:sr-only xl:not-sr-only">{t.search}</span>
                  </button>
                </div>
              </form>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-slate-600">
                {[t.demoCities, t.sampleListings, t.clearMatching].map((stat) => (
                  <span className="inline-flex items-center gap-2" key={stat}>
                    <Check
                      size={16}
                      className="rounded-full bg-blue-100 p-0.5 text-blue-700"
                      aria-hidden="true"
                    />
                    {stat}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto min-h-[430px] w-full max-w-[560px]" aria-hidden="true">
              <div className="absolute inset-0 rotate-2 rounded-[3rem] border border-blue-100 bg-white shadow-[0_40px_100px_-45px_rgba(30,64,175,0.5)]">
                <div className="map-pattern absolute inset-5 overflow-hidden rounded-[2.3rem] bg-blue-50">
                  <div className="absolute left-[12%] top-[18%] h-2 w-[70%] rotate-[-12deg] rounded-full bg-white" />
                  <div className="absolute left-[30%] top-[-5%] h-[110%] w-2 rotate-[18deg] rounded-full bg-white" />
                  <div className="absolute left-[-10%] top-[58%] h-2 w-[110%] rotate-[8deg] rounded-full bg-white" />
                  <div className="absolute right-[8%] top-[14%] rounded-full bg-blue-600 p-3 text-white shadow-xl">
                    <MapPin size={24} />
                  </div>
                  <div className="absolute bottom-[18%] left-[14%] rounded-full bg-slate-950 p-3 text-white shadow-xl">
                    <MapPin size={24} />
                  </div>
                  <div className="absolute left-[44%] top-[44%] grid size-16 place-items-center rounded-full border-[8px] border-white bg-amber-400 text-blue-950 shadow-xl">
                    <Building2 size={24} />
                  </div>
                </div>
              </div>
              <div className="absolute -left-2 bottom-4 w-56 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:-left-8">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                    <ShieldCheck size={21} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">{t.verified}</p>
                    <p className="mt-0.5 text-sm font-black text-slate-950">
                      Kalyana Living
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-2 top-9 w-52 rounded-3xl bg-blue-950 p-4 text-white shadow-2xl sm:-right-7">
                <div className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/10">
                    <Sparkles size={19} />
                  </span>
                  <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-xs font-black text-blue-950">
                    92%
                  </span>
                </div>
                <p className="mt-5 text-xs text-blue-200">{t.matchLocation}</p>
                <p className="mt-1 text-sm font-black">{t.matchRoomType}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-950">{t.popular}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.popularBody}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <button
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  key={city}
                  onClick={() =>
                    applySearch({
                      ...defaultFilters,
                      query: city,
                    })
                  }
                  type="button"
                >
                  <MapPin size={14} aria-hidden="true" />
                  {city}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          className="scroll-mt-24 bg-white py-20 sm:py-24"
          id="featured"
          ref={resultsRef}
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow">
                  <SlidersHorizontal size={15} aria-hidden="true" />
                  {matches.length > 0 ? t.yourMatches : t.featuredEyebrow}
                </p>
                <h2 className="section-title mt-4">{t.featured}</h2>
                <p className="mt-3 max-w-xl text-slate-600">{t.featuredBody}</p>
              </div>
              <div className="flex flex-wrap gap-2" aria-label={t.roomType}>
                {(["all", "putra", "putri", "campur"] as const).map((type) => (
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      appliedFilters.type === type && matches.length === 0
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                    }`}
                    key={type}
                    onClick={() =>
                      applySearch({
                        ...appliedFilters,
                        type,
                      })
                    }
                    type="button"
                    aria-pressed={appliedFilters.type === type && matches.length === 0}
                  >
                    {typeLabels[locale][type]}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-8 text-sm font-bold text-slate-500" aria-live="polite">
              {visibleListings.length} {t.results}
            </p>

            {visibleListings.length > 0 ? (
              <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleListings.map((listing) => (
                  <ListingCard
                    favorite={favoriteIds.includes(listing.id)}
                    key={listing.id}
                    listing={listing}
                    locale={locale}
                    match={matchById.get(listing.id)}
                    onComingSoon={comingSoon}
                    onFavorite={() => toggleFavorite(listing.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[2rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-16 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                  <Search size={24} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-black text-slate-950">{t.emptyTitle}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  {t.emptyBody}
                </p>
                <button
                  className="btn-primary mt-5"
                  onClick={() => applySearch(defaultFilters)}
                  type="button"
                >
                  {t.reset}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="bg-blue-950 py-20 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_.8fr]">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                <Sparkles size={15} aria-hidden="true" />
                {t.surveyEyebrow}
              </p>
              <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[-0.045em] sm:text-5xl">
                {t.surveyTitle}
              </h2>
              <p className="mt-5 max-w-2xl leading-7 text-blue-100">{t.surveyBody}</p>
              <button
                ref={surveyTriggerRef}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3.5 text-sm font-black text-blue-950 shadow-xl shadow-cyan-950/20 transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-200/40"
                onClick={() => setSurveyOpen(true)}
                type="button"
              >
                {t.surveyCta}
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="relative mx-auto grid w-full max-w-md gap-3 rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              {[
                [MapPin, t.city, "Yogyakarta"],
                [BedDouble, t.roomType, typeLabels[locale].campur],
                [Wifi, t.desiredAmenities, "Wi-Fi · AC · Dapur"],
              ].map(([Icon, label, value], index) => {
                const SurveyIcon = Icon as typeof MapPin;
                return (
                  <div
                    className={`flex items-center gap-4 rounded-2xl border border-white/10 p-4 ${
                      index === 1 ? "translate-x-4 bg-blue-800" : "bg-white/10"
                    }`}
                    key={String(label)}
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-cyan-300">
                      <SurveyIcon size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs text-blue-200">{String(label)}</p>
                      <p className="mt-1 text-sm font-black">{String(value)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#f7faff] py-20 sm:py-24" id="how-it-works">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow justify-center">{t.howEyebrow}</p>
              <h2 className="section-title mt-4">{t.howTitle}</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[UserRoundSearch, MapIcon, KeyRound].map((Icon, index) => (
                <article
                  className="relative rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_16px_50px_-35px_rgba(15,23,42,0.3)]"
                  key={t.howSteps[index].title}
                >
                  <span className="absolute right-6 top-5 text-5xl font-black text-blue-50">
                    0{index + 1}
                  </span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-black tracking-[-0.03em] text-slate-950">
                    {t.howSteps[index].title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {t.howSteps[index].body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24" id="owners">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-blue-600 px-7 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-16">
              <div className="absolute -right-20 -top-24 size-80 rounded-full border-[40px] border-white/5" aria-hidden="true" />
              <div className="relative max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                  {t.ownerEyebrow}
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                  {t.ownerTitle}
                </h2>
                <p className="mt-4 max-w-xl leading-7 text-blue-100">{t.ownerBody}</p>
              </div>
              <button
                className="relative mt-7 inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-blue-700 shadow-xl transition hover:bg-cyan-100 focus:outline-none focus:ring-4 focus:ring-white/40 lg:mt-0"
                onClick={comingSoon}
                type="button"
              >
                {t.ownerAction}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-950 text-white">
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
                [t.footerLinks.search, "#featured"],
                [t.footerLinks.survey, "#featured"],
                [t.footerLinks.owner, "#owners"],
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
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
