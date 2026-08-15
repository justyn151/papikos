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

    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    expect(screen.getAllByText("Wajib diisi.")).toHaveLength(2);
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
    fireEvent.change(screen.getByLabelText("Kata sandi"), {
      target: { value: "kosidaman1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    expect(screen.getByText("Format email belum benar.")).toBeInTheDocument();
  });

  it("confirms a valid submission without creating a session", () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "renter@papikos.id" },
    });
    fireEvent.change(screen.getByLabelText("Kata sandi"), {
      target: { value: "kosidaman1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    expect(screen.getByText("Form masuk tervalidasi")).toBeInTheDocument();
    // No credential may be persisted while auth is unimplemented.
    expect(JSON.stringify(window.localStorage)).not.toContain("kosidaman1");
  });

  it("toggles password visibility", () => {
    render(<LoginPage />);

    const password = screen.getByLabelText("Kata sandi");
    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(
      screen.getByRole("button", { name: "Tampilkan kata sandi" }),
    );
    expect(password).toHaveAttribute("type", "text");
  });

  it("links to the register page", () => {
    render(<LoginPage />);

    expect(screen.getByRole("link", { name: "Daftar sekarang" })).toHaveAttribute(
      "href",
      "/daftar",
    );
  });
});

describe("register page", () => {
  function fillValidForm() {
    fireEvent.change(screen.getByLabelText("Nama lengkap"), {
      target: { value: "Sinta" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "sinta@papikos.id" },
    });
    fireEvent.change(screen.getByLabelText("Nomor HP"), {
      target: { value: "081234567890" },
    });
    fireEvent.change(screen.getByLabelText("Kata sandi"), {
      target: { value: "kosidaman1" },
    });
    fireEvent.change(screen.getByLabelText("Ulangi kata sandi"), {
      target: { value: "kosidaman1" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
  }

  it("reports mismatched passwords", () => {
    render(<RegisterPage />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText("Ulangi kata sandi"), {
      target: { value: "kosidaman2" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Daftar" }));

    expect(screen.getByText("Kata sandi tidak sama.")).toBeInTheDocument();
  });

  it("requires the terms checkbox", () => {
    render(<RegisterPage />);
    fillValidForm();
    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(screen.getByRole("button", { name: "Daftar" }));

    expect(
      screen.getByText("Kamu perlu menyetujui ketentuan."),
    ).toBeInTheDocument();
  });

  it("requires a phone number", () => {
    render(<RegisterPage />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText("Nomor HP"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Daftar" }));

    expect(screen.getByText("Wajib diisi.")).toBeInTheDocument();
    expect(
      screen.queryByText("Form pendaftaran tervalidasi"),
    ).not.toBeInTheDocument();
  });

  it("rejects a malformed phone number", () => {
    render(<RegisterPage />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText("Nomor HP"), {
      target: { value: "12345" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Daftar" }));

    expect(
      screen.getByText("Nomor HP Indonesia belum valid."),
    ).toBeInTheDocument();
  });

  it("lets an owner sign up and confirms without storing credentials", () => {
    render(<RegisterPage />);

    fireEvent.click(screen.getByRole("button", { name: "Menyewakan kos" }));
    expect(
      screen.getByRole("button", { name: "Menyewakan kos" }),
    ).toHaveAttribute("aria-pressed", "true");

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Daftar" }));

    expect(
      screen.getByText("Form pendaftaran tervalidasi"),
    ).toBeInTheDocument();
    expect(JSON.stringify(window.localStorage)).not.toContain("kosidaman1");
  });

  it("links back to the login page", () => {
    render(<RegisterPage />);

    expect(screen.getByRole("link", { name: "Masuk di sini" })).toHaveAttribute(
      "href",
      "/masuk",
    );
  });
});
