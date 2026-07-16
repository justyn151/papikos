import { query } from '../db.js'
import { validationError } from '../errors.js'
import { hashPassword, verifyPassword } from '../utils/password.js'

const allowedRoles = new Set(['pencari-kos', 'pemilik-kos'])

function normalizePhoneNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits.startsWith('62')) return `0${digits.slice(2)}`
  return digits
}

function publicUser(row) {
  return {
    id: Number(row.id),
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    email: row.email,
    role: row.role,
  }
}

function validateRegistration(body) {
  const fields = {}
  const fullName = String(body.fullName ?? '').trim()
  const phoneNumber = normalizePhoneNumber(body.phoneNumber)
  const email = String(body.email ?? '').trim().toLocaleLowerCase('id-ID')
  const password = String(body.password ?? '')
  const role = String(body.role ?? '')

  if (!fullName) fields.fullName = 'Nama lengkap wajib diisi.'
  if (!phoneNumber) fields.phoneNumber = 'Nomor handphone wajib diisi.'
  if (phoneNumber && (!phoneNumber.startsWith('08') || phoneNumber.length < 10 || phoneNumber.length > 13)) {
    fields.phoneNumber = 'Nomor handphone Indonesia belum valid.'
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fields.email = 'Email belum valid.'
  }
  if (password.length < 8) fields.password = 'Password minimal 8 karakter.'
  if (!allowedRoles.has(role)) fields.role = 'Role tidak valid.'

  if (Object.keys(fields).length > 0) {
    throw validationError('Data pendaftaran belum valid.', fields)
  }

  return { fullName, phoneNumber, email, password, role }
}

function validateLogin(body) {
  const phoneNumber = normalizePhoneNumber(body.phoneNumber)
  const password = String(body.password ?? '')
  const role = body.role ? String(body.role) : null

  if (!phoneNumber || !password) {
    throw validationError('Nomor handphone dan password wajib diisi.')
  }
  if (role && !allowedRoles.has(role)) {
    throw validationError('Role tidak valid.', { role: 'Role tidak valid.' })
  }

  return { phoneNumber, password, role }
}

export async function registerUser(body) {
  const data = validateRegistration(body)
  const { hash, salt } = hashPassword(data.password)

  try {
    const result = await query(
      `
        insert into users (
          full_name,
          phone_number,
          email,
          password_hash,
          password_salt,
          role
        )
        values ($1, $2, $3, $4, $5, $6)
        returning id, full_name, phone_number, email, role
      `,
      [data.fullName, data.phoneNumber, data.email, hash, salt, data.role],
    )

    const user = publicUser(result.rows[0])
    if (user.role === 'pemilik-kos') {
      await query(
        `update kos_listings set owner_user_id = $1
         where owner_user_id is null and lower(owner_name) = lower($2)`,
        [user.id, user.fullName],
      )
    }
    return user
  } catch (error) {
    if (error.code === '23505') {
      throw validationError('Akun sudah terdaftar.', {
        account: 'Email atau nomor handphone sudah dipakai.',
      })
    }
    throw error
  }
}

export async function loginUser(body) {
  const data = validateLogin(body)
  const result = await query(
    `
      select id, full_name, phone_number, email, role, password_hash, password_salt
      from users
      where phone_number = $1
      limit 1
    `,
    [data.phoneNumber],
  )

  if (result.rowCount === 0) {
    throw validationError('Nomor handphone atau password salah.')
  }

  const user = result.rows[0]
  if (data.role && user.role !== data.role) {
    throw validationError('Akun ini tidak sesuai dengan role yang dipilih.')
  }
  if (!verifyPassword(data.password, user.password_salt, user.password_hash)) {
    throw validationError('Nomor handphone atau password salah.')
  }

  return publicUser(user)
}
