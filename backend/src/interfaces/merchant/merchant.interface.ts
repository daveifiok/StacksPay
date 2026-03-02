export interface MerchantData {
  id: string;
  name: string;
  email: string;
  businessName: string;
  businessType: string;
  website?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  stacksAddress?: string;
  bitcoinAddress?: string;
  
  // Payment Preferences
  paymentPreferences: {
    acceptBitcoin: boolean;
    acceptSTX: boolean;
    acceptsBTC: boolean;
    preferredCurrency: 'sbtc' | 'usd' | 'usdt';
    autoConvertToUSD: boolean;
    usdConversionMethod: 'coinbase' | 'kraken' | 'binance' | 'manual';
  };

  // Wallet Setup
  walletSetup: {
    sBTCWallet: {
      address?: string;
      isConfigured: boolean;
    };
    usdWallet: {
      bankAccount?: string;
      exchangeAccount?: string;
      stablecoinAddress?: string;
      isConfigured: boolean;
    };
  };

  // sBTC Settings
  sbtcSettings: {
    autoConvert: boolean;
    minAmount: number;
    maxAmount: number;
    confirmationThreshold: number;
  };

  // API Keys (excluding sensitive data)
  apiKeys: ApiKey[];

  // Security & Authentication
  security: {
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    verificationLevel: 'none' | 'basic' | 'full';
    lastLoginAt?: Date;
    lastLoginIP?: string;
    activeSessionsCount: number;
  };

  // Settings
  settings: MerchantSettings;
  
  // Verification Status
  verification: MerchantVerification;
  
  // Subscription
  subscription: MerchantSubscription;

  // Webhook Configuration
  webhook?: {
    url?: string;
    events?: string[];
    isActive: boolean;
  };

  // Account Status
  status: {
    isActive: boolean;
    isVerified: boolean;
    accountLevel: 'basic' | 'verified' | 'premium' | 'enterprise';
    restrictions?: string[];
  };

  // Statistics
  stats: {
    totalPayments: number;
    totalVolume: number;
    lastPaymentAt?: Date;
    joinedDate: Date;
    totalApiRequests?: number;
    averageTransactionValue?: number;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  keyId: string;
  name: string;
  keyPreview: string; // Only show preview, not full key
  permissions: string[];
  environment: 'test' | 'live';
  isActive: boolean;
  rateLimit: number;
  ipRestrictions?: string[];
  requestCount?: number;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface MerchantSettings {
  webhookUrls: {
    payment?: string;
    subscription?: string;
    general?: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    webhook: boolean;
    loginAlerts: boolean;
    paymentAlerts: boolean;
    securityAlerts: boolean;
  };
  paymentMethods: {
    bitcoin: boolean;
    stx: boolean;
    sbtc: boolean;
  };
  autoConvert: {
    enabled: boolean;
    targetCurrency: 'USD' | 'USDC' | 'sBTC';
    threshold?: number;
  };
  feeTier: 'starter' | 'professional' | 'enterprise';
  timezone?: string;
  currency: string;
  language: string;
}

export interface MerchantVerification {
  email: boolean;
  phone: boolean;
  business: boolean;
  kyc: boolean;
  wallet: boolean;
  bankAccount: boolean;
  status: 'pending' | 'verified' | 'rejected' | 'under_review';
  rejectionReason?: string;
  verifiedAt?: Date;
  documents?: {
    businessLicense?: boolean;
    taxId?: boolean;
    bankStatement?: boolean;
    identity?: boolean;
  };
}

export interface MerchantSubscription {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  features: string[];
  limits: {
    monthlyTransactions: number;
    monthlyVolume: number;
    apiRequests: number;
    webhookEndpoints: number;
  };
  usage: {
    currentTransactions: number;
    currentVolume: number;
    currentApiRequests: number;
  };
}

export interface MerchantMetrics {
  totalPayments: number;
  totalVolume: number;
  totalRevenue: number;
  successRate: number;
  averageTransactionValue: number;
  topPaymentMethod: string;
  monthlyGrowth: number;
  customerCount: number;
}

export interface WalletSetupOptions {
  merchantId: string;
  stacksAddress?: string;
  bitcoinAddress?: string;
  walletProvider: 'hiro' | 'xverse' | 'leather' | 'asigna' | 'other';
  signatureProof?: string;
}