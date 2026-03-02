import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ValidationMiddleware');

/**
 * Middleware to handle express-validator validation errors
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error: ValidationError) => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined,
      }));

      logger.debug('Validation errors:', {
        endpoint: req.path,
        method: req.method,
        errors: formattedErrors,
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: formattedErrors,
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Validation middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation service error',
    });
  }
};

/**
 * Custom validation for API key format
 */
export const validateApiKeyFormat = (value: string): boolean => {
  return value.startsWith('sk_test_') || value.startsWith('sk_live_');
};

/**
 * Custom validation for Stacks address format
 */
export const validateStacksAddress = (value: string): boolean => {
  // Basic Stacks address validation (starts with SP or SM, followed by 39 characters)
  const stacksAddressRegex = /^S[PM][0-9A-HJKMNP-TV-Z]{39}$/;
  return stacksAddressRegex.test(value);
};

/**
 * Custom validation for email format (more strict than default)
 */
export const validateEmailStrict = (value: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(value);
};

/**
 * Custom validation for password strength
 */
export const validatePasswordStrength = (value: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (value.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(value)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(value)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(value)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default {
  validateRequest,
  validateApiKeyFormat,
  validateStacksAddress,
  validateEmailStrict,
  validatePasswordStrength,
};
