"use client";

import { formatPrice } from "@/features/home/home-utils";
import { cities, listings } from "@/features/listings/mock-listings";
import { AppShell } from "@/features/navigation/app-shell";
import {
  useBookings,
  useModeration,
  useReports,
} from "@/features/prototype-data/store";
import { isListingVisible } from "@/features/prototype-data/transitions";

import { adminCopy } from "./admin-copy";
import { AdminNav } from "./admin-nav";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-50">
        {value}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
        {label}
      </p>
    </div>
  );
}

export function AdminOverviewPage() {
  const { bookings } = useBookings();
  const { reports } = useReports();
  const { moderationFor } = useModeration();

  const live = listings.filter((listing) =>
    isListingVisible(moderationFor(listing.id)),
  ).length;
  const verified = listings.filter((listing) => {
    const override = moderationFor(listing.id).verifiedOverride;
    return override === null ? listing.verified : override;
  }).length;
  const pendingRequests = bookings.filter(
    (booking) => booking.status === "pending",
  ).length;
  const openReports = reports.filter(
    (report) => report.status === "submitted" || report.status === "reviewing",
  ).length;
  const averagePrice = Math.round(
    listings.reduce((total, listing) => total + listing.price, 0) /
      listings.length,
  );

  return (
    <AppShell>
      {(locale) => {
        const t = adminCopy[locale];

        return (
          <>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
              {t.area}
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {t.overviewTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t.overviewBody}
            </p>

            <AdminNav
              active="overview"
              locale={locale}
              badges={{ reports: openReports }}
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label={t.statListings} value={listings.length} />
              <Stat label={t.statLive} value={live} />
              <Stat label={t.statVerified} value={verified} />
              <Stat label={t.statRequests} value={bookings.length} />
              <Stat label={t.statPendingRequests} value={pendingRequests} />
              <Stat label={t.statOpenReports} value={openReports} />
              <Stat
                label={t.statAveragePrice}
                value={formatPrice(averagePrice, locale)}
              />
            </div>

            <section className="mt-8 rounded-[1.25rem] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-sm font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                {t.byCity}
              </h2>
              <ul className="mt-4 grid gap-3">
                {cities.map((city) => {
                  const count = listings.filter(
                    (listing) => listing.city === city,
                  ).length;
                  const share = Math.round((count / listings.length) * 100);
                  return (
                    <li key={city}>
                      <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                        <span>{city}</span>
                        <span className="tabular-nums">{count}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        );
      }}
    </AppShell>
  );
}
