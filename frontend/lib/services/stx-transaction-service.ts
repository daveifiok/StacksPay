import { STACKS_TESTNET, STACKS_MAINNET, StacksNetwork } from '@stacks/network';
import { request } from '@stacks/connect';
import { Pc, PostConditionMode } from '@stacks/transactions';
import { walletService } from './wallet-service';

export interface STXTransferParams {
  recipient: string;
  amount: number; // in microSTX
  memo?: string;
  fee?: number; // optional fee override
}

export interface STXTransferResult {
  success: boolean;
  txId?: string;
  error?: string;
  estimatedFee?: number;
}

export interface STXPaymentParams {
  paymentId: string;
  recipient: string;
  amount: number; // in microSTX
  memo?: string;
}

export interface STXBalanceInfo {
  balance: number; // in microSTX
  locked: number;
  unlockHeight: number;
  nonce: number;
}

/**
 * STX Transaction Service - Frontend customer payment handling
 * 
 * This service is responsible for:
 * 1. Customer STX payments to unique addresses (payment flow)
 * 2. Balance checking and fee estimation
 * 3. Transaction status monitoring
 * 4. Integration with wallet service for user authentication
 * 
 * Key difference from backend services:
 * - Frontend: Customer-initiated payments (user approves each transaction)
 * - Backend: Platform-controlled settlements (automated transfers)
 */
export class STXTransactionService {
  private network: StacksNetwork;
  private baseURL: string;

  constructor() {
    const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
    this.network = isMainnet ? STACKS_MAINNET : STACKS_TESTNET;
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  }

  /**
   * Execute STX payment to unique address
   * This is used when customers pay STX to merchant's unique payment address
   */
  async executeSTXPayment(params: STXPaymentParams): Promise<STXTransferResult> {
    try {
      console.log('🔄 Executing STX payment:', params);

      // Check wallet connection
      const walletData = await walletService.getCurrentWalletData();
      if (!walletData) {
        throw new Error('Wallet not connected');
      }

      // Validate payment parameters
      if (!params.recipient || !params.amount || params.amount <= 0) {
        throw new Error('Invalid payment parameters');
      }

      // Validate minimum amount (0.001 STX = 1000 microSTX)
      if (params.amount < 1000) {
        throw new Error('Minimum payment amount is 0.001 STX');
      }

      // Get current balance and validate
      const balance = await this.getSTXBalance(walletData.address);
      if (balance.balance < params.amount) {
        throw new Error(`Insufficient balance. Available: ${balance.balance} microSTX, Required: ${params.amount} microSTX`);
      }

      // Estimate transaction fee
      const estimatedFee = await this.estimateTransferFee(params);
      
      if (balance.balance < params.amount + estimatedFee) {
        throw new Error(`Insufficient balance for payment + fees. Available: ${balance.balance} microSTX, Required: ${params.amount + estimatedFee} microSTX`);
      }

      // Create post-condition to ensure we only send the expected amount
      const postCondition = Pc.principal(walletData.address)
        .willSendEq(params.amount)
        .ustx();

      // Create STX transfer transaction using correct Stacks Connect method
      const txOptions = {
        recipient: params.recipient,
        amount: params.amount,
        network: this.network === STACKS_MAINNET ? 'mainnet' : 'testnet',
        memo: params.memo || `Payment for ${params.paymentId}`,
        fee: estimatedFee,
        nonce: balance.nonce,
        postConditions: [postCondition],
        postConditionMode: PostConditionMode.Deny // Deny if post-conditions fail
      };

      console.log('📊 Payment details:', {
        from: walletData.address,
        to: params.recipient,
        amount: params.amount,
        fee: estimatedFee,
        memo: params.memo,
        paymentId: params.paymentId
      });

      // Request user approval and sign transaction using correct method
      const result = await request('stx_transferStx', txOptions);

      if (!result || !result.txid) {
        throw new Error('Transaction failed or was cancelled by user');
      }

      console.log('✅ STX payment successful. TxID:', result.txid);

      return {
        success: true,
        txId: result.txid,
        estimatedFee
      };

    } catch (error) {
      console.error('❌ STX payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown payment error'
      };
    }
  }

  /**
   * Execute general STX transfer (for non-payment use cases)
   */
  async executeSTXTransfer(params: STXTransferParams): Promise<STXTransferResult> {
    try {
      console.log('🔄 Executing STX transfer:', params);

      // Check wallet connection
      const walletData = await walletService.getCurrentWalletData();
      if (!walletData) {
        throw new Error('Wallet not connected');
      }

      // Validate transfer parameters
      if (!params.recipient || !params.amount || params.amount <= 0) {
        throw new Error('Invalid transfer parameters');
      }

      // Get current balance and validate
      const balance = await this.getSTXBalance(walletData.address);
      if (balance.balance < params.amount) {
        throw new Error(`Insufficient balance. Available: ${balance.balance} microSTX, Required: ${params.amount} microSTX`);
      }

      // Use provided fee or estimate
      const fee = params.fee || await this.estimateTransferFee(params);
      
      if (balance.balance < params.amount + fee) {
        throw new Error(`Insufficient balance for transfer + fees. Available: ${balance.balance} microSTX, Required: ${params.amount + fee} microSTX`);
      }

      // Create post-condition to ensure we only send the expected amount
      const postCondition = Pc.principal(walletData.address)
        .willSendEq(params.amount)
        .ustx();

      // Create STX transfer transaction using correct Stacks Connect method
      const txOptions = {
        recipient: params.recipient,
        amount: params.amount,
        network: this.network === STACKS_MAINNET ? 'mainnet' : 'testnet',
        memo: params.memo || '',
        fee,
        nonce: balance.nonce,
        postConditions: [postCondition],
        postConditionMode: PostConditionMode.Deny // Deny if post-conditions fail
      };

      console.log('📊 Transfer details:', {
        from: walletData.address,
        to: params.recipient,
        amount: params.amount,
        fee,
        memo: params.memo
      });

      // Request user approval and sign transaction using correct method
      const result = await request('stx_transferStx', txOptions);

      if (!result || !result.txid) {
        throw new Error('Transaction failed or was cancelled by user');
      }

      console.log('✅ STX transfer successful. TxID:', result.txid);

      return {
        success: true,
        txId: result.txid,
        estimatedFee: fee
      };

    } catch (error) {
      console.error('❌ STX transfer failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transfer error'
      };
    }
  }

  /**
   * Get STX balance for current user's wallet
   */
  async getSTXBalance(address?: string): Promise<STXBalanceInfo> {
    try {
      let targetAddress = address;
      
      if (!targetAddress) {
        const walletData = await walletService.getCurrentWalletData();
        if (!walletData) {
          throw new Error('No wallet connected and no address provided');
        }
        targetAddress = walletData.address;
      }

      console.log('🔄 Fetching STX balance for address:', targetAddress);
      
      const apiUrl = this.network === STACKS_MAINNET 
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so';

      const response = await fetch(`${apiUrl}/extended/v1/address/${targetAddress}/balances`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const balanceInfo: STXBalanceInfo = {
        balance: parseInt(data.stx?.balance) || 0,
        locked: parseInt(data.stx?.locked) || 0,
        unlockHeight: parseInt(data.stx?.unlock_height) || 0,
        nonce: parseInt(data.nonce) || 0
      };

      console.log('✅ Balance fetched:', balanceInfo);
      return balanceInfo;

    } catch (error) {
      console.error('❌ Failed to fetch STX balance:', error);
      throw new Error(`Balance fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Estimate transaction fee for STX transfer
   */
  async estimateTransferFee(params: STXTransferParams | STXPaymentParams): Promise<number> {
    try {
      console.log('🔄 Estimating transfer fee for amount:', params.amount);
      
      const apiUrl = this.network === STACKS_MAINNET 
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so';

      const response = await fetch(`${apiUrl}/v2/fees/transfer`);
      
      if (!response.ok) {
        throw new Error('Failed to estimate fees');
      }

      const feeData = await response.json();
      const estimatedFee = Math.max(parseInt(feeData.toString()), 1000); // Minimum 1000 microSTX
      
      console.log('💰 Estimated fee:', estimatedFee, 'microSTX');
      return estimatedFee;

    } catch (error) {
      console.error('❌ Fee estimation failed:', error);
      // Return a reasonable fallback fee (0.001 STX = 1000 microSTX)
      const fallbackFee = 1000;
      console.log('⚠️ Using fallback fee:', fallbackFee, 'microSTX');
      return fallbackFee;
    }
  }

  /**
   * Get transaction status from blockchain
   */
  async getTransactionStatus(txId: string): Promise<any> {
    try {
      console.log('🔄 Checking transaction status:', txId);
      
      const apiUrl = this.network === STACKS_MAINNET 
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so';

      const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.status} ${response.statusText}`);
      }

      const txData = await response.json();
      
      console.log('✅ Transaction status:', {
        txId,
        status: txData.tx_status,
        result: txData.tx_result
      });

      return txData;

    } catch (error) {
      console.error('❌ Failed to get transaction status:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(txId: string, maxAttempts: number = 10, intervalMs: number = 5000): Promise<boolean> {
    console.log('⏳ Waiting for transaction confirmation:', txId);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const txData = await this.getTransactionStatus(txId);
        
        if (txData.tx_status === 'success') {
          console.log('✅ Transaction confirmed:', txId);
          return true;
        } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
          console.log('❌ Transaction failed:', txId, '-', txData.tx_status);
          return false;
        }
        
        console.log(`⏳ Attempt ${attempt}/${maxAttempts}: Transaction still pending...`);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        
      } catch (error) {
        console.error(`⚠️ Error checking transaction status (attempt ${attempt}):`, error);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      }
    }
    
    console.log('⏰ Transaction confirmation timeout:', txId);
    return false;
  }

  /**
   * Validate STX address format
   */
  validateSTXAddress(address: string): boolean {
    try {
      const isTestnet = this.network === STACKS_TESTNET;
      const expectedPrefix = isTestnet ? 'ST' : 'SP';
      
      return address.startsWith(expectedPrefix) && address.length === 41;
    } catch (error) {
      console.error('❌ Address validation failed:', error);
      return false;
    }
  }

  /**
   * Convert microSTX to STX (for display purposes)
   */
  microSTXToSTX(microSTX: number): number {
    return microSTX / 1_000_000;
  }

  /**
   * Convert STX to microSTX (for transaction amounts)
   */
  stxToMicroSTX(stx: number): number {
    return Math.floor(stx * 1_000_000);
  }

  /**
   * Format STX amount for display
   */
  formatSTXAmount(microSTX: number, decimals: number = 6): string {
    const stx = this.microSTXToSTX(microSTX);
    return stx.toFixed(decimals) + ' STX';
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      network: this.network,
      isMainnet: this.network === STACKS_MAINNET,
      apiUrl: this.network === STACKS_MAINNET 
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so'
    };
  }

  /**
   * Check if current network supports the operation
   */
  isNetworkAvailable(): boolean {
    return this.network === STACKS_TESTNET || this.network === STACKS_MAINNET;
  }

  /**
   * Get current STX price (optional for display purposes)
   */
  async getCurrentSTXPrice(): Promise<number | null> {
    try {
      // This is a simple implementation - you might want to use a more reliable price API
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd');
      
      if (!response.ok) {
        throw new Error('Failed to fetch STX price');
      }

      const data = await response.json();
      return data.stacks?.usd || null;

    } catch (error) {
      console.error('❌ Failed to fetch STX price:', error);
      return null;
    }
  }

  /**
   * Calculate USD equivalent of STX amount
   */
  async calculateUSDEquivalent(microSTX: number): Promise<number | null> {
    try {
      const stxPrice = await this.getCurrentSTXPrice();
      if (!stxPrice) return null;

      const stxAmount = this.microSTXToSTX(microSTX);
      return stxAmount * stxPrice;

    } catch (error) {
      console.error('❌ Failed to calculate USD equivalent:', error);
      return null;
    }
  }

  // ===== PAYMENT API INTEGRATION =====
  // These methods integrate with the backend STX payment system

  /**
   * Create STX payment (backend integration)
   */
  async createSTXPayment(params: {
    expectedAmount: number; // in microSTX
    usdAmount?: number;
    metadata: string;
    expiresInMinutes?: number;
  }): Promise<{
    success: boolean;
    payment?: {
      paymentId: string;
      uniqueAddress: string;
      expectedAmount: number;
      usdAmount?: number;
      expiresAt: string;
      qrCodeData: string;
    };
    error?: string;
  }> {
    try {
      console.log('🔄 Creating STX payment:', params);

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseURL}/api/payments/stx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create payment' }));
        throw new Error(errorData.error || `Payment creation failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ STX payment created:', result);

      return result;

    } catch (error) {
      console.error('❌ Failed to create STX payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment'
      };
    }
  }

  /**
   * Get STX payment status (backend integration)
   */
  async getSTXPaymentStatus(paymentId: string): Promise<{
    success: boolean;
    payment?: {
      paymentId: string;
      status: string;
      expectedAmount: number;
      receivedAmount?: number;
      uniqueAddress: string;
      expiresAt: string;
      confirmedAt?: string;
      settledAt?: string;
      contractData?: any;
    };
    error?: string;
  }> {
    try {
      console.log('🔄 Getting STX payment status:', paymentId);

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseURL}/api/payments/stx/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get payment status' }));
        throw new Error(errorData.error || `Failed to get payment status: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ STX payment status:', result);

      return result;

    } catch (error) {
      console.error('❌ Failed to get STX payment status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment status'
      };
    }
  }
}

// Export singleton instance
export const stxTransactionService = new STXTransactionService();
export default stxTransactionService;