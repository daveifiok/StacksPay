import {
  fetchCallReadOnlyFunction,
  makeContractCall,
  broadcastTransaction,
  makeSTXTokenTransfer,
  AnchorMode,
  PostConditionMode,
  getAddressFromPrivateKey,
  Cl,
  makeRandomPrivKey
} from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET, StacksNetwork, TransactionVersion } from '@stacks/network';
import { generateWallet } from '@stacks/wallet-sdk';
import * as crypto from 'crypto';
import { createLogger } from '@/utils/logger';

const logger = createLogger('STXContractService');

// Contract configuration using deployed testnet contract
const STX_CONTRACTS = {
  testnet: {
    contractAddress: 'SP328EHAG4RB6MYQMBH9Z0WVTE02HD5N50MQJXHFZ',
    contractName: 'stackspay-stx-gateway'
  },
  mainnet: {
    contractAddress: '', // Will be set when deployed to mainnet
    contractName: 'stackspay-stx-gateway'
  }
};

export interface UniqueAddressResult {
  address: string;
  encryptedPrivateKey: string;
}

export interface STXPaymentData {
  paymentId: string;
  merchantAddress: string;
  uniqueAddress: string;
  expectedAmount: number; // in microSTX
  metadata: string;
  expiresInBlocks: number;
}

export interface ContractResult {
  success: boolean;
  txId?: string;
  error?: string;
  result?: any;
}

/**
 * STX Contract Service - Handles all interactions with the STX Payment Gateway contract
 * 
 * This service is responsible for:
 * 1. Unique address generation with secure private key storage
 * 2. Contract function calls (register, confirm, settle payments)
 * 3. Reading contract state and payment data
 * 4. Settlement transaction execution using stored private keys
 * 
 * Note: This is separate from the existing contract-service.ts which handles sBTC
 */
export class STXContractService {
  private network: StacksNetwork;
  private contractAddress: string;
  private contractName: string;
  private backendPrivateKey: string;

  constructor() {
    // Determine network from environment
    const isMainnet = process.env.STACKS_NETWORK === 'mainnet';
    this.network = isMainnet ? STACKS_MAINNET : STACKS_TESTNET;

    // Set contract details based on network
    const contracts = isMainnet ? STX_CONTRACTS.mainnet : STX_CONTRACTS.testnet;
    this.contractAddress = contracts.contractAddress;
    this.contractName = contracts.contractName;

    // Backend private key for making contract calls
    this.backendPrivateKey = this.getPrivateKeyFromEnv();

    if (!this.backendPrivateKey) {
      console.warn('⚠️ STX_BACKEND_PRIVATE_KEY not set in environment variables');
    }
  }

  /**
   * Get private key from environment - supports both hex private key and mnemonic
   */
  private getPrivateKeyFromEnv(): string {
    const envKey = process.env.STX_BACKEND_PRIVATE_KEY || '';

    if (!envKey) {
      return '';
    }

    // Remove quotes if present
    const cleanedKey = envKey.replace(/^["']|["']$/g, '');

    // Check if it's a mnemonic (contains spaces, indicating words)
    if (cleanedKey.includes(' ')) {
      try {
        console.log('🔑 Deriving private key from mnemonic...');

        // Derive private key from mnemonic using Wallet SDK async method
        // We'll use a synchronous workaround by calling the async init immediately
        this.initializeFromMnemonic(cleanedKey);

        // For now, return empty and let async init handle it
        // The actual key will be set asynchronously
        return '';
      } catch (error) {
        console.error('❌ Failed to derive private key from mnemonic:', error);
        return '';
      }
    }

    // It's already a hex private key
    return cleanedKey;
  }

  /**
   * Initialize wallet from mnemonic asynchronously
   */
  private async initializeFromMnemonic(mnemonic: string): Promise<void> {
    try {
      const wallet = await generateWallet({
        secretKey: mnemonic,
        password: ''
      });

      // Get the first account (index 0)
      const accounts = wallet.accounts || [];
      if (accounts.length === 0) {
        throw new Error('No accounts found in wallet');
      }

      const account = accounts[0];
      this.backendPrivateKey = account.stxPrivateKey;

      // Derive address from the private key
      const derivedAddress = getAddressFromPrivateKey(account.stxPrivateKey, this.network);

      console.log('✅ Private key derived from mnemonic');
      console.log('📍 Derived address:', derivedAddress);
    } catch (error) {
      console.error('❌ Failed to initialize from mnemonic:', error);
    }
  }

  /**
   * Generate a unique Stacks address for a payment with secure private key storage
   * This implements the unique address per payment pattern (Option 2)
   */
  async generateUniqueSTXAddress(paymentId: string): Promise<UniqueAddressResult> {
    try {
      console.log(`🔄 Generating unique STX address for payment: ${paymentId}`);

      // Generate new private key for this payment
      const privateKey = makeRandomPrivKey();

      // Get address - pass the network directly
      const address = getAddressFromPrivateKey(privateKey, this.network);

      // Encrypt private key for secure storage
      const encryptedPrivateKey = this.encryptPrivateKey(privateKey, paymentId);

      console.log(`✅ Generated unique address: ${address} for payment: ${paymentId}`);

      return {
        address,
        encryptedPrivateKey
      };
    } catch (error) {
      console.error('❌ Failed to generate unique STX address:', error);
      throw new Error(`Failed to generate unique address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Register a new STX payment with the contract
   * This calls the register-payment function in our deployed contract
   */
  async registerSTXPayment(paymentData: STXPaymentData): Promise<ContractResult> {
    try {
      console.log(`🔄 Registering STX payment with contract: ${paymentData.paymentId}`);
      
      if (!this.backendPrivateKey) {
        throw new Error('Backend private key not configured');
      }

      const senderKey = this.backendPrivateKey;
      
      // Create contract call transaction
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'register-payment',
        functionArgs: [
          Cl.stringAscii(paymentData.paymentId),
          Cl.standardPrincipal(paymentData.merchantAddress),
          Cl.standardPrincipal(paymentData.uniqueAddress),
          Cl.uint(paymentData.expectedAmount),
          Cl.stringAscii(paymentData.metadata),
          Cl.uint(paymentData.expiresInBlocks)
        ],
        senderKey,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });

      if ('error' in broadcastResponse) {
        logger.error('Registration broadcast error:', {
          error: (broadcastResponse as any).error,
          reason: (broadcastResponse as any).reason,
          message: (broadcastResponse as any).message,
          txid: (broadcastResponse as any).txid,
          full: broadcastResponse
        });
        throw new Error(`Contract call failed: ${(broadcastResponse as any).error || (broadcastResponse as any).reason || 'transaction rejected'}`);
      }

      console.log(`✅ STX payment registered successfully. TxID: ${(broadcastResponse as any).txid}`);
      
      return {
        success: true,
        txId: (broadcastResponse as any).txid
      };
    } catch (error) {
      console.error('❌ Failed to register STX payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Confirm STX payment received (called after Chainhook detects payment)
   * This calls the confirm-payment-received function in our contract
   */
  async confirmSTXPaymentReceived(paymentId: string, receivedAmount: number, txId: string): Promise<ContractResult> {
    try {
      console.log(`🔄 Confirming STX payment received: ${paymentId}, Amount: ${receivedAmount}, TxID: ${txId}`);
      
      if (!this.backendPrivateKey) {
        throw new Error('Backend private key not configured');
      }

      const senderKey = this.backendPrivateKey;
      
      // Create contract call transaction
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'confirm-payment-received',
        functionArgs: [
          Cl.stringAscii(paymentId),
          Cl.uint(receivedAmount),
          Cl.buffer(Buffer.from(txId, 'hex'))
        ],
        senderKey,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });

      if ('error' in broadcastResponse) {
        logger.error('Confirmation broadcast error:', {
          error: (broadcastResponse as any).error,
          reason: (broadcastResponse as any).reason,
          message: (broadcastResponse as any).message,
          txid: (broadcastResponse as any).txid,
          full: broadcastResponse
        });
        throw new Error(`Contract call failed: ${(broadcastResponse as any).error || (broadcastResponse as any).reason || 'transaction rejected'}`);
      }

      console.log(`✅ STX payment confirmation successful. TxID: ${(broadcastResponse as any).txid}`);
      
      return {
        success: true,
        txId: (broadcastResponse as any).txid
      };
    } catch (error) {
      console.error('❌ Failed to confirm STX payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Settle STX payment to merchant
   * This calls the settle-payment function and then executes the actual STX transfer
   */
  async settleSTXPayment(paymentId: string): Promise<ContractResult> {
    try {
      console.log(`🔄 Settling STX payment: ${paymentId}`);
      
      if (!this.backendPrivateKey) {
        throw new Error('Backend private key not configured');
      }

      const senderKey = this.backendPrivateKey;
      
      // Step 1: Call contract to calculate settlement
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'settle-payment',
        functionArgs: [
          Cl.stringAscii(paymentId)
        ],
        senderKey,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });

      if ('error' in broadcastResponse) {
        console.error('❌ Settlement broadcast failed!');
        console.error('Error field:', (broadcastResponse as any).error);
        console.error('Reason field:', (broadcastResponse as any).reason);
        console.error('All keys:', Object.keys(broadcastResponse));
        console.error('Full response:', JSON.stringify(broadcastResponse, null, 2));
        throw new Error(`Contract settlement call failed: ${(broadcastResponse as any).error || (broadcastResponse as any).reason || 'transaction rejected'}`);
      }

      console.log(`✅ STX payment settlement initiated. TxID: ${(broadcastResponse as any).txid}`);
      
      return {
        success: true,
        txId: (broadcastResponse as any).txid
      };
    } catch (error) {
      console.error('❌ Failed to settle STX payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute STX transfer from unique address to merchant
   * This is called after contract settlement to move the actual funds
   */
  async executeSTXTransfer(
    fromAddress: string, 
    toAddress: string, 
    amount: number, 
    encryptedPrivateKey: string,
    paymentId: string
  ): Promise<ContractResult> {
    try {
      console.log(`🔄 Executing STX transfer: ${amount} microSTX from ${fromAddress} to ${toAddress}`);
      
      // Decrypt private key for the unique address
      const privateKey = this.decryptPrivateKey(encryptedPrivateKey, paymentId);
      const senderKey = privateKey;
      
      // Create STX transfer transaction
      // Truncate payment ID to fit 34-byte memo limit ("Pay: " = 5 bytes, leaving 29 for ID)
      const truncatedPaymentId = paymentId.substring(0, 29);
      const transferTx = await makeSTXTokenTransfer({
        recipient: toAddress,
        amount: amount,
        senderKey,
        network: this.network,
        memo: `Pay: ${truncatedPaymentId}`
      });
      
      const broadcastResponse = await broadcastTransaction({ transaction: transferTx, network: this.network });

      if ('error' in broadcastResponse) {
        console.error('❌ STX transfer broadcast failed!');
        console.error('Error field:', (broadcastResponse as any).error);
        console.error('Reason field:', (broadcastResponse as any).reason);
        console.error('Message field:', (broadcastResponse as any).message);
        console.error('All keys:', Object.keys(broadcastResponse));
        console.error('Full response:', JSON.stringify(broadcastResponse, null, 2));
        throw new Error(`STX transfer failed: ${(broadcastResponse as any).error || (broadcastResponse as any).reason || 'transaction rejected'}`);
      }
      
      console.log(`✅ STX transfer executed successfully. TxID: ${(broadcastResponse as any).txid}`);
      
      return {
        success: true,
        txId: (broadcastResponse as any).txid
      };
    } catch (error) {
      console.error('❌ Failed to execute STX transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Read payment data from contract
   */
  async getPaymentData(paymentId: string): Promise<any> {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-payment',
        functionArgs: [
          Cl.stringAscii(paymentId)
        ],
        network: this.network,
        senderAddress: this.contractAddress,
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to read payment data:', error);
      throw error;
    }
  }

  /**
   * Read contract statistics
   */
  async getContractStats(): Promise<any> {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-contract-stats',
        functionArgs: [],
        network: this.network,
        senderAddress: this.contractAddress,
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to read contract stats:', error);
      throw error;
    }
  }

  /**
   * Encrypt private key for secure storage
   * Uses payment ID as additional entropy for encryption
   */
  private encryptPrivateKey(privateKey: string, paymentId: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(
        process.env.ENCRYPTION_SECRET || 'default-secret-change-in-production', 
        paymentId, 
        32
      );
      
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      
      let encrypted = cipher.update(privateKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('❌ Failed to encrypt private key:', error);
      throw new Error('Private key encryption failed');
    }
  }

  /**
   * Decrypt private key for transaction signing
   */
  private decryptPrivateKey(encryptedPrivateKey: string, paymentId: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(
        process.env.ENCRYPTION_SECRET || 'default-secret-change-in-production', 
        paymentId, 
        32
      );
      
      const [ivHex, authTagHex, encryptedHex] = encryptedPrivateKey.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = encryptedHex;
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('❌ Failed to decrypt private key:', error);
      throw new Error('Private key decryption failed');
    }
  }

  /**
   * Get contract identifier for Chainhook configuration
   */
  getContractIdentifier(): string {
    return `${this.contractAddress}.${this.contractName}`;
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      network: this.network,
      isMainnet: this.network === STACKS_MAINNET,
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      contractIdentifier: this.getContractIdentifier()
    };
  }
}

// Export singleton instance
export const stxContractService = new STXContractService();
export default stxContractService;