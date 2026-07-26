const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

export const apiBaseUrl = configuredBaseUrl?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  if (!apiBaseUrl) {
    throw new ApiError('VITE_API_BASE_URL belum dikonfigurasi.', 0)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let message = `API mengembalikan status ${response.status}.`

    try {
      const errorBody = await response.json() as {
        message?: string
        fields?: Record<string, string>
      }
      message = errorBody.message ?? message
      const firstFieldError = errorBody.fields
        ? Object.values(errorBody.fields)[0]
        : undefined
      if (firstFieldError && firstFieldError !== message) {
        message = `${message} ${firstFieldError}`
      }
    } catch {
      // Keep the generic status message when the backend does not return JSON.
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
