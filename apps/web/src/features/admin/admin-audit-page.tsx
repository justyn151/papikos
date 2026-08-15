"use client";

import { ScrollText } from "lucide-react";

import { actorLabel } from "@/features/account/requests-page";
import { AppShell } from "@/features/navigation/app-shell";
import { useAuditLog } from "@/features/prototype-data/store";

import { adminCopy } from "./admin-copy";
import { AdminNav } from "./admin-nav";

export function AdminAuditPage() {
  const { entries } = useAuditLog();

  return (
    <AppShell>
      {(locale) => {
        const t = adminCopy[locale];
        const dateFormatter = new Intl.DateTimeFormat(
          locale === "id" ? "id-ID" : "en-GB",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          },
        );
        const formatDate = (value: string) => {
          const parsed = new Date(value);
          return Number.isNaN(parsed.valueOf())
            ? value
            : dateFormatter.format(parsed);
        };

        return (
          <>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
              {t.area}
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {t.auditTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t.auditBody}
            </p>

            <AdminNav active="audit" locale={locale} />

            {entries.length === 0 ? (
              <div className="mt-8 rounded-[2rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-16 text-center dark:bg-blue-950/35">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400">
                  <ScrollText size={24} aria-hidden="true" />
                </span>
                <p className="mt-5 text-sm font-bold text-slate-600 dark:text-slate-300">
                  {t.auditEmpty}
                </p>
              </div>
            ) : (
              <div className="mt-8 overflow-x-auto rounded-[1.25rem] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.06em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3" scope="col">
                        {t.when}
                      </th>
                      <th className="px-4 py-3" scope="col">
                        {t.actor}
                      </th>
                      <th className="px-4 py-3" scope="col">
                        {t.action}
                      </th>
                      <th className="px-4 py-3" scope="col">
                        {t.target}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                          {formatDate(entry.at)}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                          {actorLabel(entry.actor, locale)}
                        </td>
                        <td className="px-4 py-3">
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {entry.action}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {entry.targetId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        );
      }}
    </AppShell>
  );
}
