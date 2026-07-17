import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { getOwnerInbox, updateOwnerRequest, type OwnerInbox } from '../services/ownerService'
import { formatRupiah } from '../utils/formatCurrency'

const statuses = {
  surveys: ['pending', 'confirmed', 'completed', 'cancelled'],
  contacts: ['open', 'answered', 'closed'],
  rentals: ['submitted', 'reviewing', 'accepted', 'rejected', 'cancelled'],
} as const

export function OwnerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [inbox, setInbox] = useState<OwnerInbox | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    getOwnerInbox().then(setInbox).catch((reason) => setError(reason instanceof Error ? reason.message : 'Dashboard gagal dimuat.'))
  }, [])

  useEffect(() => {
    if (user?.role === 'pemilik-kos') load()
  }, [load, user])

  if (authLoading) return <main className="p-10 text-center font-bold">Memuat akun...</main>
  if (!user) return <Navigate replace to="/login/pemilik-kos" />
  if (user.role !== 'pemilik-kos') return <Navigate replace to="/" />

  async function changeStatus(type: keyof typeof statuses, id: number, status: string) {
    try {
      setError('')
      await updateOwnerRequest(type, id, status)
      load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Status gagal diperbarui.')
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link className="font-black text-green-600" to="/">← Papikos</Link>
        <h1 className="mt-7 text-4xl font-black text-neutral-900">Dashboard pemilik</h1>
        <p className="mt-2 font-semibold text-neutral-500">Kelola permintaan untuk kos yang terhubung dengan akun {user.fullName}.</p>
        {error && <p className="mt-6 rounded-xl bg-red-50 p-4 font-bold text-red-600">{error}</p>}
        {inbox && inbox.listings.length === 0 && (
          <p className="mt-7 rounded-2xl bg-yellow-50 p-5 font-semibold text-yellow-800">
            Belum ada kos terhubung. Untuk data demo, nama akun pemilik harus sama dengan nama pemilik pada listing.
          </p>
        )}
        {inbox && (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <OwnerSection title="Permintaan survei" empty="Belum ada survei.">
              {inbox.surveys.map((item) => <OwnerCard key={item.id} title={item.kos_title} subtitle={`${item.renter_name} · ${item.phone_number}`} details={[`Jadwal: ${new Date(item.scheduled_for).toLocaleString('id-ID')}`, `Pengunjung: ${item.visitor_name} · ${item.visitor_phone}`, ...(item.relationship ? [`Hubungan: ${item.relationship}`] : []), ...(item.notes ? [`Catatan: ${item.notes}`] : [])]} status={item.status} options={statuses.surveys} onChange={(status) => void changeStatus('surveys', item.id, status)} />)}
            </OwnerSection>
            <OwnerSection title="Permintaan kontak" empty="Belum ada permintaan kontak.">
              {inbox.contacts.map((item) => <OwnerCard key={item.id} title={item.kos_title} subtitle={`${item.renter_name} · ${item.phone_number}`} details={[`Balasan: ${item.preferred_contact_method}`, `Pertanyaan: ${item.message}`]} status={item.status} options={statuses.contacts} onChange={(status) => void changeStatus('contacts', item.id, status)} />)}
            </OwnerSection>
            <OwnerSection title="Pengajuan sewa" empty="Belum ada pengajuan sewa.">
              {inbox.rentals.map((item) => <OwnerCard key={item.id} title={item.kos_title} subtitle={`${item.renter_name} · ${item.phone_number}`} details={[`Mulai masuk: ${new Date(`${item.move_in_date}T00:00:00`).toLocaleDateString('id-ID')}`, `${item.rental_months} bulan · ${formatRupiah(Number(item.quoted_total))}`, ...(item.notes ? [`Catatan: ${item.notes}`] : [])]} status={item.status} options={statuses.rentals} onChange={(status) => void changeStatus('rentals', item.id, status)} />)}
            </OwnerSection>
          </div>
        )}
      </div>
    </main>
  )
}

function OwnerSection({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return <section className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">{title}</h2><div className="mt-5 space-y-4">{children.length ? children : <p className="text-sm font-semibold text-neutral-400">{empty}</p>}</div></section>
}

function OwnerCard({ title, subtitle, details, status, options, onChange }: { title: string; subtitle: string; details: string[]; status: string; options: readonly string[]; onChange: (status: string) => void }) {
  return <article className="rounded-2xl border border-neutral-100 p-4"><h3 className="font-black">{title}</h3><p className="mt-2 text-sm font-semibold text-neutral-500">{subtitle}</p><div className="mt-3 space-y-1 rounded-xl bg-neutral-50 p-3">{details.map((detail) => <p className="break-words text-xs font-semibold leading-5 text-neutral-600" key={detail}>{detail}</p>)}</div><select className="mt-4 w-full rounded-xl border p-2 font-bold" onChange={(event) => onChange(event.target.value)} value={status}>{options.map((option) => <option key={option}>{option}</option>)}</select></article>
}
