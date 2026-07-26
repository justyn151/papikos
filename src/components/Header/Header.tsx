import { Link } from 'react-router-dom'
import { Icon } from '../Icon/Icon'
import { useAuth } from '../../auth/authContext'
import { authRoleAccountPaths } from '../../services/authService'

type HeaderProps = {
  showSearch?: boolean
  searchValue?: string
  onOpenSearch?: () => void
}

export function Header({
  showSearch = false,
  searchValue = '',
  onOpenSearch,
}: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-[68px] w-full min-w-0 items-center justify-between border-b border-neutral-100 bg-white px-3 shadow-sm sm:h-[78px] sm:px-8 lg:px-[86px]">
        <Link className="inline-flex min-w-0 items-center gap-2 text-inherit no-underline sm:gap-2.5" to="/" aria-label="Papikos homepage">
          <span className="inline-flex size-10 items-center justify-center rounded-full border-2 border-green-100 bg-green-50 text-green-600 sm:size-[42px]" aria-hidden="true">
            <Icon className="size-6" name="home" />
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
          <Icon className="ml-3 hidden size-5 shrink-0 text-neutral-500 sm:block" name="search" />
          <span className="min-w-0 flex-1 truncate px-3 py-2 text-left text-xs font-bold text-neutral-500 sm:text-sm">
            {searchValue || 'Masukkan lokasi/area/alamat'}
          </span>
          <span className="shrink-0 rounded-md bg-green-600 px-3 py-2 text-xs font-black text-white transition hover:bg-green-700 sm:px-6 sm:text-sm">
            Cari
          </span>
        </button>

        {user ? (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              className="grid size-10 shrink-0 place-items-center rounded-full text-neutral-600 transition hover:bg-green-50 hover:text-green-700 sm:block sm:size-auto sm:max-w-40 sm:truncate sm:rounded-none sm:text-sm sm:font-black"
              to={authRoleAccountPaths[user.role]}
              aria-label={`Buka akun ${user.fullName}`}
            >
              <Icon className="size-5 sm:hidden" name="user" />
              <span className="hidden sm:inline">{user.fullName}</span>
            </Link>
            <button
              className="rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm font-bold text-neutral-600 transition hover:bg-neutral-50 sm:px-5"
              onClick={() => void logout()}
              type="button"
            >
              Keluar
            </button>
          </div>
        ) : (
          <nav className="flex shrink-0 items-center" aria-label="Akun">
            <Link
              className="rounded-lg border border-green-600 bg-green-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-green-700 active:scale-[0.98] sm:px-6"
              to="/login"
            >
              Masuk
            </Link>
          </nav>
        )}
      </header>
  )
}
