type HeaderProps = {
  onLogin?: () => void
  showSearch?: boolean
  searchValue?: string
  onOpenSearch?: () => void
}

export function Header({
  onLogin,
  showSearch = false,
  searchValue = '',
  onOpenSearch,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[68px] w-full min-w-0 items-center justify-between border-b border-neutral-100 bg-white px-4 shadow-sm sm:h-[78px] sm:px-8 lg:px-[86px]">
      <Link className="inline-flex min-w-0 items-center gap-2 text-inherit no-underline sm:gap-2.5" to="/" aria-label="Papikos homepage">
        <span className="inline-flex size-10 items-center justify-center rounded-full border-2 border-green-100 bg-green-50 text-2xl sm:size-[42px]" aria-hidden="true">
          🏠
        </span>
        <span
          className={
            'truncate text-[24px] font-extrabold tracking-[-0.05em] text-[#1daa5b] sm:text-[31px] ' +
            (showSearch ? 'hidden xl:inline' : 'hidden sm:inline')
          }
        >
          papikos
        </span>
      </Link>

      <button
        className={
          'mx-2 flex min-w-0 flex-1 items-center overflow-hidden rounded-lg bg-white shadow-[0_2px_12px_rgba(28,28,28,0.12)] transition-[max-width,opacity,transform,padding] duration-300 sm:mx-5 ' +
          (showSearch
            ? 'max-w-xl translate-y-0 p-1 opacity-100'
            : 'pointer-events-none max-w-0 -translate-y-2 p-0 opacity-0')
        }
        onClick={onOpenSearch}
        type="button"
        aria-hidden={!showSearch}
        aria-label="Buka halaman pencarian kos"
      >
        <span className="hidden px-3 text-xl text-neutral-500 sm:block" aria-hidden="true">⌕</span>
        <span className="min-w-0 flex-1 truncate px-3 py-2 text-left text-xs font-bold text-neutral-500 sm:text-sm">
          {searchValue || 'Masukkan lokasi/area/alamat'}
        </span>
        <span className="shrink-0 rounded-md bg-green-600 px-3 py-2 text-xs font-black text-white transition hover:bg-green-700 sm:px-6 sm:text-sm">
          Cari
        </span>
      </button>

      <button
        className="shrink-0 rounded-md border border-green-600 bg-white px-3 py-2.5 text-sm font-bold text-green-600 transition hover:bg-green-50 active:scale-[0.98] sm:px-6 sm:py-3 sm:text-base"
        onClick={onLogin}
        type="button"
      >
        Masuk
      </button>
    </header>
  )
}
import { Link } from 'react-router-dom'
