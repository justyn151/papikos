import { describe, expect, it } from "vitest";

import type { ListingPhoto } from "@/features/listings/types";

import {
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  MAX_PHOTO_EDGE,
  acceptPhotos,
  approximateBytes,
  fitDimensions,
  isImageFile,
  isQuotaError,
  promoteCover,
  remainingBytes,
  remainingSlots,
  removePhoto,
  totalBytes,
} from "./photo-upload";

function photo(id: string, payload = "AAAA"): ListingPhoto {
  return { id, dataUrl: `data:image/jpeg;base64,${payload}` };
}

/** A photo of a chosen decoded size, for exercising the byte budget. */
function sized(id: string, bytes: number): ListingPhoto {
  return photo(id, "A".repeat(Math.ceil(bytes / 3) * 4));
}

describe("fitDimensions", () => {
  it("leaves an already small image alone", () => {
    expect(fitDimensions(640, 480)).toEqual({ width: 640, height: 480 });
  });

  it("scales the long edge down and keeps the aspect ratio", () => {
    const fitted = fitDimensions(4000, 3000);

    expect(fitted.width).toBe(MAX_PHOTO_EDGE);
    expect(fitted.height).toBe(Math.round((3000 * MAX_PHOTO_EDGE) / 4000));
    expect(fitted.width / fitted.height).toBeCloseTo(4 / 3, 2);
  });

  it("scales a portrait photo by its height", () => {
    const fitted = fitDimensions(1200, 2400);

    expect(fitted.height).toBe(MAX_PHOTO_EDGE);
    expect(fitted.width).toBe(MAX_PHOTO_EDGE / 2);
  });

  it("never rounds a very thin image down to zero pixels", () => {
    expect(fitDimensions(10_000, 3).height).toBe(1);
  });
});

describe("the photo cap", () => {
  it("reports the free slots", () => {
    expect(remainingSlots([])).toBe(MAX_PHOTOS);
    expect(remainingSlots([photo("a"), photo("b")])).toBe(MAX_PHOTOS - 2);
  });

  it("keeps what fits and reports what was dropped", () => {
    const existing = Array.from({ length: MAX_PHOTOS - 1 }, (_, index) =>
      photo(`existing-${index}`),
    );
    const result = acceptPhotos(existing, [photo("new-1"), photo("new-2")]);

    expect(result.photos).toHaveLength(MAX_PHOTOS);
    expect(result.photos.at(-1)?.id).toBe("new-1");
    expect(result.rejectedCap).toBe(1);
    expect(result.rejectedBudget).toBe(0);
  });

  it("rejects everything once full", () => {
    const full = Array.from({ length: MAX_PHOTOS }, (_, index) =>
      photo(`full-${index}`),
    );
    const result = acceptPhotos(full, [photo("new")]);

    expect(result.photos).toEqual(full);
    expect(result.rejectedCap).toBe(1);
  });
});

describe("the photo byte budget", () => {
  it("reports the free bytes", () => {
    expect(remainingBytes([])).toBe(MAX_PHOTO_BYTES);
    expect(remainingBytes([sized("a", 300_000)])).toBe(
      MAX_PHOTO_BYTES - approximateBytes(sized("a", 300_000).dataUrl),
    );
  });

  it("refuses a photo that would not fit in the remaining budget", () => {
    const existing = [sized("big", MAX_PHOTO_BYTES - 1_000)];
    const result = acceptPhotos(existing, [sized("another", 300_000)]);

    // Well under the count cap, and still rejected: bytes are the real limit.
    expect(result.photos).toEqual(existing);
    expect(result.rejectedCap).toBe(0);
    expect(result.rejectedBudget).toBe(1);
  });

  it("takes the photos that fit and drops only the ones that do not", () => {
    const result = acceptPhotos(
      [sized("existing", MAX_PHOTO_BYTES - 400_000)],
      [sized("fits", 200_000), sized("too-big", 300_000), sized("also-fits", 100_000)],
    );

    expect(result.photos.map((item) => item.id)).toEqual([
      "existing",
      "fits",
      "also-fits",
    ]);
    expect(result.rejectedBudget).toBe(1);
  });

  it("is the limit a listing actually reaches, not the count", () => {
    // At 1600px and quality 0.82 a photo lands near 300KB, so a listing runs
    // out of budget around a dozen photos rather than at the count cap. The
    // count is there to keep a gallery a gallery; the bytes protect the store.
    const typicalPhotoBytes = 300_000;

    expect(MAX_PHOTO_BYTES / typicalPhotoBytes).toBeLessThan(MAX_PHOTOS);
    expect(MAX_PHOTO_BYTES / typicalPhotoBytes).toBeGreaterThan(5);
  });
});

describe("cover and removal", () => {
  it("moves the chosen photo to the front", () => {
    const photos = [photo("a"), photo("b"), photo("c")];

    expect(promoteCover(photos, "c").map((item) => item.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("leaves the order alone for an unknown id", () => {
    const photos = [photo("a"), photo("b")];

    expect(promoteCover(photos, "gone")).toBe(photos);
  });

  it("removes by id", () => {
    expect(removePhoto([photo("a"), photo("b")], "a")).toEqual([photo("b")]);
  });
});

describe("size reporting", () => {
  it("decodes the base64 payload length, not the URL length", () => {
    // "AAAA" is four base64 characters, which is three bytes.
    expect(approximateBytes(photo("a").dataUrl)).toBe(3);
    expect(approximateBytes("data:image/jpeg;base64,AAA=")).toBe(2);
    expect(approximateBytes("data:image/jpeg;base64,AA==")).toBe(1);
  });

  it("sums a set", () => {
    expect(totalBytes([photo("a"), photo("b")])).toBe(6);
  });
});

describe("guards", () => {
  it("only accepts image files", () => {
    expect(isImageFile(new File([""], "a.jpg", { type: "image/jpeg" }))).toBe(
      true,
    );
    expect(isImageFile(new File([""], "a.mp4", { type: "video/mp4" }))).toBe(
      false,
    );
    expect(isImageFile(new File([""], "a.pdf", { type: "" }))).toBe(false);
  });

  it("recognises a full-storage failure", () => {
    expect(isQuotaError(new DOMException("full", "QuotaExceededError"))).toBe(
      true,
    );
    expect(isQuotaError(new Error("nope"))).toBe(false);
  });
});
