"use client";

import { BadgeCheck, ShieldOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { accountCopy } from "@/features/account/account-copy";
import { listings } from "@/features/listings/mock-listings";
import { AppShell } from "@/features/navigation/app-shell";
import { useAuditLog, useModeration } from "@/features/prototype-data/store";
import { setVerification } from "@/features/prototype-data/transitions";

import { adminCopy } from "./admin-copy";
import { AdminNav } from "./admin-nav";

export function AdminVerificationPage() {
  const { moderationFor, replace } = useModeration();
  const { append } = useAuditLog();
  const [toast, setToast] = useState("");

  return (
    <AppShell toast={toast}>
      {(locale) => {
        const t = adminCopy[locale];
        const a = accountCopy[locale];

        const toggle = (listingId: string, next: boolean) => {
          const result = setVerification(moderationFor(listingId), next);
          replace(result.record);
          append(result.audit);
          setToast(next ? t.verifiedToast : t.unverifiedToast);
          window.setTimeout(() => setToast(""), 2600);
        };

        return (
          <>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
              {t.area}
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {t.verificationTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t.verificationBody}
            </p>

            <AdminNav active="verification" locale={locale} />

            <ul className="mt-8 grid gap-3">
              {listings.map((listing) => {
                const moderation = moderationFor(listing.id);
                const verified =
                  moderation.verifiedOverride === null
                    ? listing.verified
                    : moderation.verifiedOverride;

                return (
                  <li
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                    key={listing.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                          {listing.name}
                        </h2>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${
                            verified
                              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {verified ? (
                            <BadgeCheck size={12} aria-hidden="true" />
                          ) : (
                            <ShieldOff size={12} aria-hidden="true" />
                          )}
                          {verified ? t.verified : t.unverified}
                        </span>
                        {moderation.verifiedOverride !== null ? (
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                            {t.overridden}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {listing.district}, {listing.city}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link className="btn-secondary" href={`/kos/${listing.id}`}>
                        {a.viewListing}
                      </Link>
                      <button
                        className="btn-secondary"
                        onClick={() => toggle(listing.id, !verified)}
                        type="button"
                      >
                        {verified ? t.unverify : t.verify}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        );
      }}
    </AppShell>
  );
}
