import { apiClient } from './auth-api';

export interface Notification {
  id: string;
  merchantId: string;
  type: 'payment_received' | 'payment_failed' | 'deposit_confirmed' | 'withdrawal_completed' | 'system_alert' | 'api_error';
  title: string;
  message: string;
  data?: Record<string, any>;
  status: 'unread' | 'read';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  readAt?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

export interface NotificationFilters {
  status?: 'unread' | 'read';
  type?: Notification['type'];
  limit?: number;
  page?: number;
}

class NotificationApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
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
  ): Promise<{ success: boolean; data?: T; error?: string }> {
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
        // Let auth system handle this
        throw new Error('Authentication required');
      }

      return {
        success: response.ok,
        ...data,
      };
    } catch (error) {
      console.error('Notification API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get notifications with optional filtering and pagination
   */
  async getNotifications(filters: NotificationFilters = {}): Promise<{ success: boolean; data?: NotificationListResponse; error?: string }> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.page) params.append('page', filters.page.toString());

    const queryString = params.toString();
    const endpoint = `/api/notifications${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<NotificationListResponse>(endpoint);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ success: boolean; data?: { unreadCount: number }; error?: string }> {
    return this.makeRequest<{ unreadCount: number }>('/api/notifications/unread-count');
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean; data?: { notification: Notification }; error?: string }> {
    return this.makeRequest<{ notification: Notification }>(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; data?: { message: string; count: number }; error?: string }> {
    return this.makeRequest<{ message: string; count: number }>('/api/notifications/read-all', {
      method: 'PUT',
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean; data?: { message: string }; error?: string }> {
    return this.makeRequest<{ message: string }>(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Create test notification (for development)
   */
  async createTestNotification(options: {
    type?: Notification['type'];
    urgency?: Notification['urgency'];
    amount?: number;
    currency?: string;
  } = {}): Promise<{ success: boolean; data?: { message: string; result: any }; error?: string }> {
    return this.makeRequest<{ message: string; result: any }>('/api/notifications/test', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }
}

export const notificationApiClient = new NotificationApiClient();
