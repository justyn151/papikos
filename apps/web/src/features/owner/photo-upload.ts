import type { ListingPhoto } from "@/features/listings/types";
import { createId } from "@/features/shared/create-id";

/**
 * Photos live in `localStorage` alongside favorites, bookings, and questions,
 * inside a budget of roughly 5MB for the whole origin. Originals from a phone
 * camera are several megabytes each, so every upload is downscaled and
 * re-encoded before it is ever handed to the store, and the count is capped.
 *
 * Real uploads to object storage arrive with the API; this is the prototype's
 * stand-in, not a preview of that contract.
 */

export const MAX_PHOTOS = 4;
export const MAX_PHOTO_EDGE = 800;
export const PHOTO_QUALITY = 0.7;

export type PhotoErrorReason = "type" | "cap" | "read" | "quota";

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

/**
 * Appends what fits and reports what did not, so the caller can explain the
 * cap rather than silently dropping the extra files a user just picked.
 */
export function acceptPhotos(
  existing: ListingPhoto[],
  incoming: ListingPhoto[],
): { photos: ListingPhoto[]; rejected: number } {
  const room = remainingSlots(existing);
  return {
    photos: [...existing, ...incoming.slice(0, room)],
    rejected: Math.max(0, incoming.length - room),
  };
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
