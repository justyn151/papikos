import { query } from '../db.js'
import { forbidden, validationError } from '../errors.js'
import { createPaymentQuote } from './paymentService.js'

function requireRenter(user) {
  if (user.role !== 'pencari-kos') {
    throw forbidden('Fitur ini hanya tersedia untuk pencari kos.')
  }
}

export async function createSurveyRequest(user, kosId, body) {
  requireRenter(user)
  const scheduledFor = new Date(body.scheduledFor)
  const notes = String(body.notes ?? '').trim().slice(0, 1000)

  if (!Number.isFinite(scheduledFor.getTime()) || scheduledFor <= new Date()) {
    throw validationError('Pilih waktu survey yang akan datang.', {
      scheduledFor: 'Waktu survey harus berada di masa depan.',
    })
  }

  const result = await query(
    `insert into survey_requests (renter_id, kos_id, scheduled_for, notes)
     values ($1, $2, $3, $4)
     returning id, kos_id, scheduled_for, notes, status, created_at`,
    [user.id, kosId, scheduledFor.toISOString(), notes],
  )
  return result.rows[0]
}

export async function createContactRequest(user, kosId, body) {
  requireRenter(user)
  const message = String(body.message ?? '').trim().slice(0, 2000)
  const result = await query(
    `insert into contact_requests (renter_id, kos_id, message)
     values ($1, $2, $3)
     returning id, kos_id, message, status, created_at`,
    [user.id, kosId, message],
  )
  return result.rows[0]
}

export async function createRentalApplication(user, kosId, body) {
  requireRenter(user)
  const quote = await createPaymentQuote(kosId, body)
  const result = await query(
    `insert into rental_applications (
       renter_id, kos_id, rental_months, payment_method, quoted_total, quote_snapshot
     ) values ($1, $2, $3, $4, $5, $6::jsonb)
     returning id, kos_id, rental_months, payment_method, quoted_total, status, created_at`,
    [user.id, kosId, quote.rentalMonths, quote.paymentMethod, quote.total, JSON.stringify(quote)],
  )
  return { ...result.rows[0], quote }
}

export async function getMyActivity(user) {
  requireRenter(user)
  const [surveys, contacts, rentals] = await Promise.all([
    query(
      `select s.id, s.kos_id, k.title as kos_title, s.scheduled_for, s.notes, s.status, s.created_at
       from survey_requests s join kos_listings k on k.id = s.kos_id
       where s.renter_id = $1 order by s.created_at desc`,
      [user.id],
    ),
    query(
      `select c.id, c.kos_id, k.title as kos_title, c.message, c.status, c.created_at
       from contact_requests c join kos_listings k on k.id = c.kos_id
       where c.renter_id = $1 order by c.created_at desc`,
      [user.id],
    ),
    query(
      `select r.id, r.kos_id, k.title as kos_title, r.rental_months, r.payment_method,
              r.quoted_total, r.status, r.created_at
       from rental_applications r join kos_listings k on k.id = r.kos_id
       where r.renter_id = $1 order by r.created_at desc`,
      [user.id],
    ),
  ])
  return { surveys: surveys.rows, contacts: contacts.rows, rentals: rentals.rows }
}
