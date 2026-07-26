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
import { OwnerListingWizard } from '../components/Dashboard/OwnerListingWizard'
import {
  createOwnerListing,
  getOwnerDashboard,
  submitOwnerListing,
  updateOwnerAvailability,
  updateOwnerListing,
  updateOwnerRequest,
  type OwnerContactRequest,
  type OwnerDashboard,
  type OwnerListing,
  type OwnerListingInput,
  type OwnerRentalRequest,
  type OwnerSurveyRequest,
} from '../services/ownerService'
import { formatRupiah } from '../utils/formatCurrency'

type OwnerTab = 'overview' | 'listings' | 'requests'
type RequestType = 'surveys' | 'contacts' | 'rentals'

const navItems: DashboardNavItem[] = [
  { id: 'overview', label: 'Ringkasan', description: 'Performa kos hari ini' },
  { id: 'listings', label: 'Properti saya', description: 'Data kos dan kamar' },
  { id: 'requests', label: 'Permintaan masuk', description: 'Survei, kontak, dan sewa' },
]

const requestStatuses = {
  surveys: ['pending', 'confirmed', 'completed', 'cancelled'],
  contacts: ['open', 'answered', 'closed'],
  rentals: ['submitted', 'reviewing', 'accepted', 'rejected', 'cancelled'],
} as const

const emptyListing: OwnerListingInput = {
  title: '',
  city: '',
  monthlyPrice: 0,
  tag: 'Campur',
  address: '',
  addressNotes: '',
  description: '',
  roomTypeName: '',
  roomSize: '',
  totalRooms: 0,
  availableRooms: 0,
  imageUrl: '',
  imageAlt: '',
  latitude: null,
  longitude: null,
  media: [],
  facilityIds: [],
  ruleIds: [],
  customFacilities: [],
  customRules: [],
  rentalDurations: ['Bulanan'],
  paymentTerms: {
    dpPercentage: 30,
    serviceFee: 0,
    adminFee: 0,
    deposit: 0,
    discountPercentage: 0,
  },
}

export function OwnerDashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<OwnerTab>('overview')
  const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingListing, setEditingListing] = useState<OwnerListing | 'new' | null>(null)

  const loadDashboard = useCallback(async () => {
    try {
      const nextDashboard = await getOwnerDashboard()
      setError('')
      setDashboard(nextDashboard)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Dashboard pemilik gagal dimuat.')
    }
  }, [])

  useEffect(() => {
    if (user?.role !== 'pemilik-kos' || user.verificationStatus !== 'verified') return
    let isCurrent = true
    getOwnerDashboard()
      .then((nextDashboard) => {
        if (!isCurrent) return
        setError('')
        setDashboard(nextDashboard)
      })
      .catch((reason) => {
        if (isCurrent) setError(reason instanceof Error ? reason.message : 'Dashboard pemilik gagal dimuat.')
      })
    return () => {
      isCurrent = false
    }
  }, [user])

  if (authLoading) return <DashboardLoading label="Memuat akun pemilik..." />
  if (!user) return <Navigate replace to="/login" />
  if (user.role !== 'pemilik-kos') return <Navigate replace to="/" />
  if (user.verificationStatus !== 'verified') {
    return (
      <OwnerVerificationGate
        status={user.verificationStatus}
        userName={user.fullName}
        onLogout={logout}
      />
    )
  }

  function openListingsEditor(listing: OwnerListing | 'new') {
    setActiveTab('listings')
    setEditingListing(listing)
    setNotice('')
  }

  async function saveListing(payload: OwnerListingInput) {
    if (editingListing === 'new') {
      await createOwnerListing(payload)
      setNotice('Kos baru berhasil disimpan sebagai draft.')
    } else if (editingListing) {
      await updateOwnerListing(editingListing.id, payload)
      setNotice('Informasi kos berhasil diperbarui.')
    }
    setEditingListing(null)
    await loadDashboard()
  }

  async function submitListing(listingId: number) {
    await submitOwnerListing(listingId)
    setNotice('Kos sudah dikirim untuk ditinjau admin.')
    await loadDashboard()
  }

  async function saveAvailability(listingId: number, availableRooms: number) {
    await updateOwnerAvailability(listingId, availableRooms)
    setNotice('Jumlah kamar tersedia sudah diperbarui.')
    await loadDashboard()
  }

  async function changeRequestStatus(type: RequestType, id: number, status: string) {
    await updateOwnerRequest(type, id, status)
    setNotice('Status permintaan berhasil diperbarui.')
    await loadDashboard()
  }

  return (
    <DashboardShell
      accountLabel="Pemilik kos"
      activeTab={activeTab}
      navItems={navItems}
      onLogout={logout}
      onTabChange={(tab) => {
        setActiveTab(tab as OwnerTab)
        setEditingListing(null)
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
      {!dashboard && !error && <DashboardLoading label="Menyiapkan dashboard kos..." compact />}

      {dashboard && activeTab === 'overview' && (
        <OwnerOverview
          dashboard={dashboard}
          onAddListing={() => openListingsEditor('new')}
          onOpenListings={() => setActiveTab('listings')}
          onOpenRequests={() => setActiveTab('requests')}
        />
      )}
      {dashboard && activeTab === 'listings' && (
        <OwnerListings
          dashboard={dashboard}
          editingListing={editingListing}
          onCancelEdit={() => setEditingListing(null)}
          onEdit={setEditingListing}
          onNew={() => setEditingListing('new')}
          onSave={saveListing}
          onSaveAvailability={saveAvailability}
          onSubmit={submitListing}
        />
      )}
      {dashboard && activeTab === 'requests' && (
        <OwnerRequests dashboard={dashboard} onStatusChange={changeRequestStatus} />
      )}
    </DashboardShell>
  )
}

function OwnerOverview({
  dashboard,
  onAddListing,
  onOpenListings,
  onOpenRequests,
}: {
  dashboard: OwnerDashboard
  onAddListing: () => void
  onOpenListings: () => void
  onOpenRequests: () => void
}) {
  const { summary } = dashboard
  const recentRequests = [
    ...dashboard.surveys.map((item) => ({ id: `survey-${item.id}`, title: item.kos_title, person: item.renter_name, status: item.status, type: 'Survei' })),
    ...dashboard.contacts.map((item) => ({ id: `contact-${item.id}`, title: item.kos_title, person: item.renter_name, status: item.status, type: 'Kontak' })),
    ...dashboard.rentals.map((item) => ({ id: `rental-${item.id}`, title: item.kos_title, person: item.renter_name, status: item.status, type: 'Sewa' })),
  ].slice(0, 5)

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <PageHeading
          eyebrow="Ruang kerja pemilik"
          title="Kelola kos dengan tenang"
          description="Perbarui kamar, siapkan listing, dan jawab calon penyewa tanpa kehilangan konteks."
        />
        <button className="shrink-0 rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700" onClick={onAddListing} type="button">
          + Tambah kos
        </button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total kos" value={summary.totalListings} helper="Properti dalam akunmu" />
        <SummaryCard label="Sudah tayang" value={summary.publishedListings} helper="Dapat ditemukan penyewa" />
        <SummaryCard label="Kamar tersedia" value={summary.availableRooms} helper="Siap untuk dihuni" />
        <SummaryCard label="Permintaan aktif" value={summary.openRequests} helper="Perlu tindak lanjut" />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-7">
          <SectionHeading title="Properti terbaru" action="Kelola semua" onAction={onOpenListings} />
          <div className="mt-5 space-y-3">
            {dashboard.listings.slice(0, 4).map((listing) => (
              <button className="flex w-full items-center gap-4 rounded-2xl border border-neutral-100 p-3 text-left transition hover:border-green-200 hover:bg-green-50/30" key={listing.id} onClick={onOpenListings} type="button">
                {listing.imageUrl ? (
                  <img className="size-16 shrink-0 rounded-xl object-cover" src={listing.imageUrl} alt="" />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-green-50 text-xl" aria-hidden="true">⌂</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">{listing.title}</span>
                  <span className="mt-1 block text-xs font-semibold text-neutral-400">{listing.availableRooms}/{listing.totalRooms} kamar · {listing.city}</span>
                </span>
                <StatusBadge status={listing.status} />
              </button>
            ))}
            {!dashboard.listings.length && <EmptyPanel>Belum ada kos. Tambahkan properti pertamamu.</EmptyPanel>}
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-7">
          <SectionHeading title="Permintaan terbaru" action="Lihat semua" onAction={onOpenRequests} />
          <div className="mt-5 divide-y divide-neutral-100">
            {recentRequests.map((request) => (
              <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0" key={request.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{request.title}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-neutral-400">{request.type} · {request.person}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>
            ))}
            {!recentRequests.length && <EmptyPanel>Belum ada permintaan baru.</EmptyPanel>}
          </div>
        </section>
      </div>
    </div>
  )
}

function OwnerListings({
  dashboard,
  editingListing,
  onNew,
  onEdit,
  onCancelEdit,
  onSave,
  onSubmit,
  onSaveAvailability,
}: {
  dashboard: OwnerDashboard
  editingListing: OwnerListing | 'new' | null
  onNew: () => void
  onEdit: (listing: OwnerListing) => void
  onCancelEdit: () => void
  onSave: (payload: OwnerListingInput) => Promise<void>
  onSubmit: (id: number) => Promise<void>
  onSaveAvailability: (id: number, availableRooms: number) => Promise<void>
}) {
  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <PageHeading
          eyebrow="Portofolio kos"
          title="Properti saya"
          description="Lengkapi informasi kos, atur ketersediaan kamar, lalu kirim untuk ditinjau."
        />
        {!editingListing && (
          <button className="shrink-0 rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-700" onClick={onNew} type="button">
            + Tambah kos
          </button>
        )}
      </div>

      {editingListing && (
        <OwnerListingWizard
          facilities={dashboard.setupOptions.facilities}
          initial={editingListing === 'new' ? emptyListing : editingListing}
          isNew={editingListing === 'new'}
          key={editingListing === 'new' ? 'new' : editingListing.id}
          onCancel={onCancelEdit}
          onSave={onSave}
          rules={dashboard.setupOptions.rules}
        />
      )}

      {!editingListing && (
        <div className="mt-7 grid gap-5 xl:grid-cols-2">
          {dashboard.listings.map((listing) => (
            <OwnerListingCard
              key={`${listing.id}-${listing.updatedAt}`}
              listing={listing}
              onEdit={onEdit}
              onSaveAvailability={onSaveAvailability}
              onSubmit={onSubmit}
            />
          ))}
        </div>
      )}
      {!editingListing && !dashboard.listings.length && <div className="mt-7"><EmptyPanel>Belum ada kos. Buat listing pertamamu untuk mulai menerima penyewa.</EmptyPanel></div>}
    </div>
  )
}

function OwnerListingCard({
  listing,
  onEdit,
  onSubmit,
  onSaveAvailability,
}: {
  listing: OwnerListing
  onEdit: (listing: OwnerListing) => void
  onSubmit: (id: number) => Promise<void>
  onSaveAvailability: (id: number, availableRooms: number) => Promise<void>
}) {
  const [rooms, setRooms] = useState(listing.availableRooms)
  const [busyAction, setBusyAction] = useState('')
  const [error, setError] = useState('')

  async function run(action: 'submit' | 'availability') {
    try {
      setBusyAction(action)
      setError('')
      if (action === 'submit') await onSubmit(listing.id)
      else await onSaveAvailability(listing.id, rooms)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Perubahan gagal disimpan.')
    } finally {
      setBusyAction('')
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm">
      <div className="relative h-44 bg-green-50">
        {listing.imageUrl ? <img className="h-full w-full object-cover" src={listing.imageUrl} alt={listing.imageAlt} /> : <div className="grid h-full place-items-center text-4xl text-green-200">⌂</div>}
        <span className="absolute left-4 top-4"><StatusBadge status={listing.status} /></span>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-green-600">{listing.city}</p>
        <h2 className="mt-2 text-xl font-black tracking-[-0.03em]">{listing.title}</h2>
        <p className="mt-2 text-sm font-bold text-neutral-500">{formatRupiah(listing.monthlyPrice)} <span className="font-semibold text-neutral-400">/ bulan</span></p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-green-600" style={{ width: `${listing.completion.percent}%` }} />
          </div>
          <span className="text-[10px] font-black text-neutral-500">{listing.completion.percent}% lengkap</span>
        </div>
        <p className="mt-3 text-xs font-semibold text-neutral-400">{listing.roomTypeName || 'Tipe kamar belum diisi'} · {listing.media.length} media</p>
        {listing.reviewNotes && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800"><span className="font-black">Catatan admin:</span> {listing.reviewNotes}</p>}

        <div className="mt-5 flex items-end gap-3 rounded-2xl bg-neutral-50 p-3">
          <label className="min-w-0 flex-1 text-xs font-black text-neutral-600" htmlFor={`rooms-${listing.id}`}>Kamar tersedia (maks. {listing.totalRooms})<input className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-bold outline-none focus:border-green-500 disabled:bg-neutral-100" disabled={listing.status === 'archived'} id={`rooms-${listing.id}`} max={listing.totalRooms} min="0" onChange={(event) => setRooms(Math.min(listing.totalRooms, Math.max(0, Number(event.target.value))))} type="number" value={rooms} /></label>
          <button className="rounded-xl border border-green-600 px-4 py-2 text-xs font-black text-green-700 hover:bg-green-50 disabled:border-neutral-200 disabled:text-neutral-300" disabled={busyAction !== '' || rooms === listing.availableRooms || listing.status === 'archived'} onClick={() => void run('availability')} type="button">{busyAction === 'availability' ? '...' : 'Simpan'}</button>
        </div>
        {error && <p className="mt-3 text-xs font-bold text-red-600" role="alert">{error}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-black text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-300" disabled={listing.status === 'archived'} onClick={() => onEdit(listing)} type="button">Edit data</button>
          {(listing.status === 'draft' || listing.status === 'rejected') ? (
            <button className="rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-neutral-200" disabled={busyAction !== '' || listing.completion.percent < 100} onClick={() => void run('submit')} title={listing.completion.percent < 100 ? `Lengkapi: ${listing.completion.missing.join(', ')}` : undefined} type="button">{busyAction === 'submit' ? 'Mengirim...' : listing.completion.percent < 100 ? 'Lengkapi dahulu' : 'Kirim tinjauan'}</button>
          ) : (
            <span className="grid place-items-center rounded-xl bg-neutral-50 px-3 text-center text-xs font-bold text-neutral-400">{listing.status === 'published' ? 'Sudah tayang' : listing.status === 'archived' ? 'Diarsipkan admin' : 'Sedang ditinjau'}</span>
          )}
        </div>
      </div>
    </article>
  )
}

function OwnerRequests({ dashboard, onStatusChange }: { dashboard: OwnerDashboard; onStatusChange: (type: RequestType, id: number, status: string) => Promise<void> }) {
  return (
    <div>
      <PageHeading eyebrow="Calon penyewa" title="Permintaan masuk" description="Tindak lanjuti survei, pertanyaan, dan pengajuan sewa untuk setiap kosmu." />
      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        <RequestColumn title="Jadwal survei" empty="Belum ada permintaan survei.">
          {dashboard.surveys.map((request) => <OwnerSurveyCard key={request.id} request={request} onChange={(status) => onStatusChange('surveys', request.id, status)} />)}
        </RequestColumn>
        <RequestColumn title="Kontak pemilik" empty="Belum ada permintaan kontak.">
          {dashboard.contacts.map((request) => <OwnerContactCard key={request.id} request={request} onChange={(status) => onStatusChange('contacts', request.id, status)} />)}
        </RequestColumn>
        <RequestColumn title="Pengajuan sewa" empty="Belum ada pengajuan sewa.">
          {dashboard.rentals.map((request) => <OwnerRentalCard key={request.id} request={request} onChange={(status) => onStatusChange('rentals', request.id, status)} />)}
        </RequestColumn>
      </div>
    </div>
  )
}

function RequestColumn({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return <section className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-black">{title}</h2><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-black text-neutral-500">{children.length}</span></div><div className="mt-5 space-y-4">{children.length ? children : <EmptyPanel>{empty}</EmptyPanel>}</div></section>
}

function RequestCard({ title, requester, phone, status, details, options, onChange }: { title: string; requester: string; phone: string; status: string; details: ReactNode; options: readonly string[]; onChange: (status: string) => Promise<void> }) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  async function change(nextStatus: string) { try { setIsSaving(true); setError(''); await onChange(nextStatus) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Status gagal diperbarui.') } finally { setIsSaving(false) } }
  return <article className="rounded-2xl border border-neutral-100 p-4"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-black">{title}</h3><StatusBadge status={status} /></div><p className="mt-2 text-xs font-bold text-neutral-500">{requester} · {phone}</p><div className="mt-3 rounded-xl bg-neutral-50 p-3 text-xs font-semibold leading-5 text-neutral-500">{details}</div><label className="mt-4 block text-[10px] font-black uppercase tracking-[0.1em] text-neutral-400">Ubah status<select className="mt-2 w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-xs font-black text-neutral-700 outline-none focus:border-green-500" disabled={isSaving} onChange={(event) => void change(event.target.value)} value={status}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>{error && <p className="mt-2 text-xs font-bold text-red-600" role="alert">{error}</p>}</article>
}

function OwnerSurveyCard({ request, onChange }: { request: OwnerSurveyRequest; onChange: (status: string) => Promise<void> }) {
  return <RequestCard title={request.kos_title} requester={request.renter_name} phone={request.phone_number} status={request.status} options={requestStatuses.surveys} onChange={onChange} details={<><p>{new Date(request.scheduled_for).toLocaleString('id-ID')}</p><p>Pengunjung: {request.visitor_name}</p>{request.relationship && <p>Hubungan: {request.relationship}</p>}{request.notes && <p>Catatan: {request.notes}</p>}</>} />
}

function OwnerContactCard({ request, onChange }: { request: OwnerContactRequest; onChange: (status: string) => Promise<void> }) {
  return <RequestCard title={request.kos_title} requester={request.renter_name} phone={request.phone_number} status={request.status} options={requestStatuses.contacts} onChange={onChange} details={<><p>{request.message}</p><p className="mt-1">Balas via: {request.preferred_contact_method}</p></>} />
}

function OwnerRentalCard({ request, onChange }: { request: OwnerRentalRequest; onChange: (status: string) => Promise<void> }) {
  return <RequestCard title={request.kos_title} requester={request.renter_name} phone={request.phone_number} status={request.status} options={requestStatuses.rentals} onChange={onChange} details={<><p>Mulai: {new Date(`${request.move_in_date}T00:00:00`).toLocaleDateString('id-ID')}</p><p>{request.rental_months} bulan · {formatRupiah(Number(request.quoted_total))}</p>{request.notes && <p>Catatan: {request.notes}</p>}</>} />
}

function OwnerVerificationGate({
  status,
  userName,
  onLogout,
}: {
  status: 'not_required' | 'pending' | 'rejected'
  userName: string
  onLogout: (options?: {
    redirectTo?: string
  }) => Promise<void>
}) {
  const isRejected = status === 'rejected'
  return (
    <DashboardShell
      accountLabel="Pemilik kos"
      activeTab="overview"
      navItems={[navItems[0]]}
      onLogout={onLogout}
      onTabChange={() => undefined}
      userName={userName}
    >
      <div className="grid min-h-[65vh] place-items-center">
        <section className="w-full max-w-2xl rounded-[2rem] border border-neutral-100 bg-white p-7 text-center shadow-sm sm:p-12">
          <span className={`mx-auto grid size-20 place-items-center rounded-full text-3xl ${isRejected ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`} aria-hidden="true">
            {isRejected ? '!' : '…'}
          </span>
          <p className="mt-7 text-xs font-black uppercase tracking-[0.17em] text-green-600">Verifikasi pemilik</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#173e2d]">
            {isRejected ? 'Verifikasi akun belum disetujui' : 'Akunmu sedang kami tinjau'}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm font-semibold leading-7 text-neutral-500">
            {isRejected
              ? 'Hubungi pengelola Papikos untuk memperbaiki data kepemilikan. Akses pengelolaan kos akan dibuka setelah verifikasi disetujui.'
              : 'Admin Papikos perlu memastikan identitas pemilik sebelum properti dapat dikelola dan diterbitkan. Silakan kembali lagi setelah proses verifikasi selesai.'}
          </p>
          <div className="mt-6"><StatusBadge status={status} /></div>
        </section>
      </div>
    </DashboardShell>
  )
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div><p className="text-xs font-black uppercase tracking-[0.18em] text-green-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#173e2d] sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-neutral-500">{description}</p></div>
}

function SectionHeading({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-black">{title}</h2><button className="text-xs font-black text-green-600 hover:text-green-700" onClick={onAction} type="button">{action} →</button></div>
}

function DashboardLoading({ label, compact = false }: { label: string; compact?: boolean }) {
  return <main className={`${compact ? 'min-h-80' : 'min-h-dvh'} grid place-items-center bg-[#f6f8f7] p-6`}><div className="text-center"><span className="mx-auto block size-10 animate-spin rounded-full border-4 border-green-100 border-t-green-600" aria-hidden="true" /><p className="mt-4 text-sm font-black text-neutral-500" role="status">{label}</p></div></main>
}
