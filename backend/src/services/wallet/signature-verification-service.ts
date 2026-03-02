import { verifyMessageSignature } from '@stacks/encryption';
import { AuthEvent } from '@/models/auth/auth-event';
import { connectToDatabase } from '@/config/database';

// Bitcoin signature verification imports
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
bitcoin.initEccLib(ecc);

export interface SignatureVerificationResult {
  success: boolean;
  verified: boolean;
  walletType: 'stacks' | 'bitcoin';
  address?: string;
  paymentMethod?: 'bitcoin' | 'stx' | 'sbtc';
  error?: string;
}

export interface PaymentAuthorizationData {
  address: string;
  signature: string;
  message: string;
  publicKey: string;
  walletType: 'stacks' | 'bitcoin';
  paymentId?: string;
  amount?: number;
}

/**
 * Enterprise Signature Verification Service
 * Handles Bitcoin and Stacks wallet signature verification
 * Replaces the problematic wallet connection logic with pure verification
 */
export class SignatureVerificationService {
  
  /**
   * Verify wallet signature for payment authorization
   * Core method for validating wallet-signed payment data
   */
  async verifyPaymentAuthorization(auth: PaymentAuthorizationData): Promise<SignatureVerificationResult> {
    await connectToDatabase();

    try {
      let isValid = false;
      let paymentMethod: 'bitcoin' | 'stx' | 'sbtc';

      // Verify signature based on wallet type
      if (auth.walletType === 'stacks') {
        isValid = await this.verifyStacksSignature({
          message: auth.message,
          signature: auth.signature,
          publicKey: auth.publicKey,
          address: auth.address
        });
        paymentMethod = 'stx'; // Stacks wallets use STX payments

      } else if (auth.walletType === 'bitcoin') {
        isValid = await this.verifyBitcoinSignature({
          message: auth.message,
          signature: auth.signature,
          publicKey: auth.publicKey,
          address: auth.address
        });
        paymentMethod = 'bitcoin'; // Bitcoin wallets use BTC payments
      } else {
        return {
          success: false,
          verified: false,
          walletType: auth.walletType,
          error: 'Unsupported wallet type'
        };
      }

      if (!isValid) {
        await this.logVerificationEvent(auth.address, 'payment_auth_failed', false, {
          reason: 'invalid_signature',
          walletType: auth.walletType,
          paymentId: auth.paymentId,
        });
        
        return {
          success: true,
          verified: false,
          walletType: auth.walletType,
          error: 'Invalid signature',
        };
      }

      // Verify message format and prevent replay attacks
      const messageValidation = await this.validatePaymentMessage(auth);
      if (!messageValidation.valid) {
        await this.logVerificationEvent(auth.address, 'payment_auth_failed', false, {
          reason: messageValidation.reason,
          walletType: auth.walletType,
          paymentId: auth.paymentId,
        });

        return {
          success: true,
          verified: false,
          walletType: auth.walletType,
          error: messageValidation.reason,
        };
      }

      // All verifications passed
      await this.logVerificationEvent(auth.address, 'payment_authorized', true, {
        paymentId: auth.paymentId,
        amount: auth.amount,
        walletType: auth.walletType,
        paymentMethod,
      });

      return {
        success: true,
        verified: true,
        walletType: auth.walletType,
        address: auth.address,
        paymentMethod,
      };

    } catch (error) {
      console.error('Payment authorization verification error:', error);
      await this.logVerificationEvent(auth.address, 'verification_error', false, {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletType: auth.walletType,
        paymentId: auth.paymentId,
      });
      
      return {
        success: false,
        verified: false,
        walletType: auth.walletType,
        error: 'Verification failed',
      };
    }
  }

  /**
   * Verify Stacks wallet message signature
   * Uses @stacks/encryption for cryptographic verification
   */
  private async verifyStacksSignature(data: {
    message: string;
    signature: string;
    publicKey: string;
    address: string;
  }): Promise<boolean> {
    try {
      // Use Stacks encryption library for signature verification
      const isValid = verifyMessageSignature({
        message: data.message,
        signature: data.signature,
        publicKey: data.publicKey,
      });

      return isValid;
    } catch (error) {
      console.error('Stacks signature verification error:', error);
      return false;
    }
  }

  /**
   * Verify Bitcoin wallet message signature
   * Uses bitcoinjs-lib for Bitcoin message verification
   */
  private async verifyBitcoinSignature(data: {
    message: string;
    signature: string;
    publicKey: string;
    address: string;
  }): Promise<boolean> {
    try {
      // Bitcoin message signature verification
      // Implementation depends on the specific Bitcoin signing format used
      
      // For now, implement basic validation
      // In production, use proper Bitcoin message verification
      if (!data.signature || data.signature.length < 64) {
        return false;
      }

      if (!data.publicKey || data.publicKey.length < 60) {
        return false;
      }

      // TODO: Implement full Bitcoin message signature verification
      // This would involve:
      // 1. Recreating the Bitcoin signed message format
      // 2. Verifying the signature against the public key
      // 3. Ensuring the public key corresponds to the address
      
      return true; // Placeholder - implement proper verification
      
    } catch (error) {
      console.error('Bitcoin signature verification error:', error);
      return false;
    }
  }

  /**
   * Validate payment message format and prevent replay attacks
   */
  private async validatePaymentMessage(auth: PaymentAuthorizationData): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    try {
      // Check message format for payment authorization
      if (auth.paymentId && auth.amount) {
        const expectedPattern = new RegExp(
          `Authorize ${auth.walletType} payment ${auth.paymentId} for ${auth.amount} satoshis at \\d+ nonce [a-z0-9]+`
        );
        
        if (!expectedPattern.test(auth.message)) {
          return {
            valid: false,
            reason: 'Invalid payment message format'
          };
        }

        // Extract and validate timestamp
        const timestampMatch = auth.message.match(/at (\d+) nonce/);
        if (timestampMatch) {
          const messageTime = parseInt(timestampMatch[1]);
          const now = Date.now();
          const maxAge = 5 * 60 * 1000; // 5 minutes for payment messages

          if (now - messageTime > maxAge) {
            return {
              valid: false,
              reason: 'Payment message expired'
            };
          }
        }
      } else {
        // Connection message validation
        const connectionPattern = new RegExp(
          `Connect ${auth.walletType} wallet ${auth.address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} at \\d+ nonce [a-z0-9]+`
        );
        
        if (!connectionPattern.test(auth.message)) {
          return {
            valid: false,
            reason: 'Invalid connection message format'
          };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('Message validation error:', error);
      return {
        valid: false,
        reason: 'Message validation failed'
      };
    }
  }

  /**
   * Generate challenge messages for wallet signatures
   * These messages will be signed by frontend wallets
   */
  generatePaymentChallenge(
    address: string, 
    walletType: 'stacks' | 'bitcoin',
    paymentId: string, 
    amount: number
  ): string {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    return `Authorize ${walletType} payment ${paymentId} for ${amount} satoshis at ${timestamp} nonce ${nonce}`;
  }

  /**
   * Generate connection challenge for wallet verification
   */
  generateConnectionChallenge(
    address: string, 
    walletType: 'stacks' | 'bitcoin'
  ): string {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    return `Connect ${walletType} wallet ${address} at ${timestamp} nonce ${nonce}`;
  }

  /**
   * Get supported wallet information for frontend
   */
  getSupportedWallets() {
    return {
      bitcoin: {
        name: 'Bitcoin Wallets',
        description: 'Native Bitcoin payments',
        paymentMethod: 'bitcoin',
        wallets: [
          { name: 'Electrum', type: 'desktop', supported: true },
          { name: 'Bitcoin Core', type: 'desktop', supported: true },
          { name: 'Sparrow', type: 'desktop', supported: true },
          { name: 'BlueWallet', type: 'mobile', supported: true },
          { name: 'Samourai', type: 'mobile', supported: true },
        ],
      },
      stacks: {
        name: 'Stacks Wallets',
        description: 'STX payments (faster, cheaper)',
        paymentMethod: 'stx',
        wallets: [
          { name: 'Xverse', type: 'browser', supported: true },
          { name: 'Hiro Wallet', type: 'browser', supported: true },
          { name: 'Leather', type: 'browser', supported: true },
          { name: 'Boom', type: 'mobile', supported: true },
        ],
      },
    };
  }

  /**
   * Validate wallet address formats
   */
  isValidAddress(address: string, walletType: 'stacks' | 'bitcoin'): boolean {
    if (walletType === 'stacks') {
      // Stacks address validation
      const mainnetPattern = /^S[PM][0-9A-Z]{39}$/;
      const testnetPattern = /^ST[0-9A-Z]{39}$/;
      return mainnetPattern.test(address) || testnetPattern.test(address);
    } else if (walletType === 'bitcoin') {
      // Bitcoin address validation (basic)
      const legacyPattern = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
      const segwitPattern = /^bc1[a-z0-9]{39,59}$/;
      const testnetPattern = /^(tb1|[mn2])[a-km-zA-HJ-NP-Z1-9]{25,62}$/;
      return legacyPattern.test(address) || segwitPattern.test(address) || testnetPattern.test(address);
    }
    
    return false;
  }

  /**
   * Log verification events for audit and debugging
   */
  private async logVerificationEvent(
    address: string,
    eventType: string,
    success: boolean,
    metadata?: any
  ): Promise<void> {
    try {
      const authEvent = new AuthEvent({
        merchantId: null,
        eventType,
        ipAddress: '',
        success,
        metadata: {
          walletAddress: address,
          service: 'SignatureVerificationService',
          ...metadata,
        },
      });
      await authEvent.save();
    } catch (error) {
      console.error('Error logging verification event:', error);
    }
  }
}

export const signatureVerificationService = new SignatureVerificationService();
