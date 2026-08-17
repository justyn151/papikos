import type { GalleryCategory, LocalizedText } from "./types";

/**
 * The tags an owner can put on a photo. They are the gallery's own categories,
 * not a new list: the detail page already draws an icon and a caption from
 * this set for the seeded artwork, and an uploaded photo filed as anything
 * else would be captioned wrongly.
 */
export const galleryCategories: GalleryCategory[] = [
  "room",
  "bathroom",
  "shared",
  "exterior",
  "neighborhood",
];

export const galleryCategoryLabels: Record<GalleryCategory, LocalizedText> = {
  room: { id: "Kamar tidur", en: "Bedroom" },
  bathroom: { id: "Kamar mandi", en: "Bathroom" },
  shared: { id: "Area bersama", en: "Shared area" },
  exterior: { id: "Tampak luar", en: "Exterior" },
  neighborhood: { id: "Sekitar kos", en: "Neighbourhood" },
};

export function isGalleryCategory(value: unknown): value is GalleryCategory {
  return galleryCategories.includes(value as GalleryCategory);
}
