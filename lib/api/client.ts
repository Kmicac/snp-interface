import { API_BASE_URL } from './config'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  private getToken(): string | null {
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
        if (errorBody?.message && typeof errorBody.message === 'string') {
          message = errorBody.message
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

  private async request(endpoint: string, init: RequestInit, customHeaders?: HeadersInit): Promise<Response> {
    return fetch(`${this.baseUrl}${endpoint}`, {
      ...init,
      headers: this.getHeaders(init.body, customHeaders),
    })
  }

  async get<T>(endpoint: string, options?: { headers?: HeadersInit }): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'GET',
    }, options?.headers)

    return this.parseResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: unknown, options?: { headers?: HeadersInit }): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: this.toBody(data),
    }, options?.headers)

    return this.parseResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: unknown, options?: { headers?: HeadersInit }): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: this.toBody(data),
    }, options?.headers)

    return this.parseResponse<T>(response)
  }

  async patch<T>(endpoint: string, data?: unknown, options?: { headers?: HeadersInit }): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: this.toBody(data),
    }, options?.headers)

    return this.parseResponse<T>(response)
  }

  async delete<T>(endpoint: string, options?: { headers?: HeadersInit }): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    }, options?.headers)

    return this.parseResponse<T>(response)
  }

  async getBlob(endpoint: string, options?: { headers?: HeadersInit }): Promise<Blob> {
    const response = await this.request(endpoint, {
      method: 'GET',
    }, options?.headers)

    if (!response.ok) {
      let message = `API Error: ${response.status} ${response.statusText}`
      try {
        const errorBody = await response.json()
        if (errorBody?.message && typeof errorBody.message === 'string') {
          message = errorBody.message
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
