import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageToggle, useLocaleTransition, useTheme } from "./preferences";

function mockMedia({ dark = false, reducedMotion = false } = {}) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query.includes("prefers-color-scheme")
        ? dark
        : reducedMotion,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
    })),
  });
}

function PreferencesHarness() {
  const { changeLocale, locale, selectedLocale, transitionState } =
    useLocaleTransition();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <LanguageToggle
        label="Language"
        locale={selectedLocale}
        onChange={changeLocale}
      />
      <button onClick={toggleTheme} type="button">
        toggle theme
      </button>
      <p data-locale-transition={transitionState} data-testid="copy">
        {locale === "id" ? "Indonesia" : "English"} / {theme}
      </p>
    </>
  );
}

describe("display preferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
    mockMedia();
  });

  it("slides the selected language immediately and crossfades persisted copy", async () => {
    render(<PreferencesHarness />);

    fireEvent.click(screen.getByRole("button", { name: "ID" }));

    // The pill moves on the click; the copy waits for the fade so the two
    // languages never overlap mid-sentence.
    expect(screen.getByLabelText("Language")).toHaveAttribute(
      "data-locale",
      "id",
    );
    expect(screen.getByTestId("copy")).toHaveAttribute(
      "data-locale-transition",
      "out",
    );
    expect(window.localStorage.getItem("papikos.locale")).toBe('"id"');

    expect(await screen.findByText(/Indonesia/)).toBeVisible();
    await waitFor(() =>
      expect(screen.getByTestId("copy")).toHaveAttribute(
        "data-locale-transition",
        "idle",
      ),
    );
  });

  it("opens in English and restores a stored language", async () => {
    window.localStorage.setItem("papikos.locale", '"id"');
    render(<PreferencesHarness />);

    expect(screen.getByTestId("copy")).toHaveTextContent("English");
    expect(await screen.findByText(/Indonesia/)).toBeVisible();
  });

  it("changes the language immediately when reduced motion is requested", async () => {
    mockMedia({ reducedMotion: true });
    render(<PreferencesHarness />);

    fireEvent.click(screen.getByRole("button", { name: "ID" }));

    expect(await screen.findByText(/Indonesia/)).toBeVisible();
    expect(screen.getByTestId("copy")).toHaveAttribute(
      "data-locale-transition",
      "idle",
    );
  });

  it("stays light even when the system and a stored choice ask for dark", () => {
    mockMedia({ dark: true });
    window.localStorage.setItem("papikos.theme", '"dark"');
    render(<PreferencesHarness />);

    fireEvent.click(screen.getByRole("button", { name: "toggle theme" }));

    // Dark mode is switched off, so neither a stored choice nor the system can
    // half-apply a theme nobody is maintaining.
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(screen.getByTestId("copy")).toHaveTextContent("light");
  });
});

/* The theme behaviour this replaced, kept for when dark mode comes back:

  it("uses the system theme first, then persists an explicit choice", async () => {
    mockMedia({ dark: true });
    render(<PreferencesHarness />);

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("data-theme", "dark"),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Aktifkan mode terang" }),
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(window.localStorage.getItem("papikos.theme")).toBe('"light"');
  });

*/
