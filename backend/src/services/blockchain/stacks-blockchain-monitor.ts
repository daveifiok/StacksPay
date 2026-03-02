import axios from 'axios';
import { STXPayment } from '@/models/payment/STXPayment';
import { stxContractService } from '@/services/contract/stx-contract-service';
import { webhookService } from '@/services/webhook/webhook-service';
import { createLogger } from '@/utils/logger';

const logger = createLogger('StacksBlockchainMonitor');

/**
 * Stacks Blockchain Monitor Service
 *
 * Polls the Stacks blockchain API to check for STX transfers to unique payment addresses.
 * This is the pragmatic solution for detecting customer payments without requiring
 * Chainhook infrastructure.
 */
export class StacksBlockchainMonitor {
  private apiUrl: string;
  private isPolling: boolean = false;
  private pollInterval: number = 30000; // 30 seconds
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.apiUrl = process.env.STACKS_API_URL || 'https://api.testnet.hiro.so';
  }

  /**
   * Start monitoring pending payments
   */
  startMonitoring(): void {
    if (this.isPolling) {
      logger.warn('Monitoring already started');
      return;
    }

    logger.info('🚀 Starting Stacks blockchain monitoring');
    this.isPolling = true;

    // Poll immediately, then set interval
    this.checkPendingPayments();

    this.intervalId = setInterval(() => {
      this.checkPendingPayments();
    }, this.pollInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isPolling = false;
    logger.info('⏹️ Stopped Stacks blockchain monitoring');
  }

  /**
   * Check all pending payments for incoming STX transfers
   */
  private async checkPendingPayments(): Promise<void> {
    try {
      // Get all pending and confirmed payments (confirmed need settlement)
      const paymentsToCheck = await STXPayment.find({
        status: { $in: ['pending', 'confirmed'] },
        expiresAt: { $gt: new Date() } // Only check non-expired payments
      }).limit(100); // Limit to prevent API rate limiting

      if (paymentsToCheck.length === 0) {
        logger.debug('No payments to check');
        return;
      }

      logger.info(`🔍 Checking ${paymentsToCheck.length} payments (pending + confirmed)`);

      // Check each payment
      for (const payment of paymentsToCheck) {
        try {
          await this.checkPaymentAddress(payment);
        } catch (error) {
          logger.error(`Error checking payment ${payment.paymentId}:`, error instanceof Error ? error.message : String(error));
        }
      }

    } catch (error) {
      logger.error('Error in checkPendingPayments:', error);
    }
  }

  /**
   * Manually check a specific payment (for API endpoint)
   */
  async manualCheckPayment(paymentId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    hasTransfer?: boolean;
    totalReceived?: number;
    transactions?: any[];
  }> {
    try {
      const payment = await STXPayment.findOne({ paymentId });

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      // Check for transactions
      const axios = (await import('axios')).default;
      const response = await axios.get(
        `${this.apiUrl}/extended/v1/address/${payment.uniqueAddress}/transactions`,
        { params: { limit: 20 }, timeout: 10000 }
      );

      const transactions = response.data.results || [];
      const stxTransfers = transactions.filter((tx: any) =>
        tx.tx_type === 'token_transfer' &&
        tx.token_transfer?.recipient_address === payment.uniqueAddress &&
        tx.tx_status === 'success'
      );

      const totalReceived = stxTransfers.reduce((sum: number, tx: any) =>
        sum + parseInt(tx.token_transfer?.amount || '0'), 0
      );

      await this.checkPaymentAddress(payment);

      return {
        success: true,
        message: 'Payment check completed',
        hasTransfer: stxTransfers.length > 0,
        totalReceived,
        transactions: stxTransfers
      };
    } catch (error) {
      logger.error(`Error in manual payment check for ${paymentId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a specific payment address has received STX
   */
  async checkPaymentAddress(payment: any): Promise<void> {
    try {
      const address = payment.uniqueAddress;

      logger.info(`🔎 Checking address ${address} for payment ${payment.paymentId}`);

      // If payment is already confirmed but not settled, attempt settlement
      if (payment.status === 'confirmed') {
        logger.info(`💰 Payment ${payment.paymentId} is confirmed, attempting settlement...`);
        await this.processPaymentSettlement(payment);
        return;
      }

      // Query Stacks API for transactions to this address
      const response = await axios.get(
        `${this.apiUrl}/extended/v1/address/${address}/transactions`,
        {
          params: {
            limit: 20,
            offset: 0
          },
          timeout: 10000
        }
      );

      const transactions = response.data.results || [];
      logger.info(`📦 Found ${transactions.length} total transactions for address ${address}`);

      // Filter for successful STX transfers where this address is the recipient
      const stxTransfers = transactions.filter((tx: any) => {
        logger.debug(`Checking tx ${tx.tx_id}: type=${tx.tx_type}, status=${tx.tx_status}, recipient=${tx.token_transfer?.recipient_address}`);

        if (tx.tx_type !== 'token_transfer') return false;
        if (tx.token_transfer?.recipient_address !== address) return false;
        if (tx.tx_status !== 'success') return false;

        // Accept any successful transfer to this unique address
        // The address is unique per payment, so any transfer to it is valid
        logger.info(`✅ Valid STX transfer found: ${tx.tx_id}, amount: ${tx.token_transfer?.amount}`);

        return true;
      });

      logger.info(`✅ Found ${stxTransfers.length} valid STX transfers to ${address}`);

      if (stxTransfers.length === 0) {
        return; // No transfers found yet
      }

      // Calculate total received
      const totalReceived = stxTransfers.reduce((sum: number, tx: any) => {
        return sum + parseInt(tx.token_transfer?.amount || '0');
      }, 0);

      logger.info(`💰 Found ${stxTransfers.length} STX transfer(s) to ${address}`, {
        paymentId: payment.paymentId,
        totalReceived,
        expectedAmount: payment.expectedAmount
      });

      // Validate received amount with 1% tolerance for rounding issues
      const tolerance = 0.01; // 1% tolerance
      const minAcceptableAmount = Math.floor(payment.expectedAmount * (1 - tolerance));

      if (totalReceived < minAcceptableAmount) {
        // Significantly underpaid - reject the payment
        const percentReceived = ((totalReceived / payment.expectedAmount) * 100).toFixed(2);
        logger.error(`❌ Payment ${payment.paymentId} underpaid: received ${totalReceived} (${percentReceived}%), expected ${payment.expectedAmount}`);

        await STXPayment.findOneAndUpdate(
          { paymentId: payment.paymentId },
          {
            $set: {
              status: 'failed',
              receivedAmount: totalReceived,
              errorMessage: `Underpaid: received ${totalReceived} microSTX (${percentReceived}% of ${payment.expectedAmount} expected). Please contact support for refund.`
            }
          }
        );
        return;
      }

      // Check if received amount meets or exceeds expected amount (with tolerance)
      if (totalReceived >= minAcceptableAmount) {
        const firstTransfer = stxTransfers[0];

        logger.info(`✅ Payment ${payment.paymentId} received sufficient funds`, {
          expected: payment.expectedAmount,
          received: totalReceived,
          tolerance: `${(tolerance * 100)}%`,
          txId: firstTransfer.tx_id
        });

        // Process the payment confirmation via Chainhook service
        await this.processPaymentConfirmation(payment, totalReceived, firstTransfer.tx_id);
      }

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Address has no transactions yet, this is normal
        return;
      }
      logger.error(`Error checking address ${payment.uniqueAddress}:`, error);
    }
  }

  /**
   * Process payment settlement (calls the smart contract settle function)
   */
  private async processPaymentSettlement(payment: any): Promise<void> {
    try {
      logger.info(`💰 Calling contract settle-payment for ${payment.paymentId}...`);
      const settleResult = await stxContractService.settleSTXPayment(payment.paymentId);

      if (!settleResult.success) {
        logger.error(`Failed to settle payment on contract: ${settleResult.error}`);
        // Payment stays in confirmed status, will retry in next monitoring cycle
        return;
      }

      logger.info(`✅ Contract settlement successful. TxID: ${settleResult.txId}`);

      // Step 2: Execute actual STX transfer from unique address to merchant
      logger.info(`💸 Transferring STX from unique address to merchant...`);

      const settledPayment = await STXPayment.findOne({ paymentId: payment.paymentId });
      if (!settledPayment) {
        logger.error(`Payment ${payment.paymentId} not found after settlement`);
        return;
      }

      // Fetch merchant separately
      const { Merchant } = require('@/models/merchant/Merchant');
      const merchant = await Merchant.findById(settledPayment.merchantId);
      if (!merchant) {
        logger.error(`Merchant not found for payment ${payment.paymentId}`);
        return;
      }

      // Get merchant's Stacks address from their profile
      const merchantStacksAddress = merchant.stacksAddress || merchant.connectedWallets?.stacksAddress;

      if (!merchantStacksAddress) {
        logger.error(`Merchant has no Stacks address configured for payment ${payment.paymentId}`);
        // Update payment with error but keep as completed on contract
        await STXPayment.findOneAndUpdate(
          { paymentId: payment.paymentId },
          {
            $set: {
              status: 'completed',
              settledAt: new Date(),
              'blockchainData.settlementTx': settleResult.txId,
              errorMessage: 'Settlement completed but merchant has no Stacks address for transfer'
            }
          }
        );
        return;
      }

      // Calculate the net amount to transfer to merchant
      // Customer paid: expectedAmount (which includes baseAmount + platformFee + settlementTxFee + transferTxFee)
      // We transfer: baseAmount (the original product price)
      const receivedAmount = settledPayment.receivedAmount || payment.expectedAmount;
      const baseAmount = payment.baseAmount || receivedAmount; // Fallback for old payments without baseAmount

      // Transaction fee constants (must match payment creation)
      const SETTLEMENT_TX_FEE = 180000; // ~0.18 STX for contract call
      const TRANSFER_TX_FEE = 180000; // ~0.18 STX for STX transfer
      const TOTAL_TX_FEE = SETTLEMENT_TX_FEE + TRANSFER_TX_FEE; // 0.36 STX total

      // For new payments with baseAmount, just transfer the base amount (merchant's product price)
      // For old payments without baseAmount, calculate it by subtracting fees
      let netAmount: number;
      let platformFee: number;

      if (payment.baseAmount) {
        // New payment structure: just transfer the baseAmount
        netAmount = baseAmount;
        platformFee = receivedAmount - baseAmount - TOTAL_TX_FEE; // Calculate what the platform fee was
      } else {
        // Old payment structure: calculate fees and deduct them
        const feeRate = merchant.paymentPreferences?.feePercentage || 1;
        platformFee = Math.floor((receivedAmount * feeRate) / 100);
        netAmount = receivedAmount - platformFee - TOTAL_TX_FEE;
      }

      if (netAmount <= 0) {
        logger.error(`Cannot transfer - insufficient funds. Received: ${receivedAmount}, Base: ${baseAmount}, Platform fee: ${platformFee}, Total Tx fees: ${TOTAL_TX_FEE}`);
        await STXPayment.findOneAndUpdate(
          { paymentId: payment.paymentId },
          {
            $set: {
              status: 'completed',
              settledAt: new Date(),
              'blockchainData.settlementTx': settleResult.txId,
              errorMessage: 'Insufficient funds to cover transaction and platform fees'
            }
          }
        );
        return;
      }

      logger.info(`💰 Transferring ${netAmount} microSTX to merchant ${merchantStacksAddress} (Received: ${receivedAmount}, Platform fee: ${platformFee}, Total Tx fees: ${TOTAL_TX_FEE})`);

      // Execute the transfer from unique address to merchant
      const transferResult = await stxContractService.executeSTXTransfer(
        settledPayment.uniqueAddress,
        merchantStacksAddress,
        netAmount,
        settledPayment.encryptedPrivateKey,
        payment.paymentId
      );

      if (!transferResult.success) {
        logger.error(`Failed to transfer STX to merchant: ${transferResult.error}`);
        // Keep payment as completed in contract, but mark transfer failed in DB
        await STXPayment.findOneAndUpdate(
          { paymentId: payment.paymentId },
          {
            $set: {
              status: 'completed',
              settledAt: new Date(),
              'blockchainData.settlementTx': settleResult.txId,
              errorMessage: `Settlement recorded but transfer failed: ${transferResult.error}`
            }
          }
        );
        return;
      }

      logger.info(`✅ STX transferred to merchant. TxID: ${transferResult.txId}`);

      // Update payment status to completed with transfer details
      await STXPayment.findOneAndUpdate(
        { paymentId: payment.paymentId },
        {
          $set: {
            status: 'completed',
            settledAt: new Date(),
            'blockchainData.settlementTx': settleResult.txId,
            settlementTxId: transferResult.txId,
            feeAmount: platformFee,
            netAmount
          }
        }
      );

      // Trigger webhook for completion
      const finalPayment = await STXPayment.findOne({ paymentId: payment.paymentId });
      if (finalPayment) {
        await webhookService.triggerWebhook(finalPayment, 'payment.completed');
      }

      logger.info(`✅ Payment ${payment.paymentId} fully settled and transferred to merchant`);
    } catch (error) {
      logger.error(`Error processing settlement for ${payment.paymentId}:`, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Process payment confirmation (calls the smart contract functions)
   */
  private async processPaymentConfirmation(
    payment: any,
    receivedAmount: number,
    txId: string
  ): Promise<void> {
    try {
      logger.info(`🔄 Processing payment confirmation for ${payment.paymentId}...`);

      // Step 1: Call contract's confirm-payment-received function
      logger.info(`📝 Calling contract confirm-payment-received...`);
      const confirmResult = await stxContractService.confirmSTXPaymentReceived(
        payment.paymentId,
        receivedAmount,
        txId
      );

      if (!confirmResult.success) {
        logger.error(`Failed to confirm payment on contract: ${confirmResult.error}`);
        // Update payment with error status
        await STXPayment.findOneAndUpdate(
          { paymentId: payment.paymentId },
          {
            $set: {
              status: 'failed',
              errorMessage: `Contract confirmation failed: ${confirmResult.error}`
            }
          }
        );
        return;
      }

      logger.info(`✅ Contract confirmation successful. TxID: ${confirmResult.txId}`);

      // Step 2: Update payment status in database to confirmed
      await STXPayment.findOneAndUpdate(
        { paymentId: payment.paymentId },
        {
          $set: {
            status: 'confirmed',
            receivedAmount,
            confirmedAt: new Date(),
            contractConfirmationTxId: confirmResult.txId
          }
        }
      );

      // Step 3: Trigger webhook for payment confirmation
      const updatedPayment = await STXPayment.findOne({ paymentId: payment.paymentId });
      if (updatedPayment) {
        await webhookService.triggerWebhook(updatedPayment, 'payment.confirmed');
      }

      logger.info(`⏳ Payment confirmed. Settlement will occur once confirmation transaction is mined (next monitoring cycle).`);
      // Don't settle immediately - it will cause ConflictingNonceInMempool
      // Settlement will happen in the next monitoring cycle once confirmation tx is mined
    } catch (error) {
      logger.error(`Error processing confirmation for ${payment.paymentId}:`, error instanceof Error ? error.message : String(error));
    }
  }
}

// Export singleton instance
export const stacksBlockchainMonitor = new StacksBlockchainMonitor();
        