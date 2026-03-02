import { Document, ObjectId } from 'mongoose';

/**
 * STX Payment Interfaces - Type definitions for STX payment system
 * 
 * These interfaces define the data structures used throughout the STX payment system,
 * keeping them separate from sBTC payment interfaces for clean separation.
 */

// Payment status enumeration
export type STXPaymentStatus = 
  | 'pending'       // Payment created, waiting for customer to send STX
  | 'confirmed'     // STX received at unique address, confirmed by Chainhook
  | 'settled'       // Funds transferred to merchant (minus fees)
  | 'refunded'      // Payment refunded to customer
  | 'expired'       // Payment expired without receiving funds
  | 'failed';       // Payment processing failed

// Base STX Payment document interface for MongoDB
export interface ISTXPayment extends Document {
  // Core payment identifiers
  paymentId: string;                    // Unique payment identifier (e.g., "pay_123456")
  merchantId: ObjectId;                 // Reference to merchant document
  
  // Unique address data (Option 2 implementation)
  uniqueAddress: string;                // Generated Stacks address for this payment
  encryptedPrivateKey: string;          // Encrypted private key for unique address
  
  // Payment amounts (in microSTX)
  expectedAmount: number;               // Total amount customer pays (product + fees)
  baseAmount?: number;                  // Original product price (what merchant receives)
  receivedAmount?: number;              // Amount actually received (if any)
  usdAmount?: number;                   // Original USD amount (for reference)
  stxPriceAtCreation?: number;          // STX/USD rate when payment was created
  
  // Payment lifecycle
  status: STXPaymentStatus;
  metadata: string;                     // Description or additional payment info
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;                      // When this payment expires
  confirmedAt?: Date;                   // When payment was confirmed
  settledAt?: Date;                     // When payment was settled
  
  // Blockchain transaction IDs
  contractRegistrationTxId?: string;    // TX ID when payment was registered with contract
  contractConfirmationTxId?: string;    // TX ID when payment was confirmed on contract
  contractSettlementTxId?: string;      // TX ID when payment was settled on contract
  receiveTxId?: string;                 // TX ID when customer sent STX to unique address
  settlementTxId?: string;              // TX ID when funds were settled to merchant
  
  // Contract data
  contractPaymentData?: any;            // Raw data from contract queries
  
  // Fee calculation results
  feeAmount?: number;                   // Platform fee (in microSTX)
  netAmount?: number;                   // Amount after fees (in microSTX)
  settlementId?: number;                // Settlement ID from contract
  
  // Error tracking
  errorMessage?: string;                // Last error message (if any)
  retryCount?: number;                  // Number of processing retries
  
  // Merchant configuration at time of payment
  merchantFeeRate?: number;             // Fee rate applied (in basis points)
}

// Request interfaces for API endpoints
export interface CreateSTXPaymentRequest {
  merchantId: string;
  expectedAmount: number;               // Amount in microSTX
  usdAmount?: number;                   // Original USD amount
  stxPrice?: number;                    // STX/USD rate at creation
  metadata: string;                     // Payment description
  expiresInMinutes?: number;            // Payment expiry (default: 15 minutes)
  customerInfo?: {
    name?: string;
    email?: string;
    address?: string;
  };
}

export interface CreateSTXPaymentResponse {
  success: boolean;
  payment?: {
    paymentId: string;
    uniqueAddress: string;
    expectedAmount: number;
    usdAmount?: number;
    expiresAt: string;
    qrCodeData: string;                 // QR code data for wallet scanning
  };
  error?: string;
}

export interface STXPaymentStatusResponse {
  success: boolean;
  payment?: {
    paymentId: string;
    status: STXPaymentStatus;
    expectedAmount: number;
    receivedAmount?: number;
    uniqueAddress: string;
    expiresAt: string;
    confirmedAt?: string;
    settledAt?: string;
    contractData?: any;
  };
  error?: string;
}

// Chainhook webhook event interfaces
export interface ChainhookSTXTransferEvent {
  apply: Array<{
    block_identifier: {
      index: number;
      hash: string;
    };
    transactions: Array<{
      transaction_identifier: {
        hash: string;
      };
      operations: Array<{
        type: string;
        data: {
          sender: string;
          recipient: string;
          amount: string;           // Amount in microSTX as string
          memo?: string;
        };
      }>;
    }>;
  }>;
}

export interface ChainhookContractEvent {
  apply: Array<{
    block_identifier: {
      index: number;
      hash: string;
    };
    transactions: Array<{
      transaction_identifier: {
        hash: string;
      };
      operations: Array<{
        type: 'contract_event';
        data: {
          contract_identifier: string;
          topic: string;
          value: any;               // Contract event data
        };
      }>;
    }>;
  }>;
}

// Internal service interfaces
export interface STXPaymentConfirmationData {
  paymentId: string;
  receivedAmount: number;               // Amount in microSTX
  senderAddress: string;
  txId: string;
  blockHeight: number;
  timestamp: Date;
}

export interface STXSettlementData {
  paymentId: string;
  settlementId: number;
  totalAmount: number;                  // Total amount in microSTX
  feeAmount: number;                    // Fee amount in microSTX
  netAmount: number;                    // Net amount after fees in microSTX
  settlementTxId?: string;
}

// Address generation interfaces
export interface UniqueAddressGenerationRequest {
  paymentId: string;
  merchantId: string;
}

export interface UniqueAddressGenerationResult {
  address: string;
  encryptedPrivateKey: string;
  derivationPath?: string;              // If using HD wallet derivation
}

// Contract interaction interfaces
export interface STXContractRegistrationData {
  paymentId: string;
  merchantAddress: string;
  uniqueAddress: string;
  expectedAmount: number;               // Amount in microSTX
  metadata: string;
  expiresInBlocks: number;
}

export interface STXContractConfirmationData {
  paymentId: string;
  receivedAmount: number;               // Amount in microSTX
  txId: string;                         // Buffer/hex string
}

export interface STXContractSettlementData {
  paymentId: string;
}

// Webhook delivery interfaces (for merchant notifications)
export interface STXPaymentWebhookEvent {
  event: 'payment.created' | 'payment.confirmed' | 'payment.settled' | 'payment.failed' | 'payment.expired';
  paymentId: string;
  status: STXPaymentStatus;
  data: {
    paymentId: string;
    merchantId: string;
    amount: number;                     // Amount in microSTX
    usdAmount?: number;
    uniqueAddress: string;
    metadata: string;
    timestamp: string;
    txId?: string;
    // Additional event-specific data
    [key: string]: any;
  };
}

// Analytics and reporting interfaces
export interface STXPaymentAnalytics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalVolume: number;                  // Total volume in microSTX
  totalVolumeUSD?: number;              // Total volume in USD
  averagePaymentAmount: number;
  successRate: number;                  // Percentage
  averageSettlementTime: number;        // In minutes
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Error interfaces
export interface STXPaymentError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  paymentId?: string;
}

// Configuration interfaces
export interface STXPaymentConfig {
  defaultExpiryMinutes: number;         // Default payment expiry
  maxExpiryMinutes: number;             // Maximum allowed expiry
  minPaymentAmount: number;             // Minimum payment in microSTX
  maxPaymentAmount: number;             // Maximum payment in microSTX
  contractAddress: string;
  contractName: string;
  networkType: 'mainnet' | 'testnet';
  chainhookWebhookUrl: string;
  chainhookSecret: string;
}

// Export commonly used types
export type STXPaymentDocument = ISTXPayment;
export type STXPaymentCreateRequest = CreateSTXPaymentRequest;
export type STXPaymentCreateResponse = CreateSTXPaymentResponse;