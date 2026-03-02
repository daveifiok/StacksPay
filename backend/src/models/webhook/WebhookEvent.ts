import { Schema, model, models, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  webhookId: string;
  merchantId: string;
  eventType: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  endpoint: string;
  payload: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  lastAttemptAt?: Date;
  response?: {
    status: number;
    body?: string;
    headers?: Record<string, string>;
    error?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>({
  webhookId: {
    type: String,
    required: true,
    index: true,
  },
  merchantId: {
    type: String,
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'payment.created',
      'payment.confirmed',
      'payment.succeeded',
      'payment.failed',
      'payment.expired',
      'payment.cancelled',
      'payment.refunded',
      'payment.disputed',
      'customer.created',
      'customer.updated',
      'subscription.created',
      'subscription.updated',
      'subscription.cancelled',
      'webhook.test'
    ]
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'success', 'failed', 'retrying'],
    default: 'pending',
    index: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: 1,
  },
  nextRetryAt: {
    type: Date,
    index: true,
  },
  lastAttemptAt: Date,
  response: {
    status: Number,
    body: String,
    headers: Schema.Types.Mixed,
    error: String,
  },
}, {
  timestamps: true,
  collection: 'webhook_events'
});

// Indexes for efficient querying
webhookEventSchema.index({ merchantId: 1, createdAt: -1 });
webhookEventSchema.index({ webhookId: 1, createdAt: -1 });
webhookEventSchema.index({ status: 1, nextRetryAt: 1 });
webhookEventSchema.index({ eventType: 1, createdAt: -1 });
webhookEventSchema.index({ createdAt: -1 });

// TTL index to automatically delete old events after 90 days
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const WebhookEvent = models?.WebhookEvent || model<IWebhookEvent>('WebhookEvent', webhookEventSchema);
