"use client";

import { type ReactNode, useEffect, useState } from "react";

import { copy } from "@/features/home/copy";
import { defaultFilters, serializeFilters } from "@/features/home/home-utils";
import type { Locale } from "@/features/home/types";
import {
  useLocaleTransition,
  useTheme,
} from "@/features/preferences/preferences";

import { PrototypeRoleBar } from "./prototype-role-bar";
import { SiteHeader } from "./site-header";

/**
 * Standard chrome for the secondary surfaces (renter account, owner, admin):
 * role bar, site header, main landmark, and an optional toast. The homepage,
 * search, and detail pages keep their own bespoke layouts.
 */
export function AppShell({
  children,
  toast,
}: {
  children: (locale: Locale) => ReactNode;
  toast?: string;
}) {
  const { changeLocale, locale, selectedLocale, transitionState } =
    useLocaleTransition();
  const { theme, toggleTheme } = useTheme();
  const [headerQuery, setHeaderQuery] = useState("");
  const t = copy[locale];

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
        favoritesHref="/favorit"
        favoritesLabel={t.favorites}
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
        className="locale-content min-h-[60vh]"
        data-locale-transition={transitionState}
        id="main-content"
      >
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          {children(locale)}
        </div>
      </main>

      <div
        className={`fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white shadow-2xl transition ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </>
  );
}
