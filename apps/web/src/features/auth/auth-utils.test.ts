import { describe, expect, it } from "vitest";

import {
  emptyLoginValues,
  emptyRegisterValues,
  hasErrors,
  normalizePhone,
  validateLogin,
  validateRegister,
} from "./auth-utils";

describe("login validation", () => {
  it("flags empty fields", () => {
    expect(validateLogin(emptyLoginValues)).toEqual({
      email: "required",
      password: "required",
    });
  });

  it("flags a malformed email but accepts a valid one", () => {
    expect(
      validateLogin({ email: "renter@", password: "whatever" }).email,
    ).toBe("email");
    expect(
      validateLogin({ email: "renter@papikos.id", password: "whatever" }),
    ).toEqual({});
  });

  it("does not impose a length rule on an existing password", () => {
    // Sign-in must accept whatever the account already uses, otherwise older
    // accounts get locked out by a rule that only applies at sign-up.
    expect(
      validateLogin({ email: "renter@papikos.id", password: "short" }),
    ).toEqual({});
  });
});

describe("registration validation", () => {
  const valid = {
    ...emptyRegisterValues,
    name: "Sinta",
    email: "sinta@papikos.id",
    phone: "081234567890",
    password: "kosidaman1",
    confirmPassword: "kosidaman1",
    acceptTerms: true,
  };

  it("accepts a complete submission", () => {
    expect(validateRegister(valid)).toEqual({});
  });

  it("flags every empty required field and the unchecked terms box", () => {
    expect(validateRegister(emptyRegisterValues)).toEqual({
      name: "required",
      email: "required",
      phone: "required",
      password: "required",
      confirmPassword: "required",
      acceptTerms: "terms",
    });
  });

  it("requires a minimum password length", () => {
    expect(
      validateRegister({ ...valid, password: "short", confirmPassword: "short" })
        .password,
    ).toBe("passwordLength");
  });

  it("requires both passwords to match", () => {
    expect(
      validateRegister({ ...valid, confirmPassword: "kosidaman2" })
        .confirmPassword,
    ).toBe("passwordMatch");
  });

  it("requires a phone number and accepts the common Indonesian formats", () => {
    expect(validateRegister({ ...valid, phone: "" }).phone).toBe("required");
    expect(validateRegister({ ...valid, phone: "   " }).phone).toBe("required");
    expect(validateRegister({ ...valid, phone: "0812-3456-7890" }).phone)
      .toBeUndefined();
    expect(validateRegister({ ...valid, phone: "+62 812 3456 7890" }).phone)
      .toBeUndefined();
    expect(validateRegister({ ...valid, phone: "628123456789" }).phone)
      .toBeUndefined();
    expect(validateRegister({ ...valid, phone: "12345" }).phone).toBe("phone");
  });

  it("keeps the owner role selectable", () => {
    expect(validateRegister({ ...valid, role: "owner" })).toEqual({});
  });
});

describe("helpers", () => {
  it("strips separators from phone numbers", () => {
    expect(normalizePhone("+62 (812) 3456-7890")).toBe("+6281234567890");
  });

  it("reports whether any field failed", () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ email: "required" })).toBe(true);
  });
});
