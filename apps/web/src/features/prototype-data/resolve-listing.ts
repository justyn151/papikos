import type {
  CostItem,
  Listing,
  ListingDetail,
  ListingOverride,
  LocalizedText,
  OverrideRoom,
  RoomOption,
} from "@/features/listings/types";

/** Owner-typed text, which is one language rather than a translation pair. */
function ownText(value: string): LocalizedText {
  return { id: value, en: value };
}

/**
 * Keeps the seeded translation when the owner left the text alone, and takes
 * the owner's wording when they did not. Without this, opening the editor and
 * saving would flatten every seeded room name into whichever language the
 * owner happened to be reading.
 */
function mergedText(value: string, seeded: LocalizedText | undefined) {
  if (!seeded) return ownText(value);
  return value === seeded.id || value === seeded.en ? seeded : ownText(value);
}

function mergeRoom(room: OverrideRoom, seeded: RoomOption | undefined): RoomOption {
  const furnishings = room.furnishings.map((item, index) =>
    mergedText(item, seeded?.furnishings[index]),
  );

  return {
    id: room.id,
    name: mergedText(room.name, seeded?.name),
    size: room.size,
    price: room.price,
    availableRooms: room.availableRooms,
    bathroom: room.bathroom,
    furnishings,
  };
}

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
    ...(override.city !== undefined ? { city: override.city } : {}),
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

  // The override's rooms are the whole list, not a patch: owners add and
  // remove rooms, so a seeded room the owner deleted must not survive here.
  const rooms = override.rooms
    ? override.rooms.map((room) =>
        mergeRoom(
          room,
          base.rooms.find((seeded) => seeded.id === room.id),
        ),
      )
    : base.rooms;

  const seededCosts: CostItem[] = override.costs
    ? base.costs
        .map((cost) => {
          const edit = override.costs?.find((item) => item.id === cost.id);
          if (!edit) return cost;
          if (edit.removed) return null;
          return { ...cost, amount: edit.amount, included: edit.included };
        })
        .filter((cost): cost is CostItem => cost !== null)
    : base.costs;

  const costs =
    override.customCosts && override.customCosts.length > 0
      ? [
          ...seededCosts,
          ...override.customCosts.map((cost) => ({
            id: cost.id,
            label: ownText(cost.label),
            amount: cost.amount,
            included: cost.included,
          })),
        ]
      : seededCosts;

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

  // Uploaded photos lead the gallery — the first one is the cover — and the
  // generated artwork stays behind them so a listing with one photo still has
  // something to show for every room and the neighbourhood.
  const gallery =
    override.photos && override.photos.length > 0
      ? [
          ...override.photos.map((photo, index) => ({
            id: photo.id,
            category: "room" as const,
            label: {
              id: `Foto pemilik ${index + 1}`,
              en: `Owner photo ${index + 1}`,
            },
            variant: index,
            dataUrl: photo.dataUrl,
          })),
          ...base.gallery,
        ]
      : base.gallery;

  return {
    ...base,
    gallery,
    ...(override.description !== undefined
      ? { description: ownText(override.description) }
      : {}),
    ...(override.approximateArea !== undefined
      ? { approximateArea: override.approximateArea }
      : {}),
    ...(override.privacyRadiusMeters !== undefined
      ? { privacyRadiusMeters: override.privacyRadiusMeters }
      : {}),
    ...(override.availableFrom !== undefined
      ? { availableFrom: override.availableFrom }
      : {}),
    ...(override.minimumStayMonths !== undefined
      ? { minimumStayMonths: override.minimumStayMonths }
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
