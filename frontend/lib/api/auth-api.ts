const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
  refreshToken?: string;
  merchant?: any;
  requires2FA?: boolean;
  lockoutTimeRemaining?: number;
  remainingAttempts?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
  deviceFingerprint?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  businessType: string;
  stacksAddress?: string;
  website?: string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
}

export interface WalletAuthRequest {
  address: string;
  signature: string;
  message: string;
  publicKey: string;
  walletType: 'stacks' | 'bitcoin';
  paymentId?: string;
  amount?: number;
}

export interface WalletRegisterRequest extends WalletAuthRequest {
  businessName: string;
  businessType: string;
  email?: string;
}

class ApiClient {
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

  private setStoredToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('authToken', token);
  }

  private removeStoredToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
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
        this.removeStoredToken();
        // Redirect to login if needed
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      return {
        success: response.ok,
        ...data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication endpoints
  async loginWithEmail(credentials: LoginRequest): Promise<ApiResponse> {
    const response = await this.makeRequest('/api/auth/login/email', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.token) {
      this.setStoredToken(response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
    }

    return response;
  }

  async registerWithEmail(data: RegisterRequest): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/register/email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async loginWithWallet(walletData: WalletAuthRequest): Promise<ApiResponse> {
    const response = await this.makeRequest('/api/auth/login/wallet', {
      method: 'POST',
      body: JSON.stringify(walletData),
    });

    if (response.success && response.token) {
      this.setStoredToken(response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
    }

    return response;
  }

  async registerWithWallet(walletData: WalletRegisterRequest): Promise<ApiResponse> {
    const response = await this.makeRequest('/api/auth/register/wallet', {
      method: 'POST',
      body: JSON.stringify(walletData),
    });

    if (response.success && response.token) {
      this.setStoredToken(response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.makeRequest('/api/auth/logout', {
      method: 'POST',
    });
    
    this.removeStoredToken();
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/me');
  }

  // Wallet challenge endpoints
  async generateWalletChallenge(
    address: string,
    type: 'connection' | 'payment',
    paymentId?: string,
    amount?: number
  ): Promise<ApiResponse<{ challenge: string; expiresAt: string }>> {
    const params = new URLSearchParams({
      address,
      type,
      ...(paymentId && { paymentId }),
      ...(amount && { amount: amount.toString() }),
    });

    return this.makeRequest(`/api/auth/wallet/challenge?${params}`);
  }

  async verifyWalletSignature(walletData: WalletAuthRequest): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/wallet/verify', {
      method: 'POST',
      body: JSON.stringify(walletData),
    });
  }

  // API Key management
  async getApiKeys(): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/api-keys');
  }

  async createApiKey(data: {
    name: string;
    permissions: string[];
    environment: 'test' | 'live';
    rateLimit?: number;
    ipRestrictions?: string[];
    expiresAt?: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeApiKey(keyId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/auth/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  }

  // Email verification
  async verifyEmail(token: string): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerificationEmail(email: string): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Password reset
  async requestPasswordReset(email: string): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: newPassword }),
    });
  }

  // Profile management
  async getProfile(): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/profile');
  }

  async updateProfile(profileData: {
    name?: string;
    email?: string;
    businessType?: string;
    website?: string;
    businessDescription?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    taxId?: string;
    timezone?: string;
    language?: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Settings management
  async getSettings(): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/settings');
  }

  async updateSettings(settingsData: {
    paymentPreferences?: {
      acceptBitcoin?: boolean;
      acceptSTX?: boolean;
      acceptsBTC?: boolean;
      preferredCurrency?: 'sbtc' | 'usd' | 'usdt';
      autoConvertToUSD?: boolean;
      usdConversionMethod?: 'coinbase' | 'kraken' | 'binance' | 'manual';
    };
    sbtcSettings?: {
      autoConvert?: boolean;
      minAmount?: number;
      maxAmount?: number;
      confirmationThreshold?: number;
    };
    notificationPreferences?: {
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      webhookNotifications?: boolean;
      paymentAlerts?: boolean;
      securityAlerts?: boolean;
      marketingEmails?: boolean;
    };
    webhookUrl?: string;
    webhookSecret?: string;
    webhookEvents?: string[];
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  // Two-Factor Authentication
  async enable2FA(): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/2fa/enable', {
      method: 'POST',
    });
  }

  async confirm2FA(token: string): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/2fa/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async disable2FA(credentials: { password?: string; twoFactorCode?: string }): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Password Management
  async updatePassword(passwordData: { currentPassword?: string; newPassword: string }): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async getGeneratedPassword(): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/generated-password');
  }

  // OAuth Session Exchange
  async exchangeSessionForTokens(sessionId: string): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/session-exchange', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  // Email Management
  async updateEmail(email: string): Promise<ApiResponse> {
    console.log('updateEmail called with:', email);
    console.log('Auth token available:', !!this.getStoredToken());
    console.log('Auth headers:', this.getAuthHeaders());
    
    return this.makeRequest('/api/auth/update-email', {
      method: 'PATCH',
      body: JSON.stringify({ email }),
    });
  }
}

export const apiClient = new ApiClient();
