/**
 * External Payment API Client
 * 
 * This is for external merchant integrations that use API keys directly.
 * This would be used by merchant websites, mobile apps, or server-to-server integrations.
 * 
 * Use this for:
 * - External merchant website integrations
 * - Server-to-server payment creation
 * - Public API key-based operations
 * 
 * Do NOT use this for:
 * - Dashboard operations (use payment-widget-api.ts instead)
 * - Session-based operations
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ExternalPaymentCreateRequest {
  amount: number;
  currency: 'USD' | 'BTC' | 'STX' | 'sBTC';
  paymentMethod?: 'sbtc' | 'btc' | 'stx';
  payoutMethod?: 'sbtc' | 'usd' | 'usdt' | 'usdc';
  description?: string;
  customerInfo?: {
    email?: string;
    name?: string;
  };
  successUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  allowedPaymentMethods?: string[];
  preferredPaymentMethod?: string;
}

export interface ExternalApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ExternalPaymentApiClient {
  private baseURL: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.baseURL = API_BASE_URL;
    this.apiKey = apiKey;
  }

  private getAuthHeaders(): Record<string, string> {
    return { 
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ExternalApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid or expired API key. Please check your API key configuration.',
        };
      }

      return {
        success: response.ok,
        ...data,
      };
    } catch (error) {
      console.error('External Payment API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Create a payment using API key authentication
   * This is for external merchant integrations
   */
  async createPayment(paymentData: ExternalPaymentCreateRequest): Promise<ExternalApiResponse<any>> {
    return this.makeRequest('/api/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Create an STX payment using API key authentication
   * This is for external merchant integrations
   */
  async createSTXPayment(paymentData: ExternalPaymentCreateRequest): Promise<ExternalApiResponse<any>> {
    return this.makeRequest('/api/payments/stx', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Get payment status using API key authentication
   */
  async getPaymentStatus(paymentId: string): Promise<ExternalApiResponse<any>> {
    return this.makeRequest(`/api/payments/${paymentId}`);
  }

  /**
   * Get payment by custom ID using API key authentication
   */
  async getPaymentByCustomId(customId: string): Promise<ExternalApiResponse<any>> {
    return this.makeRequest(`/api/payments/custom/${customId}`);
  }
}

/**
 * Factory function to create external payment client with API key
 */
export function createExternalPaymentClient(apiKey: string): ExternalPaymentApiClient {
  return new ExternalPaymentApiClient(apiKey);
}

export { ExternalPaymentApiClient };