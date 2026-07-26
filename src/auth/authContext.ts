import { createContext, useContext } from 'react'
import type { AuthUser } from '../services/authService'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  logout: (options?: {
    redirectTo?: string
  }) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
