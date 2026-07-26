import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon/Icon'
import { useAuth } from '../auth/authContext'
import { usePageNavigate } from '../navigation/usePageNavigate'
import {
  authRoleDestinations,
  loginUser,
  type AuthRole,
} from '../services/authService'

const demoAccounts: Array<{
  role: AuthRole
  label: string
  description: string
  phoneNumber: string
  password: string
}> = [
  {
    role: 'pencari-kos',
    label: 'Pencari Kos',
    description: 'Cari kos dan kelola pengajuan',
    phoneNumber: '083333333333',
    password: 'renter12345',
  },
  {
    role: 'pemilik-kos',
    label: 'Pemilik Kos',
    description: 'Kelola listing dan permintaan',
    phoneNumber: '082222222222',
    password: 'owner12345',
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'Moderasi marketplace',
    phoneNumber: '081111111111',
    password: 'admin12345',
  },
]

function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('62')) return `0${digits.slice(2)}`
  return digits
}

function validatePhoneNumber(value: string) {
  if (/[a-z]/i.test(value)) return 'Nomor handphone tidak boleh berisi huruf.'
  if (/[^\d\s()+-]/.test(value)) return 'Nomor handphone hanya boleh berisi angka.'
  const normalized = normalizePhoneNumber(value)
  if (!normalized) return 'Nomor handphone wajib diisi.'
  if (!normalized.startsWith('08')) return 'Gunakan nomor Indonesia yang diawali 08 atau 62.'
  if (normalized.length < 10) return 'Nomor handphone terlalu pendek.'
  if (normalized.length > 13) return 'Nomor handphone terlalu panjang.'
  return ''
}

export function LoginPage() {
  const navigate = usePageNavigate()
  const { setUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [hasTouchedPhone, setHasTouchedPhone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeDemoRole, setActiveDemoRole] = useState<AuthRole | null>(null)
  const [formMessage, setFormMessage] = useState('')

  const phoneError = validatePhoneNumber(phoneNumber)
  const canSubmit = !phoneError && password.trim().length > 0
  const showDemoAccounts = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true'

  async function authenticate(credentials: { phoneNumber: string; password: string }, demoRole: AuthRole | null = null) {
    setIsSubmitting(true)
    setActiveDemoRole(demoRole)
    setFormMessage('')
    try {
      const response = await loginUser(credentials)
      setUser(response.user)
      navigate(authRoleDestinations[response.user.role])
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Login gagal. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
      setActiveDemoRole(null)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    await authenticate({ phoneNumber, password })
  }

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0ca95a] px-4 py-8">
      <div className="absolute inset-0 opacity-80" aria-hidden="true">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -right-28 top-24 size-80 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 size-[34rem] rounded-full bg-green-900/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18px_18px,rgba(255,255,255,0.18)_2px,transparent_0)] [background-size:42px_42px]" />
      </div>

      <section className="relative w-full max-w-[580px] rounded-[2rem] bg-white px-6 py-7 shadow-2xl shadow-green-950/30 sm:px-9 sm:py-8">
        <button className="mb-6 grid size-10 place-items-center rounded-full text-neutral-600 transition hover:bg-neutral-100" onClick={goBack} type="button" aria-label="Kembali ke halaman sebelumnya">
          <Icon className="size-6" name="arrowLeft" />
        </button>

        <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">Satu pintu masuk</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#343241]">Masuk ke Papikos</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-neutral-500">
          Masukkan akunmu. Papikos akan membuka halaman pencari kos, pemilik, atau admin sesuai role yang tersimpan pada akun.
        </p>

        {showDemoAccounts && (
          <aside className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 sm:p-5" aria-label="Pilihan akun demo">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Akun demo</p>
                <p className="mt-1 text-xs font-semibold text-amber-900">Pilih role untuk masuk langsung.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-amber-700">Lokal saja</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {demoAccounts.map((account) => (
                <button
                  className="rounded-2xl border border-amber-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md disabled:opacity-50"
                  disabled={isSubmitting}
                  key={account.role}
                  onClick={() => void authenticate(account, account.role)}
                  type="button"
                >
                  <span className="block text-sm font-black text-neutral-800">
                    {activeDemoRole === account.role ? 'Memproses...' : account.label}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold leading-4 text-neutral-500">{account.description}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-black text-[#5a5666]">Nomor handphone</span>
            <input
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-base font-semibold outline-none transition placeholder:text-neutral-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 ${hasTouchedPhone && phoneError ? 'border-red-400' : 'border-neutral-200'}`}
              autoComplete="tel"
              inputMode="tel"
              maxLength={18}
              onBlur={() => setHasTouchedPhone(true)}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="081234567890"
              type="tel"
              value={phoneNumber}
            />
            {hasTouchedPhone && phoneError && <p className="mt-2 text-xs font-bold text-red-500">{phoneError}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-black text-[#5a5666]">Password</span>
            <div className="mt-2 flex items-center rounded-xl border border-neutral-200 px-2 transition focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
              <input className="min-w-0 flex-1 px-2 py-3 text-base font-semibold outline-none placeholder:text-neutral-300" autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" type={showPassword ? 'text' : 'password'} value={password} />
              <button className="grid size-10 place-items-center text-neutral-500 hover:text-neutral-700" onClick={() => setShowPassword((current) => !current)} type="button" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                <Icon className="size-5" name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>
          </label>

          <button className="h-14 w-full rounded-xl bg-green-600 text-lg font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-300" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting && !activeDemoRole ? 'Memproses...' : 'Masuk'}
          </button>
          {formMessage && <p className="text-center text-sm font-bold text-red-600" role="alert">{formMessage}</p>}
        </form>

        <div className="mt-7 grid gap-3 border-t border-neutral-100 pt-6 sm:grid-cols-2">
          <Link className="rounded-xl border border-neutral-200 px-4 py-3 text-center text-sm font-black text-neutral-600 hover:bg-neutral-50" to="/register/pencari-kos">Daftar sebagai pencari kos</Link>
          <Link className="rounded-xl border border-green-600 px-4 py-3 text-center text-sm font-black text-green-700 hover:bg-green-50" to="/register/pemilik-kos">Daftarkan akun pemilik</Link>
        </div>
        <div className="mt-5 text-center">
          <Link className="text-sm font-black text-green-600 hover:text-green-700" to="/forgot-password">Lupa password?</Link>
        </div>
      </section>
    </main>
  )
}
