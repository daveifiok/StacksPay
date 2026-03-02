import {
  connect,
  disconnect,
  isConnected,
  getLocalStorage,
  openContractCall,
  openSTXTransfer,
  type FinishedTxData,
} from '@stacks/connect';
import {
  standardPrincipalCV,
  contractPrincipalCV,
  tupleCV,
  listCV,
  someCV,
  noneCV,
  trueCV,
  falseCV,
  intCV,
  bufferCV,
  fetchCallReadOnlyFunction,
  type ClarityValue,
} from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { ContractCallOptions, WalletInfo, StxBalanceResponse } from '@/interfaces/wallet/wallet.interface';


/**
 * Enterprise-grade Stacks Wallet Service
 * Handles wallet connections, contract calls, and STX transfers
 */
export class WalletService {
  private network: 'mainnet' | 'testnet';

  constructor() {
    this.network = (process.env.STACKS_NETWORK as 'mainnet' | 'testnet') || 'testnet';
  }

  /**
   * Connect to a Stacks wallet
   */
  async connectWallet(appDetails?: {
    name: string;
    icon: string;
  }): Promise<WalletInfo> {
    try {
      console.log("Starting wallet connection...");
      const response = await connect();
      console.log("Wallet connection response:", response);

      const userData = getLocalStorage();
      console.log("User Data:", userData);
      
      // Helper to safely access wallet response
      const getWalletAddresses = (response: any) => {
        return {
          stx: response?.addresses?.stx?.[0]?.address,
          btc: response?.addresses?.btc?.[0]?.address
        };
      };

      const { stx, btc } = getWalletAddresses(userData);
      console.log("Extracted addresses:", { stx, btc });
      
      if (stx && btc) {
        return {
          address: stx,
          publicKey: (userData as any)?.profile?.publicKey || (userData as any)?.publicKey || '',
          profile: (userData as any)?.profile || userData,
          isConnected: true,
        };
      } else {
        throw new Error("Failed to retrieve wallet addresses");
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw new Error('Failed to connect wallet');
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    try {
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw new Error('Failed to disconnect wallet');
    }
  }

  /**
   * Check if wallet is connected
   */
  async checkConnection(): Promise<boolean> {
    try {
      return await isConnected();
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }

  /**
   * Get current wallet address
   */
  async getCurrentAddress(): Promise<string | null> {
    try {
      if (!isConnected()) {
        return null;
      }

      const userData = getLocalStorage();
      
      // Helper to safely access wallet response
      const getWalletAddresses = (response: any) => {
        return {
          stx: response?.addresses?.stx?.[0]?.address,
          btc: response?.addresses?.btc?.[0]?.address
        };
      };

      const { stx } = getWalletAddresses(userData);
      return stx || null;
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  }

  /**
   * Get user data from connected wallet
   */
  async getUserData(): Promise<any> {
    try {
      // Use getLocalStorage() instead of deprecated getUserData()
      return getLocalStorage();
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Open contract call in wallet
   */
  async openContractCall(options: ContractCallOptions): Promise<FinishedTxData> {
    return new Promise((resolve, reject) => {
      openContractCall({
        contractAddress: options.contractAddress,
        contractName: options.contractName,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        network: this.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET,
        onFinish: (data) => {
          console.log('Contract call finished:', data);
          resolve(data);
        },
        onCancel: () => {
          console.log('User cancelled contract call');
          reject(new Error('User cancelled contract call'));
        },
      });
    });
  }

  /**
   * Open STX transfer in wallet
   */
  async openSTXTransfer(options: {
    recipient: string;
    amount: bigint;
    memo?: string;
  }): Promise<FinishedTxData> {
    return new Promise((resolve, reject) => {
      openSTXTransfer({
        recipient: options.recipient,
        amount: options.amount,
        memo: options.memo,
        network: this.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET,
        onFinish: (data) => {
          console.log('STX transfer finished:', data);
          resolve(data);
        },
        onCancel: () => {
          console.log('User cancelled STX transfer');
          reject(new Error('User cancelled STX transfer'));
        },
      });
    });
  }

  /**
   * Read contract state
   */
  async readContractState(options: {
    contractAddress: string;
    contractName: string;
    functionName: string;
    functionArgs: ClarityValue[];
    senderAddress?: string;
  }): Promise<any> {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: options.contractAddress,
        contractName: options.contractName,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        network: this.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET,
        senderAddress: options.senderAddress || '',
      });

      return result;
    } catch (error) {
      console.error('Error reading contract state:', error);
      throw new Error('Failed to read contract state');
    }
  }

  /**
   * Create Clarity values for contract calls
   */
  createClarityValues() {
    return {
      uint: (value: bigint | number) => intCV(value),
      int: (value: bigint | number) => intCV(value),
      buffer: (value: Uint8Array | Buffer) => bufferCV(value),
      string: (value: string) => standardPrincipalCV(value),
      principal: (value: string) => standardPrincipalCV(value),
      contractPrincipal: (address: string, name: string) => contractPrincipalCV(address, name),
      tuple: (data: Record<string, ClarityValue>) => tupleCV(data),
      list: (items: ClarityValue[]) => listCV(items),
      some: (value: ClarityValue) => someCV(value),
      none: () => noneCV(),
      true: () => trueCV(),
      false: () => falseCV(),
    };
  }

  /**
   * Process STX to sBTC payment
   */
  async processStxPayment(options: {
    amount: bigint;
    merchantAddress: string;
    paymentId: string;
  }): Promise<FinishedTxData> {
    try {
      const clarity = this.createClarityValues();
      
      const result = await this.openContractCall({
        contractAddress: process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS!.split('.')[0],
        contractName: process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS!.split('.')[1],
        functionName: 'process-stx-payment',
        functionArgs: [
          clarity.uint(options.amount),
          clarity.principal(options.merchantAddress),
          clarity.string(options.paymentId),
        ],
      });

      return result;
    } catch (error) {
      console.error('Error processing STX payment:', error);
      throw new Error('Failed to process STX payment');
    }
  }

  /**
   * Get STX balance for connected wallet
   */
  async getStxBalance(): Promise<bigint> {
    try {
      const address = await this.getCurrentAddress();
      if (!address) {
        throw new Error('No wallet connected');
      }

      // Use the better API endpoint (v2)
      const apiUrl = this.network === 'mainnet' 
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so';

      const response = await fetch(`${apiUrl}/extended/v2/addresses/${address}/balances/stx?include_mempool=false`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json() as StxBalanceResponse;
      console.log("STX Balance Response:", data);
      
      // Return balance in microSTX
      return BigInt(data.balance || '0');
    } catch (error) {
      console.error('Error getting STX balance:', error);
      throw new Error('Failed to get STX balance');
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      network: this.network,
      isMainnet: this.network === 'mainnet',
      stacksApiUrl: this.network === 'mainnet' 
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so',
    };
  }

  /**
   * Verify message signature for Stacks wallet
   */
  async verifyMessage(options: {
    message: string;
    signature: string;
    publicKey: string;
    address: string;
  }): Promise<boolean> {
    try {
      // Import verifyMessageSignature from @stacks/encryption
      const { verifyMessageSignature } = await import('@stacks/encryption');
      
      const isValid = verifyMessageSignature({
        message: options.message,
        publicKey: options.publicKey,
        signature: options.signature,
      });

      return isValid;
    } catch (error) {
      console.error('Error verifying message signature:', error);
      return false;
    }
  }

  /**
   * Authorize STX payment with wallet signature
   */
  async authorizeStxPayment(options: {
    paymentId: string;
    amount: number;
    recipient: string;
    message?: string;
  }): Promise<{ success: boolean; txId?: string; error?: string }> {
    try {
      const address = await this.getCurrentAddress();
      if (!address) {
        return { success: false, error: 'No wallet connected' };
      }

      // Check if user has sufficient balance
      const balance = await this.getStxBalance();
      const amountMicroStx = BigInt(Math.round(options.amount * 1000000));
      
      if (balance < amountMicroStx) {
        return { success: false, error: 'Insufficient STX balance' };
      }

      // Execute STX transfer
      const result = await this.openSTXTransfer({
        recipient: options.recipient,
        amount: amountMicroStx,
        memo: options.message || `Payment ${options.paymentId}`,
      });

      return {
        success: true,
        txId: result.txId,
      };

    } catch (error) {
      console.error('Error authorizing STX payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment authorization failed',
      };
    }
  }

  /**
   * Validate Stacks address format
   */
  isValidStacksAddress(address: string): boolean {
    // Stacks addresses: SP/SM + 39 characters for mainnet, ST + 39 characters for testnet
    const mainnetPattern = /^S[PM][0-9A-Z]{39}$/;
    const testnetPattern = /^ST[0-9A-Z]{39}$/;
    
    return mainnetPattern.test(address) || testnetPattern.test(address);
  }
}

// Create singleton instance
export const walletService = new WalletService();
