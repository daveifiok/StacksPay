import { connectToDatabase } from '@/config/database';
import { Merchant } from '@/models/merchant/Merchant';
import { MerchantData, MerchantMetrics, MerchantSettings, MerchantSubscription, MerchantVerification, WalletSetupOptions } from '@/interfaces/merchant/merchant.interface';
import { webhookService } from '../webhook/webhook-service';



/**
 * Merchant Service - Centralized merchant management
 * 
 * Handles all merchant-related operations including:
 * - Merchant profile management
 * - Wallet setup and verification
 * - API key management
 * - Settings and preferences
 * - Onboarding workflow
 * - Business verification
 */
export class MerchantService {
  
  /**
   * Get merchant by ID
   */
  async getMerchant(merchantId: string): Promise<MerchantData | null> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return null;
      }

      return this.formatMerchantData(merchant);
    } catch (error) {
      console.error('Error getting merchant:', error);
      return null;
    }
  }

  /**
   * Get merchant by email
   */
  async getMerchantByEmail(email: string): Promise<MerchantData | null> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findOne({ email });
      if (!merchant) {
        return null;
      }

      return this.formatMerchantData(merchant);
    } catch (error) {
      console.error('Error getting merchant by email:', error);
      return null;
    }
  }

  /**
   * Get merchant by GitHub ID
   */
  async getMerchantByGitHubId(githubId: string): Promise<MerchantData | null> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findOne({ githubId });
      if (!merchant) {
        return null;
      }

      return this.formatMerchantData(merchant);
    } catch (error) {
      console.error('Error getting merchant by GitHub ID:', error);
      return null;
    }
  }

  /**
   * Get merchant by Stacks address
   */
  async getMerchantByStacksAddress(stacksAddress: string): Promise<MerchantData | null> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findOne({ stacksAddress });
      if (!merchant) {
        return null;
      }

      return this.formatMerchantData(merchant);
    } catch (error) {
      console.error('Error getting merchant by Stacks address:', error);
      return null;
    }
  }

  /**
   * Update merchant profile
   */
  async updateMerchant(merchantId: string, updates: Partial<MerchantData>): Promise<{ success: boolean; merchant?: MerchantData; error?: string }> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findByIdAndUpdate(
        merchantId,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      const formattedMerchant = this.formatMerchantData(merchant);

      // Trigger webhook for merchant update
      await webhookService.triggerWebhook({
        urls: { webhook: merchant.settings?.webhookUrls?.general },
        _id: merchantId,
        type: 'merchant',
        data: formattedMerchant,
        metadata: { updatedFields: Object.keys(updates) }
      }, 'merchant.updated');

      return { success: true, merchant: formattedMerchant };
    } catch (error) {
      console.error('Error updating merchant:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Update failed' 
      };
    }
  }

  /**
   * Setup merchant wallet
   */
  async setupWallet(options: WalletSetupOptions): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(options.merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      // Validate addresses if provided
      if (options.stacksAddress && !this.isValidStacksAddress(options.stacksAddress)) {
        return { success: false, error: 'Invalid Stacks address' };
      }

      if (options.bitcoinAddress && !this.isValidBitcoinAddress(options.bitcoinAddress)) {
        return { success: false, error: 'Invalid Bitcoin address' };
      }

      // Update wallet setup
      const walletSetup = {
        stacksAddress: options.stacksAddress || merchant.walletSetup?.stacksAddress,
        bitcoinAddress: options.bitcoinAddress || merchant.walletSetup?.bitcoinAddress,
        walletProvider: options.walletProvider,
        isConfigured: true,
        configuredAt: new Date(),
      };

      merchant.walletSetup = walletSetup;
      merchant.stacksAddress = options.stacksAddress || merchant.stacksAddress;
      merchant.verification.wallet = true;
      merchant.updatedAt = new Date();

      await merchant.save();

      // Trigger webhook
      await webhookService.triggerWebhook({
        urls: { webhook: merchant.settings?.webhookUrls?.general },
        _id: options.merchantId,
        type: 'merchant',
        data: { walletSetup },
        metadata: { action: 'wallet_setup' }
      }, 'merchant.wallet.configured');

      return { success: true };
    } catch (error) {
      console.error('Error setting up wallet:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Wallet setup failed' 
      };
    }
  }

  /**
   * Update merchant settings
   */
  async updateSettings(merchantId: string, settings: Partial<MerchantSettings>): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      // Merge with existing settings
      merchant.settings = {
        ...merchant.settings,
        ...settings,
      };
      merchant.updatedAt = new Date();

      await merchant.save();

      // Trigger webhook
      await webhookService.triggerWebhook({
        urls: { webhook: merchant.settings?.webhookUrls?.general },
        _id: merchantId,
        type: 'merchant',
        data: { settings: merchant.settings },
        metadata: { action: 'settings_updated' }
      }, 'merchant.settings.updated');

      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Settings update failed' 
      };
    }
  }

  /**
   * Get merchant metrics
   */
  async getMerchantMetrics(merchantId: string, startDate?: Date, endDate?: Date): Promise<MerchantMetrics> {
    await connectToDatabase();
    
    try {
      // In production, this would aggregate from payments, subscriptions, etc.
      // For now, returning placeholder metrics
      return {
        totalPayments: 247,
        totalVolume: 125000, // $1,250.00
        totalRevenue: 3125, // $31.25 (2.5% fee)
        successRate: 94.5,
        averageTransactionValue: 506, // $5.06
        topPaymentMethod: 'sbtc',
        monthlyGrowth: 23.5,
        customerCount: 89,
      };
    } catch (error) {
      console.error('Error getting merchant metrics:', error);
      return {
        totalPayments: 0,
        totalVolume: 0,
        totalRevenue: 0,
        successRate: 0,
        averageTransactionValue: 0,
        topPaymentMethod: 'sbtc',
        monthlyGrowth: 0,
        customerCount: 0,
      };
    }
  }

  /**
   * List merchants (admin function)
   */
  async listMerchants(options: {
    page?: number;
    limit?: number;
    verified?: boolean;
    status?: string;
  } = {}): Promise<{
    merchants: MerchantData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    await connectToDatabase();
    
    try {
      const page = options.page || 1;
      const limit = Math.min(options.limit || 50, 100);
      const skip = (page - 1) * limit;

      const query: any = {};
      if (options.verified !== undefined) {
        query['verification.status'] = options.verified ? 'verified' : { $ne: 'verified' };
      }

      const merchants = await Merchant.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Merchant.countDocuments(query);

      return {
        merchants: merchants.map(merchant => this.formatMerchantData(merchant)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error listing merchants:', error);
      return {
        merchants: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      };
    }
  }

  /**
   * Verify merchant business information
   */
  async verifyBusiness(merchantId: string, verificationData: any): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      // In production, this would integrate with KYC/business verification services
      merchant.verification.business = true;
      merchant.verification.kyc = true;
      merchant.verification.status = 'verified';
      merchant.updatedAt = new Date();

      await merchant.save();

      // Trigger webhook
      await webhookService.triggerWebhook({
        urls: { webhook: merchant.settings?.webhookUrls?.general },
        _id: merchantId,
        type: 'merchant',
        data: { verification: merchant.verification },
        metadata: { action: 'business_verified' }
      }, 'merchant.verified');

      return { success: true };
    } catch (error) {
      console.error('Error verifying business:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      };
    }
  }

  /**
   * Suspend merchant account
   */
  async suspendMerchant(merchantId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      merchant.subscription.status = 'suspended';
      merchant.updatedAt = new Date();

      await merchant.save();

      // Trigger webhook
      await webhookService.triggerWebhook({
        urls: { webhook: merchant.settings?.webhookUrls?.general },
        _id: merchantId,
        type: 'merchant',
        data: { status: 'suspended', reason },
        metadata: { action: 'account_suspended' }
      }, 'merchant.suspended');

      return { success: true };
    } catch (error) {
      console.error('Error suspending merchant:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Suspension failed' 
      };
    }
  }

  /**
   * Format merchant data for API responses
   * Excludes sensitive fields and provides comprehensive merchant information
   */
  /**
   * Format merchant data for API responses
   */
  public formatMerchantData(merchant: any): MerchantData {
    // Count active sessions
    const activeSessionsCount = merchant.sessions?.filter((session: any) => 
      session.expiresAt && new Date(session.expiresAt) > new Date()
    ).length || 0;

    // Format API keys (exclude sensitive data)
    const formattedApiKeys = (merchant.apiKeys || []).map((key: any) => ({
      keyId: key.keyId,
      name: key.name || 'Unnamed Key',
      keyPreview: key.keyPreview,
      permissions: key.permissions || [],
      environment: key.environment || 'test',
      isActive: key.isActive !== false,
      rateLimit: key.rateLimit || 1000,
      ipRestrictions: key.ipRestrictions || [],
      requestCount: key.requestCount || 0,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt || new Date(),
    }));

    // Calculate account level
    let accountLevel: 'basic' | 'verified' | 'premium' | 'enterprise' = 'basic';
    if (merchant.subscription?.plan === 'enterprise') accountLevel = 'enterprise';
    else if (merchant.subscription?.plan === 'professional') accountLevel = 'premium';
    else if (merchant.emailVerified && merchant.verification?.status === 'verified') accountLevel = 'verified';

    return {
      id: merchant._id.toString(),
      name: merchant.name,
      email: merchant.email,
      businessName: merchant.businessName || merchant.name,
      businessType: merchant.businessType || 'individual',
      website: merchant.website,
      phone: merchant.phone,
      address: merchant.address,
      stacksAddress: merchant.stacksAddress,
      bitcoinAddress: merchant.bitcoinAddress,

      // Payment Preferences
      paymentPreferences: {
        acceptBitcoin: merchant.paymentPreferences?.acceptBitcoin !== false,
        acceptSTX: merchant.paymentPreferences?.acceptSTX !== false,
        acceptsBTC: merchant.paymentPreferences?.acceptsBTC !== false,
        preferredCurrency: merchant.paymentPreferences?.preferredCurrency || 'sbtc',
        autoConvertToUSD: merchant.paymentPreferences?.autoConvertToUSD || false,
        usdConversionMethod: merchant.paymentPreferences?.usdConversionMethod || 'coinbase',
      },

      // Wallet Setup
      walletSetup: {
        sBTCWallet: {
          address: merchant.walletSetup?.sBTCWallet?.address || merchant.stacksAddress,
          isConfigured: merchant.walletSetup?.sBTCWallet?.isConfigured || !!merchant.stacksAddress,
        },
        usdWallet: {
          bankAccount: merchant.walletSetup?.usdWallet?.bankAccount,
          exchangeAccount: merchant.walletSetup?.usdWallet?.exchangeAccount,
          stablecoinAddress: merchant.walletSetup?.usdWallet?.stablecoinAddress,
          isConfigured: merchant.walletSetup?.usdWallet?.isConfigured || false,
        },
      },

      // sBTC Settings
      sbtcSettings: {
        autoConvert: merchant.sbtcSettings?.autoConvert || false,
        minAmount: merchant.sbtcSettings?.minAmount || 10000, // 0.0001 BTC in sats
        maxAmount: merchant.sbtcSettings?.maxAmount || 100000000, // 1 BTC in sats
        confirmationThreshold: merchant.sbtcSettings?.confirmationThreshold || 6,
      },

      // API Keys
      apiKeys: formattedApiKeys,

      // Security & Authentication
      security: {
        emailVerified: merchant.emailVerified || false,
        twoFactorEnabled: merchant.twoFactorEnabled || false,
        verificationLevel: merchant.verificationLevel || 'none',
        lastLoginAt: merchant.lastLoginAt,
        lastLoginIP: merchant.lastLoginIP,
        activeSessionsCount,
      },

      // Settings
      settings: {
        webhookUrls: {
          payment: merchant.settings?.webhookUrls?.payment,
          subscription: merchant.settings?.webhookUrls?.subscription,
          general: merchant.settings?.webhookUrls?.general || merchant.webhookUrl,
        },
        notifications: {
          email: merchant.settings?.notifications?.email !== false,
          sms: merchant.settings?.notifications?.sms || false,
          webhook: merchant.settings?.notifications?.webhook !== false,
          loginAlerts: merchant.settings?.notifications?.loginAlerts !== false,
          paymentAlerts: merchant.settings?.notifications?.paymentAlerts !== false,
          securityAlerts: merchant.settings?.notifications?.securityAlerts !== false,
        },
        paymentMethods: {
          bitcoin: merchant.settings?.paymentMethods?.bitcoin !== false,
          stx: merchant.settings?.paymentMethods?.stx !== false,
          sbtc: merchant.settings?.paymentMethods?.sbtc !== false,
        },
        autoConvert: {
          enabled: merchant.settings?.autoConvert?.enabled || false,
          targetCurrency: merchant.settings?.autoConvert?.targetCurrency || 'USD',
        },
        feeTier: merchant.settings?.feeTier || 'starter',
        timezone: merchant.settings?.timezone || 'UTC',
        currency: merchant.settings?.currency || 'USD',
        language: merchant.settings?.language || 'en',
      },

      // Verification
      verification: {
        email: merchant.emailVerified || false,
        phone: merchant.verification?.phone || false,
        business: merchant.verification?.business || false,
        kyc: merchant.verification?.kyc || false,
        wallet: merchant.verification?.wallet || !!merchant.stacksAddress,
        bankAccount: merchant.verification?.bankAccount || false,
        status: merchant.verification?.status || (merchant.emailVerified ? 'pending' : 'pending'),
        rejectionReason: merchant.verification?.rejectionReason,
        verifiedAt: merchant.verification?.verifiedAt,
        documents: {
          businessLicense: merchant.verification?.documents?.businessLicense || false,
          taxId: merchant.verification?.documents?.taxId || false,
          bankStatement: merchant.verification?.documents?.bankStatement || false,
          identity: merchant.verification?.documents?.identity || false,
        },
      },

      // Subscription
      subscription: {
        plan: merchant.subscription?.plan || 'free',
        status: merchant.subscription?.status || 'active',
        billingCycle: merchant.subscription?.billingCycle || 'monthly',
        nextBillingDate: merchant.subscription?.nextBillingDate,
        currentPeriodStart: merchant.subscription?.currentPeriodStart,
        currentPeriodEnd: merchant.subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: merchant.subscription?.cancelAtPeriodEnd || false,
        features: merchant.subscription?.features || this.getFeaturesByPlan(merchant.subscription?.plan || 'free'),
        limits: this.getLimitsByPlan(merchant.subscription?.plan || 'free'),
        usage: {
          currentTransactions: merchant.stats?.totalPayments || 0,
          currentVolume: merchant.stats?.totalVolume || 0,
          currentApiRequests: this.calculateCurrentApiRequests(merchant.apiKeys || []),
        },
      },

      // Webhook Configuration
      webhook: merchant.webhookUrl ? {
        url: merchant.webhookUrl,
        events: merchant.webhookEvents || [],
        isActive: !!merchant.webhookUrl,
      } : undefined,

      // Account Status
      status: {
        isActive: merchant.isActive !== false,
        isVerified: merchant.isVerified || false,
        accountLevel,
        restrictions: this.getAccountRestrictions(merchant),
      },

      // Statistics
      stats: {
        totalPayments: merchant.stats?.totalPayments || 0,
        totalVolume: merchant.stats?.totalVolume || 0,
        lastPaymentAt: merchant.stats?.lastPaymentAt,
        joinedDate: merchant.createdAt || new Date(),
        totalApiRequests: this.calculateTotalApiRequests(merchant.apiKeys || []),
        averageTransactionValue: this.calculateAverageTransactionValue(merchant.stats),
      },

      // Timestamps
      createdAt: merchant.createdAt || new Date(),
      updatedAt: merchant.updatedAt || new Date(),
    };
  }

  /**
   * Format merchant data for authentication responses
   */
  public formatMerchantForAuth(merchant: any) {
    return {
      id: merchant._id.toString(),
      name: merchant.name,
      email: merchant.email,
      stacksAddress: merchant.stacksAddress,
      emailVerified: merchant.emailVerified || false,
      twoFactorEnabled: merchant.twoFactorEnabled || false,
      verificationLevel: merchant.verificationLevel || 'none',
    };
  }

  /**
   * Default merchant settings
   */
  private getDefaultSettings(): MerchantSettings {
    return {
      webhookUrls: {},
      notifications: {
        email: true,
        sms: false,
        webhook: true,
        loginAlerts: true,
        paymentAlerts: true,
        securityAlerts: true,
      },
      paymentMethods: {
        bitcoin: true,
        stx: true,
        sbtc: true,
      },
      autoConvert: {
        enabled: false,
        targetCurrency: 'sBTC',
      },
      feeTier: 'starter',
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
    };
  }

  /**
   * Default verification status
   */
  private getDefaultVerification(): MerchantVerification {
    return {
      email: false,
      phone: false,
      business: false,
      kyc: false,
      wallet: false,
      bankAccount: false,
      status: 'pending',
      documents: {
        businessLicense: false,
        taxId: false,
        bankStatement: false,
        identity: false,
      },
    };
  }

  /**
   * Default subscription
   */
  private getDefaultSubscription(): MerchantSubscription {
    return {
      plan: 'free',
      status: 'active',
      billingCycle: 'monthly',
      features: this.getFeaturesByPlan('free'),
      limits: this.getLimitsByPlan('free'),
      usage: {
        currentTransactions: 0,
        currentVolume: 0,
        currentApiRequests: 0,
      },
    };
  }

  /**
   * Get features by subscription plan
   */
  private getFeaturesByPlan(plan: string): string[] {
    const features = {
      free: ['basic_payments', 'api_access', '5_transactions_month'],
      starter: ['basic_payments', 'api_access', 'webhook_support', '100_transactions_month', 'email_support'],
      professional: ['all_starter_features', 'advanced_analytics', '1000_transactions_month', 'priority_support', 'custom_branding'],
      enterprise: ['all_professional_features', 'unlimited_transactions', 'dedicated_support', 'custom_integrations', 'sla_guarantee'],
    };
    return features[plan as keyof typeof features] || features.free;
  }

  /**
   * Get limits by subscription plan
   */
  private getLimitsByPlan(plan: string): MerchantSubscription['limits'] {
    const limits = {
      free: {
        monthlyTransactions: 5,
        monthlyVolume: 10000, // $100 in cents
        apiRequests: 1000,
        webhookEndpoints: 1,
      },
      starter: {
        monthlyTransactions: 100,
        monthlyVolume: 1000000, // $10,000 in cents
        apiRequests: 10000,
        webhookEndpoints: 3,
      },
      professional: {
        monthlyTransactions: 1000,
        monthlyVolume: 10000000, // $100,000 in cents
        apiRequests: 100000,
        webhookEndpoints: 10,
      },
      enterprise: {
        monthlyTransactions: -1, // unlimited
        monthlyVolume: -1, // unlimited
        apiRequests: -1, // unlimited
        webhookEndpoints: -1, // unlimited
      },
    };
    return limits[plan as keyof typeof limits] || limits.free;
  }

  /**
   * Calculate current API requests from API keys
   */
  private calculateCurrentApiRequests(apiKeys: any[]): number {
    return apiKeys.reduce((total, key) => total + (key.requestCount || 0), 0);
  }

  /**
   * Calculate total API requests from API keys
   */
  private calculateTotalApiRequests(apiKeys: any[]): number {
    return apiKeys.reduce((total, key) => total + (key.requestCount || 0), 0);
  }

  /**
   * Calculate average transaction value
   */
  private calculateAverageTransactionValue(stats: any): number {
    if (!stats || !stats.totalPayments || stats.totalPayments === 0) {
      return 0;
    }
    return Math.round(stats.totalVolume / stats.totalPayments);
  }

  /**
   * Get account restrictions based on merchant status
   */
  private getAccountRestrictions(merchant: any): string[] {
    const restrictions: string[] = [];

    if (!merchant.emailVerified) {
      restrictions.push('email_verification_required');
    }

    if (!merchant.verification?.kyc) {
      restrictions.push('kyc_verification_required');
    }

    if (!merchant.stacksAddress) {
      restrictions.push('wallet_setup_required');
    }

    if (merchant.subscription?.status === 'suspended') {
      restrictions.push('account_suspended');
    }

    if (merchant.loginAttempts >= 5) {
      restrictions.push('security_review');
    }

    return restrictions;
  }

  /**
   * Validate Stacks address
   */
  private isValidStacksAddress(address: string): boolean {
    // Basic Stacks address validation (SP/SM prefix + 39 characters)
    return /^S[PM][0-9A-Z]{39}$/.test(address);
  }

  /**
   * Validate Bitcoin address
   */
  private isValidBitcoinAddress(address: string): boolean {
    // Basic Bitcoin address validation (simplified)
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || // P2PKH/P2SH
           /^bc1[a-z0-9]{39,59}$/.test(address); // Bech32
  }
}

export const merchantService = new MerchantService();