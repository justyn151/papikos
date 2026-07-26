import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { KosMedia, RentalDuration } from '../../types/kos'
import {
  type FacilityOption,
  type OwnerListingInput,
  type RuleOption,
  uploadOwnerMedia,
} from '../../services/ownerService'
import { formatRupiah } from '../../utils/formatCurrency'

type WizardProps = {
  initial: OwnerListingInput
  isNew: boolean
  facilities: FacilityOption[]
  rules: RuleOption[]
  onSave: (payload: OwnerListingInput) => Promise<void>
  onCancel: () => void
}

const steps = [
  { label: 'Identitas & lokasi', short: 'Lokasi' },
  { label: 'Kamar & harga', short: 'Kamar' },
  { label: 'Foto showcase', short: 'Foto' },
  { label: 'Fasilitas & aturan', short: 'Fasilitas' },
  { label: 'Review listing', short: 'Review' },
] as const

const mediaCategories = [
  { value: 'bedroom', label: 'Kamar tidur' },
  { value: 'bathroom', label: 'Kamar mandi' },
  { value: 'building', label: 'Bangunan' },
  { value: 'exterior', label: 'Tampak depan' },
  { value: 'common-area', label: 'Area bersama' },
  { value: 'other', label: 'Lainnya' },
  { value: 'video-tour', label: 'Video tour' },
] as const

const durations: RentalDuration[] = ['Bulanan', '3 Bulan', '6 Bulan', 'Tahunan']

const inputClass = 'mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 outline-none transition placeholder:text-neutral-300 focus:border-green-500 focus:ring-4 focus:ring-green-100'

function cloneInput(initial: OwnerListingInput): OwnerListingInput {
  return {
    ...initial,
    media: initial.media.map((item) => ({ ...item })),
    facilityIds: [...initial.facilityIds],
    ruleIds: [...initial.ruleIds],
    customFacilities: initial.customFacilities.map((item) => ({ ...item })),
    customRules: initial.customRules.map((item) => ({ ...item })),
    rentalDurations: [...initial.rentalDurations],
    paymentTerms: { ...initial.paymentTerms },
  }
}

export function OwnerListingWizard({
  initial,
  isNew,
  facilities,
  rules,
  onSave,
  onCancel,
}: WizardProps) {
  const [form, setForm] = useState(() => cloneInput(initial))
  const [activeStep, setActiveStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')

  function setField<Key extends keyof OwnerListingInput>(
    key: Key,
    value: OwnerListingInput[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const completion = useMemo(() => getLocalCompletion(form), [form])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.title.trim()) {
      setActiveStep(0)
      setError('Isi nama kos terlebih dahulu agar draft mudah ditemukan.')
      return
    }
    if (form.availableRooms > form.totalRooms) {
      setActiveStep(1)
      setError('Kamar tersedia tidak boleh lebih banyak dari total kamar.')
      return
    }
    try {
      setIsSaving(true)
      setError('')
      const media = form.media.map((item) => ({
        ...item,
        url: item.url.trim(),
        label: item.label.trim(),
        alt: item.alt.trim(),
      }))
      await onSave({
        ...form,
        title: form.title.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        addressNotes: form.addressNotes.trim(),
        description: form.description.trim(),
        roomTypeName: form.roomTypeName.trim(),
        roomSize: form.roomSize.trim(),
        imageUrl: media[0]?.url ?? '',
        imageAlt: media[0]?.alt ?? '',
        media,
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Draft kos gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="mt-7 overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-sm" onSubmit={save}>
      <div className="border-b border-neutral-100 bg-gradient-to-r from-green-50 to-white p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-green-600">
              {isNew ? 'Listing baru' : `Edit listing · ${form.title}`}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#173e2d]">
              {isNew ? 'Daftarkan kos langkah demi langkah' : 'Lengkapi informasi kos'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-neutral-500">
              Satu listing mewakili satu tipe kamar. Simpan sebagai draft kapan saja, lalu ajukan setelah indikator mencapai 100%.
            </p>
          </div>
          <button className="self-start rounded-xl px-3 py-2 text-xs font-black text-neutral-500 hover:bg-white" onClick={onCancel} type="button">
            Tutup
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${completion.percent}%` }} />
          </div>
          <span className="text-xs font-black text-green-700">{completion.percent}% siap</span>
        </div>

        <ol className="mt-6 grid grid-cols-5 gap-2" aria-label="Tahapan pengisian listing">
          {steps.map((step, index) => (
            <li key={step.label}>
              <button
                className={`w-full rounded-xl px-2 py-3 text-center transition ${
                  activeStep === index
                    ? 'bg-[#174f35] text-white shadow-lg shadow-green-900/10'
                    : index < activeStep
                      ? 'bg-green-100 text-green-800'
                      : 'bg-white text-neutral-400 hover:text-green-700'
                }`}
                onClick={() => {
                  setActiveStep(index)
                  setError('')
                }}
                type="button"
              >
                <span className="mx-auto grid size-6 place-items-center rounded-full border border-current text-[10px] font-black">{index + 1}</span>
                <span className="mt-1.5 hidden text-[10px] font-black sm:block">{step.label}</span>
                <span className="mt-1.5 block text-[10px] font-black sm:hidden">{step.short}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="p-5 sm:p-7">
        {activeStep === 0 && <IdentityStep form={form} setField={setField} />}
        {activeStep === 1 && <RoomStep form={form} setField={setField} />}
        {activeStep === 2 && <GalleryStep media={form.media} onChange={(media) => setField('media', media)} />}
        {activeStep === 3 && (
          <FacilitiesStep
            facilities={facilities}
            form={form}
            rules={rules}
            setField={setField}
          />
        )}
        {activeStep === 4 && (
          <ReviewStep
            completion={completion}
            form={form}
            onEditStep={setActiveStep}
            onPreview={() => setShowPreview(true)}
          />
        )}

        {error && <p className="mt-6 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600" role="alert">{error}</p>}
        <div className="mt-8 flex flex-col gap-3 border-t border-neutral-100 pt-6 sm:flex-row sm:items-center">
          <button
            className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-black text-neutral-600 hover:bg-neutral-50 disabled:opacity-30"
            disabled={activeStep === 0}
            onClick={() => {
              setActiveStep((current) => Math.max(0, current - 1))
              setError('')
            }}
            type="button"
          >
            ← Kembali
          </button>
          <button
            className="rounded-xl border border-green-600 px-5 py-3 text-sm font-black text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300 sm:ml-auto"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan draft'}
          </button>
          {activeStep < steps.length - 1 && (
            <button
              className="rounded-xl bg-green-600 px-6 py-3 text-sm font-black text-white hover:bg-green-700"
              onClick={() => {
                setActiveStep((current) => Math.min(steps.length - 1, current + 1))
                setError('')
              }}
              type="button"
            >
              Lanjut →
            </button>
          )}
        </div>
      </div>

      {showPreview && <ListingPreview form={form} onClose={() => setShowPreview(false)} />}
    </form>
  )
}

function IdentityStep({
  form,
  setField,
}: {
  form: OwnerListingInput
  setField: <Key extends keyof OwnerListingInput>(key: Key, value: OwnerListingInput[Key]) => void
}) {
  return (
    <StepSection
      eyebrow="Data kos"
      title="Mulai dari identitas dan lokasi"
      description="Alamat lengkap dan titik peta membantu pencari kos menemukan lokasi yang benar, sementara petunjuk lokasi berguna saat survei."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField id="owner-title" label="Nama kos" value={form.title} onChange={(value) => setField('title', value)} placeholder="Contoh: Griya Pogung Residence" />
        <TextField id="owner-city" label="Kota / kabupaten" value={form.city} onChange={(value) => setField('city', value)} placeholder="Contoh: Sleman" />
        <label className="block text-xs font-black text-neutral-600" htmlFor="owner-tag">
          Kos untuk
          <select className={inputClass} id="owner-tag" onChange={(event) => setField('tag', event.target.value)} value={form.tag}>
            <option>Putri</option>
            <option>Putra</option>
            <option>Campur</option>
          </select>
        </label>
        <div className="rounded-2xl bg-green-50 p-4 text-xs font-semibold leading-5 text-green-800">
          Gunakan nama properti, bukan nama tipe kamar. Tipe kamar akan diisi pada langkah berikutnya.
        </div>
        <div className="md:col-span-2">
          <TextField id="owner-address" label="Alamat lengkap" value={form.address} onChange={(value) => setField('address', value)} placeholder="Nama jalan, nomor, kelurahan, kecamatan, kota" />
        </div>
        <div className="md:col-span-2">
          <TextArea id="owner-address-notes" label="Patokan dan petunjuk menuju kos" value={form.addressNotes} onChange={(value) => setField('addressNotes', value)} placeholder="Contoh: Gang di samping minimarket, pagar hijau, 300 m dari kampus." />
        </div>
        <NumberField id="owner-latitude" label="Latitude titik kos" value={form.latitude ?? ''} onChange={(value) => setField('latitude', value)} step="any" />
        <NumberField id="owner-longitude" label="Longitude titik kos" value={form.longitude ?? ''} onChange={(value) => setField('longitude', value)} step="any" />
      </div>
      <Tip>Untuk demo ini titik peta dimasukkan sebagai koordinat. Pada versi produksi, bagian ini idealnya memakai pin yang dapat digeser di atas peta.</Tip>
    </StepSection>
  )
}

function RoomStep({
  form,
  setField,
}: {
  form: OwnerListingInput
  setField: <Key extends keyof OwnerListingInput>(key: Key, value: OwnerListingInput[Key]) => void
}) {
  function setPayment<Key extends keyof OwnerListingInput['paymentTerms']>(
    key: Key,
    value: number,
  ) {
    setField('paymentTerms', { ...form.paymentTerms, [key]: value })
  }

  return (
    <StepSection
      eyebrow="Kamar dan komersial"
      title="Jelaskan unit yang benar-benar disewakan"
      description="Harga, kapasitas, dan tipe kamar disimpan per listing agar ketersediaan tidak membingungkan calon penyewa."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField id="owner-room-type" label="Nama tipe kamar" value={form.roomTypeName} onChange={(value) => setField('roomTypeName', value)} placeholder="Contoh: Kamar A · AC + kamar mandi dalam" />
        <TextField id="owner-room-size" label="Ukuran kamar" value={form.roomSize} onChange={(value) => setField('roomSize', value)} placeholder="Contoh: 3 x 4 m" />
        <NumberField id="owner-total-rooms" label="Total kamar tipe ini" value={form.totalRooms} onChange={(value) => setField('totalRooms', value ?? 0)} min={0} />
        <NumberField id="owner-available-rooms" label="Kamar tersedia saat ini" value={form.availableRooms} onChange={(value) => setField('availableRooms', value ?? 0)} min={0} max={form.totalRooms} />
        <NumberField id="owner-price" label="Harga dasar per bulan" value={form.monthlyPrice} onChange={(value) => setField('monthlyPrice', value ?? 0)} min={0} />
        <NumberField id="owner-deposit" label="Deposit" value={form.paymentTerms.deposit} onChange={(value) => setPayment('deposit', value ?? 0)} min={0} />
        <NumberField id="owner-dp" label="DP minimum (%)" value={form.paymentTerms.dpPercentage} onChange={(value) => setPayment('dpPercentage', value ?? 0)} min={0} max={100} />
        <NumberField id="owner-discount" label="Diskon (%)" value={form.paymentTerms.discountPercentage} onChange={(value) => setPayment('discountPercentage', value ?? 0)} min={0} max={100} />
        <NumberField id="owner-service-fee" label="Biaya layanan" value={form.paymentTerms.serviceFee} onChange={(value) => setPayment('serviceFee', value ?? 0)} min={0} />
        <NumberField id="owner-admin-fee" label="Biaya administrasi" value={form.paymentTerms.adminFee} onChange={(value) => setPayment('adminFee', value ?? 0)} min={0} />
        <fieldset className="md:col-span-2">
          <legend className="text-xs font-black text-neutral-600">Durasi sewa yang diterima</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {durations.map((duration) => {
              const checked = form.rentalDurations.includes(duration)
              return (
                <label className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-black transition ${checked ? 'border-green-600 bg-green-50 text-green-700' : 'border-neutral-200 text-neutral-500'}`} key={duration}>
                  <input
                    checked={checked}
                    className="sr-only"
                    onChange={() => setField(
                      'rentalDurations',
                      checked
                        ? form.rentalDurations.filter((item) => item !== duration)
                        : [...form.rentalDurations, duration],
                    )}
                    type="checkbox"
                  />
                  {duration}
                </label>
              )
            })}
          </div>
        </fieldset>
        <div className="md:col-span-2">
          <TextArea
            id="owner-description"
            label="Deskripsi kos dan kamar"
            value={form.description}
            onChange={(value) => setField('description', value)}
            placeholder="Ceritakan kondisi kamar, suasana lingkungan, akses, siapa yang cocok tinggal di sini, dan keunggulan utamanya."
            rows={6}
          />
          <p className={`mt-2 text-right text-xs font-bold ${form.description.length >= 60 ? 'text-green-600' : 'text-neutral-400'}`}>
            {form.description.length}/60 karakter minimum
          </p>
        </div>
      </div>
    </StepSection>
  )
}

function GalleryStep({
  media,
  onChange,
}: {
  media: KosMedia[]
  onChange: (media: KosMedia[]) => void
}) {
  const [draft, setDraft] = useState<Omit<KosMedia, 'id'>>({
    category: 'bedroom',
    label: '',
    type: 'image',
    url: '',
    alt: '',
  })
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  async function chooseFile(file: File | undefined) {
    if (!file) return
    try {
      setIsUploading(true)
      setMessage('')
      const uploaded = await uploadOwnerMedia(file)
      setDraft((current) => ({
        ...current,
        url: uploaded.url,
        type: uploaded.mediaType,
        category: uploaded.mediaType === 'video' ? 'video-tour' : current.category,
        label: current.label || uploaded.originalName.replace(/\.[^.]+$/, ''),
        alt: current.alt || `${uploaded.mediaType === 'video' ? 'Video' : 'Foto'} ${uploaded.originalName.replace(/\.[^.]+$/, '')}`,
      }))
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Foto gagal diunggah.')
    } finally {
      setIsUploading(false)
    }
  }

  function addMedia() {
    if (!draft.url.trim() || !draft.label.trim() || !draft.alt.trim()) {
      setMessage('Isi URL, label, dan deskripsi media sebelum menambahkannya.')
      return
    }
    if (!media.length && draft.type === 'video') {
      setMessage('Tambahkan sebuah foto terlebih dahulu karena cover listing tidak boleh berupa video.')
      return
    }
    onChange([
      ...media,
      {
        ...draft,
        id: `media-${Date.now()}-${media.length + 1}`,
        url: draft.url.trim(),
        label: draft.label.trim(),
        alt: draft.alt.trim(),
      },
    ])
    setDraft({ category: 'bedroom', label: '', type: 'image', url: '', alt: '' })
    setMessage('')
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= media.length) return
    const next = [...media]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    if (next[0]?.type === 'video') {
      setMessage('Cover harus berupa foto. Video tour tidak dapat dipindahkan ke urutan pertama.')
      return
    }
    onChange(next)
  }

  const categorySet = new Set(
    media.filter((item) => item.type === 'image').map((item) => item.category),
  )
  const coverage = [
    { label: 'Kamar tidur', ready: categorySet.has('bedroom') },
    { label: 'Kamar mandi', ready: categorySet.has('bathroom') },
    { label: 'Bangunan / depan', ready: categorySet.has('building') || categorySet.has('exterior') },
  ]

  return (
    <StepSection
      eyebrow="Showcase visual"
      title="Susun galeri seperti calon penyewa melihatnya"
      description="Foto pertama menjadi cover. Gunakan kategori dan urutan yang membentuk tur singkat: kamar, kamar mandi, bangunan, lalu area bersama."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {coverage.map((item) => (
          <div className={`rounded-2xl border p-4 text-xs font-black ${item.ready ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`} key={item.label}>
            {item.ready ? '✓' : '○'} {item.label}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {media.map((item, index) => (
          <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white" key={item.id}>
            <div className="relative h-40 bg-neutral-100">
              {item.type === 'video' ? (
                <video className="h-full w-full object-cover" controls={false} muted poster={item.thumbnailUrl}>
                  <source src={item.url} type="video/mp4" />
                </video>
              ) : (
                <img className="h-full w-full object-cover" src={item.thumbnailUrl ?? item.url} alt={item.alt} />
              )}
              {index === 0 && <span className="absolute left-3 top-3 rounded-full bg-[#174f35] px-3 py-1 text-[10px] font-black text-white">Cover</span>}
              {item.type === 'video' && <span className="absolute left-3 top-3 rounded-full bg-violet-700 px-3 py-1 text-[10px] font-black text-white">▶ Video</span>}
              <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-black text-white">{categoryLabel(item.category)}</span>
            </div>
            <div className="p-4">
              <p className="truncate text-sm font-black">{item.label}</p>
              <p className="mt-1 line-clamp-2 min-h-8 text-xs font-semibold leading-4 text-neutral-400">{item.alt}</p>
              <div className="mt-4 grid grid-cols-4 gap-2">
                <GalleryButton disabled={index === 0 || (index === 1 && item.type === 'video')} label="Geser kiri" onClick={() => move(index, -1)}>←</GalleryButton>
                <GalleryButton disabled={index === media.length - 1} label="Geser kanan" onClick={() => move(index, 1)}>→</GalleryButton>
                <GalleryButton disabled={index === 0 || item.type === 'video'} label="Jadikan cover" onClick={() => onChange([item, ...media.filter((_, mediaIndex) => mediaIndex !== index)])}>★</GalleryButton>
                <GalleryButton label="Hapus" onClick={() => onChange(media.filter((_, mediaIndex) => mediaIndex !== index))}>×</GalleryButton>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!media.length && <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm font-bold text-neutral-400">Belum ada foto. Tambahkan foto pertama di bawah.</div>}

      <section className="mt-7 rounded-3xl bg-neutral-50 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-black text-neutral-800">Tambah foto atau video tour</h3>
            <p className="mt-1 text-xs font-semibold text-neutral-500">Foto: JPG/PNG/WebP maksimal 5 MB. Video tour: MP4 maksimal 50 MB. URL media juga dapat digunakan.</p>
          </div>
          <span className="text-xs font-black text-neutral-400">{media.length}/20 media</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block text-xs font-black text-neutral-600" htmlFor="media-type">
            Jenis media
            <select
              className={inputClass}
              id="media-type"
              onChange={(event) => {
                const type = event.target.value as KosMedia['type']
                setDraft((current) => ({
                  ...current,
                  type,
                  category: type === 'video' ? 'video-tour' : current.category === 'video-tour' ? 'bedroom' : current.category,
                }))
              }}
              value={draft.type}
            >
              <option value="image">Foto</option>
              <option value="video">Video tour</option>
            </select>
          </label>
          <label className="block text-xs font-black text-neutral-600" htmlFor="media-category">
            Bagian galeri
            <select className={inputClass} disabled={draft.type === 'video'} id="media-category" onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} value={draft.category}>
              {mediaCategories.filter((category) => draft.type === 'video' ? category.value === 'video-tour' : category.value !== 'video-tour').map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
          </label>
          <TextField id="media-label" label="Label foto" value={draft.label} onChange={(value) => setDraft((current) => ({ ...current, label: value }))} placeholder="Contoh: Kamar A dengan jendela besar" />
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-neutral-600" htmlFor="media-file">
              Unggah dari perangkat
              <input
                accept="image/jpeg,image/png,image/webp,video/mp4"
                className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-3 file:py-2 file:text-xs file:font-black file:text-green-700`}
                disabled={isUploading}
                id="media-file"
                onChange={(event) => void chooseFile(event.target.files?.[0])}
                type="file"
              />
            </label>
            {isUploading && <p className="mt-2 text-xs font-bold text-green-700">Mengunggah foto...</p>}
          </div>
          <div className="md:col-span-2">
            <TextField id="media-url" label={`URL ${draft.type === 'video' ? 'video MP4' : 'gambar'}`} value={draft.url} onChange={(value) => setDraft((current) => ({ ...current, url: value }))} placeholder="https://..." type="url" />
          </div>
          <div className="md:col-span-2">
            <TextField id="media-alt" label="Deskripsi media" value={draft.alt} onChange={(value) => setDraft((current) => ({ ...current, alt: value }))} placeholder="Jelaskan isi foto atau video untuk aksesibilitas dan moderasi" />
          </div>
          {draft.type === 'video' && (
            <div className="md:col-span-2">
              <TextField id="media-thumbnail" label="URL thumbnail video (opsional)" value={draft.thumbnailUrl ?? ''} onChange={(value) => setDraft((current) => ({ ...current, thumbnailUrl: value }))} placeholder="https://.../thumbnail.jpg" type="url" />
            </div>
          )}
        </div>
        {message && <p className="mt-4 text-xs font-bold text-red-600">{message}</p>}
        <button className="mt-5 rounded-xl bg-[#174f35] px-5 py-3 text-sm font-black text-white hover:bg-green-900 disabled:bg-neutral-300" disabled={media.length >= 20 || isUploading} onClick={addMedia} type="button">
          + Tambahkan ke galeri
        </button>
      </section>
    </StepSection>
  )
}

function FacilitiesStep({
  facilities,
  rules,
  form,
  setField,
}: {
  facilities: FacilityOption[]
  rules: RuleOption[]
  form: OwnerListingInput
  setField: <Key extends keyof OwnerListingInput>(key: Key, value: OwnerListingInput[Key]) => void
}) {
  const facilityGroups = facilities.reduce<Record<string, FacilityOption[]>>((groups, facility) => {
    groups[facility.categoryTitle] = [...(groups[facility.categoryTitle] ?? []), facility]
    return groups
  }, {})
  const facilityCategories = [...new Set([
    ...Object.keys(facilityGroups),
    'Fasilitas lainnya',
  ])]
  const [customFacilityName, setCustomFacilityName] = useState('')
  const [customFacilityCategory, setCustomFacilityCategory] = useState(facilityCategories[0])
  const [customRuleName, setCustomRuleName] = useState('')

  function toggle(list: number[], id: number) {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
  }

  function addCustomFacility() {
    const name = customFacilityName.trim()
    if (!name) return
    setField('customFacilities', [
      ...form.customFacilities,
      { name, category: customFacilityCategory },
    ])
    setCustomFacilityName('')
  }

  function addCustomRule() {
    const name = customRuleName.trim()
    if (!name) return
    setField('customRules', [...form.customRules, { name }])
    setCustomRuleName('')
  }

  return (
    <StepSection
      eyebrow="Fasilitas dan aturan"
      title="Tetapkan ekspektasi sebelum penyewa bertanya"
      description="Pilih pilihan umum atau buat fasilitas dan aturan sendiri. Item buatanmu dapat diedit dan dihapus sebelum listing disimpan."
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-black text-neutral-800">Fasilitas dari katalog</h4>
          <p className="mt-1 text-xs font-semibold text-neutral-500">Pilihan umum menjaga filter pencarian tetap konsisten.</p>
        </div>
        {Object.entries(facilityGroups).map(([category, items]) => (
          <fieldset className="rounded-2xl border border-neutral-100 p-5" key={category}>
            <legend className="px-2 text-sm font-black text-neutral-800">{category}</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((facility) => (
                <CheckCard
                  checked={form.facilityIds.includes(facility.id)}
                  key={facility.id}
                  label={facility.name}
                  onChange={() => setField('facilityIds', toggle(form.facilityIds, facility.id))}
                />
              ))}
            </div>
          </fieldset>
        ))}
        {!facilities.length && <Tip>Katalog fasilitas umum belum tersedia. Tambahkan fasilitas sendiri di bawah.</Tip>}

        <section className="rounded-3xl bg-green-50/70 p-5 sm:p-6">
          <h4 className="text-sm font-black text-neutral-800">Fasilitas tambahan milik kos ini</h4>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">Contoh: rooftop, dispenser bersama, ruang belajar, atau akses fingerprint.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
            <label className="block text-xs font-black text-neutral-600" htmlFor="custom-facility-category">
              Kategori
              <select className={inputClass} id="custom-facility-category" onChange={(event) => setCustomFacilityCategory(event.target.value)} value={customFacilityCategory}>
                {facilityCategories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <TextField id="custom-facility-name" label="Nama fasilitas" value={customFacilityName} onChange={setCustomFacilityName} placeholder="Contoh: Rooftop untuk menjemur" />
            <button className="rounded-xl bg-[#174f35] px-5 py-3 text-sm font-black text-white hover:bg-green-900" onClick={addCustomFacility} type="button">+ Tambah</button>
          </div>
          <div className="mt-5 space-y-3">
            {form.customFacilities.map((custom, index) => (
              <div className="grid gap-3 rounded-2xl border border-green-100 bg-white p-4 sm:grid-cols-[180px_1fr_auto] sm:items-center" key={`custom-facility-${index}`}>
                <select
                  aria-label={`Kategori fasilitas tambahan ${index + 1}`}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold outline-none focus:border-green-500"
                  onChange={(event) => setField('customFacilities', form.customFacilities.map((item, itemIndex) => itemIndex === index ? { ...item, category: event.target.value } : item))}
                  value={custom.category}
                >
                  {facilityCategories.map((category) => <option key={category}>{category}</option>)}
                </select>
                <input
                  aria-label={`Nama fasilitas tambahan ${index + 1}`}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-bold outline-none focus:border-green-500"
                  onChange={(event) => setField('customFacilities', form.customFacilities.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))}
                  value={custom.name}
                />
                <button className="rounded-xl px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50" onClick={() => setField('customFacilities', form.customFacilities.filter((_, itemIndex) => itemIndex !== index))} type="button">Hapus</button>
              </div>
            ))}
            {!form.customFacilities.length && <p className="text-xs font-semibold text-neutral-400">Belum ada fasilitas tambahan.</p>}
          </div>
        </section>

        <fieldset className="rounded-2xl border border-neutral-100 p-5">
          <legend className="px-2 text-sm font-black text-neutral-800">Aturan umum</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {rules.map((rule) => (
              <CheckCard
                checked={form.ruleIds.includes(rule.id)}
                key={rule.id}
                label={rule.name}
                onChange={() => setField('ruleIds', toggle(form.ruleIds, rule.id))}
              />
            ))}
          </div>
        </fieldset>

        <section className="rounded-3xl bg-amber-50/70 p-5 sm:p-6">
          <h4 className="text-sm font-black text-neutral-800">Aturan tambahan milik kos ini</h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <TextField id="custom-rule-name" label="Isi aturan" value={customRuleName} onChange={setCustomRuleName} placeholder="Contoh: Tamu menginap wajib melapor kepada penjaga" />
            <button className="rounded-xl bg-[#174f35] px-5 py-3 text-sm font-black text-white hover:bg-green-900" onClick={addCustomRule} type="button">+ Tambah</button>
          </div>
          <div className="mt-5 space-y-3">
            {form.customRules.map((custom, index) => (
              <div className="flex gap-3 rounded-2xl border border-amber-100 bg-white p-4" key={`custom-rule-${index}`}>
                <input
                  aria-label={`Aturan tambahan ${index + 1}`}
                  className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-bold outline-none focus:border-green-500"
                  onChange={(event) => setField('customRules', form.customRules.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))}
                  value={custom.name}
                />
                <button className="rounded-xl px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50" onClick={() => setField('customRules', form.customRules.filter((_, itemIndex) => itemIndex !== index))} type="button">Hapus</button>
              </div>
            ))}
            {!form.customRules.length && <p className="text-xs font-semibold text-neutral-400">Belum ada aturan tambahan.</p>}
          </div>
        </section>
      </div>
    </StepSection>
  )
}

function ReviewStep({
  completion,
  form,
  onEditStep,
  onPreview,
}: {
  completion: ReturnType<typeof getLocalCompletion>
  form: OwnerListingInput
  onEditStep: (step: number) => void
  onPreview: () => void
}) {
  const sections = [
    { title: 'Lokasi', detail: form.address || 'Belum diisi', step: 0 },
    { title: 'Kamar', detail: `${form.roomTypeName || 'Belum diisi'} · ${form.availableRooms}/${form.totalRooms} tersedia`, step: 1 },
    { title: 'Showcase', detail: `${form.media.length} media · foto pertama menjadi cover`, step: 2 },
    { title: 'Kelengkapan', detail: `${form.facilityIds.length + form.customFacilities.length} fasilitas · ${form.ruleIds.length + form.customRules.length} aturan`, step: 3 },
  ]

  return (
    <StepSection
      eyebrow="Pemeriksaan akhir"
      title="Lihat listing sebagai satu cerita utuh"
      description="Simpan perubahan dahulu. Setelah kembali ke daftar properti, tombol kirim tinjauan akan aktif ketika kelengkapan mencapai 100%."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-3">
          {sections.map((section) => (
            <button className="flex w-full items-center justify-between gap-4 rounded-2xl border border-neutral-100 p-4 text-left hover:border-green-200 hover:bg-green-50/30" key={section.title} onClick={() => onEditStep(section.step)} type="button">
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.1em] text-green-600">{section.title}</span>
                <span className="mt-1 block text-sm font-bold text-neutral-600">{section.detail}</span>
              </span>
              <span className="text-xs font-black text-neutral-400">Edit →</span>
            </button>
          ))}
        </div>
        <aside className={`rounded-3xl p-6 ${completion.percent === 100 ? 'bg-green-50' : 'bg-amber-50'}`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-neutral-800">Kesiapan tayang</h3>
            <span className={`text-2xl font-black ${completion.percent === 100 ? 'text-green-700' : 'text-amber-700'}`}>{completion.percent}%</span>
          </div>
          {completion.missing.length ? (
            <>
              <p className="mt-3 text-xs font-semibold leading-5 text-neutral-600">Lengkapi bagian berikut sebelum diajukan:</p>
              <ul className="mt-3 space-y-2">
                {completion.missing.map((item) => <li className="text-xs font-bold text-amber-800" key={item}>○ {item}</li>)}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-sm font-bold leading-6 text-green-800">Semua informasi penting sudah lengkap dan siap disimpan untuk diajukan.</p>
          )}
          <button className="mt-6 w-full rounded-xl border border-green-700 px-4 py-3 text-sm font-black text-green-800 hover:bg-white/60" onClick={onPreview} type="button">
            Pratinjau sebagai pencari kos
          </button>
        </aside>
      </div>
    </StepSection>
  )
}

function ListingPreview({ form, onClose }: { form: OwnerListingInput; onClose: () => void }) {
  const [activeMedia, setActiveMedia] = useState(0)
  const media = form.media
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#10291f]/80 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-label="Pratinjau listing">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 p-4 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-green-600">Pratinjau draft</p>
            <p className="mt-1 text-xs font-semibold text-neutral-400">Belum terlihat oleh pencari kos</p>
          </div>
          <button className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-black text-neutral-600 hover:bg-neutral-200" onClick={onClose} type="button">Tutup ×</button>
        </div>
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-neutral-100">
            {media.length ? (
              <>
                {media[activeMedia]?.type === 'video' ? (
                  <video className="h-[360px] w-full bg-black object-contain sm:h-[520px]" controls poster={media[activeMedia]?.thumbnailUrl}>
                    <source src={media[activeMedia]?.url} type="video/mp4" />
                  </video>
                ) : (
                  <img className="h-[360px] w-full object-cover sm:h-[520px]" src={media[activeMedia]?.url} alt={media[activeMedia]?.alt} />
                )}
                <div className="flex gap-2 overflow-x-auto p-3">
                  {media.map((item, index) => (
                    <button className={`shrink-0 overflow-hidden rounded-xl border-2 ${activeMedia === index ? 'border-green-600' : 'border-transparent'}`} key={item.id} onClick={() => setActiveMedia(index)} type="button">
                      {item.type === 'video'
                        ? <span className="grid size-16 place-items-center bg-violet-100 text-xl text-violet-700">▶</span>
                        : <img className="size-16 object-cover" src={item.thumbnailUrl ?? item.url} alt="" />}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid h-[420px] place-items-center text-center text-sm font-bold text-neutral-400">Foto showcase akan muncul di sini.</div>
            )}
          </div>
          <div className="p-6 sm:p-9">
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">Kos {form.tag}</span>
            <h2 className="mt-5 text-3xl font-black tracking-[-0.05em] text-[#173e2d]">{form.title || 'Nama kos'}</h2>
            <p className="mt-3 text-sm font-bold text-neutral-500">{form.address || 'Alamat kos belum diisi'}</p>
            <p className="mt-6 text-2xl font-black text-green-700">{formatRupiah(form.monthlyPrice)} <span className="text-sm text-neutral-400">/ bulan</span></p>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              <PreviewStat label="Tipe kamar" value={form.roomTypeName || '—'} />
              <PreviewStat label="Ukuran" value={form.roomSize || '—'} />
              <PreviewStat label="Tersedia" value={`${form.availableRooms} dari ${form.totalRooms}`} />
              <PreviewStat label="Durasi" value={form.rentalDurations.join(', ') || '—'} />
            </dl>
            <h3 className="mt-8 font-black">Tentang kos ini</h3>
            <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-7 text-neutral-600">{form.description || 'Deskripsi kos belum diisi.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function getLocalCompletion(form: OwnerListingInput) {
  const categories = new Set(
    form.media.filter((item) => item.type === 'image').map((item) => item.category),
  )
  const checks = [
    ['Identitas dan kota', Boolean(form.title.trim() && form.city.trim())],
    ['Alamat lengkap', Boolean(form.address.trim())],
    ['Titik peta', form.latitude !== null && form.longitude !== null],
    ['Tipe dan ukuran kamar', Boolean(form.roomTypeName.trim() && form.roomSize.trim())],
    ['Harga dan jumlah kamar', form.monthlyPrice > 0 && form.totalRooms > 0 && form.availableRooms <= form.totalRooms],
    ['Deskripsi minimal 60 karakter', form.description.trim().length >= 60],
    ['Minimal 3 foto', form.media.filter((item) => item.type === 'image').length >= 3],
    ['Foto kamar, kamar mandi, dan bangunan', categories.has('bedroom') && categories.has('bathroom') && (categories.has('building') || categories.has('exterior'))],
    ['Minimal 3 fasilitas', form.facilityIds.length + form.customFacilities.length >= 3],
    ['Aturan kos', form.ruleIds.length + form.customRules.length > 0],
    ['Pilihan durasi sewa', form.rentalDurations.length > 0],
  ] as const
  const completed = checks.filter(([, ready]) => ready).length
  return {
    percent: Math.round(completed / checks.length * 100),
    missing: checks.filter(([, ready]) => !ready).map(([label]) => label),
  }
}

function StepSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-green-600">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-neutral-900">{title}</h3>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-neutral-500">{description}</p>
      <div className="mt-7">{children}</div>
    </section>
  )
}

function TextField({ id, label, value, onChange, placeholder, type = 'text' }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <label className="block text-xs font-black text-neutral-600" htmlFor={id}>{label}<input className={inputClass} id={id} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} /></label>
}

function NumberField({ id, label, value, onChange, min, max, step }: { id: string; label: string; value: number | ''; onChange: (value: number | null) => void; min?: number; max?: number; step?: string }) {
  return <label className="block text-xs font-black text-neutral-600" htmlFor={id}>{label}<input className={inputClass} id={id} max={max} min={min} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} step={step} type="number" value={value} /></label>
}

function TextArea({ id, label, value, onChange, placeholder, rows = 3 }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string; rows?: number }) {
  return <label className="block text-xs font-black text-neutral-600" htmlFor={id}>{label}<textarea className={`${inputClass} resize-y`} id={id} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} value={value} /></label>
}

function Tip({ children }: { children: ReactNode }) {
  return <p className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-semibold leading-5 text-blue-800"><span className="font-black">Catatan: </span>{children}</p>
}

function GalleryButton({ children, disabled = false, label, onClick }: { children: ReactNode; disabled?: boolean; label: string; onClick: () => void }) {
  return <button aria-label={label} className="grid h-9 place-items-center rounded-lg bg-neutral-100 text-sm font-black text-neutral-600 hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-25" disabled={disabled} onClick={onClick} title={label} type="button">{children}</button>
}

function CheckCard({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs font-bold transition ${checked ? 'border-green-300 bg-green-50 text-green-800' : 'border-neutral-100 text-neutral-600 hover:border-green-200'}`}>
      <input checked={checked} className="size-4 accent-green-600" onChange={onChange} type="checkbox" />
      {label}
    </label>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-neutral-50 p-3"><dt className="text-[10px] font-black uppercase tracking-[0.1em] text-neutral-400">{label}</dt><dd className="mt-1 text-xs font-black text-neutral-700">{value}</dd></div>
}

function categoryLabel(value: string) {
  return mediaCategories.find((category) => category.value === value)?.label ?? 'Lainnya'
}
