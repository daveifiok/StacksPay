import { Router, Request, Response } from 'express';
import { stxPaymentController } from '@/controllers/payment/STXPaymentController';
import { stxWebhookController } from '@/controllers/webhook/STXWebhookController';
import { apiKeyMiddleware, requirePermissions } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: STX Payments
 *   description: STX payment management APIs
 */

/**
 * @swagger
 * tags:
 *   name: STX Webhooks
 *   description: STX Chainhook webhook endpoints
 */

// ===== STX PAYMENT ROUTES (Merchant API) =====

/**
 * @swagger
 * /api/payments/stx:
 *   post:
 *     tags: [STX Payments]
 *     summary: Create STX payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSTXPaymentRequest'
 *     responses:
 *       201:
 *         description: STX payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/STXPaymentResponse'
 */
router.post('/stx', apiKeyMiddleware, requirePermissions(['payments:create']), asyncHandler(stxPaymentController.createPayment.bind(stxPaymentController)));

/**
 * @swagger
 * /api/payments/stx/{paymentId}:
 *   get:
 *     tags: [STX Payments]
 *     summary: Get STX payment status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 */
router.get('/stx/:paymentId', apiKeyMiddleware, requirePermissions(['payments:read']), asyncHandler(stxPaymentController.getPaymentStatus.bind(stxPaymentController)));

// Manual check payment on blockchain
router.post('/stx/:paymentId/check', apiKeyMiddleware, requirePermissions(['payments:write']), asyncHandler(stxPaymentController.manualCheckPayment.bind(stxPaymentController)));

/**
 * @swagger
 * /api/payments/stx:
 *   get:
 *     tags: [STX Payments]
 *     summary: List STX payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, settled, refunded, expired, failed]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
router.get('/stx', apiKeyMiddleware, requirePermissions(['payments:read']), asyncHandler(stxPaymentController.listPayments.bind(stxPaymentController)));

/**
 * @swagger
 * /api/payments/stx/{paymentId}/cancel:
 *   post:
 *     tags: [STX Payments]
 *     summary: Cancel STX payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 */
router.post('/stx/:paymentId/cancel', apiKeyMiddleware, requirePermissions(['payments:write']), asyncHandler(stxPaymentController.cancelPayment.bind(stxPaymentController)));

/**
 * @swagger
 * /api/payments/stx/analytics:
 *   get:
 *     tags: [STX Payments]
 *     summary: Get STX payment analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Analytics retrieved successfully
 */
router.get('/stx/analytics', apiKeyMiddleware, requirePermissions(['payments:read']), asyncHandler(stxPaymentController.getAnalytics.bind(stxPaymentController)));

// ===== STX CHAINHOOK WEBHOOK ROUTES (Public - Webhook Signature Auth) =====

/**
 * @swagger
 * /api/chainhook/stx/transfers:
 *   post:
 *     tags: [STX Webhooks]
 *     summary: Process STX transfer events from Chainhook
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChainhookSTXTransferEvent'
 *     responses:
 *       200:
 *         description: STX transfer events processed successfully
 */
router.post('/chainhook/stx/transfers', asyncHandler(stxWebhookController.processSTXTransfers.bind(stxWebhookController)));

/**
 * @swagger
 * /api/chainhook/stx/contract:
 *   post:
 *     tags: [STX Webhooks]
 *     summary: Process STX contract events from Chainhook
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Contract events processed successfully
 */
router.post('/chainhook/stx/contract', asyncHandler(stxWebhookController.processContractEvents.bind(stxWebhookController)));

/**
 * @swagger
 * /api/chainhook/stx/health:
 *   get:
 *     tags: [STX Webhooks]
 *     summary: Health check for STX webhook endpoints
 *     responses:
 *       200:
 *         description: Webhook endpoints are healthy
 */
router.get('/chainhook/stx/health', asyncHandler(stxWebhookController.healthCheck.bind(stxWebhookController)));

/**
 * @swagger
 * /api/chainhook/stx/config:
 *   get:
 *     tags: [STX Webhooks]
 *     summary: Get Chainhook configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chainhook configuration retrieved successfully
 */
router.get('/chainhook/stx/config', apiKeyMiddleware, requirePermissions(['webhooks:read']), asyncHandler(stxWebhookController.getChainhookConfig.bind(stxWebhookController)));

/**
 * @swagger
 * /api/chainhook/stx/test:
 *   post:
 *     tags: [STX Webhooks]
 *     summary: Test STX webhook processing (Development)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [transfer, contract]
 *               testData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Test webhook processed successfully
 */
router.post('/chainhook/stx/test', apiKeyMiddleware, requirePermissions(['webhooks:write']), asyncHandler(stxWebhookController.testWebhook.bind(stxWebhookController)));

// ===== PUBLIC STX PAYMENT STATUS ROUTES (For Customer Checkout) =====

/**
 * @swagger
 * /api/public/payments/stx/{paymentId}/status:
 *   get:
 *     tags: [STX Payments]
 *     summary: Get public STX payment status (for checkout page)
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 */
router.get('/public/stx/:paymentId/status', asyncHandler(async (req: Request, res: Response) => {
  // Public endpoint for checkout page - no auth required
  const { paymentId } = req.params;
  
  try {
    // Import the STX Payment model
    const { STXPayment } = await import('@/models/payment/STXPayment');
    
    const payment = await STXPayment.findOne({ paymentId }).select({
      paymentId: 1,
      status: 1,
      expectedAmount: 1,
      receivedAmount: 1,
      uniqueAddress: 1,
      expiresAt: 1,
      confirmedAt: 1,
      settledAt: 1,
      metadata: 1,
      usdAmount: 1,
      createdAt: 1
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Generate QR code data for wallet scanning
    const qrCodeData = `stx:${payment.uniqueAddress}?amount=${payment.expectedAmount}&memo=${encodeURIComponent(payment.metadata)}`;

    res.json({
      success: true,
      data: {
        id: payment.paymentId,
        status: payment.status,
        amount: payment.expectedAmount / 1000000, // Convert microSTX to STX for display
        currency: 'STX',
        paymentMethod: 'stx',
        paymentAddress: payment.uniqueAddress,
        description: payment.metadata,
        expiresAt: payment.expiresAt.toISOString(),
        qrCode: null, // QR code image would be generated here
        qrCodeData,
        merchantInfo: {
          name: 'StacksPay Merchant',
          logo: null
        },
        paymentInstructions: {
          title: 'How to Pay with STX',
          steps: [
            'Open your Stacks wallet (Hiro, Xverse, Leather)',
            `Send exactly ${payment.expectedAmount / 1000000} STX to the address above`,
            'Include the memo if your wallet supports it',
            'Wait for blockchain confirmation (typically 1-2 minutes)',
            'You will be redirected automatically when payment is confirmed'
          ],
          amount: `${payment.expectedAmount / 1000000} STX`,
          note: 'Make sure to send the exact amount. Payments with different amounts may not be processed automatically.'
        }
      }
    });

  } catch (error) {
    console.error('Error getting public STX payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/public/payments/stx/{paymentId}/process:
 *   post:
 *     tags: [STX Payments]
 *     summary: Process STX payment from checkout page
 *     parameters:
 *       - in: path
 *         name: paymentId
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
 *               walletAddress:
 *                 type: string
 *               transactionId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processing initiated
 */
router.post('/public/stx/:paymentId/process', asyncHandler(async (req: Request, res: Response) => {
  // Public endpoint for checkout page - no auth required
  const { paymentId } = req.params;
  const { walletAddress, transactionId, paymentMethod, signature } = req.body;
  
  try {
    console.log('Processing STX payment:', {
      paymentId,
      walletAddress,
      transactionId,
      paymentMethod
    });

    // In a real implementation, this would:
    // 1. Validate the transaction ID on the blockchain
    // 2. Verify the payment amount and recipient
    // 3. Update the payment status
    // 4. Trigger settlement process
    
    // For now, return success (Chainhook will handle the real processing)
    res.json({
      success: true,
      message: 'Payment processing initiated',
      data: {
        paymentId,
        transactionId,
        status: 'processing'
      }
    });

  } catch (error) {
    console.error('Error processing STX payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment'
    });
  }
}));

export default router;