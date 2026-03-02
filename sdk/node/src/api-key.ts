import { BaseAPI } from './base';

export interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  status: 'active' | 'inactive';
  lastUsed?: string;
  usage: {
    requests_today: number;
    requests_this_month: number;
  };
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface APIKeyRequest {
  name: string;
  permissions: string[];
  expiresAt?: string;
}

export interface APIKeyResponse {
  success: boolean;
  apiKey: APIKey;
  key?: string; // Only returned when creating/regenerating
}

export interface APIKeyListResponse {
  success: boolean;
  apiKeys: APIKey[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface APIKeyUsage {
  success: boolean;
  usage: {
    requests_today: number;
    requests_this_month: number;
    requests_total: number;
    last_request: string;
    daily_breakdown: Array<{
      date: string;
      requests: number;
    }>;
  };
}

export class APIKeyAPI extends BaseAPI {
  /**
   * Generate a new API key
   */
  async generate(keyData: APIKeyRequest): Promise<{ apiKey: APIKey; key: string }> {
    const response = await this.makeRequest<APIKeyResponse>({
      method: 'POST',
      url: '/api/api-keys/generate',
      data: keyData
    });
    
    return {
      apiKey: response.apiKey,
      key: response.key!
    };
  }

  /**
   * List all API keys
   */
  async list(options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{ apiKeys: APIKey[]; pagination: any }> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status) params.append('status', options.status);

    const response = await this.makeRequest<APIKeyListResponse>({
      method: 'GET',
      url: `/api/api-keys?${params.toString()}`
    });
    
    return {
      apiKeys: response.apiKeys,
      pagination: response.pagination
    };
  }

  /**
   * Update an API key
   */
  async update(keyId: string, updates: { name?: string; permissions?: string[]; expiresAt?: string }): Promise<APIKey> {
    const response = await this.makeRequest<APIKeyResponse>({
      method: 'PUT',
      url: `/api/api-keys/${keyId}`,
      data: updates
    });
    
    return response.apiKey;
  }

  /**
   * Delete an API key
   */
  async delete(keyId: string): Promise<void> {
    await this.makeRequest({
      method: 'DELETE',
      url: `/api/api-keys/${keyId}`
    });
  }

  /**
   * Regenerate an API key
   */
  async regenerate(keyId: string): Promise<{ apiKey: APIKey; key: string }> {
    const response = await this.makeRequest<APIKeyResponse>({
      method: 'POST',
      url: `/api/api-keys/${keyId}/regenerate`
    });
    
    return {
      apiKey: response.apiKey,
      key: response.key!
    };
  }

  /**
   * Activate an API key
   */
  async activate(keyId: string): Promise<APIKey> {
    const response = await this.makeRequest<APIKeyResponse>({
      method: 'POST',
      url: `/api/api-keys/${keyId}/activate`
    });
    
    return response.apiKey;
  }

  /**
   * Deactivate an API key
   */
  async deactivate(keyId: string): Promise<APIKey> {
    const response = await this.makeRequest<APIKeyResponse>({
      method: 'POST',
      url: `/api/api-keys/${keyId}/deactivate`
    });
    
    return response.apiKey;
  }

  /**
   * Get API key usage statistics
   */
  async getUsage(keyId: string): Promise<any> {
    const response = await this.makeRequest<APIKeyUsage>({
      method: 'GET',
      url: `/api/api-keys/${keyId}/usage`
    });
    
    return response.usage;
  }

  /**
   * Get API key statistics
   */
  async getStats(): Promise<any> {
    const response = await this.makeRequest({
      method: 'GET',
      url: '/api/api-keys/stats'
    });
    
    return response;
  }

  /**
   * Test an API key
   */
  async test(keyId: string): Promise<any> {
    const response = await this.makeRequest({
      method: 'POST',
      url: `/api/api-keys/${keyId}/test`
    });
    
    return response;
  }

  /**
   * Validate an API key
   */
  async validate(key: string): Promise<any> {
    const response = await this.makeRequest({
      method: 'POST',
      url: '/api/api-keys/validate',
      data: { key }
    });
    
    return response;
  }
}
