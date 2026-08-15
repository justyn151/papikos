"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import type { Locale } from "@/features/home/types";

import { authCopy } from "./auth-copy";
import { PasswordField, TextField } from "./auth-fields";
import { AuthShell } from "./auth-shell";
import {
  emptyLoginValues,
  hasErrors,
  type LoginErrors,
  type LoginValues,
  validateLogin,
} from "./auth-utils";

function LoginForm({ locale }: { locale: Locale }) {
  const a = authCopy[locale];
  const [values, setValues] = useState<LoginValues>(emptyLoginValues);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    // Nothing is persisted or transmitted: real sign-in arrives with the API.
    setValues(emptyLoginValues);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/35 p-5 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-300 shadow-sm">
          <CircleCheck size={22} aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-black text-slate-950 dark:text-slate-50">
          {a.loginDoneTitle}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {a.loginDoneBody}
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <TextField
        autoComplete="email"
        error={errors.email ? a.errors[errors.email] : undefined}
        id="login-email"
        inputMode="email"
        label={a.emailLabel}
        onChange={(email) => setValues((current) => ({ ...current, email }))}
        placeholder={a.emailPlaceholder}
        type="email"
        value={values.email}
      />
      <PasswordField
        autoComplete="current-password"
        error={errors.password ? a.errors[errors.password] : undefined}
        hideLabel={a.hidePassword}
        id="login-password"
        label={a.passwordLabel}
        onChange={(password) =>
          setValues((current) => ({ ...current, password }))
        }
        showLabel={a.showPassword}
        value={values.password}
      />
      <button className="btn-primary mt-1 w-full" type="submit">
        {a.loginSubmit}
      </button>
      <span className="text-center text-xs font-bold text-slate-400 dark:text-slate-500">
        {a.forgotPassword}
      </span>
    </form>
  );
}

export function LoginPage() {
  return (
    <AuthShell
      title={(locale) => authCopy[locale].loginTitle}
      subtitle={(locale) => authCopy[locale].loginSubtitle}
      footer={(locale) => (
        <>
          {authCopy[locale].noAccount}{" "}
          <Link
            className="font-bold text-blue-600 dark:text-blue-400 transition hover:text-blue-800 dark:hover:text-blue-300"
            href="/daftar"
          >
            {authCopy[locale].goRegister}
          </Link>
        </>
      )}
    >
      {(locale) => <LoginForm locale={locale} />}
    </AuthShell>
  );
}
