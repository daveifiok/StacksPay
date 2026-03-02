import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthEvent extends Document {
  merchantId?: string;
  eventType: string;
  ipAddress: string;
  success: boolean;
  metadata?: any;
  timestamp: Date;
  userAgent?: string;
  sessionId?: string;
}

const AuthEventSchema = new Schema<IAuthEvent>({
  merchantId: {
    type: String,
    required: false,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'register',
      'register_duplicate_email',
      'login', 
      'logout',
      'failed_login',
      'account_locked',
      'api_key_created',
      'api_key_used',
      'api_key_revoked',
      'wallet_connected',
      'wallet_signature_verified',
      'stacks_address_updated',
      'password_reset_requested',
      'password_reset_completed',
      'email_verified'
    ],
    index: true,
  },
  ipAddress: {
    type: String,
    required: true,
    index: true,
  },
  success: {
    type: Boolean,
    required: true,
    index: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  userAgent: {
    type: String,
    required: false,
  },
  sessionId: {
    type: String,
    required: false,
    index: true,
  },
}, {
  timestamps: true,
  collection: 'auth_events',
});

// Indexes for efficient queries
AuthEventSchema.index({ merchantId: 1, timestamp: -1 });
AuthEventSchema.index({ eventType: 1, timestamp: -1 });
AuthEventSchema.index({ ipAddress: 1, timestamp: -1 });
AuthEventSchema.index({ success: 1, timestamp: -1 });

// TTL index for automatic cleanup of old events (keep for 90 days)
AuthEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuthEvent = mongoose.model<IAuthEvent>('AuthEvent', AuthEventSchema);