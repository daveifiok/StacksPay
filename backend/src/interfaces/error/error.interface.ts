export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError | string;
  message?: string;
}

export const ErrorCodes = {
  // Authentication Errors
  INVALID_API_KEY: 'INVALID_API_KEY',
  EXPIRED_API_KEY: 'EXPIRED_API_KEY',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_SESSION: 'INVALID_SESSION',

  // Payment Errors
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  INVALID_PAYMENT_STATUS: 'INVALID_PAYMENT_STATUS',
  PAYMENT_ALREADY_PROCESSED: 'PAYMENT_ALREADY_PROCESSED',
  PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  CURRENCY_NOT_SUPPORTED: 'CURRENCY_NOT_SUPPORTED',
  PAYMENT_METHOD_NOT_SUPPORTED: 'PAYMENT_METHOD_NOT_SUPPORTED',

  // Wallet Errors
  INVALID_WALLET_ADDRESS: 'INVALID_WALLET_ADDRESS',
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  SIGNATURE_VERIFICATION_FAILED: 'SIGNATURE_VERIFICATION_FAILED',
  MESSAGE_EXPIRED: 'MESSAGE_EXPIRED',
  INVALID_MESSAGE_FORMAT: 'INVALID_MESSAGE_FORMAT',

  // Merchant Errors
  MERCHANT_NOT_FOUND: 'MERCHANT_NOT_FOUND',
  MERCHANT_NOT_VERIFIED: 'MERCHANT_NOT_VERIFIED',
  MERCHANT_SUSPENDED: 'MERCHANT_SUSPENDED',
  WALLET_SETUP_REQUIRED: 'WALLET_SETUP_REQUIRED',

  // Network Errors
  BLOCKCHAIN_CONNECTION_ERROR: 'BLOCKCHAIN_CONNECTION_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_PARAMETER: 'INVALID_PARAMETER',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Webhook Errors
  WEBHOOK_DELIVERY_FAILED: 'WEBHOOK_DELIVERY_FAILED',
  INVALID_WEBHOOK_URL: 'INVALID_WEBHOOK_URL',
  WEBHOOK_NOT_FOUND: 'WEBHOOK_NOT_FOUND',

  // Conversion Errors
  CONVERSION_FAILED: 'CONVERSION_FAILED',
  INVALID_CONVERSION_RATE: 'INVALID_CONVERSION_RATE',

  // Generic Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.INVALID_API_KEY]: 'Invalid or malformed API key',
  [ErrorCodes.EXPIRED_API_KEY]: 'API key has expired',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'API key does not have required permissions',
  [ErrorCodes.INVALID_SESSION]: 'Invalid or expired session token',

  [ErrorCodes.PAYMENT_NOT_FOUND]: 'Payment not found',
  [ErrorCodes.INVALID_PAYMENT_STATUS]: 'Invalid payment status',
  [ErrorCodes.PAYMENT_ALREADY_PROCESSED]: 'Payment has already been processed',
  [ErrorCodes.PAYMENT_EXPIRED]: 'Payment has expired',
  [ErrorCodes.INSUFFICIENT_BALANCE]: 'Insufficient wallet balance',
  [ErrorCodes.INVALID_SIGNATURE]: 'Invalid wallet signature',
  [ErrorCodes.INVALID_AMOUNT]: 'Invalid payment amount',
  [ErrorCodes.CURRENCY_NOT_SUPPORTED]: 'Currency not supported',
  [ErrorCodes.PAYMENT_METHOD_NOT_SUPPORTED]: 'Payment method not supported',

  [ErrorCodes.INVALID_WALLET_ADDRESS]: 'Invalid wallet address format',
  [ErrorCodes.WALLET_NOT_CONNECTED]: 'Wallet not connected',
  [ErrorCodes.SIGNATURE_VERIFICATION_FAILED]: 'Wallet signature verification failed',
  [ErrorCodes.MESSAGE_EXPIRED]: 'Signature message has expired',
  [ErrorCodes.INVALID_MESSAGE_FORMAT]: 'Invalid signature message format',

  [ErrorCodes.MERCHANT_NOT_FOUND]: 'Merchant account not found',
  [ErrorCodes.MERCHANT_NOT_VERIFIED]: 'Merchant account not verified',
  [ErrorCodes.MERCHANT_SUSPENDED]: 'Merchant account suspended',
  [ErrorCodes.WALLET_SETUP_REQUIRED]: 'Merchant must configure wallet addresses',

  [ErrorCodes.BLOCKCHAIN_CONNECTION_ERROR]: 'Unable to connect to blockchain network',
  [ErrorCodes.TRANSACTION_FAILED]: 'Blockchain transaction failed',
  [ErrorCodes.NETWORK_ERROR]: 'Network connectivity error',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',

  [ErrorCodes.VALIDATION_ERROR]: 'Request validation failed',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCodes.INVALID_FORMAT]: 'Invalid data format',
  [ErrorCodes.INVALID_PARAMETER]: 'Invalid parameter value',

  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Request rate limit exceeded',

  [ErrorCodes.WEBHOOK_DELIVERY_FAILED]: 'Webhook delivery failed',
  [ErrorCodes.INVALID_WEBHOOK_URL]: 'Invalid webhook URL',
  [ErrorCodes.WEBHOOK_NOT_FOUND]: 'Webhook endpoint not found',

  [ErrorCodes.CONVERSION_FAILED]: 'Currency conversion failed',
  [ErrorCodes.INVALID_CONVERSION_RATE]: 'Invalid or unavailable conversion rate',

  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCodes.NOT_IMPLEMENTED]: 'Feature not implemented',
  [ErrorCodes.FORBIDDEN]: 'Access forbidden',
  [ErrorCodes.UNAUTHORIZED]: 'Authentication required',
  [ErrorCodes.NOT_FOUND]: 'Resource not found',
  [ErrorCodes.BAD_REQUEST]: 'Bad request'
};

export function createError(code: ErrorCode, details?: any, customMessage?: string): ApiError {
  return {
    code,
    message: customMessage || ErrorMessages[code],
    details,
    statusCode: getStatusCodeForError(code)
  };
}

export function getStatusCodeForError(code: ErrorCode): number {
  switch (code) {
    case ErrorCodes.UNAUTHORIZED:
    case ErrorCodes.INVALID_API_KEY:
    case ErrorCodes.EXPIRED_API_KEY:
    case ErrorCodes.INVALID_SESSION:
      return 401;

    case ErrorCodes.FORBIDDEN:
    case ErrorCodes.INSUFFICIENT_PERMISSIONS:
    case ErrorCodes.MERCHANT_SUSPENDED:
      return 403;

    case ErrorCodes.NOT_FOUND:
    case ErrorCodes.PAYMENT_NOT_FOUND:
    case ErrorCodes.MERCHANT_NOT_FOUND:
    case ErrorCodes.WEBHOOK_NOT_FOUND:
      return 404;

    case ErrorCodes.BAD_REQUEST:
    case ErrorCodes.VALIDATION_ERROR:
    case ErrorCodes.MISSING_REQUIRED_FIELD:
    case ErrorCodes.INVALID_FORMAT:
    case ErrorCodes.INVALID_PARAMETER:
    case ErrorCodes.INVALID_PAYMENT_STATUS:
    case ErrorCodes.PAYMENT_ALREADY_PROCESSED:
    case ErrorCodes.PAYMENT_EXPIRED:
    case ErrorCodes.INVALID_AMOUNT:
    case ErrorCodes.CURRENCY_NOT_SUPPORTED:
    case ErrorCodes.PAYMENT_METHOD_NOT_SUPPORTED:
    case ErrorCodes.INVALID_WALLET_ADDRESS:
    case ErrorCodes.INVALID_SIGNATURE:
    case ErrorCodes.MESSAGE_EXPIRED:
    case ErrorCodes.INVALID_MESSAGE_FORMAT:
    case ErrorCodes.INVALID_WEBHOOK_URL:
      return 400;

    case ErrorCodes.RATE_LIMIT_EXCEEDED:
      return 429;

    case ErrorCodes.NOT_IMPLEMENTED:
      return 501;

    case ErrorCodes.SERVICE_UNAVAILABLE:
    case ErrorCodes.BLOCKCHAIN_CONNECTION_ERROR:
      return 503;

    default:
      return 500;
  }
}
