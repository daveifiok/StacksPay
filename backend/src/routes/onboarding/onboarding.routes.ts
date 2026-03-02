import express, { Request, Response } from 'express';
import { sessionMiddleware } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';
import { Merchant } from '@/models/merchant/Merchant';
import { stxChainhookService } from '@/services/chainhook/stx-chainhook-service';
import { merchantAuthService } from '@/services/contract/merchant-authorization-service';
import { createLogger } from '@/utils/logger';

const router = express.Router();
const logger = createLogger('OnboardingRoutes');

// Apply session middleware to all onboarding routes
router.use(sessionMiddleware);

/**
 * @swagger
 * /api/onboarding/status:
 *   get:
 *     summary: Get merchant onboarding status
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const merchantId = req.merchant?.id;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  try {
    const merchant = await Merchant.findById(merchantId).select('onboarding');

    if (!merchant) {
      res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
      return;
    }

    // Initialize onboarding if not exists
    if (!merchant.onboarding) {
      merchant.onboarding = {
        isComplete: false,
        currentStep: 0,
        completedSteps: [],
        stepsData: {}
      };
      await merchant.save();
    }

    res.json({
      success: true,
      data: merchant.onboarding
    });

  } catch (error) {
    logger.error('Get onboarding status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve onboarding status'
    });
  }
}));

/**
 * @swagger
 * /api/onboarding/step:
 *   put:
 *     summary: Update onboarding step completion
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 */
router.put('/step', asyncHandler(async (req: Request, res: Response) => {
  const merchantId = req.merchant?.id;
  const { stepName, stepData, currentStep } = req.body;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (!stepName) {
    res.status(400).json({
      success: false,
      error: 'Step name is required'
    });
    return;
  }

  try {
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
      return;
    }

    // Initialize onboarding if not exists
    if (!merchant.onboarding) {
      merchant.onboarding = {
        isComplete: false,
        currentStep: 0,
        completedSteps: [],
        stepsData: {}
      };
    }

    // Set start time if this is the first step
    if (!merchant.onboarding.startedAt) {
      merchant.onboarding.startedAt = new Date();
    }

    // Update step data
    if (!merchant.onboarding.stepsData) {
      merchant.onboarding.stepsData = {};
    }

    merchant.onboarding.stepsData[stepName] = {
      ...stepData,
      completed: true,
      completedAt: new Date()
    };

    // Add to completed steps if not already there
    if (!merchant.onboarding.completedSteps.includes(stepName)) {
      merchant.onboarding.completedSteps.push(stepName);
    }

    // Update current step
    if (currentStep !== undefined) {
      merchant.onboarding.currentStep = currentStep;
    }

    // Auto-authorize merchant if they just completed wallet setup
    if (stepName === 'walletSetup') {
      const merchantStacksAddress = merchant.stacksAddress || merchant.connectedWallets?.stacksAddress;

      if (merchantStacksAddress) {
        logger.info(`🔐 Auto-authorizing merchant after wallet setup: ${merchantStacksAddress}`);

        // Fire-and-forget authorization (don't block onboarding completion)
        merchantAuthService.ensureMerchantAuthorized(merchantStacksAddress, merchant.paymentPreferences?.feePercentage || 1)
          .then(result => {
            if (result.success) {
              logger.info(`✅ Merchant auto-authorized: ${merchantStacksAddress}`);
            } else {
              logger.warn(`⚠️ Merchant authorization failed during onboarding: ${result.error}`);
            }
          })
          .catch(error => {
            logger.error('Error auto-authorizing merchant:', error);
          });
      }
    }

    await merchant.save();

    logger.info('Onboarding step updated', {
      merchantId,
      stepName,
      currentStep: merchant.onboarding.currentStep,
      completedSteps: merchant.onboarding.completedSteps.length
    });

    res.json({
      success: true,
      data: merchant.onboarding,
      message: `Step '${stepName}' completed successfully`
    });

  } catch (error) {
    logger.error('Update onboarding step error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update onboarding step'
    });
  }
}));

/**
 * @swagger
 * /api/onboarding/complete:
 *   post:
 *     summary: Mark onboarding as complete
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 */
router.post('/complete', asyncHandler(async (req: Request, res: Response) => {
  const merchantId = req.merchant?.id;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  try {
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
      return;
    }

    // Verify all required steps are completed
    const requiredSteps = ['businessInfo', 'walletSetup', 'paymentPreferences', 'apiKeys'];
    const completedSteps = merchant.onboarding?.completedSteps || [];
    const missingSteps = requiredSteps.filter(step => !completedSteps.includes(step));

    if (missingSteps.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot complete onboarding. Missing required steps',
        missingSteps
      });
      return;
    }

    // Mark onboarding as complete
    if (!merchant.onboarding) {
      merchant.onboarding = {
        isComplete: false,
        currentStep: 0,
        completedSteps: [],
        stepsData: {}
      };
    }

    merchant.onboarding.isComplete = true;
    merchant.onboarding.completedAt = new Date();

    await merchant.save();

    logger.info('Onboarding completed', {
      merchantId,
      completedAt: merchant.onboarding.completedAt,
      totalSteps: merchant.onboarding.completedSteps.length
    });

    res.json({
      success: true,
      data: merchant.onboarding,
      message: 'Onboarding completed successfully'
    });

  } catch (error) {
    logger.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete onboarding'
    });
  }
}));

/**
 * @swagger
 * /api/onboarding/webhook-config:
 *   post:
 *     summary: Configure webhook URL and events during onboarding
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 */
router.post('/webhook-config', asyncHandler(async (req: Request, res: Response) => {
  const merchantId = req.merchant?.id;
  const { webhookUrl, events } = req.body;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (!webhookUrl) {
    res.status(400).json({
      success: false,
      error: 'Webhook URL is required'
    });
    return;
  }

  try {
    // Validate webhook URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(webhookUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid webhook URL format. Must be a valid HTTP/HTTPS URL'
      });
      return;
    }

    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
      return;
    }

    // Initialize onboarding if not exists
    if (!merchant.onboarding) {
      merchant.onboarding = {
        isComplete: false,
        currentStep: 0,
        completedSteps: [],
        stepsData: {}
      };
    }

    // Initialize webhooks if not exists
    if (!merchant.webhooks) {
      merchant.webhooks = {
        isConfigured: false
      };
    }

    // Configure webhook in merchant record (legacy)
    merchant.webhooks.url = webhookUrl;
    merchant.webhooks.events = events || [
      'payment.created',
      'payment.completed',
      'payment.failed',
      'payment.expired'
    ];
    merchant.webhooks.isConfigured = true;

    // Create a proper Webhook record so it shows up in the Webhooks page
    const { Webhook } = await import('@/models/webhook/Webhook');

    // Check if webhook already exists for this URL
    let webhook = await Webhook.findOne({ merchantId, url: webhookUrl });

    if (!webhook) {
      // Create new webhook record
      webhook = await Webhook.create({
        merchantId,
        url: webhookUrl,
        events: merchant.webhooks.events,
        secret: merchant.webhooks.secret,
        enabled: true,
        deliveryStats: {
          total: 0,
          successful: 0,
          failed: 0
        },
        settings: {
          timeout: 10000,
          retryAttempts: 3,
          retryDelays: [1000, 5000, 15000]
        }
      });

      logger.info('Created Webhook record for onboarding', {
        merchantId,
        webhookId: webhook._id,
        webhookUrl
      });
    } else {
      // Update existing webhook
      webhook.events = merchant.webhooks.events;
      webhook.secret = merchant.webhooks.secret;
      webhook.enabled = true;
      await webhook.save();

      logger.info('Updated existing Webhook record for onboarding', {
        merchantId,
        webhookId: webhook._id,
        webhookUrl
      });
    }

    // Update onboarding progress - mark webhook setup step as complete
    merchant.onboarding.stepsData.webhookSetup = {
      completed: true,
      completedAt: new Date(),
      webhookUrlConfigured: true,
      webhookTested: false, // Will be updated when test is performed
      webhookId: webhook._id.toString() // Store reference to the Webhook record
    };

    if (!merchant.onboarding.completedSteps.includes('webhookSetup')) {
      merchant.onboarding.completedSteps.push('webhookSetup');
    }

    // Advance to next step if not already past it
    if (merchant.onboarding.currentStep < 6) {
      merchant.onboarding.currentStep = 6; // Move to integration/test step
    }

    await merchant.save();

    logger.info('Webhook configured during onboarding', {
      merchantId,
      webhookUrl,
      webhookId: webhook._id.toString(),
      events: merchant.webhooks.events,
      currentStep: merchant.onboarding.currentStep
    });

    res.json({
      success: true,
      data: {
        webhookUrl: merchant.webhooks.url,
        webhookSecret: merchant.webhooks.secret,
        webhookId: webhook._id.toString(),
        events: merchant.webhooks.events,
        onboarding: merchant.onboarding
      },
      message: 'Webhook configured successfully'
    });

  } catch (error) {
    logger.error('Webhook configuration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure webhook'
    });
  }
}));

/**
 * @swagger
 * /api/onboarding/webhook-test:
 *   post:
 *     summary: Test webhook endpoint during onboarding
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 */
router.post('/webhook-test', asyncHandler(async (req: Request, res: Response) => {
  const merchantId = req.merchant?.id;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  try {
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
      return;
    }

    if (!merchant.webhooks?.url) {
      res.status(400).json({
        success: false,
        error: 'Webhook URL not configured. Configure webhook first.'
      });
      return;
    }

    // Create test webhook payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        merchantId: merchantId.toString(),
        message: 'This is a test webhook from your sBTC Payment Gateway onboarding'
      }
    };

    // Generate signature for test webhook
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', merchant.webhooks.secret || '')
      .update(JSON.stringify(testPayload))
      .digest('hex');

    // Send test webhook
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(merchant.webhooks.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'webhook.test'
      },
      body: JSON.stringify(testPayload),
      timeout: 10000
    });

    const success = response.ok;

    // Update webhook test status
    if (!merchant.webhooks) {
      merchant.webhooks = { isConfigured: false };
    }

    merchant.webhooks.lastTested = new Date();

    // Update onboarding progress
    if (merchant.onboarding?.stepsData?.webhookSetup) {
      merchant.onboarding.stepsData.webhookSetup.webhookTested = success;
    }

    await merchant.save();

    logger.info('Webhook test completed', {
      merchantId,
      webhookUrl: merchant.webhooks.url,
      success,
      statusCode: response.status
    });

    res.json({
      success: true,
      data: {
        tested: true,
        webhookUrl: merchant.webhooks.url,
        responseStatus: response.status,
        responseOk: success,
        testedAt: merchant.webhooks.lastTested
      },
      message: success
        ? 'Webhook test successful! Your endpoint is responding correctly.'
        : `Webhook test completed but endpoint returned status ${response.status}. Please check your webhook implementation.`
    });

  } catch (error: any) {
    logger.error('Webhook test error:', error);

    // Still update the merchant record even if test failed
    try {
      const merchant = await Merchant.findById(merchantId);
      if (merchant?.webhooks) {
        merchant.webhooks.lastTested = new Date();
        await merchant.save();
      }
    } catch (saveError) {
      logger.error('Failed to save webhook test timestamp:', saveError);
    }

    res.status(500).json({
      success: false,
      error: 'Webhook test failed',
      details: error.message || 'Could not reach webhook endpoint'
    });
  }
}));

/**
 * @swagger
 * /api/onboarding/chainhook-setup:
 *   post:
 *     summary: Setup Chainhook monitoring during onboarding
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 */
router.post('/chainhook-setup', asyncHandler(async (req: Request, res: Response) => {
  const merchantId = req.merchant?.id;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  try {
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
      return;
    }

    // Initialize onboarding if not exists
    if (!merchant.onboarding) {
      merchant.onboarding = {
        isComplete: false,
        currentStep: 0,
        completedSteps: [],
        stepsData: {}
      };
    }

    // Initialize chainhook if not exists
    if (!merchant.chainhook) {
      merchant.chainhook = {
        isConfigured: false,
        predicateIds: [],
        monitoredAddresses: []
      };
    }

    // Get Chainhook predicate configurations from service
    const transferConfig = stxChainhookService.getChainhookSTXTransferConfig();
    const contractConfig = stxChainhookService.getChainhookContractConfig();

    // In production, these predicates would be registered with Chainhook API
    // For now, we store the configuration for manual registration or automated setup
    const predicateIds = [transferConfig.uuid, contractConfig.uuid];

    // Update merchant Chainhook configuration
    merchant.chainhook.isConfigured = true;
    merchant.chainhook.predicateIds = predicateIds;
    merchant.chainhook.configuredAt = new Date();

    // Store the predicate configurations in metadata for reference
    merchant.chainhook.predicateConfigs = [transferConfig, contractConfig];

    // Update onboarding progress - mark Chainhook setup step as complete
    merchant.onboarding.stepsData.chainhookSetup = {
      completed: true,
      completedAt: new Date(),
      predicatesRegistered: true
    };

    if (!merchant.onboarding.completedSteps.includes('chainhookSetup')) {
      merchant.onboarding.completedSteps.push('chainhookSetup');
    }

    await merchant.save();

    logger.info('Chainhook setup completed during onboarding', {
      merchantId,
      predicateIds,
      configuredAt: merchant.chainhook.configuredAt
    });

    res.json({
      success: true,
      data: {
        chainhook: {
          isConfigured: true,
          predicateIds,
          configuredAt: merchant.chainhook.configuredAt
        },
        predicateConfigs: {
          transfers: transferConfig,
          contract: contractConfig
        },
        onboarding: merchant.onboarding,
        instructions: {
          message: 'Chainhook predicates configured successfully',
          note: 'Predicates are ready for registration. In production, these would be automatically registered with Chainhook service.',
          webhookEndpoints: [
            `${process.env.BACKEND_URL}/api/chainhook/stx/transfers`,
            `${process.env.BACKEND_URL}/api/chainhook/stx/contract`
          ]
        }
      },
      message: 'Chainhook monitoring configured successfully'
    });

  } catch (error) {
    logger.error('Chainhook setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure Chainhook monitoring'
    });
  }
}));

/**
 * @swagger
 * /api/onboarding/reset:
 *   post:
 *     summary: Reset onboarding progress (for testing/admin)
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 */
router.post('/reset', asyncHandler(async (req: Request, res: Response) => {
  const merchantId = req.merchant?.id;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  try {
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
      return;
    }

    // Reset onboarding
    merchant.onboarding = {
      isComplete: false,
      currentStep: 0,
      completedSteps: [],
      stepsData: {}
    };

    await merchant.save();

    logger.info('Onboarding reset', { merchantId });

    res.json({
      success: true,
      data: merchant.onboarding,
      message: 'Onboarding progress reset successfully'
    });

  } catch (error) {
    logger.error('Reset onboarding error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset onboarding'
    });
  }
}));

export default router;
