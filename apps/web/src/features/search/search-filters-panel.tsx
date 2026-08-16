"use client";

import { amenityLabels, copy, typeLabels } from "@/features/home/copy";
import { formatPrice } from "@/features/home/home-utils";
import type { Locale, SearchFilters } from "@/features/home/types";
import { detailCopy } from "@/features/listings/detail-copy";
import { amenitiesByCategory } from "@/features/listings/mock-listings";

import { searchCopy } from "./search-copy";

const PRICE_MIN = 500000;
const PRICE_MAX = 3000000;
const PRICE_STEP = 50000;

export function SearchFiltersPanel({
  locale,
  filters,
  onChange,
  onClear,
  countFor,
}: {
  locale: Locale;
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  onClear: () => void;
  /** How many listings would remain if `next` were applied. */
  countFor: (next: SearchFilters) => number;
}) {
  const t = copy[locale];
  const st = searchCopy[locale];
  const dt = detailCopy[locale];
  const minValue = filters.minPrice ?? PRICE_MIN;
  const maxValue = filters.maxPrice ?? PRICE_MAX;

  // A count of 0 means selecting the option would strand the renter on an
  // empty result set, so it is surfaced and disabled rather than hidden.
  const renderCount = (count: number, selected: boolean) => (
    <span
      // Decorative: keeping it out of the accessible name means each control is
      // still announced as plain "Putri" rather than "Putri 3". The running
      // total is already announced by the results live region.
      aria-hidden="true"
      className={`ml-1.5 text-xs font-bold tabular-nums ${
        selected
          ? "text-white/70"
          : count === 0
            ? "text-slate-300 dark:text-slate-600"
            : "text-slate-400 dark:text-slate-500"
      }`}
    >
      {count}
    </span>
  );

  return (
    <aside
      aria-label={st.filtersHeading}
      className="h-fit rounded-[1.5rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
          {st.filtersHeading}
        </h2>
        <button
          className="text-xs font-bold text-blue-600 dark:text-blue-400 transition hover:text-blue-800 dark:hover:text-blue-300"
          onClick={onClear}
          type="button"
        >
          {st.clearFilters}
        </button>
      </div>

      <fieldset className="mt-6">
        <legend className="text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
          {st.statusHeading}
        </legend>
        <div className="mt-3 space-y-2.5" aria-label={st.statusHeading}>
          {(
            [
              ["availableOnly", st.availableOnly],
              ["verifiedOnly", st.verifiedOnly],
            ] as const
          ).map(([key, label]) => {
            const checked = filters[key];
            const count = countFor({ ...filters, [key]: true });
            return (
              <label
                className={`flex items-center gap-2.5 text-sm font-bold ${
                  count === 0 && !checked
                    ? "text-slate-300 dark:text-slate-600"
                    : "text-slate-700 dark:text-slate-300"
                }`}
                key={key}
              >
                <input
                  checked={checked}
                  className="size-4 shrink-0 accent-blue-600"
                  disabled={count === 0 && !checked}
                  onChange={(event) =>
                    onChange({ ...filters, [key]: event.target.checked })
                  }
                  type="checkbox"
                />
                <span className="flex-1">{label}</span>
                {renderCount(count, false)}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
          {t.roomType}
        </legend>
        <div className="mt-3 flex flex-wrap gap-2" aria-label={t.roomType}>
          {(["all", "putra", "putri", "campur"] as const).map((type) => {
            const selected = filters.type === type;
            const count = countFor({ ...filters, type });
            const disabled = count === 0 && !selected;
            return (
              <button
                className={`filter-chip rounded-full border px-3.5 py-1.5 text-sm font-bold transition ${
                  selected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : disabled
                      ? "cursor-not-allowed border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-300"
                }`}
                disabled={disabled}
                key={type}
                onClick={() => onChange({ ...filters, type })}
                title={disabled ? st.noMatchHint : undefined}
                type="button"
                aria-pressed={selected}
              >
                {typeLabels[locale][type]}
                {renderCount(count, selected)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
          {st.priceHeading}
        </legend>
        <div className="mt-3 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>{st.minPriceLabel}</span>
              <span>
                {filters.minPrice ? formatPrice(filters.minPrice, locale) : st.minPricePlaceholder}
              </span>
            </div>
            <input
              aria-label={st.minPriceLabel}
              className="mt-2 w-full accent-blue-600"
              max={maxValue}
              min={PRICE_MIN}
              onChange={(event) => {
                const next = Number(event.target.value);
                onChange({
                  ...filters,
                  minPrice: next <= PRICE_MIN ? null : next,
                });
              }}
              step={PRICE_STEP}
              type="range"
              value={minValue}
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>{st.maxPriceLabel}</span>
              <span>
                {filters.maxPrice ? formatPrice(filters.maxPrice, locale) : st.maxPricePlaceholder}
              </span>
            </div>
            <input
              aria-label={st.maxPriceLabel}
              className="mt-2 w-full accent-blue-600"
              max={PRICE_MAX}
              min={minValue}
              onChange={(event) => {
                const next = Number(event.target.value);
                onChange({
                  ...filters,
                  maxPrice: next >= PRICE_MAX ? null : next,
                });
              }}
              step={PRICE_STEP}
              type="range"
              value={maxValue}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
          {st.amenitiesHeading}
        </legend>
        {/* Grouped by facility category: a flat list this long stops being
            scannable, and the categories are the same ones the detail page
            uses, so a renter meets them in the same shape twice. */}
        <div className="mt-3 grid gap-4" aria-label={st.amenitiesHeading}>
          {amenitiesByCategory.map((group) => (
            <div key={group.category}>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {dt.facilityGroups[group.category]}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.items.map((amenity) => {
                  const selected = filters.amenities.includes(amenity);
                  const nextAmenities = selected
                    ? filters.amenities.filter((item) => item !== amenity)
                    : [...filters.amenities, amenity];
                  const count = countFor({
                    ...filters,
                    amenities: selected ? filters.amenities : nextAmenities,
                  });
                  const disabled = count === 0 && !selected;
                  return (
                    <button
                      className={`filter-chip rounded-full border px-3.5 py-1.5 text-sm font-bold transition ${
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : disabled
                            ? "cursor-not-allowed border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-300"
                      }`}
                      disabled={disabled}
                      key={amenity}
                      onClick={() =>
                        onChange({ ...filters, amenities: nextAmenities })
                      }
                      title={disabled ? st.noMatchHint : undefined}
                      type="button"
                      aria-pressed={selected}
                    >
                      {amenityLabels[locale][amenity]}
                      {renderCount(count, selected)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </fieldset>
    </aside>
  );
}
