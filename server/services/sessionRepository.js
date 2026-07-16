import { createHash, randomBytes } from 'node:crypto'
import { config } from '../config.js'
import { query } from '../db.js'
import { HttpError } from '../errors.js'

const cookieName = 'papikos_session'

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=')
        if (separator === -1) return [part, '']
        return [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))]
      }),
  )
}

function serializeCookie(value, maxAge) {
  const secure = config.cookieSecure ? '; Secure' : ''
  return `${cookieName}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export async function createSession(userId, response) {
  const token = randomBytes(32).toString('base64url')
  const maxAge = config.sessionDays * 24 * 60 * 60

  await query(
    `insert into user_sessions (token_hash, user_id, expires_at)
     values ($1, $2, now() + ($3 * interval '1 day'))`,
    [hashToken(token), userId, config.sessionDays],
  )

  response.setHeader('Set-Cookie', serializeCookie(token, maxAge))
}

export async function deleteSession(request, response) {
  const token = parseCookies(request.headers.cookie)[cookieName]
  if (token) {
    await query('delete from user_sessions where token_hash = $1', [hashToken(token)])
  }
  response.setHeader('Set-Cookie', serializeCookie('', 0))
}

export async function getSessionUser(request) {
  const token = parseCookies(request.headers.cookie)[cookieName]
  if (!token) return null

  const result = await query(
    `
      select u.id, u.full_name, u.phone_number, u.email, u.role
      from user_sessions s
      join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()
      limit 1
    `,
    [hashToken(token)],
  )

  if (result.rowCount === 0) return null
  const user = result.rows[0]
  return {
    id: Number(user.id),
    fullName: user.full_name,
    phoneNumber: user.phone_number,
    email: user.email,
    role: user.role,
  }
}

export async function requireSessionUser(request) {
  const user = await getSessionUser(request)
  if (!user) throw new HttpError(401, 'Silakan masuk terlebih dahulu.', 'UNAUTHENTICATED')
  return user
}
