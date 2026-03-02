import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Joi from 'joi';
import { AuthEvent } from '@/models/auth/auth-event';
import { ApiKey } from '@/models/apikey/ApiKey';
import { connectToDatabase } from '@/config/database';
import { webhookService } from '../webhook/webhook-service';
import { emailService } from '../email/email-service';
import { twoFactorService } from '../auth/two-factor-service';
import { sessionService } from '../auth/session-service';
import { rateLimitService } from '../auth/rate-limit-service';
import { merchantService } from '../merchant/merchant-service';
import {
  ApiKeyResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  EmailVerificationRequest,
  ApiKeyCreateRequest,
} from '@/interfaces/auth/auth.interface';
import { Merchant } from '@/models/merchant/Merchant';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
  private readonly PASSWORD_MIN_LENGTH = 8;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  

  /**
   * Register new merchant with enhanced validation and security
   */
  async register(data: RegisterRequest, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    return this.registerMerchant(data, ipAddress, userAgent, false);
  }

  /**
   * Register new merchant via wallet with relaxed email requirements
   */
  async registerWithWallet(data: RegisterRequest, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    return this.registerMerchant(data, ipAddress, userAgent, true);
  }

  /**
   * Core registration logic that handles both email and wallet registrations
   */
  private async registerMerchant(
    data: RegisterRequest, 
    ipAddress: string, 
    userAgent: string, 
    isWalletRegistration: boolean
  ): Promise<AuthResponse> {
    await connectToDatabase();

    try {
      // Validate input (different validation for wallet vs email registration)
      const validation = this.validateRegistrationData(data, isWalletRegistration);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      // Check rate limiting
      const rateLimitCheck = await rateLimitService.checkApiKeyRateLimit(
        `register:${ipAddress}`, 
        3, // 3 registration attempts per hour
        60 * 60 * 1000
      );
      
      if (!rateLimitCheck.allowed) {
        await this.logAuthEvent(null, 'register_rate_limited', ipAddress, false, { 
          remainingTime: rateLimitCheck.resetTime.getTime() - Date.now() 
        });
        return { 
          success: false, 
          error: 'Too many registration attempts. Please try again later.' 
        };
      }

      // Check if merchant already exists (skip email check for wallet registration with empty email)
      if (data.email && data.email.trim()) {
        const existingMerchant = await Merchant.findOne({ email: data.email.toLowerCase() });
        if (existingMerchant) {
          await this.logAuthEvent(null, 'register_duplicate_email', ipAddress, false, { 
            email: this.maskEmail(data.email) 
          });
          return { success: false, error: 'Email already registered' };
        }
      }

      // Validate Stacks address format if provided
      if (data.stacksAddress && !this.isValidStacksAddress(data.stacksAddress)) {
        return { success: false, error: 'Invalid Stacks address format' };
      }

      // Hash password with high cost factor
      const passwordHash = await bcrypt.hash(data.password, 14);
      
      // Generate email verification token only if email is provided
      const hasRealEmail = data.email && data.email.trim() && !data.email.includes('@wallet.local');
      const emailVerificationToken = hasRealEmail ? 
        crypto.randomBytes(32).toString('hex') : 
        undefined;

      // Create merchant with enhanced security fields
      const merchantData: any = {
        name: data.name.trim(),
        passwordHash,
        businessType: data.businessType,
        stacksAddress: data.stacksAddress,
        website: data.website,
        emailVerificationToken,
        emailVerified: hasRealEmail ? false : false, // All emails need verification, placeholders are false
        authMethod: isWalletRegistration ? 'wallet' : 'email', // Track registration method
        twoFactorEnabled: false,
        loginAttempts: 0,
        isActive: true,
        verificationLevel: isWalletRegistration ? 'basic' : 'none', // Wallet signature = basic verification
        hasUpdatedPassword: false, // Track if user has updated from generated password
        requiresEmailVerification: !hasRealEmail, // Flag for users who need to add email
        stats: {
          totalPayments: 0,
          totalVolume: 0,
        },
      };

      // For wallet registrations, store the generated password so user can see it until they update it
      if (isWalletRegistration) {
        merchantData.generatedPassword = data.password;
      }

      // Only set email if provided and not empty
      if (data.email && data.email.trim()) {
        merchantData.email = data.email.toLowerCase().trim();
      }

      const merchant = new Merchant(merchantData);

      await merchant.save();

      // Generate initial test API key
      const testApiKey = await this.generateApiKey(
        merchant._id.toString(), 
        { 
          name: 'Default Test Key',
          permissions: ['read', 'write'], 
          environment: 'test',
          rateLimit: 100,
        }
      );

      // Send welcome email with verification only for email registrations
      if (!isWalletRegistration && merchant.email && emailVerificationToken) {
        await emailService.sendWelcomeEmail(merchant.email, {
          merchantName: merchant.name,
          businessType: data.businessType,
          stacksAddress: data.stacksAddress,
          verificationToken: emailVerificationToken,
        });
      }

      // Log successful registration
      await this.logAuthEvent(merchant._id.toString(), 'register', ipAddress, true, {
        businessType: data.businessType,
        hasWebsite: !!data.website,
        hasStacksAddress: !!data.stacksAddress,
        userAgent: this.truncateUserAgent(userAgent),
        registrationType: isWalletRegistration ? 'wallet' : 'email',
      });

      // Trigger webhook for new merchant registration
      await webhookService.triggerWebhook({
        urls: { webhook: `${process.env.SYSTEM_WEBHOOK_URL || 'https://api.system.com'}/merchants` },
        _id: merchant._id.toString(),
        type: 'merchant',
        merchantId: merchant._id.toString(),
        data: {
          name: merchant.name,
          email: merchant.email,
          businessType: data.businessType,
          hasWebsite: !!data.website,
          stacksAddress: merchant.stacksAddress,
          emailVerified: merchant.emailVerified,
        },
        metadata: { ipAddress, userAgent: this.truncateUserAgent(userAgent) }
      }, 'merchant.registered');

      return {
        success: true,
        merchant: this.formatMerchantForAuth(merchant),
        apiKey: testApiKey,
      };
    } catch (error) {
      console.error('Registration error:', error);
      await this.logAuthEvent(null, 'register_error', ipAddress, false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  /**
   * Enhanced login with 2FA support and security monitoring
   */
  async login(data: LoginRequest, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    await connectToDatabase();

    try {
      // Validate input
      const validation = this.validateLoginData(data);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      // Check rate limiting
      const rateLimitCheck = await rateLimitService.checkApiKeyRateLimit(
        `login:${ipAddress}`, 
        10, // 10 login attempts per 15 minutes
        15 * 60 * 1000
      );
      
      if (!rateLimitCheck.allowed) {
        await this.logAuthEvent(null, 'login_rate_limited', ipAddress, false);
        return { 
          success: false, 
          error: 'Too many login attempts. Please try again later.' 
        };
      }

      // Find merchant
      const merchant = await Merchant.findOne({ email: data.email.toLowerCase() });
      if (!merchant) {
        await this.logAuthEvent(null, 'login_invalid_email', ipAddress, false, { 
          email: this.maskEmail(data.email) 
        });
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if account is locked
      if (merchant.lockUntil && merchant.lockUntil > new Date()) {
        const lockTimeRemaining = merchant.lockUntil.getTime() - Date.now();
        await this.logAuthEvent(merchant._id.toString(), 'login_account_locked', ipAddress, false, { 
          lockTimeRemaining: Math.ceil(lockTimeRemaining / 1000) 
        });
        return { 
          success: false, 
          error: 'Account temporarily locked. Please try again later.',
          lockoutTimeRemaining: lockTimeRemaining,
        };
      }

      // Check if account is active
      if (!merchant.isActive) {
        await this.logAuthEvent(merchant._id.toString(), 'login_account_disabled', ipAddress, false);
        return { success: false, error: 'Account has been disabled. Please contact support.' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, merchant.passwordHash!);
      if (!isValidPassword) {
        return await this.handleFailedLogin(merchant, ipAddress, userAgent);
      }

      // Check if 2FA is required
      if (merchant.twoFactorEnabled) {
        if (!data.twoFactorCode) {
          return { 
            success: false, 
            requires2FA: true, 
            error: 'Two-factor authentication code required' 
          };
        }

        const twoFactorResult = await twoFactorService.verify2FAToken(
          merchant._id.toString(), 
          data.twoFactorCode
        );

        if (!twoFactorResult.success) {
          await this.handleFailedLogin(merchant, ipAddress, userAgent, '2fa_failed');
          return { success: false, error: twoFactorResult.error };
        }
      }

      // Reset login attempts on successful login
      merchant.loginAttempts = 0;
      merchant.lockUntil = undefined;
      merchant.lastLoginAt = new Date();
      merchant.lastLoginIP = ipAddress;
      await merchant.save();

      // Create session with enhanced tracking
      const sessionInfo = await sessionService.createSession(
        merchant._id.toString(),
        ipAddress,
        userAgent,
        data.rememberMe,
        data.deviceFingerprint
      );

      // Generate JWT tokens
      const { token, refreshToken } = await this.createJWTTokens(
        merchant, 
        sessionInfo.sessionId,
        data.rememberMe
      );

      // Send login notification if enabled
      if (merchant.verificationLevel !== 'none') {
        await emailService.sendLoginNotification(
          merchant.email,
          merchant.name,
          ipAddress,
          userAgent
        );
      }

      // Log successful login
      await this.logAuthEvent(merchant._id.toString(), 'login', ipAddress, true, {
        rememberMe: data.rememberMe,
        userAgent: this.truncateUserAgent(userAgent),
        twoFactorUsed: merchant.twoFactorEnabled,
        sessionId: sessionInfo.sessionId,
      });

      return {
        success: true,
        token,
        refreshToken,
        merchant: this.formatMerchantForAuth(merchant),
      };
    } catch (error) {
      console.error('Login error:', error);
      await this.logAuthEvent(null, 'login_error', ipAddress, false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(data: EmailVerificationRequest): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();

    try {
      const merchant = await Merchant.findOne({ 
        emailVerificationToken: data.token 
      });

      if (!merchant) {
        return { success: false, error: 'Invalid or expired verification token' };
      }

      // Check if already verified
      if (merchant.emailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      // Verify email
      merchant.emailVerified = true;
      merchant.emailVerificationToken = undefined;
      merchant.verificationLevel = 'basic';
      await merchant.save();

      // Log verification
      await this.logAuthEvent(merchant._id.toString(), 'email_verified', '', true);

      return { success: true };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'Email verification failed' };
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();

    try {
      const merchant = await Merchant.findOne({ email });

      if (!merchant) {
        return { success: false, error: 'Account not found' };
      }

      if (merchant.emailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      // Generate new verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      merchant.emailVerificationToken = emailVerificationToken;
      await merchant.save();

      // Send verification email  
      const emailResult = await emailService.sendWelcomeEmail(merchant.email, {
        merchantName: merchant.name,
        businessType: merchant.businessType || 'unknown',
        stacksAddress: merchant.stacksAddress,
        verificationToken: emailVerificationToken,
      });

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        return { success: false, error: 'Failed to send verification email' };
      }

      console.log('Verification email sent successfully:', {
        email: merchant.email,
        messageId: emailResult.messageId,
        previewUrl: emailResult.previewUrl
      });

      return { success: true };
    } catch (error) {
      console.error('Resend email verification error:', error);
      return { success: false, error: 'Failed to resend verification email' };
    }
  }

  /**
   * Logout merchant and invalidate session
   */
  async logout(merchantId: string, sessionId: string, ipAddress: string): Promise<{ success: boolean }> {
    try {
      const revoked = await sessionService.revokeSession(sessionId);
      
      if (revoked) {
        await this.logAuthEvent(merchantId, 'logout', ipAddress, true, { sessionId });
      }

      return { success: revoked };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false };
    }
  }

  /**
   * Generate enhanced API key with advanced permissions
   */
  async generateApiKey(
    merchantId: string, 
    data: ApiKeyCreateRequest
  ): Promise<ApiKeyResponse> {
    await connectToDatabase();

    try {
      const keyId = crypto.randomUUID();
      const keySecret = crypto.randomBytes(32).toString('hex');
      const apiKey = `sk_${data.environment}_${keySecret}`;
      const keyHash = await bcrypt.hash(apiKey, 10);
      const keyPreview = `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`;

      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // Check API key limits
      const activeKeys = merchant.apiKeys.filter((key: any) => key.isActive);
      const maxKeys = data.environment === 'live' ? 5 : 10;
      
      if (activeKeys.length >= maxKeys) {
        throw new Error(`Maximum number of ${data.environment} API keys reached (${maxKeys})`);
      }

      // Add new API key
      merchant.apiKeys.push({
        keyId,
        keyHash,
        keyPreview,
        name: data.name,
        permissions: data.permissions,
        environment: data.environment,
        isActive: true,
        createdAt: new Date(),
        rateLimit: data.rateLimit || (data.environment === 'test' ? 100 : 1000),
        ipRestrictions: data.ipRestrictions || [],
        expiresAt: data.expiresAt,
        requestCount: 0,
      });

      await merchant.save();

      // Log API key creation
      await this.logAuthEvent(merchantId, 'api_key_created', '', true, {
        keyId,
        environment: data.environment,
        permissions: data.permissions,
        name: data.name,
      });

      return { 
        keyId, 
        apiKey, 
        keyPreview, 
        permissions: data.permissions, 
        environment: data.environment,
        createdAt: new Date(),
        rateLimit: data.rateLimit || (data.environment === 'test' ? 100 : 1000),
        ipRestrictions: data.ipRestrictions,
      };
    } catch (error) {
      console.error('API key generation error:', error);
      throw error;
    }
  }

  /**
   * Enhanced API key validation with rate limiting and IP restrictions
   */
  async validateApiKey(apiKey: string, ipAddress: string): Promise<{
    merchantId: string;
    keyId: string;
    permissions: string[];
    environment: string;
    merchant: any;
    rateLimit: any;
  } | null> {
    await connectToDatabase();

    try {
      // Get all active API keys from the ApiKey collection
      const apiKeys = await ApiKey.find({ isActive: true });

      for (const key of apiKeys) {
        // Compare the provided API key with the hashed key
        if (await bcrypt.compare(apiKey, key.keyHash)) {
          // Check if key has expired
          if (key.expiresAt && key.expiresAt < new Date()) {
            continue;
          }

          // Check IP restrictions
          if (key.ipRestrictions && key.ipRestrictions.length > 0) {
            const isAllowedIP = key.ipRestrictions.some((allowed: string) => {
              return this.isIPInRange(ipAddress, allowed);
            });

            if (!isAllowedIP) {
              await this.logAuthEvent(key.merchantId, 'api_key_ip_blocked', ipAddress, false, {
                keyId: key.keyId,
                blockedIP: ipAddress,
              });
              continue;
            }
          }

          // Check rate limit
          const rateCheck = await rateLimitService.checkApiKeyRateLimit(
            key.keyId,
            key.rateLimit,
            60000 // 1 minute window
          );

          if (!rateCheck.allowed) {
            return null;
          }

          // Update usage statistics
          key.lastUsed = new Date();
          key.requestCount = (key.requestCount || 0) + 1;
          await key.save();

          // Get merchant info
          const merchant = await Merchant.findById(key.merchantId);
          if (!merchant) {
            continue;
          }

          return {
            merchantId: key.merchantId,
            keyId: key.keyId,
            permissions: key.permissions,
            environment: key.environment,
            merchant: {
              name: merchant.name,
              email: merchant.email,
              stacksAddress: merchant.stacksAddress,
              emailVerified: merchant.emailVerified,
              verificationLevel: merchant.verificationLevel,
            },
            rateLimit: rateCheck,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('API key validation error:', error);
      return null;
    }
  }

  /**
   * Create JWT tokens with proper expiration
   */
  private async createJWTTokens(
    merchant: any, 
    sessionId: string,
    rememberMe: boolean = false
  ): Promise<{ token: string; refreshToken: string }> {
    const expiresIn = rememberMe ? '30d' : '24h';
    
    const token = jwt.sign(
      {
        merchantId: merchant._id.toString(),
        sessionId,
        email: merchant.email,
      },
      this.JWT_SECRET,
      { expiresIn }
    );

    const refreshToken = jwt.sign(
      { merchantId: merchant._id.toString(), sessionId },
      this.JWT_REFRESH_SECRET,
      { expiresIn: '60d' }
    );

    return { token, refreshToken };
  }

  /**
   * Handle failed login attempts with progressive lockout
   */
  private async handleFailedLogin(
    merchant: any, 
    ipAddress: string, 
    userAgent: string, 
    reason: string = 'invalid_password'
  ): Promise<AuthResponse> {
    merchant.loginAttempts = (merchant.loginAttempts || 0) + 1;

    // Progressive lockout: 5 attempts = 15 min, 10 attempts = 1 hour, 15+ = 24 hours
    let lockDuration = 0;
    if (merchant.loginAttempts >= 15) {
      lockDuration = 24 * 60 * 60 * 1000; // 24 hours
    } else if (merchant.loginAttempts >= 10) {
      lockDuration = 60 * 60 * 1000; // 1 hour
    } else if (merchant.loginAttempts >= 5) {
      lockDuration = 15 * 60 * 1000; // 15 minutes
    }

    if (lockDuration > 0) {
      merchant.lockUntil = new Date(Date.now() + lockDuration);
    }

    await merchant.save();

    await this.logAuthEvent(merchant._id.toString(), 'failed_login', ipAddress, false, { 
      attempts: merchant.loginAttempts,
      reason,
      lockDuration: lockDuration / 1000 / 60, // minutes
    });

    const remainingAttempts = Math.max(0, this.MAX_LOGIN_ATTEMPTS - merchant.loginAttempts);
    
    return { 
      success: false, 
      error: 'Invalid credentials',
      remainingAttempts,
      lockoutTimeRemaining: lockDuration,
    };
  }

  /**
   * Validation methods
   */
  private validateRegistrationData(data: RegisterRequest, isWalletRegistration = false): { success: boolean; error?: string } {
    const schema = Joi.object({
      name: Joi.string().min(2).max(100).required(),
      email: isWalletRegistration ? 
        Joi.string().email().allow('', null).optional() : // Allow empty/null email for wallet registrations
        Joi.string().email().required(), // Require email for normal registrations
      password: Joi.string().min(this.PASSWORD_MIN_LENGTH).required(),
      businessType: Joi.string().required(),
      stacksAddress: Joi.string().optional(),
      website: Joi.string().uri().optional(),
      acceptTerms: Joi.boolean().valid(true).required(),
      marketingConsent: Joi.boolean().optional(),
    });

    const { error } = schema.validate(data);
    if (error) {
      return { success: false, error: error.details[0].message };
    }

    // Additional password validation
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.success) {
      return passwordValidation;
    }

    return { success: true };
  }

  private validateLoginData(data: LoginRequest): { success: boolean; error?: string } {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      rememberMe: Joi.boolean().optional(),
      twoFactorCode: Joi.string().optional(),
      deviceFingerprint: Joi.string().optional(),
    });

    const { error } = schema.validate(data);
    if (error) {
      return { success: false, error: error.details[0].message };
    }

    return { success: true };
  }

  private validatePassword(password: string): { success: boolean; error?: string } {
    // Password requirements: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const hasLength = password.length >= this.PASSWORD_MIN_LENGTH;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasLength) {
      return { success: false, error: `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long` };
    }
    if (!hasUpper || !hasLower) {
      return { success: false, error: 'Password must contain both uppercase and lowercase letters' };
    }
    if (!hasNumber) {
      return { success: false, error: 'Password must contain at least one number' };
    }
    if (!hasSpecial) {
      return { success: false, error: 'Password must contain at least one special character' };
    }

    return { success: true };
  }

  /**
   * Utility methods
   */
  private isValidStacksAddress(address: string): boolean {
    const stacksAddressRegex = /^S[TM][0-9A-Z]{39}$|^SP[0-9A-Z]{39}$/;
    return stacksAddressRegex.test(address);
  }

  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;
    return `${username.charAt(0)}${'*'.repeat(username.length - 2)}${username.charAt(username.length - 1)}@${domain}`;
  }

  private truncateUserAgent(userAgent: string): string {
    return userAgent.substring(0, 200);
  }

  private isIPInRange(ip: string, cidr: string): boolean {
    // Simple IP range check - in production, use a proper CIDR library
    if (cidr.includes('/')) {
      // CIDR notation - simplified implementation
      return ip.startsWith(cidr.split('/')[0].split('.').slice(0, 3).join('.'));
    }
    return ip === cidr;
  }

  /**
   * Log authentication events for security monitoring
   */
  private async logAuthEvent(
    merchantId: string | null, 
    eventType: string, 
    ipAddress: string, 
    success: boolean, 
    metadata?: any
  ): Promise<void> {
    try {
      // Validate IP address before saving
      if (!ipAddress || ipAddress.trim() === '') {
        ipAddress = '127.0.0.1'; // Fallback for local/internal requests
      }

      const authEvent = new AuthEvent({
        merchantId,
        eventType,
        ipAddress: ipAddress.trim(),
        success,
        metadata,
      });
      await authEvent.save();
    } catch (error: any) {
      console.error('Error logging auth event:', {
        error: error.message,
        merchantId,
        eventType,
        ipAddress,
        success
      });
      // Don't throw - logging errors shouldn't break the main authentication flow
    }
  }

  /**
   * Get merchant API keys
   */
  async getMerchantApiKeys(merchantId: string): Promise<any[]> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return [];
      }

      // Return API keys without the actual key values for security
      return merchant.apiKeys?.map((key: any) => ({
        keyId: key.keyId,
        environment: key.environment,
        permissions: key.permissions,
        lastUsed: key.lastUsed,
        createdAt: key.createdAt,
        isActive: key.isActive,
      })) || [];
    } catch (error: any) {
      console.error('Error getting merchant API keys:', error);
      return [];
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(merchantId: string, keyId: string): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      const apiKeyIndex = merchant.apiKeys?.findIndex((key: any) => key.keyId === keyId);
      if (apiKeyIndex === -1 || apiKeyIndex === undefined) {
        return { success: false, error: 'API key not found' };
      }

      // Remove the API key
      merchant.apiKeys!.splice(apiKeyIndex, 1);
      await merchant.save();

      await this.logAuthEvent(merchantId, 'api_key_revoked', '', true, { keyId });

      return { success: true };
    } catch (error: any) {
      console.error('Error revoking API key:', error);
      return { success: false, error: 'Failed to revoke API key' };
    }
  }

  /**
   * Rotate API key - Generate new key and set grace period for old key
   */
  async rotateApiKey(merchantId: string, keyId: string, gracePeriodHours: number = 24): Promise<{
    success: boolean;
    error?: string;
    newKey?: {
      keyId: string;
      key: string;
      keyPreview: string;
    };
    oldKeyExpiresAt?: Date;
  }> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      const oldApiKey = merchant.apiKeys?.find((key: any) => key.keyId === keyId);
      if (!oldApiKey) {
        return { success: false, error: 'API key not found' };
      }

      // Generate new API key with same settings as old key
      const environment = oldApiKey.environment;
      const keyPrefix = environment === 'test' ? 'sk_test_' : 'sk_live_';
      const randomBytes = crypto.randomBytes(32).toString('hex');
      const newApiKey = `${keyPrefix}${randomBytes}`;
      const newKeyId = crypto.randomBytes(16).toString('hex');

      // Hash the new API key for secure storage
      const keyHash = await bcrypt.hash(newApiKey, 10);
      const keyPreview = `${keyPrefix}****${randomBytes.slice(-4)}`;

      // Set expiration for old key
      const expiresAt = new Date(Date.now() + gracePeriodHours * 60 * 60 * 1000);
      oldApiKey.expiresAt = expiresAt;

      // Add new API key
      const newApiKeyData = {
        keyId: newKeyId,
        keyHash,
        keyPreview,
        name: `${oldApiKey.name} (Rotated)`,
        permissions: oldApiKey.permissions,
        environment: oldApiKey.environment,
        isActive: true,
        createdAt: new Date(),
        ipRestrictions: oldApiKey.ipRestrictions || [],
        rateLimit: oldApiKey.rateLimit || 1000,
      };

      if (!merchant.apiKeys) {
        merchant.apiKeys = [];
      }
      merchant.apiKeys.push(newApiKeyData);
      
      await merchant.save();

      await this.logAuthEvent(merchantId, 'api_key_rotated', '', true, { 
        oldKeyId: keyId, 
        newKeyId: newKeyId,
        gracePeriodHours 
      });

      return { 
        success: true, 
        newKey: {
          keyId: newKeyId,
          key: newApiKey,
          keyPreview
        },
        oldKeyExpiresAt: expiresAt
      };
    } catch (error: any) {
      console.error('Error rotating API key:', error);
      return { success: false, error: 'Failed to rotate API key' };
    }
  }

  /**
   * Get wallet setup status
   */
  async getWalletSetupStatus(merchantId: string): Promise<any> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { hasWallet: false, isVerified: false };
      }

      return {
        hasWallet: !!merchant.stacksAddress,
        isVerified: merchant.emailVerified,
        stacksAddress: merchant.stacksAddress,
      };
    } catch (error: any) {
      console.error('Error getting wallet setup status:', error);
      return { hasWallet: false, isVerified: false };
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      await connectToDatabase();
      const merchant = await Merchant.findById(decoded.merchantId);
      
      if (!merchant) {
        return null;
      }

      return {
        merchantId: merchant._id.toString(),
        sessionId: decoded.sessionId,
        merchant: this.formatMerchantForAuth(merchant)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Format merchant data for authentication responses
   */
  private formatMerchantForAuth(merchant: any) {
    return merchantService.formatMerchantForAuth(merchant);
  }

  /**
   * Exchange session for JWT tokens
   */
  async exchangeSessionForTokens(sessionId: string): Promise<{
    success: boolean;
    token?: string;
    refreshToken?: string;
    merchant?: any;
    error?: string;
  }> {
    try {
      // Validate session
      const sessionInfo = await sessionService.validateSession(sessionId);
      
      if (!sessionInfo) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      // Get merchant details from database directly
      const merchant = await Merchant.findById(sessionInfo.merchantId);
      
      if (!merchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      // Create JWT tokens
      const { token, refreshToken } = await this.createJWTTokens(
        merchant,
        sessionId,
        false // rememberMe - using session settings
      );

      return {
        success: true,
        token,
        refreshToken,
        merchant: {
          id: merchant._id.toString(),
          name: merchant.name,
          email: merchant.email,
          stacksAddress: merchant.stacksAddress,
          emailVerified: merchant.emailVerified,
          verificationLevel: merchant.verificationLevel,
          businessType: merchant.businessType,
          authMethod: merchant.authMethod,
          loginMethod: merchant.loginMethod,
          avatar: merchant.avatar
        }
      };
    } catch (error) {
      console.error('Error exchanging session for tokens:', error);
      return {
        success: false,
        error: 'Failed to exchange session for tokens'
      };
    }
  }
}

export const authService = new AuthService();
