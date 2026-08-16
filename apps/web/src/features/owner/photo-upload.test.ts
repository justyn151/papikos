import { describe, expect, it } from "vitest";

import type { ListingPhoto } from "@/features/listings/types";

import {
  MAX_PHOTOS,
  MAX_PHOTO_EDGE,
  acceptPhotos,
  approximateBytes,
  fitDimensions,
  isImageFile,
  isQuotaError,
  promoteCover,
  remainingSlots,
  removePhoto,
  totalBytes,
} from "./photo-upload";

function photo(id: string, payload = "AAAA"): ListingPhoto {
  return { id, dataUrl: `data:image/jpeg;base64,${payload}` };
}

describe("fitDimensions", () => {
  it("leaves an already small image alone", () => {
    expect(fitDimensions(640, 480)).toEqual({ width: 640, height: 480 });
  });

  it("scales the long edge down and keeps the aspect ratio", () => {
    const fitted = fitDimensions(4000, 3000);

    expect(fitted.width).toBe(MAX_PHOTO_EDGE);
    expect(fitted.height).toBe(600);
  });

  it("scales a portrait photo by its height", () => {
    expect(fitDimensions(1200, 2400)).toEqual({ width: 400, height: 800 });
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
    expect(result.rejected).toBe(1);
  });

  it("rejects everything once full", () => {
    const full = Array.from({ length: MAX_PHOTOS }, (_, index) =>
      photo(`full-${index}`),
    );
    const result = acceptPhotos(full, [photo("new")]);

    expect(result.photos).toEqual(full);
    expect(result.rejected).toBe(1);
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
