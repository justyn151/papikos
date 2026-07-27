"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  BedDouble,
  Bike,
  Building2,
  BusFront,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flag,
  GraduationCap,
  Heart,
  Hospital,
  MapPin,
  Maximize2,
  Navigation,
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
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { shortTypeLabels } from "@/features/home/copy";
import { formatPrice, rankListings, readStoredValue } from "@/features/home/home-utils";
import type { MatchReason, SurveyPreferences } from "@/features/home/types";

import { detailCopy } from "./detail-copy";
import type {
  BookingRequest,
  FacilityItem,
  GalleryCategory,
  GalleryItem,
  ListingDetail,
  ListingReport,
  Locale,
  SubmittedQuestion,
} from "./types";

const STORAGE_KEYS = {
  locale: "papikos.locale",
  favorites: "papikos.favorites",
  survey: "papikos.survey",
  bookings: "papikos.bookingRequests",
  questions: "papikos.listingQuestions",
  reports: "papikos.listingReports",
} as const;

const galleryIcons: Record<GalleryCategory, typeof BedDouble> = {
  room: BedDouble,
  bathroom: Bath,
  shared: UsersRound,
  exterior: Building2,
  neighborhood: MapPin,
};

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

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
        papi
        <span className={inverse ? "text-cyan-300" : "text-blue-600"}>kos</span>
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

function Dialog({
  children,
  label,
  onClose,
}: {
  children: ReactNode;
  label: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current
      ?.querySelector<HTMLElement>("button, select, input, textarea")
      ?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-end bg-slate-950/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        aria-label={label}
        aria-modal="true"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:max-w-xl sm:rounded-[2rem]"
        ref={panelRef}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
}

function PropertyArtwork({
  item,
  listing,
  locale,
  compact = false,
}: {
  item: GalleryItem;
  listing: ListingDetail;
  locale: Locale;
  compact?: boolean;
}) {
  const Icon = galleryIcons[item.category];
  const shift = (item.variant % 4) * 8;

  return (
    <div
      className={`property-artwork relative h-full min-h-36 overflow-hidden bg-gradient-to-br ${listing.tone}`}
      aria-label={item.label[locale]}
      role="img"
    >
      <span
        className="absolute rounded-full bg-white/10"
        style={{
          height: compact ? 90 : 190,
          right: `${-24 + shift}px`,
          top: `${-35 + shift / 2}px`,
          width: compact ? 90 : 190,
        }}
      />
      <span className="absolute -bottom-20 -left-12 size-56 rounded-full bg-cyan-100/15" />
      {item.category === "exterior" ? (
        <span className="absolute bottom-0 left-[14%] right-[14%] h-[68%] rounded-t-[2rem] border border-white/30 bg-white/15 backdrop-blur-sm">
          <span className="absolute inset-x-[12%] top-[18%] grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((window) => (
              <span
                className={`h-8 rounded-lg ${
                  window === 1 || window === 5 ? listing.accent : "bg-white/35"
                }`}
                key={window}
              />
            ))}
          </span>
        </span>
      ) : (
        <span className="absolute inset-[12%] rounded-[2rem] border border-white/30 bg-white/15 shadow-2xl backdrop-blur-sm">
          <span className="absolute bottom-[12%] left-[10%] h-[30%] w-[52%] rounded-xl bg-white/30" />
          <span
            className={`absolute bottom-[12%] right-[10%] h-[48%] w-[22%] rounded-xl ${listing.accent} opacity-80`}
          />
          <span className="absolute left-[10%] top-[14%] h-[12%] w-[35%] rounded-full bg-white/35" />
        </span>
      )}
      <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/25 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
        <Icon size={14} aria-hidden="true" />
        {item.label[locale]}
      </span>
    </div>
  );
}

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
    <section className="scroll-mt-28 border-t border-slate-200 py-9 sm:py-11" id={id}>
      <h2 className="text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
        {title}
      </h2>
      {body ? <p className="mt-2 max-w-2xl leading-7 text-slate-600">{body}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function matchReasonText(
  reason: MatchReason,
  locale: Locale,
  t: (typeof detailCopy)[Locale],
) {
  if (reason.kind === "amenities") {
    return `${reason.matched}/${reason.total} ${t.matchReasons.amenities}`;
  }
  return t.matchReasons[reason.kind];
}

export function ListingDetailPage({
  listing,
  related,
  returnTo,
}: {
  listing: ListingDetail;
  related: ListingDetail[];
  returnTo: string;
}) {
  const [locale, setLocale] = usePersistentState<Locale>(STORAGE_KEYS.locale, "id");
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>(
    STORAGE_KEYS.favorites,
    [],
  );
  const [survey] = usePersistentState<SurveyPreferences | null>(
    STORAGE_KEYS.survey,
    null,
  );
  const [bookings, setBookings] = usePersistentState<BookingRequest[]>(
    STORAGE_KEYS.bookings,
    [],
  );
  const [submittedQuestions, setSubmittedQuestions] = usePersistentState<
    SubmittedQuestion[]
  >(STORAGE_KEYS.questions, []);
  const [reports, setReports] = usePersistentState<ListingReport[]>(
    STORAGE_KEYS.reports,
    [],
  );
  const [selectedGallery, setSelectedGallery] = useState(0);
  const initialRoom =
    listing.rooms.find((room) => room.availableRooms > 0) ?? listing.rooms[0];
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoom.id);
  const [bookingOpen, setBookingOpen] = useState(false);
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
  const bookingTriggerRef = useRef<HTMLButtonElement | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const t = detailCopy[locale];
  const favorite = favoriteIds.includes(listing.id);
  const selectedRoom =
    listing.rooms.find((room) => room.id === selectedRoomId) ?? initialRoom;
  const listingQuestions = submittedQuestions.filter(
    (item) => item.listingId === listing.id,
  );
  const existingBooking = bookings.find((item) => item.listingId === listing.id);
  const match = useMemo(
    () => (survey ? rankListings([listing], survey)[0] : null),
    [listing, survey],
  );

  useEffect(() => {
    document.documentElement.lang = locale === "id" ? "id" : "en";
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.papikosReady = "true";
    return () => {
      delete document.documentElement.dataset.papikosReady;
    };
  }, []);

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

  const openBooking = (roomId = selectedRoomId) => {
    setSelectedRoomId(roomId);
    setBookingSubmitted(Boolean(existingBooking));
    setBookingOpen(true);
  };

  const submitBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const request: BookingRequest = {
      id: createId("booking"),
      listingId: listing.id,
      roomId: selectedRoomId,
      moveInDate,
      durationMonths: Number(duration),
      note: bookingNote.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setBookings((current) => [
      ...current.filter((item) => item.listingId !== listing.id),
      request,
    ]);
    setBookingSubmitted(true);
  };

  const closeBooking = () => {
    setBookingOpen(false);
    window.setTimeout(() => bookingTriggerRef.current?.focus(), 0);
  };

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

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            className="rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
            href="/"
          >
            <BrandMark />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle locale={locale} onChange={setLocale} label={t.language} />
            <button
              className="btn-secondary"
              onClick={() =>
                announce(
                  locale === "id"
                    ? "Masuk akan hadir pada prototipe akun."
                    : "Sign in will arrive with the account prototype.",
                )
              }
              type="button"
            >
              {t.login}
            </button>
          </div>
        </div>
      </header>

      <main className="pb-24 lg:pb-0" id="main-content">
        <div className="mx-auto max-w-7xl px-5 pb-5 pt-6 sm:px-8 sm:pt-8">
          <Link
            className="inline-flex items-center gap-2 rounded-lg text-sm font-bold text-slate-600 transition hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            href={returnTo}
          >
            <ArrowLeft size={17} aria-hidden="true" />
            {t.back}
          </Link>
        </div>

        <section className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-3 lg:grid-cols-[1.65fr_.85fr]">
            <div className="min-h-[320px] overflow-hidden rounded-[1.75rem] sm:min-h-[460px]">
              <PropertyArtwork
                item={listing.gallery[selectedGallery]}
                listing={listing}
                locale={locale}
              />
            </div>
            <div className="grid grid-cols-4 gap-3 overflow-x-auto lg:grid-cols-2">
              {listing.gallery.slice(1).map((item, index) => {
                const itemIndex = index + 1;
                return (
                  <button
                    className={`min-w-32 overflow-hidden rounded-2xl border-2 transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      selectedGallery === itemIndex
                        ? "border-blue-600"
                        : "border-transparent hover:border-blue-200"
                    }`}
                    key={item.id}
                    onClick={() => setSelectedGallery(itemIndex)}
                    type="button"
                    aria-label={item.label[locale]}
                    aria-pressed={selectedGallery === itemIndex}
                  >
                    <PropertyArtwork
                      compact
                      item={item}
                      listing={listing}
                      locale={locale}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-600">
              {listing.gallery[selectedGallery].label[locale]} · {selectedGallery + 1}/
              {listing.gallery.length}
            </p>
            <div className="flex gap-2">
              <button
                className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                onClick={() =>
                  setSelectedGallery((current) =>
                    current === 0 ? listing.gallery.length - 1 : current - 1,
                  )
                }
                type="button"
                aria-label="Previous image"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                onClick={() =>
                  setSelectedGallery((current) =>
                    current === listing.gallery.length - 1 ? 0 : current + 1,
                  )
                }
                type="button"
                aria-label="Next image"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className="contour-surface mt-7 border-y border-slate-100 bg-white">
          <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
            <div
              className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"
              ref={summaryRef}
            >
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                    {shortTypeLabels[locale][listing.type]}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-black ${
                      listing.verified ? "text-emerald-700" : "text-amber-700"
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
                <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-[-0.05em] text-slate-950 sm:text-5xl">
                  {listing.name}
                </h1>
                <p className="mt-4 flex items-center gap-2 text-slate-600">
                  <MapPin size={18} className="text-blue-600" aria-hidden="true" />
                  {listing.approximateArea}
                </p>
                <p className="mt-2 text-sm text-slate-500">
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
              <p className="max-w-3xl text-lg leading-8 text-slate-700">
                {listing.description[locale]}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  [CalendarDays, t.availableFrom, formatDate(listing.availableFrom)],
                  [Clock3, t.minimumStay, `${listing.minimumStayMonths} ${t.month}`],
                  [BedDouble, t.roomsAvailable, String(listing.availableRooms)],
                ].map(([Icon, label, value]) => (
                  <div
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    key={String(label)}
                  >
                    <Icon className="text-blue-600" size={20} aria-hidden="true" />
                    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {String(label)}
                    </p>
                    <p className="mt-1 font-black text-slate-950">{String(value)}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="rooms" title={t.rooms} body={t.roomsBody}>
              <div className="space-y-4">
                {listing.rooms.map((room) => {
                  const isSelected = room.id === selectedRoomId;
                  const available = room.availableRooms > 0;
                  return (
                    <article
                      className={`rounded-[1.5rem] border p-5 transition sm:p-6 ${
                        isSelected
                          ? "border-blue-300 bg-blue-50/55 shadow-[0_16px_45px_-34px_rgba(37,99,235,.5)]"
                          : "border-slate-200 bg-white"
                      }`}
                      key={room.id}
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black text-slate-950">
                              {room.name[locale]}
                            </h3>
                            {isSelected ? (
                              <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-black text-white">
                                {t.selected}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm font-semibold text-slate-500">
                            {room.size} ·{" "}
                            {room.bathroom === "private"
                              ? t.privateBathroom
                              : t.sharedBathroom}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {room.furnishings.map((item) => (
                              <span
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600"
                                key={item.en}
                              >
                                {item[locale]}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="shrink-0 sm:text-right">
                          <p className="text-xl font-black text-slate-950">
                            {formatPrice(room.price, locale)}
                          </p>
                          <p
                            className={`mt-1 text-xs font-bold ${
                              available ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            {available
                              ? `${room.availableRooms} ${t.roomsAvailable}`
                              : t.unavailable}
                          </p>
                          <button
                            className={`mt-4 rounded-full px-4 py-2.5 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                              available
                                ? "bg-slate-950 text-white hover:bg-blue-600"
                                : "cursor-not-allowed bg-slate-100 text-slate-400"
                            }`}
                            disabled={!available}
                            onClick={(event) => {
                              bookingTriggerRef.current = event.currentTarget;
                              setSelectedRoomId(room.id);
                              openBooking(room.id);
                            }}
                            type="button"
                          >
                            {available ? t.chooseRoom : t.unavailable}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Section>

            <Section title={t.costs} body={t.costsBody}>
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                <div className="flex items-center justify-between gap-4 bg-slate-950 px-5 py-4 text-white">
                  <span className="inline-flex items-center gap-2 font-black">
                    <WalletCards size={19} aria-hidden="true" />
                    {selectedRoom.name[locale]}
                  </span>
                  <span className="font-black">
                    {formatPrice(selectedRoom.price, locale)}
                  </span>
                </div>
                <dl className="divide-y divide-slate-100 bg-white">
                  {listing.costs.map((cost) => (
                    <div
                      className="flex items-center justify-between gap-5 px-5 py-4"
                      key={cost.id}
                    >
                      <div>
                        <dt className="font-bold text-slate-800">{cost.label[locale]}</dt>
                        {cost.note ? (
                          <dd className="mt-1 text-xs text-slate-500">
                            {cost.note[locale]}
                          </dd>
                        ) : null}
                      </div>
                      <dd
                        className={`shrink-0 text-sm font-black ${
                          cost.included ? "text-emerald-700" : "text-slate-700"
                        }`}
                      >
                        {cost.included
                          ? cost.id === "deposit"
                            ? t.noCharge
                            : t.included
                          : cost.amount
                            ? `${formatPrice(cost.amount, locale)} / ${t.month}`
                            : cost.note?.[locale]}
                      </dd>
                    </div>
                  ))}
                </dl>
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
                      className="rounded-[1.35rem] border border-slate-200 p-5"
                      key={category}
                    >
                      <h3 className="flex items-center gap-2 font-black text-slate-950">
                        <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                          <Icon size={17} aria-hidden="true" />
                        </span>
                        {t.facilityGroups[category]}
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {items.map((item) => (
                          <li
                            className="flex items-center gap-2 text-sm text-slate-600"
                            key={item.id}
                          >
                            <Check size={15} className="text-emerald-600" />
                            {item.label[locale]}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title={match ? t.matchTitle : t.matchEmptyTitle}>
              {match ? (
                <div className="rounded-[1.75rem] bg-blue-600 p-6 text-white sm:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="inline-flex items-center gap-2 text-sm font-black text-blue-100">
                        <Sparkles size={17} />
                        {t.matchBody}
                      </p>
                      <p className="mt-3 text-4xl font-black">{match.score}%</p>
                    </div>
                    <ul className="space-y-2">
                      {match.reasons.map((reason) => (
                        <li
                          className="flex items-center gap-2 text-sm font-bold"
                          key={reason.kind}
                        >
                          <Check size={16} />
                          {matchReasonText(reason, locale, t)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl leading-7 text-slate-600">{t.matchEmptyBody}</p>
                  <Link className="btn-primary shrink-0 gap-2" href="/#preference-survey">
                    <Sparkles size={17} />
                    {t.takeSurvey}
                  </Link>
                </div>
              )}
            </Section>

            <Section title={t.location}>
              <div className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-blue-50/70">
                <div className="relative h-72 overflow-hidden">
                  <div className="detail-map-grid absolute inset-0" aria-hidden="true" />
                  <div className="absolute left-[7%] top-[35%] h-3 w-[90%] -rotate-6 rounded-full bg-white" />
                  <div className="absolute left-[48%] top-[-15%] h-[135%] w-3 rotate-12 rounded-full bg-white" />
                  <div className="absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300 bg-blue-200/35">
                    <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-blue-600 text-white shadow-xl">
                      <Navigation size={19} fill="currentColor" />
                    </span>
                  </div>
                  <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-slate-800 shadow-lg backdrop-blur">
                    {t.approximate}: {listing.approximateArea}
                  </span>
                </div>
                <div className="border-t border-blue-100 bg-white p-5">
                  <p className="text-sm leading-6 text-slate-600">
                    {t.privacy.replace("{radius}", String(listing.privacyRadiusMeters))}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {listing.landmarks.map((landmark) => {
                  const Icon = landmarkIcons[landmark.kind];
                  return (
                    <div
                      className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4"
                      key={landmark.id}
                    >
                      <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{landmark.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
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
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
                    key={rule.id}
                  >
                    <span className="font-semibold text-slate-700">{rule.label[locale]}</span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${
                        rule.allowed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
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
              <div className="rounded-[1.5rem] border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <span className="grid size-14 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">
                    {listing.ownerName
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <p className="text-lg font-black text-slate-950">{listing.ownerName}</p>
                    <p className="mt-1 text-sm text-slate-500">
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
                      className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"
                      key={String(label)}
                    >
                      {checked ? (
                        <BadgeCheck className="text-emerald-600" size={19} />
                      ) : (
                        <CircleHelp className="text-amber-600" size={19} />
                      )}
                      <span className="text-sm font-bold text-slate-700">
                        {String(label)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  {t.checkedAt}: {formatDate(listing.verification.checkedAt)}
                </p>
              </div>
            </Section>

            <Section title={t.questions} body={t.questionsBody}>
              <div className="space-y-3">
                {listing.questions.map((item) => (
                  <article
                    className="rounded-[1.25rem] border border-slate-200 p-5"
                    key={item.id}
                  >
                    <p className="font-black text-slate-950">{item.question[locale]}</p>
                    {item.answer ? (
                      <div className="mt-4 rounded-xl bg-blue-50 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                          {t.answered}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {item.answer[locale]}
                        </p>
                      </div>
                    ) : null}
                  </article>
                ))}
                {listingQuestions.map((item) => (
                  <article
                    className="rounded-[1.25rem] border border-dashed border-amber-300 bg-amber-50/50 p-5"
                    key={item.id}
                  >
                    <p className="font-black text-slate-950">{item.question}</p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-amber-700">
                      <Clock3 size={14} />
                      {t.pending}
                    </p>
                  </article>
                ))}
              </div>
              <form
                className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                onSubmit={submitQuestion}
              >
                <label className="text-sm font-black text-slate-800" htmlFor="question">
                  {t.askLabel}
                </label>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,.35)]">
              <p className="text-sm font-bold text-slate-500">{selectedRoom.name[locale]}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                {formatPrice(selectedRoom.price, locale)}
              </p>
              <p className="mt-1 text-sm text-slate-500">{t.perMonth}</p>
              <dl className="mt-6 space-y-3 border-y border-slate-100 py-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t.roomsAvailable}</dt>
                  <dd className="font-black text-emerald-700">
                    {selectedRoom.availableRooms}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t.availableFrom}</dt>
                  <dd className="font-bold text-slate-900">
                    {formatDate(listing.availableFrom)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t.minimumStay}</dt>
                  <dd className="font-bold text-slate-900">
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
              <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                {t.prototypeLabel}
              </p>
            </div>
          </aside>
        </div>

        <section className="bg-[#f7faff] py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="eyebrow">
              <Maximize2 size={15} />
              {t.similarReason}
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
              {t.similar}
            </h2>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {related.map((item) => (
                <article
                  className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_18px_55px_-40px_rgba(15,23,42,.4)]"
                  key={item.id}
                >
                  <div className="h-44">
                    <PropertyArtwork
                      compact
                      item={item.gallery[0]}
                      listing={item}
                      locale={locale}
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-black text-blue-700">
                      {shortTypeLabels[locale][item.type]}
                    </p>
                    <h3 className="mt-2 text-lg font-black text-slate-950">{item.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {item.district}, {item.city}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <p className="font-black text-slate-950">
                        {formatPrice(item.price, locale)}
                      </p>
                      <Link
                        className="inline-flex items-center gap-1 text-sm font-black text-blue-700"
                        href={`/kos/${item.id}?from=${encodeURIComponent(returnTo)}`}
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

      <footer className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div>
            <BrandMark inverse />
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              {t.footerTagline}
            </p>
          </div>
          <p className="text-xs text-slate-500">© 2026 Papikos. Prototype experience.</p>
        </div>
      </footer>

      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-xl transition lg:hidden ${
          mobileCtaVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }`}
        aria-hidden={!mobileCtaVisible}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-500">
              {selectedRoom.name[locale]}
            </p>
            <p className="font-black text-slate-950">
              {formatPrice(selectedRoom.price, locale)}
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

      {bookingOpen ? (
        <Dialog label={t.bookingTitle} onClose={closeBooking}>
          {bookingSubmitted ? (
            <div className="p-6 text-center sm:p-8">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Check size={28} strokeWidth={2.5} />
              </span>
              <h2 className="mt-5 text-2xl font-black text-slate-950">
                {t.bookingSuccessTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
                {t.bookingSuccessBody}
              </p>
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left text-sm">
                <p className="font-black text-slate-900">
                  {existingBooking
                    ? listing.rooms.find((room) => room.id === existingBooking.roomId)?.name[
                        locale
                      ]
                    : selectedRoom.name[locale]}
                </p>
                <p className="mt-1 text-slate-500">
                  {t.pending} · {t.prototypeLabel}
                </p>
              </div>
              <button className="btn-primary mt-6 w-full" onClick={closeBooking} type="button">
                {t.close}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-5 border-b border-slate-100 p-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">{t.bookingTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t.bookingBody}</p>
                </div>
                <button
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"
                  onClick={closeBooking}
                  type="button"
                  aria-label={t.close}
                >
                  <X size={18} />
                </button>
              </div>
              <form className="space-y-5 p-6" onSubmit={submitBooking}>
                <label className="grid gap-2 text-sm font-black text-slate-800">
                  {t.roomChoice}
                  <select
                    className="h-12 rounded-xl border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => setSelectedRoomId(event.target.value)}
                    value={selectedRoomId}
                  >
                    {listing.rooms
                      .filter((room) => room.availableRooms > 0)
                      .map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name[locale]} — {formatPrice(room.price, locale)}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-black text-slate-800">
                    {t.moveIn}
                    <input
                      className="h-12 rounded-xl border border-slate-200 px-3 font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      min={listing.availableFrom}
                      onChange={(event) => setMoveInDate(event.target.value)}
                      required
                      type="date"
                      value={moveInDate}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-black text-slate-800">
                    {t.duration}
                    <select
                      className="h-12 rounded-xl border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                <label className="grid gap-2 text-sm font-black text-slate-800">
                  {t.note}
                  <textarea
                    className="min-h-24 resize-y rounded-xl border border-slate-200 p-3 font-normal outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => setBookingNote(event.target.value)}
                    placeholder={t.notePlaceholder}
                    value={bookingNote}
                  />
                </label>
                <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-black">
                    {formatPrice(selectedRoom.price, locale)} / {t.month}
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

      {reportOpen ? (
        <Dialog label={t.reportTitle} onClose={() => setReportOpen(false)}>
          <div className="flex items-start justify-between gap-5 border-b border-slate-100 p-6">
            <div>
              <h2 className="text-2xl font-black text-slate-950">{t.reportTitle}</h2>
              <p className="mt-2 text-sm text-slate-600">{t.reportBody}</p>
            </div>
            <button
              className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100"
              onClick={() => setReportOpen(false)}
              type="button"
              aria-label={t.close}
            >
              <X size={18} />
            </button>
          </div>
          <form className="space-y-5 p-6" onSubmit={submitReport}>
            <label className="grid gap-2 text-sm font-black text-slate-800">
              {t.reportReason}
              <select
                className="h-12 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            <label className="grid gap-2 text-sm font-black text-slate-800">
              {t.reportDetails}
              <textarea
                className="min-h-28 resize-y rounded-xl border border-slate-200 p-3 font-normal outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            <p className="text-center text-xs text-slate-500">
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
