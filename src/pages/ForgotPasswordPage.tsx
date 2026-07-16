import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../services/authService'

export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [message, setMessage] = useState('')
  const [resetPath, setResetPath] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    try {
      const response = await requestPasswordReset(identifier)
      setMessage(response.message)
      setResetPath(response.resetPath ?? '')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Permintaan gagal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-green-600 p-4">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <Link className="text-sm font-black text-green-600" to="/">← Kembali</Link>
        <h1 className="mt-7 text-3xl font-black text-neutral-900">Lupa password</h1>
        <p className="mt-3 font-semibold leading-7 text-neutral-500">
          Masukkan email atau nomor handphone yang terdaftar.
        </p>
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 font-semibold outline-none focus:border-green-500"
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Email atau nomor handphone"
            value={identifier}
          />
          <button
            className="w-full rounded-full bg-green-600 px-5 py-3 font-black text-white disabled:opacity-50"
            disabled={!identifier.trim() || isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Memproses...' : 'Buat tautan reset'}
          </button>
        </form>
        {message && <p className="mt-5 text-sm font-bold text-neutral-600">{message}</p>}
        {resetPath && (
          <Link className="mt-4 inline-block font-black text-green-600 underline" to={resetPath}>
            Buka tautan reset lokal
          </Link>
        )}
        <p className="mt-6 text-xs leading-5 text-neutral-400">
          Tautan langsung hanya ditampilkan pada lingkungan Docker lokal. Produksi harus mengirimkannya melalui email atau SMS.
        </p>
      </section>
    </main>
  )
}
