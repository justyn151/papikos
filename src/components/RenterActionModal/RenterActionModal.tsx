import { useEffect, useState, type FormEvent } from 'react'
import type { AuthUser } from '../../services/authService'
import {
  requestOwnerContact,
  requestSurvey,
  submitRentalApplication,
} from '../../services/renterActionService'
import { Icon } from '../Icon/Icon'

export type RenterAction = 'survey' | 'contact' | 'rental'

type RenterActionModalProps = {
  action: RenterAction
  kosId: number
  kosTitle: string
  user: AuthUser
  rentalMonths: number
  paymentMethod: 'full' | 'dp'
  onClose: () => void
  onSubmitted: (message: string) => void
}

const actionCopy = {
  survey: {
    title: 'Ajukan jadwal survei',
    description: 'Pemilik perlu tahu siapa yang datang dan kapan kunjungan dilakukan.',
    submit: 'Ajukan survei',
  },
  contact: {
    title: 'Tanya pemilik kos',
    description: 'Sampaikan kebutuhanmu agar pemilik dapat memberi jawaban yang tepat.',
    submit: 'Kirim pertanyaan',
  },
  rental: {
    title: 'Konfirmasi pengajuan sewa',
    description: 'Periksa identitas, tanggal masuk, dan pilihan sewa sebelum dikirim.',
    submit: 'Kirim pengajuan sewa',
  },
} satisfies Record<RenterAction, { title: string; description: string; submit: string }>

function toLocalInputValue(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function tomorrowDate() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return toLocalInputValue(tomorrow).slice(0, 10)
}

const defaultMinimumSurveyTime = toLocalInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000))
const defaultMinimumMoveInDate = tomorrowDate()

export function RenterActionModal({
  action,
  kosId,
  kosTitle,
  user,
  rentalMonths,
  paymentMethod,
  onClose,
  onSubmitted,
}: RenterActionModalProps) {
  const copy = actionCopy[action]
  const minimumSurveyTime = defaultMinimumSurveyTime
  const minimumMoveInDate = defaultMinimumMoveInDate
  const [scheduledFor, setScheduledFor] = useState('')
  const [visitorType, setVisitorType] = useState<'self' | 'representative'>('self')
  const [representativeName, setRepresentativeName] = useState('')
  const [representativePhone, setRepresentativePhone] = useState('')
  const [relationship, setRelationship] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [preferredContactMethod, setPreferredContactMethod] = useState<'chat' | 'whatsapp' | 'phone'>('chat')
  const [moveInDate, setMoveInDate] = useState(defaultMinimumMoveInDate)
  const [detailsConfirmed, setDetailsConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSubmitting, onClose])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (action === 'survey') {
      if (!scheduledFor) {
        setError('Pilih tanggal dan jam survei terlebih dahulu.')
        return
      }
      if (visitorType === 'representative' && (!representativeName.trim() || !representativePhone.trim() || !relationship.trim())) {
        setError('Lengkapi nama, nomor handphone, dan hubungan orang yang mewakili survei.')
        return
      }
    }
    if (action === 'contact' && message.trim().length < 10) {
      setError('Tulis pertanyaan minimal 10 karakter agar pemilik memahami kebutuhanmu.')
      return
    }
    if (action === 'rental' && (!moveInDate || !detailsConfirmed)) {
      setError('Pilih tanggal masuk dan konfirmasi bahwa data pengajuan sudah benar.')
      return
    }

    setIsSubmitting(true)
    try {
      if (action === 'survey') {
        await requestSurvey(kosId, {
          scheduledFor: new Date(scheduledFor).toISOString(),
          visitorType,
          representativeName,
          representativePhone,
          relationship,
          notes,
        })
        onSubmitted('Permintaan survei lengkap tersimpan dan menunggu konfirmasi pemilik.')
      } else if (action === 'contact') {
        await requestOwnerContact(kosId, { message, preferredContactMethod })
        onSubmitted('Pertanyaan terkirim. Balasan pemilik dapat dipantau di Aktivitas Saya.')
      } else {
        await submitRentalApplication(kosId, {
          rentalMonths,
          paymentMethod,
          moveInDate,
          notes,
        })
        onSubmitted('Pengajuan sewa lengkap tersimpan dan menunggu peninjauan pemilik.')
      }
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Permintaan gagal dikirim.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1500] grid place-items-center overflow-y-auto bg-black/55 p-4"
      onMouseDown={() => !isSubmitting && onClose()}
      role="presentation"
    >
      <section
        aria-labelledby="renter-action-title"
        aria-modal="true"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-5 border-b border-neutral-200 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.04em] text-neutral-900" id="renter-action-title">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-neutral-500">{copy.description}</p>
          </div>
          <button
            aria-label="Tutup"
            className="grid size-10 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <Icon className="size-5" name="close" />
          </button>
        </header>

        <form className="max-h-[75vh] overflow-y-auto px-6 py-6 sm:px-8" onSubmit={(event) => void submit(event)}>
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">Kos yang dipilih</p>
            <p className="mt-2 font-black text-neutral-800">{kosTitle}</p>
          </div>

          <fieldset className="mt-5 rounded-2xl border border-neutral-200 p-4">
            <legend className="px-2 text-sm font-black text-neutral-700">Identitas pemohon</legend>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold text-neutral-400">Nama</dt><dd className="mt-1 font-black text-neutral-700">{user.fullName}</dd></div>
              <div><dt className="font-semibold text-neutral-400">Nomor handphone</dt><dd className="mt-1 font-black text-neutral-700">{user.phoneNumber}</dd></div>
              <div className="sm:col-span-2"><dt className="font-semibold text-neutral-400">Email</dt><dd className="mt-1 break-all font-black text-neutral-700">{user.email}</dd></div>
            </dl>
            <p className="mt-3 text-xs font-semibold leading-5 text-neutral-400">Data ini berasal dari akunmu dan akan ditampilkan kepada pemilik untuk menindaklanjuti permintaan.</p>
          </fieldset>

          {action === 'survey' && (
            <div className="mt-5 space-y-5">
              <label className="block text-sm font-black text-neutral-700">
                Tanggal dan jam survei
                <input
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 font-semibold outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  min={minimumSurveyTime}
                  onChange={(event) => setScheduledFor(event.target.value)}
                  required
                  type="datetime-local"
                  value={scheduledFor}
                />
                <span className="mt-2 block text-xs font-semibold text-neutral-400">Ajukan minimal dua jam dari sekarang agar pemilik sempat mengonfirmasi.</span>
              </label>

              <fieldset>
                <legend className="text-sm font-black text-neutral-700">Siapa yang akan datang?</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {([
                    ['self', 'Saya sendiri'],
                    ['representative', 'Diwakili orang lain'],
                  ] as const).map(([value, label]) => (
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 p-4 font-bold text-neutral-600" key={value}>
                      <input checked={visitorType === value} name="visitor-type" onChange={() => setVisitorType(value)} type="radio" />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {visitorType === 'representative' && (
                <div className="grid gap-4 rounded-2xl bg-yellow-50 p-4 sm:grid-cols-2">
                  <label className="text-sm font-black text-neutral-700">Nama pengunjung<input className="mt-2 w-full rounded-xl border border-yellow-200 bg-white px-4 py-3 font-semibold outline-none focus:border-green-500" onChange={(event) => setRepresentativeName(event.target.value)} required value={representativeName} /></label>
                  <label className="text-sm font-black text-neutral-700">Nomor handphone<input className="mt-2 w-full rounded-xl border border-yellow-200 bg-white px-4 py-3 font-semibold outline-none focus:border-green-500" inputMode="tel" onChange={(event) => setRepresentativePhone(event.target.value)} required value={representativePhone} /></label>
                  <label className="text-sm font-black text-neutral-700 sm:col-span-2">Hubungan dengan pemohon<input className="mt-2 w-full rounded-xl border border-yellow-200 bg-white px-4 py-3 font-semibold outline-none focus:border-green-500" onChange={(event) => setRelationship(event.target.value)} placeholder="Contoh: orang tua, saudara, teman" required value={relationship} /></label>
                </div>
              )}

              <label className="block text-sm font-black text-neutral-700">Catatan untuk pemilik<textarea className="mt-2 min-h-28 w-full resize-y rounded-xl border border-neutral-300 px-4 py-3 font-semibold outline-none focus:border-green-500" maxLength={1000} onChange={(event) => setNotes(event.target.value)} placeholder="Contoh: ingin melihat kamar yang masih tersedia dan area parkir." value={notes} /></label>
            </div>
          )}

          {action === 'contact' && (
            <div className="mt-5 space-y-5">
              <label className="block text-sm font-black text-neutral-700">Yang ingin ditanyakan<textarea className="mt-2 min-h-32 w-full resize-y rounded-xl border border-neutral-300 px-4 py-3 font-semibold outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100" maxLength={2000} onChange={(event) => setMessage(event.target.value)} placeholder="Contoh: Apakah kamar lantai dua masih tersedia dan apakah biaya listrik sudah termasuk?" required value={message} /></label>
              <label className="block text-sm font-black text-neutral-700">Preferensi balasan<select className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 font-semibold outline-none focus:border-green-500" onChange={(event) => setPreferredContactMethod(event.target.value as typeof preferredContactMethod)} value={preferredContactMethod}><option value="chat">Chat Papikos</option><option value="whatsapp">WhatsApp</option><option value="phone">Telepon</option></select></label>
              <p className="rounded-xl bg-green-50 p-4 text-sm font-semibold leading-6 text-green-800">Untuk keamanan, permintaan dan identitas tercatat di Papikos. Jangan membagikan password atau kode verifikasi kepada siapa pun.</p>
            </div>
          )}

          {action === 'rental' && (
            <div className="mt-5 space-y-5">
              <div className="grid gap-4 rounded-2xl bg-green-50 p-4 sm:grid-cols-2">
                <div><p className="text-xs font-black uppercase tracking-wide text-green-700">Durasi</p><p className="mt-1 font-black text-neutral-800">{rentalMonths} bulan</p></div>
                <div><p className="text-xs font-black uppercase tracking-wide text-green-700">Pembayaran</p><p className="mt-1 font-black text-neutral-800">{paymentMethod === 'dp' ? 'Uang muka (DP)' : 'Bayar penuh'}</p></div>
              </div>
              <label className="block text-sm font-black text-neutral-700">Rencana tanggal masuk<input className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 font-semibold outline-none focus:border-green-500" min={minimumMoveInDate} onChange={(event) => setMoveInDate(event.target.value)} required type="date" value={moveInDate} /></label>
              <label className="block text-sm font-black text-neutral-700">Catatan pengajuan<textarea className="mt-2 min-h-28 w-full resize-y rounded-xl border border-neutral-300 px-4 py-3 font-semibold outline-none focus:border-green-500" maxLength={1000} onChange={(event) => setNotes(event.target.value)} placeholder="Contoh: akan tinggal sendiri dan membawa satu sepeda motor." value={notes} /></label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4 text-sm font-semibold leading-6 text-neutral-600"><input className="mt-1 size-5 shrink-0 accent-green-600" checked={detailsConfirmed} onChange={(event) => setDetailsConfirmed(event.target.checked)} type="checkbox" />Saya memastikan identitas, tanggal masuk, durasi, dan metode pembayaran di atas sudah benar.</label>
            </div>
          )}

          {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600" role="alert">{error}</p>}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:justify-end">
            <button className="rounded-full px-6 py-3 text-sm font-black text-neutral-600 hover:bg-neutral-100" disabled={isSubmitting} onClick={onClose} type="button">Batal</button>
            <button className="rounded-full bg-green-600 px-6 py-3 text-sm font-black text-white hover:bg-green-700 disabled:cursor-wait disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? 'Mengirim...' : copy.submit}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
