import { useToast } from '@/hooks/use-toast';

export interface PaymentError {
  code: string;
  message: string;
  details?: any;
  paymentId?: string;
  timestamp?: string;
}

export interface ErrorAnalytics {
  error_code: string;
  payment_id?: string;
  user_agent?: string;
  timestamp: string;
}

// Error code mappings for user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'NETWORK_ERROR': 'Network connection error. Please check your internet connection.',
  'TIMEOUT_ERROR': 'Request timed out. Please try again.',
  'CONNECTION_FAILED': 'Failed to connect to payment service.',
  
  // Payment specific errors
  'INSUFFICIENT_FUNDS': 'Insufficient funds in wallet. Please add funds and try again.',
  'INVALID_ADDRESS': 'Invalid payment address. Please check the address and try again.',
  'INVALID_AMOUNT': 'Invalid payment amount. Please check the amount and try again.',
  'PAYMENT_EXPIRED': 'Payment link has expired. Please create a new payment.',
  'PAYMENT_ALREADY_PAID': 'Payment has already been completed.',
  'PAYMENT_CANCELLED': 'Payment has been cancelled.',
  'PAYMENT_FAILED': 'Payment processing failed. Please try again.',
  
  // Blockchain errors
  'BLOCKCHAIN_ERROR': 'Blockchain network error. Please try again later.',
  'TRANSACTION_FAILED': 'Transaction failed on the blockchain.',
  'CONFIRMATION_TIMEOUT': 'Transaction confirmation timed out.',
  'INVALID_SIGNATURE': 'Invalid transaction signature.',
  'NONCE_ERROR': 'Transaction nonce error. Please try again.',
  
  // Wallet errors
  'WALLET_NOT_CONNECTED': 'Wallet not connected. Please connect your wallet.',
  'WALLET_LOCKED': 'Wallet is locked. Please unlock your wallet.',
  'WALLET_REJECTED': 'Transaction rejected by wallet.',
  'UNSUPPORTED_WALLET': 'Unsupported wallet type.',
  
  // API errors
  'UNAUTHORIZED': 'Unauthorized. Please check your API key.',
  'FORBIDDEN': 'Access forbidden. Insufficient permissions.',
  'NOT_FOUND': 'Resource not found.',
  'RATE_LIMITED': 'Too many requests. Please try again later.',
  'SERVER_ERROR': 'Server error. Please try again later.',
  'VALIDATION_ERROR': 'Invalid data provided.',
  
  // Authentication errors
  'INVALID_API_KEY': 'Invalid API key. Please check your credentials.',
  'API_KEY_EXPIRED': 'API key has expired. Please generate a new key.',
  'PERMISSION_DENIED': 'Permission denied for this operation.',
  
  // Webhook errors
  'WEBHOOK_FAILED': 'Webhook delivery failed.',
  'INVALID_WEBHOOK_URL': 'Invalid webhook URL provided.',
  'WEBHOOK_TIMEOUT': 'Webhook delivery timed out.',
};

export class PaymentErrorHandler {
  private toast: ReturnType<typeof useToast>['toast'];
  private enableAnalytics: boolean;

  constructor(toast: ReturnType<typeof useToast>['toast'], enableAnalytics = true) {
    this.toast = toast;
    this.enableAnalytics = enableAnalytics;
  }

  /**
   * Handle payment errors with user-friendly messages and analytics
   */
  handlePaymentError(error: any, paymentId?: string, context?: string): PaymentError {
    const paymentError = this.parseError(error, paymentId);
    
    // Show user-friendly toast notification
    this.showErrorToast(paymentError, context);
    
    // Log error for debugging
    this.logError(paymentError, context);
    
    // Track error analytics
    if (this.enableAnalytics) {
      this.trackErrorAnalytics(paymentError);
    }
    
    return paymentError;
  }

  /**
   * Parse error from various sources (API, SDK, network, etc.)
   */
  private parseError(error: any, paymentId?: string): PaymentError {
    let code = 'UNKNOWN_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = null;

    if (error?.response?.data) {
      // API error response
      code = error.response.data.code || error.response.data.error_code || `HTTP_${error.response.status}`;
      message = error.response.data.message || error.response.data.error || message;
      details = error.response.data.details;
    } else if (error?.code) {
      // Structured error with code
      code = error.code;
      message = error.message || message;
      details = error.details;
    } else if (error?.message) {
      // Basic error with message
      message = error.message;
      
      // Try to infer code from message
      if (message.includes('network') || message.includes('fetch')) {
        code = 'NETWORK_ERROR';
      } else if (message.includes('timeout')) {
        code = 'TIMEOUT_ERROR';
      } else if (message.includes('unauthorized') || message.includes('401')) {
        code = 'UNAUTHORIZED';
      } else if (message.includes('forbidden') || message.includes('403')) {
        code = 'FORBIDDEN';
      } else if (message.includes('not found') || message.includes('404')) {
        code = 'NOT_FOUND';
      } else if (message.includes('rate limit') || message.includes('429')) {
        code = 'RATE_LIMITED';
      } else if (message.includes('500') || message.includes('server')) {
        code = 'SERVER_ERROR';
      }
    }

    return {
      code,
      message: ERROR_MESSAGES[code] || message,
      details,
      paymentId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Show user-friendly error toast
   */
  private showErrorToast(error: PaymentError, context?: string): void {
    const title = this.getErrorTitle(error.code);
    const description = error.message;

    this.toast({
      title,
      description: context ? `${context}: ${description}` : description,
      variant: 'destructive',
      duration: error.code === 'RATE_LIMITED' ? 10000 : 5000, // Show rate limit errors longer
    });
  }

  /**
   * Get appropriate error title based on error code
   */
  private getErrorTitle(code: string): string {
    if (code.startsWith('PAYMENT_')) return 'Payment Error';
    if (code.startsWith('WALLET_')) return 'Wallet Error';
    if (code.startsWith('BLOCKCHAIN_')) return 'Blockchain Error';
    if (code.startsWith('WEBHOOK_')) return 'Webhook Error';
    if (code.includes('UNAUTHORIZED') || code.includes('FORBIDDEN')) return 'Authentication Error';
    if (code.includes('NETWORK') || code.includes('CONNECTION')) return 'Connection Error';
    if (code.includes('RATE_LIMITED')) return 'Rate Limit Exceeded';
    if (code.includes('SERVER')) return 'Server Error';
    
    return 'Error';
  }

  /**
   * Log error for debugging
   */
  private logError(error: PaymentError, context?: string): void {
    console.error('Payment Error:', {
      code: error.code,
      message: error.message,
      paymentId: error.paymentId,
      context,
      details: error.details,
      timestamp: error.timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }

  /**
   * Track error analytics (integrate with your analytics service)
   */
  private trackErrorAnalytics(error: PaymentError): void {
    try {
      // Google Analytics 4 example
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'payment_error', {
          error_code: error.code,
          payment_id: error.paymentId,
          error_message: error.message,
          timestamp: error.timestamp,
        });
      }

      // Custom analytics service example
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('Payment Error', {
          errorCode: error.code,
          paymentId: error.paymentId,
          errorMessage: error.message,
          timestamp: error.timestamp,
        });
      }
    } catch (analyticsError) {
      console.warn('Failed to track error analytics:', analyticsError);
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: PaymentError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'CONNECTION_FAILED',
      'SERVER_ERROR',
      'BLOCKCHAIN_ERROR',
      'CONFIRMATION_TIMEOUT',
    ];
    
    return retryableCodes.includes(error.code);
  }

  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(error: PaymentError, attempt: number): number {
    if (error.code === 'RATE_LIMITED') {
      // Extract retry-after from error details if available
      const retryAfter = error.details?.retryAfter || 60;
      return retryAfter * 1000; // Convert to milliseconds
    }
    
    // Exponential backoff for other errors
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  }
}

/**
 * React hook for payment error handling
 */
export const usePaymentErrorHandler = (enableAnalytics = true) => {
  const { toast } = useToast();
  const errorHandler = new PaymentErrorHandler(toast, enableAnalytics);

  const handleError = (error: any, paymentId?: string, context?: string) => {
    return errorHandler.handlePaymentError(error, paymentId, context);
  };

  const isRetryable = (error: PaymentError) => {
    return PaymentErrorHandler.isRetryableError(error);
  };

  const getRetryDelay = (error: PaymentError, attempt: number) => {
    return PaymentErrorHandler.getRetryDelay(error, attempt);
  };

  return {
    handleError,
    isRetryable,
    getRetryDelay,
  };
};

/**
 * Utility function for handling API errors in try-catch blocks
 */
export const handleApiError = (error: any, toast: ReturnType<typeof useToast>['toast'], context?: string) => {
  const errorHandler = new PaymentErrorHandler(toast);
  return errorHandler.handlePaymentError(error, undefined, context);
};
