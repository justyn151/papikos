"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StatusBadge, actorLabel } from "@/features/account/requests-page";
import { accountCopy } from "@/features/account/account-copy";
import { getListingDetail } from "@/features/listings/mock-listings";
import { AppShell } from "@/features/navigation/app-shell";
import { useAuditLog, useBookings } from "@/features/prototype-data/store";
import { bookingStatusLabels } from "@/features/prototype-data/status-copy";
import {
  approveBooking,
  rejectBooking,
} from "@/features/prototype-data/transitions";

import { ownerCopy } from "./owner-copy";
import { OwnerNav } from "./owner-nav";

export function OwnerRequestsPage() {
  const { bookings, replace } = useBookings();
  const { append } = useAuditLog();
  const [toast, setToast] = useState("");

  const pendingCount = bookings.filter(
    (booking) => booking.status === "pending",
  ).length;

  return (
    <AppShell toast={toast}>
      {(locale) => {
        const t = ownerCopy[locale];
        const a = accountCopy[locale];
        const dateFormatter = new Intl.DateTimeFormat(
          locale === "id" ? "id-ID" : "en-GB",
          { day: "numeric", month: "short", year: "numeric" },
        );
        const formatDate = (value: string) => {
          const parsed = new Date(value);
          return Number.isNaN(parsed.valueOf())
            ? value
            : dateFormatter.format(parsed);
        };

        const decide = (bookingId: string, approve: boolean) => {
          const booking = bookings.find((item) => item.id === bookingId);
          if (!booking) return;
          const result = approve
            ? approveBooking(booking)
            : rejectBooking(booking);
          if (!result) return;
          replace(result.record);
          append(result.audit);
          setToast(approve ? t.approvedToast : t.rejectedToast);
          window.setTimeout(() => setToast(""), 2600);
        };

        return (
          <>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
              {t.area}
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {t.requestsTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t.requestsBody}
            </p>

            <OwnerNav
              active="requests"
              locale={locale}
              badges={{ requests: pendingCount }}
            />

            {bookings.length === 0 ? (
              <div className="mt-8 rounded-[2rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-16 text-center dark:bg-blue-950/35">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400">
                  <Inbox size={24} aria-hidden="true" />
                </span>
                <p className="mt-5 text-sm font-bold text-slate-600 dark:text-slate-300">
                  {t.requestsEmpty}
                </p>
              </div>
            ) : (
              <ul className="mt-8 grid gap-4">
                {bookings.map((booking) => {
                  const listing = getListingDetail(booking.listingId);
                  const room = listing?.rooms.find(
                    (item) => item.id === booking.roomId,
                  );
                  const decided = booking.status !== "pending";

                  return (
                    <li
                      className="rounded-[1.5rem] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
                      key={booking.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-black tracking-[-0.02em] text-slate-950 dark:text-slate-50">
                            {listing?.name ?? booking.listingId}
                          </h2>
                          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {a.submittedOn} {formatDate(booking.createdAt)}
                          </p>
                        </div>
                        <StatusBadge
                          status={booking.status}
                          label={bookingStatusLabels[locale][booking.status]}
                        />
                      </div>

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                            {a.room}
                          </dt>
                          <dd className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                            {room?.name[locale] ?? booking.roomId}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                            {a.moveIn}
                          </dt>
                          <dd className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                            {formatDate(booking.moveInDate)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                            {a.duration}
                          </dt>
                          <dd className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                            {booking.durationMonths} {a.months}
                          </dd>
                        </div>
                      </dl>

                      {booking.note ? (
                        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                          <span className="font-bold">{a.note}: </span>
                          {booking.note}
                        </p>
                      ) : null}

                      <details className="mt-4">
                        <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                          {a.history}
                        </summary>
                        <ol className="mt-3 grid gap-2">
                          {booking.statusHistory.map((entry, index) => (
                            <li
                              className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                              key={`${entry.status}-${entry.at}-${index}`}
                            >
                              <StatusBadge
                                status={entry.status}
                                label={bookingStatusLabels[locale][entry.status]}
                              />
                              <span>{formatDate(entry.at)}</span>
                              <span className="text-slate-400 dark:text-slate-500">
                                {actorLabel(entry.by, locale)}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </details>

                      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        {decided ? (
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {t.decidedAlready}
                          </span>
                        ) : (
                          <>
                            <button
                              className="btn-primary"
                              onClick={() => decide(booking.id, true)}
                              type="button"
                            >
                              {t.approve}
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => decide(booking.id, false)}
                              type="button"
                            >
                              {t.reject}
                            </button>
                          </>
                        )}
                        <Link
                          className="btn-secondary"
                          href={`/kos/${booking.listingId}`}
                        >
                          {a.viewListing}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        );
      }}
    </AppShell>
  );
}
