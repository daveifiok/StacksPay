const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface LinkableAccount {
  id: string;
  email: string;
  authMethod: string;
  name: string;
  createdAt: string;
  confidence: 'high' | 'medium' | 'low';
  matchingFields: string[];
}

export interface LinkedAccount {
  accountId: string;
  authMethod: string;
  email?: string;
  stacksAddress?: string;
  googleId?: string;
  githubId?: string;
  linkedAt: string;
  isPrimary: boolean;
}

export interface LinkingSuggestion {
  canLink: boolean;
  targetAccount: {
    id: string;
    name: string;
    authMethod: string;
    email: string;
  };
  message: string;
}

export interface AccountLinkingResponse {
  success: boolean;
  suggestions?: LinkableAccount[];
  linkedAccounts?: LinkedAccount[];
  linkingToken?: string;
  expiresAt?: string;
  linkedAccount?: any;
  message?: string;
  error?: string;
  linkingSuggestion?: LinkingSuggestion;
}

class AccountLinkingAPI {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    const responseData = await response.json().catch(() => ({}));

    // Always return the response data so mutations can handle both success and error cases
    return responseData;
  }

  /**
   * Get suggested account links for current user
   */
  async getSuggestedLinks(): Promise<AccountLinkingResponse> {
    return this.makeRequest('/auth/accounts/suggest-links');
  }

  /**
   * Initiate account linking process
   */
  async initiateLinking(targetAccountId: string, targetEmail?: string): Promise<AccountLinkingResponse> {
    return this.makeRequest('/auth/accounts/initiate-link', {
      method: 'POST',
      body: JSON.stringify({ targetAccountId, targetEmail })
    });
  }

  /**
   * Confirm account linking with token
   */
  async confirmLinking(linkingToken: string): Promise<AccountLinkingResponse> {
    return this.makeRequest('/auth/accounts/confirm-link', {
      method: 'POST',
      body: JSON.stringify({ linkingToken })
    });
  }

  /**
   * Get all linked accounts for current user
   */
  async getLinkedAccounts(): Promise<AccountLinkingResponse> {
    return this.makeRequest('/auth/accounts/linked');
  }

  /**
   * Unlink an account
   */
  async unlinkAccount(accountToUnlink: string): Promise<AccountLinkingResponse> {
    return this.makeRequest('/auth/accounts/unlink', {
      method: 'POST',
      body: JSON.stringify({ accountToUnlink })
    });
  }

  /**
   * Update email (enhanced with linking suggestions)
   */
  async updateEmail(email: string): Promise<AccountLinkingResponse> {
    return this.makeRequest('/auth/update-email', {
      method: 'PATCH',
      body: JSON.stringify({ email })
    });
  }
}

export const accountLinkingApi = new AccountLinkingAPI();
