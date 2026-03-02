import { Request, Response } from 'express';
import { createLogger } from '@/utils/logger';
import { notificationService } from '@/services/notification/notification-service';

const logger = createLogger('NotificationController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Notification ID
 *         merchantId:
 *           type: string
 *           description: Merchant ID who owns the notification
 *         type:
 *           type: string
 *           enum: [payment_received, payment_failed, deposit_confirmed, withdrawal_completed, system_alert, api_error]
 *           description: Type of notification
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message content
 *         data:
 *           type: object
 *           description: Additional notification data
 *         status:
 *           type: string
 *           enum: [unread, read]
 *           description: Read status
 *         urgency:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Notification urgency level
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         readAt:
 *           type: string
 *           format: date-time
 *           description: Read timestamp
 *     
 *     NotificationList:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             notifications:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: number
 *                 limit:
 *                   type: number
 *                 total:
 *                   type: number
 *                 pages:
 *                   type: number
 *             unreadCount:
 *               type: number
 *     
 *     UnreadCountResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             unreadCount:
 *               type: number
 */

export class NotificationController {
  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     tags: [Notifications]
   *     summary: Get notifications for authenticated merchant
   *     description: Retrieve paginated list of notifications with filtering options
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [unread, read]
   *         description: Filter by read status
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [payment_received, payment_failed, deposit_confirmed, withdrawal_completed, system_alert, api_error]
   *         description: Filter by notification type
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 20
   *           minimum: 1
   *           maximum: 100
   *         description: Number of notifications per page
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           default: 1
   *           minimum: 1
   *         description: Page number
   *     responses:
   *       200:
   *         description: Notifications retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/NotificationList'
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Merchant ID not found' 
        });
        return;
      }

      const {
        status,
        type,
        limit = '20',
        page = '1'
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100); // Cap at 100
      const skip = (pageNum - 1) * limitNum;

      const result = await notificationService.getInAppNotifications(merchantId, {
        status: status as any,
        type: type as any,
        limit: limitNum,
        skip,
      });

      logger.debug('Notifications retrieved', {
        merchantId,
        page: pageNum,
        limit: limitNum,
        total: result.total,
        unreadCount: result.unreadCount
      });

      res.json({
        success: true,
        data: {
          notifications: result.notifications,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: result.total,
            pages: Math.ceil(result.total / limitNum),
          },
          unreadCount: result.unreadCount,
        },
      });

    } catch (error) {
      logger.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications',
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/unread-count:
   *   get:
   *     tags: [Notifications]
   *     summary: Get unread notification count
   *     description: Get the count of unread notifications for the authenticated merchant
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Unread count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UnreadCountResponse'
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Merchant ID not found' 
        });
        return;
      }

      const unreadCount = await notificationService.getUnreadNotificationCount(merchantId);

      res.json({
        success: true,
        data: { unreadCount },
      });

    } catch (error) {
      logger.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch unread count',
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/{id}/read:
   *   put:
   *     tags: [Notifications]
   *     summary: Mark notification as read
   *     description: Mark a specific notification as read
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Notification ID
   *     responses:
   *       200:
   *         description: Notification marked as read successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     notification:
   *                       $ref: '#/components/schemas/Notification'
   *       404:
   *         description: Notification not found
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Merchant ID not found' 
        });
        return;
      }

      const { id } = req.params;
      const notification = await notificationService.markNotificationAsRead(merchantId, id);

      if (!notification) {
        res.status(404).json({
          success: false,
          error: 'Notification not found',
        });
        return;
      }

      logger.info('Notification marked as read', {
        merchantId,
        notificationId: id
      });

      res.json({
        success: true,
        data: { notification },
      });

    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read',
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/read-all:
   *   put:
   *     tags: [Notifications]
   *     summary: Mark all notifications as read
   *     description: Mark all unread notifications as read for the authenticated merchant
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All notifications marked as read successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                     count:
   *                       type: number
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Merchant ID not found' 
        });
        return;
      }

      const count = await notificationService.markAllNotificationsAsRead(merchantId);

      logger.info('All notifications marked as read', {
        merchantId,
        count
      });

      res.json({
        success: true,
        data: { 
          message: `${count} notifications marked as read`,
          count 
        },
      });

    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read',
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/{id}:
   *   delete:
   *     tags: [Notifications]
   *     summary: Delete notification
   *     description: Delete a specific notification
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Notification ID
   *     responses:
   *       200:
   *         description: Notification deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *       404:
   *         description: Notification not found
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Merchant ID not found' 
        });
        return;
      }

      const { id } = req.params;
      const deleted = await notificationService.deleteNotification(merchantId, id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Notification not found',
        });
        return;
      }

      logger.info('Notification deleted', {
        merchantId,
        notificationId: id
      });

      res.json({
        success: true,
        data: { message: 'Notification deleted successfully' },
      });

    } catch (error) {
      logger.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete notification',
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/test:
   *   post:
   *     tags: [Notifications]
   *     summary: Create test notification (Development)
   *     description: Create a test notification for development and testing purposes
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [payment_received, payment_failed, deposit_confirmed, withdrawal_completed, system_alert, api_error]
   *                 default: payment_received
   *               urgency:
   *                 type: string
   *                 enum: [low, medium, high, critical]
   *                 default: medium
   *               amount:
   *                 type: number
   *                 default: 5000
   *                 description: Amount in satoshis
   *               currency:
   *                 type: string
   *                 default: USD
   *     responses:
   *       200:
   *         description: Test notification created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                     result:
   *                       type: object
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async createTestNotification(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Merchant ID not found' 
        });
        return;
      }

      const { 
        type = 'payment_received', 
        urgency = 'medium',
        amount = 5000,
        currency = 'USD'
      } = req.body;

      // Create test notification
      const result = await notificationService.sendMerchantNotification(merchantId, {
        type,
        urgency: urgency as any,
        amount, 
        currency,
        paymentId: `test_payment_${Date.now()}`,
        channels: ['in_app'],
      });

      logger.info('Test notification created', {
        merchantId,
        type,
        urgency,
        amount
      });

      res.json({
        success: true,
        data: { 
          message: 'Test notification sent',
          result 
        },
      });

    } catch (error) {
      logger.error('Error creating test notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create test notification',
      });
    }
  }
}
