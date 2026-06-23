const popularLocations = ['Jakarta Selatan', 'Depok', 'Yogyakarta', 'Bandung']

type SearchHeroProps = {
  location: string
  message: string
  onOpenSearch: () => void
  onPopularLocationSelect: (location: string) => void
}

export function SearchHero({
  location,
  message,
  onOpenSearch,
  onPopularLocationSelect,
}: SearchHeroProps) {
  return (
    <section className="grid w-full min-w-0 gap-9 overflow-hidden px-4 pb-8 pt-10 sm:px-8 sm:pt-12 lg:min-h-[360px] lg:grid-cols-[minmax(320px,0.9fr)_minmax(360px,1.1fr)] lg:px-[86px] lg:pb-9 lg:pt-[76px]" aria-labelledby="search-title">
      <div className="min-w-0">
        <h1 id="search-title" className="m-0 break-words text-[34px] font-black leading-none tracking-[-0.04em] text-neutral-700 sm:text-5xl">
          Mau cari kos?
        </h1>
        <p className="mb-7 mt-2 break-words text-[19px] font-medium leading-snug text-neutral-600 sm:mb-10 sm:text-[28px]">
          Dapatkan infonya dan langsung sewa di Papikos.
        </p>

        <button
          className="group flex w-full min-w-0 max-w-[540px] flex-col gap-2 rounded-xl bg-white p-2 shadow-[0_4px_18px_rgba(28,28,28,0.13)] sm:flex-row sm:items-center"
          id="hero-search-form"
          onClick={onOpenSearch}
          type="button"
          aria-label="Buka halaman pencarian kos"
        >
          <span className="hidden px-3 text-4xl leading-none text-slate-700 -rotate-12 sm:block" aria-hidden="true">
            ⌕
          </span>
          <span className="block w-full min-w-0 flex-1 px-3 py-3 text-left text-sm font-bold text-neutral-400 sm:px-1 sm:py-4 sm:text-base">
            {location || 'Masukkan nama lokasi/area/alamat'}
          </span>
          <span className="w-full rounded-lg bg-[#21ad5f] px-6 py-3 text-center text-lg font-extrabold text-white transition group-hover:bg-[#17964f] sm:w-auto sm:px-9 sm:text-xl">
            Cari
          </span>
        </button>

        <p className="mt-4 max-w-full break-words text-sm font-semibold text-neutral-500">{message}</p>

        <div className="mt-4 flex max-w-full flex-wrap gap-2">
          {popularLocations.map((popularLocation) => (
            <button
              className="max-w-full rounded-full border border-green-100 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition hover:border-green-300 hover:bg-green-100 sm:px-4 sm:text-sm"
              key={popularLocation}
              onClick={() => onPopularLocationSelect(popularLocation)}
              type="button"
            >
              {popularLocation}
            </button>
          ))}
        </div>
      </div>

      <div className="relative hidden min-h-[250px] self-end opacity-85 lg:block" aria-hidden="true">
        <span className="absolute left-[16%] top-8 h-[18px] w-[68px] rounded-t-[40px] border-4 border-b-0 border-[#e6e9ee] before:absolute before:left-3.5 before:top-[-14px] before:h-5 before:w-[26px] before:rounded-t-full before:border-4 before:border-b-0 before:border-[#e6e9ee] before:bg-white after:absolute after:right-2.5 after:top-[-20px] after:h-[26px] after:w-8 after:rounded-t-full after:border-4 after:border-b-0 after:border-[#e6e9ee] after:bg-white" />
        <span className="absolute left-[44%] top-[84px] h-[18px] w-[68px] rounded-t-[40px] border-4 border-b-0 border-[#e6e9ee] before:absolute before:left-3.5 before:top-[-14px] before:h-5 before:w-[26px] before:rounded-t-full before:border-4 before:border-b-0 before:border-[#e6e9ee] before:bg-white after:absolute after:right-2.5 after:top-[-20px] after:h-[26px] after:w-8 after:rounded-t-full after:border-4 after:border-b-0 after:border-[#e6e9ee] after:bg-white" />
        <span className="absolute right-[22%] top-7 h-[18px] w-[68px] rounded-t-[40px] border-4 border-b-0 border-[#e6e9ee] before:absolute before:left-3.5 before:top-[-14px] before:h-5 before:w-[26px] before:rounded-t-full before:border-4 before:border-b-0 before:border-[#e6e9ee] before:bg-white after:absolute after:right-2.5 after:top-[-20px] after:h-[26px] after:w-8 after:rounded-t-full after:border-4 after:border-b-0 after:border-[#e6e9ee] after:bg-white" />
        <svg className="absolute bottom-0 left-0 h-auto w-full fill-none stroke-[#e6e9ee] stroke-[4] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 760 190" role="img">
          <path d="M12 166h736" />
          <path d="M62 166v-40h38v40M76 126v-42l21-30 21 30v82M152 166v-64h56v64M166 118h16M166 137h16M192 118h16M192 137h16M246 166v-88l37-58 37 58v88M270 101h24M270 123h24M270 145h24M356 166V92l48 28v46M386 125h18M386 146h18M430 166v-54h42v54M494 166v-73h68v73M512 111h15M548 111h15M512 133h15M548 133h15M512 154h15M548 154h15M592 166V80l20-52 20 52v86M650 166v-55h54v55M665 128h25M665 149h25" />
        </svg>
      </div>
    </section>
  )
}
