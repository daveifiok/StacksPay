import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sessionMiddleware } from '../../middleware/auth.middleware';
import walletDataService from '@/services/wallet/wallet-data-service';

const router = Router();

/**
 * @swagger
 * /api/wallet/addresses:
 *   put:
 *     summary: Update merchant wallet addresses
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stacksAddress:
 *                 type: string
 *                 description: Stacks wallet address
 *               bitcoinAddress:
 *                 type: string
 *                 description: Bitcoin wallet address
 *               walletType:
 *                 type: string
 *                 description: Type of wallet (leather, xverse, etc.)
 *     responses:
 *       200:
 *         description: Wallet addresses updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/addresses', 
  sessionMiddleware,
  [
    body('stacksAddress').optional().matches(/^S[TP][0-9A-HJKMNP-Z]{38,40}$/).withMessage('Invalid Stacks address format'),
    body('bitcoinAddress').optional().isString().withMessage('Bitcoin address must be a string'),
    body('walletType').optional().isString().withMessage('Wallet type must be a string'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const merchantId = req.merchant?.id;
      if (!merchantId) {
        return res.status(401).json({
          success: false,
          error: 'Merchant not authenticated',
        });
      }

      const { stacksAddress, bitcoinAddress, walletType } = req.body;

      const result = await walletDataService.updateWalletAddresses(merchantId, {
        stacksAddress,
        bitcoinAddress,
        walletType,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Wallet addresses updated successfully',
        data: {
          stacksAddress: result.merchant?.connectedWallets?.stacksAddress,
          bitcoinAddress: result.merchant?.connectedWallets?.bitcoinAddress,
          walletType: result.merchant?.connectedWallets?.walletType,
          lastConnected: result.merchant?.connectedWallets?.lastConnected,
        },
      });
    } catch (error) {
      console.error('Error updating wallet addresses:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/wallet/balances:
 *   put:
 *     summary: Update merchant wallet balances
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stxBalance:
 *                 type: string
 *                 description: STX balance in microSTX
 *               btcBalance:
 *                 type: string
 *                 description: BTC balance in satoshis
 *               sbtcBalance:
 *                 type: string
 *                 description: sBTC balance in microsBTC
 *     responses:
 *       200:
 *         description: Wallet balances updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/balances', 
  sessionMiddleware,
  [
    body('stxBalance').optional().isString().withMessage('STX balance must be a string'),
    body('btcBalance').optional().isString().withMessage('BTC balance must be a string'),
    body('sbtcBalance').optional().isString().withMessage('sBTC balance must be a string'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const merchantId = req.merchant?.id;
      if (!merchantId) {
        return res.status(401).json({
          success: false,
          error: 'Merchant not authenticated',
        });
      }

      const { stxBalance, btcBalance, sbtcBalance } = req.body;

      const result = await walletDataService.updateWalletBalances(merchantId, {
        stxBalance,
        btcBalance,
        sbtcBalance,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Wallet balances updated successfully',
        data: result.merchant?.walletBalances,
      });
    } catch (error) {
      console.error('Error updating wallet balances:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/wallet/data:
 *   get:
 *     summary: Get merchant wallet data
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Merchant not found
 */
router.get('/data', sessionMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchant?.id;
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        error: 'Merchant not authenticated',
      });
    }

    const result = await walletDataService.getWalletData(merchantId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error getting wallet data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/wallet/complete:
 *   put:
 *     summary: Update complete wallet data (addresses + balances)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stacksAddress:
 *                 type: string
 *               bitcoinAddress:
 *                 type: string
 *               walletType:
 *                 type: string
 *               stxBalance:
 *                 type: string
 *               btcBalance:
 *                 type: string
 *               sbtcBalance:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet data updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/complete', 
  sessionMiddleware,
  [
    body('stacksAddress').optional().matches(/^S[TP][0-9A-HJKMNP-Z]{38,40}$/).withMessage('Invalid Stacks address format'),
    body('bitcoinAddress').optional().isString().withMessage('Bitcoin address must be a string'),
    body('walletType').optional().isString().withMessage('Wallet type must be a string'),
    body('stxBalance').optional().isString().withMessage('STX balance must be a string'),
    body('btcBalance').optional().isString().withMessage('BTC balance must be a string'),
    body('sbtcBalance').optional().isString().withMessage('sBTC balance must be a string'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const merchantId = req.merchant?.id;
      if (!merchantId) {
        return res.status(401).json({
          success: false,
          error: 'Merchant not authenticated',
        });
      }

      const { stacksAddress, bitcoinAddress, walletType, stxBalance, btcBalance, sbtcBalance } = req.body;

      const result = await walletDataService.updateCompleteWalletData(merchantId, {
        stacksAddress,
        bitcoinAddress,
        walletType,
        stxBalance,
        btcBalance,
        sbtcBalance,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Wallet data updated successfully',
        data: {
          addresses: {
            stacksAddress: result.merchant?.connectedWallets?.stacksAddress,
            bitcoinAddress: result.merchant?.connectedWallets?.bitcoinAddress,
          },
          balances: result.merchant?.walletBalances,
          walletType: result.merchant?.connectedWallets?.walletType,
          lastConnected: result.merchant?.connectedWallets?.lastConnected,
        },
      });
    } catch (error) {
      console.error('Error updating complete wallet data:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/wallet/refresh-status:
 *   get:
 *     summary: Check if wallet balances need to be refreshed
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Refresh status checked successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/refresh-status', sessionMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchant?.id;
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        error: 'Merchant not authenticated',
      });
    }

    const result = await walletDataService.shouldRefreshBalances(merchantId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking refresh status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
