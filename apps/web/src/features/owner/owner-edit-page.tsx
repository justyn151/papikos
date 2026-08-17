"use client";

import {
  ArrowLeft,
  ImagePlus,
  Plus,
  RotateCcw,
  Save,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, type FormEvent, useState } from "react";

import { amenityLabels, typeLabels } from "@/features/home/copy";
import { discountedPrice, formatPrice } from "@/features/home/home-utils";
import { detailCopy } from "@/features/listings/detail-copy";
import {
  galleryCategories,
  galleryCategoryLabels,
} from "@/features/listings/gallery-categories";
import { amenitiesByCategory } from "@/features/listings/mock-listings";
import type {
  Amenity,
  GalleryCategory,
  ListingDetail,
  ListingOverride,
  ListingPhoto,
  ListingType,
  LocalizedText,
} from "@/features/listings/types";
import { ConsoleShell } from "@/features/navigation/console-shell";
import { resolveListingDetail } from "@/features/prototype-data/resolve-listing";
import {
  useAuditLog,
  useBookings,
  useOverrides,
} from "@/features/prototype-data/store";
import { createId } from "@/features/shared/create-id";

import { ownerCopy } from "./owner-copy";
import { ownerNavItems } from "./owner-nav";
import {
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  PhotoUploadError,
  acceptPhotos,
  promoteCover,
  readPhotoFile,
  removePhoto,
  totalBytes,
} from "./photo-upload";

const field =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950";
const label =
  "grid gap-1.5 text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400";
const card =
  "rounded-[1.25rem] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900";
const hint = "mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400";

/**
 * Room and cost text is held as a translation pair so the form can render in
 * either language, but an owner typing a name sets it for both: they write one
 * room name, not a translation pair. Text left untouched keeps the seeded pair,
 * which is what stops an edit from flattening a bilingual listing.
 */
interface DraftRoom {
  id: string;
  name: LocalizedText;
  size: string;
  price: string;
  availableRooms: string;
  bathroom: "private" | "shared";
  furnishings: LocalizedText[];
}

interface DraftCost {
  id: string;
  label: LocalizedText;
  amount: string;
  included: boolean;
  /** Why the charge exists. Owner-added rows have no seeded copy to fall back on. */
  note: LocalizedText | null;
  /** Seeded rows are stored as a patch; the owner's own rows are stored whole. */
  seeded: boolean;
}

interface Draft {
  name: string;
  city: string;
  district: string;
  type: ListingType;
  description: string;
  discountPercent: string;
  availableFrom: string;
  minimumStayMonths: string;
  approximateArea: string;
  privacyRadiusMeters: string;
  amenities: Amenity[];
  photos: ListingPhoto[];
  rooms: DraftRoom[];
  rules: { id: string; allowed: boolean }[];
  customRules: { id: string; label: string; allowed: boolean }[];
  costs: DraftCost[];
  /** Seeded cost rows the owner removed, kept so the save can tombstone them. */
  removedCosts: string[];
}

/**
 * The editor is a form with eight groups of fields, which as one page was a
 * wall an owner had to read past to change a price. They are the same groups,
 * shown one at a time.
 */
type SectionId =
  | "basics"
  | "rooms"
  | "photos"
  | "facilities"
  | "costs"
  | "availability";

function ownText(value: string): LocalizedText {
  return { id: value, en: value };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The headline price is the cheapest room, never a number of its own. */
function cheapestRoomPrice(rooms: DraftRoom[]): number {
  const prices = rooms.map((room) => Number(room.price) || 0);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

function toDraft(
  listing: ListingDetail,
  seed: ListingDetail,
  override: ListingOverride | undefined,
): Draft {
  // `listing.rules` already has the owner's custom rules appended, so the
  // standard checkboxes are matched back against the seeded set by id.
  const seededRuleIds = new Set(seed.rules.map((rule) => rule.id));
  const seededCostIds = new Set(seed.costs.map((cost) => cost.id));

  return {
    photos: override?.photos ?? [],
    customRules: (override?.customRules ?? []).map((rule) => ({ ...rule })),
    name: listing.name,
    city: listing.city,
    district: listing.district,
    type: listing.type,
    description: listing.description.id,
    discountPercent:
      override?.discountPercent != null
        ? String(override.discountPercent)
        : seededDiscount(seed),
    availableFrom: listing.availableFrom,
    minimumStayMonths: String(listing.minimumStayMonths),
    approximateArea: listing.approximateArea,
    privacyRadiusMeters: String(listing.privacyRadiusMeters),
    amenities: [...listing.amenities],
    rooms: listing.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      size: room.size,
      price: String(room.price),
      availableRooms: String(room.availableRooms),
      bathroom: room.bathroom,
      furnishings: room.furnishings,
    })),
    rules: listing.rules
      .filter((rule) => seededRuleIds.has(rule.id))
      .map((rule) => ({ id: rule.id, allowed: rule.allowed })),
    costs: listing.costs.map((cost) => ({
      id: cost.id,
      label: cost.label,
      amount: cost.amount === null ? "" : String(cost.amount),
      included: cost.included,
      note: cost.note ?? null,
      seeded: seededCostIds.has(cost.id),
    })),
    removedCosts: [],
  };
}

/**
 * A seeded listing stores a discounted price rather than the percentage behind
 * it, so the form starts from the percentage that price implies.
 */
function seededDiscount(seed: ListingDetail): string {
  if (seed.promoPrice === null || seed.promoPrice >= seed.price) return "";
  return String(
    Math.round(((seed.price - seed.promoPrice) / seed.price) * 100),
  );
}

export function OwnerEditPage({ listing: seed }: { listing: ListingDetail }) {
  const { overrideFor, replace, clear, writeError } = useOverrides();
  const { append } = useAuditLog();
  const { bookings } = useBookings();
  const override = overrideFor(seed.id);
  const listing = resolveListingDetail(seed, override);

  const [draft, setDraft] = useState<Draft>(() =>
    toDraft(listing, seed, override),
  );

  // The store reads browser storage after hydration, so the first render of an
  // already-edited kos sees no override at all. Without this the form would
  // show the seeded kos, and saving would overwrite the owner's earlier edits
  // with data they never typed.
  const stamp = override?.updatedAt ?? "seed";
  const [loadedStamp, setLoadedStamp] = useState(stamp);
  if (loadedStamp !== stamp) {
    setLoadedStamp(stamp);
    setDraft(toDraft(listing, seed, override));
  }

  const [toast, setToast] = useState("");
  const [section, setSection] = useState<SectionId>("basics");
  // The error carries the section it belongs to, so saving from one tab can
  // take the owner to the field that actually blocked it.
  const [error, setError] = useState<{ section: SectionId; message: string } | null>(
    null,
  );
  const [photoError, setPhotoError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [ruleError, setRuleError] = useState("");
  const [newCost, setNewCost] = useState("");
  const [costError, setCostError] = useState("");
  const [roomError, setRoomError] = useState("");

  const edited = Boolean(override);

  // A room with a request still in play cannot be deleted: the request stores
  // the room id, and removing it would leave the renter's record, the owner's
  // inbox, and the earnings report pointing at a room that no longer exists.
  const bookedRoomIds = new Set(
    bookings
      .filter(
        (booking) =>
          booking.listingId === seed.id &&
          (booking.status === "pending" || booking.status === "approved"),
      )
      .map((booking) => booking.roomId),
  );

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  return (
    <ConsoleShell
      activeId="listings"
      areaLabel={(locale) => ownerCopy[locale].area}
      items={(locale) => ownerNavItems(locale)}
      toast={toast}
    >
      {(locale) => {
        const t = ownerCopy[locale];
        const price = cheapestRoomPrice(draft.rooms);
        // Counts on the tabs so an owner can see what a section holds without
        // opening it — an empty photo tab is worth noticing from here.
        const sections: { id: SectionId; label: string; count?: number }[] = [
          { id: "basics", label: t.tabBasics },
          { id: "rooms", label: t.tabRooms, count: draft.rooms.length },
          { id: "photos", label: t.tabPhotos, count: draft.photos.length },
          {
            id: "facilities",
            label: t.tabFacilities,
            count: draft.amenities.length,
          },
          { id: "costs", label: t.tabCosts, count: draft.costs.length },
          { id: "availability", label: t.tabAvailability },
        ];
        const percent = draft.discountPercent === "" ? null : Number(draft.discountPercent);

        const save = (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();

          const fail = (id: SectionId, message: string) => {
            // Showing "the name cannot be empty" while the owner is looking at
            // the photo tab would be a dead end, so the editor goes there.
            setSection(id);
            setError({ section: id, message });
          };

          if (!draft.name.trim()) return fail("basics", t.nameRequired);
          if (!draft.city.trim()) return fail("basics", t.cityRequired);
          if (!draft.district.trim()) return fail("basics", t.districtRequired);
          if (draft.rooms.length === 0) return fail("rooms", t.roomsMinimum);
          if (draft.rooms.some((room) => !(Number(room.price) > 0))) {
            return fail("rooms", t.roomPriceInvalid);
          }
          // A discount outside this range is either not a discount at all or a
          // typo that would wipe out the rent.
          if (percent !== null && !(percent >= 1 && percent <= 90)) {
            return fail("basics", t.discountInvalid);
          }
          setError(null);

          const next: ListingOverride = {
            listingId: seed.id,
            name: draft.name.trim(),
            city: draft.city.trim(),
            district: draft.district.trim(),
            type: draft.type,
            description: draft.description.trim(),
            approximateArea: draft.approximateArea.trim(),
            privacyRadiusMeters: Math.max(
              0,
              Number(draft.privacyRadiusMeters) || 0,
            ),
            availableFrom: draft.availableFrom,
            minimumStayMonths: Math.max(1, Number(draft.minimumStayMonths) || 1),
            // Both prices are derived: the headline follows the cheapest room,
            // and the promo follows the percentage the owner chose.
            price,
            discountPercent: percent,
            promoPrice: percent ? discountedPrice(price, percent) : null,
            amenities: draft.amenities,
            photos: draft.photos,
            rooms: draft.rooms.map((room) => ({
              id: room.id,
              name: room.name.id,
              size: room.size.trim(),
              price: Number(room.price),
              availableRooms: Math.max(0, Number(room.availableRooms) || 0),
              bathroom: room.bathroom,
              furnishings: room.furnishings.map((item) => item.id),
            })),
            rules: draft.rules,
            customRules: draft.customRules,
            costs: [
              ...draft.costs
                .filter((cost) => cost.seeded)
                .map((cost) => ({
                  id: cost.id,
                  amount: cost.amount === "" ? null : Number(cost.amount),
                  included: cost.included,
                  note: cost.note?.id ?? "",
                })),
              ...draft.removedCosts.map((id) => ({
                id,
                amount: null,
                included: false,
                removed: true,
              })),
            ],
            customCosts: draft.costs
              .filter((cost) => !cost.seeded)
              .map((cost) => ({
                id: cost.id,
                label: cost.label.id,
                amount: cost.amount === "" ? null : Number(cost.amount),
                included: cost.included,
                note: cost.note?.id ?? "",
              })),
            updatedAt: new Date().toISOString(),
          };

          replace(next);
          append({
            id: createId("audit"),
            actor: "owner",
            action: "listing.edited",
            targetId: seed.id,
            at: next.updatedAt,
          });
          announce(t.saved);
        };

        const reset = () => {
          clear(seed.id);
          setDraft(toDraft(seed, seed, undefined));
          setError(null);
          setSection("basics");
          setPhotoError("");
          setRuleError("");
          setCostError("");
          setRoomError("");
          setNewRule("");
          setNewCost("");
          announce(t.resetDone);
        };

        const addRoom = () => {
          setRoomError("");
          setDraft((d) => ({
            ...d,
            rooms: [
              ...d.rooms,
              {
                id: createId("room"),
                name: ownText(t.roomNewName),
                size: t.roomNewSize,
                price: String(cheapestRoomPrice(d.rooms) || ""),
                availableRooms: "1",
                bathroom: "shared",
                furnishings: [],
              },
            ],
          }));
        };

        const removeRoom = (roomId: string) => {
          if (draft.rooms.length === 1) {
            setRoomError(t.roomsMinimum);
            return;
          }
          if (bookedRoomIds.has(roomId)) {
            setRoomError(t.roomBooked);
            return;
          }
          setRoomError("");
          setDraft((d) => ({
            ...d,
            rooms: d.rooms.filter((room) => room.id !== roomId),
          }));
        };

        const editRoom = (roomId: string, patch: Partial<DraftRoom>) =>
          setDraft((d) => ({
            ...d,
            rooms: d.rooms.map((room) =>
              room.id === roomId ? { ...room, ...patch } : room,
            ),
          }));

        const addCustomRule = () => {
          const text = newRule.trim();
          if (!text) {
            setRuleError(t.ruleEmptyError);
            return;
          }
          setRuleError("");
          setNewRule("");
          setDraft((d) => ({
            ...d,
            customRules: [
              ...d.customRules,
              { id: createId("rule"), label: text, allowed: false },
            ],
          }));
        };

        const addCustomCost = () => {
          const text = newCost.trim();
          if (!text) {
            setCostError(t.costEmptyError);
            return;
          }
          setCostError("");
          setNewCost("");
          setDraft((d) => ({
            ...d,
            costs: [
              ...d.costs,
              {
                id: createId("cost"),
                label: ownText(text),
                amount: "",
                included: false,
                note: null,
                seeded: false,
              },
            ],
          }));
        };

        const removeCost = (cost: DraftCost) =>
          setDraft((d) => ({
            ...d,
            costs: d.costs.filter((item) => item.id !== cost.id),
            removedCosts: cost.seeded
              ? [...d.removedCosts, cost.id]
              : d.removedCosts,
          }));

        const editCost = (costId: string, patch: Partial<DraftCost>) =>
          setDraft((d) => ({
            ...d,
            costs: d.costs.map((cost) =>
              cost.id === costId ? { ...cost, ...patch } : cost,
            ),
          }));

        const addPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
          const picked = Array.from(event.target.files ?? []);
          // The same file can be picked twice in a row, and the input would
          // not fire a second change event without this.
          event.target.value = "";
          if (picked.length === 0) return;

          setPhotoError("");
          setUploading(true);
          const read: ListingPhoto[] = [];
          let failure = "";

          for (const file of picked) {
            try {
              read.push(await readPhotoFile(file));
            } catch (uploadError) {
              const reason =
                uploadError instanceof PhotoUploadError
                  ? uploadError.reason
                  : "read";
              failure = reason === "type" ? t.photoErrorType : t.photoErrorRead;
            }
          }

          // Photo controls are disabled while uploading, so the set captured at
          // call time is still the current one.
          const result = acceptPhotos(draft.photos, read);
          if (result.rejectedCap > 0) {
            failure = t.photoErrorCap.replace("{max}", String(MAX_PHOTOS));
          }
          if (result.rejectedBudget > 0) {
            failure = t.photoErrorBudget.replace(
              "{count}",
              String(result.rejectedBudget),
            );
          }

          setDraft((d) => ({ ...d, photos: result.photos }));
          setPhotoError(failure);
          setUploading(false);
        };

        return (
          <>
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300"
              href="/pemilik/kos"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              {t.backToListings}
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
                {t.editTitle}
              </h1>
              {edited ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                  {t.edited}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t.editBody}
            </p>

            <nav
              aria-label={t.editSections}
              className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-900"
            >
              {sections.map((item) => {
                const active = section === item.id;
                return (
                  <button
                    aria-current={active}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    type="button"
                  >
                    {item.label}
                    {item.count === undefined ? null : (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[0.7rem] font-black ${
                          active
                            ? "bg-white/25 text-white"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <form className="mt-5 grid gap-5" onSubmit={save}>
            {section === "basics" ? (
              <section className={card}>
                <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                  {t.basics}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className={label}>
                    {t.fieldName}
                    <input
                      className={field}
                      onChange={(event) =>
                        setDraft((d) => ({ ...d, name: event.target.value }))
                      }
                      value={draft.name}
                    />
                  </label>
                  <label className={label}>
                    {t.fieldType}
                    <select
                      className={field}
                      onChange={(event) =>
                        setDraft((d) => ({
                          ...d,
                          type: event.target.value as ListingType,
                        }))
                      }
                      value={draft.type}
                    >
                      {(["putra", "putri", "campur"] as const).map((type) => (
                        <option key={type} value={type}>
                          {typeLabels[locale][type]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={label}>
                    {t.fieldCity}
                    <input
                      className={field}
                      onChange={(event) =>
                        setDraft((d) => ({ ...d, city: event.target.value }))
                      }
                      value={draft.city}
                    />
                  </label>
                  <label className={label}>
                    {t.fieldDistrict}
                    <input
                      className={field}
                      onChange={(event) =>
                        setDraft((d) => ({ ...d, district: event.target.value }))
                      }
                      value={draft.district}
                    />
                  </label>
                  <div className={label}>
                    {t.fieldPrice}
                    <p className="flex h-11 items-center rounded-xl bg-slate-50 px-3 text-sm font-black normal-case tracking-normal text-slate-900 dark:bg-slate-800/60 dark:text-slate-100">
                      {formatPrice(price, locale)}
                    </p>
                    <span className="text-xs font-semibold normal-case tracking-normal text-slate-500 dark:text-slate-400">
                      {t.priceDerived}
                    </span>
                  </div>
                  {/* The hint sits outside the label so it does not become
                      part of the field's accessible name. */}
                  <div className="grid gap-1.5">
                    <label className={label}>
                      {t.fieldDiscount}
                      <input
                        className={field}
                        inputMode="numeric"
                        onChange={(event) =>
                          setDraft((d) => ({
                            ...d,
                            discountPercent: event.target.value,
                          }))
                        }
                        type="number"
                        value={draft.discountPercent}
                      />
                    </label>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {percent && percent > 0 && percent <= 90
                        ? t.discountResult.replace(
                            "{price}",
                            formatPrice(discountedPrice(price, percent), locale),
                          )
                        : t.discountHint}
                    </span>
                  </div>
                  <label className={`${label} sm:col-span-2`}>
                    {t.fieldDescription}
                    <textarea
                      className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
                      onChange={(event) =>
                        setDraft((d) => ({
                          ...d,
                          description: event.target.value,
                        }))
                      }
                      value={draft.description}
                    />
                  </label>
                </div>
                <p className={hint}>{t.cityHint}</p>
              </section>
            ) : null}

            {section === "availability" ? (
              <section className={card}>
                <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                  {t.staySection}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className={label}>
                    {t.fieldAvailableFrom}
                    <input
                      className={field}
                      onChange={(event) =>
                        setDraft((d) => ({
                          ...d,
                          availableFrom: event.target.value,
                        }))
                      }
                      type="date"
                      value={draft.availableFrom}
                    />
                  </label>
                  <label className={label}>
                    {t.fieldMinimumStay}
                    <input
                      className={field}
                      inputMode="numeric"
                      onChange={(event) =>
                        setDraft((d) => ({
                          ...d,
                          minimumStayMonths: event.target.value,
                        }))
                      }
                      type="number"
                      value={draft.minimumStayMonths}
                    />
                  </label>
                </div>
              </section>
            ) : null}

            {section === "availability" ? (
              <section className={card}>
                <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                  {t.locationSection}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className={label}>
                    {t.fieldArea}
                    <input
                      className={field}
                      onChange={(event) =>
                        setDraft((d) => ({
                          ...d,
                          approximateArea: event.target.value,
                        }))
                      }
                      value={draft.approximateArea}
                    />
                  </label>
                  <label className={label}>
                    {t.fieldPrivacyRadius}
                    <input
                      className={field}
                      inputMode="numeric"
                      onChange={(event) =>
                        setDraft((d) => ({
                          ...d,
                          privacyRadiusMeters: event.target.value,
                        }))
                      }
                      type="number"
                      value={draft.privacyRadiusMeters}
                    />
                  </label>
                </div>
                <p className={hint}>{t.privacyHint}</p>
              </section>
            ) : null}

            {section === "photos" ? (
              <section className={card}>
                <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                  {t.photosSection}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t.photosBody
                    .replace("{max}", String(MAX_PHOTOS))
                    .replace("{budget}", formatBytes(MAX_PHOTO_BYTES))}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label
                    className={`btn-secondary gap-2 ${
                      draft.photos.length >= MAX_PHOTOS || uploading
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }`}
                  >
                    <ImagePlus size={16} aria-hidden="true" />
                    {t.photosAdd}
                    <input
                      accept="image/*"
                      className="sr-only"
                      disabled={draft.photos.length >= MAX_PHOTOS || uploading}
                      multiple
                      onChange={addPhotos}
                      type="file"
                    />
                  </label>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {uploading
                      ? t.photosUploading
                      : t.photosCount
                          .replace("{count}", String(draft.photos.length))
                          .replace("{max}", String(MAX_PHOTOS))
                          .replace("{size}", formatBytes(totalBytes(draft.photos)))
                          .replace("{budget}", formatBytes(MAX_PHOTO_BYTES))}
                  </p>
                </div>

                {photoError ? (
                  <p className="mt-3 text-xs font-bold text-rose-600 dark:text-rose-400">
                    {photoError}
                  </p>
                ) : null}
                {writeError === "quota" ? (
                  <p className="mt-3 text-xs font-bold text-rose-600 dark:text-rose-400">
                    {t.photoErrorQuota}
                  </p>
                ) : null}

                {draft.photos.length === 0 ? (
                  <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    {t.photosEmpty}
                  </p>
                ) : (
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {draft.photos.map((photo, index) => (
                      <li
                        className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                        key={photo.id}
                      >
                        <div className="relative">
                          {/* Stored data URL: no network request for next/image to optimise. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt=""
                            className="h-28 w-full object-cover"
                            src={photo.dataUrl}
                          />
                          {index === 0 ? (
                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.06em] text-white">
                              <Star size={11} aria-hidden="true" />
                              {t.photoCover}
                            </span>
                          ) : null}
                        </div>
                        <label className="block px-2 pt-2">
                          <span className="sr-only">{`${t.photoTag}: ${index + 1}`}</span>
                          <select
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-blue-950"
                            disabled={uploading}
                            onChange={(event) =>
                              setDraft((d) => ({
                                ...d,
                                photos: d.photos.map((item) =>
                                  item.id === photo.id
                                    ? {
                                        ...item,
                                        category: event.target
                                          .value as GalleryCategory,
                                      }
                                    : item,
                                ),
                              }))
                            }
                            value={photo.category}
                          >
                            {galleryCategories.map((category) => (
                              <option key={category} value={category}>
                                {galleryCategoryLabels[category][locale]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="flex items-center justify-between gap-2 p-2">
                          <button
                            className="rounded-lg px-2 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-40 dark:text-blue-300 dark:hover:bg-blue-950/40"
                            disabled={index === 0 || uploading}
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                photos: promoteCover(d.photos, photo.id),
                              }))
                            }
                            type="button"
                          >
                            {t.photoMakeCover}
                          </button>
                          <button
                            aria-label={t.photoRemove}
                            className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-rose-950/40"
                            disabled={uploading}
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                photos: removePhoto(d.photos, photo.id),
                              }))
                            }
                            type="button"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}

            {section === "rooms" ? (
              <section className={card}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                      {t.roomsSection}
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {t.roomsBody}
                    </p>
                  </div>
                  <button
                    className="btn-secondary gap-2"
                    onClick={addRoom}
                    type="button"
                  >
                    <Plus size={16} aria-hidden="true" />
                    {t.roomAdd}
                  </button>
                </div>

                {roomError ? (
                  <p className="mt-3 text-xs font-bold text-rose-600 dark:text-rose-400">
                    {roomError}
                  </p>
                ) : null}

                <ul className="mt-4 grid gap-5">
                  {draft.rooms.map((room) => (
                    <li
                      className="grid gap-3 border-t border-slate-100 pt-5 first:border-0 first:pt-0 dark:border-slate-800"
                      key={room.id}
                    >
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <label className={label}>
                          {t.roomName}
                          <input
                            className={field}
                            onChange={(event) =>
                              editRoom(room.id, {
                                name: ownText(event.target.value),
                              })
                            }
                            value={room.name[locale]}
                          />
                        </label>
                        <button
                          aria-label={`${t.roomRemove}: ${room.name[locale]}`}
                          className="mt-auto grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-rose-950/40"
                          onClick={() => removeRoom(room.id)}
                          type="button"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-4">
                        <label className={label}>
                          {t.roomPrice}
                          <input
                            className={field}
                            inputMode="numeric"
                            onChange={(event) =>
                              editRoom(room.id, { price: event.target.value })
                            }
                            type="number"
                            value={room.price}
                          />
                        </label>
                        <label className={label}>
                          {t.roomAvailable}
                          <input
                            className={field}
                            inputMode="numeric"
                            onChange={(event) =>
                              editRoom(room.id, {
                                availableRooms: event.target.value,
                              })
                            }
                            type="number"
                            value={room.availableRooms}
                          />
                        </label>
                        <label className={label}>
                          {t.roomSize}
                          <input
                            className={field}
                            onChange={(event) =>
                              editRoom(room.id, { size: event.target.value })
                            }
                            value={room.size}
                          />
                        </label>
                        <label className={label}>
                          {t.roomBathroom}
                          <select
                            className={field}
                            onChange={(event) =>
                              editRoom(room.id, {
                                bathroom:
                                  event.target.value === "private"
                                    ? "private"
                                    : "shared",
                              })
                            }
                            value={room.bathroom}
                          >
                            <option value="private">{t.bathroomPrivate}</option>
                            <option value="shared">{t.bathroomShared}</option>
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-1.5">
                        <label className={label}>
                          {t.roomFurnishings}
                          <input
                            className={field}
                            onChange={(event) =>
                              editRoom(room.id, {
                                furnishings: event.target.value
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean)
                                  .map(ownText),
                              })
                            }
                            value={room.furnishings
                              .map((item) => item[locale])
                              .join(", ")}
                          />
                        </label>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {t.roomFurnishingsHint}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {section === "facilities" ? (
              <section className={card}>
                <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                  {t.amenitiesSection}
                </h2>
                <div className="mt-4 grid gap-4">
                  {amenitiesByCategory.map((group) => (
                    <div key={group.category}>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {detailCopy[locale].facilityGroups[group.category]}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.items.map((amenity) => {
                          const selected = draft.amenities.includes(amenity);
                          return (
                            <button
                              aria-pressed={selected}
                              className={`filter-chip rounded-full border px-3.5 py-1.5 text-sm font-bold transition ${
                                selected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              }`}
                              key={amenity}
                              onClick={() =>
                                setDraft((d) => ({
                                  ...d,
                                  amenities: selected
                                    ? d.amenities.filter(
                                        (item) => item !== amenity,
                                      )
                                    : [...d.amenities, amenity],
                                }))
                              }
                              type="button"
                            >
                              {amenityLabels[locale][amenity]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {section === "facilities" ? (
              <section className={card}>
                <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                  {t.rulesSection}
                </h2>

                <p className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.rulesStandard}
                </p>
                <ul className="mt-2 grid gap-2.5">
                  {seed.rules.map((rule, index) => (
                    <li key={rule.id}>
                      <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <input
                          checked={draft.rules[index]?.allowed ?? rule.allowed}
                          className="size-4 shrink-0 accent-blue-600"
                          onChange={(event) =>
                            setDraft((d) => ({
                              ...d,
                              rules: d.rules.map((item, i) =>
                                i === index
                                  ? { ...item, allowed: event.target.checked }
                                  : item,
                              ),
                            }))
                          }
                          type="checkbox"
                        />
                        {rule.label[locale]}
                      </label>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {t.rulesCustom}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {t.rulesCustomBody}
                  </p>

                  {draft.customRules.length > 0 ? (
                    <ul className="mt-3 grid gap-2.5">
                      {draft.customRules.map((rule) => (
                        <li
                          className="flex flex-wrap items-center gap-3"
                          key={rule.id}
                        >
                          <label className="flex flex-1 items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <input
                              checked={rule.allowed}
                              className="size-4 shrink-0 accent-blue-600"
                              onChange={(event) =>
                                setDraft((d) => ({
                                  ...d,
                                  customRules: d.customRules.map((item) =>
                                    item.id === rule.id
                                      ? {
                                          ...item,
                                          allowed: event.target.checked,
                                        }
                                      : item,
                                  ),
                                }))
                              }
                              type="checkbox"
                            />
                            {rule.label}
                          </label>
                          <button
                            aria-label={`${t.ruleDelete}: ${rule.label}`}
                            className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40"
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                customRules: d.customRules.filter(
                                  (item) => item.id !== rule.id,
                                ),
                              }))
                            }
                            type="button"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      aria-label={t.rulesCustom}
                      className={`${field} sm:max-w-md sm:flex-1`}
                      onChange={(event) => setNewRule(event.target.value)}
                      onKeyDown={(event) => {
                        // The editor is one big form; Enter here must add a
                        // rule, not submit and navigate away from the draft.
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomRule();
                        }
                      }}
                      placeholder={t.ruleNewPlaceholder}
                      value={newRule}
                    />
                    <button
                      className="btn-secondary gap-2"
                      onClick={addCustomRule}
                      type="button"
                    >
                      <Plus size={16} aria-hidden="true" />
                      {t.ruleAdd}
                    </button>
                  </div>
                  {ruleError ? (
                    <p className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                      {ruleError}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {section === "costs" ? (
              <section className={card}>
                <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                  {t.costsSection}
                </h2>
                <ul className="mt-4 grid gap-4">
                  {draft.costs.map((cost) => (
                    <li
                      className="grid gap-3 border-t border-slate-100 pt-4 first:border-0 first:pt-0 dark:border-slate-800"
                      key={cost.id}
                    >
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {cost.label[locale]}
                        </p>
                        <label className={label}>
                          {t.costAmount}
                          <input
                            className={`${field} sm:w-40`}
                            disabled={cost.included}
                            inputMode="numeric"
                            onChange={(event) =>
                              editCost(cost.id, { amount: event.target.value })
                            }
                            type="number"
                            value={cost.amount}
                          />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                          <input
                            checked={cost.included}
                            className="size-4 shrink-0 accent-blue-600"
                            onChange={(event) =>
                              editCost(cost.id, {
                                included: event.target.checked,
                              })
                            }
                            type="checkbox"
                          />
                          {t.costIncluded}
                        </label>
                        <button
                          aria-label={`${t.costRemove}: ${cost.label[locale]}`}
                          className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40"
                          onClick={() => removeCost(cost)}
                          type="button"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>

                      <label className={label}>
                        {`${t.costNote}: ${cost.label[locale]}`}
                        <input
                          className={field}
                          onChange={(event) =>
                            editCost(cost.id, {
                              note: event.target.value.trim()
                                ? ownText(event.target.value)
                                : null,
                            })
                          }
                          placeholder={t.costNoteHint}
                          value={cost.note?.[locale] ?? ""}
                        />
                      </label>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <input
                    aria-label={t.costAdd}
                    className={`${field} sm:max-w-md sm:flex-1`}
                    onChange={(event) => setNewCost(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustomCost();
                      }
                    }}
                    placeholder={t.costNewPlaceholder}
                    value={newCost}
                  />
                  <button
                    className="btn-secondary gap-2"
                    onClick={addCustomCost}
                    type="button"
                  >
                    <Plus size={16} aria-hidden="true" />
                    {t.costAdd}
                  </button>
                </div>
                {costError ? (
                  <p className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                    {costError}
                  </p>
                ) : null}
              </section>
            ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <button className="btn-primary gap-2" type="submit">
                  <Save size={16} aria-hidden="true" />
                  {t.save}
                </button>
                {edited ? (
                  <button
                    className="btn-secondary gap-2"
                    onClick={reset}
                    type="button"
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    {t.reset}
                  </button>
                ) : null}
                {error ? (
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {error.message}
                  </p>
                ) : null}
              </div>
            </form>
          </>
        );
      }}
    </ConsoleShell>
  );
}
