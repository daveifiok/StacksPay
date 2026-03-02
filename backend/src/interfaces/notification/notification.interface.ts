export interface NotificationData {
  id: string;
  type: 'email' | 'sms' | 'push' | 'webhook' | 'in_app';
  recipient: string;
  subject?: string;
  message: string;
  data: any;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  metadata: any;
  merchantId?: string;
  customerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  merchantId: string;
  email: {
    enabled: boolean;
    address: string;
    verificationRequired: boolean;
    types: {
      payment_received: boolean;
      payment_failed: boolean;
      subscription_created: boolean;
      subscription_canceled: boolean;
      low_balance: boolean;
      security_alerts: boolean;
      system_updates: boolean;
      marketing: boolean;
    };
  };
  sms: {
    enabled: boolean;
    phone?: string;
    verificationRequired: boolean;
    types: {
      critical_alerts: boolean;
      payment_failed: boolean;
      security_alerts: boolean;
    };
  };
  webhook: {
    enabled: boolean;
    url?: string;
    secret?: string;
    events: string[];
  };
  inApp: {
    enabled: boolean;
    types: {
      all_events: boolean;
      important_only: boolean;
    };
  };
}

export interface MerchantNotificationOptions {
  type: string;
  merchantId?: string;
  paymentId?: string;
  subscriptionId?: string;
  customerId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  failedPaymentCount?: number;
  customerEmail?: string;
  metadata?: any;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  channels?: ('email' | 'sms' | 'webhook' | 'in_app')[];
}
