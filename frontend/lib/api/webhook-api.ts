const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface WebhookCreateRequest {
  url: string;
  description: string;
  events: string[];
  isActive?: boolean;
}

export interface WebhookUpdateRequest {
  url?: string;
  description?: string;
  events?: string[];
  isActive?: boolean;
}

export interface Webhook {
  id: string;
  merchantId: string;
  url: string;
  description: string;
  events: string[];
  status: 'active' | 'inactive' | 'failed';
  secret: string;
  lastDelivery?: string;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  type: string;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  timestamp: string;
  endpoint: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  response: {
    status: number;
    body?: string;
    headers?: Record<string, string>;
  };
  payload: Record<string, any>;
  error?: string;
}

export interface WebhookTestResult {
  success: boolean;
  status: number;
  response?: string;
  error?: string;
  timestamp: string;
}

export interface WebhookListResponse {
  webhooks: Webhook[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WebhookEventListResponse {
  events: WebhookEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class WebhookApiClient {
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
      console.error('Webhook API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Webhook Management
  async createWebhook(webhookData: WebhookCreateRequest): Promise<ApiResponse<Webhook>> {
    return this.makeRequest('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify(webhookData),
    });
  }

  async getWebhook(webhookId: string): Promise<ApiResponse<Webhook>> {
    return this.makeRequest(`/api/webhooks/${webhookId}`);
  }

  async updateWebhook(webhookId: string, updateData: WebhookUpdateRequest): Promise<ApiResponse<Webhook>> {
    return this.makeRequest(`/api/webhooks/${webhookId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteWebhook(webhookId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  async listWebhooks(query?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<WebhookListResponse>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/webhooks${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // Webhook Testing
  async testWebhook(webhookId: string, eventType: string): Promise<ApiResponse<WebhookTestResult>> {
    return this.makeRequest(`/api/webhooks/${webhookId}/test`, {
      method: 'POST',
      body: JSON.stringify({ eventType }),
    });
  }

  // Webhook Events
  async getWebhookEvents(webhookId: string, query?: {
    page?: number;
    limit?: number;
    status?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<WebhookEventListResponse>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/webhooks/${webhookId}/events${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getAllWebhookEvents(query?: {
    page?: number;
    limit?: number;
    status?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<WebhookEventListResponse>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/webhook-events${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async retryWebhookEvent(eventId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/webhook-events/${eventId}/retry`, {
      method: 'POST',
    });
  }

  async getWebhookEvent(eventId: string): Promise<ApiResponse<WebhookEvent>> {
    return this.makeRequest(`/api/webhook-events/${eventId}`);
  }

  // Webhook Statistics
  async getWebhookStats(webhookId?: string): Promise<ApiResponse<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    averageSuccessRate: number;
  }>> {
    const endpoint = webhookId 
      ? `/api/webhooks/${webhookId}/stats`
      : '/api/webhooks/stats';
    return this.makeRequest(endpoint);
  }

  // Webhook Secret Management
  async regenerateWebhookSecret(webhookId: string): Promise<ApiResponse<{ secret: string }>> {
    return this.makeRequest(`/api/webhooks/${webhookId}/regenerate-secret`, {
      method: 'POST',
    });
  }

  async getWebhookSecret(webhookId: string): Promise<ApiResponse<{ secret: string }>> {
    return this.makeRequest(`/api/webhooks/${webhookId}/secret`);
  }
}

export const webhookApiClient = new WebhookApiClient();
export { WebhookApiClient };
