"use client";

import type { PrototypeRole } from "@/features/listings/types";
import { ROLE_STORAGE_KEY } from "@/features/shared/storage-keys";
import { usePersistentState } from "@/features/shared/use-persistent-state";

export const prototypeRoles: PrototypeRole[] = ["renter", "owner", "admin"];

/**
 * Which surface the prototype is currently being previewed as. This is a demo
 * affordance, not authorization: without an API there is nothing to enforce,
 * and AGENTS.md is explicit that hiding a client control is not enough.
 */
export function usePrototypeRole() {
  const [stored, setRole] = usePersistentState<PrototypeRole>(
    ROLE_STORAGE_KEY,
    "renter",
  );
  const role = prototypeRoles.includes(stored) ? stored : "renter";

  return { role, setRole };
}
