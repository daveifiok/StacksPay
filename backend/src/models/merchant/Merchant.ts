import { Schema, model, models, Document } from 'mongoose';

export interface IMerchant extends Document {
  name: string;
  email?: string;
  businessType: string;
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
  passwordHash?: string;
  generatedPassword?: string; // Stores the generated password for wallet users who haven't updated it yet
  hasUpdatedPassword: boolean; // Track if user has updated their password from generated one
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  authMethod: 'email' | 'wallet' | 'google' | 'github';
  googleId?: string;
  githubId?: string;
  githubUsername?: string;
  avatar?: string;
  loginMethod?: 'email' | 'wallet' | 'google' | 'github';
  requiresEmailVerification?: boolean;
  stacksAddress?: string;
  bitcoinAddress?: string;
  paymentPreferences: {
    acceptBitcoin: boolean;
    acceptSTX: boolean;
    acceptsBTC: boolean;
    preferredCurrency: 'sbtc' | 'usd' | 'usdt';
    autoConvertToUSD: boolean;
    usdConversionMethod: 'coinbase' | 'kraken' | 'binance' | 'manual';
  };
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
  // Add wallet balances and addresses
  walletBalances: {
    stxBalance: {
      amount: string; // Store as string to preserve precision
      lastUpdated: Date;
    };
    btcBalance: {
      amount: string;
      lastUpdated: Date;
    };
    sbtcBalance: {
      amount: string;
      lastUpdated: Date;
    };
  };
  // Store actual wallet addresses from connected wallets
  connectedWallets: {
    stacksAddress?: string;
    bitcoinAddress?: string;
    lastConnected?: Date;
    walletType?: string; // 'leather', 'xverse', etc.
  };
  sbtcSettings: {
    autoConvert: boolean;
    minAmount: number;
    maxAmount: number;
    confirmationThreshold: number;
  };
  apiKeys: Array<{
    keyId: string;
    keyHash: string;
    keyPreview: string;
    name: string;
    permissions: string[];
    environment: 'test' | 'live';
    isActive: boolean;
    createdAt?: Date;
    lastUsed?: Date;
    expiresAt?: Date;
    ipRestrictions?: string[];
    rateLimit: number;
    requestCount?: number;
  }>;
  sessions: Array<{
    sessionId: string;
    tokenHash: string;
    createdAt?: Date;
    expiresAt?: Date;
    lastActivity?: Date;
    ipAddress?: string;
    userAgent?: string;
  }>;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorTempSecret?: string;
  twoFactorBackupCodes?: Array<{
    code: string;
    used: boolean;
    createdAt: Date;
    usedAt?: Date;
  }>;
  twoFactorRecoveryToken?: string;
  twoFactorRecoveryExpires?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIP?: string;
  passwordResetAttempts?: number;
  passwordResetLockUntil?: Date;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEvents?: string[];
  isActive: boolean;
  isVerified: boolean;
  verificationLevel: 'none' | 'basic' | 'full';
  notificationPreferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    webhookNotifications: boolean;
    paymentAlerts: boolean;
    securityAlerts: boolean;
    marketingEmails: boolean;
  };
  stats: {
    totalPayments: number;
    totalVolume: number;
    lastPaymentAt?: Date;
  };
  
  // Account linking fields
  linkedAccounts?: Array<{
    accountId: string;
    authMethod: string;
    email?: string;
    stacksAddress?: string;
    googleId?: string;
    githubId?: string;
    linkedAt: Date;
    isPrimary: boolean;
  }>;
  pendingLinkingRequests?: Array<{
    primaryAccountId: string;
    secondaryAccountId: string;
    linkingToken: string;
    expiresAt: Date;
    confirmedAt?: Date;
    status: 'pending' | 'confirmed' | 'expired' | 'rejected';
  }>;
  primaryAuthMethod?: string;
  isLinkedAccount?: boolean;
  linkedToPrimary?: string;

  // Onboarding tracking
  onboarding: {
    isComplete: boolean;
    currentStep: number;
    completedSteps: string[];
    startedAt?: Date;
    completedAt?: Date;
    stepsData: {
      businessInfo?: {
        completed: boolean;
        completedAt?: Date;
      };
      walletSetup?: {
        completed: boolean;
        completedAt?: Date;
        walletType?: string;
      };
      paymentPreferences?: {
        completed: boolean;
        completedAt?: Date;
      };
      apiKeys?: {
        completed: boolean;
        completedAt?: Date;
        testKeyGenerated: boolean;
        liveKeyGenerated: boolean;
      };
      webhookSetup?: {
        completed: boolean;
        completedAt?: Date;
        webhookUrlConfigured: boolean;
        webhookTested: boolean;
      };
      chainhookSetup?: {
        completed: boolean;
        completedAt?: Date;
        predicatesRegistered: boolean;
      };
      testPayment?: {
        completed: boolean;
        completedAt?: Date;
        testPaymentId?: string;
        testSuccessful: boolean;
      };
      goLive?: {
        completed: boolean;
        completedAt?: Date;
        liveKeysActivated: boolean;
      };
    };
  };

  // Webhook configuration
  webhooks?: {
    secret?: string;
    url?: string;
    events?: string[];
    isConfigured: boolean;
    lastTested?: Date;
    lastDelivery?: Date;
  };

  // Chainhook configuration for STX monitoring
  chainhook?: {
    isConfigured: boolean;
    predicateIds?: string[];
    monitoredAddresses?: string[];
    configuredAt?: Date;
    predicateConfigs?: any[]; // Store predicate configurations for reference
  };
}

const merchantSchema = new Schema<IMerchant>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false, // Allow empty email for wallet registrations
    // No default value - field will be undefined if not provided
  },
  businessType: {
    type: String,
    required: true,
  },
  website: String,
  businessDescription: String,
  phone: String,
  address: String,
  city: String,
  postalCode: String,
  country: String,
  taxId: String,
  timezone: {
    type: String,
    default: 'America/New_York',
  },
  language: {
    type: String,
    default: 'en',
  },

  passwordHash: String,
  generatedPassword: String, // Stores the generated password for wallet users who haven't updated it yet
  hasUpdatedPassword: {
    type: Boolean,
    default: false, // Default false for new accounts
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Track how user registered/authenticated
  authMethod: {
    type: String,
    enum: ['email', 'wallet', 'google', 'github'],
    default: 'email',
  },
  
  // OAuth provider IDs for social authentication
  googleId: {
    type: String,
    required: false,
  },
  githubId: {
    type: String,
    required: false,
  },
  githubUsername: {
    type: String,
    required: false,
  },
  avatar: {
    type: String,
    required: false,
  },
  loginMethod: {
    type: String,
    enum: ['email', 'wallet', 'google', 'github'],
    required: false,
  },
  requiresEmailVerification: {
    type: Boolean,
    default: false,
  },

  stacksAddress: {
    type: String,
    required: false,
  },
  bitcoinAddress: String,
  
  paymentPreferences: {
    acceptBitcoin: {
      type: Boolean,
      default: true,
    },
    acceptSTX: {
      type: Boolean,
      default: true,
    },
    acceptsBTC: {
      type: Boolean,
      default: true,
    },
    preferredCurrency: {
      type: String,
      enum: ['sbtc', 'usd', 'usdt'],
      default: 'sbtc',
    },
    autoConvertToUSD: {
      type: Boolean,
      default: false,
    },
    usdConversionMethod: {
      type: String,
      enum: ['coinbase', 'kraken', 'binance', 'manual'],
      default: 'coinbase',
    },
  },
  
  walletSetup: {
    sBTCWallet: {
      address: String,
      isConfigured: {
        type: Boolean,
        default: false,
      },
    },
    usdWallet: {
      bankAccount: String,
      exchangeAccount: String,
      stablecoinAddress: String,
      isConfigured: {
        type: Boolean,
        default: false,
      },
    },
  },

  // Add wallet balances and addresses
  walletBalances: {
    stxBalance: {
      amount: {
        type: String,
        default: '0',
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    btcBalance: {
      amount: {
        type: String,
        default: '0',
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    sbtcBalance: {
      amount: {
        type: String,
        default: '0',
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
  },

  // Store actual wallet addresses from connected wallets
  connectedWallets: {
    stacksAddress: String,
    bitcoinAddress: String,
    lastConnected: Date,
    walletType: String, // 'leather', 'xverse', etc.
  },
  
  sbtcSettings: {
    autoConvert: {
      type: Boolean,
      default: false,
    },
    minAmount: {
      type: Number,
      default: 10000,
    },
    maxAmount: {
      type: Number,
      default: 100000000,
    },
    confirmationThreshold: {
      type: Number,
      default: 6,
    },
  },

  apiKeys: [
    {
      keyId: String,
      keyHash: String,
      keyPreview: String,
      name: String,
      permissions: [String],
      environment: {
        type: String,
        enum: ['test', 'live'],
        default: 'test',
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      createdAt: Date,
      lastUsed: Date,
      expiresAt: Date,
      ipRestrictions: [String],
      rateLimit: {
        type: Number,
        default: 1000,
      },
      requestCount: {
        type: Number,
        default: 0,
      },
    },
  ],

  sessions: [
    {
      sessionId: String,
      tokenHash: String,
      createdAt: Date,
      expiresAt: Date,
      lastActivity: Date,
      ipAddress: String,
      userAgent: String,
      location: String,
      deviceFingerprint: String,
    },
  ],

  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: String,
  twoFactorTempSecret: String,
  twoFactorBackupCodes: [
    {
      code: String,
      used: {
        type: Boolean,
        default: false,
      },
      createdAt: Date,
      usedAt: Date,
    },
  ],
  twoFactorRecoveryToken: String,
  twoFactorRecoveryExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  lastLoginAt: Date,
  lastLoginIP: String,
  passwordResetAttempts: {
    type: Number,
    default: 0,
  },
  passwordResetLockUntil: Date,

  webhookUrl: String,
  webhookSecret: String,
  webhookEvents: [String],

  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationLevel: {
    type: String,
    enum: ['none', 'basic', 'full'],
    default: 'none',
  },

  notificationPreferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    webhookNotifications: {
      type: Boolean,
      default: true,
    },
    paymentAlerts: {
      type: Boolean,
      default: true,
    },
    securityAlerts: {
      type: Boolean,
      default: true,
    },
    marketingEmails: {
      type: Boolean,
      default: false,
    },
  },

  stats: {
    totalPayments: {
      type: Number,
      default: 0,
    },
    totalVolume: {
      type: Number,
      default: 0,
    },
    lastPaymentAt: Date,
  },

  // Account linking fields
  linkedAccounts: [
    {
      accountId: {
        type: String,
        required: true,
      },
      authMethod: {
        type: String,
        required: true,
      },
      email: String,
      stacksAddress: String,
      googleId: String,
      githubId: String,
      linkedAt: {
        type: Date,
        default: Date.now,
      },
      isPrimary: {
        type: Boolean,
        default: false,
      },
    },
  ],
  pendingLinkingRequests: [
    {
      primaryAccountId: String,
      secondaryAccountId: String,
      linkingToken: String,
      expiresAt: Date,
      confirmedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'expired', 'rejected'],
        default: 'pending',
      },
    },
  ],
  primaryAuthMethod: String,
  isLinkedAccount: {
    type: Boolean,
    default: false,
  },
  linkedToPrimary: String,

  // Onboarding tracking schema
  onboarding: {
    isComplete: {
      type: Boolean,
      default: false
    },
    currentStep: {
      type: Number,
      default: 0
    },
    completedSteps: {
      type: [String],
      default: []
    },
    startedAt: Date,
    completedAt: Date,
    stepsData: {
      businessInfo: {
        completed: { type: Boolean, default: false },
        completedAt: Date
      },
      walletSetup: {
        completed: { type: Boolean, default: false },
        completedAt: Date,
        walletType: String
      },
      paymentPreferences: {
        completed: { type: Boolean, default: false },
        completedAt: Date
      },
      apiKeys: {
        completed: { type: Boolean, default: false },
        completedAt: Date,
        testKeyGenerated: { type: Boolean, default: false },
        liveKeyGenerated: { type: Boolean, default: false }
      },
      webhookSetup: {
        completed: { type: Boolean, default: false },
        completedAt: Date,
        webhookUrlConfigured: { type: Boolean, default: false },
        webhookTested: { type: Boolean, default: false }
      },
      chainhookSetup: {
        completed: { type: Boolean, default: false },
        completedAt: Date,
        predicatesRegistered: { type: Boolean, default: false }
      },
      testPayment: {
        completed: { type: Boolean, default: false },
        completedAt: Date,
        testPaymentId: String,
        testSuccessful: { type: Boolean, default: false }
      },
      goLive: {
        completed: { type: Boolean, default: false },
        completedAt: Date,
        liveKeysActivated: { type: Boolean, default: false }
      }
    }
  },

  // Webhook configuration schema
  webhooks: {
    secret: String,
    url: String,
    events: [String],
    isConfigured: {
      type: Boolean,
      default: false
    },
    lastTested: Date,
    lastDelivery: Date
  },

  // Chainhook configuration schema
  chainhook: {
    isConfigured: {
      type: Boolean,
      default: false
    },
    predicateIds: [String],
    monitoredAddresses: [String],
    configuredAt: Date,
    predicateConfigs: [Schema.Types.Mixed] // Store predicate configurations
  }
}, {
  timestamps: true,
  collection: 'merchants'
});

// Create partial index that only applies to documents with email field present
merchantSchema.index(
  { email: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { 
      email: { $type: "string" } 
    },
    name: 'email_1_partial'
  }
);
merchantSchema.index({ stacksAddress: 1 });
merchantSchema.index({ isActive: 1 });
merchantSchema.index({ 'apiKeys.keyId': 1 });
merchantSchema.index({ 'sessions.sessionId': 1 });
merchantSchema.index({ 'linkedAccounts.accountId': 1 });
merchantSchema.index({ 'pendingLinkingRequests.linkingToken': 1 });
merchantSchema.index({ linkedToPrimary: 1 });
merchantSchema.index({ googleId: 1 });
merchantSchema.index({ githubId: 1 });
merchantSchema.index({ 'onboarding.isComplete': 1 });
merchantSchema.index({ 'onboarding.currentStep': 1 });
merchantSchema.index({ 'webhooks.isConfigured': 1 });
merchantSchema.index({ 'chainhook.isConfigured': 1 });

export const Merchant = models?.Merchant || model<IMerchant>('Merchant', merchantSchema);