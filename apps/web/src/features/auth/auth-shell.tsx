"use client";

import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { copy } from "@/features/home/copy";
import { defaultFilters, serializeFilters } from "@/features/home/home-utils";
import type { Locale } from "@/features/home/types";
import { PrototypeRoleBar } from "@/features/navigation/prototype-role-bar";
import { SiteHeader } from "@/features/navigation/site-header";
import {
  useLocaleTransition,
  useTheme,
} from "@/features/preferences/preferences";

import { authCopy } from "./auth-copy";

/**
 * Shared chrome for the auth routes: site header, centered card, and the
 * prototype disclaimer that keeps these forms from reading as real accounts.
 */
export function AuthShell({
  children,
  title,
  subtitle,
  footer,
}: {
  children: (locale: Locale) => ReactNode;
  title: (locale: Locale) => string;
  subtitle: (locale: Locale) => string;
  footer: (locale: Locale) => ReactNode;
}) {
  const { changeLocale, locale, selectedLocale, transitionState } =
    useLocaleTransition();
  const { theme, toggleTheme } = useTheme();
  const [headerQuery, setHeaderQuery] = useState("");
  const t = copy[locale];
  const a = authCopy[locale];

  useEffect(() => {
    document.documentElement.dataset.papikosReady = "true";
    return () => {
      delete document.documentElement.dataset.papikosReady;
    };
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition focus:translate-y-0"
      >
        {t.skip}
      </a>

      <PrototypeRoleBar locale={locale} />

      <SiteHeader
        locale={locale}
        selectedLocale={selectedLocale}
        onChangeLocale={changeLocale}
        theme={theme}
        onToggleTheme={toggleTheme}
        loginHref="/masuk"
        loginLabel={t.login}
        languageLabel={t.language}
        searchLabel={t.location}
        searchPlaceholder={t.locationPlaceholder}
        searchButtonLabel={t.search}
        searchValue={headerQuery}
        onSearchChange={setHeaderQuery}
        onSearchSubmit={(value) =>
          window.location.assign(
            `/kos${serializeFilters({ ...defaultFilters, query: value })}`,
          )
        }
      />

      <main
        className="locale-content bg-[#f7faff] dark:bg-slate-950"
        data-locale-transition={transitionState}
        id="main-content"
      >
        <div className="mx-auto flex min-h-[calc(100vh-68px)] max-w-lg flex-col justify-center px-5 py-12 sm:px-8">
          <div className="rounded-[1.75rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.5)] sm:p-8">
            <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {title(locale)}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {subtitle(locale)}
            </p>

            <p
              className="mt-5 flex items-start gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/35 p-3.5 text-xs leading-5 font-semibold text-blue-900 dark:text-blue-100"
              role="note"
            >
              <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {a.prototypeNotice}
            </p>

            <div className="mt-6">{children(locale)}</div>
          </div>

          <div className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
            {footer(locale)}
          </div>
        </div>
      </main>
    </>
  );
}
