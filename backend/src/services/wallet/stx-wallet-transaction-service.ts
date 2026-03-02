import {
  makeSTXTokenTransfer,
  broadcastTransaction,
  getAddressFromPrivateKey,
  makeRandomPrivKey,
  Cl,
  Pc,
  PostConditionMode
} from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET, StacksNetwork } from '@stacks/network';

export interface STXTransferParams {
  fromAddress: string;
  toAddress: string;
  amount: number; // in microSTX
  memo?: string;
  privateKey: string;
}

export interface STXTransferResult {
  success: boolean;
  txId?: string;
  error?: string;
  estimatedFee?: number;
}

export interface WalletBalance {
  address: string;
  balance: number; // in microSTX
  locked: number;
  unlock_height: number;
  nonce: number;
}

/**
 * STX Wallet Transaction Service - Handles actual STX blockchain transactions
 * 
 * This service is responsible for:
 * 1. Executing STX transfers between addresses (settlements from unique addresses to merchants)
 * 2. Fee estimation and transaction optimization
 * 3. Balance checking and validation
 * 4. Transaction broadcasting and monitoring
 * 
 * Note: This is separate from stx-contract-service.ts which handles contract interactions.
 * This separation follows the principle of keeping wallet operations separate from contract operations.
 * 
 * Key difference from frontend wallet service:
 * - Frontend: User-controlled wallets (requires user approval)
 * - Backend: Platform-controlled wallets (automated settlements)
 */
export class STXWalletTransactionService {
  private network: StacksNetwork;

  constructor() {
    // Determine network from environment
    const isMainnet = process.env.STACKS_NETWORK === 'mainnet';
    this.network = isMainnet ? STACKS_MAINNET : STACKS_TESTNET;
  }

  /**
   * Execute STX transfer from one address to another
   * This is used for settlement transfers from unique addresses to merchants
   */
  async executeSTXTransfer(params: STXTransferParams): Promise<STXTransferResult> {
    try {
      console.log(`🔄 Executing STX transfer: ${params.amount} microSTX from ${params.fromAddress} to ${params.toAddress}`);
      
      // Validate inputs
      if (!params.privateKey || !params.fromAddress || !params.toAddress || params.amount <= 0) {
        throw new Error('Invalid transfer parameters');
      }

      // Verify the private key matches the from address
      const derivedAddress = getAddressFromPrivateKey(
        params.privateKey,
        this.network === STACKS_TESTNET ? 'testnet' : 'mainnet'
      );
      
      if (derivedAddress !== params.fromAddress) {
        throw new Error('Private key does not match sender address');
      }

      // Check balance before transfer
      const balance = await this.getSTXBalance(params.fromAddress);
      if (balance.balance < params.amount) {
        throw new Error(`Insufficient balance. Available: ${balance.balance}, Required: ${params.amount}`);
      }

      // Estimate transaction fee
      const estimatedFee = await this.estimateTransferFee(params);
      
      if (balance.balance < params.amount + estimatedFee) {
        throw new Error(`Insufficient balance for transfer + fees. Available: ${balance.balance}, Required: ${params.amount + estimatedFee}`);
      }

      // Create post-condition to ensure we only send the expected amount
      const postCondition = Pc.principal(params.fromAddress)
        .willSendEq(params.amount)
        .ustx();

      // Create STX transfer transaction
      const txOptions = {
        recipient: params.toAddress,
        amount: params.amount,
        senderKey: params.privateKey,
        network: this.network,
        memo: params.memo || '',
        fee: estimatedFee,
        nonce: balance.nonce,
        postConditions: [postCondition],
        postConditionMode: PostConditionMode.Deny // Deny if post-conditions fail
      };

      console.log(`📊 Transfer details:`, {
        from: params.fromAddress,
        to: params.toAddress,
        amount: params.amount,
        fee: estimatedFee,
        memo: params.memo
      });

      const transaction = await makeSTXTokenTransfer(txOptions);
      
      // Broadcast transaction to network
      const broadcastResponse = await broadcastTransaction({ 
        transaction, 
        network: this.network 
      });
      
      if ('error' in broadcastResponse) {
        throw new Error(`Transaction broadcast failed: ${(broadcastResponse as any).error || 'Unknown error'}`);
      }

      console.log(`✅ STX transfer successful. TxID: ${(broadcastResponse as any).txid}`);
      
      return {
        success: true,
        txId: (broadcastResponse as any).txid,
        estimatedFee
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
   * Get STX balance for an address
   */
  async getSTXBalance(address: string): Promise<WalletBalance> {
    try {
      console.log(`🔄 Fetching STX balance for address: ${address}`);
      
      const apiUrl = this.network === STACKS_MAINNET 
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so';

      const response = await fetch(`${apiUrl}/extended/v1/address/${address}/balances`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      const balance: WalletBalance = {
        address,
        balance: parseInt(data.stx?.balance) || 0,
        locked: parseInt(data.stx?.locked) || 0,
        unlock_height: parseInt(data.stx?.unlock_height) || 0,
        nonce: parseInt(data.nonce) || 0
      };

      console.log(`✅ Balance fetched:`, balance);
      return balance;

    } catch (error) {
      console.error('❌ Failed to fetch STX balance:', error);
      throw new Error(`Balance fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Estimate transaction fee for STX transfer
   */
  async estimateTransferFee(params: STXTransferParams): Promise<number> {
    try {
      console.log(`🔄 Estimating transfer fee for ${params.amount} microSTX`);
      
      // For now, use a simple fee estimation
      // In production, you might want to use more sophisticated fee estimation
      const apiUrl = this.network === STACKS_MAINNET 
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so';

      const response = await fetch(`${apiUrl}/v2/fees/transfer`);
      
      if (!response.ok) {
        throw new Error('Failed to estimate fees');
      }

      const feeData = await response.json() as any;
      const estimatedFee = Math.max(parseInt(feeData.toString()), 1000); // Minimum 1000 microSTX
      
      console.log(`💰 Estimated fee: ${estimatedFee} microSTX`);
      return estimatedFee;

    } catch (error) {
      console.error('❌ Fee estimation failed:', error);
      // Return a reasonable fallback fee (0.001 STX = 1000 microSTX)
      const fallbackFee = 1000;
      console.log(`⚠️ Using fallback fee: ${fallbackFee} microSTX`);
      return fallbackFee;
    }
  }

  /**
   * Validate STX address format
   */
  validateSTXAddress(address: string): boolean {
    try {
      // Basic STX address validation
      const isTestnet = this.network === STACKS_TESTNET;
      const expectedPrefix = isTestnet ? 'ST' : 'SP';
      
      return address.startsWith(expectedPrefix) && address.length === 41;
    } catch (error) {
      console.error('❌ Address validation failed:', error);
      return false;
    }
  }

  /**
   * Get transaction status from blockchain
   */
  async getTransactionStatus(txId: string): Promise<any> {
    try {
      console.log(`🔄 Checking transaction status: ${txId}`);
      
      const apiUrl = this.network === STACKS_MAINNET 
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so';

      const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.status} ${response.statusText}`);
      }

      const txData = await response.json() as any;
      
      console.log(`✅ Transaction status:`, {
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
    console.log(`⏳ Waiting for transaction confirmation: ${txId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const txData = await this.getTransactionStatus(txId);
        
        if (txData.tx_status === 'success') {
          console.log(`✅ Transaction confirmed: ${txId}`);
          return true;
        } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
          console.log(`❌ Transaction failed: ${txId} - ${txData.tx_status}`);
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
    
    console.log(`⏰ Transaction confirmation timeout: ${txId}`);
    return false;
  }

  /**
   * Batch transfer - send STX to multiple recipients
   * Useful for mass payouts or settlements
   */
  async executeBatchTransfer(
    fromPrivateKey: string,
    transfers: Array<{ toAddress: string; amount: number; memo?: string }>
  ): Promise<STXTransferResult[]> {
    console.log(`🔄 Executing batch transfer: ${transfers.length} transfers`);
    
    const results: STXTransferResult[] = [];
    const fromAddress = getAddressFromPrivateKey(
      fromPrivateKey,
      this.network === STACKS_TESTNET ? 'testnet' : 'mainnet'
    );

    for (let i = 0; i < transfers.length; i++) {
      const transfer = transfers[i];
      console.log(`📤 Processing transfer ${i + 1}/${transfers.length}`);
      
      const result = await this.executeSTXTransfer({
        fromAddress,
        toAddress: transfer.toAddress,
        amount: transfer.amount,
        memo: transfer.memo,
        privateKey: fromPrivateKey
      });
      
      results.push(result);
      
      // Add delay between transactions to avoid nonce conflicts
      if (i < transfers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`✅ Batch transfer completed: ${results.filter(r => r.success).length}/${results.length} successful`);
    return results;
  }

  /**
   * Generate a new wallet for receiving payments
   * This can be used to create unique addresses for payments
   */
  generateNewWallet(): { address: string; privateKey: string } {
    const privateKey = makeRandomPrivKey();
    const address = getAddressFromPrivateKey(
      privateKey,
      this.network === STACKS_TESTNET ? 'testnet' : 'mainnet'
    );

    return { address, privateKey };
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
}

// Export singleton instance
export const stxWalletTransactionService = new STXWalletTransactionService();
export default stxWalletTransactionService;