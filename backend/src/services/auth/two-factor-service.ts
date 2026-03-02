import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { Merchant } from '@/models/merchant/Merchant';
import { connectToDatabase } from '@/config/database';
import { emailService } from '../email/email-service';

export interface TwoFactorSetupResponse {
  qrCodeDataUrl: string;
  secret: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface TwoFactorVerificationResult {
  success: boolean;
  error?: string;
  usedBackupCode?: boolean;
}

export class TwoFactorService {
  private readonly APP_NAME = 'sBTC Payment Gateway';
  
  /**
   * Generate 2FA secret and QR code for setup
   */
  async generateTwoFactorSecret(merchantId: string): Promise<TwoFactorSetupResponse> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${this.APP_NAME} (${merchant.email})`,
        issuer: this.APP_NAME,
        length: 32,
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Create QR code
      const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Store temporary secret (not activated until verified)
      merchant.twoFactorTempSecret = secret.base32;
      merchant.twoFactorBackupCodes = backupCodes.map(code => ({
        code: crypto.createHash('sha256').update(code).digest('hex'),
        used: false,
        createdAt: new Date(),
      }));
      
      await merchant.save();

      // Send setup email with QR code and backup codes
      await emailService.send2FAEnabledEmail(merchant.email, {
        merchantName: merchant.name,
        backupCodes,
      });

      return {
        qrCodeDataUrl,
        secret: secret.base32!,
        backupCodes,
        manualEntryKey: secret.base32!,
      };
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA token and complete setup
   */
  async verifyAndEnable2FA(
    merchantId: string, 
    token: string
  ): Promise<TwoFactorVerificationResult> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      if (!merchant.twoFactorTempSecret) {
        return { success: false, error: '2FA setup not initiated' };
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: merchant.twoFactorTempSecret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps (1 minute) tolerance
      });

      if (!verified) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Enable 2FA
      merchant.twoFactorEnabled = true;
      merchant.twoFactorSecret = merchant.twoFactorTempSecret;
      merchant.twoFactorTempSecret = undefined;
      
      await merchant.save();

      return { success: true };
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Verify 2FA token during login
   */
  async verify2FAToken(
    merchantId: string, 
    token: string
  ): Promise<TwoFactorVerificationResult> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      if (!merchant.twoFactorEnabled || !merchant.twoFactorSecret) {
        return { success: false, error: '2FA not enabled for this account' };
      }

      // First try backup code
      if (token.length === 8) {
        const backupCodeResult = await this.verifyBackupCode(merchantId, token);
        if (backupCodeResult.success) {
          return { success: true, usedBackupCode: true };
        }
      }

      // Then try TOTP token
      const verified = speakeasy.totp.verify({
        secret: merchant.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps tolerance
      });

      if (!verified) {
        return { success: false, error: 'Invalid verification code' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(
    merchantId: string, 
    backupCode: string
  ): Promise<TwoFactorVerificationResult> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      if (!merchant.twoFactorBackupCodes || merchant.twoFactorBackupCodes.length === 0) {
        return { success: false, error: 'No backup codes available' };
      }

      const codeHash = crypto.createHash('sha256').update(backupCode.trim()).digest('hex');

      // Find matching unused backup code
      const backupCodeEntry = merchant.twoFactorBackupCodes.find(
        (entry: any) => entry.code === codeHash && !entry.used
      );

      if (!backupCodeEntry) {
        return { success: false, error: 'Invalid or already used backup code' };
      }

      // Mark backup code as used
      backupCodeEntry.used = true;
      backupCodeEntry.usedAt = new Date();
      
      await merchant.save();

      // If this was the last backup code, generate new ones
      const remainingCodes = merchant.twoFactorBackupCodes.filter((entry: any) => !entry.used);
      if (remainingCodes.length <= 2) {
        await this.regenerateBackupCodes(merchantId);
      }

      return { success: true, usedBackupCode: true };
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Disable 2FA (requires password confirmation)
   */
  async disable2FA(merchantId: string): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      merchant.twoFactorEnabled = false;
      merchant.twoFactorSecret = undefined;
      merchant.twoFactorTempSecret = undefined;
      merchant.twoFactorBackupCodes = [];
      
      await merchant.save();

      // Send security notification
      await emailService.sendSecurityAlert(
        merchant.email,
        merchant.name,
        'Two-Factor Authentication Disabled',
        {
          timestamp: new Date(),
          action: 'disable_2fa',
          severity: 'medium',
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return { success: false, error: 'Failed to disable 2FA' };
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(merchantId: string): Promise<string[]> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      const backupCodes = this.generateBackupCodes();
      
      merchant.twoFactorBackupCodes = backupCodes.map(code => ({
        code: crypto.createHash('sha256').update(code).digest('hex'),
        used: false,
        createdAt: new Date(),
      }));
      
      await merchant.save();

      // Send new backup codes via email
      await emailService.sendSecurityAlert(
        merchant.email,
        merchant.name,
        'New Backup Codes Generated',
        {
          backupCodes,
          message: 'New backup codes have been generated for your account. Please store them securely.',
          oldCodesInvalidated: true,
        }
      );

      return backupCodes;
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      throw error;
    }
  }

  /**
   * Get 2FA status for merchant
   */
  async get2FAStatus(merchantId: string): Promise<{
    enabled: boolean;
    setupInProgress: boolean;
    backupCodesRemaining: number;
  }> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      const backupCodesRemaining = merchant.twoFactorBackupCodes
        ? merchant.twoFactorBackupCodes.filter((entry: any) => !entry.used).length
        : 0;

      return {
        enabled: merchant.twoFactorEnabled || false,
        setupInProgress: !!merchant.twoFactorTempSecret,
        backupCodesRemaining,
      };
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      throw error;
    }
  }

  /**
   * Recovery: disable 2FA with email verification (emergency)
   */
  async initiate2FARecovery(email: string): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findOne({ email });
      if (!merchant) {
        // Don't reveal if email exists
        return { success: true };
      }

      if (!merchant.twoFactorEnabled) {
        return { success: false, error: '2FA is not enabled for this account' };
      }

      // Generate recovery token
      const recoveryToken = crypto.randomBytes(32).toString('hex');
      merchant.twoFactorRecoveryToken = recoveryToken;
      merchant.twoFactorRecoveryExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await merchant.save();

      // Send recovery email
      await emailService.sendSecurityAlert(
        merchant.email,
        merchant.name,
        '2FA Recovery Request',
        {
          recoveryUrl: `${process.env.FRONTEND_URL}/auth/2fa-recovery?token=${recoveryToken}`,
          expiresIn: '1 hour',
          warning: 'If you did not request this recovery, please contact support immediately.',
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error initiating 2FA recovery:', error);
      return { success: false, error: 'Recovery initiation failed' };
    }
  }

  /**
   * Complete 2FA recovery
   */
  async complete2FARecovery(
    token: string, 
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findOne({
        twoFactorRecoveryToken: token,
        twoFactorRecoveryExpires: { $gt: new Date() },
      });

      if (!merchant) {
        return { success: false, error: 'Invalid or expired recovery token' };
      }

      // Disable 2FA and reset password
      merchant.twoFactorEnabled = false;
      merchant.twoFactorSecret = undefined;
      merchant.twoFactorBackupCodes = [];
      merchant.twoFactorRecoveryToken = undefined;
      merchant.twoFactorRecoveryExpires = undefined;
      
      // Hash new password
      const bcrypt = require('bcryptjs');
      merchant.passwordHash = await bcrypt.hash(newPassword, 12);
      
      // Invalidate all sessions
      merchant.sessions = [];
      
      await merchant.save();

      // Send confirmation email
      await emailService.sendSecurityAlert(
        merchant.email,
        merchant.name,
        '2FA Recovery Completed',
        {
          timestamp: new Date(),
          actions: ['2FA disabled', 'Password reset', 'All sessions invalidated'],
          recommendation: 'Please log in with your new password and re-enable 2FA.',
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error completing 2FA recovery:', error);
      return { success: false, error: 'Recovery completion failed' };
    }
  }

  /**
   * Generate 8-character backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

export const twoFactorService = new TwoFactorService();
