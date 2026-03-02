import { Schema, model, models, Document } from 'mongoose';

export interface IWebhook extends Document {
  merchantId: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastDeliveryAt?: Date;
  deliveryStats: {
    total: number;
    successful: number;
    failed: number;
    lastFailureReason?: string;
  };
  settings: {
    timeout: number;
    retryAttempts: number;
    retryDelays: number[];
  };
}

const webhookSchema = new Schema<IWebhook>({
  merchantId: {
    type: String,
    required: true,
    index: true,
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP or HTTPS URL'
    }
  },
  events: [{
    type: String,
    required: true,
    enum: [
      'payment.created',
      'payment.confirmed',
      'payment.succeeded', // Alias for payment.confirmed
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
  }],
  secret: {
    type: String,
    required: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  lastDeliveryAt: Date,
  deliveryStats: {
    total: {
      type: Number,
      default: 0,
    },
    successful: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    lastFailureReason: String,
  },
  settings: {
    timeout: {
      type: Number,
      default: 10000, // 10 seconds
    },
    retryAttempts: {
      type: Number,
      default: 3,
    },
    retryDelays: {
      type: [Number],
      default: [1000, 5000, 15000], // 1s, 5s, 15s
    },
  },
}, {
  timestamps: true,
  collection: 'webhooks'
});

// Indexes
webhookSchema.index({ merchantId: 1 });
webhookSchema.index({ merchantId: 1, enabled: 1 });
webhookSchema.index({ events: 1 });

export const Webhook = models?.Webhook || model<IWebhook>('Webhook', webhookSchema);
