import type { AuthResponse, LoginInput, SetupAdminInput, User } from '../types/api'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const API_URL = (configuredApiUrl || 'http://localhost:3000/api').replace(/\/$/, '')
export const TOKEN_STORAGE_KEY = 'kung_fu_access_token'
export const UNAUTHORIZED_EVENT = 'kung-fu:unauthorized'

export interface ApiErrorBody {
  error?: string
  details?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
  else localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function toQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

type ApiRequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  body?: unknown
  token?: string | null
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

async function request<T>(method: string, path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, token = getAccessToken(), headers, ...requestOptions } = options
  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', 'application/json')
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json')
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...requestOptions,
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? `No se pudo conectar con el servidor: ${error.message}` : 'No se pudo conectar con el servidor.',
      0,
    )
  }

  const payload = await parseResponse(response)
  if (!response.ok) {
    const errorBody = payload && typeof payload === 'object' ? payload as ApiErrorBody : undefined
    if (response.status === 401 && token) {
      setAccessToken(null)
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(
      errorBody?.error || response.statusText || 'La solicitud no pudo completarse.',
      response.status,
      errorBody?.details,
    )
  }
  return payload as T
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) => request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) => request<T>('PATCH', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) => request<T>('PUT', path, { ...options, body }),
  delete: <T>(path: string, options?: ApiRequestOptions) => request<T>('DELETE', path, options),
}

export const authApi = {
  login: (input: LoginInput) => api.post<AuthResponse>('/auth/login', input, { token: null }),
  setupAdmin: (input: SetupAdminInput) => api.post<AuthResponse>('/auth/setup-admin', input, { token: null }),
  me: () => api.get<{ usuario: User }>('/auth/me'),
}

export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.') {
  return error instanceof Error ? error.message : fallback
}

