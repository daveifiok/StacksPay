import { connectToDatabase } from '@/config/database';
import { InAppNotification, IInAppNotification } from '@/models/Notification/Notification';
import { MerchantNotificationOptions, NotificationData, NotificationPreferences } from '@/interfaces/notification/notification.interface';
import { webhookService } from '../webhook/webhook-service';


/**
 * Notification Service - Multi-channel notification system
 * 
 * Handles all notifications including:
 * - Email notifications (transactional & marketing)  
 * - SMS notifications for critical alerts
 * - In-app notifications
 * - Webhook notifications
 * - Delivery tracking and analytics
 * - Preference management
 */
export class NotificationService {

  /**
   * Send merchant notification
   */
  async sendMerchantNotification(
    merchantId: string, 
    options: MerchantNotificationOptions
  ): Promise<{ success: boolean; notificationIds: string[]; error?: string }> {
    await connectToDatabase();
    
    try {
      const preferences = await this.getMerchantPreferences(merchantId);
      const notifications: NotificationData[] = [];
      const notificationIds: string[] = [];

      // Determine channels to use
      const channels = options.channels || this.getDefaultChannels(options.urgency || 'medium');

      // Email notification
      if (channels.includes('email') && preferences.email.enabled) {
        if (this.shouldSendEmailNotification(options.type, preferences)) {
          const emailNotification = await this.createEmailNotification(merchantId, options, preferences);
          notifications.push(emailNotification);
          notificationIds.push(emailNotification.id);
        }
      }

      // SMS notification  
      if (channels.includes('sms') && preferences.sms.enabled && preferences.sms.phone) {
        if (this.shouldSendSmsNotification(options.type, preferences)) {
          const smsNotification = await this.createSmsNotification(merchantId, options, preferences);
          notifications.push(smsNotification);
          notificationIds.push(smsNotification.id);
        }
      }

      // Webhook notification
      if (channels.includes('webhook') && preferences.webhook.enabled && preferences.webhook.url) {
        await webhookService.triggerWebhook({
          urls: { webhook: preferences.webhook.url },
          _id: `notification_${Date.now()}`,
          type: 'notification',
          merchantId,
          data: options,
          metadata: { notificationType: options.type, urgency: options.urgency }
        }, `merchant.notification.${options.type}`);
      }

      // In-app notification
      if (channels.includes('in_app') && preferences.inApp.enabled) {
        const inAppNotification = await this.createInAppNotification(merchantId, options);
        notifications.push(inAppNotification);
        notificationIds.push(inAppNotification.id);
      }

      // Send all notifications
      await Promise.all(notifications.map(notification => this.sendNotification(notification)));

      return { success: true, notificationIds };
    } catch (error) {
      console.error('Error sending merchant notification:', error);
      return { 
        success: false, 
        notificationIds: [], 
        error: error instanceof Error ? error.message : 'Notification failed' 
      };
    }
  }

  /**
   * Send individual notification
   */
  private async sendNotification(notification: NotificationData): Promise<boolean> {
    try {
      switch (notification.type) {
        case 'email':
          return await this.sendEmail(notification);
        case 'sms':
          return await this.sendSms(notification);
        case 'in_app':
          return await this.storeInAppNotification(notification);
        default:
          console.warn(`Unknown notification type: ${notification.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Error sending ${notification.type} notification:`, error);
      
      // Update notification status
      notification.status = 'failed';
      notification.failedAt = new Date();
      notification.attempts++;
      
      return false;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: NotificationData): Promise<boolean> {
    try {
      // In production, integrate with email service (SendGrid, Mailgun, SES, etc.)
      console.log(`Sending email to ${notification.recipient}: ${notification.subject}`);
      
      // Simulate email sending
      const success = Math.random() > 0.05; // 95% success rate
      
      if (success) {
        notification.status = 'sent';
        notification.sentAt = new Date();
        
        // Simulate delivery confirmation
        setTimeout(() => {
          notification.status = 'delivered';
          notification.deliveredAt = new Date();
        }, 1000);
      } else {
        notification.status = 'failed';
        notification.failedAt = new Date();
      }
      
      notification.attempts++;
      notification.lastAttemptAt = new Date();
      
      return success;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSms(notification: NotificationData): Promise<boolean> {
    try {
      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      console.log(`Sending SMS to ${notification.recipient}: ${notification.message.substring(0, 50)}...`);
      
      // Simulate SMS sending  
      const success = Math.random() > 0.02; // 98% success rate
      
      if (success) {
        notification.status = 'sent';
        notification.sentAt = new Date();
        
        // Simulate delivery confirmation
        setTimeout(() => {
          notification.status = 'delivered';
          notification.deliveredAt = new Date();
        }, 500);
      } else {
        notification.status = 'failed';
        notification.failedAt = new Date();
      }
      
      notification.attempts++;
      notification.lastAttemptAt = new Date();
      
      return success;
    } catch (error) {
      console.error('SMS sending error:', error);
      return false;
    }
  }

  /**
   * Store in-app notification
   */
  private async storeInAppNotification(notification: NotificationData): Promise<boolean> {
    try {
      await connectToDatabase();

      // Extract title from message or generate one
      const title = this.generateInAppTitle(notification);
      
      // Create and save the in-app notification to database
      const inAppNotification = new InAppNotification({
        id: notification.id,
        merchantId: notification.merchantId!,
        title,
        message: notification.message,
        type: this.mapToInAppType(notification.metadata?.notificationType || 'system'),
        priority: this.mapToPriority(notification.metadata?.urgency || 'medium'),
        data: notification.data || {},
        status: 'unread',
      });

      await inAppNotification.save();

      // Update the original notification status
      notification.status = 'delivered';
      notification.sentAt = new Date();
      notification.deliveredAt = new Date();
      notification.attempts++;
      notification.lastAttemptAt = new Date();

      // TODO: Send real-time notification via WebSocket when implemented
      console.log(`In-app notification stored for merchant ${notification.merchantId}: ${title}`);
      
      return true;
    } catch (error) {
      console.error('In-app notification storage error:', error);
      return false;
    }
  }

  /**
   * Get merchant notification preferences
   */
  private async getMerchantPreferences(merchantId: string): Promise<NotificationPreferences> {
    // In production, retrieve from database
    return this.getDefaultNotificationPreferences(merchantId);
  }

  /**
   * Create email notification for merchant
   */
  private async createEmailNotification(
    merchantId: string, 
    options: MerchantNotificationOptions,
    preferences: NotificationPreferences
  ): Promise<NotificationData> {
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'email',
      recipient: preferences.email.address,
      subject: this.getEmailSubject(options.type, options),
      message: this.getEmailMessage(options.type, options),
      data: options,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      metadata: { merchantId, notificationType: options.type },
      merchantId,
      customerId: options.customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create SMS notification for merchant
   */
  private async createSmsNotification(
    merchantId: string, 
    options: MerchantNotificationOptions,
    preferences: NotificationPreferences
  ): Promise<NotificationData> {
    return {
      id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'sms',
      recipient: preferences.sms.phone!,
      message: this.getSmsMessage(options.type, options),
      data: options,
      status: 'pending',
      attempts: 0,
      maxAttempts: 2,
      metadata: { merchantId, notificationType: options.type },
      merchantId,
      customerId: options.customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create in-app notification for merchant
   */
  private async createInAppNotification(
    merchantId: string, 
    options: MerchantNotificationOptions
  ): Promise<NotificationData> {
    return {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'in_app',
      recipient: merchantId,
      message: this.getInAppMessage(options.type, options),
      data: options,
      status: 'pending',
      attempts: 0,
      maxAttempts: 1,
      metadata: { merchantId, notificationType: options.type },
      merchantId,
      customerId: options.customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Message generation methods
  private getEmailSubject(type: string, options: MerchantNotificationOptions): string {
    const subjects: Record<string, string> = {
      'payment_received': `Payment Received - ${options.amount ? `$${(options.amount / 100).toFixed(2)}` : 'New Payment'}`,
      'payment_failed': 'Payment Failed - Action Required',
      'subscription_created': 'New Subscription Created',
      'subscription_canceled': 'Subscription Canceled',
      'subscription_payment_failed': 'Subscription Payment Failed',
      'low_balance': 'Low Balance Alert',
      'security_alert': 'Security Alert - Immediate Action Required',
    };
    return subjects[type] || `Notification: ${type}`;
  }

  private getEmailMessage(type: string, options: MerchantNotificationOptions): string {
    // In production, use email templates
    return `You have a new ${type} notification. Details: ${JSON.stringify(options, null, 2)}`;
  }

  private getSmsMessage(type: string, options: MerchantNotificationOptions): string {
    const messages: Record<string, string> = {
      'payment_failed': `Payment failed for ${options.amount ? `$${(options.amount / 100).toFixed(2)}` : 'payment'}. Check your dashboard.`,
      'security_alert': 'SECURITY ALERT: Unusual activity detected. Login to your dashboard immediately.',
      'subscription_payment_failed': `Subscription payment failed${options.failedPaymentCount ? ` (attempt ${options.failedPaymentCount})` : ''}. Update payment method.`,
    };
    return messages[type] || `${type}: Check your dashboard for details.`;
  }

  private getInAppMessage(type: string, options: MerchantNotificationOptions): string {
    return `${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - Click for details`;
  }

  // Helper methods
  private shouldSendEmailNotification(type: string, preferences: NotificationPreferences): boolean {
    const typeMapping: Record<string, keyof NotificationPreferences['email']['types']> = {
      'payment_received': 'payment_received',
      'payment_failed': 'payment_failed', 
      'subscription_created': 'subscription_created',
      'subscription_canceled': 'subscription_canceled',
      'low_balance': 'low_balance',
      'security_alert': 'security_alerts',
    };
    
    const prefKey = typeMapping[type];
    return prefKey ? preferences.email.types[prefKey] : true;
  }

  private shouldSendSmsNotification(type: string, preferences: NotificationPreferences): boolean {
    const typeMapping: Record<string, keyof NotificationPreferences['sms']['types']> = {
      'payment_failed': 'payment_failed',
      'security_alert': 'security_alerts',
    };
    
    const prefKey = typeMapping[type];
    return prefKey ? preferences.sms.types[prefKey] : false;
  }

  private getDefaultChannels(urgency: string): ('email' | 'sms' | 'webhook' | 'in_app')[] {
    switch (urgency) {
      case 'critical':
        return ['email', 'sms', 'webhook', 'in_app'];
      case 'high':
        return ['email', 'webhook', 'in_app'];
      case 'medium':
        return ['email', 'in_app'];
      case 'low':
        return ['in_app'];
      default:
        return ['email'];
    }
  }

  private getDefaultNotificationPreferences(merchantId: string): NotificationPreferences {
    return {
      merchantId,
      email: {
        enabled: true,
        address: 'merchant@example.com', // Would get from merchant profile
        verificationRequired: true,
        types: {
          payment_received: true,
          payment_failed: true,
          subscription_created: true,
          subscription_canceled: true,
          low_balance: true,
          security_alerts: true,
          system_updates: false,
          marketing: false,
        },
      },
      sms: {
        enabled: false,
        verificationRequired: true,
        types: {
          critical_alerts: true,
          payment_failed: true,
          security_alerts: true,
        },
      },
      webhook: {
        enabled: true,
        events: ['payment.*', 'subscription.*'],
      },
      inApp: {
        enabled: true,
        types: {
          all_events: false,
          important_only: true,
        },
      },
    };
  }

  // New helper methods for in-app notifications
  private generateInAppTitle(notification: NotificationData): string {
    const type = notification.metadata?.notificationType || 'notification';
    
    const titleMap: Record<string, string> = {
      'payment_received': 'Payment Received',
      'payment_failed': 'Payment Failed',
      'subscription_created': 'New Subscription',
      'subscription_canceled': 'Subscription Canceled',
      'subscription_payment_failed': 'Subscription Payment Failed',
      'low_balance': 'Low Balance Alert',
      'security_alert': 'Security Alert',
      'api_key_expires': 'API Key Expiring',
      'withdrawal_completed': 'Withdrawal Completed',
    };

    return titleMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }

  private mapToInAppType(notificationType: string): IInAppNotification['type'] {
    const typeMap: Record<string, IInAppNotification['type']> = {
      'payment_received': 'payment',
      'payment_failed': 'payment',
      'subscription_created': 'subscription',
      'subscription_canceled': 'subscription',
      'subscription_payment_failed': 'subscription',
      'low_balance': 'account',
      'security_alert': 'security',
      'api_key_expires': 'api',
      'withdrawal_completed': 'withdrawal',
      'webhook_failed': 'webhook',
    };

    return typeMap[notificationType] || 'system';
  }

  private mapToPriority(urgency: string): IInAppNotification['priority'] {
    const priorityMap: Record<string, IInAppNotification['priority']> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'urgent',
    };

    return priorityMap[urgency] || 'medium';
  }

  // In-app notification management methods
  /**
   * Get in-app notifications for a merchant
   */
  async getInAppNotifications(
    merchantId: string,
    options: {
      status?: 'unread' | 'read' | 'archived';
      type?: IInAppNotification['type'];
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{
    notifications: IInAppNotification[];
    total: number;
    unreadCount: number;
  }> {
    await connectToDatabase();

    const query: any = { merchantId };
    
    if (options.status) {
      query.status = options.status;
    }
    
    if (options.type) {
      query.type = options.type;
    }

    const limit = Math.min(options.limit || 50, 100);
    const skip = options.skip || 0;

    const [notifications, total, unreadCount] = await Promise.all([
      InAppNotification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      InAppNotification.countDocuments(query),
      InAppNotification.countDocuments({ merchantId, status: 'unread' }),
    ]);

    return {
      notifications: notifications as unknown as IInAppNotification[],
      total,
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(
    merchantId: string,
    notificationId: string
  ): Promise<IInAppNotification | null> {
    await connectToDatabase();

    const notification = await InAppNotification.findOneAndUpdate(
      { id: notificationId, merchantId },
      { 
        status: 'read', 
        readAt: new Date() 
      },
      { new: true }
    );

    if (notification) {
      // TODO: Send real-time update via WebSocket when implemented
      console.log(`Notification ${notificationId} marked as read for merchant ${merchantId}`);
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a merchant
   */
  async markAllNotificationsAsRead(merchantId: string): Promise<number> {
    await connectToDatabase();

    const result = await InAppNotification.updateMany(
      { merchantId, status: 'unread' },
      { 
        status: 'read', 
        readAt: new Date() 
      }
    );

    if (result.modifiedCount > 0) {
      // TODO: Send real-time update via WebSocket when implemented
      console.log(`${result.modifiedCount} notifications marked as read for merchant ${merchantId}`);
    }

    return result.modifiedCount;
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    merchantId: string,
    notificationId: string
  ): Promise<boolean> {
    await connectToDatabase();

    const result = await InAppNotification.deleteOne({
      id: notificationId,
      merchantId,
    });

    if (result.deletedCount > 0) {
      // TODO: Send real-time update via WebSocket when implemented
      console.log(`Notification ${notificationId} deleted for merchant ${merchantId}`);
    }

    return result.deletedCount > 0;
  }

  /**
   * Get unread count for merchant
   */
  async getUnreadNotificationCount(merchantId: string): Promise<number> {
    await connectToDatabase();
    
    return InAppNotification.countDocuments({ 
      merchantId, 
      status: 'unread' 
    });
  }
}

export const notificationService = new NotificationService();