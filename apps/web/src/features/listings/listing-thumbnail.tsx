import type { Listing } from "@/features/listings/types";

/**
 * Compact console-sized version of the card artwork in `listing-card.tsx`.
 * Console rows need a visual anchor, not a hero image, so this keeps the
 * per-listing gradient and accent while dropping the finer detail that would
 * turn to mush at this size.
 */
export function ListingThumbnail({ listing }: { listing: Listing }) {
  return (
    <div
      className={`relative size-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${listing.tone}`}
      aria-hidden="true"
    >
      <div className="absolute -right-3 -top-4 size-12 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-2 right-2 h-9 rounded-t-lg border border-white/25 bg-white/15 backdrop-blur-sm">
        <div className="absolute inset-x-1.5 top-1.5 grid grid-cols-3 gap-1">
          {[0, 1, 2, 3, 4, 5].map((window) => (
            <span
              className={`h-2 rounded-[3px] ${
                window === 1 || window === 5 ? listing.accent : "bg-white/35"
              }`}
              key={window}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
