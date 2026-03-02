import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@/utils/logger';
import { authService } from '@/services/auth/auth-service';

const logger = createLogger('AuthMiddleware');

// Extend Express Request interface to include auth context
declare global {
  namespace Express {
    interface Request {
      merchant?: {
        id: string;
        name: string;
        email: string;
        stacksAddress?: string;
        emailVerified: boolean;
        permissions?: string[];
        environment?: 'test' | 'live';
        keyId?: string;
      };
      sessionData?: {
        sessionId: string;
        merchantId: string;
      };
      apiKey?: {
        keyId: string;
        permissions: string[];
        environment: 'test' | 'live';
      };
      rateLimitInfo?: {
        limit: number;
        current: number;
        resetTime: Date;
        remaining: number;
      };
    }
  }
}

/**
 * Middleware to authenticate API key requests
 * Used for /api/v1/* endpoints that require API key authentication
 */
export const apiKeyMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid Authorization header. Expected: Bearer sk_test_... or Bearer sk_live_...'
      });
      return;
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '
    
    // Validate API key format
    if (!apiKey.startsWith('sk_test_') && !apiKey.startsWith('sk_live_')) {
      res.status(401).json({
        success: false,
        error: 'Invalid API key format. Must start with sk_test_ or sk_live_'
      });
      return;
    }

    const ipAddress = (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '127.0.0.1'
    ).replace(/^::ffff:/, '');

    const authResult = await authService.validateApiKey(apiKey, ipAddress);
    
    if (!authResult) {
      logger.warn('Invalid API key used', {
        apiKeyPreview: `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`,
        ip: req.ip
      });
      
      res.status(401).json({
        success: false,
        error: 'Invalid or expired API key'
      });
      return;
    }

    // Add merchant and API key context to request
    req.merchant = {
      id: authResult.merchantId,
      name: authResult.merchant.name,
      email: authResult.merchant.email,
      stacksAddress: authResult.merchant.stacksAddress,
      emailVerified: authResult.merchant.emailVerified,
      permissions: authResult.permissions,
      environment: authResult.environment as 'test' | 'live',
      keyId: authResult.keyId,
    };

    req.apiKey = {
      keyId: authResult.keyId,
      permissions: authResult.permissions,
      environment: authResult.environment as 'test' | 'live',
    };

    logger.debug('API key authenticated', {
      merchantId: authResult.merchantId,
      keyId: authResult.keyId,
      environment: authResult.environment,
      endpoint: req.path
    });

    next();

  } catch (error) {
    logger.error('API key middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service error'
    });
  }
};

/**
 * Middleware to authenticate JWT session requests
 * Used for dashboard routes and session-based API endpoints
 */
export const sessionMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid Authorization header. Expected: Bearer <jwt_token>'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    const authResult = await authService.verifyToken(token);
    
    if (!authResult) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired session token'
      });
      return;
    }

    // Add merchant and session context to request
    req.merchant = {
      id: authResult.merchantId,
      name: authResult.merchant.name,
      email: authResult.merchant.email,
      stacksAddress: authResult.merchant.stacksAddress,
      emailVerified: authResult.merchant.emailVerified,
    };

    req.sessionData = {
      sessionId: authResult.sessionId,
      merchantId: authResult.merchantId,
    };
    
    // Also store in the express session for OAuth compatibility
    if (req.session) {
      (req.session as any).sessionId = authResult.sessionId;
      (req.session as any).merchantId = authResult.merchantId;
    }

    logger.debug('Session authenticated', {
      merchantId: authResult.merchantId,
      sessionId: authResult.sessionId,
      endpoint: req.path
    });

    next();

  } catch (error) {
    logger.error('Session middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service error'
    });
  }
};

/**
 * Middleware to check specific permissions
 * Use after apiKeyMiddleware to check if API key has required permissions
 */
export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const merchantPermissions = req.merchant?.permissions || [];
      
      const hasPermission = requiredPermissions.every(permission => 
        merchantPermissions.includes(permission)
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Permission validation error'
      });
    }
  };
};

/**
 * Middleware to check API key environment
 * Ensure test keys can't access live endpoints and vice versa
 */
export const requireEnvironment = (requiredEnvironment: 'test' | 'live') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const keyEnvironment = req.merchant?.environment || req.apiKey?.environment;
      
      if (keyEnvironment !== requiredEnvironment) {
        res.status(403).json({
          success: false,
          error: `This endpoint requires ${requiredEnvironment} environment. Your key is for ${keyEnvironment}.`
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Environment check error:', error);
      res.status(500).json({
        success: false,
        error: 'Environment validation error'
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Adds merchant context if authenticated, but doesn't require it
 */
export const optionalAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Try API key first
      if (token.startsWith('sk_')) {
        const ipAddress = (
          (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          req.ip ||
          '127.0.0.1'
        ).replace(/^::ffff:/, '');
        
        const authResult = await authService.validateApiKey(token, ipAddress);
        if (authResult) {
          req.merchant = {
            id: authResult.merchantId,
            name: authResult.merchant.name,
            email: authResult.merchant.email,
            stacksAddress: authResult.merchant.stacksAddress,
            emailVerified: authResult.merchant.emailVerified,
            permissions: authResult.permissions,
            environment: authResult.environment as 'test' | 'live',
            keyId: authResult.keyId,
          };
        }
      } else {
        // Try JWT session token
        const authResult = await authService.verifyToken(token);
        if (authResult) {
          req.merchant = {
            id: authResult.merchantId,
            name: authResult.merchant.name,
            email: authResult.merchant.email,
            stacksAddress: authResult.merchant.stacksAddress,
            emailVerified: authResult.merchant.emailVerified,
          };
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    // Don't fail the request, just continue without auth context
    next();
  }
};

export default {
  apiKeyMiddleware,
  sessionMiddleware,
  requirePermissions,
  requireEnvironment,
  optionalAuth,
};