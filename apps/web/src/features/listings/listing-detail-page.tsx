"use client";

import {
  BadgeCheck,
  BedDouble,
  Bike,
  BusFront,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flag,
  GraduationCap,
  Heart,
  Lock,
  Hospital,
  MapPin,
  Maximize2,
  Send,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { copy as homeCopy, shortTypeLabels } from "@/features/home/copy";
import {
  defaultFilters,
  discountPercent,
  formatPrice,
  roomEffectivePrice,
  serializeFilters,
} from "@/features/home/home-utils";
import { BrandMark } from "@/features/navigation/brand-mark";
import { PrototypeRoleBar } from "@/features/navigation/prototype-role-bar";
import { SiteHeader } from "@/features/navigation/site-header";
import {
  useLocaleTransition,
  useTheme,
} from "@/features/preferences/preferences";
import { resolveListingDetail } from "@/features/prototype-data/resolve-listing";
import { statusTone } from "@/features/prototype-data/status-copy";
import { useOverrides } from "@/features/prototype-data/store";
import { createId } from "@/features/shared/create-id";
import { Dialog } from "@/features/shared/dialog";
import { FAVORITES_STORAGE_KEY } from "@/features/shared/storage-keys";
import { usePersistentState } from "@/features/shared/use-persistent-state";

import { costExplanationFor, costPaymentNotice } from "./cost-copy";
import { detailCopy } from "./detail-copy";
import { GalleryArtwork, ListingGallery } from "./listing-gallery";
import { LazyListingMap } from "./listing-map-lazy";
import type {
  BookingRequest,
  FacilityItem,
  ListingDetail,
  ListingReport,
  SubmittedQuestion,
} from "./types";

const STORAGE_KEYS = {
  favorites: FAVORITES_STORAGE_KEY,
  bookings: "papikos.bookingRequests",
  questions: "papikos.listingQuestions",
  reports: "papikos.listingReports",
} as const;

const facilityIcons: Record<FacilityItem["category"], typeof BedDouble> = {
  room: BedDouble,
  shared: UsersRound,
  service: Sparkles,
  security: ShieldCheck,
  parking: Bike,
};

const landmarkIcons = {
  campus: GraduationCap,
  transit: BusFront,
  shopping: ShoppingBag,
  health: Hospital,
} as const;

function Section({
  children,
  id,
  title,
  body,
}: {
  children: ReactNode;
  id?: string;
  title: string;
  body?: string;
}) {
  return (
    <section className="scroll-mt-28 border-t border-slate-200 dark:border-slate-700 py-9 sm:py-11" id={id}>
      <h2 className="text-2xl font-black tracking-[-0.035em] text-slate-950 dark:text-slate-50 sm:text-3xl">
        {title}
      </h2>
      {body ? <p className="mt-2 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">{body}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function ListingDetailPage({
  listing: seedListing,
  related,
}: {
  listing: ListingDetail;
  related: ListingDetail[];
}) {
  // The route is a server component, so owner edits (which live in browser
  // storage) are merged here after hydration rather than on the server.
  const { overrideFor } = useOverrides();
  const override = overrideFor(seedListing.id);
  // Memoized so the resolved listing keeps a stable identity between renders;
  // downstream memos depend on it.
  const listing = useMemo(
    () => resolveListingDetail(seedListing, override),
    [override, seedListing],
  );
  const { changeLocale, locale, selectedLocale, transitionState } =
    useLocaleTransition();
  const { theme, toggleTheme } = useTheme();
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>(
    STORAGE_KEYS.favorites,
    [],
  );
  const [bookings, setBookings] = usePersistentState<BookingRequest[]>(
    STORAGE_KEYS.bookings,
    [],
  );
  const [submittedQuestions, setSubmittedQuestions] = usePersistentState<
    SubmittedQuestion[]
  >(STORAGE_KEYS.questions, []);
  // Pending questions stay private between renter and owner; once the owner
  // answers, the exchange becomes useful to every future renter.
  const answeredQuestions = submittedQuestions.filter(
    (item) =>
      item.listingId === listing.id && item.status === "answered" && item.answer,
  );
  const [reports, setReports] = usePersistentState<ListingReport[]>(
    STORAGE_KEYS.reports,
    [],
  );
  const discount = discountPercent(listing);
  const [explainedCostId, setExplainedCostId] = useState<string | null>(null);
  const initialRoom =
    listing.rooms.find((room) => room.availableRooms > 0) ?? listing.rooms[0];
  const [bookingRoomId, setBookingRoomId] = useState(initialRoom.id);
  const [bookingDialogState, setBookingDialogState] = useState<
    "closed" | "open" | "closing"
  >("closed");
  const bookingDialogStateRef = useRef<"closed" | "open" | "closing">(
    "closed",
  );
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [moveInDate, setMoveInDate] = useState(listing.availableFrom);
  const [duration, setDuration] = useState(
    String(Math.max(1, listing.minimumStayMonths)),
  );
  const [bookingNote, setBookingNote] = useState("");
  const [question, setQuestion] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("price");
  const [reportDetails, setReportDetails] = useState("");
  const [toast, setToast] = useState("");
  const [mobileCtaVisible, setMobileCtaVisible] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const bookingTriggerRef = useRef<HTMLButtonElement | null>(null);
  const bookingCloseTimerRef = useRef<number | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const t = detailCopy[locale];
  const favorite = favoriteIds.includes(listing.id);
  const bookingRoom =
    listing.rooms.find((room) => room.id === bookingRoomId) ?? initialRoom;
  const existingBooking = bookings.find((item) => item.listingId === listing.id);
  const addressUnlocked = bookings.some(
    (item) => item.listingId === listing.id && item.status === "approved",
  );

  useEffect(() => {
    document.documentElement.dataset.papikosReady = "true";
    return () => {
      delete document.documentElement.dataset.papikosReady;
    };
  }, []);

  useEffect(
    () => () => {
      if (bookingCloseTimerRef.current) {
        window.clearTimeout(bookingCloseTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const node = summaryRef.current;
    if (!node || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setMobileCtaVisible(
          !entry.isIntersecting && entry.boundingClientRect.top < 0,
        );
      },
      { threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const toggleFavorite = () => {
    setFavoriteIds((current) =>
      favorite
        ? current.filter((id) => id !== listing.id)
        : [...current, listing.id],
    );
    announce(favorite ? t.removed : t.saved);
  };

  const shareListing = async () => {
    const shareData = {
      title: listing.name,
      text: listing.description[locale],
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      announce(t.shared);
    } catch {
      announce(t.shareFailed);
    }
  };

  const openBooking = () => {
    if (bookingCloseTimerRef.current) {
      window.clearTimeout(bookingCloseTimerRef.current);
      bookingCloseTimerRef.current = null;
    }
    if (existingBooking) setBookingRoomId(existingBooking.roomId);
    setBookingSubmitted(Boolean(existingBooking));
    bookingDialogStateRef.current = "open";
    setBookingDialogState("open");
  };

  const submitBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const createdAt = new Date().toISOString();
    const request: BookingRequest = {
      id: createId("booking"),
      listingId: listing.id,
      roomId: bookingRoomId,
      moveInDate,
      durationMonths: Number(duration),
      note: bookingNote.trim(),
      status: "pending",
      statusHistory: [{ status: "pending", at: createdAt, by: "renter" }],
      createdAt,
    };
    setBookings((current) => [
      ...current.filter((item) => item.listingId !== listing.id),
      request,
    ]);
    setBookingSubmitted(true);
  };

  const closeBooking = useCallback(() => {
    if (bookingDialogStateRef.current !== "open") return;

    const finishClose = () => {
      bookingDialogStateRef.current = "closed";
      setBookingDialogState("closed");
      bookingCloseTimerRef.current = null;
      window.setTimeout(() => bookingTriggerRef.current?.focus(), 0);
    };

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      finishClose();
      return;
    }

    bookingDialogStateRef.current = "closing";
    setBookingDialogState("closing");
    bookingCloseTimerRef.current = window.setTimeout(finishClose, 180);
  }, []);

  const submitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = question.trim();
    if (normalized.length < 10) return;
    setSubmittedQuestions((current) => [
      ...current,
      {
        id: createId("question"),
        listingId: listing.id,
        question: normalized,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ]);
    setQuestion("");
    announce(t.askSuccess);
  };

  const submitReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reportDetails.trim().length < 10) return;
    setReports((current) => [
      ...current,
      {
        id: createId("report"),
        listingId: listing.id,
        reason: reportReason,
        details: reportDetails.trim(),
        status: "submitted",
        createdAt: new Date().toISOString(),
      },
    ]);
    setReportDetails("");
    setReportOpen(false);
    announce(t.reportSuccess);
  };

  const dateFormatter = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formatDate = (value: string) =>
    dateFormatter.format(new Date(`${value}T12:00:00`));

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[110] -translate-y-24 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition focus:translate-y-0"
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
        favoritesLabel={homeCopy[locale].favorites}
        languageLabel={t.language}
        searchLabel={homeCopy[locale].location}
        searchPlaceholder={homeCopy[locale].locationPlaceholder}
        searchButtonLabel={homeCopy[locale].search}
        searchValue={headerQuery}
        onSearchChange={setHeaderQuery}
        onSearchSubmit={(value) =>
          window.location.assign(
            `/kos${serializeFilters({ ...defaultFilters, query: value })}`,
          )
        }
      />

      <main
        className="locale-content pb-24 lg:pb-0"
        data-locale-transition={transitionState}
        id="main-content"
      >
        <section className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 sm:pt-8">
          <ListingGallery listing={listing} locale={locale} />
        </section>

        <section className="contour-surface mt-7 border-y border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
            <div
              className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"
              ref={summaryRef}
            >
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 dark:bg-blue-950/35 px-3 py-1.5 text-xs font-black text-blue-700 dark:text-blue-300">
                    {shortTypeLabels[locale][listing.type]}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-black ${
                      listing.verified ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {listing.verified ? (
                      <BadgeCheck size={15} aria-hidden="true" />
                    ) : (
                      <CircleHelp size={15} aria-hidden="true" />
                    )}
                    {listing.verified ? t.verified : t.unverified}
                  </span>
                </div>
                <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-[-0.05em] text-slate-950 dark:text-slate-50 sm:text-5xl">
                  {listing.name}
                </h1>
                <p className="mt-4 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <MapPin size={18} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  {listing.approximateArea}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t.updated} {formatDate(listing.updatedAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-secondary gap-2"
                  onClick={toggleFavorite}
                  type="button"
                  aria-label={favorite ? t.favoriteRemove : t.favoriteAdd}
                  aria-pressed={favorite}
                >
                  <Heart
                    className={favorite ? "fill-rose-500 text-rose-500" : ""}
                    size={17}
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">
                    {favorite ? t.favoriteRemove : t.favoriteAdd}
                  </span>
                </button>
                <button className="btn-secondary gap-2" onClick={shareListing} type="button">
                  <Share2 size={17} aria-hidden="true" />
                  {t.share}
                </button>
                <button
                  className="btn-secondary gap-2"
                  onClick={() => setReportOpen(true)}
                  type="button"
                >
                  <Flag size={17} aria-hidden="true" />
                  {t.report}
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <Section id="overview" title={t.overview}>
              <p className="max-w-3xl text-lg leading-8 text-slate-700 dark:text-slate-300">
                {listing.description[locale]}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  [CalendarDays, t.availableFrom, formatDate(listing.availableFrom)],
                  [Clock3, t.minimumStay, `${listing.minimumStayMonths} ${t.month}`],
                  [BedDouble, t.roomsAvailable, String(listing.availableRooms)],
                ].map(([Icon, label, value]) => (
                  <div
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-4"
                    key={String(label)}
                  >
                    <Icon className="text-blue-600 dark:text-blue-400" size={20} aria-hidden="true" />
                    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {String(label)}
                    </p>
                    <p className="mt-1 font-black text-slate-950 dark:text-slate-50">{String(value)}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="rooms" title={t.rooms} body={t.roomsBody}>
              <div className="space-y-4">
                {listing.rooms.map((room) => {
                  const available = room.availableRooms > 0;
                  return (
                    <article
                      className="rounded-[1.5rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-6"
                      key={room.id}
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black text-slate-950 dark:text-slate-50">
                              {room.name[locale]}
                            </h3>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            {room.size} ·{" "}
                            {room.bathroom === "private"
                              ? t.privateBathroom
                              : t.sharedBathroom}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {room.furnishings.map((item) => (
                              <span
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300"
                                key={item.en}
                              >
                                {item[locale]}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="shrink-0 sm:text-right">
                          <p className="text-xl font-black text-slate-950 dark:text-slate-50">
                            {discount ? (
                              <span className="mr-1.5 text-xs font-bold text-slate-400 line-through dark:text-slate-500">
                                {formatPrice(room.price, locale)}
                              </span>
                            ) : null}
                            {formatPrice(
                              roomEffectivePrice(listing, room.price),
                              locale,
                            )}
                          </p>
                          <p
                            className={`mt-1 text-xs font-bold ${
                              available ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"
                            }`}
                          >
                            {available
                              ? `${room.availableRooms} ${t.roomAvailabilityCount}`
                              : t.unavailable}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Section>

            <Section title={t.costs} body={t.costsBody}>
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between gap-4 bg-slate-950 px-5 py-4 text-white">
                  <span className="inline-flex items-center gap-2 font-black">
                    <WalletCards size={19} aria-hidden="true" />
                    {initialRoom.name[locale]}
                  </span>
                  <span className="font-black">
                    {formatPrice(roomEffectivePrice(listing, initialRoom.price), locale)}
                  </span>
                </div>
                <dl className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {listing.costs.map((cost) => {
                    // Charged rows keep the amount prominent; the rest read as
                    // a status, so they share the app's status-pill palette.
                    const charged = !cost.included && cost.amount;
                    const price = cost.included
                      ? cost.id === "deposit"
                        ? t.noCharge
                        : t.included
                      : cost.amount
                        ? `${formatPrice(cost.amount, locale)} / ${t.month}`
                        : null;
                    // With no price to show, the owner's note stands in for
                    // one; with neither, the row still has to say something,
                    // because an empty pill reads as a rendering fault rather
                    // than as "the owner did not say".
                    const value = price ?? cost.note?.[locale] ?? t.costUnstated;

                    return (
                      <div key={cost.id}>
                        {/* The whole row is the target, not just the label. */}
                        <button
                          aria-label={`${cost.label[locale]} — ${t.explainCost}`}
                          className="flex w-full items-center justify-between gap-5 px-5 py-4 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-100 dark:hover:bg-slate-800/60 dark:focus-visible:bg-slate-800/60 dark:focus-visible:ring-blue-950"
                          onClick={() => setExplainedCostId(cost.id)}
                          type="button"
                        >
                          <span className="min-w-0">
                            <dt className="flex items-center gap-1.5 font-black text-slate-900 dark:text-slate-100">
                              {cost.label[locale]}
                              <CircleHelp
                                size={14}
                                className="shrink-0 text-slate-400"
                                aria-hidden="true"
                              />
                            </dt>
                            {cost.note && price ? (
                              // Only when the value column is showing a price:
                              // otherwise the note is already standing in for
                              // it, and this would print the same line twice.
                              <dd className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {cost.note[locale]}
                              </dd>
                            ) : null}
                          </span>
                          <dd className="shrink-0">
                            {charged ? (
                              <span className="text-sm font-black tabular-nums text-slate-900 dark:text-slate-100">
                                {value}
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${
                                  cost.included
                                    ? statusTone.resolved
                                    : statusTone.reviewing
                                }`}
                              >
                                {value}
                              </span>
                            )}
                          </dd>
                        </button>
                      </div>
                    );
                  })}
                </dl>
                <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs leading-5 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                  {costPaymentNotice[locale]}
                </p>
              </div>
            </Section>

            <Section title={t.facilities}>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  ["room", "shared", "service", "security", "parking"] as const
                ).map((category) => {
                  const items = listing.facilities.filter(
                    (facility) => facility.category === category,
                  );
                  if (items.length === 0) return null;
                  const Icon = facilityIcons[category];
                  return (
                    <div
                      className="rounded-[1.35rem] border border-slate-200 dark:border-slate-700 p-5"
                      key={category}
                    >
                      <h3 className="flex items-center gap-2 font-black text-slate-950 dark:text-slate-50">
                        <span className="grid size-9 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/35 text-blue-700 dark:text-blue-300">
                          <Icon size={17} aria-hidden="true" />
                        </span>
                        {t.facilityGroups[category]}
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {items.map((item) => (
                          <li
                            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
                            key={item.id}
                          >
                            <Check size={15} className="text-emerald-600 dark:text-emerald-300" />
                            {item.label[locale]}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title={t.location}>
              <div className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-blue-50/70 dark:bg-blue-950/30">
                <div className="relative h-72 overflow-hidden">
                  <LazyListingMap
                    centre={{ lat: listing.lat, lng: listing.lng }}
                    label={`${t.approximate}: ${listing.approximateArea}`}
                    radiusMeters={listing.privacyRadiusMeters}
                  />
                  <span className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-full bg-white/90 px-4 py-2 text-sm font-black text-slate-800 shadow-lg backdrop-blur dark:bg-slate-950/90 dark:text-slate-200">
                    {t.approximate}: {listing.approximateArea}
                  </span>
                </div>
                <div className="border-t border-blue-100 bg-white dark:bg-slate-900 p-5">
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {t.privacy.replace("{radius}", String(listing.privacyRadiusMeters))}
                  </p>

                  {listing.addressDetail ? (
                    <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <p className="text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                        {t.addressTitle}
                      </p>
                      {/* The promise above is only worth anything if something
                          actually keeps it: the owner's address is held back
                          until they have approved this renter's request. */}
                      {addressUnlocked ? (
                        <>
                          <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {t.addressUnlocked}
                          </p>
                          <p className="mt-1 text-sm leading-6 font-semibold text-slate-800 dark:text-slate-200">
                            {listing.addressDetail}
                          </p>
                        </>
                      ) : (
                        <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          <Lock size={15} className="mt-1 shrink-0" aria-hidden="true" />
                          {t.addressLocked}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {listing.landmarks.map((landmark) => {
                  const Icon = landmarkIcons[landmark.kind];
                  return (
                    <div
                      className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 p-4"
                      key={landmark.id}
                    >
                      <span className="grid size-10 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{landmark.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {landmark.distanceKm} km · {landmark.travelMinutes} {t.minutes}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title={t.rules}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {listing.rules.map((rule) => (
                  <li
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 p-4"
                    key={rule.id}
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{rule.label[locale]}</span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${
                        rule.allowed
                          ? "bg-emerald-50 dark:bg-emerald-950/35 text-emerald-700 dark:text-emerald-300"
                          : "bg-rose-50 dark:bg-rose-950/35 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {rule.allowed ? <Check size={13} /> : <X size={13} />}
                      {rule.allowed ? t.allowed : t.notAllowed}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={t.owner}>
              <div className="rounded-[1.5rem] border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-4">
                  <span className="grid size-14 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">
                    {listing.ownerName
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <p className="text-lg font-black text-slate-950 dark:text-slate-50">{listing.ownerName}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {t.ownerSince} {listing.ownerSince}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    [t.identityChecked, listing.verification.identity],
                    [t.propertyChecked, listing.verification.property],
                  ].map(([label, checked]) => (
                    <div
                      className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 p-4"
                      key={String(label)}
                    >
                      {checked ? (
                        <BadgeCheck className="text-emerald-600 dark:text-emerald-300" size={19} />
                      ) : (
                        <CircleHelp className="text-amber-600 dark:text-amber-300" size={19} />
                      )}
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {String(label)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  {t.checkedAt}: {formatDate(listing.verification.checkedAt)}
                </p>
              </div>
            </Section>

            <Section title={t.questions} body={t.questionsBody}>
              <div className="space-y-3">
                {listing.questions.map((item) => (
                  <article
                    className="rounded-[1.25rem] border border-slate-200 dark:border-slate-700 p-5"
                    key={item.id}
                  >
                    <p className="font-black text-slate-950 dark:text-slate-50">{item.question[locale]}</p>
                    {item.answer ? (
                      <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-950/35 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-blue-700 dark:text-blue-300">
                          {t.answered}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {item.answer[locale]}
                        </p>
                      </div>
                    ) : null}
                  </article>
                ))}
                {answeredQuestions.map((item) => (
                  <article
                    className="rounded-[1.25rem] border border-slate-200 dark:border-slate-700 p-5"
                    key={item.id}
                  >
                    <p className="font-black text-slate-950 dark:text-slate-50">
                      {item.question}
                    </p>
                    <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-950/35 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-blue-700 dark:text-blue-300">
                        {t.answered}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {item.answer}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              <form
                className="mt-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-5"
                onSubmit={submitQuestion}
              >
                <label className="text-sm font-black text-slate-800 dark:text-slate-200" htmlFor="question">
                  {t.askLabel}
                </label>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  id="question"
                  minLength={10}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={t.askPlaceholder}
                  required
                  value={question}
                />
                <button className="btn-primary mt-3 gap-2" type="submit">
                  <Send size={16} />
                  {t.askSubmit}
                </button>
              </form>
            </Section>
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block lg:py-11">
            <div className="rounded-[1.75rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,.35)]">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{t.startingFrom}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                {formatPrice(roomEffectivePrice(listing, initialRoom.price), locale)}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.perMonth}</p>
              <dl className="mt-6 space-y-3 border-y border-slate-100 dark:border-slate-800 py-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">{t.roomsAvailable}</dt>
                  <dd className="font-black text-emerald-700 dark:text-emerald-300">
                    {listing.availableRooms}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">{t.availableFrom}</dt>
                  <dd className="font-bold text-slate-900 dark:text-slate-100">
                    {formatDate(listing.availableFrom)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">{t.minimumStay}</dt>
                  <dd className="font-bold text-slate-900 dark:text-slate-100">
                    {listing.minimumStayMonths} {t.month}
                  </dd>
                </div>
              </dl>
              <button
                className="btn-primary mt-6 w-full gap-2"
                onClick={(event) => {
                  bookingTriggerRef.current = event.currentTarget;
                  openBooking();
                }}
                type="button"
              >
                <Send size={17} />
                {t.requestRental}
              </button>
              <p className="mt-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.prototypeLabel}
              </p>
            </div>
          </aside>
        </div>

        <section className="bg-[#f7faff] py-14 dark:bg-slate-950 sm:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="eyebrow">
              <Maximize2 size={15} />
              {t.similarReason}
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-4xl">
              {t.similar}
            </h2>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {related.map((item) => (
                <article
                  className="overflow-hidden rounded-[1.5rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_18px_55px_-40px_rgba(15,23,42,.4)]"
                  key={item.id}
                >
                  <div className="h-44">
                    <GalleryArtwork
                      compact
                      item={item.gallery[0]}
                      listing={item}
                      locale={locale}
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-black text-blue-700 dark:text-blue-300">
                      {shortTypeLabels[locale][item.type]}
                    </p>
                    <h3 className="mt-2 text-lg font-black text-slate-950 dark:text-slate-50">{item.name}</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {item.district}, {item.city}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <p className="font-black text-slate-950 dark:text-slate-50">
                        {formatPrice(item.price, locale)}
                      </p>
                      <Link
                        className="inline-flex items-center gap-1 text-sm font-black text-blue-700 dark:text-blue-300"
                        href={`/kos/${item.id}`}
                      >
                        {t.viewDetail}
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer
        className="locale-content border-t border-slate-200 dark:border-slate-700 bg-slate-950 text-white"
        data-locale-transition={transitionState}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div>
            <BrandMark inverse />
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              {t.footerTagline}
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">© 2026 Papikos. Prototype experience.</p>
        </div>
      </footer>

      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-950/95 p-3 backdrop-blur-xl transition lg:hidden ${
          mobileCtaVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }`}
        aria-hidden={!mobileCtaVisible}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">
              {t.startingFrom}
            </p>
            <p className="font-black text-slate-950 dark:text-slate-50">
              {formatPrice(roomEffectivePrice(listing, initialRoom.price), locale)}
            </p>
          </div>
          <button
            className="btn-primary shrink-0 gap-2"
            onClick={(event) => {
              bookingTriggerRef.current = event.currentTarget;
              openBooking();
            }}
            type="button"
          >
            <Send size={16} />
            {t.requestRental}
          </button>
        </div>
      </div>

      {bookingDialogState !== "closed" ? (
        <Dialog
          label={t.bookingTitle}
          motionState={bookingDialogState === "closing" ? "closing" : "open"}
          onClose={closeBooking}
        >
          {bookingSubmitted ? (
            <div className="p-6 text-center sm:p-8">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/45 text-emerald-700 dark:text-emerald-300">
                <Check size={28} strokeWidth={2.5} />
              </span>
              <h2 className="mt-5 text-2xl font-black text-slate-950 dark:text-slate-50">
                {t.bookingSuccessTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600 dark:text-slate-300">
                {t.bookingSuccessBody}
              </p>
              <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-800/70 p-4 text-left text-sm">
                <p className="font-black text-slate-900 dark:text-slate-100">
                  {existingBooking
                    ? listing.rooms.find((room) => room.id === existingBooking.roomId)?.name[
                        locale
                      ]
                    : bookingRoom.name[locale]}
                </p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  {t.pending} · {t.prototypeLabel}
                </p>
              </div>
              <button className="btn-primary mt-6 w-full" onClick={closeBooking} type="button">
                {t.close}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-5 border-b border-slate-100 dark:border-slate-800 p-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">{t.bookingTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t.bookingBody}</p>
                </div>
                <button
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  onClick={closeBooking}
                  type="button"
                  aria-label={t.close}
                >
                  <X size={18} />
                </button>
              </div>
              <form className="space-y-5 p-6" onSubmit={submitBooking}>
                <label className="grid gap-2 text-sm font-black text-slate-800 dark:text-slate-200">
                  {t.roomChoice}
                  <select
                    className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => setBookingRoomId(event.target.value)}
                    value={bookingRoomId}
                  >
                    {listing.rooms
                      .filter((room) => room.availableRooms > 0)
                      .map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name[locale]} —{" "}
                          {formatPrice(roomEffectivePrice(listing, room.price), locale)}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-black text-slate-800 dark:text-slate-200">
                    {t.moveIn}
                    <input
                      className="h-12 rounded-xl border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900"
                      min={listing.availableFrom}
                      onChange={(event) => setMoveInDate(event.target.value)}
                      required
                      type="date"
                      value={moveInDate}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-black text-slate-800 dark:text-slate-200">
                    {t.duration}
                    <select
                      className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) => setDuration(event.target.value)}
                      value={duration}
                    >
                      {[1, 3, 6, 12]
                        .filter((months) => months >= listing.minimumStayMonths)
                        .map((months) => (
                          <option key={months} value={months}>
                            {months} {t.month}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-black text-slate-800 dark:text-slate-200">
                  {t.note}
                  <textarea
                    className="min-h-24 resize-y rounded-xl border border-slate-200 bg-white p-3 font-normal outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900"
                    onChange={(event) => setBookingNote(event.target.value)}
                    placeholder={t.notePlaceholder}
                    value={bookingNote}
                  />
                </label>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/35 p-4 text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-black">
                    {formatPrice(roomEffectivePrice(listing, bookingRoom.price), locale)} /{" "}
                    {t.month}
                  </p>
                  <p className="mt-1 text-xs">{t.prototypeLabel}</p>
                </div>
                <button className="btn-primary w-full gap-2" type="submit">
                  <Send size={17} />
                  {t.submitRequest}
                </button>
              </form>
            </>
          )}
        </Dialog>
      ) : null}

      {explainedCostId ? (
        (() => {
          const cost = listing.costs.find((item) => item.id === explainedCostId);
          const explanation = costExplanationFor(explainedCostId, locale);
          const costPrice = cost?.included
            ? cost.id === "deposit"
              ? t.noCharge
              : t.included
            : cost?.amount
              ? `${formatPrice(cost.amount, locale)} / ${t.month}`
              : null;
          return (
            <Dialog
              label={t.costDialogTitle}
              onClose={() => setExplainedCostId(null)}
            >
              <div className="flex items-start justify-between gap-5 border-b border-slate-100 p-6 dark:border-slate-800">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                    {t.costDialogTitle}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-slate-50">
                    {explanation.title}
                  </h2>
                  {cost ? (
                    <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                      {costPrice ?? cost.note?.[locale] ?? t.costUnstated}
                    </p>
                  ) : null}
                </div>
                <button
                  aria-label={t.close}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800"
                  onClick={() => setExplainedCostId(null)}
                  type="button"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="p-6">
                {cost?.note && costPrice ? (
                  // The owner's own words come first: for a charge they added
                  // themselves this is the only real explanation there is, and
                  // everything below it is Papikos boilerplate. Skipped when
                  // the line above is already showing this same note in place
                  // of a price.
                  <p className="mb-4 rounded-xl bg-blue-50 p-4 text-sm leading-6 font-semibold text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                    {cost.note[locale]}
                  </p>
                ) : null}
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {explanation.body}
                </p>
                <ul className="mt-4 space-y-2">
                  {explanation.points.map((point) => (
                    <li
                      className="flex items-start gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300"
                      key={point}
                    >
                      <Check
                        size={15}
                        className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300"
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 rounded-xl bg-blue-50 p-4 text-xs leading-5 font-semibold text-blue-900 dark:bg-blue-950/35 dark:text-blue-100">
                  {costPaymentNotice[locale]}
                </p>
              </div>
            </Dialog>
          );
        })()
      ) : null}

      {reportOpen ? (
        <Dialog label={t.reportTitle} onClose={() => setReportOpen(false)}>
          <div className="flex items-start justify-between gap-5 border-b border-slate-100 dark:border-slate-800 p-6">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">{t.reportTitle}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t.reportBody}</p>
            </div>
            <button
              className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800"
              onClick={() => setReportOpen(false)}
              type="button"
              aria-label={t.close}
            >
              <X size={18} />
            </button>
          </div>
          <form className="space-y-5 p-6" onSubmit={submitReport}>
            <label className="grid gap-2 text-sm font-black text-slate-800 dark:text-slate-200">
              {t.reportReason}
              <select
                className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                onChange={(event) => setReportReason(event.target.value)}
                value={reportReason}
              >
                {Object.entries(t.reportOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-800 dark:text-slate-200">
              {t.reportDetails}
              <textarea
                className="min-h-28 resize-y rounded-xl border border-slate-200 bg-white p-3 font-normal outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900"
                minLength={10}
                onChange={(event) => setReportDetails(event.target.value)}
                placeholder={t.reportPlaceholder}
                required
                value={reportDetails}
              />
            </label>
            <button className="btn-primary w-full gap-2" type="submit">
              <Flag size={17} />
              {t.submitReport}
            </button>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              {reports.filter((report) => report.listingId === listing.id).length}{" "}
              {locale === "id" ? "laporan lokal sebelumnya" : "previous local reports"}
            </p>
          </form>
        </Dialog>
      ) : null}

      <div
        className={`fixed left-1/2 top-20 z-[120] -translate-x-1/2 rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white shadow-2xl transition ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </>
  );
}
