"use client";

import { Heart, Search } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";

import type { Locale } from "@/features/home/types";
import {
  LanguageToggle,
  ThemeToggle,
  type Theme,
} from "@/features/preferences/preferences";

import { BrandMark } from "./brand-mark";

export interface SiteHeaderProps {
  locale: Locale;
  selectedLocale: Locale;
  onChangeLocale: (locale: Locale) => void;
  theme: Theme;
  onToggleTheme: () => void;
  loginHref: string;
  loginLabel: string;
  /** Omitted on surfaces where a saved-kos shortcut would be noise (auth). */
  favoritesHref?: string;
  favoritesLabel?: string;
  languageLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchButtonLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
}

export function SiteHeader({
  locale,
  selectedLocale,
  onChangeLocale,
  theme,
  onToggleTheme,
  loginHref,
  loginLabel,
  favoritesHref,
  favoritesLabel,
  languageLabel,
  searchLabel,
  searchPlaceholder,
  searchButtonLabel,
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: SiteHeaderProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit(searchValue.trim());
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:h-[68px] sm:flex-row sm:items-center sm:gap-3 sm:py-0 sm:px-8">
        <div className="flex items-center justify-between gap-3 sm:contents">
          <Link
            className="sm:order-1 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
            href="/"
          >
            <BrandMark />
          </Link>

          <div className="flex items-center gap-2 sm:order-3">
            <LanguageToggle
              locale={selectedLocale}
              onChange={onChangeLocale}
              label={languageLabel}
            />
            <ThemeToggle locale={locale} theme={theme} onToggle={onToggleTheme} />
            {favoritesHref && favoritesLabel ? (
              <Link
                aria-label={favoritesLabel}
                className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-rose-200 hover:text-rose-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-900"
                href={favoritesHref}
                title={favoritesLabel}
              >
                <Heart size={17} aria-hidden="true" />
              </Link>
            ) : null}
            <Link className="btn-secondary" href={loginHref}>
              {loginLabel}
            </Link>
          </div>
        </div>

        <form
          className="flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-1.5 pl-4 pr-1.5 shadow-sm transition focus-within:border-blue-300 focus-within:bg-white dark:focus-within:bg-slate-950 focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 sm:order-2 sm:mx-auto sm:w-full sm:max-w-md"
          onSubmit={handleSubmit}
        >
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <span className="sr-only">{searchLabel}</span>
            <Search
              size={16}
              className="shrink-0 text-slate-400"
              aria-hidden="true"
            />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <button
            className="search-button inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-2 text-xs font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            type="submit"
            aria-label={searchButtonLabel}
          >
            <Search className="search-icon" size={14} aria-hidden="true" />
            <span className="hidden sm:inline" aria-hidden="true">
              {searchButtonLabel}
            </span>
          </button>
        </form>
      </div>
    </header>
  );
}
