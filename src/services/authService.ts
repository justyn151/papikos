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

