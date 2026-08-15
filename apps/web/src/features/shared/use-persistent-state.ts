import { useEffect, useRef, useState } from "react";

import { readStoredValue } from "@/features/home/home-utils";

export function usePersistentState<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setValue(readStoredValue(key, initialRef.current));
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, ready, value]);

  return [value, setValue] as const;
}
