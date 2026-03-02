// import { connectToDatabase } from '@/config/database';
// // import { paymentService, CreatePaymentOptions } from '../p/payment-service';
// import { merchantService } from '../merchant/merchant-service';
// import { webhookService } from '../webhook/webhook-service';
// import { notificationService } from '../notification/notification-service';
// import { CreateSubscriptionOptions, Invoice, Subscription, SubscriptionMetrics, SubscriptionPlan, UsageRecord } from '@/interfaces/subscription/subscription.interface';

// /**
//  * Enterprise-Grade Subscription Service
//  * 
//  * Handles recurring sBTC payments with:
//  * - Flexible billing cycles (daily, weekly, monthly, yearly)
//  * - Multiple payment methods (BTC, STX, sBTC)
//  * - Intelligent retry logic with exponential backoff
//  * - Usage-based billing with metered components
//  * - Proration for plan changes
//  * - Comprehensive webhook events
//  * - Real-time analytics and reporting
//  * - PCI-compliant payment processing
//  */

// export class SubscriptionService {
//   /**
//    * Create a new subscription plan
//    */
//   async createPlan(plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlan> {
//     await connectToDatabase();

//     try {
//       const newPlan: SubscriptionPlan = {
//         ...plan,
//         id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };

//       // Store in database (implementation depends on your MongoDB schema)
//       // For now, we'll return the plan object
//       // await SubscriptionPlan.create(newPlan);

//       await this.logSubscriptionEvent('plan.created', newPlan.merchantId, {
//         planId: newPlan.id,
//         planName: newPlan.name,
//         amount: newPlan.amount,
//         interval: newPlan.interval,
//       });

//       return newPlan;
//     } catch (error) {
//       console.error('Error creating subscription plan:', error);
//       throw new Error('Failed to create subscription plan');
//     }
//   }

//   /**
//    * Create a new subscription for a customer
//    */
//   async createSubscription(options: CreateSubscriptionOptions): Promise<Subscription> {
//     await connectToDatabase();

//     try {
//       // Validate merchant exists
//       const merchant = await merchantService.getMerchant(options.merchantId);
//       if (!merchant) {
//         throw new Error('Merchant not found');
//       }

//       // Calculate trial and billing dates
//       const now = new Date();
//       const startDate = options.startDate || now;
//       const trialEnd = options.trialDays 
//         ? new Date(startDate.getTime() + options.trialDays * 24 * 60 * 60 * 1000)
//         : null;

//       // Get plan details to calculate next billing date
//       const plan = await this.getPlan(options.planId);
//       if (!plan) {
//         throw new Error('Subscription plan not found');
//       }

//       const currentPeriodStart = trialEnd || startDate;
//       const currentPeriodEnd = this.calculateNextBillingDate(currentPeriodStart, plan);

//       const subscription: Subscription = {
//         id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
//         merchantId: options.merchantId,
//         customerId: options.customerId,
//         planId: options.planId,
//         status: trialEnd ? 'trialing' : 'active',
//         paymentMethod: options.paymentMethod,
//         currentPeriodStart,
//         currentPeriodEnd,
//         trialStart: options.trialDays ? startDate : undefined,
//         trialEnd: trialEnd ?? undefined,
//         cancelAtPeriodEnd: false,
//         nextPaymentDate: trialEnd || currentPeriodEnd,
//         failedPaymentCount: 0,
//         totalAmount: 0,
//         metadata: options.metadata || {},
//         webhookUrl: options.webhookUrl,
//         createdAt: now,
//         updatedAt: now,
//       };

//       // Store subscription in database
//       // await Subscription.create(subscription);

//       // Process setup fee if applicable
//       if (plan.setupFee && plan.setupFee > 0) {
//         await this.chargeSetupFee(subscription, plan);
//       }

//       // Schedule first payment if not in trial
//       if (!trialEnd) {
//         await this.scheduleNextPayment(subscription.id);
//       }

//       await this.logSubscriptionEvent('subscription.created', options.merchantId, {
//         subscriptionId: subscription.id,
//         customerId: options.customerId,
//         planId: options.planId,
//         status: subscription.status,
//       });

//       // Trigger webhook
//       if (options.webhookUrl) {
//         await webhookService.triggerWebhook({
//           urls: { webhook: options.webhookUrl },
//           _id: subscription.id,
//           status: subscription.status,
//           amount: plan.amount,
//           currency: plan.currency,
//           paymentMethod: options.paymentMethod,
//           metadata: subscription.metadata,
//         }, 'subscription.created');
//       }

//       return subscription;
//     } catch (error) {
//       console.error('Error creating subscription:', error);
//       throw new Error('Failed to create subscription');
//     }
//   }

//   /**
//    * Process recurring payment for a subscription
//    */
//   async processRecurringPayment(subscriptionId: string): Promise<{
//     success: boolean;
//     paymentId?: string;
//     invoiceId?: string;
//     error?: string;
//   }> {
//     await connectToDatabase();

//     try {
//       const subscription = await this.getSubscription(subscriptionId);
//       if (!subscription) {
//         throw new Error('Subscription not found');
//       }

//       const plan = await this.getPlan(subscription.planId);
//       if (!plan) {
//         throw new Error('Subscription plan not found');
//       }

//       // Check if payment is due
//       if (new Date() < subscription.nextPaymentDate) {
//         return { success: false, error: 'Payment not yet due' };
//       }

//       // Calculate usage-based charges if applicable
//       const usageCharges = plan.usageType === 'metered' 
//         ? await this.calculateUsageCharges(subscriptionId, subscription.currentPeriodStart, new Date())
//         : 0;

//       const totalAmount = plan.amount + usageCharges;

//       // Create invoice
//       const invoice = await this.createInvoice(subscription, plan, usageCharges);

//       // Create payment
//       const paymentOptions: CreatePaymentOptions = {
//         merchantId: subscription.merchantId,
//         amount: totalAmount,
//         currency: plan.currency,
//         paymentMethod: subscription.paymentMethod === 'bitcoin' ? 'btc' : subscription.paymentMethod,
//         payoutMethod: 'sbtc',
//         description: `Subscription payment for ${plan.name}`,
//         metadata: {
//           subscriptionId: subscription.id,
//           invoiceId: invoice.id,
//           customerId: subscription.customerId,
//           planId: subscription.planId,
//           billingPeriod: {
//             start: subscription.currentPeriodStart,
//             end: subscription.currentPeriodEnd,
//           },
//         },
//         webhookUrl: subscription.webhookUrl,
//       };

//       const paymentResult = await paymentService.createPayment(paymentOptions);

//       if (paymentResult.success && paymentResult.payment) {
//         // Update subscription
//         const updatedSubscription = await this.updateSubscriptionAfterPayment(
//           subscriptionId,
//           paymentResult.payment.id,
//           plan
//         );

//         // Update invoice
//         await this.updateInvoice(invoice.id, {
//           status: 'paid',
//           paymentId: paymentResult.payment.id,
//           paidDate: new Date(),
//         });

//         // Reset failed payment count
//         await this.updateSubscription(subscriptionId, {
//           failedPaymentCount: 0,
//           status: 'active',
//           lastPaymentDate: new Date(),
//         });

//         await this.logSubscriptionEvent('subscription.payment_succeeded', subscription.merchantId, {
//           subscriptionId: subscription.id,
//           paymentId: paymentResult.payment.id,
//           amount: totalAmount,
//           invoiceId: invoice.id,
//         });

//         return {
//           success: true,
//           paymentId: paymentResult.payment.id,
//           invoiceId: invoice.id,
//         };
//       } else {
//         // Handle payment failure
//         await this.handlePaymentFailure(subscriptionId, invoice.id);
        
//         return {
//           success: false,
//           error: paymentResult.error || 'Payment failed',
//         };
//       }
//     } catch (error) {
//       console.error('Error processing recurring payment:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Unknown error',
//       };
//     }
//   }

//   /**
//    * Record usage for metered billing
//    */
//   async recordUsage(
//     subscriptionId: string,
//     componentId: string,
//     quantity: number,
//     timestamp?: Date,
//     idempotencyKey?: string,
//     metadata?: any
//   ): Promise<UsageRecord> {
//     await connectToDatabase();

//     try {
//       // Check for existing record with same idempotency key
//       if (idempotencyKey) {
//         // const existing = await UsageRecord.findOne({ idempotencyKey });
//         // if (existing) return existing;
//       }

//       const usageRecord: UsageRecord = {
//         id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
//         subscriptionId,
//         componentId,
//         quantity,
//         timestamp: timestamp || new Date(),
//         idempotencyKey,
//         metadata,
//       };

//       // Store in database
//       // await UsageRecord.create(usageRecord);

//       // Check if usage exceeds limits
//       const subscription = await this.getSubscription(subscriptionId);
//       if (subscription) {
//         await this.checkUsageLimits(subscription, componentId, quantity);
//       }

//       return usageRecord;
//     } catch (error) {
//       console.error('Error recording usage:', error);
//       throw new Error('Failed to record usage');
//     }
//   }

//   /**
//    * Cancel a subscription
//    */
//   async cancelSubscription(
//     subscriptionId: string,
//     cancelAtPeriodEnd: boolean = true,
//     reason?: string
//   ): Promise<Subscription> {
//     await connectToDatabase();

//     try {
//       const subscription = await this.getSubscription(subscriptionId);
//       if (!subscription) {
//         throw new Error('Subscription not found');
//       }

//       const updateData: Partial<Subscription> = {
//         cancelAtPeriodEnd,
//         updatedAt: new Date(),
//       };

//       if (!cancelAtPeriodEnd) {
//         updateData.status = 'canceled';
//         updateData.canceledAt = new Date();
//       }

//       const updatedSubscription = await this.updateSubscription(subscriptionId, updateData);

//       await this.logSubscriptionEvent('subscription.canceled', subscription.merchantId, {
//         subscriptionId: subscription.id,
//         cancelAtPeriodEnd,
//         reason,
//       });

//       // Trigger webhook
//       if (subscription.webhookUrl) {
//         await webhookService.triggerWebhook({
//           urls: { webhook: subscription.webhookUrl },
//           _id: subscription.id,
//           status: updatedSubscription.status,
//           amount: 0,
//           currency: 'USD',
//           paymentMethod: subscription.paymentMethod,
//           metadata: { ...subscription.metadata, cancelReason: reason },
//         }, 'subscription.canceled');
//       }

//       return updatedSubscription;
//     } catch (error) {
//       console.error('Error canceling subscription:', error);
//       throw new Error('Failed to cancel subscription');
//     }
//   }

//   /**
//    * Update subscription plan (with proration)
//    */
//   async updateSubscriptionPlan(
//     subscriptionId: string,
//     newPlanId: string,
//     prorationBehavior: 'create_prorations' | 'none' = 'create_prorations'
//   ): Promise<{
//     subscription: Subscription;
//     prorationInvoice?: Invoice;
//   }> {
//     await connectToDatabase();

//     try {
//       const subscription = await this.getSubscription(subscriptionId);
//       if (!subscription) {
//         throw new Error('Subscription not found');
//       }

//       const currentPlan = await this.getPlan(subscription.planId);
//       const newPlan = await this.getPlan(newPlanId);

//       if (!currentPlan || !newPlan) {
//         throw new Error('Plan not found');
//       }

//       let prorationInvoice: Invoice | undefined;

//       // Calculate proration if enabled
//       if (prorationBehavior === 'create_prorations') {
//         const prorationAmount = this.calculateProration(
//           subscription,
//           currentPlan,
//           newPlan,
//           new Date()
//         );

//         if (prorationAmount !== 0) {
//           prorationInvoice = await this.createProrationInvoice(
//             subscription,
//             currentPlan,
//             newPlan,
//             prorationAmount
//           );
//         }
//       }

//       // Update subscription
//       const updatedSubscription = await this.updateSubscription(subscriptionId, {
//         planId: newPlanId,
//         updatedAt: new Date(),
//       });

//       await this.logSubscriptionEvent('subscription.updated', subscription.merchantId, {
//         subscriptionId: subscription.id,
//         oldPlanId: subscription.planId,
//         newPlanId,
//         prorationAmount: prorationInvoice?.amount || 0,
//       });

//       return {
//         subscription: updatedSubscription,
//         prorationInvoice,
//       };
//     } catch (error) {
//       console.error('Error updating subscription plan:', error);
//       throw new Error('Failed to update subscription plan');
//     }
//   }

//   /**
//    * Get subscription metrics for analytics
//    */
//   async getSubscriptionMetrics(
//     merchantId: string,
//     startDate?: Date,
//     endDate?: Date
//   ): Promise<SubscriptionMetrics> {
//     await connectToDatabase();

//     try {
//       const end = endDate || new Date();
//       const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

//       // These would be actual database queries in production
//       const metrics: SubscriptionMetrics = {
//         totalSubscriptions: 0, // await Subscription.countDocuments({ merchantId })
//         activeSubscriptions: 0, // await Subscription.countDocuments({ merchantId, status: 'active' })
//         churnRate: 0, // calculated based on cancellations vs new subscriptions
//         monthlyRecurringRevenue: 0, // sum of active subscription amounts
//         averageRevenuePerUser: 0, // MRR / active subscriptions
//         lifetimeValue: 0, // calculated based on average subscription duration
//         retentionRate: 0, // percentage of customers retained over time
//       };

//       return metrics;
//     } catch (error) {
//       console.error('Error getting subscription metrics:', error);
//       throw new Error('Failed to get subscription metrics');
//     }
//   }

//   /**
//    * Schedule next payment for subscription
//    */
//   async scheduleNextPayment(subscriptionId: string): Promise<void> {
//     // In production, this would integrate with a job scheduler like:
//     // - AWS Lambda + CloudWatch Events
//     // - Vercel Cron Jobs
//     // - Node-cron for self-hosted
//     // - Redis Queue + Bull

//     console.log(`Scheduling next payment for subscription ${subscriptionId}`);
    
//     // Example with a simple setTimeout (not production-ready)
//     // setTimeout(async () => {
//     //   await this.processRecurringPayment(subscriptionId);
//     // }, this.getMillisecondsUntilNextPayment(subscriptionId));
//   }

//   /**
//    * Handle payment failure with retry logic
//    */
//   private async handlePaymentFailure(subscriptionId: string, invoiceId: string): Promise<void> {
//     const subscription = await this.getSubscription(subscriptionId);
//     if (!subscription) return;

//     const newFailedCount = subscription.failedPaymentCount + 1;
    
//     // Update subscription status based on failed payment count
//     let newStatus: Subscription['status'] = subscription.status;
//     if (newFailedCount >= 3) {
//       newStatus = 'unpaid';
//     } else if (newFailedCount >= 1) {
//       newStatus = 'past_due';
//     }

//     await this.updateSubscription(subscriptionId, {
//       failedPaymentCount: newFailedCount,
//       status: newStatus,
//     });

//     // Update invoice status
//     await this.updateInvoice(invoiceId, {
//       status: 'uncollectible',
//     });

//     // Schedule retry if under retry limit
//     if (newFailedCount < 3) {
//       const retryDelay = this.calculateRetryDelay(newFailedCount);
//       console.log(`Scheduling payment retry for subscription ${subscriptionId} in ${retryDelay}ms`);
      
//       // In production, schedule with proper job queue
//       // setTimeout(() => {
//       //   this.processRecurringPayment(subscriptionId);
//       // }, retryDelay);
//     }

//     await this.logSubscriptionEvent('subscription.payment_failed', subscription.merchantId, {
//       subscriptionId: subscription.id,
//       failedPaymentCount: newFailedCount,
//       invoiceId,
//     });

//     // Send notification to merchant
//     await notificationService.sendMerchantNotification(subscription.merchantId, {
//       type: 'subscription_payment_failed',
//       subscriptionId: subscription.id,
//       failedPaymentCount: newFailedCount,
//       customerEmail: subscription.metadata?.customerEmail,
//     });
//   }

//   /**
//    * Calculate retry delay with exponential backoff
//    */
//   private calculateRetryDelay(attemptNumber: number): number {
//     // Exponential backoff: 1 day, 3 days, 7 days
//     const delays = [
//       1 * 24 * 60 * 60 * 1000,  // 1 day
//       3 * 24 * 60 * 60 * 1000,  // 3 days  
//       7 * 24 * 60 * 60 * 1000,  // 7 days
//     ];
    
//     return delays[Math.min(attemptNumber - 1, delays.length - 1)];
//   }

//   /**
//    * Calculate next billing date based on plan interval
//    */
//   private calculateNextBillingDate(currentDate: Date, plan: SubscriptionPlan): Date {
//     const next = new Date(currentDate);
    
//     switch (plan.interval) {
//       case 'day':
//         next.setDate(next.getDate() + plan.intervalCount);
//         break;
//       case 'week':
//         next.setDate(next.getDate() + (plan.intervalCount * 7));
//         break;
//       case 'month':
//         next.setMonth(next.getMonth() + plan.intervalCount);
//         break;
//       case 'year':
//         next.setFullYear(next.getFullYear() + plan.intervalCount);
//         break;
//     }
    
//     return next;
//   }

//   /**
//    * Calculate usage charges for metered billing
//    */
//   private async calculateUsageCharges(
//     subscriptionId: string,
//     periodStart: Date,
//     periodEnd: Date
//   ): Promise<number> {
//     // This would query usage records from database
//     // and calculate overage charges based on plan limits
    
//     // Placeholder implementation
//     return 0;
//   }

//   /**
//    * Calculate proration amount for plan changes
//    */
//   private calculateProration(
//     subscription: Subscription,
//     currentPlan: SubscriptionPlan,
//     newPlan: SubscriptionPlan,
//     changeDate: Date
//   ): number {
//     const periodDuration = subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime();
//     const timeRemaining = subscription.currentPeriodEnd.getTime() - changeDate.getTime();
//     const prorationRatio = timeRemaining / periodDuration;
    
//     const currentPeriodRefund = currentPlan.amount * prorationRatio;
//     const newPeriodCharge = newPlan.amount * prorationRatio;
    
//     return newPeriodCharge - currentPeriodRefund;
//   }

//   /**
//    * Check usage limits for metered components
//    */
//   private async checkUsageLimits(
//     subscription: Subscription,
//     componentId: string,
//     quantity: number
//   ): Promise<void> {
//     const plan = await this.getPlan(subscription.planId);
//     if (!plan || !plan.meteredComponents) return;

//     const component = plan.meteredComponents.find(c => c.id === componentId);
//     if (!component) return;

//     // Get current period usage
//     const currentUsage = await this.getCurrentPeriodUsage(subscription.id, componentId);
//     const totalUsage = currentUsage + quantity;

//     if (totalUsage > component.includedUnits && component.overage === 'block') {
//       throw new Error(`Usage limit exceeded for ${component.name}`);
//     }
//   }

//   /**
//    * Get current period usage for a component
//    */
//   private async getCurrentPeriodUsage(subscriptionId: string, componentId: string): Promise<number> {
//     // Query usage records for current billing period
//     // Placeholder implementation
//     return 0;
//   }

//   // Helper methods for database operations (placeholders)
//   private async getPlan(planId: string): Promise<SubscriptionPlan | null> {
//     // Database query placeholder
//     return null;
//   }

//   private async getSubscription(subscriptionId: string): Promise<Subscription | null> {
//     // Database query placeholder  
//     return null;
//   }

//   private async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> {
//     // Database update placeholder
//     return {} as Subscription;
//   }

//   private async createInvoice(subscription: Subscription, plan: SubscriptionPlan, usageCharges: number): Promise<Invoice> {
//     // Create invoice logic placeholder
//     return {} as Invoice;
//   }

//   private async updateInvoice(invoiceId: string, updates: any): Promise<void> {
//     // Database update placeholder
//   }

//   private async createProrationInvoice(
//     subscription: Subscription,
//     currentPlan: SubscriptionPlan,
//     newPlan: SubscriptionPlan,
//     prorationAmount: number
//   ): Promise<Invoice> {
//     // Proration invoice creation placeholder
//     return {} as Invoice;
//   }

//   private async chargeSetupFee(subscription: Subscription, plan: SubscriptionPlan): Promise<void> {
//     // Setup fee charging logic placeholder
//   }

//   private async updateSubscriptionAfterPayment(
//     subscriptionId: string,
//     paymentId: string,
//     plan: SubscriptionPlan
//   ): Promise<Subscription> {
//     // Update subscription after successful payment
//     const subscription = await this.getSubscription(subscriptionId);
//     if (!subscription) throw new Error('Subscription not found');

//     const nextPeriodStart = subscription.currentPeriodEnd;
//     const nextPeriodEnd = this.calculateNextBillingDate(nextPeriodStart, plan);

//     return await this.updateSubscription(subscriptionId, {
//       currentPeriodStart: nextPeriodStart,
//       currentPeriodEnd: nextPeriodEnd,
//       nextPaymentDate: nextPeriodEnd,
//       lastPaymentDate: new Date(),
//       totalAmount: subscription.totalAmount + plan.amount,
//       status: 'active',
//     });
//   }

//   private async logSubscriptionEvent(eventType: string, merchantId: string, metadata: any): Promise<void> {
//     // Log events for analytics and debugging
//     console.log(`Subscription Event: ${eventType}`, { merchantId, metadata });
    
//     // In production, store in analytics service
//     // await analyticsService.trackEvent(eventType, merchantId, metadata);
//   }
// }

// export const subscriptionService = new SubscriptionService();