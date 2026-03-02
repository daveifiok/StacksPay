import { BaseAPI } from './base';
import { 
  PaymentRequest, 
  PaymentResponse, 
  PaymentListResponse, 
  Payment 
} from './types';

export class PaymentsAPI extends BaseAPI {
  /**
   * Create a new payment
   */
  async create(paymentData: PaymentRequest): Promise<Payment> {
    const response = await this.makeRequest<PaymentResponse>({
      method: 'POST',
      url: '/api/v1/payments',
      data: paymentData
    });
    
    return response.payment;
  }

  /**
   * Retrieve a payment by ID
   */
  async retrieve(paymentId: string): Promise<Payment> {
    const response = await this.makeRequest<PaymentResponse>({
      method: 'GET',
      url: `/api/v1/payments/${paymentId}`
    });
    
    return response.payment;
  }

  /**
   * List all payments with pagination
   */
  async list(options: {
    page?: number;
    limit?: number;
    status?: string;
    customer_email?: string;
  } = {}): Promise<{ payments: Payment[]; pagination: any }> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status) params.append('status', options.status);
    if (options.customer_email) params.append('customer_email', options.customer_email);

    const response = await this.makeRequest<PaymentListResponse>({
      method: 'GET',
      url: `/api/v1/payments?${params.toString()}`
    });
    
    return {
      payments: response.payments,
      pagination: response.pagination
    };
  }

  /**
   * Cancel a pending payment
   */
  async cancel(paymentId: string): Promise<Payment> {
    const response = await this.makeRequest<PaymentResponse>({
      method: 'POST',
      url: `/api/v1/payments/${paymentId}/cancel`
    });
    
    return response.payment;
  }

  /**
   * Refund a completed payment (if supported)
   */
  async refund(paymentId: string, amount?: number): Promise<Payment> {
    const data: any = {};
    if (amount) data.amount = amount;

    const response = await this.makeRequest<PaymentResponse>({
      method: 'POST',
      url: `/api/v1/payments/${paymentId}/refund`,
      data
    });
    
    return response.payment;
  }
}
