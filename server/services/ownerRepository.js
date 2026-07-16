import { query } from '../db.js'
import { forbidden, notFound, validationError } from '../errors.js'

const requestTypes = {
  surveys: { table: 'survey_requests', statuses: ['pending', 'confirmed', 'completed', 'cancelled'] },
  contacts: { table: 'contact_requests', statuses: ['open', 'answered', 'closed'] },
  rentals: { table: 'rental_applications', statuses: ['submitted', 'reviewing', 'accepted', 'rejected', 'cancelled'] },
}

function requireOwner(user) {
  if (user.role !== 'pemilik-kos') throw forbidden('Fitur ini hanya tersedia untuk pemilik kos.')
}

export async function getOwnerInbox(user) {
  requireOwner(user)
  await query(
    `update kos_listings set owner_user_id = $1
     where owner_user_id is null and lower(owner_name) = lower($2)`,
    [user.id, user.fullName],
  )
  const [listings, surveys, contacts, rentals] = await Promise.all([
    query('select id, title, available_rooms from kos_listings where owner_user_id = $1 order by id', [user.id]),
    query(`select s.id, s.kos_id, k.title as kos_title, u.full_name as renter_name,
                  s.scheduled_for, s.notes, s.status, s.created_at
           from survey_requests s join kos_listings k on k.id = s.kos_id
           join users u on u.id = s.renter_id
           where k.owner_user_id = $1 order by s.created_at desc`, [user.id]),
    query(`select c.id, c.kos_id, k.title as kos_title, u.full_name as renter_name,
                  u.phone_number, c.message, c.status, c.created_at
           from contact_requests c join kos_listings k on k.id = c.kos_id
           join users u on u.id = c.renter_id
           where k.owner_user_id = $1 order by c.created_at desc`, [user.id]),
    query(`select r.id, r.kos_id, k.title as kos_title, u.full_name as renter_name,
                  r.rental_months, r.payment_method, r.quoted_total, r.status, r.created_at
           from rental_applications r join kos_listings k on k.id = r.kos_id
           join users u on u.id = r.renter_id
           where k.owner_user_id = $1 order by r.created_at desc`, [user.id]),
  ])
  return { listings: listings.rows, surveys: surveys.rows, contacts: contacts.rows, rentals: rentals.rows }
}

export async function updateOwnerRequest(user, type, id, status) {
  requireOwner(user)
  const definition = requestTypes[type]
  if (!definition || !definition.statuses.includes(status)) throw validationError('Status permintaan tidak valid.')

  // Table names come only from the closed map above; values remain parameterized.
  const result = await query(
    `update ${definition.table} request set status = $1, updated_at = now()
     from kos_listings k
     where request.id = $2 and request.kos_id = k.id and k.owner_user_id = $3
     returning request.id, request.status`,
    [status, id, user.id],
  )
  if (result.rowCount === 0) throw notFound('Permintaan tidak ditemukan untuk akun pemilik ini.')
  return result.rows[0]
}
