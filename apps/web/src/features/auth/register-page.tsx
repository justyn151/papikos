"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import type { Locale } from "@/features/home/types";

import { authCopy } from "./auth-copy";
import { FieldError, PasswordField, TextField } from "./auth-fields";
import { AuthShell } from "./auth-shell";
import {
  type AuthRole,
  emptyRegisterValues,
  hasErrors,
  type RegisterErrors,
  type RegisterValues,
  validateRegister,
} from "./auth-utils";

function RegisterForm({ locale }: { locale: Locale }) {
  const a = authCopy[locale];
  const [values, setValues] = useState<RegisterValues>(emptyRegisterValues);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    // Nothing is persisted or transmitted: real sign-up arrives with the API.
    setValues(emptyRegisterValues);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/35 p-5 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-300 shadow-sm">
          <CircleCheck size={22} aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-black text-slate-950 dark:text-slate-50">
          {a.registerDoneTitle}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {a.registerDoneBody}
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
          {a.roleLabel}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["renter", a.roleRenter],
              ["owner", a.roleOwner],
            ] as const
          ).map(([role, label]) => {
            const selected = values.role === role;
            return (
              <button
                aria-pressed={selected}
                className={`filter-chip rounded-xl border px-3 py-3 text-sm font-bold transition ${
                  selected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-300"
                }`}
                key={role}
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    role: role as AuthRole,
                  }))
                }
                type="button"
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <TextField
        autoComplete="name"
        error={errors.name ? a.errors[errors.name] : undefined}
        id="register-name"
        label={a.nameLabel}
        onChange={(name) => setValues((current) => ({ ...current, name }))}
        placeholder={a.namePlaceholder}
        value={values.name}
      />
      <TextField
        autoComplete="email"
        error={errors.email ? a.errors[errors.email] : undefined}
        id="register-email"
        inputMode="email"
        label={a.emailLabel}
        onChange={(email) => setValues((current) => ({ ...current, email }))}
        placeholder={a.emailPlaceholder}
        type="email"
        value={values.email}
      />
      <TextField
        autoComplete="tel"
        error={errors.phone ? a.errors[errors.phone] : undefined}
        id="register-phone"
        inputMode="tel"
        label={a.phoneLabel}
        onChange={(phone) => setValues((current) => ({ ...current, phone }))}
        placeholder={a.phonePlaceholder}
        type="tel"
        value={values.phone}
      />
      <PasswordField
        autoComplete="new-password"
        error={errors.password ? a.errors[errors.password] : undefined}
        hideLabel={a.hidePassword}
        id="register-password"
        label={a.passwordLabel}
        onChange={(password) =>
          setValues((current) => ({ ...current, password }))
        }
        placeholder={a.passwordPlaceholder}
        showLabel={a.showPassword}
        value={values.password}
      />
      <PasswordField
        autoComplete="new-password"
        error={
          errors.confirmPassword ? a.errors[errors.confirmPassword] : undefined
        }
        hideLabel={a.hidePassword}
        id="register-confirm-password"
        label={a.confirmPasswordLabel}
        onChange={(confirmPassword) =>
          setValues((current) => ({ ...current, confirmPassword }))
        }
        showLabel={a.showPassword}
        value={values.confirmPassword}
      />

      <div className="grid gap-1.5">
        <label className="flex items-start gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <input
            aria-describedby={
              errors.acceptTerms ? "register-terms-error" : undefined
            }
            checked={values.acceptTerms}
            className="mt-0.5 size-4 shrink-0 accent-blue-600"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                acceptTerms: event.target.checked,
              }))
            }
            type="checkbox"
          />
          <span>{a.termsLabel}</span>
        </label>
        <FieldError
          id="register-terms-error"
          message={errors.acceptTerms ? a.errors[errors.acceptTerms] : undefined}
        />
      </div>

      <button className="btn-primary mt-1 w-full" type="submit">
        {a.registerSubmit}
      </button>
    </form>
  );
}

export function RegisterPage() {
  return (
    <AuthShell
      title={(locale) => authCopy[locale].registerTitle}
      subtitle={(locale) => authCopy[locale].registerSubtitle}
      footer={(locale) => (
        <>
          {authCopy[locale].haveAccount}{" "}
          <Link
            className="font-bold text-blue-600 dark:text-blue-400 transition hover:text-blue-800 dark:hover:text-blue-300"
            href="/masuk"
          >
            {authCopy[locale].goLogin}
          </Link>
        </>
      )}
    >
      {(locale) => <RegisterForm locale={locale} />}
    </AuthShell>
  );
}
