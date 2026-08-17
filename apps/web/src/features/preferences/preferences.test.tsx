import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLocaleTransition, useTheme } from "./preferences";

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
      <button onClick={() => changeLocale()} type="button">
        change locale
      </button>
      <button onClick={toggleTheme} type="button">
        toggle theme
      </button>
      <p data-locale-transition={transitionState} data-testid="copy">
        {locale}/{selectedLocale}/{theme}
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

  it("stays on English whatever is asked of it", () => {
    window.localStorage.setItem("papikos.locale", '"id"');
    render(<PreferencesHarness />);

    // A stored choice from before the app was locked must not resurrect a
    // language that is no longer maintained.
    screen.getByRole("button", { name: "change locale" }).click();

    expect(screen.getByTestId("copy")).toHaveTextContent("en/en/light");
    expect(screen.getByTestId("copy")).toHaveAttribute(
      "data-locale-transition",
      "idle",
    );
  });

  it("stays light even when the system asks for dark", async () => {
    mockMedia({ dark: true });
    window.localStorage.setItem("papikos.theme", '"dark"');
    render(<PreferencesHarness />);

    screen.getByRole("button", { name: "toggle theme" }).click();

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(screen.getByTestId("copy")).toHaveTextContent("light");
  });
});

/* The switching behaviour these replaced, kept for when the toggles come back:

  it("slides the selected language immediately and crossfades persisted copy", async () => {
    render(<PreferencesHarness />);

    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(screen.getByLabelText("Language")).toHaveAttribute("data-locale", "en");
    expect(screen.getByTestId("copy")).toHaveAttribute(
      "data-locale-transition",
      "out",
    );
    expect(window.localStorage.getItem("papikos.locale")).toBe('"en"');

    expect(await screen.findByText("English")).toBeVisible();
    await waitFor(() =>
      expect(screen.getByTestId("copy")).toHaveAttribute(
        "data-locale-transition",
        "idle",
      ),
    );
  });

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

  it("changes preferences immediately when reduced motion is requested", async () => {
    mockMedia({ reducedMotion: true });
    render(<PreferencesHarness />);

    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(await screen.findByText("English")).toBeVisible();
    expect(screen.getByTestId("copy")).toHaveAttribute(
      "data-locale-transition",
      "idle",
    );
  });

*/
