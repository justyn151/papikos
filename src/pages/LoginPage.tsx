import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon/Icon'

const roleLabels = {
  'pencari-kos': 'Pencari Kos',
  'pemilik-kos': 'Pemilik Kos',
} as const

const authProviders = [
  {
    label: 'Sign in with Google',
    iconUrl: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
    iconClassName: '',
    className: 'border border-neutral-200 bg-white text-[#4c4a57] hover:border-neutral-300 hover:bg-neutral-50',
  },
  {
    label: 'Sign in with Facebook',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
    iconClassName: '',
    className: 'border border-neutral-200 bg-white text-[#4c4a57] hover:border-neutral-300 hover:bg-neutral-50',
  },
  {
    label: 'Sign in with Apple',
    iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@15.15.0/icons/apple.svg',
    iconClassName: 'invert',
    className: 'border border-black bg-black text-white hover:bg-neutral-900',
  },
]

type LoginRole = keyof typeof roleLabels

function isLoginRole(role: string | undefined): role is LoginRole {
  return role === 'pencari-kos' || role === 'pemilik-kos'
}

function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('62')) return `0${digits.slice(2)}`
  return digits
}

function validatePhoneNumber(value: string) {
  const normalized = normalizePhoneNumber(value)

  if (!normalized) return 'Nomor handphone wajib diisi.'
  if (!normalized.startsWith('08')) return 'Gunakan nomor Indonesia yang diawali 08 atau 62.'
  if (normalized.length < 10) return 'Nomor handphone terlalu pendek.'
  if (normalized.length > 13) return 'Nomor handphone terlalu panjang.'
  return ''
}

export function LoginPage() {
  const navigate = useNavigate()
  const { role } = useParams()
  const [showPassword, setShowPassword] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [hasTouchedPhone, setHasTouchedPhone] = useState(false)

  const phoneError = validatePhoneNumber(phoneNumber)
  const canSubmit = !phoneError && password.trim().length > 0

  if (!isLoginRole(role)) return <Navigate replace to="/" />

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0ca95a] px-4 py-8">
      <div className="absolute inset-0 opacity-80" aria-hidden="true">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -right-28 top-24 size-80 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 size-[34rem] rounded-full bg-green-900/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18px_18px,rgba(255,255,255,0.18)_2px,transparent_0)] [background-size:42px_42px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_0,rgba(255,255,255,0.10)_1px,transparent_1px,transparent_18px)] [background-size:28px_28px]" />
      </div>

      <section className="relative w-full max-w-[520px] rounded-[2rem] bg-white px-6 py-7 shadow-2xl shadow-green-950/30 sm:px-9 sm:py-8">
        <button
          className="mb-7 grid size-10 place-items-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
          onClick={() => navigate(-1)}
          type="button"
          aria-label="Kembali"
        >
          <Icon className="size-6" name="arrowLeft" />
        </button>

        <h1 className="text-2xl font-black tracking-[-0.04em] text-[#343241] sm:text-3xl">
          Login {roleLabels[role]}
        </h1>

        {role === 'pencari-kos' && (
          <>
            <div className="mt-7 grid gap-4">
              {authProviders.map((provider) => (
                <button
                  className={`flex h-14 items-center justify-center gap-4 rounded-sm px-4 text-lg font-bold transition active:scale-[0.99] ${provider.className}`}
                  key={provider.label}
                  type="button"
                >
                  <img
                    className={`size-7 object-contain ${provider.iconClassName}`}
                    src={provider.iconUrl}
                    alt=""
                    aria-hidden="true"
                  />
                  {provider.label}
                </button>
              ))}
            </div>

            <div className="my-7 flex items-center gap-5 text-sm font-bold text-neutral-500">
              <span className="h-px flex-1 bg-neutral-200" />
              atau
              <span className="h-px flex-1 bg-neutral-200" />
            </div>
          </>
        )}

        <form
          className={role === 'pencari-kos' ? 'space-y-7' : 'mt-8 space-y-7'}
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="block">
            <span className="text-sm font-black text-[#5a5666]">Nomor Handphone</span>
            <input
              className={
                'mt-3 w-full border-0 border-b-2 px-2 py-3 text-lg font-semibold text-neutral-800 outline-none transition placeholder:text-neutral-300 focus:border-green-500 ' +
                (hasTouchedPhone && phoneError ? 'border-red-400' : 'border-neutral-200')
              }
              autoComplete="tel"
              inputMode="tel"
              maxLength={18}
              onBlur={() => setHasTouchedPhone(true)}
              onChange={(event) => {
                setPhoneNumber(event.target.value)
                if (!hasTouchedPhone) setHasTouchedPhone(true)
              }}
              placeholder="081234567890"
              type="tel"
              value={phoneNumber}
              aria-invalid={hasTouchedPhone && Boolean(phoneError)}
              aria-describedby={hasTouchedPhone && phoneError ? 'phone-number-error' : undefined}
            />
            {hasTouchedPhone && phoneError && (
              <p
                className="mt-2 text-xs font-bold text-red-500"
                id="phone-number-error"
              >
                {phoneError}
              </p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-black text-[#5a5666]">Password</span>
            <div className="mt-3 flex items-center border-b-2 border-neutral-200 transition focus-within:border-green-500">
              <input
                className="w-full border-0 px-2 py-3 text-lg font-semibold text-neutral-800 outline-none placeholder:text-neutral-300"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                className="grid size-10 place-items-center text-neutral-500 hover:text-neutral-700"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPassword}
              >
                <Icon className="size-5" name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>
          </label>

          <button
            className={
              'mt-4 h-14 w-full rounded-md text-lg font-black transition ' +
              (canSubmit
                ? 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.99]'
                : 'cursor-not-allowed bg-neutral-100 text-neutral-300')
            }
            disabled={!canSubmit}
            type="submit"
          >
            Login
          </button>
        </form>

        <p className="mt-7 text-center text-sm font-semibold text-[#5a5666]">
          Belum punya akun Papikos?{' '}
          <button className="font-black text-green-600 hover:text-green-700" type="button">
            Daftar Sekarang
          </button>
        </p>

        <div className="mt-5 text-center">
          <button className="text-sm font-black text-green-600 hover:text-green-700" type="button">
            Lupa password?
          </button>
        </div>
      </section>
    </main>
  )
}
