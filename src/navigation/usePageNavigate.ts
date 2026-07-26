import { useCallback } from 'react'
import {
  useNavigate,
  type NavigateOptions,
  type To,
} from 'react-router-dom'

type PageNavigate = {
  (to: To, options?: NavigateOptions): void
  (delta: number): void
}

export function usePageNavigate(): PageNavigate {
  const navigate = useNavigate()

  return useCallback((to: To | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      navigate(to)
      return
    }

    navigate(to, options)
  }, [navigate]) as PageNavigate
}
