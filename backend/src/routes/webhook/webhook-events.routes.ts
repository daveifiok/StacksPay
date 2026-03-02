import express from 'express';
import { WebhookController } from '@/controllers/webhook/WebhookController';
import { sessionMiddleware } from '@/middleware/auth.middleware';
import { rateLimitMiddleware } from '@/middleware/rate-limit.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const router = express.Router();
const webhookController = new WebhookController();

/**
 * Webhook Events routes for StacksPay Merchant Dashboard
 * All routes require JWT authentication
 */

// Apply JWT middleware and rate limiting to all webhook event routes
router.use(sessionMiddleware);
router.use(rateLimitMiddleware);

/**
 * @swagger
 * /api/webhook-events:
 *   get:
 *     tags: [Webhook Events]
 *     summary: List all webhook events
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed, pending, retrying]
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Webhook events retrieved successfully
 */
router.get('/', asyncHandler(webhookController.getAllWebhookEvents.bind(webhookController)));

/**
 * @swagger
 * /api/webhook-events/{id}:
 *   get:
 *     tags: [Webhook Events]
 *     summary: Get webhook event details
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
 *         description: Webhook event details retrieved successfully
 */
router.get('/:id', asyncHandler(webhookController.getWebhookEvent.bind(webhookController)));

/**
 * @swagger
 * /api/webhook-events/{id}/retry:
 *   post:
 *     tags: [Webhook Events]
 *     summary: Retry a specific webhook event
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
 *         description: Webhook event retry initiated
 */
router.post('/:id/retry', asyncHandler(webhookController.retryWebhookEvent.bind(webhookController)));

export default router;
