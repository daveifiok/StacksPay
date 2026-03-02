export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  businessType: string;
  stacksAddress?: string; // Optional - can be added later
  website?: string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
  deviceFingerprint?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  requires2FA?: boolean;
  merchant?: {
    id: string;
    name: string;
    email: string;
    stacksAddress?: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    verificationLevel: string;
  };
  apiKey?: {
    keyId: string;
    apiKey: string;
    keyPreview: string;
    permissions: string[];
  };
  error?: string;
  remainingAttempts?: number;
  lockoutTimeRemaining?: number;
}

export interface ApiKeyResponse {
  keyId: string;
  apiKey: string;
  keyPreview: string;
  permissions: string[];
  environment: 'test' | 'live';
  createdAt: Date;
  rateLimit: number;
  ipRestrictions?: string[];
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  logoutAllSessions?: boolean;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface TwoFactorSetupRequest {
  password: string; // Confirm password to enable 2FA
}

export interface TwoFactorVerifyRequest {
  code: string; // TOTP code or backup code
}

export interface SessionInfo {
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  isCurrent: boolean;
}

export interface SecurityLog {
  id: string;
  eventType: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
  details?: any;
}

export interface MerchantProfileUpdate {
  name?: string;
  businessType?: string;
  website?: string;
  stacksAddress?: string;
  bitcoinAddress?: string;
}

export interface ApiKeyCreateRequest {
  name: string;
  permissions: string[];
  environment: 'test' | 'live';
  ipRestrictions?: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

export interface WebhookSettings {
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
}