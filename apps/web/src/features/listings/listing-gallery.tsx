"use client";

import {
  Bath,
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Dialog } from "@/features/shared/dialog";

import { detailCopy } from "./detail-copy";
import type {
  GalleryCategory,
  GalleryItem,
  ListingDetail,
  Locale,
} from "./types";

const galleryIcons: Record<GalleryCategory, typeof BedDouble> = {
  room: BedDouble,
  bathroom: Bath,
  shared: UsersRound,
  exterior: Building2,
  neighborhood: MapPin,
};

export function GalleryArtwork({
  item,
  listing,
  locale,
  compact = false,
  fit = "cover",
}: {
  item: GalleryItem;
  listing: ListingDetail;
  locale: Locale;
  compact?: boolean;
  /**
   * How an uploaded photo meets a frame it does not match. "cover" crops to
   * fill, "frame" fits the whole photo over a blurred copy of itself, and
   * "contain" fits it on a plain dark surface. The generated artwork fills any
   * frame, so this only decides what happens to real photos.
   */
  fit?: "cover" | "frame" | "contain";
}) {
  const Icon = galleryIcons[item.category];
  const shift = (item.variant % 4) * 8;

  if (item.dataUrl) {
    // Owners upload whatever their phone took: 4:3, portrait, the occasional
    // square. The frame stays 16:9 either way so the page does not resize as
    // the carousel steps, and the photo is fitted inside it rather than
    // cropped — with a blurred copy of itself filling what is left, which
    // reads as intentional where letterbox bars read as broken.
    if (fit !== "cover") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-slate-950">
          {fit === "frame" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
              src={item.dataUrl}
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={item.label[locale]}
            className="property-artwork relative h-full w-full object-contain"
            src={item.dataUrl}
          />
        </div>
      );
    }

    return (
      // A stored data URL has no intrinsic size and never hits the network, so
      // next/image would only add a loader around it.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={item.label[locale]}
        className="property-artwork h-full min-h-36 w-full object-cover"
        src={item.dataUrl}
      />
    );
  }

  return (
    <div
      className={`property-artwork relative h-full min-h-36 overflow-hidden bg-gradient-to-br ${listing.tone}`}
      aria-label={item.label[locale]}
      role="img"
    >
      <span
        className="absolute rounded-full bg-white/10"
        style={{
          height: compact ? 90 : 190,
          right: `${-24 + shift}px`,
          top: `${-35 + shift / 2}px`,
          width: compact ? 90 : 190,
        }}
      />
      <span className="absolute -bottom-20 -left-12 size-56 rounded-full bg-cyan-100/15" />
      {item.category === "exterior" ? (
        <span className="absolute bottom-0 left-[14%] right-[14%] h-[68%] rounded-t-[2rem] border border-white/30 bg-white/15 backdrop-blur-sm">
          <span className="absolute inset-x-[12%] top-[18%] grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((window) => (
              <span
                className={`h-8 rounded-lg ${
                  window === 1 || window === 5 ? listing.accent : "bg-white/35"
                }`}
                key={window}
              />
            ))}
          </span>
        </span>
      ) : (
        <span className="absolute inset-[12%] rounded-[2rem] border border-white/30 bg-white/15 shadow-2xl backdrop-blur-sm">
          <span className="absolute bottom-[12%] left-[10%] h-[30%] w-[52%] rounded-xl bg-white/30" />
          <span
            className={`absolute bottom-[12%] right-[10%] h-[48%] w-[22%] rounded-xl ${listing.accent} opacity-80`}
          />
          <span className="absolute left-[10%] top-[14%] h-[12%] w-[35%] rounded-full bg-white/35" />
        </span>
      )}
      <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/25 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
        <Icon size={14} aria-hidden="true" />
        {item.label[locale]}
      </span>
    </div>
  );
}

const arrowClass =
  "grid size-11 place-items-center rounded-full border border-white/40 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:border-slate-700/60 dark:bg-slate-900/85 dark:text-slate-100 dark:hover:text-blue-300";

/**
 * One photo at a time, with the rest reachable by the arrows or the dots
 * beneath it. The previous layout put a strip of thumbnails beside the photo,
 * which spent a third of the width on images too small to read and left the
 * main one no bigger than a card.
 */
export function ListingGallery({
  listing,
  locale,
}: {
  listing: ListingDetail;
  locale: Locale;
}) {
  const t = detailCopy[locale];
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const total = listing.gallery.length;
  const item = listing.gallery[Math.min(index, total - 1)];

  const step = (delta: number) =>
    setIndex((current) => (current + delta + total) % total);

  // The arrows are buttons, so they work on their own; this is for the photo
  // itself, which is where a keyboard lands once the gallery is open.
  const handleKey = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  };

  return (
    <div onKeyDown={handleKey}>
      <div className="relative mx-auto max-w-5xl">
        <button
          aria-label={t.galleryOpen}
          className="block w-full cursor-zoom-in overflow-hidden rounded-[1.75rem] focus:outline-none focus:ring-4 focus:ring-blue-200"
          onClick={() => setExpanded(true)}
          type="button"
        >
          <div className="aspect-[16/10] sm:aspect-[16/9]">
            <GalleryArtwork
              fit="frame"
              item={item}
              listing={listing}
              locale={locale}
            />
          </div>
        </button>

        <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-slate-950/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
          {t.galleryCounter
            .replace("{index}", String(index + 1))
            .replace("{total}", String(total))}
        </span>

        <button
          aria-label={t.galleryPrevious}
          className={`${arrowClass} absolute left-3 top-1/2 -translate-y-1/2 sm:left-5`}
          onClick={() => step(-1)}
          type="button"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button
          aria-label={t.galleryNext}
          className={`${arrowClass} absolute right-3 top-1/2 -translate-y-1/2 sm:right-5`}
          onClick={() => step(1)}
          type="button"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {listing.gallery.map((photo, photoIndex) => (
          <button
            aria-current={photoIndex === index}
            aria-label={t.galleryGoTo.replace("{index}", String(photoIndex + 1))}
            className={`h-2.5 rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-blue-200 ${
              photoIndex === index
                ? "w-7 bg-blue-600"
                : "w-2.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600"
            }`}
            key={photo.id}
            onClick={() => setIndex(photoIndex)}
            type="button"
          />
        ))}
      </div>

      {expanded ? (
        <GalleryLightbox
          index={index}
          listing={listing}
          locale={locale}
          onClose={() => setExpanded(false)}
          onStep={step}
        />
      ) : null}
    </div>
  );
}

function GalleryLightbox({
  index,
  listing,
  locale,
  onClose,
  onStep,
}: {
  index: number;
  listing: ListingDetail;
  locale: Locale;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const t = detailCopy[locale];
  const total = listing.gallery.length;
  const item = listing.gallery[index];

  // Escape is handled by the dialog itself; the arrows are what a viewer
  // reaches for once a photo fills the screen.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") onStep(-1);
      if (event.key === "ArrowRight") onStep(1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onStep]);

  return (
    <Dialog label={t.galleryDialog} onClose={onClose} size="wide">
      <div className="relative">
        {/* Nothing is cropped here: this is where a renter looks at the photo
            itself, so a portrait shot keeps its top and bottom. The frame is a
            fixed slice of the viewport rather than 16:9, so a tall photo gets
            the height it needs and stepping between shapes does not resize the
            dialog.

            The alternative, still on the table: force 16:9 here too, so every
            photo is presented in one shape and the dialog matches the carousel
            exactly. That crops portrait shots, which is why it is not the
            default — but it is a two-line change if uniformity wins later.
            Swap `fit="contain"` for `fit="cover"` and put this frame back to
            `aspect-[16/10] sm:aspect-[16/9]`. */}
        <div className="h-[58vh] w-full overflow-hidden sm:h-[72vh]">
          <GalleryArtwork
            fit="contain"
            item={item}
            listing={listing}
            locale={locale}
          />
        </div>

        <button
          aria-label={t.close}
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-slate-950/60 text-white backdrop-blur transition hover:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-blue-200"
          onClick={onClose}
          type="button"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <button
          aria-label={t.galleryPrevious}
          className={`${arrowClass} absolute left-4 top-1/2 -translate-y-1/2`}
          onClick={() => onStep(-1)}
          type="button"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button
          aria-label={t.galleryNext}
          className={`${arrowClass} absolute right-4 top-1/2 -translate-y-1/2`}
          onClick={() => onStep(1)}
          type="button"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {item.label[locale]}
        </p>
        <p className="text-xs font-black text-slate-500 dark:text-slate-400">
          {t.galleryCounter
            .replace("{index}", String(index + 1))
            .replace("{total}", String(total))}
        </p>
      </div>
    </Dialog>
  );
}
