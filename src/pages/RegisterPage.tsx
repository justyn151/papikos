import { useState, type FormEvent } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon/Icon'
import { useAuth } from '../auth/authContext'
import { usePageNavigate } from '../navigation/usePageNavigate'
import {
  authRoleDestinations,
  registerUser,
  type RegistrableAuthRole,
} from '../services/authService'

const roleLabels = {
  'pencari-kos': 'Pencari Kos',
  'pemilik-kos': 'Pemilik Kos',
} as const

const registerImage =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267f?auto=format&fit=crop&w=1200&q=85'

type RegisterRole = RegistrableAuthRole

function isRegisterRole(role: string | undefined): role is RegisterRole {
  return role === 'pencari-kos' || role === 'pemilik-kos'
}

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

function validateEmail(value: string) {
  if (!value.trim()) return 'Email wajib diisi.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Format email belum valid.'
  return ''
}

export function RegisterPage() {
  const navigate = usePageNavigate()
  const { setUser } = useAuth()
  const { role } = useParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hasAgreed, setHasAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [touched, setTouched] = useState({
    fullName: false,
    phoneNumber: false,
    email: false,
    password: false,
    confirmPassword: false,
  })

  if (!isRegisterRole(role)) return <Navigate replace to="/" />

  const fullNameError = fullName.trim() ? '' : 'Nama lengkap wajib diisi.'
  const phoneError = validatePhoneNumber(phoneNumber)
  const emailError = validateEmail(email)
  const passwordError =
    password.length === 0
      ? 'Password wajib diisi.'
      : password.length < 8
        ? 'Password minimal 8 karakter.'
        : ''
  const confirmPasswordError =
    confirmPassword.length === 0
      ? 'Ulangi password terlebih dahulu.'
      : confirmPassword !== password
        ? 'Password belum sama.'
        : ''
  const canSubmit =
    !fullNameError &&
    !phoneError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    hasAgreed

  function fieldError(field: keyof typeof touched, message: string) {
    if (!touched[field] || !message) return null

    return <p className="mt-2 text-xs font-bold text-red-500">{message}</p>
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || !isRegisterRole(role)) return

    setIsSubmitting(true)
    setFormMessage('')

    try {
      const response = await registerUser({
        fullName,
        phoneNumber,
        email,
        password,
        role,
      })
      setUser(response.user)
      navigate(authRoleDestinations[response.user.role])
    } catch (error) {
      setFormMessage(
        error instanceof Error
          ? error.message
          : 'Pendaftaran gagal. Silakan coba lagi.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0ca95a] px-4 py-8">
      <div className="absolute inset-0 opacity-80" aria-hidden="true">
        <div className="absolute -left-40 top-16 size-[28rem] rounded-full bg-white/15 blur-3xl" />
        <div className="absolute right-[-8rem] top-[-6rem] size-[34rem] rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 size-[38rem] rounded-full bg-green-900/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18px_18px,rgba(255,255,255,0.16)_2px,transparent_0)] [background-size:42px_42px]" />
      </div>

      <section className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-green-950/30 lg:grid-cols-[minmax(360px,0.95fr)_1px_minmax(420px,1.05fr)]">
        <div className="px-6 py-7 sm:px-9 sm:py-9">
          <div className="mb-7 flex items-center gap-4">
            <button
              className="grid size-10 place-items-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
              onClick={() => navigate('/')}
              type="button"
              aria-label="Kembali"
            >
              <Icon className="size-6" name="arrowLeft" />
            </button>
            <h1 className="text-2xl font-black tracking-[-0.04em] text-[#343241]">
              Daftar Akun {roleLabels[role]}
            </h1>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-black text-[#5a5666]">Nama Lengkap</span>
              <input
                className={`mt-2 w-full rounded-md border px-4 py-3 font-semibold text-neutral-800 outline-none transition placeholder:text-neutral-300 focus:border-green-500 ${
                  touched.fullName && fullNameError ? 'border-red-400' : 'border-neutral-200'
                }`}
                onBlur={() => setTouched((current) => ({ ...current, fullName: true }))}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Masukkan nama lengkap sesuai identitas"
                type="text"
                value={fullName}
              />
              {fieldError('fullName', fullNameError)}
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#5a5666]">Nomor Handphone</span>
              <input
                className={`mt-2 w-full rounded-md border px-4 py-3 font-semibold text-neutral-800 outline-none transition placeholder:text-neutral-300 focus:border-green-500 ${
                  touched.phoneNumber && phoneError ? 'border-red-400' : 'border-neutral-200'
                }`}
                autoComplete="tel"
                inputMode="tel"
                maxLength={18}
                onBlur={() => setTouched((current) => ({ ...current, phoneNumber: true }))}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Isi dengan nomor handphone yang aktif"
                type="tel"
                value={phoneNumber}
              />
              {fieldError('phoneNumber', phoneError)}
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#5a5666]">Email</span>
              <input
                className={`mt-2 w-full rounded-md border px-4 py-3 font-semibold text-neutral-800 outline-none transition placeholder:text-neutral-300 focus:border-green-500 ${
                  touched.email && emailError ? 'border-red-400' : 'border-neutral-200'
                }`}
                autoComplete="email"
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Masukkan email untuk akun Papikos"
                type="email"
                value={email}
              />
              {fieldError('email', emailError)}
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#5a5666]">Password</span>
              <div
                className={`mt-2 flex items-center rounded-md border px-4 transition focus-within:border-green-500 ${
                  touched.password && passwordError ? 'border-red-400' : 'border-neutral-200'
                }`}
              >
                <input
                  className="w-full py-3 font-semibold text-neutral-800 outline-none placeholder:text-neutral-300"
                  autoComplete="new-password"
                  onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimal 8 karakter"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  className="grid size-9 place-items-center text-neutral-500 hover:text-neutral-700"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <Icon className="size-5" name={showPassword ? 'eyeOff' : 'eye'} />
                </button>
              </div>
              {fieldError('password', passwordError)}
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#5a5666]">Ulangi Password</span>
              <div
                className={`mt-2 flex items-center rounded-md border px-4 transition focus-within:border-green-500 ${
                  touched.confirmPassword && confirmPasswordError ? 'border-red-400' : 'border-neutral-200'
                }`}
              >
                <input
                  className="w-full py-3 font-semibold text-neutral-800 outline-none placeholder:text-neutral-300"
                  autoComplete="new-password"
                  onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Masukkan kembali password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                />
                <button
                  className="grid size-9 place-items-center text-neutral-500 hover:text-neutral-700"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  type="button"
                  aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <Icon className="size-5" name={showConfirmPassword ? 'eyeOff' : 'eye'} />
                </button>
              </div>
              {fieldError('confirmPassword', confirmPasswordError)}
            </label>

            <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-[#5a5666]">
              <input
                className="mt-1 size-5 shrink-0 accent-green-600"
                checked={hasAgreed}
                onChange={(event) => setHasAgreed(event.target.checked)}
                type="checkbox"
              />
              <span>
                Dengan klik Saya Setuju, saya menyatakan telah membaca dan menyetujui{' '}
                <button className="font-black text-green-600" onClick={() => navigate('/legal/terms')} type="button">
                  Syarat dan Ketentuan
                </button>{' '}
                serta{' '}
                <button className="font-black text-green-600" onClick={() => navigate('/legal/privacy')} type="button">
                  Kebijakan Privasi
                </button>{' '}
                Papikos.
              </span>
            </label>

            <button
              className={`h-13 w-full rounded-md font-black transition ${
                canSubmit && !isSubmitting
                  ? 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.99]'
                  : 'cursor-not-allowed bg-neutral-100 text-neutral-300'
              }`}
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Memproses...' : 'Daftar'}
            </button>

            {formMessage && (
              <p className="text-center text-sm font-bold text-neutral-600">
                {formMessage}
              </p>
            )}
          </form>

          <p className="mt-7 text-center text-sm font-semibold text-[#5a5666]">
            Sudah punya akun Papikos?{' '}
            <button
              className="font-black text-green-600 hover:text-green-700"
              onClick={() => navigate('/login')}
              type="button"
            >
              Masuk di sini
            </button>
          </p>
        </div>

        <div className="hidden bg-neutral-100 lg:block" aria-hidden="true" />

        <aside className="relative hidden min-h-full overflow-hidden bg-[#eefaf4] lg:grid lg:place-items-center lg:p-10">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-90"
            src={registerImage}
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/95 via-green-100/75 to-green-700/55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22px_22px,rgba(255,255,255,0.65)_2px,transparent_0)] [background-size:52px_52px] opacity-60" />
          <div className="relative w-full max-w-md rounded-[2rem] bg-white/85 p-8 shadow-2xl backdrop-blur">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-green-600">
              Papikos
            </p>
            <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.05em] text-[#253d32]">
              Mulai cari kos dengan lebih tenang.
            </h2>
            <p className="mt-4 text-sm font-bold leading-6 text-neutral-600">
              Simpan data akunmu, jelajahi kos pilihan, dan lanjutkan proses sewa dari satu tempat.
            </p>
          </div>
        </aside>
      </section>
    </main>
  )
}
