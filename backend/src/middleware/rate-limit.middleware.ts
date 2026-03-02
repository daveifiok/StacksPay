import { Request, Response, NextFunction } from 'express';
import { Merchant } from '@/models/merchant/Merchant';
import { createLogger } from '@/utils/logger';

const logger = createLogger('RateLimitMiddleware');

export interface RateLimitInfo {
  limit: number;
  current: number;
  resetTime: Date;
  remaining: number;
}

/**
 * Rate limiting middleware for API key requests
 */
export const rateLimitMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const merchantId = req.merchant?.id;
    const apiKeyId = req.apiKey?.keyId;

    if (!merchantId || !apiKeyId) {
      return next(); // Skip rate limiting if no API key context
    }

    // Fetch the full merchant document from database
    const merchantDoc = await Merchant.findById(merchantId);
    
    if (!merchantDoc) {
      res.status(401).json({
        success: false,
        error: 'Merchant not found'
      });
      return;
    }

    // Find the specific API key
    const apiKey = merchantDoc.apiKeys.find((key: any) => key.keyId === apiKeyId);
    
    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
      return;
    }

    // Initialize request count if not set
    if (!apiKey.requestCount) {
      apiKey.requestCount = 0;
    }

    // Check if rate limit is exceeded
    const currentTime = new Date();
    const resetTime = apiKey.lastUsed ? 
      new Date(apiKey.lastUsed.getTime() + 60 * 60 * 1000) : // 1 hour window
      new Date(currentTime.getTime() + 60 * 60 * 1000);

    // Reset counter if window has passed
    if (currentTime > resetTime) {
      apiKey.requestCount = 0;
      apiKey.lastUsed = currentTime;
    }

    // Check rate limit
    if (apiKey.requestCount >= apiKey.rateLimit) {
      const retryAfter = Math.ceil((resetTime.getTime() - currentTime.getTime()) / 1000);
      
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        rateLimitInfo: {
          limit: apiKey.rateLimit,
          current: apiKey.requestCount,
          resetTime: resetTime,
          remaining: 0
        },
        retryAfter
      });
      
      logger.warn('Rate limit exceeded', {
        merchantId: merchantDoc._id,
        keyId: apiKey.keyId,
        currentCount: apiKey.requestCount,
        limit: apiKey.rateLimit
      });
      
      return;
    }

    // Increment request count
    apiKey.requestCount += 1;
    apiKey.lastUsed = currentTime;

    // Save the updated merchant document
    await merchantDoc.save();

    // Add rate limit headers
    const remaining = Math.max(0, apiKey.rateLimit - apiKey.requestCount);
    res.set({
      'X-RateLimit-Limit': apiKey.rateLimit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime.getTime().toString(),
      'X-RateLimit-Used': apiKey.requestCount.toString()
    });

    // Add rate limit info to request for potential use in controllers
    req.rateLimitInfo = {
      limit: apiKey.rateLimit,
      current: apiKey.requestCount,
      resetTime: resetTime,
      remaining: remaining
    };

    next();
  } catch (error) {
    logger.error('Rate limit middleware error:', error);
    // Don't block request on rate limit errors, just log and continue
    next();
  }
};

/**
 * Get current rate limit status for an API key
 */
export const getRateLimitStatus = async (merchantId: string, keyId: string): Promise<RateLimitInfo | null> => {
  try {
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) return null;

    const apiKey = merchant.apiKeys.find((key: any) => key.keyId === keyId);
    if (!apiKey) return null;

    const currentTime = new Date();
    const resetTime = apiKey.lastUsed ? 
      new Date(apiKey.lastUsed.getTime() + 60 * 60 * 1000) :
      new Date(currentTime.getTime() + 60 * 60 * 1000);

    const requestCount = currentTime > resetTime ? 0 : (apiKey.requestCount || 0);
    const remaining = Math.max(0, apiKey.rateLimit - requestCount);

    return {
      limit: apiKey.rateLimit,
      current: requestCount,
      resetTime: resetTime,
      remaining: remaining
    };
  } catch (error) {
    logger.error('Error getting rate limit status:', error);
    return null;
  }
};

/**
 * Reset rate limit for an API key (admin function)
 */
export const resetRateLimit = async (merchantId: string, keyId: string): Promise<boolean> => {
  try {
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) return false;

    const apiKey = merchant.apiKeys.find((key: any) => key.keyId === keyId);
    if (!apiKey) return false;

    apiKey.requestCount = 0;
    apiKey.lastUsed = new Date();
    
    await merchant.save();
    
    logger.info('Rate limit reset', { merchantId, keyId });
    return true;
  } catch (error) {
    logger.error('Error resetting rate limit:', error);
    return false;
  }
};
