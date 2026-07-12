import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'

const iterations = 120000
const keyLength = 64
const digest = 'sha512'

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex')
  return { hash, salt }
}

export function verifyPassword(password, salt, expectedHash) {
  const actualHash = pbkdf2Sync(password, salt, iterations, keyLength, digest)
  const expectedBuffer = Buffer.from(expectedHash, 'hex')

  if (actualHash.length !== expectedBuffer.length) return false
  return timingSafeEqual(actualHash, expectedBuffer)
}

