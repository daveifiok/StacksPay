export interface AnalyticsEvent {
  id: string;
  type: string;
  merchantId: string;
  customerId?: string;
  paymentId?: string;
  subscriptionId?: string;
  data: any;
  metadata: any;
  timestamp: Date;
  source: 'payment' | 'subscription' | 'merchant' | 'wallet' | 'api' | 'webhook';
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TransactionMetrics {
  totalTransactions: number;
  totalVolume: number;
  totalRevenue: number;
  averageTransactionValue: number;
  successRate: number;
  failureRate: number;
  topPaymentMethods: Array<{ method: string; count: number; volume: number }>;
  topCurrencies: Array<{ currency: string; count: number; volume: number }>;
  hourlyTrends: Array<{ hour: number; count: number; volume: number }>;
  dailyTrends: Array<{ date: string; count: number; volume: number }>;
  conversionRates: Array<{ from: string; to: string; rate: number; volume: number }>;
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  oneTimeRevenue: number;
  subscriptionRevenue: number;
  paymentFees: number;
  conversionFees: number;
  netRevenue: number;
  revenueGrowth: number;
  revenueByPeriod: Array<{ period: string; revenue: number; growth: number }>;
  revenueBySource: Array<{ source: string; revenue: number; percentage: number }>;
  topMerchants: Array<{ merchantId: string; revenue: number; transactions: number }>;
}

export interface UserMetrics {
  totalMerchants: number;
  activeMerchants: number;
  newMerchants: number;
  churnedMerchants: number;
  merchantGrowthRate: number;
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  customerRetentionRate: number;
  averageCustomerLifetime: number;
  customersByRegion: Array<{ region: string; count: number }>;
  merchantsByTier: Array<{ tier: string; count: number; revenue: number }>;
}

export interface SystemMetrics {
  apiCalls: number;
  apiCallsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  webhookDeliveryRate: number;
  webhookRetryRate: number;
  databaseConnections: number;
  cacheHitRate: number;
  systemErrors: Array<{ type: string; count: number; lastOccurred: Date }>;
}

export interface GeographicMetrics {
  transactionsByCountry: Array<{ country: string; count: number; volume: number }>;
  merchantsByCountry: Array<{ country: string; count: number }>;
  topCities: Array<{ city: string; count: number; volume: number }>;
  regionGrowth: Array<{ region: string; growth: number; volume: number }>;
}

export interface AlertThreshold {
  id: string;
  merchantId?: string;
  type: 'transaction_volume' | 'failure_rate' | 'revenue' | 'api_errors' | 'custom';
  condition: 'greater_than' | 'less_than' | 'equals' | 'change_percentage';
  value: number;
  period: 'minute' | 'hour' | 'day' | 'week' | 'month';
  isActive: boolean;
  webhookUrl?: string;
  emailNotification: boolean;
  lastTriggered?: Date;
}

export interface AnalyticsQuery {
  merchantId?: string;
  startDate: Date;
  endDate: Date;
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
  metrics: string[];
  filters?: {
    paymentMethod?: string[];
    currency?: string[];
    status?: string[];
    source?: string[];
  };
  groupBy?: string[];
  limit?: number;
}