const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface OnboardingStatus {
  isComplete: boolean;
  currentStep: number;
  completedSteps: string[];
  startedAt?: string;
  completedAt?: string;
  stepsData: {
    businessInfo?: {
      completed: boolean;
      completedAt?: string;
    };
    walletSetup?: {
      completed: boolean;
      completedAt?: string;
      walletType?: string;
    };
    paymentPreferences?: {
      completed: boolean;
      completedAt?: string;
    };
    apiKeys?: {
      completed: boolean;
      completedAt?: string;
      testKeyGenerated: boolean;
      liveKeyGenerated: boolean;
    };
    webhookSetup?: {
      completed: boolean;
      completedAt?: string;
      webhookUrlConfigured: boolean;
      webhookTested: boolean;
    };
    chainhookSetup?: {
      completed: boolean;
      completedAt?: string;
      predicatesRegistered: boolean;
    };
    testPayment?: {
      completed: boolean;
      completedAt?: string;
      testPaymentId?: string;
      testSuccessful: boolean;
    };
    goLive?: {
      completed: boolean;
      completedAt?: string;
      liveKeysActivated: boolean;
    };
  };
}

export interface WebhookConfigRequest {
  webhookUrl: string;
  events?: string[];
}

export interface WebhookConfigResponse {
  webhookUrl: string;
  webhookSecret: string;
  events: string[];
  onboarding: OnboardingStatus;
}

export interface WebhookTestResponse {
  tested: boolean;
  webhookUrl: string;
  responseStatus: number;
  responseOk: boolean;
  testedAt: string;
}

export interface ChainhookSetupResponse {
  chainhook: {
    isConfigured: boolean;
    predicateIds: string[];
    configuredAt: string;
  };
  predicateConfigs: {
    transfers: any;
    contract: any;
  };
  onboarding: OnboardingStatus;
  instructions: {
    message: string;
    note: string;
    webhookEndpoints: string[];
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class OnboardingApiClient {
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
      console.error('Onboarding API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get current onboarding status
   */
  async getOnboardingStatus(): Promise<ApiResponse<OnboardingStatus>> {
    return this.makeRequest('/api/onboarding/status');
  }

  /**
   * Update onboarding step
   */
  async updateOnboardingStep(
    stepName: string,
    stepData: any,
    currentStep?: number
  ): Promise<ApiResponse<OnboardingStatus>> {
    return this.makeRequest('/api/onboarding/step', {
      method: 'PUT',
      body: JSON.stringify({
        stepName,
        stepData,
        currentStep,
      }),
    });
  }

  /**
   * Configure webhook URL during onboarding
   */
  async configureWebhook(
    webhookUrl: string,
    events?: string[]
  ): Promise<ApiResponse<WebhookConfigResponse>> {
    return this.makeRequest('/api/onboarding/webhook-config', {
      method: 'POST',
      body: JSON.stringify({
        webhookUrl,
        events,
      }),
    });
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(): Promise<ApiResponse<WebhookTestResponse>> {
    return this.makeRequest('/api/onboarding/webhook-test', {
      method: 'POST',
    });
  }

  /**
   * Setup Chainhook monitoring
   */
  async setupChainhook(): Promise<ApiResponse<ChainhookSetupResponse>> {
    return this.makeRequest('/api/onboarding/chainhook-setup', {
      method: 'POST',
    });
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(): Promise<ApiResponse<OnboardingStatus>> {
    return this.makeRequest('/api/onboarding/complete', {
      method: 'POST',
    });
  }

  /**
   * Reset onboarding (for testing)
   */
  async resetOnboarding(): Promise<ApiResponse<OnboardingStatus>> {
    return this.makeRequest('/api/onboarding/reset', {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const onboardingApiClient = new OnboardingApiClient();
