"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function Dialog({
  children,
  label,
  motionState = "open",
  onClose,
  size = "panel",
}: {
  children: ReactNode;
  label: string;
  motionState?: "open" | "closing";
  onClose: () => void;
  /** "wide" is for content that is the point rather than the frame: a photo. */
  size?: "panel" | "wide";
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current
      ?.querySelector<HTMLElement>("button, select, input, textarea")
      ?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-[100] grid place-items-end bg-slate-950/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-6"
      data-dialog-state={motionState}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        aria-label={label}
        aria-modal="true"
        className={`dialog-panel max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white dark:bg-slate-900 shadow-2xl sm:rounded-[2rem] ${
          size === "wide" ? "sm:max-w-[min(92vw,1400px)]" : "sm:max-w-xl"
        }`}
        data-dialog-state={motionState}
        ref={panelRef}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
}
