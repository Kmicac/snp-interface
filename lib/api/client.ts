import { API_BASE_URL } from './config'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

let inMemoryToken: string | null = null

export function setAuthToken(token: string | null) {
  inMemoryToken = token
}

function parseErrorMessage(errorBody: unknown): string | null {
  if (!errorBody || typeof errorBody !== 'object') return null

  const payload = errorBody as Record<string, unknown>
  const message = payload.message

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (Array.isArray(message)) {
    const normalized = message
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
    if (normalized.length > 0) {
      return normalized.join(' | ')
    }
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error
  }

  return null
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  private getToken(): string | null {
    if (inMemoryToken) return inMemoryToken
    if (typeof window === 'undefined') return null
    return localStorage.getItem('snp_token')
  }

  private getHeaders(body?: BodyInit | null, customHeaders?: HeadersInit): HeadersInit {
    const headers = new Headers(customHeaders ?? {})

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    if (body !== undefined && body !== null && !isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const token = this.getToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return headers
  }

  private toBody(data: unknown): BodyInit | undefined {
    if (data === undefined) {
      return undefined
    }
    if (data === null) {
      return 'null'
    }

    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return data
    }
    if (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams) {
      return data
    }
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return data
    }
    if (typeof data === 'string') {
      return data
    }
    if (data instanceof ArrayBuffer) {
      return data
    }

    return JSON.stringify(data)
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let message = `API Error: ${response.status} ${response.statusText}`
      try {
        const errorBody = await response.json()
        const parsedMessage = parseErrorMessage(errorBody)
        if (parsedMessage) {
          message = parsedMessage
        }
      } catch {
        // Keep default message when backend response is not JSON.
      }
      if (response.status === 401) {
        message = message || 'No autenticado'
      }
      if (response.status === 403) {
        message = message || 'No autorizado'
      }
      throw new ApiError(response.status, message)
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T
    }

    const raw = await response.text()
    if (!raw) {
      return undefined as T
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return JSON.parse(raw) as T
    }

    return raw as T
  }

  private async request(
    endpoint: string,
    init: RequestInit,
    customHeaders?: HeadersInit,
    signal?: AbortSignal,
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`
    try {
      return await fetch(url, {
        ...init,
        headers: this.getHeaders(init.body, customHeaders),
        signal,
      })
    } catch (error) {
      const isAbort =
        (typeof DOMException !== 'undefined' &&
          error instanceof DOMException &&
          error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError')

      if (isAbort) {
        throw error
      }

      const details = error instanceof Error && error.message ? ` ${error.message}` : ''
      throw new Error(`Could not reach API (${url}).${details}`)
    }
  }

  async get<T>(endpoint: string, options?: { headers?: HeadersInit; signal?: AbortSignal }): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'GET',
    }, options?.headers, options?.signal)

    return this.parseResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: unknown, options?: { headers?: HeadersInit; signal?: AbortSignal }): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: this.toBody(data),
    }, options?.headers, options?.signal)

    return this.parseResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: unknown, options?: { headers?: HeadersInit; signal?: AbortSignal }): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: this.toBody(data),
    }, options?.headers, options?.signal)

    return this.parseResponse<T>(response)
  }

  async patch<T>(endpoint: string, data?: unknown, options?: { headers?: HeadersInit; signal?: AbortSignal }): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: this.toBody(data),
    }, options?.headers, options?.signal)

    return this.parseResponse<T>(response)
  }

  async delete<T>(endpoint: string, options?: { headers?: HeadersInit; signal?: AbortSignal }): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    }, options?.headers, options?.signal)

    return this.parseResponse<T>(response)
  }

  async getBlob(endpoint: string, options?: { headers?: HeadersInit; signal?: AbortSignal }): Promise<Blob> {
    const response = await this.request(endpoint, {
      method: 'GET',
    }, options?.headers, options?.signal)

    if (!response.ok) {
      let message = `API Error: ${response.status} ${response.statusText}`
      try {
        const errorBody = await response.json()
        const parsedMessage = parseErrorMessage(errorBody)
        if (parsedMessage) {
          message = parsedMessage
        }
      } catch {
        // Keep default message when backend response is not JSON.
      }
      throw new ApiError(response.status, message)
    }

    return response.blob()
  }
}

export const apiClient = new ApiClient()
