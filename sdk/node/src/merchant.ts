import { BaseAPI } from './base';
import { MerchantResponse, Merchant } from './types';

export class MerchantAPI extends BaseAPI {
  /**
   * Get current merchant information
   */
  async getCurrent(): Promise<Merchant> {
    const response = await this.makeRequest<MerchantResponse>({
      method: 'GET',
      url: '/api/auth/me'
    });
    
    return response.merchant;
  }

  /**
   * Update merchant information
   */
  async update(data: {
    name?: string;
    businessType?: string;
    website?: string;
    stacksAddress?: string;
    bitcoinAddress?: string;
  }): Promise<Merchant> {
    const response = await this.makeRequest<MerchantResponse>({
      method: 'PATCH',
      url: '/api/auth/me',
      data
    });
    
    return response.merchant;
  }
}
