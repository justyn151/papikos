import { createHash, randomBytes } from 'node:crypto'
import { config } from '../config.js'
import { pool, query } from '../db.js'
import { validationError } from '../errors.js'
import { hashPassword } from '../utils/password.js'

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex')
}

function normalizeIdentifier(value) {
  const input = String(value ?? '').trim().toLocaleLowerCase('id-ID')
  if (input.includes('@')) return input
  const digits = input.replace(/\D/g, '')
  return digits.startsWith('62') ? `0${digits.slice(2)}` : digits
}

export async function requestPasswordReset(body) {
  const identifier = normalizeIdentifier(body.identifier)
  if (!identifier) throw validationError('Masukkan email atau nomor handphone.')

  const result = await query(
    'select id from users where email = $1 or phone_number = $1 limit 1',
    [identifier],
  )
  if (result.rowCount === 0) return {}

  const token = randomBytes(32).toString('base64url')
  await query('delete from password_reset_tokens where user_id = $1 or expires_at <= now()', [result.rows[0].id])
  await query(
    `insert into password_reset_tokens (token_hash, user_id, expires_at)
     values ($1, $2, now() + interval '30 minutes')`,
    [tokenHash(token), result.rows[0].id],
  )

  const resetPath = `/reset-password?token=${encodeURIComponent(token)}`
  console.log(`Papikos password reset link: ${config.publicAppUrl}${resetPath}`)
  return config.exposeResetToken ? { resetPath } : {}
}

export async function resetPassword(body) {
  const token = String(body.token ?? '')
  const password = String(body.password ?? '')
  if (!token) throw validationError('Token reset tidak tersedia.')
  if (password.length < 8) {
    throw validationError('Password minimal 8 karakter.', { password: 'Password minimal 8 karakter.' })
  }

  const client = await pool.connect()
  try {
    await client.query('begin')
    const tokenResult = await client.query(
      `select user_id from password_reset_tokens
       where token_hash = $1 and used_at is null and expires_at > now()
       for update`,
      [tokenHash(token)],
    )
    if (tokenResult.rowCount === 0) {
      throw validationError('Tautan reset sudah tidak berlaku. Minta tautan baru.')
    }

    const { hash, salt } = hashPassword(password)
    const userId = tokenResult.rows[0].user_id
    await client.query(
      'update users set password_hash = $1, password_salt = $2, updated_at = now() where id = $3',
      [hash, salt, userId],
    )
    await client.query('update password_reset_tokens set used_at = now() where token_hash = $1', [tokenHash(token)])
    await client.query('delete from user_sessions where user_id = $1', [userId])
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}
