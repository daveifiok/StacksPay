import { Schema, model, models, Document } from 'mongoose';

export interface IInAppNotification extends Document {
  id: string;
  merchantId: string;
  title: string;
  message: string;
  type: 'payment' | 'system' | 'security' | 'webhook' | 'api' | 'account' | 'withdrawal' | 'subscription';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  data?: Record<string, any>; // Additional data for the notification
  actionUrl?: string; // URL to redirect when notification is clicked
  actionLabel?: string; // Label for action button
  expiresAt?: Date; // Auto-expire notifications
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inAppNotificationSchema = new Schema<IInAppNotification>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  merchantId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['payment', 'system', 'security', 'webhook', 'api', 'account', 'withdrawal', 'subscription'],
    required: true,
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread',
    index: true,
  },
  data: {
    type: Schema.Types.Mixed,
    default: {},
  },
  actionUrl: {
    type: String,
    maxlength: 500,
  },
  actionLabel: {
    type: String,
    maxlength: 50,
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }, // Auto-delete expired notifications
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
  collection: 'inapp_notifications'
});

// Indexes for performance
inAppNotificationSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
inAppNotificationSchema.index({ merchantId: 1, type: 1, createdAt: -1 });
inAppNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const InAppNotification = models?.InAppNotification || model<IInAppNotification>('InAppNotification', inAppNotificationSchema);
