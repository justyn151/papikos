import type {
  Listing,
  ListingDetail,
  ListingOverride,
} from "@/features/listings/types";

/**
 * Merges an owner's edits over the seeded listing data. Absent override fields
 * fall through to the seed, so clearing an override restores the original
 * without needing to store a copy of it.
 */
export function resolveListing<T extends Listing>(
  seed: T,
  override: ListingOverride | undefined,
): T {
  if (!override) return seed;

  const merged: T = {
    ...seed,
    ...(override.name !== undefined ? { name: override.name } : {}),
    ...(override.price !== undefined ? { price: override.price } : {}),
    ...(override.promoPrice !== undefined
      ? { promoPrice: override.promoPrice }
      : {}),
    ...(override.type !== undefined ? { type: override.type } : {}),
    ...(override.district !== undefined ? { district: override.district } : {}),
    ...(override.amenities !== undefined
      ? { amenities: override.amenities }
      : {}),
  };

  return merged;
}

/** The detail-shaped merge, which additionally covers rooms, rules, and costs. */
export function resolveListingDetail(
  seed: ListingDetail,
  override: ListingOverride | undefined,
): ListingDetail {
  const base = resolveListing(seed, override);
  if (!override) return base;

  const rooms = override.rooms
    ? base.rooms.map((room) => {
        const edit = override.rooms?.find((item) => item.id === room.id);
        return edit
          ? {
              ...room,
              price: edit.price,
              availableRooms: edit.availableRooms,
            }
          : room;
      })
    : base.rooms;

  const costs = override.costs
    ? base.costs.map((cost) => {
        const edit = override.costs?.find((item) => item.id === cost.id);
        return edit
          ? { ...cost, amount: edit.amount, included: edit.included }
          : cost;
      })
    : base.costs;

  const seededRules = override.rules
    ? base.rules.map((rule) => {
        const edit = override.rules?.find((item) => item.id === rule.id);
        return edit ? { ...rule, allowed: edit.allowed } : rule;
      })
    : base.rules;

  // Custom rules are additive: the standard set stays in place so a renter
  // always sees the same baseline questions answered on every listing.
  const rules =
    override.customRules && override.customRules.length > 0
      ? [
          ...seededRules,
          ...override.customRules.map((rule) => ({
            id: rule.id,
            // Owners write one sentence, not a translation pair.
            label: { id: rule.label, en: rule.label },
            allowed: rule.allowed,
          })),
        ]
      : seededRules;

  return {
    ...base,
    ...(override.description !== undefined
      ? { description: { id: override.description, en: override.description } }
      : {}),
    // Availability is derived so the card, the filters, and the room list
    // cannot disagree about whether a kos has space.
    availableRooms: override.rooms
      ? rooms.reduce((total, room) => total + room.availableRooms, 0)
      : base.availableRooms,
    rooms,
    costs,
    rules,
  };
}
