import express from 'express';
import { sessionMiddleware } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';
import { createLogger } from '@/utils/logger';
import { Merchant } from '@/models/merchant/Merchant';
import { ApiKey } from '@/models/apikey/ApiKey';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

const router = express.Router();
const logger = createLogger('ApiKeyController');

// Apply JWT middleware to all API key routes (merchant dashboard only)
router.use(sessionMiddleware);

/**
 * IMPORTANT: Static routes must be defined BEFORE parameterized routes
 * Otherwise Express will treat "stats" as a keyId parameter
 */

/**
 * Get API key statistics for all keys
 */
router.get('/stats', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
    });
    return;
  }

  try {
    const allKeys = await ApiKey.find({ merchantId });
    const activeKeys = allKeys.filter(key => key.isActive);
    const testKeys = activeKeys.filter(key => key.environment === 'test');
    const liveKeys = activeKeys.filter(key => key.environment === 'live');
    const totalRequests = allKeys.reduce((sum, key) => sum + (key.requestCount || 0), 0);

    const lastActivity = allKeys
      .filter(key => key.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())[0]?.lastUsed;

    const stats = {
      totalKeys: allKeys.length,
      activeKeys: activeKeys.length,
      testKeys: testKeys.length,
      liveKeys: liveKeys.length,
      totalRequests,
      lastActivity: lastActivity?.toISOString()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('API key stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API key statistics'
    });
  }
}));

/**
 * Get available permissions
 */
router.get('/permissions', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
    });
    return;
  }

  const permissions = [
    { id: 'payments:create', name: 'Create Payments', description: 'Create new payment requests' },
    { id: 'payments:read', name: 'Read Payments', description: 'View payment data and history' },
    { id: 'payments:write', name: 'Modify Payments', description: 'Cancel and modify payments' },
    { id: 'payments:webhook', name: 'Payment Webhooks', description: 'Receive payment webhook notifications' },
    { id: 'merchant:read', name: 'Read Merchant Info', description: 'View merchant account information' },
    { id: 'webhooks:create', name: 'Create Webhooks', description: 'Create webhook endpoints' },
    { id: 'webhooks:read', name: 'Read Webhooks', description: 'View webhook configurations' },
    { id: 'webhooks:write', name: 'Manage Webhooks', description: 'Test and modify webhooks' }
  ];

  res.json({
    success: true,
    data: {
      permissions
    }
  });
}));

/**
 * Validate API key
 */
router.post('/validate', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;
  const { key } = req.body;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
    });
    return;
  }

  if (!key) {
    res.status(400).json({
      success: false,
      error: 'API key is required'
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

    // Find the API key by comparing hashes
    let foundKey = null;
    for (const apiKey of merchant.apiKeys) {
      const isMatch = await bcrypt.compare(key, apiKey.keyHash);
      if (isMatch) {
        foundKey = apiKey;
        break;
      }
    }

    const isValid = foundKey && foundKey.isActive;

    res.json({
      success: true,
      data: {
        valid: isValid,
        keyId: foundKey?.keyId,
        environment: foundKey?.environment,
        permissions: foundKey?.permissions || []
      }
    });
  } catch (error: any) {
    logger.error('API key validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key'
    });
  }
}));

/**
 * Get active API keys for payment operations
 */
router.get('/for-payments', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
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

    // Find active API keys with payment permissions
    const paymentKeys = merchant.apiKeys
      .filter((key: any) =>
        key.isActive &&
        (!key.expiresAt || key.expiresAt > new Date()) &&
        key.permissions.some((perm: string) => perm.includes('payments') || perm.includes('write'))
      )
      .reduce((acc: any, key: any) => {
        acc[key.environment] = {
          keyId: key.keyId,
          environment: key.environment,
          permissions: key.permissions,
          rateLimit: key.rateLimit || (key.environment === 'test' ? 100 : 1000),
          keyPreview: key.keyPreview,
        };
        return acc;
      }, {});

    res.json({
      success: true,
      data: {
        test: paymentKeys.test || null,
        live: paymentKeys.live || null,
        hasActiveKeys: Object.keys(paymentKeys).length > 0
      }
    });

  } catch (error) {
    logger.error('Error retrieving payment API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment API keys'
    });
  }
}));

/**
 * Generate onboarding API keys (test + live + webhook secret)
 */
router.post('/onboarding', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
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

    // Generate test API key
    const testKeyRandom = crypto.randomBytes(32).toString('hex');
    const testApiKey = `sk_test_${testKeyRandom}`;
    const testKeyHash = await bcrypt.hash(testApiKey, 10);
    const testKeyId = crypto.randomBytes(16).toString('hex');

    // Generate live API key
    const liveKeyRandom = crypto.randomBytes(32).toString('hex');
    const liveApiKey = `sk_live_${liveKeyRandom}`;
    const liveKeyHash = await bcrypt.hash(liveApiKey, 10);
    const liveKeyId = crypto.randomBytes(16).toString('hex');

    // Generate webhook secret
    const webhookSecret = `whsec_${crypto.randomBytes(32).toString('hex')}`;

    // Create API key records with comprehensive permissions
    const defaultPermissions = [
      'payments:create',   // Can create new payments
      'payments:read',     // Can view payment data
      'payments:write',    // Can cancel/modify payments
      'payments:webhook',  // Can receive webhook events
      'merchant:read',     // Can view merchant info
      'webhooks:create',   // Can create webhooks
      'webhooks:read',     // Can view webhooks
      'webhooks:write'     // Can test webhooks
    ];

    // Create API keys in the ApiKey collection
    const testKey = await ApiKey.create({
      merchantId,
      keyId: testKeyId,
      keyHash: testKeyHash,
      keyPreview: testApiKey.substring(0, 12) + '...' + testApiKey.substring(testApiKey.length - 4),
      name: 'Test Key (Auto-generated)',
      permissions: defaultPermissions,
      environment: 'test',
      ipRestrictions: [],
      rateLimit: 1000,
      isActive: true,
      requestCount: 0
    });

    const liveKey = await ApiKey.create({
      merchantId,
      keyId: liveKeyId,
      keyHash: liveKeyHash,
      keyPreview: liveApiKey.substring(0, 12) + '...' + liveApiKey.substring(liveApiKey.length - 4),
      name: 'Live Key (Auto-generated)',
      permissions: defaultPermissions,
      environment: 'live',
      ipRestrictions: [],
      rateLimit: 1000,
      isActive: false, // Start inactive for security
      requestCount: 0
    });

    // Initialize webhooks object if it doesn't exist
    if (!merchant.webhooks) {
      merchant.webhooks = {
        secret: webhookSecret,
        isConfigured: false
      };
    } else {
      merchant.webhooks.secret = webhookSecret;
    }

    // Update onboarding progress - mark API keys step as complete
    if (!merchant.onboarding) {
      merchant.onboarding = {
        isComplete: false,
        currentStep: 4, // API keys is step 4
        completedSteps: [],
        stepsData: {}
      };
    }

    if (!merchant.onboarding.stepsData) {
      merchant.onboarding.stepsData = {};
    }

    merchant.onboarding.stepsData.apiKeys = {
      completed: true,
      completedAt: new Date(),
      testKeyGenerated: true,
      liveKeyGenerated: true
    };

    // Add to completed steps if not already there
    if (!merchant.onboarding.completedSteps.includes('apiKeys')) {
      merchant.onboarding.completedSteps.push('apiKeys');
    }

    // Update current step to next step (webhook setup)
    if (merchant.onboarding.currentStep < 5) {
      merchant.onboarding.currentStep = 5;
    }

    await merchant.save();

    logger.info('Onboarding API keys generated', {
      merchantId,
      testKeyId,
      liveKeyId,
      onboardingStep: merchant.onboarding.currentStep,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: {
        testKey: {
          key: testApiKey, // Only return the actual key on creation
          keyId: testKeyId
        },
        liveKey: {
          key: liveApiKey,
          keyId: liveKeyId
        },
        webhookSecret
      }
    });

  } catch (error) {
    logger.error('Onboarding API key generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate onboarding API keys'
    });
  }
}));

/**
 * Generate new API key for merchant
 */
router.post('/generate', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;
  const { name, environment, permissions, ipRestrictions, rateLimit } = req.body;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
    });
    return;
  }

  if (!name || !environment || !permissions) {
    res.status(400).json({
      success: false,
      error: 'Name, environment, and permissions are required'
    });
    return;
  }

  try {
    // Verify merchant exists
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
      return;
    }

    // Generate API key
    const keyPrefix = environment === 'test' ? 'sk_test_' : 'sk_live_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const apiKey = `${keyPrefix}${randomBytes}`;
    const keyId = crypto.randomBytes(16).toString('hex');

    // Hash the API key for secure storage
    const keyHash = await bcrypt.hash(apiKey, 10);
    const keyPreview = `${keyPrefix}****${randomBytes.slice(-4)}`;

    // Create API key in separate collection
    const newApiKey = await ApiKey.create({
      merchantId,
      keyId,
      keyHash,
      keyPreview,
      name,
      permissions: Array.isArray(permissions) ? permissions : [permissions],
      environment,
      isActive: true,
      ipRestrictions: ipRestrictions || [],
      rateLimit: rateLimit || 1000,
      requestCount: 0
    });

    logger.info('API key generated', {
      merchantId,
      keyId,
      environment,
      permissions
    });

    res.status(201).json({
      success: true,
      data: {
        keyId: newApiKey.keyId,
        name: newApiKey.name,
        apiKey, // Only returned once during creation
        keyPreview: newApiKey.keyPreview,
        environment: newApiKey.environment,
        permissions: newApiKey.permissions,
        ipRestrictions: newApiKey.ipRestrictions,
        rateLimit: newApiKey.rateLimit,
        createdAt: newApiKey.createdAt.toISOString(),
        lastUsed: null,
        expiresAt: null,
        isActive: true,
        requestCount: 0
      },
      message: 'API key created successfully. Please store this key securely as it will not be shown again.'
    });
  } catch (error: any) {
    logger.error('API key generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key'
    });
  }
}));

/**
 * Get all API keys for merchant (without revealing full keys)
 */
router.get('/', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;
  const { page = 1, limit = 10 } = req.query;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
    });
    return;
  }

  try {
    // Get all API keys from the ApiKey collection
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const totalKeys = await ApiKey.countDocuments({ merchantId, isActive: true });
    const allApiKeys = await ApiKey.find({ merchantId, isActive: true })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Format the response
    const formattedKeys = allApiKeys.map(key => ({
      keyId: key.keyId,
      name: key.name,
      keyPreview: key.keyPreview,
      environment: key.environment,
      permissions: key.permissions,
      ipRestrictions: key.ipRestrictions || [],
      rateLimit: key.rateLimit || 1000,
      createdAt: key.createdAt.toISOString(),
      lastUsed: key.lastUsed ? key.lastUsed.toISOString() : null,
      expiresAt: key.expiresAt ? key.expiresAt.toISOString() : null,
      isActive: key.isActive,
      requestCount: key.requestCount || 0
    }));

    const response = {
      apiKeys: formattedKeys,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalKeys,
        totalPages: Math.ceil(totalKeys / limitNum)
      }
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error: any) {
    logger.error('API key fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys'
    });
  }
}));

/**
 * Revoke API key
 */
router.delete('/:keyId', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;
  const keyId = req.params.keyId;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
    });
    return;
  }

  try {
    // Find and deactivate the API key
    const apiKey = await ApiKey.findOne({ merchantId, keyId });
    if (!apiKey) {
      res.status(404).json({
        success: false,
        error: 'API key not found'
      });
      return;
    }

    apiKey.isActive = false;
    await apiKey.save();

    logger.info('API key revoked', {
      merchantId,
      keyId,
      environment: apiKey.environment
    });

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error: any) {
    logger.error('API key revocation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
}));

/**
 * Update API key settings (permissions, rate limits, etc.)
 */
router.put('/:keyId', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;
  const keyId = req.params.keyId;
  const { name, permissions, ipRestrictions, rateLimit } = req.body;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
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

    // Find and update the API key
    const apiKey = merchant.apiKeys.find((key: any) => key.keyId === keyId);
    if (!apiKey) {
      res.status(404).json({
        success: false,
        error: 'API key not found'
      });
      return;
    }

    // Update allowed fields
    if (name) apiKey.name = name;
    if (permissions) apiKey.permissions = Array.isArray(permissions) ? permissions : [permissions];
    if (ipRestrictions !== undefined) apiKey.ipRestrictions = ipRestrictions;
    if (rateLimit !== undefined) apiKey.rateLimit = rateLimit;

    await merchant.save();

    logger.info('API key updated', {
      merchantId,
      keyId,
      updatedFields: { name, permissions, ipRestrictions, rateLimit }
    });

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: {
        keyId: apiKey.keyId,
        name: apiKey.name,
        keyPreview: apiKey.keyPreview,
        environment: apiKey.environment,
        permissions: apiKey.permissions,
        ipRestrictions: apiKey.ipRestrictions,
        rateLimit: apiKey.rateLimit,
      }
    });
  } catch (error: any) {
    logger.error('API key update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update API key'
    });
  }
}));

/**
 * Regenerate API key
 */
router.post('/:keyId/regenerate', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;
  const keyId = req.params.keyId;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
    });
    return;
  }

  try {
    // Find the API key
    const apiKey = await ApiKey.findOne({ merchantId, keyId });
    if (!apiKey) {
      res.status(404).json({
        success: false,
        error: 'API key not found'
      });
      return;
    }

    // Generate new API key
    const keySecret = crypto.randomBytes(32).toString('hex');
    const newApiKey = `sk_${apiKey.environment}_${keySecret}`;
    const newKeyHash = await bcrypt.hash(newApiKey, 10);
    const newKeyPreview = `sk_${apiKey.environment}_****${keySecret.slice(-4)}`;

    // Update the API key
    apiKey.keyHash = newKeyHash;
    apiKey.keyPreview = newKeyPreview;
    apiKey.createdAt = new Date();

    await apiKey.save();

    logger.info('API key regenerated', {
      merchantId,
      keyId,
      environment: apiKey.environment
    });

    res.json({
      success: true,
      message: 'API key regenerated successfully',
      data: {
        keyId: apiKey.keyId,
        apiKey: newApiKey, // Full key - only returned once
        keyPreview: newKeyPreview,
        name: apiKey.name,
        environment: apiKey.environment,
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt.toISOString()
      }
    });
  } catch (error: any) {
    logger.error('API key regeneration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate API key'
    });
  }
}));

/**
 * Activate API key
 */
router.post('/:keyId/activate', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;
  const keyId = req.params.keyId;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
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

    // Find and activate the API key
    const apiKey = merchant.apiKeys.find((key: any) => key.keyId === keyId);
    if (!apiKey) {
      res.status(404).json({
        success: false,
        error: 'API key not found'
      });
      return;
    }

    apiKey.isActive = true;
    await merchant.save();

    logger.info('API key activated', {
      merchantId,
      keyId
    });

    res.json({
      success: true,
      message: 'API key activated successfully',
      data: {
        keyId: apiKey.keyId,
        name: apiKey.name,
        keyPreview: apiKey.keyPreview,
        environment: apiKey.environment,
        permissions: apiKey.permissions,
        ipRestrictions: apiKey.ipRestrictions,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
        lastUsed: apiKey.lastUsed,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive,
        requestCount: apiKey.requestCount || 0
      }
    });
  } catch (error: any) {
    logger.error('API key activation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate API key'
    });
  }
}));

/**
 * Deactivate API key
 */
router.post('/:keyId/deactivate', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;
  const keyId = req.params.keyId;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
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

    // Find and deactivate the API key
    const apiKey = merchant.apiKeys.find((key: any) => key.keyId === keyId);
    if (!apiKey) {
      res.status(404).json({
        success: false,
        error: 'API key not found'
      });
      return;
    }

    apiKey.isActive = false;
    await merchant.save();

    logger.info('API key deactivated', {
      merchantId,
      keyId
    });

    res.json({
      success: true,
      message: 'API key deactivated successfully',
      data: {
        keyId: apiKey.keyId,
        name: apiKey.name,
        keyPreview: apiKey.keyPreview,
        environment: apiKey.environment,
        permissions: apiKey.permissions,
        ipRestrictions: apiKey.ipRestrictions,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
        lastUsed: apiKey.lastUsed,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive,
        requestCount: apiKey.requestCount || 0
      }
    });
  } catch (error: any) {
    logger.error('API key deactivation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate API key'
    });
  }
}));

/**
 * Get API key usage statistics
 */
router.get('/:keyId/usage', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;
  const keyId = req.params.keyId;
  const { period } = req.query;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
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

    // Find the API key
    const apiKey = merchant.apiKeys.find((key: any) => key.keyId === keyId);
    if (!apiKey) {
      res.status(404).json({
        success: false,
        error: 'API key not found'
      });
      return;
    }

    // Mock usage data for now - in a real implementation, this would come from analytics
    const usageData = {
      keyId: apiKey.keyId,
      period: period || '30d',
      totalRequests: apiKey.requestCount || 0,
      successfulRequests: Math.floor((apiKey.requestCount || 0) * 0.95),
      failedRequests: Math.floor((apiKey.requestCount || 0) * 0.05),
      uniqueIPs: Math.floor((apiKey.requestCount || 0) / 10),
      usageByEndpoint: [
        {
          endpoint: '/payments',
          method: 'POST',
          count: Math.floor((apiKey.requestCount || 0) * 0.7),
          lastUsed: apiKey.lastUsed || apiKey.createdAt
        },
        {
          endpoint: '/payments',
          method: 'GET',
          count: Math.floor((apiKey.requestCount || 0) * 0.3),
          lastUsed: apiKey.lastUsed || apiKey.createdAt
        }
      ],
      usageByDay: [] // Would be populated with real analytics data
    };

    res.json({
      success: true,
      data: usageData
    });
  } catch (error: any) {
    logger.error('API key usage fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API key usage'
    });
  }
}));

/**
 * Test API key
 */
router.post('/:keyId/test', asyncHandler(async (req: express.Request, res: express.Response) => {
  const merchantId = req.merchant?.id;
  const keyId = req.params.keyId;

  if (!merchantId) {
    res.status(401).json({
      success: false,
      error: 'Merchant authentication required'
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

    // Find the API key
    const apiKey = merchant.apiKeys.find((key: any) => key.keyId === keyId);
    if (!apiKey) {
      res.status(404).json({
        success: false,
        error: 'API key not found'
      });
      return;
    }

    // Simulate a test request
    const startTime = Date.now();
    const success = apiKey.isActive;
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        success,
        status: success ? 200 : 401,
        responseTime,
        message: success ? 'API key is working correctly' : 'API key is inactive',
        error: success ? null : 'API key is not active'
      }
    });
  } catch (error: any) {
    logger.error('API key test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test API key'
    });
  }
}));

export default router;