import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../Icon/Icon'
import { useAuth } from '../../auth/authContext'

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
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isLoginChoiceOpen, setIsLoginChoiceOpen] = useState(false)
  const [isLoginChoiceClosing, setIsLoginChoiceClosing] = useState(false)

  function openLoginChoice() {
    onLogin?.()
    setIsLoginChoiceClosing(false)
    setIsLoginChoiceOpen(true)
  }

  function closeLoginChoice() {
    setIsLoginChoiceClosing(true)
    window.setTimeout(() => {
      setIsLoginChoiceOpen(false)
      setIsLoginChoiceClosing(false)
    }, 180)
  }

  function openLoginPage(role: 'pencari-kos' | 'pemilik-kos') {
    setIsLoginChoiceOpen(false)
    navigate(`/login/${role}`)
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[68px] w-full min-w-0 items-center justify-between border-b border-neutral-100 bg-white px-4 shadow-sm sm:h-[78px] sm:px-8 lg:px-[86px]">
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
          <div className="flex shrink-0 items-center gap-3">
            <Link className="hidden max-w-40 truncate text-sm font-black text-neutral-700 hover:text-green-600 sm:block" to={user.role === 'pencari-kos' ? '/activity' : '/owner'}>
              {user.fullName}
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
          <button
            className="shrink-0 rounded-md border border-green-600 bg-white px-3 py-2.5 text-sm font-bold text-green-600 transition hover:bg-green-50 active:scale-[0.98] sm:px-6 sm:py-3 sm:text-base"
            onClick={openLoginChoice}
            type="button"
          >
            Masuk
          </button>
        )}
      </header>

      {isLoginChoiceOpen && (
        <div
          className="fixed inset-0 z-[1400] grid place-items-center bg-black/35 p-4 backdrop-blur-sm"
          onMouseDown={closeLoginChoice}
          role="presentation"
          style={{
            animation: isLoginChoiceClosing
              ? 'payment-backdrop-out 180ms ease-in both'
              : 'payment-backdrop-in 180ms ease-out both',
          }}
        >
          <section
            className="w-full max-w-2xl rounded-2xl bg-white px-6 py-8 shadow-2xl shadow-black/20 sm:px-9 sm:py-10"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-choice-title"
            style={{
              animation: isLoginChoiceClosing
                ? 'payment-modal-out 180ms ease-in both'
                : 'payment-modal-in 240ms cubic-bezier(0.22,1,0.36,1) both',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-3xl font-black tracking-[-0.04em] text-[#343241]"
                  id="login-choice-title"
                >
                  Masuk ke Papikos
                </h2>
                <p className="mt-7 text-lg font-medium text-[#4c4a57]">
                  Saya ingin masuk sebagai
                </p>
              </div>
              <button
                className="grid size-11 shrink-0 place-items-center rounded-full text-5xl font-light leading-none text-neutral-500 transition hover:bg-neutral-100"
                onClick={closeLoginChoice}
                type="button"
                aria-label="Tutup pilihan masuk"
              >
                <Icon className="size-7" name="close" />
              </button>
            </div>

            <div className="mt-7 grid gap-5">
              <button
                className="flex items-center gap-7 rounded-md bg-white px-7 py-6 text-left text-xl font-black text-[#3c3948] shadow-[0_4px_18px_rgba(28,28,28,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_26px_rgba(28,28,28,0.18)] active:scale-[0.99]"
                onClick={() => openLoginPage('pencari-kos')}
                type="button"
              >
                <span className="grid size-20 shrink-0 place-items-center rounded-full bg-green-50 text-green-600" aria-hidden="true">
                  <Icon className="size-11" name="doorUser" />
                </span>
                <span>Pencari Kos</span>
              </button>
              <button
                className="flex items-center gap-7 rounded-md bg-white px-7 py-6 text-left text-xl font-black text-[#3c3948] shadow-[0_4px_18px_rgba(28,28,28,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_26px_rgba(28,28,28,0.18)] active:scale-[0.99]"
                onClick={() => openLoginPage('pemilik-kos')}
                type="button"
              >
                <span className="grid size-20 shrink-0 place-items-center rounded-full bg-green-50 text-green-600" aria-hidden="true">
                  <Icon className="size-11" name="houseUser" />
                </span>
                <span>Pemilik Kos</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
