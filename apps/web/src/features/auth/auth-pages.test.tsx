import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { LoginPage } from "./login-page";
import { RegisterPage } from "./register-page";

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.dataset.theme = "light";
});

describe("login page", () => {
  it("blocks submission and reports errors for empty fields", () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getAllByText("This field is required.")).toHaveLength(2);
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("reports a malformed email", () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "renter@" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "kosidaman1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("That email format looks off.")).toBeInTheDocument();
  });

  it("confirms a valid submission without creating a session", () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "renter@papikos.id" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "kosidaman1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Sign-in form validated")).toBeInTheDocument();
    // No credential may be persisted while auth is unimplemented.
    expect(JSON.stringify(window.localStorage)).not.toContain("kosidaman1");
  });

  it("toggles password visibility", () => {
    render(<LoginPage />);

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(
      screen.getByRole("button", { name: "Show password" }),
    );
    expect(password).toHaveAttribute("type", "text");
  });

  it("links to the register page", () => {
    render(<LoginPage />);

    expect(screen.getByRole("link", { name: "Create one" })).toHaveAttribute(
      "href",
      "/daftar",
    );
  });
});

describe("register page", () => {
  function fillValidForm() {
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Sinta" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "sinta@papikos.id" },
    });
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "081234567890" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "kosidaman1" },
    });
    fireEvent.change(screen.getByLabelText("Repeat password"), {
      target: { value: "kosidaman1" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
  }

  it("reports mismatched passwords", () => {
    render(<RegisterPage />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText("Repeat password"), {
      target: { value: "kosidaman2" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("requires the terms checkbox", () => {
    render(<RegisterPage />);
    fillValidForm();
    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      screen.getByText("Please accept the terms to continue."),
    ).toBeInTheDocument();
  });

  it("requires a phone number", () => {
    render(<RegisterPage />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(screen.getByText("This field is required.")).toBeInTheDocument();
    expect(
      screen.queryByText("Sign-up form validated"),
    ).not.toBeInTheDocument();
  });

  it("rejects a malformed phone number", () => {
    render(<RegisterPage />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "12345" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      screen.getByText("That is not a valid Indonesian number."),
    ).toBeInTheDocument();
  });

  it("lets an owner sign up and confirms without storing credentials", () => {
    render(<RegisterPage />);

    fireEvent.click(screen.getByRole("button", { name: "List a kos" }));
    expect(
      screen.getByRole("button", { name: "List a kos" }),
    ).toHaveAttribute("aria-pressed", "true");

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      screen.getByText("Sign-up form validated"),
    ).toBeInTheDocument();
    expect(JSON.stringify(window.localStorage)).not.toContain("kosidaman1");
  });

  it("links back to the login page", () => {
    render(<RegisterPage />);

    expect(screen.getByRole("link", { name: "Sign in here" })).toHaveAttribute(
      "href",
      "/masuk",
    );
  });
});
