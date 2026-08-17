"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";

import type { Locale } from "@/features/home/types";

export type Theme = "light" | "dark";
export type LocaleTransitionState = "idle" | "out" | "in";

/**
 * The app is English-only for now, and light-only with it. Two languages and
 * two themes doubled the copy to write and the styling to check on every
 * change, for a prototype with one audience.
 *
 * Nothing is thrown away: the Indonesian copy still sits in the `id` half of
 * every copy file, the `dark:` classes are still on the markup (inert while the
 * theme is locked), and the switching hooks and their helpers are kept below,
 * commented. Bringing either back means restoring the block at the bottom of
 * this file and uncommenting the toggles in `site-header.tsx`.
 */
export const ACTIVE_LOCALE: Locale = "en";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function useLocaleTransition(initialLocale: Locale = ACTIVE_LOCALE) {
  // One language means no stored choice, no switch, and so no transition to
  // animate — but the shape callers destructure stays the same.
  void initialLocale;

  useEffect(() => {
    document.documentElement.lang = ACTIVE_LOCALE;
  }, []);

  return {
    changeLocale: () => {},
    locale: ACTIVE_LOCALE,
    selectedLocale: ACTIVE_LOCALE,
    transitionState: "idle" as LocaleTransitionState,
  } as const;
}

export function useTheme() {
  // The stored choice and the system preference are ignored rather than read,
  // so a browser set to dark does not half-apply a theme nobody is maintaining.
  useEffect(() => {
    applyTheme("light");
  }, []);

  return { theme: "light" as Theme, toggleTheme: () => {} } as const;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Switchable locale and theme, kept whole for when either comes back. Restore
   these two hooks over the locked ones above, and uncomment the toggles in
   `site-header.tsx`.

const LOCALE_STORAGE_KEY = "papikos.locale";
const THEME_STORAGE_KEY = "papikos.theme";
const localeTransitionOutMs = 120;
const localeTransitionInMs = 180;

function readStoredChoice<T extends string>(
  key: string,
  allowed: readonly T[],
): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as unknown;
    return typeof value === "string" && allowed.includes(value as T)
      ? (value as T)
      : null;
  } catch {
    return null;
  }
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function getSystemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useLocaleTransition(initialLocale: Locale = "id") {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(initialLocale);
  const [transitionState, setTransitionState] =
    useState<LocaleTransitionState>("idle");
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      const stored = readStoredChoice<Locale>(LOCALE_STORAGE_KEY, ["id", "en"]);
      if (stored) {
        setLocale(stored);
        setSelectedLocale(stored);
      }
    }, 0);
    return () => {
      window.clearTimeout(initialTimer);
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const changeLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === selectedLocale && transitionState === "idle") return;

      clearTimers();
      setSelectedLocale(nextLocale);
      window.localStorage.setItem(
        LOCALE_STORAGE_KEY,
        JSON.stringify(nextLocale),
      );

      if (prefersReducedMotion()) {
        setLocale(nextLocale);
        setTransitionState("idle");
        return;
      }

      setTransitionState("out");
      timersRef.current.push(
        window.setTimeout(() => {
          setLocale(nextLocale);
          setTransitionState("in");
          timersRef.current.push(
            window.setTimeout(
              () => setTransitionState("idle"),
              localeTransitionInMs,
            ),
          );
        }, localeTransitionOutMs),
      );
    },
    [clearTimers, selectedLocale, transitionState],
  );

  return {
    changeLocale,
    locale,
    selectedLocale,
    transitionState,
  } as const;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [hasExplicitTheme, setHasExplicitTheme] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStoredChoice<Theme>(THEME_STORAGE_KEY, ["light", "dark"]);
      const initial =
        stored ??
        (document.documentElement.dataset.theme === "dark"
          ? "dark"
          : getSystemTheme());
      setTheme(initial);
      setHasExplicitTheme(Boolean(stored));
      applyTheme(initial);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasExplicitTheme) return;
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;

    const updateFromSystem = (event: MediaQueryListEvent) => {
      const nextTheme = event.matches ? "dark" : "light";
      setTheme(nextTheme);
      applyTheme(nextTheme);
    };
    media.addEventListener?.("change", updateFromSystem);
    return () => media.removeEventListener?.("change", updateFromSystem);
  }, [hasExplicitTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const nextTheme = current === "light" ? "dark" : "light";
      setHasExplicitTheme(true);
      window.localStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify(nextTheme),
      );
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  return { theme, toggleTheme } as const;
}

───────────────────────────────────────────────────────────────────────────── */

/* The switches themselves. Nothing renders them while the app is locked to one
   language and one theme; they are left intact so bringing either back is a
   matter of uncommenting their use in `site-header.tsx`. */

export function LanguageToggle({
  locale,
  onChange,
  label,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
  label: string;
}) {
  return (
    <div
      className="language-toggle relative grid grid-cols-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      data-locale={locale}
      aria-label={label}
      role="group"
    >
      <span
        className="language-toggle-pill pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-full bg-blue-600 shadow-sm"
        aria-hidden="true"
      />
      {(["id", "en"] as const).map((item) => (
        <button
          className={`relative z-10 min-w-9 rounded-full px-2 py-1.5 text-xs font-bold transition-colors ${
            locale === item
              ? "text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
          key={item}
          onClick={() => onChange(item)}
          type="button"
          aria-pressed={locale === item}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle({
  locale,
  theme,
  onToggle,
}: {
  locale: Locale;
  theme: Theme;
  onToggle: () => void;
}) {
  const nextTheme = theme === "light" ? "dark" : "light";
  const label =
    locale === "id"
      ? `Aktifkan mode ${nextTheme === "dark" ? "gelap" : "terang"}`
      : `Switch to ${nextTheme} mode`;
  const Icon = theme === "light" ? Moon : Sun;

  return (
    <button
      className="theme-toggle grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:border-blue-700 dark:hover:text-amber-200 dark:focus:ring-blue-950"
      onClick={onToggle}
      type="button"
      aria-label={label}
      title={label}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}
