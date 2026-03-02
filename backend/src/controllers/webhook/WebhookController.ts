import { Request, Response } from 'express';
import { webhookService } from '@/services/webhook/webhook-service';
import { createLogger } from '@/utils/logger';

const logger = createLogger('WebhookController');

export class WebhookController {
  /**
   * Create a new webhook endpoint
   */
  async createWebhook(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const { url, events, secret } = req.body;

      if (!url || !events || !Array.isArray(events)) {
        res.status(400).json({
          success: false,
          error: 'URL and events array are required'
        });
        return;
      }

      const webhook = await webhookService.createWebhook(merchantId, {
        url,
        events,
        secret
      });

      logger.info('Webhook created', {
        merchantId,
        webhookId: webhook.id,
        url,
        events
      });

      res.status(201).json({
        success: true,
        data: webhook
      });
    } catch (error: any) {
      logger.error('Create webhook error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create webhook'
      });
    }
  }

  /**
   * List merchant webhooks
   */
  async listWebhooks(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const webhooks = await webhookService.getWebhooksByMerchant(merchantId);

      // Transform to match frontend expectations
      const response = {
        webhooks: webhooks.map(webhook => ({
          id: (webhook as any)._id.toString(),
          merchantId: webhook.merchantId,
          url: webhook.url,
          description: '', // Add if you have this field
          events: webhook.events,
          status: webhook.enabled ? 'active' as const : 'inactive' as const,
          secret: webhook.secret || '',
          lastDelivery: webhook.lastDeliveryAt?.toISOString(),
          successRate: webhook.deliveryStats?.total > 0 
            ? Math.round((webhook.deliveryStats.successful / webhook.deliveryStats.total) * 100)
            : 0,
          createdAt: webhook.createdAt.toISOString(),
          updatedAt: webhook.updatedAt.toISOString()
        })),
        pagination: {
          page: 1,
          limit: 50,
          total: webhooks.length,
          totalPages: 1
        }
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error: any) {
      logger.error('List webhooks error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch webhooks'
      });
    }
  }

  /**
   * Get webhook details
   */
  async getWebhook(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const webhookId = req.params.id;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const webhook = await webhookService.getWebhook(webhookId, merchantId);

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found'
        });
        return;
      }

      res.json({
        success: true,
        data: webhook
      });
    } catch (error: any) {
      logger.error('Get webhook error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch webhook'
      });
    }
  }

  /**
   * Update webhook
   */
  async updateWebhook(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const webhookId = req.params.id;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const updates = req.body;
      const webhook = await webhookService.updateWebhook(webhookId, merchantId, updates);

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found'
        });
        return;
      }

      logger.info('Webhook updated', {
        merchantId,
        webhookId,
        updates
      });

      res.json({
        success: true,
        data: webhook
      });
    } catch (error: any) {
      logger.error('Update webhook error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update webhook'
      });
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const webhookId = req.params.id;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      await webhookService.deleteWebhook(webhookId, merchantId);

      logger.info('Webhook deleted', {
        merchantId,
        webhookId
      });

      res.json({
        success: true,
        message: 'Webhook deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete webhook error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete webhook'
      });
    }
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const webhookId = req.params.id;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const testResult = await webhookService.testWebhook(webhookId, merchantId);

      res.json({
        success: true,
        data: testResult
      });
    } catch (error: any) {
      logger.error('Test webhook error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to test webhook'
      });
    }
  }

  /**
   * Retry failed webhook deliveries
   */
  async retryWebhook(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const webhookId = req.params.id;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const retryResult = await webhookService.retryFailedWebhooks(webhookId, merchantId);

      res.json({
        success: true,
        data: retryResult
      });
    } catch (error: any) {
      logger.error('Retry webhook error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retry webhook'
      });
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const webhookId = req.params.id; // Optional - if provided, get stats for specific webhook

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const stats = await webhookService.getWebhookStats(merchantId, webhookId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Get webhook stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch webhook statistics'
      });
    }
  }

  /**
   * Get all webhook events for merchant - PRODUCTION VERSION
   */
  async getAllWebhookEvents(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const {
        page = 1,
        limit = 20,
        status,
        eventType,
        startDate,
        endDate,
        webhookId
      } = req.query;

      const events = await webhookService.getWebhookEvents(merchantId, {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        eventType: eventType as string,
        startDate: startDate as string,
        endDate: endDate as string,
        webhookId: webhookId as string
      });

      res.json({
        success: true,
        data: events
      });
    } catch (error: any) {
      logger.error('Get all webhook events error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch webhook events'
      });
    }
  }

  /**
   * Get specific webhook event details
   */
  async getWebhookEvent(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const eventId = req.params.id;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const event = await webhookService.getWebhookEvent(eventId, merchantId);

      if (!event) {
        res.status(404).json({
          success: false,
          error: 'Webhook event not found'
        });
        return;
      }

      res.json({
        success: true,
        data: event
      });
    } catch (error: any) {
      logger.error('Get webhook event error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch webhook event'
      });
    }
  }

  /**
   * Retry specific webhook event
   */
  async retryWebhookEvent(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const eventId = req.params.id;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const retryResult = await webhookService.retryWebhookEvent(eventId, merchantId);

      res.json({
        success: true,
        data: retryResult
      });
    } catch (error: any) {
      logger.error('Retry webhook event error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retry webhook event'
      });
    }
  }
}

export const webhookController = new WebhookController();