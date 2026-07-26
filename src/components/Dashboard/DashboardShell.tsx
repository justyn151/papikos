import { useEffect, useState, type AnimationEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../Icon/Icon'

export type DashboardNavItem = {
  id: string
  label: string
  description: string
}

type DashboardShellProps = {
  accountLabel: string
  userName: string
  navItems: DashboardNavItem[]
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: (options?: {
    redirectTo?: string
  }) => Promise<void>
  children: ReactNode
}

export function DashboardShell({
  accountLabel,
  userName,
  navItems,
  activeTab,
  onTabChange,
  onLogout,
  children,
}: DashboardShellProps) {
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] = useState(false)

  async function handleLogout() {
    await onLogout({ redirectTo: '/' })
  }

  return (
    <div className="min-h-dvh bg-[#f6f8f7] text-neutral-800 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden min-h-dvh border-r border-green-100 bg-[#103f2a] px-5 py-7 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <Link className="flex items-center gap-3 rounded-2xl px-2 py-2 text-white no-underline" to="/">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/12 text-green-200">
            <Icon className="size-6" name="home" />
          </span>
          <span>
            <span className="block text-2xl font-black tracking-[-0.05em]">papikos</span>
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-green-200/80">
              {accountLabel}
            </span>
          </span>
        </Link>

        <nav className="mt-10 space-y-2" aria-label={`Navigasi ${accountLabel}`}>
          {navItems.map((item) => {
            const isActive = item.id === activeTab
            return (
              <button
                className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                  isActive
                    ? 'bg-white text-[#103f2a] shadow-lg shadow-black/10'
                    : 'text-green-50 hover:bg-white/10'
                }`}
                key={item.id}
                onClick={() => onTabChange(item.id)}
                type="button"
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="block text-sm font-black">{item.label}</span>
                <span className={`mt-1 block text-xs font-semibold ${isActive ? 'text-neutral-500' : 'text-green-100/70'}`}>
                  {item.description}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <p className="truncate text-sm font-black">{userName}</p>
          <p className="mt-1 text-xs font-semibold text-green-100/70">{accountLabel}</p>
          <button
            className="mt-4 w-full rounded-xl border border-white/20 px-3 py-2 text-xs font-black text-white transition hover:bg-white/10"
            onClick={() => setIsLogoutConfirmationOpen(true)}
            type="button"
          >
            Keluar dari akun
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-neutral-200 bg-white px-4 py-4 sm:px-7 lg:px-10">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
            <Link className="flex items-center gap-2 font-black text-green-700 no-underline lg:hidden" to="/">
              <span className="grid size-9 place-items-center rounded-xl bg-green-50">
                <Icon className="size-5" name="home" />
              </span>
              papikos
            </Link>
            <div className="hidden min-w-0 lg:block">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">{accountLabel}</p>
              <p className="mt-1 truncate text-sm font-bold text-neutral-500">Selamat datang, {userName}</p>
            </div>
            <button
              className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-black text-neutral-600 transition hover:bg-neutral-50 lg:hidden"
              onClick={() => setIsLogoutConfirmationOpen(true)}
              type="button"
            >
              Keluar
            </button>
          </div>
        </header>

        <nav className="overflow-x-auto border-b border-neutral-200 bg-white px-4 lg:hidden" aria-label={`Navigasi ${accountLabel}`}>
          <div className="flex min-w-max gap-1">
            {navItems.map((item) => {
              const isActive = item.id === activeTab
              return (
                <button
                  className={`border-b-2 px-4 py-3 text-sm font-black transition ${
                    isActive
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>

      {isLogoutConfirmationOpen && (
        <LogoutConfirmationModal
          accountLabel={accountLabel}
          onClose={() => setIsLogoutConfirmationOpen(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  )
}

function LogoutConfirmationModal({
  accountLabel,
  onClose,
  onConfirm,
}: {
  accountLabel: string
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [isClosing, setIsClosing] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState('')

  function requestClose() {
    if (!isLoggingOut) setIsClosing(true)
  }

  function finishClosing(event: AnimationEvent<HTMLElement>) {
    if (isClosing && event.target === event.currentTarget) {
      onClose()
    }
  }

  async function confirmLogout() {
    try {
      setIsLoggingOut(true)
      setError('')
      await onConfirm()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Akun gagal dikeluarkan. Silakan coba lagi.')
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') requestClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isLoggingOut])

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={requestClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirmation-title"
      aria-describedby="logout-confirmation-description"
      style={{
        animation: isClosing
          ? 'payment-backdrop-out 180ms ease-in both'
          : 'payment-backdrop-in 180ms ease-out both',
      }}
    >
      <section
        className="w-full max-w-md rounded-[2rem] bg-white p-6 text-center shadow-2xl sm:p-8"
        onAnimationEnd={finishClosing}
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          animation: isClosing
            ? 'payment-modal-out 180ms ease-in both'
            : 'payment-modal-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-green-50 text-green-700">
          <Icon className="size-8" name="doorUser" />
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.15em] text-green-600">
          {accountLabel}
        </p>
        <h2
          className="mt-2 text-2xl font-black tracking-[-0.04em] text-neutral-900 sm:text-3xl"
          id="logout-confirmation-title"
        >
          Yakin ingin keluar?
        </h2>
        <p
          className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-neutral-500"
          id="logout-confirmation-description"
        >
          Sesi akunmu akan diakhiri dan kamu akan kembali ke halaman utama Papikos.
        </p>

        {error && (
          <p className="mt-5 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-black text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
            disabled={isLoggingOut}
            onClick={requestClose}
            type="button"
          >
            Batal
          </button>
          <button
            className="rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white transition hover:bg-green-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            disabled={isLoggingOut}
            onClick={() => void confirmLogout()}
            type="button"
          >
            {isLoggingOut ? 'Sedang keluar...' : 'Ya, keluar'}
          </button>
        </div>
      </section>
    </div>
  )
}

export function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string
  value: number
  helper: string
}) {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-6">
      <span className="absolute -right-8 -top-8 size-24 rounded-full bg-green-50" aria-hidden="true" />
      <p className="relative text-xs font-black uppercase tracking-[0.13em] text-neutral-400">{label}</p>
      <p className="relative mt-3 text-4xl font-black tracking-[-0.05em] text-[#173e2d]">{value.toLocaleString('id-ID')}</p>
      <p className="relative mt-2 text-xs font-semibold leading-5 text-neutral-500">{helper}</p>
    </article>
  )
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-50 text-green-700 ring-green-200',
  answered: 'bg-green-50 text-green-700 ring-green-200',
  accepted: 'bg-green-50 text-green-700 ring-green-200',
  completed: 'bg-green-50 text-green-700 ring-green-200',
  confirmed: 'bg-green-50 text-green-700 ring-green-200',
  published: 'bg-green-50 text-green-700 ring-green-200',
  verified: 'bg-green-50 text-green-700 ring-green-200',
  draft: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
  closed: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
  cancelled: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  open: 'bg-amber-50 text-amber-700 ring-amber-200',
  submitted: 'bg-amber-50 text-amber-700 ring-amber-200',
  reviewing: 'bg-blue-50 text-blue-700 ring-blue-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  inactive: 'bg-red-50 text-red-700 ring-red-200',
  unverified: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
  not_required: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
  archived: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ring-1 ring-inset ${statusStyles[normalized] ?? statusStyles.draft}`}>
      {status.replaceAll('-', ' ').replaceAll('_', ' ')}
    </span>
  )
}

export function DashboardError({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700" role="alert">
      {message}
    </p>
  )
}

export function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center text-sm font-semibold text-neutral-400">
      {children}
    </div>
  )
}
