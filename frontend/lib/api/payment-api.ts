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

export interface PaymentUpdateRequest {
  status: 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  confirmations?: number;
}

export interface Payment {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  payoutMethod: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'expired' | 'cancelled' | 'refunded';
  description?: string;
  customerInfo?: {
    email?: string;
    name?: string;
  };
  depositAddress?: string;
  paymentAddress?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  completedAt?: string;
  transactionData?: {
    txId?: string;
    blockHeight?: number;
    confirmations?: number;
    timestamp?: string;
    fromAddress?: string;
  };
  metadata?: Record<string, any>;
  successUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
}

export interface PaymentListResponse {
  payments: Payment[];
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

class PaymentApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getAuthHeaders(): Record<string, string> {
    // ALWAYS use session token for all payment API operations
    // API key authentication should be handled separately for widget operations only
    const token = this.getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  // Removed getStoredApiKey - not needed for payment API client

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
        // Token might be expired, redirect to login
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      return {
        success: response.ok,
        ...data,
      };
    } catch (error) {
      console.error('Payment API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Payment Management - For merchant dashboard (uses session authentication)
  async createPaymentForMerchant(paymentData: PaymentCreateRequest): Promise<ApiResponse<Payment>> {
    // Payment creation should still use API key routes via widget API client
    // This method will be deprecated in favor of widget API client
    throw new Error('Use paymentWidgetApiClient.createPayment() for payment creation operations');
  }

  async getPaymentForMerchant(paymentId: string): Promise<ApiResponse<Payment>> {
    return this.makeRequest(`/api/auth/payments/stx/${paymentId}`); // Dashboard session-based route
  }

  async updatePaymentForMerchant(paymentId: string, updateData: PaymentUpdateRequest): Promise<ApiResponse> {
    // Update operations not implemented in backend yet
    throw new Error('Payment update operations not yet implemented');
  }

  async listPaymentsForMerchant(query?: {
    status?: string;
    paymentMethod?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PaymentListResponse>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    // Use session-based dashboard route for STX payments
    const endpoint = `/api/auth/payments/stx${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest(endpoint); // Dashboard session-based route
  }

  async cancelPaymentForMerchant(paymentId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/auth/payments/stx/${paymentId}/cancel`, {
      method: 'POST',
    }); // Dashboard session-based route
  }

  async refundPaymentForMerchant(
    paymentId: string, 
    refundData: {
      amount?: number;
      reason?: string;
      blockchainRefundData: {
        transactionId: string;
        blockHeight?: number;
        status?: 'pending' | 'confirmed';
        feesPaid?: number;
      };
    }
  ): Promise<ApiResponse> {
    // Refund operations not implemented in backend yet
    throw new Error('Payment refund operations not yet implemented');
  }

  async verifyPaymentForMerchant(
    paymentId: string,
    verificationData: {
      signature: string;
      blockchainData?: {
        txId?: string;
        txHash?: string;
        blockHeight?: number;
        confirmations?: number;
        timestamp?: string;
      };
      customerWalletAddress?: string;
    }
  ): Promise<ApiResponse> {
    // Verify operations not implemented in backend yet
    throw new Error('Payment verification operations not yet implemented');
  }

  // Payment Links - For merchant dashboard (deprecated - use paymentWidgetApiClient)
  async createPaymentLinkForMerchant(linkData: PaymentLinkRequest): Promise<ApiResponse<{ 
    id: string; 
    url: string; 
    qrCode: string; 
    expiresAt?: string; 
  }>> {
    // Payment link creation should use widget API client for proper API key authentication
    throw new Error('Use paymentWidgetApiClient.createPaymentLink() for payment link creation operations');
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

  // Public endpoints (no auth required) - For customer payments
  async getPaymentStatus(paymentId: string): Promise<ApiResponse<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    expiresAt?: string;
    depositAddress?: string;
    qrCode?: string;
  }>> {
    // No auth headers for public endpoint
    const url = `${this.baseURL}/api/public/payments/${paymentId}/status`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      return {
        success: response.ok,
        ...data,
      };
    } catch (error) {
      console.error('Payment status request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Process payment (public endpoint for customers)
  async processPayment(paymentId: string, paymentData: {
    walletAddress: string;
    transactionId: string;
    signature?: string;
    paymentMethod: 'bitcoin' | 'stx' | 'sbtc';
  }): Promise<ApiResponse> {
    const url = `${this.baseURL}/api/public/payments/${paymentId}/process`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      const data = await response.json();
      return {
        success: response.ok,
        ...data,
      };
    } catch (error) {
      console.error('Payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Multi-currency conversion utilities
  async getExchangeRates(): Promise<ApiResponse<{
    btcToUsd: number;
    stxToUsd: number;
    sbtcToUsd: number;
    timestamp: string;
  }>> {
    // Exchange rates not implemented in session routes yet
    throw new Error('Exchange rates not yet implemented for dashboard');
  }

  // QR Code generation
  async generateQRCode(paymentId: string, size?: number): Promise<ApiResponse<{
    qrCodeDataUrl: string;
    paymentUrl: string;
  }>> {
    // QR code generation not implemented in session routes yet
    throw new Error('QR code generation not yet implemented for dashboard');
  }

  // Payment analytics for merchant dashboard
  async getPaymentAnalytics(query?: {
    startDate?: string;
    endDate?: string;
    currency?: string;
    paymentMethod?: string;
  }): Promise<ApiResponse<{
    totalPayments: number;
    totalVolume: number;
    averagePayment: number;
    successRate: number;
    topCurrencies: Array<{ currency: string; count: number; volume: number }>;
    dailyVolume: Array<{ date: string; volume: number; count: number }>;
  }>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/auth/payments/analytics${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest(endpoint); // Dashboard session-based route
  }
}

export const paymentApiClient = new PaymentApiClient();
export { PaymentApiClient };