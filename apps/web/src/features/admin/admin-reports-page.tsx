"use client";

import { Flag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { accountCopy } from "@/features/account/account-copy";
import { StatusBadge } from "@/features/account/requests-page";
import type { ReportStatus } from "@/features/listings/types";
import { ConsoleShell } from "@/features/navigation/console-shell";
import { useResolvedListings } from "@/features/prototype-data/use-resolved-listings";
import { useAuditLog, useReports } from "@/features/prototype-data/store";
import { reportStatusLabels } from "@/features/prototype-data/status-copy";
import { setReportStatus } from "@/features/prototype-data/transitions";

import { adminCopy } from "./admin-copy";
import { adminNavItems } from "./admin-nav";

export function AdminReportsPage() {
  const { reports, replace } = useReports();
  const { append } = useAuditLog();
  const [toast, setToast] = useState("");
  const { detailFor } = useResolvedListings();

  const openReports = reports.filter(
    (report) => report.status === "submitted" || report.status === "reviewing",
  ).length;

  return (
    <ConsoleShell
      activeId="reports"
      areaLabel={(locale) => adminCopy[locale].area}
      items={(locale) => adminNavItems(locale, { reports: openReports })}
      toast={toast}
    >
      {(locale) => {
        const t = adminCopy[locale];
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

        const move = (reportId: string, next: ReportStatus) => {
          const report = reports.find((item) => item.id === reportId);
          if (!report) return;
          const result = setReportStatus(report, next);
          if (!result) return;
          replace(result.record);
          append(result.audit);
          setToast(t.reportUpdated);
          window.setTimeout(() => setToast(""), 2600);
        };

        return (
          <>
            <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {t.reportsTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t.reportsBody}
            </p>


            {reports.length === 0 ? (
              <div className="mt-8 rounded-[2rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-16 text-center dark:bg-blue-950/35">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400">
                  <Flag size={24} aria-hidden="true" />
                </span>
                <p className="mt-5 text-sm font-bold text-slate-600 dark:text-slate-300">
                  {t.reportsEmpty}
                </p>
              </div>
            ) : (
              <ul className="mt-8 grid gap-4">
                {reports.map((report) => {
                  const listing = detailFor(report.listingId);
                  return (
                    <li
                      className="rounded-[1.5rem] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
                      key={report.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                            {listing?.name ?? report.listingId}
                          </h2>
                          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {t.reportReason}: {report.reason} ·{" "}
                            {formatDate(report.createdAt)}
                          </p>
                        </div>
                        <StatusBadge
                          status={report.status}
                          label={reportStatusLabels[locale][report.status]}
                        />
                      </div>

                      <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                        {report.details}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        {report.status !== "reviewing" &&
                        report.status !== "resolved" &&
                        report.status !== "dismissed" ? (
                          <button
                            className="btn-secondary"
                            onClick={() => move(report.id, "reviewing")}
                            type="button"
                          >
                            {t.markReviewing}
                          </button>
                        ) : null}
                        {report.status !== "resolved" ? (
                          <button
                            className="btn-primary"
                            onClick={() => move(report.id, "resolved")}
                            type="button"
                          >
                            {t.markResolved}
                          </button>
                        ) : null}
                        {report.status !== "dismissed" ? (
                          <button
                            className="btn-secondary"
                            onClick={() => move(report.id, "dismissed")}
                            type="button"
                          >
                            {t.markDismissed}
                          </button>
                        ) : null}
                        <Link
                          className="btn-secondary"
                          href={`/kos/${report.listingId}`}
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
    </ConsoleShell>
  );
}
