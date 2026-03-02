const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiKeyCreateRequest {
  name: string;
  environment: 'test' | 'live';
  permissions: string[];
  description?: string;
  expiresAt?: string;
}

export interface ApiKeyUpdateRequest {
  name?: string;
  permissions?: string[];
  description?: string;
  isActive?: boolean;
}

export interface ApiKey {
  keyId: string;
  name: string;
  keyPreview: string;
  environment: 'test' | 'live';
  permissions: string[];
  ipRestrictions: string[];
  rateLimit: number;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  isActive: boolean;
  requestCount: number;
}

export interface ApiKeyUsage {
  keyId: string;
  period: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  uniqueIPs: number;
  usageByEndpoint: Array<{
    endpoint: string;
    method: string;
    count: number;
    lastUsed: string;
  }>;
  usageByDay: Array<{
    date: string;
    requests: number;
    errors: number;
  }>;
}

export interface ApiKeyListResponse {
  apiKeys: ApiKey[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Legacy interface for backward compatibility
export interface ApiKeyData {
  id?: string;
  keyId?: string;
  name: string;
  environment: 'test' | 'live';
  permissions: string[];
  keyPrefix?: string; // Only shows prefix, never full key
  ipRestrictions?: string[];
  rateLimit?: number;
  status: 'active' | 'revoked' | 'expired';
  lastUsed?: Date;
  createdAt?: Date;
  expiresAt?: Date;
  requestCount?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Standard API permissions for StacksPay
export const API_PERMISSIONS = {
  PAYMENTS: {
    CREATE: 'payments:create',
    READ: 'payments:read',
    WEBHOOK: 'payments:webhook',
    REFUND: 'payments:refund'
  },
  WALLET: {
    READ: 'wallet:read',
    BALANCE: 'wallet:balance'
  },
  MERCHANT: {
    READ: 'merchant:read',
    UPDATE: 'merchant:update'
  },
  WEBHOOKS: {
    CREATE: 'webhooks:create',
    READ: 'webhooks:read',
    UPDATE: 'webhooks:update',
    DELETE: 'webhooks:delete'
  }
} as const;

export const PERMISSION_GROUPS = {
  BASIC: [
    API_PERMISSIONS.PAYMENTS.CREATE,
    API_PERMISSIONS.PAYMENTS.READ,
    API_PERMISSIONS.WALLET.READ
  ],
  STANDARD: [
    API_PERMISSIONS.PAYMENTS.CREATE,
    API_PERMISSIONS.PAYMENTS.READ,
    API_PERMISSIONS.PAYMENTS.WEBHOOK,
    API_PERMISSIONS.WALLET.READ,
    API_PERMISSIONS.WALLET.BALANCE,
    API_PERMISSIONS.WEBHOOKS.CREATE,
    API_PERMISSIONS.WEBHOOKS.READ
  ],
  ADVANCED: [
    ...Object.values(API_PERMISSIONS.PAYMENTS),
    ...Object.values(API_PERMISSIONS.WALLET),
    ...Object.values(API_PERMISSIONS.MERCHANT),
    ...Object.values(API_PERMISSIONS.WEBHOOKS)
  ]
} as const;

class ApiKeyApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle authentication errors
      if (response.status === 401) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      return {
        success: response.ok,
        ...data,
      };
    } catch (error) {
      console.error('API Key API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // API Key Management
  async createApiKey(keyData: ApiKeyCreateRequest): Promise<ApiResponse<ApiKey>> {
    return this.makeRequest('/api/api-keys/generate', {
      method: 'POST',
      body: JSON.stringify(keyData),
    });
  }

  async getApiKey(keyId: string): Promise<ApiResponse<ApiKey>> {
    return this.makeRequest(`/api/api-keys/${keyId}`);
  }

  async updateApiKey(keyId: string, updateData: ApiKeyUpdateRequest): Promise<ApiResponse<ApiKey>> {
    return this.makeRequest(`/api/api-keys/${keyId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteApiKey(keyId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  }

  async listApiKeys(query?: {
    page?: number;
    limit?: number;
    environment?: 'test' | 'live';
    status?: string;
  }): Promise<ApiResponse<ApiKeyListResponse>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/api-keys${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // API Key Operations
  async regenerateApiKey(keyId: string): Promise<ApiResponse<{ key: string }>> {
    return this.makeRequest(`/api/api-keys/${keyId}/regenerate`, {
      method: 'POST',
    });
  }

  async activateApiKey(keyId: string): Promise<ApiResponse<ApiKey>> {
    return this.makeRequest(`/api/api-keys/${keyId}/activate`, {
      method: 'POST',
    });
  }

  async deactivateApiKey(keyId: string): Promise<ApiResponse<ApiKey>> {
    return this.makeRequest(`/api/api-keys/${keyId}/deactivate`, {
      method: 'POST',
    });
  }

  // API Key Usage and Analytics
  async getApiKeyUsage(keyId: string, period?: string): Promise<ApiResponse<ApiKeyUsage>> {
    const params = period ? `?period=${period}` : '';
    return this.makeRequest(`/api/api-keys/${keyId}/usage${params}`);
  }

  async getApiKeyStats(): Promise<ApiResponse<{
    totalKeys: number;
    activeKeys: number;
    testKeys: number;
    liveKeys: number;
    totalRequests: number;
    requestsToday: number;
    averageRequestsPerKey: number;
  }>> {
    return this.makeRequest('/api/api-keys/stats');
  }

  // Permission Management
  async getAvailablePermissions(): Promise<ApiResponse<{
    permissions: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
    }>;
  }>> {
    return this.makeRequest('/api/api-keys/permissions');
  }

  async validateApiKey(key: string): Promise<ApiResponse<{
    valid: boolean;
    keyInfo?: {
      id: string;
      name: string;
      environment: string;
      permissions: string[];
      merchantId: string;
    };
  }>> {
    return this.makeRequest('/api/api-keys/validate', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  }

  // API Key Testing
  async testApiKey(keyId: string): Promise<ApiResponse<{
    success: boolean;
    endpoint: string;
    responseTime: number;
    status: number;
    error?: string;
  }>> {
    return this.makeRequest(`/api/api-keys/${keyId}/test`, {
      method: 'POST',
    });
  }

  /**
   * Legacy method for backward compatibility
   */
  async getApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    const response = await this.listApiKeys();
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.apiKeys,
      };
    }
    return {
      success: false,
      error: response.error || 'Failed to fetch API keys',
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  async revokeApiKey(keyId: string): Promise<ApiResponse> {
    return this.deleteApiKey(keyId);
  }

  /**
   * Generate onboarding API keys (test and live keys + webhook secret)
   */
  async generateOnboardingKeys(): Promise<ApiResponse<{
    testKey: { key: string; keyId: string };
    liveKey: { key: string; keyId: string };
    webhookSecret: string;
  }>> {
    return this.makeRequest('/api/api-keys/onboarding', {
      method: 'POST',
    });
  }

  /**
   * Get API key documentation and examples
   */
  getApiDocumentation(): {
    quickStart: string;
    examples: { [key: string]: string };
    sdks: { language: string; installation: string; example: string }[];
  } {
    return {
      quickStart: `
# Quick Start Guide

## 1. Install SDK (Optional)
npm install @stackspay/node

## 2. Initialize Client
const StacksPay = require('@stackspay/node')
const client = new StacksPay({
  apiKey: 'your_api_key_here',
  environment: 'test' // or 'live'
})

## 3. Create Payment
const payment = await client.payments.create({
  amount: 1000000, // 0.01 BTC in satoshis
  currency: 'BTC',
  description: 'Payment for order #123'
})
      `,
      examples: {
        curl: `curl -X POST https://api.stackspay.com/v1/payments \\
  -H "Authorization: Bearer sk_test_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1000000,
    "currency": "BTC",
    "description": "Payment for order #123",
    "successUrl": "https://yoursite.com/success"
  }'`,
        javascript: `const response = await fetch('https://api.stackspay.com/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_test_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 1000000,
    currency: 'BTC',
    description: 'Payment for order #123',
    successUrl: 'https://yoursite.com/success'
  })
})`,
        python: `import requests

response = requests.post(
    'https://api.stackspay.com/v1/payments',
    headers={
        'Authorization': 'Bearer sk_test_...',
        'Content-Type': 'application/json'
    },
    json={
        'amount': 1000000,
        'currency': 'BTC',
        'description': 'Payment for order #123',
        'successUrl': 'https://yoursite.com/success'
    }
)`
      },
      sdks: [
        {
          language: 'Node.js',
          installation: 'npm install @stackspay/node',
          example: `const StacksPay = require('@stackspay/node')
const client = new StacksPay('sk_test_...')

const payment = await client.payments.create({
  amount: 1000000,
  currency: 'BTC'
})`
        },
        {
          language: 'Python',
          installation: 'pip install stackspay',
          example: `import stackspay

client = stackspay.Client('sk_test_...')
payment = client.payments.create(
    amount=1000000,
    currency='BTC'
)`
        },
        {
          language: 'PHP',
          installation: 'composer require stackspay/php',
          example: `<?php
require_once 'vendor/autoload.php';

$client = new \\StacksPay\\Client('sk_test_...');
$payment = $client->payments->create([
    'amount' => 1000000,
    'currency' => 'BTC'
]);`
        }
      ]
    };
  }

  /**
   * Validate API key format
   */
  static validateApiKeyFormat(key: string, environment: 'test' | 'live'): boolean {
    const prefix = environment === 'test' ? 'sk_test_' : 'sk_live_';
    return key.startsWith(prefix) && key.length >= 40;
  }
}

// Export singleton instance
export const apiKeyApiClient = new ApiKeyApiClient();