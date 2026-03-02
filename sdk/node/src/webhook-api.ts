import { BaseAPI } from './base';

export interface Webhook {
  id: string;
  url: string;
  description?: string;
  events: string[];
  status: 'active' | 'inactive';
  secret: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookRequest {
  url: string;
  description?: string;
  events: string[];
}

export interface WebhookResponse {
  success: boolean;
  webhook: Webhook;
}

export interface WebhookListResponse {
  success: boolean;
  webhooks: Webhook[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface WebhookStats {
  success: boolean;
  stats: {
    total_sent: number;
    total_success: number;
    total_failed: number;
    success_rate: number;
    recent_events: Array<{
      id: string;
      type: string;
      status: string;
      created_at: string;
    }>;
  };
}

export class WebhookAPI extends BaseAPI {
  /**
   * Create a new webhook
   */
  async create(webhookData: WebhookRequest): Promise<Webhook> {
    const response = await this.makeRequest<WebhookResponse>({
      method: 'POST',
      url: '/api/webhooks',
      data: webhookData
    });
    
    return response.webhook;
  }

  /**
   * Retrieve a webhook by ID
   */
  async retrieve(webhookId: string): Promise<Webhook> {
    const response = await this.makeRequest<WebhookResponse>({
      method: 'GET',
      url: `/api/webhooks/${webhookId}`
    });
    
    return response.webhook;
  }

  /**
   * List all webhooks with pagination
   */
  async list(options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{ webhooks: Webhook[]; pagination: any }> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status) params.append('status', options.status);

    const response = await this.makeRequest<WebhookListResponse>({
      method: 'GET',
      url: `/api/webhooks?${params.toString()}`
    });
    
    return {
      webhooks: response.webhooks,
      pagination: response.pagination
    };
  }

  /**
   * Update a webhook
   */
  async update(webhookId: string, updates: Partial<WebhookRequest>): Promise<Webhook> {
    const response = await this.makeRequest<WebhookResponse>({
      method: 'PUT',
      url: `/api/webhooks/${webhookId}`,
      data: updates
    });
    
    return response.webhook;
  }

  /**
   * Delete a webhook
   */
  async delete(webhookId: string): Promise<void> {
    await this.makeRequest({
      method: 'DELETE',
      url: `/api/webhooks/${webhookId}`
    });
  }

  /**
   * Test a webhook
   */
  async test(webhookId: string): Promise<any> {
    const response = await this.makeRequest({
      method: 'POST',
      url: `/api/webhooks/${webhookId}/test`
    });
    
    return response;
  }

  /**
   * Get webhook statistics
   */
  async getStats(webhookId?: string): Promise<any> {
    const url = webhookId 
      ? `/api/webhooks/${webhookId}/stats`
      : '/api/webhooks/stats';
      
    const response = await this.makeRequest<WebhookStats>({
      method: 'GET',
      url
    });
    
    return response.stats;
  }

  /**
   * Retry failed webhook events
   */
  async retry(webhookId: string): Promise<any> {
    const response = await this.makeRequest({
      method: 'POST',
      url: `/api/webhooks/${webhookId}/retry`
    });
    
    return response;
  }
}
