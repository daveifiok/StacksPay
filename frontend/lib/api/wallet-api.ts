import { apiClient } from './auth-api';

export interface WalletBalances {
  stxBalance: { amount: string; lastUpdated: Date };
  btcBalance: { amount: string; lastUpdated: Date };
  sbtcBalance: { amount: string; lastUpdated: Date };
}

export interface WalletAddresses {
  stacksAddress?: string;
  bitcoinAddress?: string;
}

export interface WalletData {
  addresses: WalletAddresses;
  balances: WalletBalances;
  walletType?: string;
  lastConnected?: Date;
}

export interface UpdateWalletAddressesRequest {
  stacksAddress?: string;
  bitcoinAddress?: string;
  walletType?: string;
}

export interface UpdateWalletBalancesRequest {
  stxBalance?: string;
  btcBalance?: string;
  sbtcBalance?: string;
}

export interface UpdateCompleteWalletDataRequest extends UpdateWalletAddressesRequest, UpdateWalletBalancesRequest {}

/**
 * Wallet API Client - Frontend service for wallet data management
 * 
 * This client handles:
 * 1. Updating wallet addresses after wallet connection
 * 2. Updating wallet balances from blockchain services
 * 3. Retrieving wallet data for display in settings/dashboard
 */
class WalletApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  }

  /**
   * Update merchant wallet addresses
   */
  async updateWalletAddresses(data: UpdateWalletAddressesRequest): Promise<{
    success: boolean;
    data?: {
      stacksAddress?: string;
      bitcoinAddress?: string;
      walletType?: string;
      lastConnected?: Date;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/wallet/addresses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating wallet addresses:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update wallet addresses',
      };
    }
  }

  /**
   * Update merchant wallet balances
   */
  async updateWalletBalances(data: UpdateWalletBalancesRequest): Promise<{
    success: boolean;
    data?: WalletBalances;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/wallet/balances`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating wallet balances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update wallet balances',
      };
    }
  }

  /**
   * Get merchant wallet data
   */
  async getWalletData(): Promise<{
    success: boolean;
    data?: WalletData;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/wallet/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting wallet data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get wallet data',
      };
    }
  }

  /**
   * Update complete wallet data (addresses + balances)
   */
  async updateCompleteWalletData(data: UpdateCompleteWalletDataRequest): Promise<{
    success: boolean;
    data?: {
      addresses: WalletAddresses;
      balances: WalletBalances;
      walletType?: string;
      lastConnected?: Date;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/wallet/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating complete wallet data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update wallet data',
      };
    }
  }

  /**
   * Check if wallet balances need to be refreshed
   */
  async shouldRefreshBalances(): Promise<{
    success: boolean;
    data?: {
      shouldRefresh: boolean;
      lastUpdated?: {
        stx: Date;
        btc: Date;
        sbtc: Date;
      };
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/wallet/refresh-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking refresh status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check refresh status',
      };
    }
  }

  /**
   * Fetch balances from wallet and sBTC services and update backend
   * This method combines frontend service calls with backend updates
   */
  async refreshWalletBalances(): Promise<{
    success: boolean;
    data?: WalletBalances;
    error?: string;
  }> {
    try {
      // Import wallet and sBTC services
      const { walletService } = await import('@/lib/services/wallet-service');
      const { sbtcService } = await import('@/lib/services/sbtc-service');

      // Get current wallet data
      const currentWalletData = await walletService.getCurrentWalletData();
      if (!currentWalletData) {
        return {
          success: false,
          error: 'No wallet connected',
        };
      }

      const balanceUpdates: UpdateWalletBalancesRequest = {};

      // Fetch STX balance using wallet service
      try {
        const stxBalanceMicroStx = await walletService.getStxBalance();
        // Convert from microSTX to STX (1 STX = 1,000,000 microSTX)
        const stxBalanceStx = Number(stxBalanceMicroStx) / 1000000;
        balanceUpdates.stxBalance = stxBalanceStx.toString();
        console.log('STX balance fetched - microSTX:', stxBalanceMicroStx.toString(), 'STX:', stxBalanceStx);
      } catch (error) {
        console.warn('Failed to fetch STX balance:', error);
        balanceUpdates.stxBalance = '0';
      }

      // Fetch sBTC balance using sbtc service
      try {
        const sbtcBalanceResponse = await sbtcService.getSbtcBalance(currentWalletData.address);
        balanceUpdates.sbtcBalance = sbtcBalanceResponse.balanceMicroSbtc;
        console.log('sBTC balance fetched:', sbtcBalanceResponse.balanceMicroSbtc);
      } catch (error) {
        console.warn('Failed to fetch sBTC balance (this is normal on testnet):', error);
        balanceUpdates.sbtcBalance = '0';
      }

      // Fetch BTC balance using UTXOs from sbtc service
      try {
        const bitcoinAddress = await walletService.getCurrentBitcoinAddress();
        if (bitcoinAddress) {
          console.log('Fetching UTXOs for Bitcoin address:', bitcoinAddress);
          const utxos = await sbtcService.getUtxos(bitcoinAddress);
          // Calculate total BTC balance from UTXOs
          const totalSatoshis = utxos.reduce((total, utxo) => {
            return total + (utxo.value || 0);
          }, 0);
          const btcBalance = (totalSatoshis / 100000000).toString(); // Convert satoshis to BTC
          balanceUpdates.btcBalance = btcBalance;
          console.log('BTC balance calculated from UTXOs:', btcBalance);
        } else {
          console.warn('No Bitcoin address available for UTXO fetching');
          balanceUpdates.btcBalance = '0';
        }
      } catch (error) {
        console.warn('Failed to fetch BTC balance:', error);
        balanceUpdates.btcBalance = '0';
      }

      // Update backend with new balances
      const result = await this.updateWalletBalances(balanceUpdates);
      return result;

    } catch (error) {
      console.error('Error refreshing wallet balances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh wallet balances',
      };
    }
  }

  /**
   * Sync wallet connection data with backend
   * Call this after wallet connection to update addresses
   */
  async syncWalletConnection(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { walletService } = await import('@/lib/services/wallet-service');
      
      const walletData = await walletService.getCurrentWalletData();
      if (!walletData) {
        return {
          success: false,
          error: 'No wallet connected',
        };
      }

      // Get Bitcoin address using the wallet service method
      const bitcoinAddress = await walletService.getCurrentBitcoinAddress();

      // Refresh balances first to get the latest data
      console.log('Refreshing wallet balances...');
      const balanceResult = await this.refreshWalletBalances();
      
      const updateData: UpdateCompleteWalletDataRequest = {
        stacksAddress: walletData.address,
        walletType: walletData.walletType,
      };

      if (bitcoinAddress) {
        updateData.bitcoinAddress = bitcoinAddress;
      }

      // Add balances to the update if refresh was successful
      if (balanceResult.success && balanceResult.data) {
        updateData.stxBalance = balanceResult.data.stxBalance.amount;
        updateData.btcBalance = balanceResult.data.btcBalance.amount;
        updateData.sbtcBalance = balanceResult.data.sbtcBalance.amount;
        console.log('Including balance data in sync:', {
          stx: updateData.stxBalance,
          btc: updateData.btcBalance,
          sbtc: updateData.sbtcBalance
        });
      } else {
        console.warn('Balance refresh failed, syncing addresses only');
      }

      const result = await this.updateCompleteWalletData(updateData);
      
      if (result.success) {
        console.log('✅ Wallet connection synced successfully');
      } else {
        console.error('❌ Failed to sync wallet connection:', result.error);
      }

      return {
        success: result.success,
        error: result.error,
      };

    } catch (error) {
      console.error('Error syncing wallet connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync wallet connection',
      };
    }
  }

  /**
   * Get all wallet balances from frontend services
   * This method fetches balances without updating the backend
   */
  async getAllWalletBalances(): Promise<{
    success: boolean;
    data?: {
      stxBalance: string;
      btcBalance: string;
      sbtcBalance: string;
      addresses: {
        stacks: string;
        bitcoin?: string;
      };
    };
    error?: string;
  }> {
    try {
      const { walletService } = await import('@/lib/services/wallet-service');
      const { sbtcService } = await import('@/lib/services/sbtc-service');

      const currentWalletData = await walletService.getCurrentWalletData();
      if (!currentWalletData) {
        return {
          success: false,
          error: 'No wallet connected',
        };
      }

      const bitcoinAddress = await walletService.getCurrentBitcoinAddress();
      
      // Fetch all balances
      const [stxBalance, sbtcBalanceResponse, utxos] = await Promise.allSettled([
        walletService.getStxBalance(),
        sbtcService.getSbtcBalance(currentWalletData.address),
        bitcoinAddress ? sbtcService.getUtxos(bitcoinAddress) : Promise.resolve([])
      ]);

      // Process results
      const stx = stxBalance.status === 'fulfilled' 
        ? (Number(stxBalance.value) / 1000000).toString() // Convert microSTX to STX
        : '0';
      const sbtc = sbtcBalanceResponse.status === 'fulfilled' ? sbtcBalanceResponse.value.balanceMicroSbtc : '0';
      
      let btc = '0';
      if (utxos.status === 'fulfilled') {
        const totalSatoshis = utxos.value.reduce((total, utxo) => total + (utxo.value || 0), 0);
        btc = (totalSatoshis / 100000000).toString();
      }

      return {
        success: true,
        data: {
          stxBalance: stx,
          btcBalance: btc,
          sbtcBalance: sbtc,
          addresses: {
            stacks: currentWalletData.address,
            bitcoin: bitcoinAddress || undefined,
          },
        },
      };
    } catch (error) {
      console.error('Error getting wallet balances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get wallet balances',
      };
    }
  }
}

export const walletApiClient = new WalletApiClient();
export default walletApiClient;
