import crypto from 'crypto';
import { WebhookEvent } from './types';

export class WebhookUtils {
  /**
   * Verify webhook signature
   */
  static verifySignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): boolean {
    try {
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      const expectedSignature = `sha256=${computedSignature}`;
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse webhook payload safely
   */
  static parseEvent(payload: string): WebhookEvent {
    try {
      return JSON.parse(payload) as WebhookEvent;
    } catch (error) {
      throw new Error('Invalid webhook payload: not valid JSON');
    }
  }

  /**
   * Verify and parse webhook event
   */
  static verifyAndParseEvent(
    payload: string,
    signature: string,
    secret: string
  ): WebhookEvent {
    if (!this.verifySignature(payload, signature, secret)) {
      throw new Error('Invalid webhook signature');
    }
    
    return this.parseEvent(payload);
  }
}
