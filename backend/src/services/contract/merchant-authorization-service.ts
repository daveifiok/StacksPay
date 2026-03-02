import { stxContractService } from './stx-contract-service';
import { createLogger } from '@/utils/logger';

const logger = createLogger('MerchantAuthorizationService');

/**
 * Merchant Authorization Service
 *
 * Automatically authorizes merchants in the smart contract during onboarding
 */
export class MerchantAuthorizationService {
  private authorizationQueue: Map<string, Promise<any>> = new Map();
  private authorizedCache: Set<string> = new Set([
    // Pre-populate with known authorized merchants to avoid repeated authorization attempts
    'SP2SN70HVEE9V5FJ9ENZN80DE5J8BN65DZF3SA4K4' // TODO: Remove once on-chain check is working reliably
  ]);

  /**
   * Auto-authorize a merchant if not already authorized
   * This is called during merchant onboarding or first payment creation
   */
  async ensureMerchantAuthorized(
    merchantAddress: string,
    feeRate: number = 100 // Default 1% fee
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    try {
      // Check if already authorized in cache
      if (this.authorizedCache.has(merchantAddress)) {
        logger.info(`✅ Merchant ${merchantAddress} already authorized (cached)`);
        return { success: true };
      }

      // Check if already being authorized
      const existingAuth = this.authorizationQueue.get(merchantAddress);
      if (existingAuth) {
        logger.info(`⏳ Merchant ${merchantAddress} authorization already in progress`);
        return await existingAuth;
      }

      // Check on-chain if merchant is already authorized
      const isAuthorized = await this.checkMerchantAuthorized(merchantAddress);
      if (isAuthorized) {
        logger.info(`✅ Merchant ${merchantAddress} already authorized on-chain`);
        this.authorizedCache.add(merchantAddress);
        return { success: true };
      }

      // Start authorization process
      logger.info(`🔐 Auto-authorizing merchant: ${merchantAddress} with ${feeRate / 100}% fee`);

      const authPromise = this.authorizeMerchant(merchantAddress, feeRate);
      this.authorizationQueue.set(merchantAddress, authPromise);

      try {
        const result = await authPromise;

        if (result.success) {
          this.authorizedCache.add(merchantAddress);
          logger.info(`✅ Merchant ${merchantAddress} authorized. TxID: ${result.txId}`);
        } else {
          logger.error(`❌ Failed to authorize merchant ${merchantAddress}: ${result.error}`);
        }

        return result;
      } finally {
        this.authorizationQueue.delete(merchantAddress);
      }

    } catch (error) {
      logger.error(`Error in ensureMerchantAuthorized for ${merchantAddress}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if merchant is authorized on-chain
   */
  private async checkMerchantAuthorized(merchantAddress: string): Promise<boolean> {
    try {
      // Direct HTTP call to check authorization
      const fetch = (await import('node-fetch')).default;
      const CONTRACT_ADDRESS = 'SP328EHAG4RB6MYQMBH9Z0WVTE02HD5N50MQJXHFZ';
      const CONTRACT_NAME = 'stackspay-stx-gateway';

      // Convert address to hex format for API call
      const transactions = require('@stacks/transactions');
      const addressCV = transactions.Cl.standardPrincipal(merchantAddress);
      const addressHex = transactions.cvToHex(addressCV);

      const response = await fetch(`https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/is-merchant-authorized`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: CONTRACT_ADDRESS,
          arguments: [addressHex]
        })
      });

      const data = await response.json();

      // Parse the Clarity result - (ok true) = 0x0703 or similar
      // (ok false) = 0x04
      // We're looking for a truthy response
      const resultHex = data.result;
      return resultHex !== '0x04' && resultHex !== '0x0703' && resultHex.includes('03');
    } catch (error) {
      logger.error(`Error checking merchant authorization:`, error);
      // On error, assume not authorized to trigger authorization
      return false;
    }
  }

  /**
   * Authorize merchant on the smart contract
   */
  private async authorizeMerchant(
    merchantAddress: string,
    feeRate: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    try {
      // Import dynamically to avoid circular dependencies
      const { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, Cl } = require('@stacks/transactions');
      const { STACKS_TESTNET } = require('@stacks/network');

      const CONTRACT_ADDRESS = 'SP328EHAG4RB6MYQMBH9Z0WVTE02HD5N50MQJXHFZ';
      const CONTRACT_NAME = 'stackspay-stx-gateway';
      const BACKEND_PRIVATE_KEY = process.env.STX_BACKEND_PRIVATE_KEY;

      if (!BACKEND_PRIVATE_KEY) {
        throw new Error('Backend private key not configured');
      }

      // Call authorize-merchant on the contract
      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'authorize-merchant',
        functionArgs: [
          Cl.standardPrincipal(merchantAddress),
          Cl.uint(feeRate)
        ],
        senderKey: BACKEND_PRIVATE_KEY,
        network: STACKS_TESTNET,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction({
        transaction,
        network: STACKS_TESTNET
      });

      if ('error' in broadcastResponse) {
        throw new Error(`Authorization transaction failed: ${(broadcastResponse as any).error}`);
      }

      const txId = (broadcastResponse as any).txid;

      logger.info(`📝 Merchant authorization transaction broadcasted: ${txId}`);
      logger.info(`⏳ Authorization pending - transaction must confirm before merchant can accept payments`);

      // Return pending status - the merchant is NOT yet authorized on-chain
      return {
        success: false,
        txId,
        error: 'AUTHORIZATION_PENDING'
      };

    } catch (error) {
      logger.error('Failed to authorize merchant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear the authorization cache (for testing)
   */
  clearCache(): void {
    this.authorizedCache.clear();
    logger.info('Authorization cache cleared');
  }
}

// Export singleton instance
export const merchantAuthService = new MerchantAuthorizationService();
export default merchantAuthService;
