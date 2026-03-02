export interface CreateSubscriptionOptions {
  merchantId: string;
  customerId: string;
  planId: string;
  paymentMethod: 'bitcoin' | 'stx' | 'sbtc';
  customerEmail: string;
  customerName?: string;
  trialDays?: number;
  metadata?: any;
  webhookUrl?: string;
  startDate?: Date;
  endDate?: Date;
  couponCode?: string;
}

export interface SubscriptionPlan {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  amount: number;
  currency: 'USD' | 'BTC' | 'STX' | 'sBTC';
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number; // e.g., every 2 weeks = { interval: 'week', intervalCount: 2 }
  trialDays?: number;
  setupFee?: number;
  usageType: 'licensed' | 'metered'; // Licensed = fixed price, Metered = usage-based
  meteredComponents?: MeteredComponent[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeteredComponent {
  id: string;
  name: string;
  unitName: string; // e.g., "API calls", "GB transferred", "users"
  pricePerUnit: number;
  includedUnits: number; // Free tier
  overage: 'block' | 'charge'; // Block usage or charge overage
}

export interface Subscription {
  id: string;
  merchantId: string;
  customerId: string;
  planId: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  paymentMethod: 'bitcoin' | 'stx' | 'sbtc';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd: boolean;
  lastPaymentDate?: Date;
  nextPaymentDate: Date;
  failedPaymentCount: number;
  totalAmount: number;
  metadata: any;
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  id: string;
  subscriptionId: string;
  componentId: string;
  quantity: number;
  timestamp: Date;
  idempotencyKey?: string;
  metadata?: any;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  merchantId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  paymentId?: string;
  dueDate: Date;
  paidDate?: Date;
  lineItems: InvoiceLineItem[];
  discounts?: InvoiceDiscount[];
  createdAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  type: 'subscription' | 'usage' | 'setup_fee' | 'discount';
  metadata?: any;
}

export interface InvoiceDiscount {
  id: string;
  couponId: string;
  amount: number;
  type: 'fixed' | 'percentage';
}

export interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  retentionRate: number;
}
