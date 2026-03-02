import { PaymentsAPI } from './payments';
import { MerchantAPI } from './merchant';
import { WebhookAPI } from './webhook-api';
import { APIKeyAPI } from './api-key';
import { WebhookUtils } from './webhooks';
import { SDKOptions } from './types';

export class SBTCGateway {
  public payments: PaymentsAPI;
  public merchant: MerchantAPI;
  public webhooks: WebhookAPI;
  public apiKeys: APIKeyAPI;
  public webhookUtils = WebhookUtils;

  constructor(apiKey: string, options: Partial<SDKOptions> = {}) {
    const sdkOptions: SDKOptions = {
      apiKey,
      baseURL: options.baseURL || 'https://api.sbtc-gateway.com',
      timeout: options.timeout || 30000,
      retries: options.retries || 3
    };

    this.payments = new PaymentsAPI(sdkOptions);
    this.merchant = new MerchantAPI(sdkOptions);
    this.webhooks = new WebhookAPI(sdkOptions);
    this.apiKeys = new APIKeyAPI(sdkOptions);
  }
}

// Export types and utilities
export * from './types';
export * from './webhook-api';
export * from './api-key';
export * from './utils';
export { SBTCGatewayError } from './base';
export { WebhookUtils } from './webhooks';

// Default export
export default SBTCGateway;
