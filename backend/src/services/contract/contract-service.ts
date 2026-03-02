import {
  fetchCallReadOnlyFunction,
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
  uintCV,
  stringAsciiCV,
  stringUtf8CV,
  type ClarityValue,
} from '@stacks/transactions';
import { buildSbtcDepositTx, MAINNET, TESTNET } from 'sbtc';
import { STACKS_MAINNET, STACKS_TESTNET, type StacksNetwork } from '@stacks/network';
import { ContractCallData, PaymentContractState } from '@/interfaces/contract/contract.interface';
import { CoinGeckoPriceResponse } from '@/interfaces/wallet/wallet.interface';
import { webhookService } from '../webhook/webhook-service';



/**
 * Enterprise-grade Contract Service
 * Handles smart contract interactions for payment processing
 */
export class ContractService {
  private network: StacksNetwork;
  private networkType: 'mainnet' | 'testnet';

  constructor() {
    this.networkType = (process.env.STACKS_NETWORK as 'mainnet' | 'testnet') || 'testnet';
    this.network = this.networkType === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
  }

  /**
   * Create Clarity values for contract calls
   */
  clarity = {
    uint: (value: bigint | number): ClarityValue => uintCV(BigInt(value)),
    int: (value: bigint | number): ClarityValue => intCV(BigInt(value)),
    buffer: (value: Uint8Array | Buffer | string): ClarityValue => {
      if (typeof value === 'string') {
        return bufferCV(Buffer.from(value, 'utf8'));
      }
      return bufferCV(value);
    },
    stringAscii: (value: string): ClarityValue => stringAsciiCV(value),
    stringUtf8: (value: string): ClarityValue => stringUtf8CV(value),
    principal: (value: string): ClarityValue => standardPrincipalCV(value),
    contractPrincipal: (address: string, name: string): ClarityValue => contractPrincipalCV(address, name),
    tuple: (data: Record<string, ClarityValue>): ClarityValue => tupleCV(data),
    list: (items: ClarityValue[]): ClarityValue => listCV(items),
    some: (value: ClarityValue): ClarityValue => someCV(value),
    none: (): ClarityValue => noneCV(),
    true: (): ClarityValue => trueCV(),
    false: (): ClarityValue => falseCV(),
  };

  /**
   * Read contract state
   */
  async readContract(options: ContractCallData): Promise<any> {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: options.contractAddress,
        contractName: options.contractName,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        network: this.network,
        senderAddress: options.senderAddress || '',
      });

      return result;
    } catch (error) {
      console.error('Error reading contract:', error);
      throw new Error(`Failed to read contract: ${error}`);
    }
  }

  /**
   * Get payment details from contract
   */
  async getPaymentDetails(paymentId: string): Promise<PaymentContractState | null> {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS!.split('.')[0];
      const contractName = process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS!.split('.')[1];

      const result = await this.readContract({
        contractAddress,
        contractName,
        functionName: 'get-payment-details',
        functionArgs: [this.clarity.stringAscii(paymentId)],
      });

      if (result.type === 'ok' && result.value.type === 'some') {
        const paymentData = result.value.value.data;
        const contractState = {
          merchantAddress: paymentData['merchant-address'].value,
          paymentAmount: BigInt(paymentData['payment-amount'].value),
          paymentStatus: paymentData['payment-status'].value as 'pending' | 'completed' | 'failed' | 'refunded',
          stxAmount: paymentData['stx-amount'] ? BigInt(paymentData['stx-amount'].value) : undefined,
          sbtcAmount: paymentData['sbtc-amount'] ? BigInt(paymentData['sbtc-amount'].value) : undefined,
          conversionRate: paymentData['conversion-rate'] ? Number(paymentData['conversion-rate'].value) : undefined,
          timestamp: Number(paymentData.timestamp.value),
        };

        // Trigger webhook for payment state query
        await webhookService.triggerWebhook({
          urls: { webhook: `https://api.system.com/contracts` },
          _id: `payment_state_${paymentId}`,
          type: 'contract_state',
          data: {
            paymentId,
            contractState,
            action: 'payment_details_queried',
          },
          metadata: { 
            provider: 'contract_service',
            contractAddress: `${contractAddress}.${contractName}`,
          }
        }, 'contract.payment.queried');

        return contractState;
      }

      return null;
    } catch (error) {
      console.error('Error getting payment details:', error);
      return null;
    }
  }

  /**
   * Get merchant sBTC balance
   */
  async getMerchantSbtcBalance(merchantAddress: string): Promise<bigint> {
    try {
      const sbtcContractAddress = process.env.NEXT_PUBLIC_SBTC_CONTRACT_ADDRESS!.split('.')[0];
      const sbtcContractName = process.env.NEXT_PUBLIC_SBTC_CONTRACT_ADDRESS!.split('.')[1];

      const result = await this.readContract({
        contractAddress: sbtcContractAddress,
        contractName: sbtcContractName,
        functionName: 'get-balance',
        functionArgs: [this.clarity.principal(merchantAddress)],
      });

      if (result.type === 'ok') {
        return BigInt(result.value.value);
      }

      return BigInt(0);
    } catch (error) {
      console.error('Error getting sBTC balance:', error);
      return BigInt(0);
    }
  }

  /**
   * Get STX to BTC conversion rate
   */
  async getStxToBtcRate(): Promise<number> {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS!.split('.')[0];
      const contractName = process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS!.split('.')[1];

      const result = await this.readContract({
        contractAddress,
        contractName,
        functionName: 'get-stx-btc-rate',
        functionArgs: [],
      });

      if (result.type === 'ok') {
        return Number(result.value.value) / 1000000; // Convert from micro-units
      }

      // Fallback to external API
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=btc');
      const data = (await response.json()) as CoinGeckoPriceResponse;
      return data.stacks?.btc || 0.000025;
    } catch (error) {
      console.error('Error getting STX to BTC rate:', error);
      return 0.000025; // Fallback rate
    }
  }

  /**
   * Calculate STX amount needed for USD payment
   */
  async calculateStxAmount(usdAmount: number): Promise<bigint> {
    try {
      const [stxRate, btcRate] = await Promise.all([
        this.getStxToBtcRate(),
        this.getBtcToUsdRate(),
      ]);

      const btcAmount = usdAmount / btcRate;
      const stxAmount = btcAmount / stxRate;

      return BigInt(Math.ceil(stxAmount * 1000000)); // Convert to microSTX
    } catch (error) {
      console.error('Error calculating STX amount:', error);
      throw new Error('Failed to calculate STX amount');
    }
  }

  /**
   * Get BTC to USD rate
   */
  async getBtcToUsdRate(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const data = (await response.json()) as CoinGeckoPriceResponse;
      return data.bitcoin?.usd || 45000;
    } catch (error) {
      console.error('Error getting BTC to USD rate:', error);
      return 45000; // Fallback rate
    }
  }

  /**
   * Validate payment contract state
   */
  async validatePaymentContract(): Promise<{
    isValid: boolean;
    contractAddress: string;
    contractExists: boolean;
    hasMethods: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];
    let contractExists = false;
    let hasMethods = false;

    try {
      const contractAddress = process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS!.split('.')[0];
      const contractName = process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS!.split('.')[1];

      // Check if contract exists
      try {
        await this.readContract({
          contractAddress,
          contractName,
          functionName: 'get-contract-info',
          functionArgs: [],
        });
        contractExists = true;
      } catch (error) {
        errors.push('Payment contract not found');
      }

      // Check if required methods exist
      try {
        await this.readContract({
          contractAddress,
          contractName,
          functionName: 'process-stx-payment',
          functionArgs: [
            this.clarity.uint(1000000),
            this.clarity.principal('SP000000000000000000002Q6VF78'),
            this.clarity.stringAscii('test'),
          ],
        });
        hasMethods = true;
      } catch (error) {
        errors.push('Required contract methods not found');
      }

      const validationResult = {
        isValid: contractExists && hasMethods,
        contractAddress: `${contractAddress}.${contractName}`,
        contractExists,
        hasMethods,
        errors: errors.length > 0 ? errors : undefined,
      };

      // Trigger webhook for contract validation
      await webhookService.triggerWebhook({
        urls: { webhook: `https://api.system.com/contracts` },
        _id: `contract_validation_${Date.now()}`,
        type: 'contract_validation',
        data: validationResult,
        metadata: { 
          provider: 'contract_service',
          critical: !validationResult.isValid,
        }
      }, validationResult.isValid ? 'contract.validation.success' : 'contract.validation.failed');

      return validationResult;
    } catch (error) {
      return {
        isValid: false,
        contractAddress: 'Unknown',
        contractExists: false,
        hasMethods: false,
        errors: ['Contract validation failed'],
      };
    }
  }

  /**
   * Create payment tracking data
   */
  createPaymentData(options: {
    paymentId: string;
    merchantAddress: string;
    amount: bigint;
    currency: 'STX' | 'BTC';
    conversionRate?: number;
  }): Record<string, ClarityValue> {
    return {
      'payment-id': this.clarity.stringAscii(options.paymentId),
      'merchant-address': this.clarity.principal(options.merchantAddress),
      'payment-amount': this.clarity.uint(options.amount),
      'payment-currency': this.clarity.stringAscii(options.currency),
      'conversion-rate': options.conversionRate 
        ? this.clarity.uint(Math.floor(options.conversionRate * 1000000))
        : this.clarity.none(),
      'timestamp': this.clarity.uint(Date.now()),
      'payment-status': this.clarity.stringAscii('pending'),
    };
  }

  /**
   * Build sBTC deposit transaction using alternative method
   * Note: This requires signer information from the sBTC protocol
   */
  async buildDepositTransaction(options: {
    amountSats: number;
    stacksAddress: string;
    signerPublicKey: string;
    reclaimPublicKey?: string;
    maxSignerFee?: number;
    reclaimLockTime?: number;
  }): Promise<any> {
    try {
      const transaction = await buildSbtcDepositTx({
        network: this.networkType === 'mainnet' ? MAINNET : TESTNET,
        amountSats: options.amountSats,
        stacksAddress: options.stacksAddress,
        signersPublicKey: options.signerPublicKey,
        reclaimPublicKey: options.reclaimPublicKey || options.signerPublicKey,
        maxSignerFee: options.maxSignerFee || 80000,
        reclaimLockTime: options.reclaimLockTime || 6000,
      });

      // Trigger webhook for successful transaction build
      await webhookService.triggerWebhook({
        urls: { webhook: `https://api.system.com/contracts` },
        _id: `sbtc_deposit_${Date.now()}`,
        type: 'sbtc_transaction',
        data: {
          transactionType: 'deposit',
          amountSats: options.amountSats,
          stacksAddress: options.stacksAddress,
          network: this.networkType,
          maxSignerFee: options.maxSignerFee || 80000,
        },
        metadata: { 
          provider: 'contract_service',
          action: 'deposit_transaction_built',
        }
      }, 'contract.sbtc.deposit.built');

      return transaction;
    } catch (error) {
      console.error('Error building deposit transaction:', error);
      throw new Error('Failed to build deposit transaction');
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      network: this.networkType,
      isMainnet: this.networkType === 'mainnet',
      stacksNetwork: this.network,
      contractAddress: process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS || '',
      sbtcContractAddress: process.env.NEXT_PUBLIC_SBTC_CONTRACT_ADDRESS || '',
    };
  }
}

// Create singleton instance
export const contractService = new ContractService();
