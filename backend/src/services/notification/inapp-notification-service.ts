// import { connectToDatabase } from '@/config/database';
// import { InAppNotification, IInAppNotification } from '@/models/Notification/Notification';
// import { MerchantNotificationOptions } from '@/interfaces/notification/notification.interface';
// // import { WebSocketService } from './websocket-service';

// /**
//  * In-App Notification Service
//  * Handles database-backed in-app notifications with real-time updates
//  */
// export class InAppNotificationService {
//   // private wsService: WebSocketService;

//   constructor() {
//     // this.wsService = WebSocketService.getInstance();
//   }

//   /**
//    * Create and store an in-app notification
//    */
//   async createNotification(
//     merchantId: string,
//     title: string,
//     message: string,
//     type: IInAppNotification['type'],
//     options: {
//       priority?: IInAppNotification['priority'];
//       data?: Record<string, any>;
//       actionUrl?: string;
//       actionLabel?: string;
//       expiresAt?: Date;
//     } = {}
//   ): Promise<IInAppNotification> {
//     await connectToDatabase();

//     const notification = new InAppNotification({
//       id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
//       merchantId,
//       title,
//       message,
//       type,
//       priority: options.priority || 'medium',
//       data: options.data || {},
//       actionUrl: options.actionUrl,
//       actionLabel: options.actionLabel,
//       expiresAt: options.expiresAt,
//       status: 'unread',
//     });

//     await notification.save();

//     // Send real-time notification via WebSocket
//     // Notify via WebSocket for real-time updates
//     /* this.wsService.sendToMerchant(merchantId, 'notification:new', {
//       id: notification.id,
//       title: notification.title,
//       message: notification.message,
//       type: notification.type,
//       priority: notification.priority,
//       data: notification.data,
//       actionUrl: notification.actionUrl,
//       actionLabel: notification.actionLabel,
//       createdAt: notification.createdAt,
//     }); */

//     return notification;
//   }

//   /**
//    * Create notification from MerchantNotificationOptions
//    */
//   async createFromOptions(
//     merchantId: string,
//     options: MerchantNotificationOptions
//   ): Promise<IInAppNotification> {
//     const { title, message } = this.generateNotificationContent(options);
    
//     return this.createNotification(
//       merchantId,
//       title,
//       message,
//       this.mapTypeToInAppType(options.type),
//       {
//         priority: this.mapUrgencyToPriority(options.urgency || 'medium'),
//         data: {
//           ...options,
//           originalType: options.type,
//         },
//         actionUrl: this.generateActionUrl(options),
//         actionLabel: this.generateActionLabel(options),
//       }
//     );
//   }

//   /**
//    * Get notifications for a merchant
//    */
//   async getNotifications(
//     merchantId: string,
//     options: {
//       status?: 'unread' | 'read' | 'archived';
//       type?: IInAppNotification['type'];
//       limit?: number;
//       skip?: number;
//       priority?: IInAppNotification['priority'];
//     } = {}
//   ): Promise<{
//     notifications: IInAppNotification[];
//     total: number;
//     unreadCount: number;
//   }> {
//     await connectToDatabase();

//     const query: any = { merchantId };
    
//     if (options.status) {
//       query.status = options.status;
//     }
    
//     if (options.type) {
//       query.type = options.type;
//     }
    
//     if (options.priority) {
//       query.priority = options.priority;
//     }

//     const limit = Math.min(options.limit || 50, 100);
//     const skip = options.skip || 0;

//     const [notifications, total, unreadCount] = await Promise.all([
//       InAppNotification.find(query)
//         .sort({ createdAt: -1 })
//         .limit(limit)
//         .skip(skip)
//         .lean(),
//       InAppNotification.countDocuments(query),
//       InAppNotification.countDocuments({ merchantId, status: 'unread' }),
//     ]);

//     return {
//       notifications: notifications as unknown as IInAppNotification[],
//       total,
//       unreadCount,
//     };
//   }

//   /**
//    * Mark notification as read
//    */
//   async markAsRead(
//     merchantId: string,
//     notificationId: string
//   ): Promise<IInAppNotification | null> {
//     await connectToDatabase();

//     const notification = await InAppNotification.findOneAndUpdate(
//       { id: notificationId, merchantId },
//       { 
//         status: 'read', 
//         readAt: new Date() 
//       },
//       { new: true }
//     );

//     if (notification) {
//       // Send real-time update
//       this.wsService.sendToMerchant(merchantId, 'notification:read', {
//         id: notification.id,
//       });

//       // Send updated unread count
//       const unreadCount = await InAppNotification.countDocuments({ 
//         merchantId, 
//         status: 'unread' 
//       });
      
//       this.wsService.sendToMerchant(merchantId, 'notification:unread_count', {
//         count: unreadCount,
//       });
//     }

//     return notification;
//   }

//   /**
//    * Mark multiple notifications as read
//    */
//   async markMultipleAsRead(
//     merchantId: string,
//     notificationIds: string[]
//   ): Promise<number> {
//     await connectToDatabase();

//     const result = await InAppNotification.updateMany(
//       { 
//         id: { $in: notificationIds }, 
//         merchantId,
//         status: 'unread'
//       },
//       { 
//         status: 'read', 
//         readAt: new Date() 
//       }
//     );

//     if (result.modifiedCount > 0) {
//       // Send real-time updates
//       notificationIds.forEach(id => {
//         this.wsService.sendToMerchant(merchantId, 'notification:read', { id });
//       });

//       // Send updated unread count
//       const unreadCount = await InAppNotification.countDocuments({ 
//         merchantId, 
//         status: 'unread' 
//       });
      
//       this.wsService.sendToMerchant(merchantId, 'notification:unread_count', {
//         count: unreadCount,
//       });
//     }

//     return result.modifiedCount;
//   }

//   /**
//    * Mark all notifications as read
//    */
//   async markAllAsRead(merchantId: string): Promise<number> {
//     await connectToDatabase();

//     const result = await InAppNotification.updateMany(
//       { merchantId, status: 'unread' },
//       { 
//         status: 'read', 
//         readAt: new Date() 
//       }
//     );

//     if (result.modifiedCount > 0) {
//       // Send real-time update
//       this.wsService.sendToMerchant(merchantId, 'notification:all_read', {});
//       this.wsService.sendToMerchant(merchantId, 'notification:unread_count', {
//         count: 0,
//       });
//     }

//     return result.modifiedCount;
//   }

//   /**
//    * Archive notification
//    */
//   async archiveNotification(
//     merchantId: string,
//     notificationId: string
//   ): Promise<IInAppNotification | null> {
//     await connectToDatabase();

//     const notification = await InAppNotification.findOneAndUpdate(
//       { id: notificationId, merchantId },
//       { status: 'archived' },
//       { new: true }
//     );

//     if (notification) {
//       this.wsService.sendToMerchant(merchantId, 'notification:archived', {
//         id: notification.id,
//       });
//     }

//     return notification;
//   }

//   /**
//    * Delete notification
//    */
//   async deleteNotification(
//     merchantId: string,
//     notificationId: string
//   ): Promise<boolean> {
//     await connectToDatabase();

//     const result = await InAppNotification.deleteOne({
//       id: notificationId,
//       merchantId,
//     });

//     if (result.deletedCount > 0) {
//       this.wsService.sendToMerchant(merchantId, 'notification:deleted', {
//         id: notificationId,
//       });
//     }

//     return result.deletedCount > 0;
//   }

//   /**
//    * Get unread count for merchant
//    */
//   async getUnreadCount(merchantId: string): Promise<number> {
//     await connectToDatabase();
    
//     return InAppNotification.countDocuments({ 
//       merchantId, 
//       status: 'unread' 
//     });
//   }

//   /**
//    * Clean up expired notifications
//    */
//   async cleanupExpiredNotifications(): Promise<number> {
//     await connectToDatabase();

//     const result = await InAppNotification.deleteMany({
//       expiresAt: { $lte: new Date() }
//     });

//     return result.deletedCount;
//   }

//   // Helper methods
//   private generateNotificationContent(options: MerchantNotificationOptions): {
//     title: string;
//     message: string;
//   } {
//     const contentMap: Record<string, { title: string; message: string }> = {
//       'payment_received': {
//         title: 'Payment Received',
//         message: `You received a payment${options.amount ? ` of $${(options.amount / 100).toFixed(2)}` : ''}${options.currency ? ` ${options.currency.toUpperCase()}` : ''}.`,
//       },
//       'payment_failed': {
//         title: 'Payment Failed',
//         message: `A payment${options.amount ? ` of $${(options.amount / 100).toFixed(2)}` : ''} has failed. Please review the transaction details.`,
//       },
//       'subscription_created': {
//         title: 'New Subscription',
//         message: 'A new subscription has been created successfully.',
//       },
//       'subscription_canceled': {
//         title: 'Subscription Canceled',
//         message: 'A subscription has been canceled.',
//       },
//       'low_balance': {
//         title: 'Low Balance Alert',
//         message: 'Your account balance is running low. Consider adding funds.',
//       },
//       'security_alert': {
//         title: 'Security Alert',
//         message: 'Unusual activity detected on your account. Please review immediately.',
//       },
//       'api_key_expires': {
//         title: 'API Key Expiring',
//         message: 'Your API key is expiring soon. Please generate a new one.',
//       },
//       'withdrawal_completed': {
//         title: 'Withdrawal Completed',
//         message: `Your withdrawal${options.amount ? ` of $${(options.amount / 100).toFixed(2)}` : ''} has been processed successfully.`,
//       },
//     };

//     return contentMap[options.type] || {
//       title: options.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
//       message: 'Please check your dashboard for more details.',
//     };
//   }

//   private mapTypeToInAppType(type: string): IInAppNotification['type'] {
//     const typeMap: Record<string, IInAppNotification['type']> = {
//       'payment_received': 'payment',
//       'payment_failed': 'payment',
//       'subscription_created': 'subscription',
//       'subscription_canceled': 'subscription',
//       'subscription_payment_failed': 'subscription',
//       'low_balance': 'account',
//       'security_alert': 'security',
//       'api_key_expires': 'api',
//       'withdrawal_completed': 'withdrawal',
//       'webhook_failed': 'webhook',
//     };

//     return typeMap[type] || 'system';
//   }

//   private mapUrgencyToPriority(urgency: string): IInAppNotification['priority'] {
//     const priorityMap: Record<string, IInAppNotification['priority']> = {
//       'low': 'low',
//       'medium': 'medium',
//       'high': 'high',
//       'critical': 'urgent',
//     };

//     return priorityMap[urgency] || 'medium';
//   }

//   private generateActionUrl(options: MerchantNotificationOptions): string | undefined {
//     const urlMap: Record<string, string> = {
//       'payment_received': `/dashboard/payments${options.paymentId ? `?id=${options.paymentId}` : ''}`,
//       'payment_failed': `/dashboard/payments${options.paymentId ? `?id=${options.paymentId}` : ''}`,
//       'subscription_created': `/dashboard/subscriptions${options.subscriptionId ? `?id=${options.subscriptionId}` : ''}`,
//       'subscription_canceled': `/dashboard/subscriptions${options.subscriptionId ? `?id=${options.subscriptionId}` : ''}`,
//       'low_balance': '/dashboard/settings/billing',
//       'security_alert': '/dashboard/settings/security',
//       'api_key_expires': '/dashboard/settings/api-keys',
//       'withdrawal_completed': '/dashboard/withdrawals',
//     };

//     return urlMap[options.type];
//   }

//   private generateActionLabel(options: MerchantNotificationOptions): string | undefined {
//     const labelMap: Record<string, string> = {
//       'payment_received': 'View Payment',
//       'payment_failed': 'View Details',
//       'subscription_created': 'View Subscription',
//       'subscription_canceled': 'View Subscription',
//       'low_balance': 'Add Funds',
//       'security_alert': 'Review Security',
//       'api_key_expires': 'Manage Keys',
//       'withdrawal_completed': 'View Withdrawal',
//     };

//     return labelMap[options.type];
//   }
// }

// export const inAppNotificationService = new InAppNotificationService();
