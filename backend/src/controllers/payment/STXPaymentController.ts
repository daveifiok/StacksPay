import { Request, Response } from 'express';
import { STXPayment } from '@/models/payment/STXPayment';
import { Merchant } from '@/models/merchant/Merchant';
import { stxContractService } from '@/services/contract/stx-contract-service';
import { merchantAuthService } from '@/services/contract/merchant-authorization-service';
import { webhookService } from '@/services/webhook/webhook-service';
import { stacksBlockchainMonitor } from '@/services/blockchain/stacks-blockchain-monitor';
import { createLogger } from '@/utils/logger';
import {
  CreateSTXPaymentRequest,
  STXPaymentStatusResponse
} from '@/interfaces/payment/stx-payment.interface';

const logger = createLogger('STXPaymentController');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateSTXPaymentRequest:
 *       type: object
 *       required:
 *         - expectedAmount
 *         - metadata
 *       properties:
 *         expectedAmount:
 *           type: number
 *           minimum: 1000
 *           description: Amount in microSTX (minimum 1000 = 0.001 STX)
 *         usdAmount:
 *           type: number
 *           minimum: 0
 *           description: Original USD amount
 *         stxPrice:
 *           type: number
 *           minimum: 0
 *           description: STX/USD rate at creation
 *         metadata:
 *           type: string
 *           maxLength: 500
 *           description: Payment description
 *         expiresInMinutes:
 *           type: number
 *           minimum: 1
 *           maximum: 1440
 *           default: 15
 *           description: Payment expiry in minutes
 *         customerInfo:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             address:
 *               type: string
 *     
 *     STXPaymentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         payment:
 *           type: object
 *           properties:
 *             paymentId:
 *               type: string
 *             uniqueAddress:
 *               type: string
 *             expectedAmount:
 *               type: number
 *             usdAmount:
 *               type: number
 *             expiresAt:
 *               type: string
 *               format: date-time
 *             qrCodeData:
 *               type: string
 *         error:
 *           type: string
 *     
 *     STXPaymentStatus:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         payment:
 *           type: object
 *           properties:
 *             paymentId:
 *               type: string
 *             status:
 *               type: string
 *               enum: [pending, confirmed, settled, refunded, expired, failed]
 *             expectedAmount:
 *               type: number
 *             receivedAmount:
 *               type: number
 *             uniqueAddress:
 *               type: string
 *             expiresAt:
 *               type: string
 *               format: date-time
 *             confirmedAt:
 *               type: string
 *               format: date-time
 *             settledAt:
 *               type: string
 *               format: date-time
 *             contractData:
 *               type: object
 *         error:
 *           type: string
 */

export class STXPaymentController {
  /**
   * @swagger
   * /api/payments/stx:
   *   post:
   *     tags: [STX Payments]
   *     summary: Create STX payment
   *     description: Create a new STX payment with unique address for customer to send funds
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
   *       400:
   *         description: Invalid request data
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const paymentRequest: CreateSTXPaymentRequest = req.body;

      // Validate required fields
      if (!paymentRequest.expectedAmount || !paymentRequest.metadata) {
        res.status(400).json({
          success: false,
          error: 'expectedAmount and metadata are required'
        });
        return;
      }

      // Validate minimum amount
      if (paymentRequest.expectedAmount < 1000) {
        res.status(400).json({
          success: false,
          error: 'Minimum payment amount is 1000 microSTX (0.001 STX)'
        });
        return;
      }

      // Validate merchant exists and accepts STX
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      if (!merchant.paymentPreferences?.acceptSTX) {
        res.status(400).json({
          success: false,
          error: 'Merchant does not accept STX payments'
        });
        return;
      }

      // Generate unique payment ID
      const paymentId = `stx_pay_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Generate unique address for this payment
      const addressResult = await stxContractService.generateUniqueSTXAddress(paymentId);

      // Calculate expiry
      const expiresInMinutes = Math.min(paymentRequest.expiresInMinutes || 60, 1440); // Default 1 hour, Max 24 hours
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      // Calculate total amount including transaction fees
      // The customer pays: productPrice + platformFee + settlementTxFee + transferTxFee
      // So merchant receives the full productPrice after fees are deducted
      const SETTLEMENT_TX_FEE = 180000; // ~0.18 STX for contract call
      const TRANSFER_TX_FEE = 180000; // ~0.18 STX for STX transfer
      const TOTAL_TX_FEE = SETTLEMENT_TX_FEE + TRANSFER_TX_FEE; // 0.36 STX total
      const feeRate = merchant.paymentPreferences?.feePercentage || 1;
      const platformFee = Math.floor((paymentRequest.expectedAmount * feeRate) / 100);
      const totalAmountToPay = paymentRequest.expectedAmount + platformFee + TOTAL_TX_FEE;

      // Create payment record
      const payment = new STXPayment({
        paymentId,
        merchantId,
        uniqueAddress: addressResult.address,
        encryptedPrivateKey: addressResult.encryptedPrivateKey,
        expectedAmount: totalAmountToPay, // Customer pays this total amount
        baseAmount: paymentRequest.expectedAmount, // Original product price (what merchant receives)
        usdAmount: paymentRequest.usdAmount,
        stxPriceAtCreation: paymentRequest.stxPrice,
        status: 'pending',
        metadata: paymentRequest.metadata,
        expiresAt,
        merchantFeeRate: feeRate * 100 // Store in basis points
      });

      await payment.save();

      // Get merchant's Stacks address - NO FALLBACK
      const merchantStacksAddress = merchant.stacksAddress || merchant.connectedWallets?.stacksAddress;

      if (!merchantStacksAddress) {
        logger.error('Merchant has no Stacks address configured');
        res.status(400).json({
          success: false,
          error: 'Merchant must connect a Stacks wallet before accepting payments. Please complete onboarding.'
        });
        return;
      }

      // Auto-authorize merchant if not already authorized
      logger.info(`🔐 Ensuring merchant is authorized: ${merchantStacksAddress}`);
      const authResult = await merchantAuthService.ensureMerchantAuthorized(merchantStacksAddress, merchant.paymentPreferences?.feePercentage || 1); // Use merchant's fee or 1% default

      if (!authResult.success) {
        // Check if authorization is pending (transaction broadcasted but not confirmed)
        if (authResult.error === 'AUTHORIZATION_PENDING') {
          logger.warn(`⏳ Merchant authorization pending (TX: ${authResult.txId}). Please wait 1-2 minutes and try again.`);
          res.status(202).json({
            success: false,
            error: 'MERCHANT_AUTHORIZATION_PENDING',
            message: 'Your merchant account is being authorized on the blockchain. Please wait 1-2 minutes and try creating the payment again.',
            authorizationTxId: authResult.txId,
            estimatedWaitTime: '1-2 minutes'
          });
          return;
        }

        // Other authorization errors
        logger.error(`Merchant authorization failed: ${authResult.error}`);
        res.status(500).json({
          success: false,
          error: 'Failed to authorize merchant on blockchain. Please try again or contact support.'
        });
        return;
      }

      const contractData = {
        paymentId,
        merchantAddress: merchantStacksAddress,
        uniqueAddress: addressResult.address,
        expectedAmount: totalAmountToPay, // Register total amount (includes fees)
        metadata: paymentRequest.metadata,
        expiresInBlocks: Math.ceil(expiresInMinutes / 10) // Convert minutes to blocks (~10 min per block)
      };

      logger.info(`📝 Registering payment with contract. Merchant address: ${merchantStacksAddress}`);

      const contractResult = await stxContractService.registerSTXPayment(contractData);
      if (contractResult.success && contractResult.txId) {
        logger.info(`✅ Payment registered on contract. TxID: ${contractResult.txId}`);
        await STXPayment.findOneAndUpdate(
          { paymentId },
          { $set: { contractRegistrationTxId: contractResult.txId } }
        );
      } else {
        logger.error(`❌ Failed to register payment on contract: ${contractResult.error}`);
      }

      // Generate QR code data for wallet scanning
      // Most Stacks wallets only support plain address in QR codes
      // Users will need to manually enter the amount
      const qrCodeData = addressResult.address;

      // Trigger webhook notification
      await webhookService.triggerWebhook(payment, 'payment.created');

      logger.info('STX payment created successfully', {
        paymentId,
        merchantId,
        baseAmount: paymentRequest.expectedAmount,
        totalAmount: totalAmountToPay,
        platformFee,
        txFees: TOTAL_TX_FEE,
        uniqueAddress: addressResult.address,
        expiresAt
      });

      res.status(201).json({
        success: true,
        payment: {
          paymentId,
          uniqueAddress: addressResult.address,
          expectedAmount: totalAmountToPay, // Total amount customer must pay
          baseAmount: paymentRequest.expectedAmount, // Original product price
          platformFee,
          txFee: TOTAL_TX_FEE, // Total transaction fees (settlement + transfer)
          usdAmount: paymentRequest.usdAmount,
          expiresAt: expiresAt.toISOString(),
          qrCodeData
        }
      });

    } catch (error) {
      logger.error('Error creating STX payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create STX payment'
      });
    }
  }

  /**
   * @swagger
   * /api/payments/stx/{paymentId}:
   *   get:
   *     tags: [STX Payments]
   *     summary: Get STX payment status
   *     description: Get the current status and details of an STX payment
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: paymentId
   *         required: true
   *         schema:
   *           type: string
   *         description: STX Payment ID
   *     responses:
   *       200:
   *         description: Payment status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/STXPaymentStatus'
   *       404:
   *         description: Payment not found
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const { paymentId } = req.params;

      const payment = await STXPayment.findOne({ 
        paymentId, 
        merchantId 
      }).populate('merchantId');

      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
        return;
      }

      // Get latest contract data if payment is registered
      let contractData = null;
      if (payment.contractRegistrationTxId) {
        try {
          contractData = await stxContractService.getPaymentData(paymentId);
        } catch (error) {
          logger.warn(`Failed to fetch contract data for payment ${paymentId}:`, error);
        }
      }

      const response: STXPaymentStatusResponse = {
        success: true,
        payment: {
          paymentId: payment.paymentId,
          status: payment.status,
          expectedAmount: payment.expectedAmount,
          receivedAmount: payment.receivedAmount,
          uniqueAddress: payment.uniqueAddress,
          expiresAt: payment.expiresAt.toISOString(),
          confirmedAt: payment.confirmedAt?.toISOString(),
          settledAt: payment.settledAt?.toISOString(),
          contractData
        }
      };

      res.json(response);

    } catch (error) {
      logger.error('Error getting STX payment status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment status'
      });
    }
  }

  /**
   * Manual check payment - queries blockchain for STX transfers
   */
  async manualCheckPayment(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const { paymentId } = req.params;

      // Verify payment belongs to merchant
      const payment = await STXPayment.findOne({
        paymentId,
        merchantId
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
        return;
      }

      logger.info(`🔍 Manual blockchain check requested for payment: ${paymentId}`);

      // Check blockchain for transfers
      const result = await stacksBlockchainMonitor.manualCheckPayment(paymentId);

      // Fetch updated payment status
      const updatedPayment = await STXPayment.findOne({ paymentId });

      res.json({
        success: true,
        payment: {
          paymentId: updatedPayment?.paymentId,
          status: updatedPayment?.status,
          expectedAmount: updatedPayment?.expectedAmount,
          receivedAmount: updatedPayment?.receivedAmount,
          uniqueAddress: updatedPayment?.uniqueAddress
        },
        blockchainCheck: {
          hasTransfer: result.hasTransfer,
          totalReceived: result.totalReceived,
          transactionCount: result.transactions?.length || 0
        }
      });

    } catch (error) {
      logger.error('Error in manual payment check:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check payment'
      });
    }
  }

  /**
   * @swagger
   * /api/payments/stx:
   *   get:
   *     tags: [STX Payments]
   *     summary: List STX payments
   *     description: Get paginated list of STX payments for authenticated merchant
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, confirmed, settled, refunded, expired, failed]
   *         description: Filter by payment status
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 20
   *           minimum: 1
   *           maximum: 100
   *         description: Number of payments per page
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           default: 1
   *           minimum: 1
   *         description: Page number
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter payments created after this date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter payments created before this date
   *     responses:
   *       200:
   *         description: Payments retrieved successfully
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
   *                     payments:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/STXPaymentStatus'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: number
   *                         limit:
   *                           type: number
   *                         total:
   *                           type: number
   *                         totalPages:
   *                           type: number
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async listPayments(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const {
        status,
        limit = '20',
        page = '1',
        startDate,
        endDate
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query: any = { merchantId };

      if (status) {
        query.status = status;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate as string);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate as string);
        }
      }

      // Get total count and payments in parallel
      const [total, payments] = await Promise.all([
        STXPayment.countDocuments(query),
        STXPayment.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean()
      ]);

      const totalPages = Math.ceil(total / limitNum);

      // Transform payments for response
      const transformedPayments = payments.map((payment: any) => ({
        id: payment.paymentId, // Frontend expects 'id' field
        paymentId: payment.paymentId,
        merchantId: payment.merchantId,
        amount: payment.expectedAmount / 1000000, // Convert microSTX to STX for display
        currency: 'STX',
        paymentMethod: 'stx',
        payoutMethod: 'stx',
        status: payment.status,
        description: payment.metadata,
        expectedAmount: payment.expectedAmount,
        receivedAmount: payment.receivedAmount,
        usdAmount: payment.usdAmount,
        depositAddress: payment.uniqueAddress,
        paymentAddress: payment.uniqueAddress,
        uniqueAddress: payment.uniqueAddress,
        metadata: payment.metadata,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
        expiresAt: payment.expiresAt.toISOString(),
        completedAt: payment.confirmedAt?.toISOString() || payment.settledAt?.toISOString(),
        confirmedAt: payment.confirmedAt?.toISOString(),
        settledAt: payment.settledAt?.toISOString(),
        transactionData: payment.receiveTxId ? {
          txId: payment.receiveTxId,
          timestamp: payment.confirmedAt?.toISOString()
        } : undefined,
        feeAmount: payment.feeAmount,
        netAmount: payment.netAmount,
        errorMessage: payment.errorMessage
      }));

      res.json({
        success: true,
        data: {
          payments: transformedPayments,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages
          }
        }
      });

    } catch (error) {
      logger.error('Error listing STX payments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list payments'
      });
    }
  }

  /**
   * @swagger
   * /api/payments/stx/{paymentId}/cancel:
   *   post:
   *     tags: [STX Payments]
   *     summary: Cancel STX payment
   *     description: Cancel a pending STX payment before it expires
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: paymentId
   *         required: true
   *         schema:
   *           type: string
   *         description: STX Payment ID
   *     responses:
   *       200:
   *         description: Payment cancelled successfully
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
   *                     payment:
   *                       $ref: '#/components/schemas/STXPaymentStatus'
   *       400:
   *         description: Payment cannot be cancelled
   *       404:
   *         description: Payment not found
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async cancelPayment(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const { paymentId } = req.params;

      const payment = await STXPayment.findOne({ 
        paymentId, 
        merchantId 
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
        return;
      }

      // Check if payment can be cancelled
      if (payment.status !== 'pending') {
        res.status(400).json({
          success: false,
          error: `Cannot cancel payment with status: ${payment.status}`
        });
        return;
      }

      // Update payment status to expired (cancelled)
      payment.status = 'expired';
      payment.errorMessage = 'Payment cancelled by merchant';
      await payment.save();

      // Trigger webhook notification
      await webhookService.triggerWebhook(payment, 'payment.cancelled');

      logger.info('STX payment cancelled', {
        paymentId,
        merchantId
      });

      res.json({
        success: true,
        data: {
          message: 'Payment cancelled successfully',
          payment: {
            paymentId: payment.paymentId,
            status: payment.status,
            expectedAmount: payment.expectedAmount,
            uniqueAddress: payment.uniqueAddress,
            expiresAt: payment.expiresAt.toISOString(),
            errorMessage: payment.errorMessage
          }
        }
      });

    } catch (error) {
      logger.error('Error cancelling STX payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel payment'
      });
    }
  }

  /**
   * @swagger
   * /api/payments/stx/analytics:
   *   get:
   *     tags: [STX Payments]
   *     summary: Get STX payment analytics
   *     description: Get analytics and statistics for STX payments
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for analytics period
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for analytics period
   *     responses:
   *       200:
   *         description: Analytics retrieved successfully
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
   *                     totalPayments:
   *                       type: number
   *                     successfulPayments:
   *                       type: number
   *                     failedPayments:
   *                       type: number
   *                     totalVolume:
   *                       type: number
   *                     totalVolumeUSD:
   *                       type: number
   *                     averagePaymentAmount:
   *                       type: number
   *                     successRate:
   *                       type: number
   *                     averageSettlementTime:
   *                       type: number
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Default: last 30 days
        endDate = new Date().toISOString()
      } = req.query;

      const query = {
        merchantId,
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };

      // Aggregate analytics data
      const [
        totalPayments,
        successfulPayments,
        failedPayments,
        volumeData,
        settlementTimes
      ] = await Promise.all([
        STXPayment.countDocuments(query),
        STXPayment.countDocuments({ ...query, status: 'settled' }),
        STXPayment.countDocuments({ ...query, status: { $in: ['failed', 'expired'] } }),
        STXPayment.aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              totalVolume: { $sum: '$expectedAmount' },
              totalVolumeUSD: { $sum: '$usdAmount' },
              avgAmount: { $avg: '$expectedAmount' }
            }
          }
        ]),
        STXPayment.aggregate([
          {
            $match: {
              ...query,
              status: 'settled',
              createdAt: { $exists: true },
              settledAt: { $exists: true }
            }
          },
          {
            $project: {
              settlementTime: {
                $divide: [
                  { $subtract: ['$settledAt', '$createdAt'] },
                  1000 * 60 // Convert to minutes
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              avgSettlementTime: { $avg: '$settlementTime' }
            }
          }
        ])
      ]);

      const volume = volumeData[0] || { totalVolume: 0, totalVolumeUSD: 0, avgAmount: 0 };
      const avgSettlement = settlementTimes[0] || { avgSettlementTime: 0 };

      const successRate = totalPayments > 0 
        ? Math.round((successfulPayments / totalPayments) * 100) 
        : 0;

      res.json({
        success: true,
        data: {
          totalPayments,
          successfulPayments,
          failedPayments,
          totalVolume: volume.totalVolume,
          totalVolumeUSD: volume.totalVolumeUSD,
          averagePaymentAmount: Math.round(volume.avgAmount),
          successRate,
          averageSettlementTime: Math.round(avgSettlement.avgSettlementTime),
          dateRange: {
            start: new Date(startDate as string),
            end: new Date(endDate as string)
          }
        }
      });

    } catch (error) {
      logger.error('Error getting STX payment analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get analytics'
      });
    }
  }
}

export const stxPaymentController = new STXPaymentController();