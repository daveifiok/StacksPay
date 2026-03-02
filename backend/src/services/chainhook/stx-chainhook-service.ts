import { 
  ChainhookSTXTransferEvent, 
  ChainhookContractEvent,
  STXPaymentConfirmationData,
  ISTXPayment
} from '@/interfaces/payment/stx-payment.interface';
import { STXPayment } from '@/models/payment/STXPayment';
import { Merchant } from '@/models/merchant/Merchant';
import { stxContractService } from '@/services/contract/stx-contract-service';
import { webhookService } from '@/services/webhook/webhook-service';
import { createLogger } from '@/utils/logger';

const logger = createLogger('STXChainhookService');

/**
 * STX Chainhook Service - Processes blockchain events from Chainhook webhooks
 * 
 * This service is responsible for:
 * 1. Processing STX transfer events (when customers send STX to unique addresses)
 * 2. Processing contract events from our STX payment gateway contract
 * 3. Confirming payments with the contract when STX is received
 * 4. Triggering settlement processes when confirmations are complete
 * 5. Notifying merchants via webhooks about payment status changes
 * 
 * Chainhook Integration:
 * - Receives webhook POST requests from Chainhook when blockchain events occur
 * - Validates webhook signatures for security
 * - Processes events asynchronously to prevent blocking
 * - Handles both STX transfers and contract events
 */
export class STXChainhookService {
  private readonly CONFIRMATION_BLOCKS = 6; // Number of blocks for payment confirmation
  private readonly MIN_PAYMENT_AMOUNT = 1000; // Minimum 1000 microSTX (0.001 STX)

  /**
   * Process incoming Chainhook webhook for STX transfers
   * This is called when a customer sends STX to a unique address
   */
  async processSTXTransferEvent(event: ChainhookSTXTransferEvent): Promise<{
    success: boolean;
    processedTransfers: number;
    errors: string[];
  }> {
    logger.info('🔄 Processing STX transfer event from Chainhook', {
      blocksCount: event.apply.length
    });

    let processedTransfers = 0;
    const errors: string[] = [];

    try {
      for (const block of event.apply) {
        logger.info(`📦 Processing block ${block.block_identifier.index}`);

        for (const transaction of block.transactions) {
          for (const operation of transaction.operations) {
            if (operation.type === 'stx_transfer') {
              try {
                await this.processSTXTransferOperation(
                  transaction.transaction_identifier.hash,
                  operation.data,
                  block.block_identifier.index
                );
                processedTransfers++;
              } catch (error) {
                const errorMsg = `Failed to process STX transfer: ${error instanceof Error ? error.message : 'Unknown error'}`;
                logger.error('❌ Transfer processing error:', error);
                errors.push(errorMsg);
              }
            }
          }
        }
      }

      logger.info(`✅ STX transfer event processing complete`, {
        processedTransfers,
        errorCount: errors.length
      });

      return {
        success: true,
        processedTransfers,
        errors
      };

    } catch (error) {
      logger.error('❌ Critical error processing STX transfer event:', error);
      return {
        success: false,
        processedTransfers,
        errors: [...errors, error instanceof Error ? error.message : 'Critical processing error']
      };
    }
  }

  /**
   * Process individual STX transfer operation
   * This handles when STX is sent to a unique address for payment
   */
  private async processSTXTransferOperation(
    txId: string,
    transferData: {
      sender: string;
      recipient: string;
      amount: string;
      memo?: string;
    },
    blockHeight: number
  ): Promise<void> {
    try {
      const recipientAddress = transferData.recipient;
      const senderAddress = transferData.sender;
      const amount = parseInt(transferData.amount);

      logger.info(`💰 Processing STX transfer`, {
        txId,
        from: senderAddress,
        to: recipientAddress,
        amount,
        blockHeight
      });

      // Skip if amount is too small (likely spam or dust)
      if (amount < this.MIN_PAYMENT_AMOUNT) {
        logger.warn(`⚠️ Skipping small transfer: ${amount} microSTX (minimum: ${this.MIN_PAYMENT_AMOUNT})`);
        return;
      }

      // Find payment associated with this unique address
      const payment = await this.findPaymentByUniqueAddress(recipientAddress);
      
      if (!payment) {
        logger.warn(`⚠️ No payment found for address: ${recipientAddress}. Could be external transfer.`);
        return;
      }

      logger.info(`🎯 Found payment for transfer`, {
        paymentId: payment.paymentId,
        expectedAmount: payment.expectedAmount,
        receivedAmount: amount,
        status: payment.status
      });

      // Validate payment is in correct state
      if (payment.status !== 'pending') {
        logger.warn(`⚠️ Payment ${payment.paymentId} is not pending (status: ${payment.status})`);
        return;
      }

      // Check if payment has expired
      if (payment.expiresAt < new Date()) {
        logger.warn(`⚠️ Payment ${payment.paymentId} has expired`);
        await this.handleExpiredPayment(payment);
        return;
      }

      // Validate amount matches expected (with small tolerance for fees)
      const amountTolerance = 0.05; // 5% tolerance
      const minAcceptableAmount = payment.expectedAmount * (1 - amountTolerance);
      
      if (amount < minAcceptableAmount) {
        logger.warn(`⚠️ Received amount ${amount} is less than expected ${payment.expectedAmount} (min: ${minAcceptableAmount})`);
        // Could handle partial payments here if needed
        return;
      }

      // Process the payment confirmation
      const confirmationData: STXPaymentConfirmationData = {
        paymentId: payment.paymentId,
        receivedAmount: amount,
        senderAddress,
        txId,
        blockHeight,
        timestamp: new Date()
      };

      await this.confirmPaymentReceived(confirmationData);

    } catch (error) {
      logger.error('❌ Error processing STX transfer operation:', error);
      throw error;
    }
  }

  /**
   * Process incoming Chainhook webhook for contract events
   * This handles events emitted by our STX payment gateway contract
   */
  async processContractEvent(event: ChainhookContractEvent): Promise<{
    success: boolean;
    processedEvents: number;
    errors: string[];
  }> {
    logger.info('🔄 Processing contract event from Chainhook', {
      blocksCount: event.apply.length
    });

    let processedEvents = 0;
    const errors: string[] = [];

    try {
      const contractIdentifier = stxContractService.getContractIdentifier();

      for (const block of event.apply) {
        logger.info(`📦 Processing block ${block.block_identifier.index}`);

        for (const transaction of block.transactions) {
          for (const operation of transaction.operations) {
            if (operation.type === 'contract_event' && 
                operation.data.contract_identifier === contractIdentifier) {
              try {
                await this.processContractEventOperation(
                  transaction.transaction_identifier.hash,
                  operation.data,
                  block.block_identifier.index
                );
                processedEvents++;
              } catch (error) {
                const errorMsg = `Failed to process contract event: ${error instanceof Error ? error.message : 'Unknown error'}`;
                logger.error('❌ Contract event processing error:', error);
                errors.push(errorMsg);
              }
            }
          }
        }
      }

      logger.info(`✅ Contract event processing complete`, {
        processedEvents,
        errorCount: errors.length
      });

      return {
        success: true,
        processedEvents,
        errors
      };

    } catch (error) {
      logger.error('❌ Critical error processing contract event:', error);
      return {
        success: false,
        processedEvents,
        errors: [...errors, error instanceof Error ? error.message : 'Critical processing error']
      };
    }
  }

  /**
   * Process individual contract event operation
   */
  private async processContractEventOperation(
    txId: string,
    eventData: {
      contract_identifier: string;
      topic: string;
      value: any;
    },
    blockHeight: number
  ): Promise<void> {
    try {
      logger.info(`📋 Processing contract event`, {
        txId,
        topic: eventData.topic,
        contractId: eventData.contract_identifier,
        blockHeight
      });

      switch (eventData.topic) {
        case 'payment-registered':
          await this.handlePaymentRegisteredEvent(eventData.value, txId);
          break;
        
        case 'payment-confirmed':
          await this.handlePaymentConfirmedEvent(eventData.value, txId);
          break;
        
        case 'payment-settled':
          await this.handlePaymentSettledEvent(eventData.value, txId);
          break;
        
        default:
          logger.warn(`⚠️ Unknown contract event topic: ${eventData.topic}`);
      }

    } catch (error) {
      logger.error('❌ Error processing contract event operation:', error);
      throw error;
    }
  }

  /**
   * Confirm payment received and update contract
   */
  private async confirmPaymentReceived(confirmationData: STXPaymentConfirmationData): Promise<void> {
    try {
      logger.info(`🔄 Confirming payment received: ${confirmationData.paymentId}`);

      // Update payment status to confirmed
      await this.updatePaymentStatus(confirmationData.paymentId, 'confirmed', {
        receivedAmount: confirmationData.receivedAmount,
        receiveTxId: confirmationData.txId,
        confirmedAt: confirmationData.timestamp
      });

      // Call contract to confirm payment received
      const contractResult = await stxContractService.confirmSTXPaymentReceived(
        confirmationData.paymentId,
        confirmationData.receivedAmount,
        confirmationData.txId
      );

      if (!contractResult.success) {
        logger.error(`❌ Failed to confirm payment with contract:`, contractResult.error);
        throw new Error(`Contract confirmation failed: ${contractResult.error}`);
      }

      logger.info(`✅ Payment confirmed with contract. TxID: ${contractResult.txId}`);

      // Trigger merchant webhook notification
      await this.notifyMerchantPaymentConfirmed(confirmationData.paymentId);

      // Start settlement process after confirmation blocks
      setTimeout(async () => {
        try {
          await this.initiateSettlement(confirmationData.paymentId);
        } catch (error) {
          logger.error(`❌ Settlement initiation failed for ${confirmationData.paymentId}:`, error);
        }
      }, this.CONFIRMATION_BLOCKS * 10 * 60 * 1000); // Assuming 10 min block time

    } catch (error) {
      logger.error('❌ Error confirming payment received:', error);
      throw error;
    }
  }

  /**
   * Initiate settlement process for a confirmed payment
   */
  private async initiateSettlement(paymentId: string): Promise<void> {
    try {
      logger.info(`🔄 Initiating settlement for payment: ${paymentId}`);

      // Get current payment data
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new Error(`Payment ${paymentId} not found`);
      }

      if (payment.status !== 'confirmed') {
        logger.warn(`⚠️ Payment ${paymentId} is not confirmed (status: ${payment.status})`);
        return;
      }

      // Call contract to settle payment (calculates fees and prepares settlement)
      const settlementResult = await stxContractService.settleSTXPayment(paymentId);

      if (!settlementResult.success) {
        logger.error(`❌ Settlement contract call failed:`, settlementResult.error);
        throw new Error(`Contract settlement failed: ${settlementResult.error}`);
      }

      logger.info(`✅ Settlement initiated. Contract TxID: ${settlementResult.txId}`);

      // Execute actual STX transfer from unique address to merchant
      await this.executeSettlementTransfer(payment);

    } catch (error) {
      logger.error(`❌ Error initiating settlement for ${paymentId}:`, error);
      // Mark payment as failed
      await this.updatePaymentStatus(paymentId, 'failed', {
        errorMessage: error instanceof Error ? error.message : 'Settlement failed'
      });
    }
  }

  /**
   * Execute the actual STX transfer for settlement
   */
  private async executeSettlementTransfer(payment: ISTXPayment): Promise<void> {
    try {
      logger.info(`🔄 Executing settlement transfer for payment: ${payment.paymentId}`);

      if (!payment.receivedAmount || !payment.encryptedPrivateKey) {
        throw new Error('Missing required payment data for settlement');
      }

      // Get merchant address (in production, this would come from merchant data)
      const merchantAddress = await this.getMerchantSettlementAddress(payment.merchantId.toString());
      
      // Calculate settlement amount (subtract platform fees)
      const platformFeeRate = 0.01; // 1% platform fee
      const feeAmount = Math.floor(payment.receivedAmount * platformFeeRate);
      const netAmount = payment.receivedAmount - feeAmount;

      // Execute STX transfer from unique address to merchant
      const transferResult = await stxContractService.executeSTXTransfer(
        payment.uniqueAddress,
        merchantAddress,
        netAmount,
        payment.encryptedPrivateKey,
        payment.paymentId
      );

      if (!transferResult.success) {
        throw new Error(`Settlement transfer failed: ${transferResult.error}`);
      }

      logger.info(`✅ Settlement transfer completed. TxID: ${transferResult.txId}`);

      // Update payment as settled
      await this.updatePaymentStatus(payment.paymentId, 'settled', {
        settlementTxId: transferResult.txId,
        settledAt: new Date(),
        feeAmount,
        netAmount
      });

      // Notify merchant of settlement
      await this.notifyMerchantPaymentSettled(payment.paymentId);

    } catch (error) {
      logger.error(`❌ Error executing settlement transfer:`, error);
      throw error;
    }
  }

  /**
   * Handle contract event: payment-registered
   */
  private async handlePaymentRegisteredEvent(eventValue: any, txId: string): Promise<void> {
    try {
      logger.info(`📝 Payment registered event`, { eventValue, txId });
      
      // Update payment with contract registration TX ID
      if (eventValue.paymentId) {
        await this.updatePaymentStatus(eventValue.paymentId, 'pending', {
          contractRegistrationTxId: txId
        });
      }
    } catch (error) {
      logger.error('❌ Error handling payment registered event:', error);
    }
  }

  /**
   * Handle contract event: payment-confirmed
   */
  private async handlePaymentConfirmedEvent(eventValue: any, txId: string): Promise<void> {
    try {
      logger.info(`✅ Payment confirmed event`, { eventValue, txId });
      
      // This event is emitted when our confirmSTXPaymentReceived call succeeds
      // Additional logging or processing can be added here
    } catch (error) {
      logger.error('❌ Error handling payment confirmed event:', error);
    }
  }

  /**
   * Handle contract event: payment-settled
   */
  private async handlePaymentSettledEvent(eventValue: any, txId: string): Promise<void> {
    try {
      logger.info(`💰 Payment settled event`, { eventValue, txId });
      
      // This event is emitted when our settleSTXPayment call succeeds
      // Settlement data is available in eventValue
    } catch (error) {
      logger.error('❌ Error handling payment settled event:', error);
    }
  }

  /**
   * Handle expired payment
   */
  private async handleExpiredPayment(payment: ISTXPayment): Promise<void> {
    try {
      logger.info(`⏰ Handling expired payment: ${payment.paymentId}`);
      
      await this.updatePaymentStatus(payment.paymentId, 'expired', {
        errorMessage: 'Payment expired before receiving funds'
      });

      // Notify merchant of expiration
      await this.notifyMerchantPaymentExpired(payment.paymentId);

    } catch (error) {
      logger.error(`❌ Error handling expired payment:`, error);
    }
  }

  /**
   * Notify merchant of payment confirmation
   */
  private async notifyMerchantPaymentConfirmed(paymentId: string): Promise<void> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) return;

      await webhookService.triggerWebhook(payment, 'payment.confirmed');
      logger.info(`📢 Merchant notified of payment confirmation: ${paymentId}`);
    } catch (error) {
      logger.error('❌ Error notifying merchant of payment confirmation:', error);
    }
  }

  /**
   * Notify merchant of payment settlement
   */
  private async notifyMerchantPaymentSettled(paymentId: string): Promise<void> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) return;

      await webhookService.triggerWebhook(payment, 'payment.settled');
      logger.info(`📢 Merchant notified of payment settlement: ${paymentId}`);
    } catch (error) {
      logger.error('❌ Error notifying merchant of payment settlement:', error);
    }
  }

  /**
   * Notify merchant of payment expiration
   */
  private async notifyMerchantPaymentExpired(paymentId: string): Promise<void> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) return;

      await webhookService.triggerWebhook(payment, 'payment.expired');
      logger.info(`📢 Merchant notified of payment expiration: ${paymentId}`);
    } catch (error) {
      logger.error('❌ Error notifying merchant of payment expiration:', error);
    }
  }

  /**
   * Get Chainhook webhook configuration for STX transfers
   * This configuration is used by Chainhook to know which events to send
   */
  getChainhookSTXTransferConfig(): any {
    const networkType = stxContractService.getNetworkInfo().isMainnet ? 'mainnet' : 'testnet';
    
    return {
      uuid: `stx-payment-transfers-${networkType}`,
      name: `STX Payment Gateway - STX Transfers (${networkType})`,
      version: 1,
      networks: {
        [networkType]: {
          if_this: {
            scope: 'stx_events',
            actions: ['transfer']
          },
          then_that: {
            http_post: {
              url: `${process.env.BACKEND_URL}/api/chainhook/stx/transfers`,
              authorization_header: `Bearer ${process.env.CHAINHOOK_SECRET || 'default-secret'}`
            }
          },
          start_block: process.env.STX_START_BLOCK || 1
        }
      }
    };
  }

  /**
   * Get Chainhook webhook configuration for contract events
   */
  getChainhookContractConfig(): any {
    const networkType = stxContractService.getNetworkInfo().isMainnet ? 'mainnet' : 'testnet';
    const contractIdentifier = stxContractService.getContractIdentifier();
    
    return {
      uuid: `stx-payment-contract-${networkType}`,
      name: `STX Payment Gateway - Contract Events (${networkType})`,
      version: 1,
      networks: {
        [networkType]: {
          if_this: {
            scope: 'contract_event',
            contract_identifier: contractIdentifier
          },
          then_that: {
            http_post: {
              url: `${process.env.BACKEND_URL}/api/chainhook/stx/contract`,
              authorization_header: `Bearer ${process.env.CHAINHOOK_SECRET || 'default-secret'}`
            }
          },
          start_block: process.env.STX_START_BLOCK || 1
        }
      }
    };
  }

  /**
   * Validate Chainhook webhook signature
   */
  validateChainhookSignature(signature: string): boolean {
    try {
      const expectedSecret = process.env.CHAINHOOK_SECRET || 'default-secret';
      return signature === `Bearer ${expectedSecret}`;
    } catch (error) {
      logger.error('❌ Error validating Chainhook signature:', error);
      return false;
    }
  }

  // Database integration methods

  /**
   * Find payment by unique address
   */
  private async findPaymentByUniqueAddress(address: string): Promise<ISTXPayment | null> {
    try {
      logger.info(`🔍 Looking up payment for address: ${address}`);
      const payment = await STXPayment.findByUniqueAddress(address);
      return payment;
    } catch (error) {
      logger.error(`❌ Error finding payment by address ${address}:`, error);
      return null;
    }
  }

  /**
   * Get payment by ID
   */
  private async getPaymentById(paymentId: string): Promise<ISTXPayment | null> {
    try {
      logger.info(`🔍 Looking up payment: ${paymentId}`);
      const payment = await STXPayment.findOne({ paymentId }).populate('merchantId');
      return payment;
    } catch (error) {
      logger.error(`❌ Error finding payment ${paymentId}:`, error);
      return null;
    }
  }

  /**
   * Update payment status and data
   */
  private async updatePaymentStatus(
    paymentId: string, 
    status: string, 
    updateData: any
  ): Promise<void> {
    try {
      logger.info(`📝 Updating payment ${paymentId} to status: ${status}`, updateData);
      
      const updateFields = {
        status,
        updatedAt: new Date(),
        ...updateData
      };

      await STXPayment.findOneAndUpdate(
        { paymentId },
        { $set: updateFields },
        { new: true }
      );

      logger.info(`✅ Payment ${paymentId} updated successfully`);
    } catch (error) {
      logger.error(`❌ Error updating payment ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Get merchant settlement address
   */
  private async getMerchantSettlementAddress(merchantId: string): Promise<string> {
    try {
      logger.info(`🔍 Looking up settlement address for merchant: ${merchantId}`);
      
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        throw new Error(`Merchant ${merchantId} not found`);
      }

      // Use the merchant's connected Stacks address, or fall back to configured address
      const settlementAddress = merchant.connectedWallets?.stacksAddress || 
                               merchant.stacksAddress ||
                               merchant.walletSetup?.sBTCWallet?.address;

      if (!settlementAddress) {
        throw new Error(`No settlement address configured for merchant ${merchant._id}`);
      }

      logger.info(`✅ Settlement address found: ${settlementAddress}`);
      return settlementAddress;
    } catch (error) {
      logger.error(`❌ Error getting merchant settlement address:`, error);
      throw error;
    }
  }

  /**
   * Get service configuration and status
   */
  getServiceInfo() {
    return {
      service: 'STX Chainhook Service',
      version: '1.0.0',
      confirmationBlocks: this.CONFIRMATION_BLOCKS,
      minPaymentAmount: this.MIN_PAYMENT_AMOUNT,
      networkInfo: stxContractService.getNetworkInfo(),
      chainhookConfigs: {
        transfers: this.getChainhookSTXTransferConfig(),
        contract: this.getChainhookContractConfig()
      }
    };
  }
}

// Export singleton instance
export const stxChainhookService = new STXChainhookService();
export default stxChainhookService;