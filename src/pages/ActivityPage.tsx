import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { getMyActivity, type MyActivity } from '../services/renterActionService'
import { formatRupiah } from '../utils/formatCurrency'

export function ActivityPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [activity, setActivity] = useState<MyActivity | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role !== 'pencari-kos') return
    getMyActivity().then(setActivity).catch((reason) => {
      setError(reason instanceof Error ? reason.message : 'Aktivitas gagal dimuat.')
    })
  }, [user])

  if (isAuthLoading) return <main className="p-10 text-center font-bold">Memuat akun...</main>
  if (!user) return <Navigate replace to="/login/pencari-kos" />
  if (user.role !== 'pencari-kos') return <Navigate replace to="/" />

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link className="font-black text-green-600" to="/">← Kembali ke Papikos</Link>
        <h1 className="mt-7 text-4xl font-black text-neutral-900">Aktivitas saya</h1>
        <p className="mt-2 font-semibold text-neutral-500">Survei, permintaan kontak, dan pengajuan sewa tersimpan di sini.</p>
        {error && <p className="mt-6 rounded-xl bg-red-50 p-4 font-bold text-red-600">{error}</p>}
        {!activity && !error && <p className="mt-8 font-bold text-neutral-400">Memuat aktivitas...</p>}
        {activity && (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <ActivitySection title="Survei" empty="Belum ada permintaan survei.">
              {activity.surveys.map((item) => (
                <ActivityCard key={item.id} title={item.kos_title} status={item.status}>
                  {new Date(item.scheduled_for).toLocaleString('id-ID')} · Pengunjung: {item.visitor_name}
                </ActivityCard>
              ))}
            </ActivitySection>
            <ActivitySection title="Kontak pemilik" empty="Belum ada permintaan kontak.">
              {activity.contacts.map((item) => (
                <ActivityCard key={item.id} title={item.kos_title} status={item.status}>
                  {item.preferred_contact_method} · {item.message}
                </ActivityCard>
              ))}
            </ActivitySection>
            <ActivitySection title="Pengajuan sewa" empty="Belum ada pengajuan sewa.">
              {activity.rentals.map((item) => (
                <ActivityCard key={item.id} title={item.kos_title} status={item.status}>
                  Masuk {new Date(`${item.move_in_date}T00:00:00`).toLocaleDateString('id-ID')} · {item.rental_months} bulan · {formatRupiah(Number(item.quoted_total))}
                </ActivityCard>
              ))}
            </ActivitySection>
          </div>
        )}
      </div>
    </main>
  )
}

function ActivitySection({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-neutral-800">{title}</h2>
      <div className="mt-5 space-y-3">{children.length ? children : <p className="text-sm font-semibold text-neutral-400">{empty}</p>}</div>
    </section>
  )
}

function ActivityCard({ title, status, children }: { title: string; status: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <p className="font-black text-neutral-800">{title}</p>
      <p className="mt-2 text-sm font-semibold text-neutral-500">{children}</p>
      <span className="mt-3 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">{status}</span>
    </div>
  )
}
