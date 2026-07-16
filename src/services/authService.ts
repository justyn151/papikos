import { apiRequest } from './apiClient'

export type AuthRole = 'pencari-kos' | 'pemilik-kos'

export type AuthUser = {
  id: number
  fullName: string
  phoneNumber: string
  email: string
  role: AuthRole
}

type AuthResponse = {
  user: AuthUser
}

export function loginUser(payload: {
  phoneNumber: string
  password: string
  role: AuthRole
}) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function registerUser(payload: {
  fullName: string
  phoneNumber: string
  email: string
  password: string
  role: AuthRole
}) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getCurrentUser() {
  return apiRequest<{ user: AuthUser | null }>('/auth/me')
}

export function logoutUser() {
  return apiRequest<void>('/auth/logout', { method: 'POST' })
}

export function requestPasswordReset(identifier: string) {
  return apiRequest<{ message: string; resetPath?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  })
}

export function resetPassword(token: string, password: string) {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}
