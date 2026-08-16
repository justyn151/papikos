import { useCallback, useEffect, useRef, useState } from "react";

import { readStoredValue } from "@/features/home/home-utils";

export type StorageWriteError = "quota" | "unknown";

function classify(error: unknown): StorageWriteError {
  return error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      // Firefox's legacy name for the same condition.
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ? "quota"
    : "unknown";
}

export function usePersistentState<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue);
  const [value, setStoredValue] = useState<T>(initialValue);
  const [writeError, setWriteError] = useState<StorageWriteError | null>(null);
  // Mirrors `value` so the setter can resolve functional updates without
  // needing the caller to be re-rendered first.
  const latest = useRef(initialValue);

  useEffect(() => {
    const stored = readStoredValue(key, initialRef.current);
    latest.current = stored;
    setStoredValue(stored);
  }, [key]);

  // Persisting here rather than in an effect keeps the write tied to an actual
  // change, and gives the caller somewhere to report a failed write from.
  const setValue = useCallback(
    (update: T | ((current: T) => T)) => {
      const next =
        typeof update === "function"
          ? (update as (current: T) => T)(latest.current)
          : update;

      latest.current = next;
      setStoredValue(next);

      try {
        window.localStorage.setItem(key, JSON.stringify(next));
        setWriteError(null);
      } catch (error) {
        // A full store must not take the page down. The value stays in memory
        // for this session and the caller surfaces the failure to the user.
        setWriteError(classify(error));
      }
    },
    [key],
  );

  return [value, setValue, writeError] as const;
}
