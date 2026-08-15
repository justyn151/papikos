"use client";

import { CalendarDays, Inbox } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { Locale, PrototypeRole } from "@/features/listings/types";
import { AppShell } from "@/features/navigation/app-shell";
import { useResolvedListings } from "@/features/prototype-data/use-resolved-listings";
import { useAuditLog, useBookings } from "@/features/prototype-data/store";
import {
  bookingStatusLabels,
  statusTone,
} from "@/features/prototype-data/status-copy";
import { cancelBooking } from "@/features/prototype-data/transitions";

import { accountCopy } from "./account-copy";

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-black ${
        statusTone[status] ?? statusTone.pending
      }`}
    >
      {label}
    </span>
  );
}

export function actorLabel(by: PrototypeRole, locale: Locale) {
  const a = accountCopy[locale];
  if (by === "owner") return a.byOwner;
  if (by === "admin") return a.byAdmin;
  return a.byRenter;
}

export function RequestsPage() {
  const { bookings, replace } = useBookings();
  const { append } = useAuditLog();
  const [toast, setToast] = useState("");
  const { detailFor } = useResolvedListings();

  return (
    <AppShell toast={toast}>
      {(locale) => {
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

        const onCancel = (bookingId: string) => {
          const booking = bookings.find((item) => item.id === bookingId);
          if (!booking) return;
          const result = cancelBooking(booking);
          if (!result) return;
          replace(result.record);
          append(result.audit);
          setToast(a.cancelled);
          window.setTimeout(() => setToast(""), 2600);
        };

        return (
          <>
            <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {a.requestsTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {a.requestsBody}
            </p>

            {bookings.length === 0 ? (
              <div className="mt-8 rounded-[2rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-16 text-center dark:bg-blue-950/35">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400">
                  <Inbox size={24} aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-slate-50">
                  {a.requestsEmptyTitle}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {a.requestsEmptyBody}
                </p>
                <Link className="btn-primary mt-5" href="/kos">
                  {a.requestsEmptyCta}
                </Link>
              </div>
            ) : (
              <ul className="mt-8 grid gap-4">
                {bookings.map((booking) => {
                  const listing = detailFor(booking.listingId);
                  const room = listing?.rooms.find(
                    (item) => item.id === booking.roomId,
                  );

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
                          <dd className="mt-1 flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <CalendarDays size={14} aria-hidden="true" />
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

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <Link className="btn-secondary" href={`/kos/${booking.listingId}`}>
                          {a.viewListing}
                        </Link>
                        {booking.status === "pending" ? (
                          <button
                            className="btn-secondary"
                            onClick={() => onCancel(booking.id)}
                            type="button"
                          >
                            {a.cancel}
                          </button>
                        ) : null}
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
