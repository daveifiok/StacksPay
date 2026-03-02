import { Request, Response } from 'express';
import { stxChainhookService } from '@/services/chainhook/stx-chainhook-service';
import { createLogger } from '@/utils/logger';
import { 
  ChainhookSTXTransferEvent, 
  ChainhookContractEvent 
} from '@/interfaces/payment/stx-payment.interface';

const logger = createLogger('STXWebhookController');

/**
 * @swagger
 * components:
 *   schemas:
 *     ChainhookWebhookResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         processed:
 *           type: number
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *     
 *     ChainhookSTXTransferEvent:
 *       type: object
 *       properties:
 *         apply:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               block_identifier:
 *                 type: object
 *                 properties:
 *                   index:
 *                     type: number
 *                   hash:
 *                     type: string
 *               transactions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     transaction_identifier:
 *                       type: object
 *                       properties:
 *                         hash:
 *                           type: string
 *                     operations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           data:
 *                             type: object
 *                             properties:
 *                               sender:
 *                                 type: string
 *                               recipient:
 *                                 type: string
 *                               amount:
 *                                 type: string
 *                               memo:
 *                                 type: string
 */

export class STXWebhookController {
  /**
   * @swagger
   * /api/chainhook/stx/transfers:
   *   post:
   *     tags: [STX Webhooks]
   *     summary: Process STX transfer events from Chainhook
   *     description: Receive and process STX transfer events when customers send payments to unique addresses
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
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ChainhookWebhookResponse'
   *       400:
   *         description: Invalid webhook payload
   *       401:
   *         description: Invalid webhook signature
   *       500:
   *         description: Processing error
   */
  async processSTXTransfers(req: Request, res: Response): Promise<void> {
    try {
      // Validate webhook signature
      const authHeader = req.headers.authorization;
      if (!authHeader || !stxChainhookService.validateChainhookSignature(authHeader)) {
        logger.warn('Invalid Chainhook webhook signature', {
          authHeader,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
        return;
      }

      const webhookPayload: ChainhookSTXTransferEvent = req.body;

      // Validate payload structure
      if (!webhookPayload.apply || !Array.isArray(webhookPayload.apply)) {
        res.status(400).json({
          success: false,
          message: 'Invalid webhook payload: missing apply array'
        });
        return;
      }

      logger.info('Received STX transfer webhook', {
        blocksCount: webhookPayload.apply.length,
        totalTransactions: webhookPayload.apply.reduce(
          (total, block) => total + block.transactions.length, 
          0
        )
      });

      // Process the STX transfer events
      const result = await stxChainhookService.processSTXTransferEvent(webhookPayload);

      if (result.success) {
        logger.info('STX transfer webhook processed successfully', {
          processedTransfers: result.processedTransfers,
          errorCount: result.errors.length
        });

        res.json({
          success: true,
          message: 'STX transfer events processed successfully',
          processed: result.processedTransfers,
          errors: result.errors
        });
      } else {
        logger.error('STX transfer webhook processing failed', {
          processedTransfers: result.processedTransfers,
          errors: result.errors
        });

        res.status(500).json({
          success: false,
          message: 'Failed to process STX transfer events',
          processed: result.processedTransfers,
          errors: result.errors
        });
      }

    } catch (error) {
      logger.error('Critical error processing STX transfer webhook:', error);
      
      res.status(500).json({
        success: false,
        message: 'Critical processing error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * @swagger
   * /api/chainhook/stx/contract:
   *   post:
   *     tags: [STX Webhooks]
   *     summary: Process STX contract events from Chainhook
   *     description: Receive and process contract events from the STX payment gateway smart contract
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               apply:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     block_identifier:
   *                       type: object
   *                       properties:
   *                         index:
   *                           type: number
   *                         hash:
   *                           type: string
   *                     transactions:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           transaction_identifier:
   *                             type: object
   *                             properties:
   *                               hash:
   *                                 type: string
   *                           operations:
   *                             type: array
   *                             items:
   *                               type: object
   *                               properties:
   *                                 type:
   *                                   type: string
   *                                   enum: [contract_event]
   *                                 data:
   *                                   type: object
   *                                   properties:
   *                                     contract_identifier:
   *                                       type: string
   *                                     topic:
   *                                       type: string
   *                                     value:
   *                                       type: object
   *     responses:
   *       200:
   *         description: Contract events processed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ChainhookWebhookResponse'
   *       400:
   *         description: Invalid webhook payload
   *       401:
   *         description: Invalid webhook signature
   *       500:
   *         description: Processing error
   */
  async processContractEvents(req: Request, res: Response): Promise<void> {
    try {
      // Validate webhook signature
      const authHeader = req.headers.authorization;
      if (!authHeader || !stxChainhookService.validateChainhookSignature(authHeader)) {
        logger.warn('Invalid Chainhook webhook signature', {
          authHeader,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
        return;
      }

      const webhookPayload: ChainhookContractEvent = req.body;

      // Validate payload structure
      if (!webhookPayload.apply || !Array.isArray(webhookPayload.apply)) {
        res.status(400).json({
          success: false,
          message: 'Invalid webhook payload: missing apply array'
        });
        return;
      }

      logger.info('Received STX contract event webhook', {
        blocksCount: webhookPayload.apply.length,
        totalTransactions: webhookPayload.apply.reduce(
          (total, block) => total + block.transactions.length, 
          0
        )
      });

      // Process the contract events
      const result = await stxChainhookService.processContractEvent(webhookPayload);

      if (result.success) {
        logger.info('STX contract webhook processed successfully', {
          processedEvents: result.processedEvents,
          errorCount: result.errors.length
        });

        res.json({
          success: true,
          message: 'Contract events processed successfully',
          processed: result.processedEvents,
          errors: result.errors
        });
      } else {
        logger.error('STX contract webhook processing failed', {
          processedEvents: result.processedEvents,
          errors: result.errors
        });

        res.status(500).json({
          success: false,
          message: 'Failed to process contract events',
          processed: result.processedEvents,
          errors: result.errors
        });
      }

    } catch (error) {
      logger.error('Critical error processing STX contract webhook:', error);
      
      res.status(500).json({
        success: false,
        message: 'Critical processing error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * @swagger
   * /api/chainhook/stx/health:
   *   get:
   *     tags: [STX Webhooks]
   *     summary: Health check for STX webhook endpoints
   *     description: Check if STX webhook endpoints are healthy and configured correctly
   *     responses:
   *       200:
   *         description: Webhook endpoints are healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 status:
   *                   type: string
   *                 service:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 chainhookConfig:
   *                   type: object
   *                   properties:
   *                     transfersEndpoint:
   *                       type: string
   *                     contractEndpoint:
   *                       type: string
   *                     networkInfo:
   *                       type: object
   *       500:
   *         description: Service unhealthy
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const serviceInfo = stxChainhookService.getServiceInfo();
      
      logger.debug('STX webhook health check requested', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        status: 'healthy',
        service: 'STX Webhook Controller',
        timestamp: new Date().toISOString(),
        chainhookConfig: {
          transfersEndpoint: `${process.env.BACKEND_URL}/api/chainhook/stx/transfers`,
          contractEndpoint: `${process.env.BACKEND_URL}/api/chainhook/stx/contract`,
          networkInfo: serviceInfo.networkInfo
        },
        serviceInfo
      });

    } catch (error) {
      logger.error('STX webhook health check failed:', error);
      
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        service: 'STX Webhook Controller',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/chainhook/stx/config:
   *   get:
   *     tags: [STX Webhooks]
   *     summary: Get Chainhook configuration
   *     description: Get the Chainhook configuration for STX events (for setup purposes)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Chainhook configuration retrieved successfully
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
   *                     transfersConfig:
   *                       type: object
   *                       description: Chainhook configuration for STX transfers
   *                     contractConfig:
   *                       type: object
   *                       description: Chainhook configuration for contract events
   *                     instructions:
   *                       type: string
   *                       description: Setup instructions
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Server error
   */
  async getChainhookConfig(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint could be protected for admin access only
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const transfersConfig = stxChainhookService.getChainhookSTXTransferConfig();
      const contractConfig = stxChainhookService.getChainhookContractConfig();

      const instructions = `
To set up Chainhook for STX payments:

1. Save the configurations below as JSON files
2. Register them with your Chainhook service:
   chainhook predicates apply stx-transfers.json
   chainhook predicates apply stx-contract.json
3. Start Chainhook service with these predicates
4. Ensure your backend URL is accessible from Chainhook

Environment variables required:
- BACKEND_URL: ${process.env.BACKEND_URL || 'http://localhost:3000'}
- CHAINHOOK_SECRET: ${process.env.CHAINHOOK_SECRET || 'default-secret'}
- STX_START_BLOCK: ${process.env.STX_START_BLOCK || '1'}
      `.trim();

      logger.info('Chainhook configuration requested', {
        merchantId,
        ip: req.ip
      });

      res.json({
        success: true,
        data: {
          transfersConfig,
          contractConfig,
          instructions
        }
      });

    } catch (error) {
      logger.error('Error getting Chainhook configuration:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get Chainhook configuration'
      });
    }
  }

  /**
   * @swagger
   * /api/chainhook/stx/test:
   *   post:
   *     tags: [STX Webhooks]
   *     summary: Test STX webhook processing (Development)
   *     description: Send a test webhook payload to verify STX webhook processing works correctly
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
   *                 default: transfer
   *               testData:
   *                 type: object
   *                 description: Optional test data override
   *     responses:
   *       200:
   *         description: Test webhook processed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 result:
   *                   type: object
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Test processing error
   */
  async testWebhook(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { type = 'transfer', testData } = req.body;

      let result;

      if (type === 'transfer') {
        // Create test STX transfer event
        const testTransferEvent: ChainhookSTXTransferEvent = testData || {
          apply: [
            {
              block_identifier: {
                index: 999999,
                hash: '0x' + '0'.repeat(64)
              },
              transactions: [
                {
                  transaction_identifier: {
                    hash: '0x' + '1'.repeat(64)
                  },
                  operations: [
                    {
                      type: 'stx_transfer',
                      data: {
                        sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
                        recipient: 'SP328EHAG4RB6MYQMBH9Z0WVTE02HD5N50MQJXHFZ',
                        amount: '1000000', // 1 STX in microSTX
                        memo: 'Test payment'
                      }
                    }
                  ]
                }
              ]
            }
          ]
        };

        result = await stxChainhookService.processSTXTransferEvent(testTransferEvent);
      } else {
        // Create test contract event
        const testContractEvent: ChainhookContractEvent = testData || {
          apply: [
            {
              block_identifier: {
                index: 999999,
                hash: '0x' + '0'.repeat(64)
              },
              transactions: [
                {
                  transaction_identifier: {
                    hash: '0x' + '2'.repeat(64)
                  },
                  operations: [
                    {
                      type: 'contract_event',
                      data: {
                        contract_identifier: stxChainhookService.getChainhookContractConfig().networks[
                          stxChainhookService.getServiceInfo().networkInfo.isMainnet ? 'mainnet' : 'testnet'
                        ].if_this.contract_identifier,
                        topic: 'payment-confirmed',
                        value: {
                          paymentId: 'test_payment_123',
                          amount: 1000000
                        }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        };

        result = await stxChainhookService.processContractEvent(testContractEvent);
      }

      logger.info('Test webhook processed', {
        merchantId,
        type,
        result
      });

      res.json({
        success: true,
        message: `Test ${type} webhook processed successfully`,
        result
      });

    } catch (error) {
      logger.error('Error processing test webhook:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to process test webhook'
      });
    }
  }
}

export const stxWebhookController = new STXWebhookController();