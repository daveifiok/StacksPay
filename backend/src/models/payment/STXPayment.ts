import { Schema, model, models, Document, Model } from 'mongoose';
import { ISTXPayment, STXPaymentStatus } from '@/interfaces/payment/stx-payment.interface';

// Interface for static methods
interface ISTXPaymentModel extends Model<ISTXPayment> {
  findByUniqueAddress(address: string): Promise<ISTXPayment | null>;
  findActivePayments(merchantId: string): Promise<ISTXPayment[]>;
  findExpiredPayments(): Promise<ISTXPayment[]>;
}

const stxPaymentSchema = new Schema<ISTXPayment>({
  // Core payment identifiers
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  merchantId: {
    type: Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  
  // Unique address data (Option 2 implementation)
  uniqueAddress: {
    type: String,
    required: true,
    unique: true
  },
  encryptedPrivateKey: {
    type: String,
    required: true
  },
  
  // Payment amounts (in microSTX)
  expectedAmount: {
    type: Number,
    required: true,
    min: 1000 // Minimum 1000 microSTX (0.001 STX) - total amount customer pays
  },
  baseAmount: {
    type: Number,
    min: 0 // Original product price (what merchant receives after fees)
  },
  receivedAmount: {
    type: Number,
    min: 0
  },
  usdAmount: {
    type: Number,
    min: 0
  },
  stxPriceAtCreation: {
    type: Number,
    min: 0
  },
  
  // Payment lifecycle
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'settled', 'refunded', 'expired', 'failed'],
    default: 'pending',
    required: true
  },
  metadata: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Timestamps
  expiresAt: {
    type: Date,
    required: true
    // Note: Index is defined separately below
  },
  confirmedAt: {
    type: Date
  },
  settledAt: {
    type: Date
  },
  
  // Blockchain transaction IDs
  contractRegistrationTxId: {
    type: String
  },
  contractConfirmationTxId: {
    type: String
  },
  contractSettlementTxId: {
    type: String
  },
  receiveTxId: {
    type: String
  },
  settlementTxId: {
    type: String
  },
  
  // Contract data
  contractPaymentData: {
    type: Schema.Types.Mixed
  },
  
  // Fee calculation results
  feeAmount: {
    type: Number,
    min: 0
  },
  netAmount: {
    type: Number,
    min: 0
  },
  settlementId: {
    type: Number
  },
  
  // Error tracking
  errorMessage: {
    type: String,
    maxlength: 1000
  },
  retryCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Merchant configuration at time of payment
  merchantFeeRate: {
    type: Number,
    min: 0,
    max: 10000 // Maximum 100% (in basis points)
  }
}, {
  timestamps: true,
  collection: 'stx_payments'
});

// Indexes for efficient queries
// Note: paymentId and uniqueAddress already have unique indexes from field definitions
// Compound indexes cover single-field queries, so we only need the compound ones
stxPaymentSchema.index({ merchantId: 1, status: 1, createdAt: -1 }); // Covers merchantId queries too
stxPaymentSchema.index({ status: 1, expiresAt: 1 }); // For finding expired/expiring payments
stxPaymentSchema.index({ status: 1, createdAt: -1 }); // For status-based listings
stxPaymentSchema.index({ receiveTxId: 1 }); // For webhook lookups
stxPaymentSchema.index({ settlementTxId: 1 }); // For settlement tracking

// TTL index for automatic cleanup of expired payments (optional - only for very old payments)
// stxPaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 * 30 }); // 30 days after expiry

// Virtual for QR code data
stxPaymentSchema.virtual('qrCodeData').get(function() {
  // Convert microSTX to STX for the QR code (wallets expect STX, not microSTX)
  const amountInSTX = this.expectedAmount / 1000000;
  return `stacks:${this.uniqueAddress}?amount=${amountInSTX}&memo=${encodeURIComponent(this.metadata)}`;
});

// Virtual for payment URL
stxPaymentSchema.virtual('paymentUrl').get(function() {
  return `${process.env.FRONTEND_URL}/pay/stx/${this.paymentId}`;
});

// Static method to find payment by unique address
stxPaymentSchema.statics.findByUniqueAddress = function(address: string) {
  return this.findOne({ uniqueAddress: address });
};

// Static method to find active payments for merchant
stxPaymentSchema.statics.findActivePayments = function(merchantId: string) {
  return this.find({ 
    merchantId, 
    status: { $in: ['pending', 'confirmed'] },
    expiresAt: { $gt: new Date() }
  });
};

// Static method to find expired payments
stxPaymentSchema.statics.findExpiredPayments = function() {
  return this.find({ 
    status: 'pending',
    expiresAt: { $lte: new Date() }
  });
};

// Instance method to check if payment is expired
stxPaymentSchema.methods.isExpired = function() {
  return this.expiresAt <= new Date();
};

// Instance method to check if payment can be settled
stxPaymentSchema.methods.canBeSettled = function() {
  return this.status === 'confirmed' && this.receivedAmount && this.receivedAmount > 0;
};

// Pre-save middleware to generate payment ID if not provided
stxPaymentSchema.pre('save', function(next) {
  if (!this.paymentId) {
    this.paymentId = `stx_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

export const STXPayment = (models?.STXPayment || model<ISTXPayment, ISTXPaymentModel>('STXPayment', stxPaymentSchema)) as ISTXPaymentModel;