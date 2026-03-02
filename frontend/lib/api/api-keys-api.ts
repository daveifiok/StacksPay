export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export interface ApiKey {
  keyId: string
  name: string
  keyPreview: string
  environment: 'test' | 'live'
  permissions: string[]
  ipRestrictions: string[]
  rateLimit: number
  createdAt: string
  lastUsed?: string
  expiresAt?: string
  isActive: boolean
  requestCount: number
}

export interface ApiKeyCreated extends ApiKey {
  apiKey: string // Full key only returned during creation
}

export interface CreateApiKeyRequest {
  name: string
  environment: 'test' | 'live'
  permissions: string[]
  ipRestrictions?: string[]
  rateLimit?: number
}

export interface UpdateApiKeyRequest {
  name?: string
  permissions?: string[]
  ipRestrictions?: string[]
  rateLimit?: number
}

class ApiKeysApi {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api/v1/api-keys${endpoint}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    }

    // Get token from localStorage or cookie
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') || document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1]
      : null

    const headers = {
      ...defaultHeaders,
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Get all API keys for the authenticated merchant
  async getApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    return this.makeRequest<ApiKey[]>('/')
  }

  // Create a new API key
  async createApiKey(data: CreateApiKeyRequest): Promise<ApiResponse<ApiKeyCreated>> {
    return this.makeRequest<ApiKeyCreated>('/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Update an existing API key
  async updateApiKey(keyId: string, data: UpdateApiKeyRequest): Promise<ApiResponse<ApiKey>> {
    return this.makeRequest<ApiKey>(`/${keyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Delete/revoke an API key
  async deleteApiKey(keyId: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/${keyId}`, {
      method: 'DELETE',
    })
  }
}

export const apiKeysApi = new ApiKeysApi()
export default apiKeysApi
