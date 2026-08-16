"use client";

import {
  Building2,
  CircleHelp,
  Inbox,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { formatPrice } from "@/features/home/home-utils";
import type { ListingDetail, Locale } from "@/features/listings/types";
import { ConsoleShell } from "@/features/navigation/console-shell";
import {
  useBookings,
  useModeration,
  useQuestions,
} from "@/features/prototype-data/store";
import { isListingVisible } from "@/features/prototype-data/transitions";
import { useResolvedListings } from "@/features/prototype-data/use-resolved-listings";

import { ownerCopy } from "./owner-copy";
import {
  demand,
  fullyBookedListings,
  monthlyEarnings,
  occupancy,
} from "./owner-earnings";
import { ownerNavItems } from "./owner-nav";

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="mt-8">
      <h2 className="text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Stat({
  emphasis = false,
  hint,
  label,
  value,
}: {
  emphasis?: boolean;
  hint?: string;
  label: string;
  value: string | number;
}) {
  return (
    <div
      className={`rounded-[1.25rem] border p-5 ${
        emphasis
          ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      }`}
    >
      <p
        className={`font-black tracking-[-0.04em] ${
          // A fallback like "nothing decided yet" is a sentence, not a figure,
          // and set at figure size it wraps to three lines.
          typeof value === "string" && !/\d/.test(value)
            ? "text-base leading-6"
            : "text-2xl"
        } ${
          emphasis
            ? "text-blue-900 dark:text-blue-100"
            : "text-slate-950 dark:text-slate-50"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
        {label}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function TaskCard({
  cta,
  href,
  icon,
  label,
  value,
}: {
  cta: string;
  href: string;
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <span className="grid size-11 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/45 dark:text-blue-300">
        {icon}
      </span>
      <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-50">
        {value}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
        {label}
      </p>
      <Link
        className="mt-4 inline-block text-sm font-bold text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        href={href}
      >
        {cta}
      </Link>
    </div>
  );
}

export function OwnerDashboardPage() {
  const { bookings } = useBookings();
  const { questions } = useQuestions();
  const { moderationFor } = useModeration();
  const { listings, detailFor } = useResolvedListings();

  const pendingRequests = bookings.filter(
    (booking) => booking.status === "pending",
  ).length;
  const unanswered = questions.filter(
    (question) => question.status === "pending",
  ).length;
  const live = listings.filter((listing) =>
    isListingVisible(moderationFor(listing.id)),
  ).length;

  const earnings = monthlyEarnings(bookings, detailFor);
  const demandSummary = demand(bookings);
  const details = listings
    .map((listing) => detailFor(listing.id))
    .filter((listing): listing is ListingDetail => Boolean(listing));
  const occupancySummary = occupancy(details);
  const fullyBooked = fullyBookedListings(listings).length;

  return (
    <ConsoleShell
      activeId="dashboard"
      areaLabel={(locale) => ownerCopy[locale].area}
      items={(locale) =>
        ownerNavItems(locale, {
          requests: pendingRequests,
          questions: unanswered,
        })
      }
    >
      {(locale: Locale) => {
        const t = ownerCopy[locale];

        return (
          <>
            <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {t.dashboardTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t.dashboardBody}
            </p>

            <Section title={t.sectionEarnings}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                  hint={t.earningsFrom.replace(
                    "{count}",
                    String(earnings.bookingCount),
                  )}
                  label={t.earningsGross}
                  value={formatPrice(earnings.gross, locale)}
                />
                <Stat
                  label={t.earningsCommission}
                  value={`- ${formatPrice(earnings.commission, locale)}`}
                />
                <Stat
                  emphasis
                  label={t.earningsNet}
                  value={formatPrice(earnings.net, locale)}
                />
              </div>
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3.5 text-xs font-semibold leading-5 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                <ShieldCheck
                  size={15}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {t.earningsNote}
              </p>
            </Section>

            <Section title={t.sectionOccupancy}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                  hint={`${occupancySummary.occupiedRooms}/${occupancySummary.totalRooms} ${t.occupancyRooms}`}
                  label={t.occupancyRate}
                  value={`${occupancySummary.rate}%`}
                />
                <Stat
                  label={t.occupancyFree}
                  value={occupancySummary.freeRooms}
                />
                <Stat
                  hint={
                    fullyBooked > 0
                      ? `${fullyBooked} ${t.fullyBookedAlert}`
                      : undefined
                  }
                  label={t.statPublished}
                  value={live}
                />
              </div>
            </Section>

            <Section title={t.sectionDemand}>
              <div className="grid gap-4 sm:grid-cols-4">
                <Stat label={t.demandTotal} value={demandSummary.total} />
                <Stat label={t.demandApproved} value={demandSummary.approved} />
                <Stat label={t.demandRejected} value={demandSummary.rejected} />
                <Stat
                  label={t.approvalRate}
                  value={
                    demandSummary.approvalRate === null
                      ? t.noDecisions
                      : `${demandSummary.approvalRate}%`
                  }
                />
              </div>
            </Section>

            <Section title={t.sectionTasks}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <TaskCard
                  cta={t.reviewRequests}
                  href="/pemilik/permintaan"
                  icon={<Inbox size={20} aria-hidden="true" />}
                  label={t.statPendingRequests}
                  value={pendingRequests}
                />
                <TaskCard
                  cta={t.answerQuestions}
                  href="/pemilik/tanya-jawab"
                  icon={<CircleHelp size={20} aria-hidden="true" />}
                  label={t.statUnanswered}
                  value={unanswered}
                />
                <TaskCard
                  cta={t.manageListings}
                  href="/pemilik/kos"
                  icon={<Building2 size={20} aria-hidden="true" />}
                  label={t.statTotalListings}
                  value={listings.length}
                />
              </div>
              {pendingRequests === 0 && unanswered === 0 ? (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-200">
                  <TrendingUp size={16} aria-hidden="true" />
                  {t.allClear}
                </p>
              ) : null}
            </Section>
          </>
        );
      }}
    </ConsoleShell>
  );
}
