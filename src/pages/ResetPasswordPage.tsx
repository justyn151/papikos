import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/authService'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const token = params.get('token') ?? ''

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirmation) {
      setMessage('Konfirmasi password belum sama.')
      return
    }
    try {
      const response = await resetPassword(token, password)
      setMessage(response.message)
      setIsComplete(true)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reset password gagal.')
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-green-600 p-4">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <h1 className="text-3xl font-black text-neutral-900">Buat password baru</h1>
        {!isComplete && token && (
          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <input className="w-full rounded-xl border p-4" minLength={8} onChange={(e) => setPassword(e.target.value)} placeholder="Password baru" type="password" value={password} />
            <input className="w-full rounded-xl border p-4" minLength={8} onChange={(e) => setConfirmation(e.target.value)} placeholder="Ulangi password baru" type="password" value={confirmation} />
            <button className="w-full rounded-full bg-green-600 p-3 font-black text-white" type="submit">Simpan password</button>
          </form>
        )}
        {!token && <p className="mt-5 font-bold text-red-500">Token reset tidak tersedia.</p>}
        {message && <p className="mt-5 font-bold text-neutral-600">{message}</p>}
        <Link className="mt-6 inline-block font-black text-green-600" to="/login">Kembali ke login</Link>
      </section>
    </main>
  )
}
