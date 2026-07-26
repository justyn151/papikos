import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import {
  DashboardError,
  DashboardShell,
  EmptyPanel,
  StatusBadge,
  SummaryCard,
  type DashboardNavItem,
} from '../components/Dashboard/DashboardShell'
import {
  getAdminDashboard,
  reviewAdminListing,
  updateAdminUser,
  type AdminDashboard,
  type AdminListing,
  type AdminUser,
  type VerificationStatus,
} from '../services/adminService'
import type {
  ListingReviewStatus,
  OwnerContactRequest,
  OwnerRentalRequest,
  OwnerSurveyRequest,
} from '../services/ownerService'
import { formatRupiah } from '../utils/formatCurrency'

type AdminTab = 'overview' | 'listings' | 'users' | 'requests'

const navItems: DashboardNavItem[] = [
  { id: 'overview', label: 'Ringkasan', description: 'Kondisi platform hari ini' },
  { id: 'listings', label: 'Moderasi kos', description: 'Tinjau kos dari pemilik' },
  { id: 'users', label: 'Pengguna', description: 'Akun dan verifikasi' },
  { id: 'requests', label: 'Permintaan', description: 'Aktivitas pencari kos' },
]

const roleLabels = {
  'pencari-kos': 'Pencari Kos',
  'pemilik-kos': 'Pemilik Kos',
  admin: 'Admin',
} as const

export function AdminDashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadDashboard = useCallback(async () => {
    try {
      const nextDashboard = await getAdminDashboard()
      setError('')
      setDashboard(nextDashboard)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Dashboard admin gagal dimuat.')
    }
  }, [])

  useEffect(() => {
    if (user?.role !== 'admin') return
    let isCurrent = true
    getAdminDashboard()
      .then((nextDashboard) => {
        if (!isCurrent) return
        setError('')
        setDashboard(nextDashboard)
      })
      .catch((reason) => {
        if (isCurrent) setError(reason instanceof Error ? reason.message : 'Dashboard admin gagal dimuat.')
      })
    return () => {
      isCurrent = false
    }
  }, [user])

  if (authLoading) return <DashboardLoading label="Memuat akun admin..." />
  if (!user) return <Navigate replace to="/login" />
  if (user.role !== 'admin') return <Navigate replace to="/" />

  async function handleListingReview(
    listingId: number,
    status: ListingReviewStatus,
    reviewNotes: string,
  ) {
    await reviewAdminListing(listingId, { status, reviewNotes })
    setNotice('Tinjauan kos berhasil disimpan.')
    await loadDashboard()
  }

  async function handleUserUpdate(
    userId: number,
    isActive: boolean,
    verificationStatus: VerificationStatus,
  ) {
    await updateAdminUser(userId, { isActive, verificationStatus })
    setNotice('Data pengguna berhasil diperbarui.')
    await loadDashboard()
  }

  return (
    <DashboardShell
      accountLabel="Admin platform"
      activeTab={activeTab}
      navItems={navItems}
      onLogout={logout}
      onTabChange={(tab) => {
        setActiveTab(tab as AdminTab)
        setNotice('')
      }}
      userName={user.fullName}
    >
      {error && <DashboardError message={error} />}
      {notice && (
        <p className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-700" role="status">
          {notice}
        </p>
      )}
      {!dashboard && !error && <DashboardLoading label="Menyiapkan data platform..." compact />}

      {dashboard && activeTab === 'overview' && (
        <AdminOverview
          dashboard={dashboard}
          onOpenListings={() => setActiveTab('listings')}
          onOpenUsers={() => setActiveTab('users')}
        />
      )}
      {dashboard && activeTab === 'listings' && (
        <AdminListings listings={dashboard.listings} onSave={handleListingReview} />
      )}
      {dashboard && activeTab === 'users' && (
        <AdminUsers users={dashboard.users} onSave={handleUserUpdate} />
      )}
      {dashboard && activeTab === 'requests' && (
        <RequestMonitor requests={dashboard.requests} />
      )}
    </DashboardShell>
  )
}

function AdminOverview({
  dashboard,
  onOpenListings,
  onOpenUsers,
}: {
  dashboard: AdminDashboard
  onOpenListings: () => void
  onOpenUsers: () => void
}) {
  const { summary } = dashboard
  const pendingListings = dashboard.listings.filter((listing) => listing.status === 'pending').slice(0, 4)
  const recentUsers = dashboard.users.slice(0, 5)

  return (
    <div>
      <PageHeading
        eyebrow="Pusat kendali"
        title="Ringkasan Papikos"
        description="Pantau pertumbuhan akun, kualitas listing, dan permintaan penyewa dari satu tempat."
      />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Pengguna" value={summary.totalUsers} helper="Seluruh akun terdaftar" />
        <SummaryCard label="Pemilik" value={summary.totalOwners} helper="Akun pengelola kos" />
        <SummaryCard label="Listing" value={summary.totalListings} helper="Seluruh properti" />
        <SummaryCard label="Perlu ditinjau" value={summary.pendingListings} helper="Menunggu moderasi" />
        <SummaryCard label="Permintaan aktif" value={summary.openRequests} helper="Butuh tindak lanjut" />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-7">
          <SectionHeading title="Antrean moderasi" action="Lihat semua" onAction={onOpenListings} />
          <div className="mt-5 space-y-3">
            {pendingListings.length ? pendingListings.map((listing) => (
              <div className="flex flex-col gap-3 rounded-2xl border border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between" key={listing.id}>
                <div className="min-w-0">
                  <p className="truncate font-black text-neutral-800">{listing.title}</p>
                  <p className="mt-1 text-xs font-semibold text-neutral-500">{listing.city} · {listing.ownerName}</p>
                </div>
                <StatusBadge status={listing.status} />
              </div>
            )) : <EmptyPanel>Tidak ada listing yang menunggu tinjauan.</EmptyPanel>}
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-7">
          <SectionHeading title="Pengguna terbaru" action="Kelola" onAction={onOpenUsers} />
          <div className="mt-5 divide-y divide-neutral-100">
            {recentUsers.map((account) => (
              <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0" key={account.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{account.fullName}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-neutral-400">{roleLabels[account.role]}</p>
                </div>
                <StatusBadge status={account.isActive ? account.verificationStatus : 'inactive'} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function AdminListings({
  listings,
  onSave,
}: {
  listings: AdminListing[]
  onSave: (id: number, status: ListingReviewStatus, notes: string) => Promise<void>
}) {
  const [filter, setFilter] = useState<'all' | ListingReviewStatus>('all')
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')
  const displayed = listings
    .filter((listing) => filter === 'all' || listing.status === filter)
    .filter((listing) => !normalizedQuery || `${listing.title} ${listing.city} ${listing.ownerName} ${listing.ownerEmail}`.toLocaleLowerCase('id-ID').includes(normalizedQuery))

  return (
    <div>
      <PageHeading
        eyebrow="Kontrol kualitas"
        title="Moderasi listing kos"
        description="Pastikan informasi properti jelas dan layak sebelum tampil ke pencari kos."
      />
      <div className="mt-6 flex flex-wrap gap-2" aria-label="Filter status listing">
        {(['all', 'pending', 'published', 'rejected', 'draft', 'archived'] as const).map((status) => (
          <button
            className={`rounded-full px-4 py-2 text-xs font-black transition ${filter === status ? 'bg-[#174f35] text-white' : 'border border-neutral-200 bg-white text-neutral-500 hover:border-green-300'}`}
            key={status}
            onClick={() => setFilter(status)}
            type="button"
            aria-pressed={filter === status}
          >
            {status === 'all' ? 'Semua' : status}
          </button>
        ))}
      </div>
      <label className="mt-4 block max-w-xl text-xs font-black text-neutral-600" htmlFor="admin-listing-search">
        Cari listing atau pemilik
        <input className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100" id="admin-listing-search" onChange={(event) => setQuery(event.target.value)} placeholder="Nama kos, kota, pemilik, atau email" type="search" value={query} />
      </label>
      <div className="mt-6 grid gap-5">
        {displayed.map((listing) => (
          <AdminListingCard
            key={`${listing.id}-${listing.updatedAt}`}
            listing={listing}
            onSave={onSave}
          />
        ))}
      </div>
      {!displayed.length && <div className="mt-6"><EmptyPanel>Belum ada listing pada status ini.</EmptyPanel></div>}
    </div>
  )
}

function AdminListingCard({
  listing,
  onSave,
}: {
  listing: AdminListing
  onSave: (id: number, status: ListingReviewStatus, notes: string) => Promise<void>
}) {
  const [status, setStatus] = useState<ListingReviewStatus>(listing.status)
  const [notes, setNotes] = useState(listing.reviewNotes)
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanded, setIsExpanded] = useState(listing.status === 'pending')
  const [error, setError] = useState('')

  async function save() {
    try {
      setIsSaving(true)
      setError('')
      await onSave(listing.id, status, notes.trim())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Tinjauan gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm">
      <div className="grid md:grid-cols-[220px_1fr]">
        <div className="relative min-h-48 bg-neutral-100">
          {listing.imageUrl
            ? <img className="absolute inset-0 h-full w-full object-cover" src={listing.imageUrl} alt={listing.imageAlt} />
            : <div className="grid h-full min-h-48 place-items-center text-4xl text-neutral-300">⌂</div>}
          <span className="absolute left-4 top-4"><StatusBadge status={listing.status} /></span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-green-600">Listing #{listing.id}</p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.03em]">{listing.title}</h2>
              <p className="mt-2 text-sm font-semibold text-neutral-500">{listing.city} · {formatRupiah(listing.monthlyPrice)}/bulan</p>
            </div>
            <div className="min-w-36 rounded-2xl bg-neutral-50 p-3">
              <div className="flex items-center justify-between gap-3 text-xs font-black">
                <span className="text-neutral-500">Kelengkapan</span>
                <span className={listing.completion.percent === 100 ? 'text-green-700' : 'text-amber-700'}>{listing.completion.percent}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                <div className="h-full rounded-full bg-green-600" style={{ width: `${listing.completion.percent}%` }} />
              </div>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <ReviewStat label="Pemilik" value={listing.ownerName} />
            <ReviewStat label="Status pemilik" value={listing.ownerIsActive && listing.ownerVerificationStatus === 'verified' ? 'Aktif · terverifikasi' : 'Perlu diperiksa'} />
            <ReviewStat label="Tipe kamar" value={listing.roomTypeName || 'Belum diisi'} />
            <ReviewStat label="Ketersediaan" value={`${listing.availableRooms} / ${listing.totalRooms} kamar`} />
          </dl>
          <button className="mt-5 text-xs font-black text-green-700 hover:text-green-900" onClick={() => setIsExpanded((current) => !current)} type="button">
            {isExpanded ? 'Tutup detail pemeriksaan ↑' : 'Buka detail pemeriksaan ↓'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-neutral-100 p-5 sm:p-7">
          <div className="grid gap-7 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h3 className="text-sm font-black text-neutral-800">Materi listing</h3>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {listing.media.map((media, index) => (
                  <figure className="w-40 shrink-0 overflow-hidden rounded-2xl border border-neutral-100" key={media.id}>
                    <div className="relative h-28 bg-neutral-100">
                      {media.type === 'video' ? (
                        <video className="h-full w-full bg-black object-cover" controls muted poster={media.thumbnailUrl}>
                          <source src={media.url} type="video/mp4" />
                        </video>
                      ) : (
                        <img className="h-full w-full object-cover" src={media.thumbnailUrl ?? media.url} alt={media.alt} />
                      )}
                      {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-[#174f35] px-2 py-1 text-[9px] font-black text-white">Cover</span>}
                      {media.type === 'video' && <span className="absolute right-2 top-2 rounded-full bg-violet-700 px-2 py-1 text-[9px] font-black text-white">Video</span>}
                    </div>
                    <figcaption className="p-3">
                      <p className="truncate text-xs font-black text-neutral-700">{media.label}</p>
                      <p className="mt-1 truncate text-[10px] font-bold text-neutral-400">{media.category}</p>
                    </figcaption>
                  </figure>
                ))}
                {!listing.media.length && <p className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-700">Belum ada foto.</p>}
              </div>
              <div className="mt-5 rounded-2xl bg-neutral-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-400">Alamat dan titik lokasi</p>
                <p className="mt-2 text-sm font-black text-neutral-700">{listing.address || 'Belum diisi'}</p>
                {listing.addressNotes && <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">{listing.addressNotes}</p>}
                <p className="mt-3 text-xs font-bold text-neutral-400">
                  {listing.latitude !== null && listing.longitude !== null
                    ? `${listing.latitude}, ${listing.longitude}`
                    : 'Titik peta belum diisi'}
                </p>
              </div>
              <div className="mt-5">
                <h4 className="text-xs font-black text-neutral-700">Deskripsi pemilik</h4>
                <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-neutral-500">{listing.description || 'Belum ada deskripsi.'}</p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <ReviewList title="Fasilitas" values={listing.facilities} />
                <ReviewList title="Aturan" values={listing.rules} />
                <ReviewList title="Fasilitas tambahan pemilik" values={listing.customFacilities.map((item) => `${item.category}: ${item.name}`)} />
                <ReviewList title="Aturan tambahan pemilik" values={listing.customRules.map((item) => item.name)} />
              </div>
            </div>

            <aside>
              <div className={`rounded-2xl p-5 ${listing.completion.percent === 100 ? 'bg-green-50' : 'bg-amber-50'}`}>
                <h3 className="text-sm font-black text-neutral-800">Checklist penerbitan</h3>
                {listing.completion.missing.length ? (
                  <ul className="mt-3 space-y-2">
                    {listing.completion.missing.map((item) => <li className="text-xs font-bold text-amber-800" key={item}>○ {item}</li>)}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs font-bold leading-5 text-green-800">Semua persyaratan konten terpenuhi. Tetap periksa keakuratan foto, alamat, dan deskripsi.</p>
                )}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <ReviewStat label="Ukuran" value={listing.roomSize || '—'} />
                <ReviewStat label="Kos untuk" value={listing.tag} />
                <ReviewStat label="Durasi" value={listing.rentalDurations.join(', ') || '—'} />
                <ReviewStat label="Deposit" value={formatRupiah(listing.paymentTerms.deposit)} />
              </dl>
              <p className="mt-4 break-all text-xs font-bold text-neutral-400">{listing.ownerEmail || 'Email pemilik tidak tersedia'}</p>
            </aside>
          </div>

          <div className="mt-7 grid gap-4 border-t border-neutral-100 pt-6 sm:grid-cols-[190px_1fr_auto] sm:items-end">
            <label className="block text-xs font-black text-neutral-600" htmlFor={`listing-status-${listing.id}`}>
              Keputusan
              <select
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 font-bold outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                id={`listing-status-${listing.id}`}
                onChange={(event) => setStatus(event.target.value as ListingReviewStatus)}
                value={status}
              >
                <option value="draft">Kembalikan ke draft</option>
                <option value="pending">Tetap menunggu</option>
                <option value="published">Terbitkan</option>
                <option value="rejected">Tolak untuk diperbaiki</option>
                <option value="archived">Arsipkan</option>
              </select>
            </label>
            <label className="block text-xs font-black text-neutral-600" htmlFor={`listing-notes-${listing.id}`}>
              Catatan yang dapat ditindaklanjuti pemilik
              <textarea
                className="mt-2 min-h-24 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2 font-semibold leading-5 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                id={`listing-notes-${listing.id}`}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Sebutkan bagian dan perubahan yang dibutuhkan, misalnya: tambahkan foto kamar mandi yang lebih terang."
                value={notes}
              />
            </label>
            <button
              className="rounded-xl bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-neutral-200"
              disabled={isSaving}
              onClick={() => void save()}
              type="button"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan tinjauan'}
            </button>
          </div>
          {status === 'rejected' && !notes.trim() && <p className="mt-3 text-xs font-bold text-amber-700">Alasan penolakan wajib diisi agar pemilik tahu apa yang harus diperbaiki.</p>}
          {status === 'published' && listing.completion.percent < 100 && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
              Override admin: listing ini akan diterbitkan meskipun belum 100% lengkap. Bagian yang belum lengkap: {listing.completion.missing.join(', ')}.
            </p>
          )}
          {error && <p className="mt-3 text-xs font-bold text-red-600" role="alert">{error}</p>}
        </div>
      )}
    </article>
  )
}

function ReviewStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-neutral-50 p-3"><dt className="text-[10px] font-black uppercase tracking-[0.1em] text-neutral-400">{label}</dt><dd className="mt-1 text-xs font-black leading-5 text-neutral-700">{value}</dd></div>
}

function ReviewList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <h4 className="text-xs font-black text-neutral-700">{title}</h4>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-black text-neutral-600" key={value}>{value}</span>)}
        {!values.length && <span className="text-xs font-semibold text-neutral-400">Belum dipilih</span>}
      </div>
    </div>
  )
}

function AdminUsers({
  users,
  onSave,
}: {
  users: AdminUser[]
  onSave: (id: number, active: boolean, verification: VerificationStatus) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')
  const displayed = normalizedQuery
    ? users.filter((account) => `${account.fullName} ${account.email} ${account.phoneNumber}`.toLocaleLowerCase('id-ID').includes(normalizedQuery))
    : users

  return (
    <div>
      <PageHeading
        eyebrow="Keamanan akun"
        title="Pengguna Papikos"
        description="Verifikasi pemilik, pantau status akun, dan jaga akses platform tetap aman."
      />
      <label className="mt-6 block max-w-lg text-xs font-black text-neutral-600" htmlFor="admin-user-search">
        Cari pengguna
        <input
          className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
          id="admin-user-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nama, email, atau nomor telepon"
          type="search"
          value={query}
        />
      </label>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {displayed.map((account) => (
          <AdminUserCard
            account={account}
            key={`${account.id}-${account.verificationStatus}-${account.isActive}`}
            onSave={onSave}
          />
        ))}
      </div>
      {!displayed.length && <div className="mt-6"><EmptyPanel>Pengguna tidak ditemukan.</EmptyPanel></div>}
    </div>
  )
}

function AdminUserCard({
  account,
  onSave,
}: {
  account: AdminUser
  onSave: (id: number, active: boolean, verification: VerificationStatus) => Promise<void>
}) {
  const [isActive, setIsActive] = useState(account.isActive)
  const [verification, setVerification] = useState(account.verificationStatus)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const isProtected = account.role === 'admin'
  const canVerify = account.role === 'pemilik-kos'

  async function save() {
    try {
      setIsSaving(true)
      setError('')
      await onSave(account.id, isActive, verification)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Pengguna gagal diperbarui.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <article className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-black">{account.fullName}</p>
          <p className="mt-1 truncate text-xs font-semibold text-neutral-400">{account.email}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-400">{account.phoneNumber}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={isActive ? 'active' : 'inactive'} />
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-neutral-400">{roleLabels[account.role]}</span>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block text-xs font-black text-neutral-600" htmlFor={`verification-${account.id}`}>
          Status verifikasi
          <select
            className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 font-bold outline-none focus:border-green-500"
            disabled={!canVerify}
            id={`verification-${account.id}`}
            onChange={(event) => setVerification(event.target.value as VerificationStatus)}
            value={verification}
          >
            <option value="not_required">Tidak diperlukan</option>
            <option value="pending">Menunggu</option>
            <option value="verified">Terverifikasi</option>
            <option value="rejected">Ditolak</option>
          </select>
        </label>
        <label className="flex h-12 items-center gap-2 rounded-xl bg-neutral-50 px-4 text-xs font-black text-neutral-600">
          <input
            checked={isActive}
            className="size-4 accent-green-600"
            disabled={isProtected}
            onChange={(event) => setIsActive(event.target.checked)}
            type="checkbox"
          />
          Akun aktif
        </label>
      </div>
      {isProtected && <p className="mt-3 text-xs font-semibold text-neutral-400">Akun admin dilindungi dari perubahan di layar ini.</p>}
      {!isProtected && !canVerify && <p className="mt-3 text-xs font-semibold text-neutral-400">Verifikasi hanya diperlukan untuk akun pemilik kos.</p>}
      {error && <p className="mt-3 text-xs font-bold text-red-600" role="alert">{error}</p>}
      <button
        className="mt-4 w-full rounded-xl border border-green-600 px-4 py-3 text-sm font-black text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300"
        disabled={isSaving || isProtected}
        onClick={() => void save()}
        type="button"
      >
        {isSaving ? 'Menyimpan...' : 'Simpan pengguna'}
      </button>
    </article>
  )
}

function RequestMonitor({ requests }: { requests: AdminDashboard['requests'] }) {
  return (
    <div>
      <PageHeading
        eyebrow="Aktivitas platform"
        title="Permintaan pencari kos"
        description="Lihat arus survei, percakapan, dan pengajuan sewa di seluruh Papikos."
      />
      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        <RequestColumn title="Jadwal survei" empty="Belum ada survei.">
          {requests.surveys.map((request) => <AdminSurveyCard key={request.id} request={request} />)}
        </RequestColumn>
        <RequestColumn title="Kontak pemilik" empty="Belum ada permintaan kontak.">
          {requests.contacts.map((request) => <AdminContactCard key={request.id} request={request} />)}
        </RequestColumn>
        <RequestColumn title="Pengajuan sewa" empty="Belum ada pengajuan sewa.">
          {requests.rentals.map((request) => <AdminRentalCard key={request.id} request={request} />)}
        </RequestColumn>
      </div>
    </div>
  )
}

function RequestColumn({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <section className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-black">{title}</h2>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-black text-neutral-500">{children.length}</span>
      </div>
      <div className="mt-5 space-y-3">{children.length ? children : <EmptyPanel>{empty}</EmptyPanel>}</div>
    </section>
  )
}

function RequestCard({ title, person, status, children }: { title: string; person: string; status: string; children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-neutral-100 p-4">
      <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-black">{title}</h3><StatusBadge status={status} /></div>
      <p className="mt-2 text-xs font-bold text-neutral-500">{person}</p>
      <div className="mt-3 text-xs font-semibold leading-5 text-neutral-500">{children}</div>
    </article>
  )
}

function AdminSurveyCard({ request }: { request: OwnerSurveyRequest }) {
  return <RequestCard title={request.kos_title} person={request.renter_name} status={request.status}><p>{new Date(request.scheduled_for).toLocaleString('id-ID')}</p><p>Pengunjung: {request.visitor_name}</p></RequestCard>
}

function AdminContactCard({ request }: { request: OwnerContactRequest }) {
  return <RequestCard title={request.kos_title} person={request.renter_name} status={request.status}><p className="line-clamp-3">{request.message}</p><p className="mt-1 uppercase">Balas via {request.preferred_contact_method}</p></RequestCard>
}

function AdminRentalCard({ request }: { request: OwnerRentalRequest }) {
  return <RequestCard title={request.kos_title} person={request.renter_name} status={request.status}><p>Masuk {new Date(`${request.move_in_date}T00:00:00`).toLocaleDateString('id-ID')}</p><p>{request.rental_months} bulan · {formatRupiah(Number(request.quoted_total))}</p></RequestCard>
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-green-600">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#173e2d] sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-neutral-500">{description}</p>
    </div>
  )
}

function SectionHeading({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-black">{title}</h2><button className="text-xs font-black text-green-600 hover:text-green-700" onClick={onAction} type="button">{action} →</button></div>
}

function DashboardLoading({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <main className={`${compact ? 'min-h-80' : 'min-h-dvh'} grid place-items-center bg-[#f6f8f7] p-6`}>
      <div className="text-center">
        <span className="mx-auto block size-10 animate-spin rounded-full border-4 border-green-100 border-t-green-600" aria-hidden="true" />
        <p className="mt-4 text-sm font-black text-neutral-500" role="status">{label}</p>
      </div>
    </main>
  )
}
