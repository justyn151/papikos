"use client";

import { ArrowLeft, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { amenityLabels, typeLabels } from "@/features/home/copy";
import { detailCopy } from "@/features/listings/detail-copy";
import { amenitiesByCategory } from "@/features/listings/mock-listings";
import type {
  Amenity,
  ListingDetail,
  ListingOverride,
  ListingType,
} from "@/features/listings/types";
import { ConsoleShell } from "@/features/navigation/console-shell";
import { resolveListingDetail } from "@/features/prototype-data/resolve-listing";
import { useAuditLog, useOverrides } from "@/features/prototype-data/store";
import { createId } from "@/features/shared/create-id";

import { ownerCopy } from "./owner-copy";
import { ownerNavItems } from "./owner-nav";

const field =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950";
const label =
  "grid gap-1.5 text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400";
const card =
  "rounded-[1.25rem] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900";

interface Draft {
  name: string;
  district: string;
  type: ListingType;
  description: string;
  price: string;
  promoPrice: string;
  amenities: Amenity[];
  rooms: { id: string; price: string; availableRooms: string }[];
  rules: { id: string; allowed: boolean }[];
  customRules: { id: string; label: string; allowed: boolean }[];
  costs: { id: string; amount: string; included: boolean }[];
}

function toDraft(
  listing: ListingDetail,
  seed: ListingDetail,
  override: ListingOverride | undefined,
): Draft {
  // `listing.rules` already has the owner's custom rules appended, so the
  // standard checkboxes are matched back against the seeded set by id.
  const seededRuleIds = new Set(seed.rules.map((rule) => rule.id));

  return {
    customRules: (override?.customRules ?? []).map((rule) => ({ ...rule })),
    name: listing.name,
    district: listing.district,
    type: listing.type,
    description: listing.description.id,
    price: String(listing.price),
    promoPrice: listing.promoPrice === null ? "" : String(listing.promoPrice),
    amenities: [...listing.amenities],
    rooms: listing.rooms.map((room) => ({
      id: room.id,
      price: String(room.price),
      availableRooms: String(room.availableRooms),
    })),
    rules: listing.rules
      .filter((rule) => seededRuleIds.has(rule.id))
      .map((rule) => ({ id: rule.id, allowed: rule.allowed })),
    costs: listing.costs.map((cost) => ({
      id: cost.id,
      amount: cost.amount === null ? "" : String(cost.amount),
      included: cost.included,
    })),
  };
}

export function OwnerEditPage({ listing: seed }: { listing: ListingDetail }) {
  const { overrideFor, replace, clear } = useOverrides();
  const { append } = useAuditLog();
  const override = overrideFor(seed.id);
  const listing = resolveListingDetail(seed, override);

  const [draft, setDraft] = useState<Draft>(() =>
    toDraft(listing, seed, override),
  );
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [newRule, setNewRule] = useState("");
  const [ruleError, setRuleError] = useState("");

  const edited = Boolean(override);

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

        const save = (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const price = Number(draft.price);
          const promo = draft.promoPrice === "" ? null : Number(draft.promoPrice);

          // A promo that is not cheaper is not a discount, and would render as
          // a "-0%" badge, so it is rejected rather than silently stored.
          if (promo !== null && promo >= price) {
            setError(t.promoInvalid);
            return;
          }
          setError("");

          const next: ListingOverride = {
            listingId: seed.id,
            name: draft.name.trim(),
            district: draft.district.trim(),
            type: draft.type,
            description: draft.description.trim(),
            price,
            promoPrice: promo,
            amenities: draft.amenities,
            rooms: draft.rooms.map((room) => ({
              id: room.id,
              price: Number(room.price),
              availableRooms: Number(room.availableRooms),
            })),
            rules: draft.rules,
            customRules: draft.customRules,
            costs: draft.costs.map((cost) => ({
              id: cost.id,
              amount: cost.amount === "" ? null : Number(cost.amount),
              included: cost.included,
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
          setError("");
          setRuleError("");
          setNewRule("");
          announce(t.resetDone);
        };

        const addCustomRule = () => {
          const label = newRule.trim();
          if (!label) {
            setRuleError(t.ruleEmptyError);
            return;
          }
          setRuleError("");
          setNewRule("");
          setDraft((d) => ({
            ...d,
            customRules: [
              ...d.customRules,
              { id: createId("rule"), label, allowed: false },
            ],
          }));
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

            <form className="mt-8 grid gap-5" onSubmit={save}>
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
                    {t.fieldDistrict}
                    <input
                      className={field}
                      onChange={(event) =>
                        setDraft((d) => ({ ...d, district: event.target.value }))
                      }
                      value={draft.district}
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
                    {t.fieldPrice}
                    <input
                      className={field}
                      inputMode="numeric"
                      min={0}
                      onChange={(event) =>
                        setDraft((d) => ({ ...d, price: event.target.value }))
                      }
                      type="number"
                      value={draft.price}
                    />
                  </label>
                  <label className={label}>
                    {t.fieldPromo}
                    <input
                      className={field}
                      inputMode="numeric"
                      min={0}
                      onChange={(event) =>
                        setDraft((d) => ({
                          ...d,
                          promoPrice: event.target.value,
                        }))
                      }
                      placeholder={t.promoHint}
                      type="number"
                      value={draft.promoPrice}
                    />
                  </label>
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
                {error ? (
                  <p className="mt-3 text-xs font-bold text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                ) : null}
              </section>

              <section className={card}>
                <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                  {t.roomsSection}
                </h2>
                <ul className="mt-4 grid gap-4">
                  {listing.rooms.map((room, index) => (
                    <li
                      className="grid gap-3 border-t border-slate-100 pt-4 first:border-0 first:pt-0 sm:grid-cols-[1fr_auto_auto] sm:items-end dark:border-slate-800"
                      key={room.id}
                    >
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {room.name[locale]}
                      </p>
                      <label className={label}>
                        {t.roomPrice}
                        <input
                          className={`${field} sm:w-40`}
                          inputMode="numeric"
                          min={0}
                          onChange={(event) =>
                            setDraft((d) => ({
                              ...d,
                              rooms: d.rooms.map((item, i) =>
                                i === index
                                  ? { ...item, price: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                          type="number"
                          value={draft.rooms[index]?.price ?? ""}
                        />
                      </label>
                      <label className={label}>
                        {t.roomAvailable}
                        <input
                          className={`${field} sm:w-28`}
                          inputMode="numeric"
                          min={0}
                          onChange={(event) =>
                            setDraft((d) => ({
                              ...d,
                              rooms: d.rooms.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      availableRooms: event.target.value,
                                    }
                                  : item,
                              ),
                            }))
                          }
                          type="number"
                          value={draft.rooms[index]?.availableRooms ?? ""}
                        />
                      </label>
                    </li>
                  ))}
                </ul>
              </section>

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
                          checked={draft.rules[index]?.allowed ?? false}
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

              <section className={card}>
                <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                  {t.costsSection}
                </h2>
                <ul className="mt-4 grid gap-4">
                  {listing.costs.map((cost, index) => (
                    <li
                      className="grid gap-3 border-t border-slate-100 pt-4 first:border-0 first:pt-0 sm:grid-cols-[1fr_auto_auto] sm:items-end dark:border-slate-800"
                      key={cost.id}
                    >
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {cost.label[locale]}
                      </p>
                      <label className={label}>
                        {t.costAmount}
                        <input
                          className={`${field} sm:w-40`}
                          disabled={draft.costs[index]?.included}
                          inputMode="numeric"
                          min={0}
                          onChange={(event) =>
                            setDraft((d) => ({
                              ...d,
                              costs: d.costs.map((item, i) =>
                                i === index
                                  ? { ...item, amount: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                          type="number"
                          value={draft.costs[index]?.amount ?? ""}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <input
                          checked={draft.costs[index]?.included ?? false}
                          className="size-4 shrink-0 accent-blue-600"
                          onChange={(event) =>
                            setDraft((d) => ({
                              ...d,
                              costs: d.costs.map((item, i) =>
                                i === index
                                  ? { ...item, included: event.target.checked }
                                  : item,
                              ),
                            }))
                          }
                          type="checkbox"
                        />
                        {t.costIncluded}
                      </label>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="flex flex-wrap gap-2">
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
              </div>
            </form>
          </>
        );
      }}
    </ConsoleShell>
  );
}
