/**
 * Payment Dashboard API Client
 * 
 * This handles payment operations from the merchant dashboard using session authentication.
 * This maintains security by using JWT tokens instead of requiring API keys to be stored in frontend.
 * 
 * Use this for:
 * - Creating payments from dashboard
 * - Payment link generation from dashboard
 * - Dashboard-initiated payment operations
 * 
 * For external merchant integrations (direct API key usage):
 * - Use backend API endpoints directly: /api/payments/* with API key headers
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface PaymentCreateRequest {
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

export interface PaymentLinkRequest {
  amount: number;
  currency: 'USD' | 'BTC' | 'STX' | 'sBTC';
  paymentMethod?: 'sbtc' | 'btc' | 'stx';
  description: string;
  customerEmail?: string;
  expiresIn?: string; // '1h', '24h', '7d', 'never'
  customId?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class PaymentDashboardApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get authentication for payment operations
   * Uses session token to authenticate and let backend handle API key logic
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Use session token for authentication
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const authToken = this.getAuthToken();
    if (!authToken) {
      console.warn('No auth token available for payment operations');
      return {};
    }
    return { Authorization: `Bearer ${authToken}` };
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const authHeaders = this.getAuthHeaders();
    if (!authHeaders.Authorization) {
      return {
        success: false,
        error: 'Authentication required. Please log in to continue.',
      };
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // For dashboard operations, handle 401 appropriately
      if (response.status === 401) {
        return {
          success: false,
          error: 'Session expired. Please log in again.',
        };
      }

      return {
        success: response.ok,
        ...data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Create a payment using session authentication
   * This is for dashboard-initiated payment creation
   */
  async createPayment(paymentData: PaymentCreateRequest): Promise<ApiResponse<any>> {
    // Route to session-based payment creation endpoint
    return this.makeRequest('/api/auth/payments/links', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Create a payment link using session authentication
   * This is for dashboard-initiated payment link creation
   */
  async createPaymentLink(linkData: PaymentLinkRequest): Promise<ApiResponse<{
    id: string;
    url: string;
    qrCode: string;
    paymentAddress: string;
    expiresAt?: string;
  }>> {
    // Use session-based payment links endpoint
    return this.makeRequest('/api/auth/payments/links', {
      method: 'POST',
      body: JSON.stringify(linkData),
    });
  }

  private parseExpiryToMinutes(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));
    
    switch(unit) {
      case 'h': return value * 60;
      case 'd': return value * 24 * 60;
      case 'w': return value * 7 * 24 * 60;
      default: return 24 * 60; // Default 24 hours
    }
  }

  /**
   * Check if auth token is available and valid
   */
  hasValidAuth(): boolean {
    return !!this.getAuthToken();
  }

  /**
   * Get auth info for debugging
   */
  getAuthInfo(): { hasAuth: boolean; tokenPreview?: string } {
    const authToken = this.getAuthToken();
    if (!authToken) {
      return { hasAuth: false };
    }
    
    return {
      hasAuth: true,
      tokenPreview: authToken.substring(0, 12) + '...',
    };
  }
}

export const paymentWidgetApiClient = new PaymentDashboardApiClient();
export { PaymentDashboardApiClient };