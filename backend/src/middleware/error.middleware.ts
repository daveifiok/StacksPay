/**
 * Error Handling Middleware for sBTC Payment Gateway
 * Centralized error processing and response formatting
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@/utils/logger';
import { PaymentGatewayError, ErrorCode, createStandardError } from '@/utils/error-codes';

const logger = createLogger('ErrorMiddleware');

/**
 * Async handler wrapper to catch async function errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Enhanced error handling middleware with standardized error codes
 */
export const errorHandler = (
  error: Error | PaymentGatewayError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID for tracking
  const requestId = req.headers['x-request-id'] as string || generateRequestId();

  // Check if it's our custom PaymentGatewayError
  if (error instanceof PaymentGatewayError) {
    logger.warn('Payment Gateway Error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      path: req.path,
      method: req.method,
      merchantId: req.merchant?.id,
      requestId,
    });

    const errorResponse = error.toJSON();
    res.status(error.httpStatus).json({
      ...errorResponse,
      requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle validation errors (from Mongoose, Joi, etc.)
  if (error.name === 'ValidationError') {
    const validationError = createStandardError(ErrorCode.VALIDATION_ERROR, {
      validationErrors: error.message,
    });
    
    logger.warn('Validation Error:', {
      error: error.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    res.status(validationError.httpStatus).json({
      ...validationError.toJSON(),
      requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle MongoDB duplicate key errors
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    const duplicateError = createStandardError(ErrorCode.VALIDATION_ERROR, {
      duplicateField: Object.keys((error as any).keyValue || {})[0],
    }, 'Duplicate field value');

    logger.warn('Duplicate key error:', {
      error: error.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    res.status(duplicateError.httpStatus).json({
      ...duplicateError.toJSON(),
      requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const jwtError = createStandardError(ErrorCode.INVALID_SESSION, null, 'Invalid token');
    
    logger.warn('JWT Error:', {
      error: error.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    res.status(jwtError.httpStatus).json({
      ...jwtError.toJSON(),
      requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const expiredError = createStandardError(ErrorCode.INVALID_SESSION, null, 'Token expired');
    
    logger.warn('JWT Expired:', {
      error: error.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    res.status(expiredError.httpStatus).json({
      ...expiredError.toJSON(),
      requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle rate limiting errors
  if ((error as any).status === 429) {
    const rateLimitError = createStandardError(ErrorCode.RATE_LIMIT_EXCEEDED, {
      retryAfter: (error as any).retryAfter,
    });

    logger.warn('Rate limit exceeded:', {
      error: error.message,
      path: req.path,
      method: req.method,
      ip: req.ip,
      requestId,
    });

    res.status(rateLimitError.httpStatus).json({
      ...rateLimitError.toJSON(),
      requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle network/timeout errors
  if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
    const networkError = createStandardError(ErrorCode.NETWORK_ERROR, {
      originalError: error.message,
    });

    logger.error('Network Error:', {
      error: error.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    res.status(networkError.httpStatus).json({
      ...networkError.toJSON(),
      requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Default to generic database error for unknown errors
  const genericError = createStandardError(ErrorCode.DATABASE_ERROR, {
    originalError: error.message,
  }, 'An unexpected error occurred');

  logger.error('Unexpected Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    merchantId: req.merchant?.id,
    requestId,
  });

  res.status(genericError.httpStatus).json({
    ...genericError.toJSON(),
    requestId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  logger.warn('Route not found:', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    requestId,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      userMessage: 'The requested endpoint was not found.',
    },
    requestId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Request ID middleware
 * Adds unique ID to each request for tracking
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

/**
 * Helper function to throw standardized errors in services
 */
export const throwError = (code: ErrorCode, details?: any, customMessage?: string): never => {
  throw new PaymentGatewayError(code, details, customMessage);
};

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
