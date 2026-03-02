/**
 * Custom Error Classes for sBTC Payment Gateway
 * Provides structured error handling across the application
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'PAYMENT_ERROR', details);
  }
}

export class BlockchainError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'BLOCKCHAIN_ERROR', details);
  }
}

export class SbtcError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'SBTC_ERROR', details);
  }
}

export class WalletError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'WALLET_ERROR', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 429, 'RATE_LIMIT_ERROR', details);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'CONFIGURATION_ERROR', details, false);
  }
}

// Error factory for creating appropriate error types
export class ErrorFactory {
  static createValidationError(field: string, value: any, requirement: string): ValidationError {
    return new ValidationError(`Invalid ${field}: ${requirement}`, {
      field,
      value,
      requirement
    });
  }

  static createPaymentError(type: string, message: string, paymentId?: string): PaymentError {
    return new PaymentError(`Payment ${type} error: ${message}`, {
      type,
      paymentId,
      timestamp: new Date().toISOString()
    });
  }

  static createBlockchainError(network: string, operation: string, message: string): BlockchainError {
    return new BlockchainError(`${network} ${operation} failed: ${message}`, {
      network,
      operation,
      timestamp: new Date().toISOString()
    });
  }

  static createExternalServiceError(service: string, endpoint: string, statusCode: number, message: string): ExternalServiceError {
    return new ExternalServiceError(service, `${endpoint} returned ${statusCode}: ${message}`, {
      endpoint,
      statusCode,
      timestamp: new Date().toISOString()
    });
  }
}
