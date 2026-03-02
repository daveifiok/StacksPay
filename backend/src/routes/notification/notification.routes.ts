import { Router } from 'express';
import { NotificationController } from '@/controllers/notification/NotificationController';
import { sessionMiddleware } from '@/middleware/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: In-app notification management for merchants
 */

/**
 * @swagger
 * /api/notifications/test:
 *   get:
 *     summary: Test endpoint to verify notifications API is working
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Notifications API is working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notifications API is working"
 *                 timestamp:
 *                   type: string
 *                   example: "2025-09-04T00:00:00.000Z"
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Notifications API is working',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/notifications',
      'GET /api/notifications/unread-count',
      'PUT /api/notifications/:id/read',
      'PUT /api/notifications/read-all',
      'DELETE /api/notifications/:id',
      'POST /api/notifications/test'
    ]
  });
});

// All notification routes require authentication
router.use(sessionMiddleware);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for authenticated merchant
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', notificationController.getNotifications.bind(notificationController));

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.put('/read-all', notificationController.markAllAsRead.bind(notificationController));

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/read', notificationController.markAsRead.bind(notificationController));

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     summary: Create test notification (Development)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.post('/test', notificationController.createTestNotification.bind(notificationController));

export default router;
