import express from 'express';
import { WebhookController } from '@/controllers/webhook/WebhookController';
import { sessionMiddleware } from '@/middleware/auth.middleware';
import { rateLimitMiddleware } from '@/middleware/rate-limit.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const router = express.Router();
const webhookController = new WebhookController();

/**
 * Webhook routes for StacksPay Merchant Dashboard
 * All routes require JWT authentication
 */

// Apply JWT middleware and rate limiting to all webhook routes
router.use(sessionMiddleware);
router.use(rateLimitMiddleware);

/**
 * @swagger
 * /api/webhooks:
 *   post:
 *     tags: [Webhooks]
 *     summary: Create a webhook endpoint
 *     description: Register a webhook URL for receiving payment notifications
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - events
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Webhook endpoint URL
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [payment.created, payment.confirmed, payment.succeeded, payment.failed, payment.expired, payment.cancelled, payment.refunded, payment.disputed, customer.created, customer.updated, subscription.created, subscription.updated, subscription.cancelled, webhook.test]
 *               secret:
 *                 type: string
 *                 description: Optional webhook secret for signature verification
 *     responses:
 *       201:
 *         description: Webhook created successfully
 */
router.post('/', asyncHandler(webhookController.createWebhook.bind(webhookController)));

/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     tags: [Webhooks]
 *     summary: List webhook endpoints
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Webhooks retrieved successfully
 */
router.get('/', asyncHandler(webhookController.listWebhooks.bind(webhookController)));

/**
 * @swagger
 * /api/webhooks/stats:
 *   get:
 *     tags: [Webhooks]
 *     summary: Get webhook statistics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Webhook statistics retrieved successfully
 */
router.get('/stats', asyncHandler(webhookController.getWebhookStats.bind(webhookController)));

/**
 * @swagger
 * /api/webhooks/{id}:
 *   get:
 *     tags: [Webhooks]
 *     summary: Get webhook details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook details retrieved successfully
 */
router.get('/:id', asyncHandler(webhookController.getWebhook.bind(webhookController)));

/**
 * @swagger
 * /api/webhooks/{id}:
 *   put:
 *     tags: [Webhooks]
 *     summary: Update webhook
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Webhook updated successfully
 */
router.put('/:id', asyncHandler(webhookController.updateWebhook.bind(webhookController)));

/**
 * @swagger
 * /api/webhooks/{id}:
 *   delete:
 *     tags: [Webhooks]
 *     summary: Delete webhook
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook deleted successfully
 */
router.delete('/:id', asyncHandler(webhookController.deleteWebhook.bind(webhookController)));

/**
 * @swagger
 * /api/webhooks/{id}/test:
 *   post:
 *     tags: [Webhooks]
 *     summary: Test webhook endpoint
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook test completed
 */
router.post('/:id/test', asyncHandler(webhookController.testWebhook.bind(webhookController)));

/**
 * @swagger
 * /api/webhooks/{id}/stats:
 *   get:
 *     tags: [Webhooks]
 *     summary: Get specific webhook statistics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook statistics retrieved successfully
 */
router.get('/:id/stats', asyncHandler(webhookController.getWebhookStats.bind(webhookController)));

/**
 * @swagger
 * /api/webhooks/{id}/retry:
 *   post:
 *     tags: [Webhooks]
 *     summary: Retry failed webhook deliveries
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook retry initiated
 */
router.post('/:id/retry', asyncHandler(webhookController.retryWebhook.bind(webhookController)));

export default router;