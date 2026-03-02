import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: Request, res: Response) => void;
}

export interface RateLimitInfo {
  totalHits: number;
  totalHitsPerUser?: number;
  remaining: number;
  resetTime: Date;
  limit: number;
}

export class RateLimitService {
  private redis: Redis | null = null;
  private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
        console.log('Redis connected for rate limiting');
      } catch (error) {
        console.warn('Redis connection failed, using memory store for rate limiting');
      }
    }
  }

  /**
   * Create rate limit middleware
   */
  createRateLimit(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = config.keyGenerator ? config.keyGenerator(req) : this.defaultKeyGenerator(req);
        const rateLimitInfo = await this.checkRateLimit(key, config);

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
          'X-RateLimit-Reset': rateLimitInfo.resetTime.toISOString(),
        });

        if (rateLimitInfo.remaining < 0) {
          // Rate limit exceeded
          if (config.onLimitReached) {
            config.onLimitReached(req, res);
          }

          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((rateLimitInfo.resetTime.getTime() - Date.now()) / 1000),
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        // If rate limiting fails, allow the request to continue
        next();
      }
    };
  }

  /**
   * Check rate limit for a specific key
   */
  async checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const resetTime = new Date(now + config.windowMs);

    if (this.redis) {
      return this.checkRateLimitRedis(key, config, now, windowStart, resetTime);
    } else {
      return this.checkRateLimitMemory(key, config, now, resetTime);
    }
  }

  /**
   * API key specific rate limiting
   */
  async checkApiKeyRateLimit(
    apiKey: string, 
    limit: number, 
    windowMs: number = 60000
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const key = `api_key:${apiKey}`;
    const rateLimitInfo = await this.checkRateLimit(key, {
      windowMs,
      maxRequests: limit,
    });

    return {
      allowed: rateLimitInfo.remaining >= 0,
      remaining: Math.max(0, rateLimitInfo.remaining),
      resetTime: rateLimitInfo.resetTime,
    };
  }

  /**
   * IP-based rate limiting for authentication endpoints
   */
  createAuthRateLimit() {
    return this.createRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // 10 attempts per 15 minutes
      keyGenerator: (req) => `auth:${this.getClientIP(req)}`,
      onLimitReached: (req, res) => {
        console.warn(`Auth rate limit exceeded for IP: ${this.getClientIP(req)}`);
      },
    });
  }

  /**
   * Strict rate limiting for sensitive operations
   */
  createStrictRateLimit() {
    return this.createRateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // 5 attempts per hour
      keyGenerator: (req) => {
        const ip = this.getClientIP(req);
        const userAgent = req.get('User-Agent') || '';
        return `strict:${ip}:${this.hashString(userAgent)}`;
      },
    });
  }

  /**
   * General API rate limiting
   */
  createApiRateLimit() {
    return this.createRateLimit({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      keyGenerator: (req) => {
        // Use API key if available, otherwise IP
        const apiKey = req.headers['x-api-key'] as string;
        if (apiKey) {
          return `api:${apiKey}`;
        }
        return `api:${this.getClientIP(req)}`;
      },
    });
  }

  /**
   * Progressive rate limiting (increases penalties for repeated violations)
   */
  async checkProgressiveRateLimit(
    key: string,
    baseLimit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; currentLimit: number; violations: number }> {
    const violationKey = `violations:${key}`;
    const violations = await this.getViolationCount(violationKey);
    
    // Reduce limit based on violations: 50% reduction per violation (min 1)
    const currentLimit = Math.max(1, Math.floor(baseLimit / Math.pow(2, violations)));
    
    const rateLimitInfo = await this.checkRateLimit(key, {
      windowMs,
      maxRequests: currentLimit,
    });

    if (rateLimitInfo.remaining < 0) {
      // Increment violation count
      await this.incrementViolationCount(violationKey);
      return { allowed: false, currentLimit, violations: violations + 1 };
    }

    return { allowed: true, currentLimit, violations };
  }

  /**
   * Reset rate limit for a key (admin function)
   */
  async resetRateLimit(key: string): Promise<boolean> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryStore.delete(key);
      }
      return true;
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      return false;
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(key: string, windowMs: number): Promise<{
    requestCount: number;
    remainingTime: number;
  }> {
    if (this.redis) {
      const count = await this.redis.get(key);
      const ttl = await this.redis.ttl(key);
      return {
        requestCount: count ? parseInt(count) : 0,
        remainingTime: ttl > 0 ? ttl * 1000 : 0,
      };
    } else {
      const data = this.memoryStore.get(key);
      if (!data) {
        return { requestCount: 0, remainingTime: 0 };
      }
      return {
        requestCount: data.count,
        remainingTime: Math.max(0, data.resetTime - Date.now()),
      };
    }
  }

  /**
   * Redis-based rate limiting
   */
  private async checkRateLimitRedis(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number,
    resetTime: Date
  ): Promise<RateLimitInfo> {
    if (!this.redis) throw new Error('Redis not available');

    // Use sliding window with sorted sets
    const pipeline = this.redis.pipeline();
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current entries
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiration
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    
    if (!results) throw new Error('Redis pipeline failed');

    const currentCount = (results[1][1] as number) || 0;
    const remaining = config.maxRequests - currentCount - 1;

    return {
      totalHits: currentCount + 1,
      remaining,
      resetTime,
      limit: config.maxRequests,
    };
  }

  /**
   * Memory-based rate limiting (fallback)
   */
  private checkRateLimitMemory(
    key: string,
    config: RateLimitConfig,
    now: number,
    resetTime: Date
  ): RateLimitInfo {
    const data = this.memoryStore.get(key);
    
    if (!data || data.resetTime <= now) {
      // New window
      this.memoryStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      
      return {
        totalHits: 1,
        remaining: config.maxRequests - 1,
        resetTime,
        limit: config.maxRequests,
      };
    }

    // Increment count
    data.count++;
    this.memoryStore.set(key, data);

    return {
      totalHits: data.count,
      remaining: config.maxRequests - data.count,
      resetTime: new Date(data.resetTime),
      limit: config.maxRequests,
    };
  }

  /**
   * Get violation count for progressive rate limiting
   */
  private async getViolationCount(key: string): Promise<number> {
    if (this.redis) {
      const count = await this.redis.get(key);
      return count ? parseInt(count) : 0;
    } else {
      const data = this.memoryStore.get(key);
      return data?.count || 0;
    }
  }

  /**
   * Increment violation count
   */
  private async incrementViolationCount(key: string): Promise<void> {
    const expirationMs = 24 * 60 * 60 * 1000; // 24 hours
    
    if (this.redis) {
      await this.redis.incr(key);
      await this.redis.expire(key, Math.ceil(expirationMs / 1000));
    } else {
      const data = this.memoryStore.get(key);
      this.memoryStore.set(key, {
        count: (data?.count || 0) + 1,
        resetTime: Date.now() + expirationMs,
      });
    }
  }

  /**
   * Default key generator using IP address
   */
  private defaultKeyGenerator(req: Request): string {
    return `rate_limit:${this.getClientIP(req)}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1'
    ).replace(/^::ffff:/, ''); // Remove IPv6 prefix
  }

  /**
   * Hash a string for key generation
   */
  private hashString(str: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 8);
  }

  /**
   * Clean up expired entries from memory store
   */
  private cleanupMemoryStore(): void {
    const now = Date.now();
    for (const [key, data] of this.memoryStore.entries()) {
      if (data.resetTime <= now) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Start cleanup interval for memory store
   */
  startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupMemoryStore();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }
}

export const rateLimitService = new RateLimitService();
