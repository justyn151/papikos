import type { ListingPhoto } from "@/features/listings/types";
import { createId } from "@/features/shared/create-id";

/**
 * Photos live in `localStorage` alongside favorites, bookings, and questions,
 * inside a budget of roughly 5MB for the whole origin. Originals from a phone
 * camera are several megabytes each, so every upload is downscaled and
 * re-encoded before it is ever handed to the store.
 *
 * The count alone cannot keep a listing inside that budget — twenty large
 * photos and twenty small ones differ by an order of magnitude — so a listing
 * is capped by bytes as well. The byte budget is what actually protects the
 * store; the count is there so the gallery stays a gallery.
 *
 * Real uploads to object storage arrive with the API; this is the prototype's
 * stand-in, not a preview of that contract.
 */

export const MAX_PHOTOS = 20;
export const MAX_PHOTO_EDGE = 720;
export const PHOTO_QUALITY = 0.6;

/**
 * Roughly 1.5MB of photos per listing. At the edge and quality above a photo
 * lands around 40–60KB, so twenty of them fit with room to spare, and a
 * listing of unusually detailed photos runs out of budget before it can starve
 * the rest of the store.
 */
export const MAX_PHOTO_BYTES = 1_500_000;

export type PhotoErrorReason = "type" | "cap" | "budget" | "read" | "quota";

export class PhotoUploadError extends Error {
  readonly reason: PhotoErrorReason;

  constructor(reason: PhotoErrorReason) {
    super(`photo upload failed: ${reason}`);
    this.name = "PhotoUploadError";
    this.reason = reason;
  }
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/** How many more photos this listing can take. */
export function remainingSlots(photos: ListingPhoto[]): number {
  return Math.max(0, MAX_PHOTOS - photos.length);
}

/** How much of the listing's storage budget is left, in bytes. */
export function remainingBytes(photos: ListingPhoto[]): number {
  return Math.max(0, MAX_PHOTO_BYTES - totalBytes(photos));
}

/**
 * Appends what fits and reports what did not, separating the two reasons: an
 * owner who hit the count can delete a photo to make room, while one who hit
 * the byte budget cannot fit that particular photo at all. Silently dropping
 * either would leave them wondering which files actually saved.
 */
export function acceptPhotos(
  existing: ListingPhoto[],
  incoming: ListingPhoto[],
): { photos: ListingPhoto[]; rejectedCap: number; rejectedBudget: number } {
  const photos = [...existing];
  let used = totalBytes(existing);
  let rejectedCap = 0;
  let rejectedBudget = 0;

  for (const photo of incoming) {
    if (photos.length >= MAX_PHOTOS) {
      rejectedCap += 1;
      continue;
    }

    const size = approximateBytes(photo.dataUrl);
    if (used + size > MAX_PHOTO_BYTES) {
      rejectedBudget += 1;
      continue;
    }

    photos.push(photo);
    used += size;
  }

  return { photos, rejectedCap, rejectedBudget };
}

/** The first photo is the cover, so promoting one is a move to the front. */
export function promoteCover(
  photos: ListingPhoto[],
  id: string,
): ListingPhoto[] {
  const target = photos.find((photo) => photo.id === id);
  if (!target) return photos;
  return [target, ...photos.filter((photo) => photo.id !== id)];
}

export function removePhoto(
  photos: ListingPhoto[],
  id: string,
): ListingPhoto[] {
  return photos.filter((photo) => photo.id !== id);
}

/** Scales down to fit `max` on the long edge, never up. */
export function fitDimensions(
  width: number,
  height: number,
  max = MAX_PHOTO_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };

  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Rough decoded size of a data URL, for showing owners the storage cost. */
export function approximateBytes(dataUrl: string): number {
  const payload = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

export function totalBytes(photos: ListingPhoto[]): number {
  return photos.reduce((total, photo) => total + approximateBytes(photo.dataUrl), 0);
}

export function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      // Firefox's legacy name for the same condition.
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new PhotoUploadError("read"));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new PhotoUploadError("read"));
    image.src = source;
  });
}

/**
 * Reads one picked file into a stored photo. Rejects with a
 * `PhotoUploadError` rather than storing the untouched original, because an
 * original large enough to fail the canvas step is also large enough to blow
 * the storage budget on its own.
 */
export async function readPhotoFile(file: File): Promise<ListingPhoto> {
  if (!isImageFile(file)) throw new PhotoUploadError("type");

  const original = await fileToDataUrl(file);
  const image = await loadImage(original);
  const { width, height } = fitDimensions(image.width, image.height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new PhotoUploadError("read");

  context.drawImage(image, 0, 0, width, height);

  return {
    id: createId("photo"),
    dataUrl: canvas.toDataURL("image/jpeg", PHOTO_QUALITY),
  };
}
