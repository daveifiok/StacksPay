import { Router, Request, Response } from 'express';
import { stxPaymentController } from '@/controllers/payment/STXPaymentController';
import { sessionMiddleware } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard Payments
 *   description: Session-based payment management for merchant dashboard
 */

// Helper function to parse expiry time to minutes
function parseExpiryToMinutes(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1));
  
  switch(unit) {
    case 'h': return value * 60;
    case 'd': return value * 24 * 60;
    case 'w': return value * 7 * 24 * 60;
    default: return 24 * 60; // Default 24 hours
  }
}

// ===== SESSION-BASED PAYMENT ROUTES (Dashboard) =====

/**
 * @swagger
 * /api/auth/payments/stx:
 *   get:
 *     tags: [Dashboard Payments]
 *     summary: List STX payments for dashboard
 *     security:
 *       - bearerAuth: []
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
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: STX payments retrieved successfully
 */
router.get('/stx', sessionMiddleware, asyncHandler(stxPaymentController.listPayments.bind(stxPaymentController)));

/**
 * @swagger
 * /api/auth/payments/stx:
 *   post:
 *     tags: [Dashboard Payments]
 *     summary: Create STX payment from dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - description
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount in STX
 *               description:
 *                 type: string
 *                 description: Payment description
 *               expiresIn:
 *                 type: string
 *                 description: Expiration time (e.g., '24h', '7d')
 *                 default: '24h'
 *               customerEmail:
 *                 type: string
 *                 format: email
 *                 description: Customer email address
 *               customId:
 *                 type: string
 *                 description: Custom payment identifier
 *               successUrl:
 *                 type: string
 *                 format: uri
 *                 description: Redirect URL after successful payment
 *               cancelUrl:
 *                 type: string
 *                 format: uri
 *                 description: Redirect URL after cancelled payment
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: STX payment created successfully
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
 *                     id:
 *                       type: string
 *                     url:
 *                       type: string
 *                     qrCode:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 */
router.post('/stx', sessionMiddleware, asyncHandler(stxPaymentController.createPayment.bind(stxPaymentController)));

/**
 * @swagger
 * /api/auth/payments/stx/{paymentId}:
 *   get:
 *     tags: [Dashboard Payments]
 *     summary: Get STX payment details for dashboard
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
 *         description: STX payment details retrieved successfully
 */
router.get('/stx/:paymentId', sessionMiddleware, asyncHandler(stxPaymentController.getPaymentStatus.bind(stxPaymentController)));

/**
 * @swagger
 * /api/auth/payments/stx/{paymentId}/cancel:
 *   post:
 *     tags: [Dashboard Payments]
 *     summary: Cancel STX payment from dashboard
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
 *         description: STX payment cancelled successfully
 */
router.post('/stx/:paymentId/cancel', sessionMiddleware, asyncHandler(stxPaymentController.cancelPayment.bind(stxPaymentController)));

/**
 * @swagger
 * /api/auth/payments/analytics:
 *   get:
 *     tags: [Dashboard Payments]
 *     summary: Get payment analytics for dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment analytics retrieved successfully
 */
router.get('/analytics', sessionMiddleware, asyncHandler(stxPaymentController.getAnalytics.bind(stxPaymentController)));

/**
 * @swagger
 * /api/auth/payments/links:
 *   post:
 *     tags: [Dashboard Payments]
 *     summary: Create payment link from dashboard (all currencies)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - description
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 enum: ['USD', 'BTC', 'STX', 'sBTC']
 *                 description: Payment currency
 *               paymentMethod:
 *                 type: string
 *                 enum: ['sbtc', 'btc', 'stx']
 *                 description: Preferred payment method
 *               description:
 *                 type: string
 *                 description: Payment description
 *               expiresIn:
 *                 type: string
 *                 description: Expiration time (e.g., '24h', '7d')
 *                 default: '24h'
 *               customerEmail:
 *                 type: string
 *                 format: email
 *                 description: Customer email address
 *               customId:
 *                 type: string
 *                 description: Custom payment identifier
 *               successUrl:
 *                 type: string
 *                 format: uri
 *                 description: Redirect URL after successful payment
 *               cancelUrl:
 *                 type: string
 *                 format: uri
 *                 description: Redirect URL after cancelled payment
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Payment link created successfully
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
 *                     id:
 *                       type: string
 *                     url:
 *                       type: string
 *                     qrCode:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 */
router.post('/links', sessionMiddleware, asyncHandler(async (req: Request, res: Response) => {
  // Route to appropriate payment controller based on currency
  const { currency, amount, description, expiresIn, customerEmail, customId, successUrl, cancelUrl, metadata } = req.body;
  
  if (currency === 'STX') {
    // Transform frontend fields to STX controller format
    const transformedBody = {
      expectedAmount: amount * 1000000, // Convert STX to microSTX
      metadata: description,
      expiresInMinutes: parseExpiryToMinutes(expiresIn || '24h'),
      usdAmount: undefined, // Can add USD conversion later
      customerEmail,
      customId,
      successUrl,
      cancelUrl,
      additionalMetadata: metadata
    };
    
    // Replace request body with transformed data
    req.body = transformedBody;
    
    // Create a custom response handler to transform the response
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // Transform STX controller response to match frontend expectations
      if (data.success && data.payment) {
        const transformedResponse = {
          success: true,
          data: {
            id: data.payment.paymentId,
            url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/${data.payment.paymentId}`,
            qrCode: data.payment.qrCodeData,
            paymentAddress: data.payment.uniqueAddress, // Add the unique payment address
            expiresAt: data.payment.expiresAt
          }
        };
        return originalJson(transformedResponse);
      }
      return originalJson(data);
    };
    
    // Use STX payment controller for STX payments
    return stxPaymentController.createPayment(req, res);
  }
  
  // For other currencies, we'd route to other controllers
  // For now, return not implemented
  res.status(501).json({
    success: false,
    error: `Payment links for ${currency} not yet implemented. Use STX for now.`
  });
}));

export default router;