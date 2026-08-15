"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const inputClass =
  "h-12 w-full rounded-xl border bg-white dark:bg-slate-900 px-3.5 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:ring-4";
const inputOk =
  "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-950";
const inputBad =
  "border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-950/60";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400"
      id={id}
    >
      <CircleAlert size={13} aria-hidden="true" />
      {message}
    </p>
  );
}

export function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  error,
}: {
  id: string;
  label: string;
  type?: "text" | "email" | "tel";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  error?: string;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-1.5">
      <label
        className="text-sm font-bold text-slate-800 dark:text-slate-200"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        autoComplete={autoComplete}
        className={`${inputClass} ${error ? inputBad : inputOk}`}
        id={id}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  showLabel,
  hideLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="grid gap-1.5">
      <label
        className="text-sm font-bold text-slate-800 dark:text-slate-200"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete={autoComplete}
          className={`${inputClass} pr-12 ${error ? inputBad : inputOk}`}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? hideLabel : showLabel}
          className="absolute right-1.5 top-1.5 grid size-9 place-items-center rounded-lg text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          <Icon size={17} aria-hidden="true" />
        </button>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
