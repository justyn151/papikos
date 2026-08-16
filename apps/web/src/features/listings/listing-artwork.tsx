import type { Listing } from "@/features/home/types";

/**
 * The generated cover every kos card shows. Shared by the renter cards and the
 * console cards so the same kos cannot look like two different places
 * depending on who is looking at it.
 */
export function ListingArtwork({ listing }: { listing: Listing }) {
  return (
    <div
      className={`relative h-48 overflow-hidden bg-gradient-to-br ${listing.tone}`}
      aria-hidden="true"
    >
      <div className="absolute -right-8 -top-10 size-36 rounded-full bg-white/10" />
      <div className="absolute -bottom-16 -left-10 size-44 rounded-full bg-cyan-100/15" />
      <div className="absolute bottom-0 left-8 right-8 h-32 rounded-t-[2rem] border border-white/25 bg-white/15 shadow-2xl backdrop-blur-sm">
        <div className="absolute left-1/2 top-[-25px] size-16 -translate-x-1/2 rotate-45 rounded-xl bg-white/20" />
        <div className="absolute inset-x-5 top-7 grid grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((window) => (
            <span
              className={`h-7 rounded-md ${
                window === 1 || window === 5 ? listing.accent : "bg-white/35"
              }`}
              key={window}
            />
          ))}
        </div>
      </div>
      <div className="absolute left-4 top-4 rounded-full border border-white/25 bg-slate-950/25 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
        {listing.city}
      </div>
    </div>
  );
}
