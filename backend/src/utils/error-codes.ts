/**
 * Standardized error codes for the sBTC Payment Gateway
 * Provides consistent error handling across the entire system
 */

export enum ErrorCode {
  // Authentication Errors
  INVALID_API_KEY = 'INVALID_API_KEY',
  EXPIRED_API_KEY = 'EXPIRED_API_KEY',
  INVALID_SESSION = 'INVALID_SESSION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  IP_RESTRICTION_VIOLATION = 'IP_RESTRICTION_VIOLATION',

  // Payment Errors
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  PAYMENT_ALREADY_CONFIRMED = 'PAYMENT_ALREADY_CONFIRMED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  INVALID_PAYMENT_AMOUNT = 'INVALID_PAYMENT_AMOUNT',
  MINIMUM_AMOUNT_NOT_MET = 'MINIMUM_AMOUNT_NOT_MET',
  MAXIMUM_AMOUNT_EXCEEDED = 'MAXIMUM_AMOUNT_EXCEEDED',

  // Wallet & Blockchain Errors
  INVALID_WALLET_ADDRESS = 'INVALID_WALLET_ADDRESS',
  INVALID_WALLET_SIGNATURE = 'INVALID_WALLET_SIGNATURE',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_WALLET_BALANCE = 'INSUFFICIENT_WALLET_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  BLOCKCHAIN_NETWORK_ERROR = 'BLOCKCHAIN_NETWORK_ERROR',
  INVALID_TRANSACTION_ID = 'INVALID_TRANSACTION_ID',

  // Currency & Conversion Errors
  UNSUPPORTED_CURRENCY = 'UNSUPPORTED_CURRENCY',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXCHANGE_RATE_UNAVAILABLE = 'EXCHANGE_RATE_UNAVAILABLE',

  // Merchant Errors
  MERCHANT_NOT_FOUND = 'MERCHANT_NOT_FOUND',
  MERCHANT_NOT_VERIFIED = 'MERCHANT_NOT_VERIFIED',
  MERCHANT_SUSPENDED = 'MERCHANT_SUSPENDED',
  WALLET_SETUP_INCOMPLETE = 'WALLET_SETUP_INCOMPLETE',

  // Webhook Errors
  WEBHOOK_NOT_FOUND = 'WEBHOOK_NOT_FOUND',
  WEBHOOK_DELIVERY_FAILED = 'WEBHOOK_DELIVERY_FAILED',
  INVALID_WEBHOOK_URL = 'INVALID_WEBHOOK_URL',
  WEBHOOK_SIGNATURE_INVALID = 'WEBHOOK_SIGNATURE_INVALID',

  // System Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INVALID_REQUEST_FORMAT = 'INVALID_REQUEST_FORMAT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // sBTC Specific Errors
  SBTC_MINT_FAILED = 'SBTC_MINT_FAILED',
  SBTC_BURN_FAILED = 'SBTC_BURN_FAILED',
  SBTC_SIGNER_UNAVAILABLE = 'SBTC_SIGNER_UNAVAILABLE',
  SBTC_DEPOSIT_ADDRESS_GENERATION_FAILED = 'SBTC_DEPOSIT_ADDRESS_GENERATION_FAILED',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  httpStatus: number;
  details?: any;
  retryable?: boolean;
  userMessage?: string;
}

export const ERROR_DEFINITIONS: Record<ErrorCode, Omit<ErrorDetails, 'code' | 'details'>> = {
  // Authentication Errors
  [ErrorCode.INVALID_API_KEY]: {
    message: 'Invalid API key provided',
    httpStatus: 401,
    userMessage: 'Authentication failed. Please check your API key.',
  },
  [ErrorCode.EXPIRED_API_KEY]: {
    message: 'API key has expired',
    httpStatus: 401,
    userMessage: 'Your API key has expired. Please generate a new one.',
  },
  [ErrorCode.INVALID_SESSION]: {
    message: 'Invalid or expired session',
    httpStatus: 401,
    userMessage: 'Your session has expired. Please log in again.',
  },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    message: 'Insufficient permissions for this operation',
    httpStatus: 403,
    userMessage: 'You do not have permission to perform this action.',
  },
  [ErrorCode.IP_RESTRICTION_VIOLATION]: {
    message: 'Request from unauthorized IP address',
    httpStatus: 403,
    userMessage: 'Access denied from your current location.',
  },

  // Payment Errors
  [ErrorCode.PAYMENT_NOT_FOUND]: {
    message: 'Payment not found',
    httpStatus: 404,
    userMessage: 'The requested payment could not be found.',
  },
  [ErrorCode.PAYMENT_EXPIRED]: {
    message: 'Payment has expired',
    httpStatus: 400,
    userMessage: 'This payment has expired. Please create a new payment.',
  },
  [ErrorCode.PAYMENT_ALREADY_CONFIRMED]: {
    message: 'Payment has already been confirmed',
    httpStatus: 400,
    userMessage: 'This payment has already been processed.',
  },
  [ErrorCode.PAYMENT_CANCELLED]: {
    message: 'Payment has been cancelled',
    httpStatus: 400,
    userMessage: 'This payment has been cancelled.',
  },
  [ErrorCode.INVALID_PAYMENT_AMOUNT]: {
    message: 'Invalid payment amount',
    httpStatus: 400,
    userMessage: 'Please enter a valid payment amount.',
  },
  [ErrorCode.MINIMUM_AMOUNT_NOT_MET]: {
    message: 'Payment amount below minimum',
    httpStatus: 400,
    userMessage: 'Payment amount is below the minimum required.',
  },
  [ErrorCode.MAXIMUM_AMOUNT_EXCEEDED]: {
    message: 'Payment amount exceeds maximum',
    httpStatus: 400,
    userMessage: 'Payment amount exceeds the maximum allowed.',
  },

  // Wallet & Blockchain Errors
  [ErrorCode.INVALID_WALLET_ADDRESS]: {
    message: 'Invalid wallet address format',
    httpStatus: 400,
    userMessage: 'Please provide a valid wallet address.',
  },
  [ErrorCode.INVALID_WALLET_SIGNATURE]: {
    message: 'Invalid wallet signature',
    httpStatus: 400,
    userMessage: 'Wallet signature verification failed.',
  },
  [ErrorCode.WALLET_NOT_CONNECTED]: {
    message: 'Wallet not connected',
    httpStatus: 400,
    userMessage: 'Please connect your wallet to continue.',
  },
  [ErrorCode.INSUFFICIENT_WALLET_BALANCE]: {
    message: 'Insufficient wallet balance',
    httpStatus: 400,
    userMessage: 'Your wallet does not have sufficient funds for this transaction.',
  },
  [ErrorCode.TRANSACTION_FAILED]: {
    message: 'Blockchain transaction failed',
    httpStatus: 400,
    retryable: true,
    userMessage: 'Transaction failed. Please try again.',
  },
  [ErrorCode.BLOCKCHAIN_NETWORK_ERROR]: {
    message: 'Blockchain network unavailable',
    httpStatus: 503,
    retryable: true,
    userMessage: 'Network is temporarily unavailable. Please try again later.',
  },
  [ErrorCode.INVALID_TRANSACTION_ID]: {
    message: 'Invalid transaction ID',
    httpStatus: 400,
    userMessage: 'Please provide a valid transaction ID.',
  },

  // Currency & Conversion Errors
  [ErrorCode.UNSUPPORTED_CURRENCY]: {
    message: 'Unsupported currency',
    httpStatus: 400,
    userMessage: 'This currency is not supported.',
  },
  [ErrorCode.CONVERSION_FAILED]: {
    message: 'Currency conversion failed',
    httpStatus: 500,
    retryable: true,
    userMessage: 'Currency conversion failed. Please try again.',
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    message: 'Rate limit exceeded',
    httpStatus: 429,
    retryable: true,
    userMessage: 'Too many requests. Please wait before trying again.',
  },
  [ErrorCode.EXCHANGE_RATE_UNAVAILABLE]: {
    message: 'Exchange rate unavailable',
    httpStatus: 503,
    retryable: true,
    userMessage: 'Exchange rates are temporarily unavailable.',
  },

  // Merchant Errors
  [ErrorCode.MERCHANT_NOT_FOUND]: {
    message: 'Merchant not found',
    httpStatus: 404,
    userMessage: 'Merchant account not found.',
  },
  [ErrorCode.MERCHANT_NOT_VERIFIED]: {
    message: 'Merchant account not verified',
    httpStatus: 403,
    userMessage: 'Please complete merchant verification first.',
  },
  [ErrorCode.MERCHANT_SUSPENDED]: {
    message: 'Merchant account suspended',
    httpStatus: 403,
    userMessage: 'Your merchant account has been suspended.',
  },
  [ErrorCode.WALLET_SETUP_INCOMPLETE]: {
    message: 'Merchant wallet setup incomplete',
    httpStatus: 400,
    userMessage: 'Please complete your wallet setup to accept payments.',
  },

  // Webhook Errors
  [ErrorCode.WEBHOOK_NOT_FOUND]: {
    message: 'Webhook endpoint not found',
    httpStatus: 404,
    userMessage: 'Webhook endpoint not found.',
  },
  [ErrorCode.WEBHOOK_DELIVERY_FAILED]: {
    message: 'Webhook delivery failed',
    httpStatus: 500,
    retryable: true,
    userMessage: 'Webhook delivery failed.',
  },
  [ErrorCode.INVALID_WEBHOOK_URL]: {
    message: 'Invalid webhook URL',
    httpStatus: 400,
    userMessage: 'Please provide a valid webhook URL.',
  },
  [ErrorCode.WEBHOOK_SIGNATURE_INVALID]: {
    message: 'Invalid webhook signature',
    httpStatus: 400,
    userMessage: 'Webhook signature verification failed.',
  },

  // System Errors
  [ErrorCode.DATABASE_ERROR]: {
    message: 'Database operation failed',
    httpStatus: 500,
    retryable: true,
    userMessage: 'A system error occurred. Please try again.',
  },
  [ErrorCode.NETWORK_ERROR]: {
    message: 'Network request failed',
    httpStatus: 500,
    retryable: true,
    userMessage: 'Network error. Please check your connection and try again.',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    message: 'Service temporarily unavailable',
    httpStatus: 503,
    retryable: true,
    userMessage: 'Service is temporarily unavailable. Please try again later.',
  },
  [ErrorCode.INVALID_REQUEST_FORMAT]: {
    message: 'Invalid request format',
    httpStatus: 400,
    userMessage: 'Invalid request format. Please check your input.',
  },
  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    message: 'Missing required field',
    httpStatus: 400,
    userMessage: 'Please fill in all required fields.',
  },
  [ErrorCode.VALIDATION_ERROR]: {
    message: 'Validation failed',
    httpStatus: 400,
    userMessage: 'Please check your input and try again.',
  },

  // sBTC Specific Errors
  [ErrorCode.SBTC_MINT_FAILED]: {
    message: 'sBTC minting failed',
    httpStatus: 500,
    retryable: true,
    userMessage: 'sBTC minting failed. Please try again.',
  },
  [ErrorCode.SBTC_BURN_FAILED]: {
    message: 'sBTC burning failed',
    httpStatus: 500,
    retryable: true,
    userMessage: 'sBTC withdrawal failed. Please try again.',
  },
  [ErrorCode.SBTC_SIGNER_UNAVAILABLE]: {
    message: 'sBTC signer network unavailable',
    httpStatus: 503,
    retryable: true,
    userMessage: 'sBTC network is temporarily unavailable.',
  },
  [ErrorCode.SBTC_DEPOSIT_ADDRESS_GENERATION_FAILED]: {
    message: 'Failed to generate sBTC deposit address',
    httpStatus: 500,
    retryable: true,
    userMessage: 'Could not generate deposit address. Please try again.',
  },
};

export class PaymentGatewayError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly details?: any;

  constructor(code: ErrorCode, details?: any, customMessage?: string) {
    const errorDef = ERROR_DEFINITIONS[code];
    super(customMessage || errorDef.message);
    
    this.name = 'PaymentGatewayError';
    this.code = code;
    this.httpStatus = errorDef.httpStatus;
    this.retryable = errorDef.retryable || false;
    this.userMessage = errorDef.userMessage || errorDef.message;
    this.details = details;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        userMessage: this.userMessage,
        retryable: this.retryable,
        details: this.details,
      },
    };
  }
}

export function createStandardError(code: ErrorCode, details?: any, customMessage?: string) {
  return new PaymentGatewayError(code, details, customMessage);
}
