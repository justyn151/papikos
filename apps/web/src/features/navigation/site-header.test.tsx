import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";

function renderHeader(overrides: Partial<Parameters<typeof SiteHeader>[0]> = {}) {
  const props = {
    locale: "id" as const,
    selectedLocale: "id" as const,
    onChangeLocale: vi.fn(),
    theme: "light" as const,
    onToggleTheme: vi.fn(),
    loginHref: "/masuk",
    loginLabel: "Sign in",
    languageLabel: "Language",
    searchLabel: "Location",
    searchPlaceholder: "City, area, or property name",
    searchButtonLabel: "Find a kos",
    searchValue: "",
    onSearchChange: vi.fn(),
    onSearchSubmit: vi.fn(),
    ...overrides,
  };
  render(<SiteHeader {...props} />);
  return props;
}

describe("SiteHeader", () => {
  it("renders the brand, toggles, and login link with no navigation landmark", () => {
    renderHeader();

    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
    expect(screen.getByLabelText("Papikos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/masuk",
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("fires onSearchChange on every keystroke without submitting", () => {
    const props = renderHeader();

    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Band" },
    });

    expect(props.onSearchChange).toHaveBeenCalledWith("Band");
    expect(props.onSearchSubmit).not.toHaveBeenCalled();
  });

  it("submits the trimmed search value once on form submit", () => {
    const props = renderHeader({ searchValue: "  Bandung  " });

    fireEvent.click(screen.getByRole("button", { name: "Find a kos" }));

    expect(props.onSearchSubmit).toHaveBeenCalledTimes(1);
    expect(props.onSearchSubmit).toHaveBeenCalledWith("Bandung");
  });

  it("submits on Enter within the search field", () => {
    const props = renderHeader({ searchValue: "Jakarta" });

    fireEvent.submit(screen.getByLabelText("Location").closest("form")!);

    expect(props.onSearchSubmit).toHaveBeenCalledWith("Jakarta");
  });
});
