"use client";

import { Building2, CircleHelp, Inbox } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ConsoleShell } from "@/features/navigation/console-shell";
import { useResolvedListings } from "@/features/prototype-data/use-resolved-listings";
import {
  useBookings,
  useModeration,
  useQuestions,
} from "@/features/prototype-data/store";
import { isListingVisible } from "@/features/prototype-data/transitions";

import { ownerCopy } from "./owner-copy";
import { ownerNavItems } from "./owner-nav";

function StatCard({
  icon,
  label,
  value,
  href,
  cta,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  href: string;
  cta: string;
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
  const { listings } = useResolvedListings();

  const pendingRequests = bookings.filter(
    (booking) => booking.status === "pending",
  ).length;
  const unanswered = questions.filter(
    (question) => question.status === "pending",
  ).length;
  const live = listings.filter((listing) =>
    isListingVisible(moderationFor(listing.id)),
  ).length;

  return (
    <ConsoleShell
      activeId="dashboard"
      areaLabel={(locale) => ownerCopy[locale].area}
      items={(locale) => ownerNavItems(locale, { requests: pendingRequests, questions: unanswered })}
    >
      {(locale) => {
        const t = ownerCopy[locale];

        return (
          <>
            <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {t.dashboardTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t.dashboardBody}
            </p>


            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                cta={t.reviewRequests}
                href="/pemilik/permintaan"
                icon={<Inbox size={20} aria-hidden="true" />}
                label={t.statPendingRequests}
                value={pendingRequests}
              />
              <StatCard
                cta={t.answerQuestions}
                href="/pemilik/tanya-jawab"
                icon={<CircleHelp size={20} aria-hidden="true" />}
                label={t.statUnanswered}
                value={unanswered}
              />
              <StatCard
                cta={t.manageListings}
                href="/pemilik/kos"
                icon={<Building2 size={20} aria-hidden="true" />}
                label={t.statPublished}
                value={live}
              />
            </div>

            {pendingRequests === 0 && unanswered === 0 ? (
              <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-200">
                {t.allClear}
              </p>
            ) : null}
          </>
        );
      }}
    </ConsoleShell>
  );
}
