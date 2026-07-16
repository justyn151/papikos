import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getCurrentUser, logoutUser, type AuthUser } from '../services/authService'
import { AuthContext, type AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true
    getCurrentUser()
      .then((response) => {
        if (isCurrent) setUser(response.user)
      })
      .catch(() => {
        if (isCurrent) setUser(null)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    setUser,
    logout: async () => {
      await logoutUser()
      setUser(null)
    },
  }), [isLoading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
