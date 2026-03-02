import { Schema, model, models, Document } from 'mongoose';

export interface IApiKey extends Document {
  merchantId: string;
  keyId: string;
  keyHash: string;
  keyPreview: string;
  name: string;
  permissions: string[];
  environment: 'test' | 'live';
  ipRestrictions: string[];
  rateLimit: number;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  requestCount: number;
}

const apiKeySchema = new Schema<IApiKey>({
  merchantId: {
    type: String,
    required: true,
    index: true,
  },
  keyId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  keyHash: {
    type: String,
    required: true,
  },
  keyPreview: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  permissions: [{
    type: String,
    required: true,
  }],
  environment: {
    type: String,
    enum: ['test', 'live'],
    required: true,
    index: true,
  },
  ipRestrictions: [{
    type: String,
  }],
  rateLimit: {
    type: Number,
    default: 1000,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastUsed: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
  requestCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  collection: 'apikeys'
});

// Indexes for performance
apiKeySchema.index({ merchantId: 1, isActive: 1 });
apiKeySchema.index({ merchantId: 1, environment: 1 });
apiKeySchema.index({ keyId: 1 });

export const ApiKey = models?.ApiKey || model<IApiKey>('ApiKey', apiKeySchema);
