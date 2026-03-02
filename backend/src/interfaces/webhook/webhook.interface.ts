export interface WebhookPayload {
  event: string;
  payment: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    confirmedAt?: Date;
    metadata?: any;
  };
  timestamp: string;
}

export interface WebhookResponse {
  success: boolean;
  statusCode?: number;
  error?: string;
  retryAfter?: number;
}