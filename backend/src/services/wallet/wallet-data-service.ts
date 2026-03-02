import { connectToDatabase } from "@/config/database";
import { IMerchant, Merchant } from "@/models/merchant/Merchant";


/**
 * Wallet Data Service - Backend service for managing merchant wallet data
 * 
 * This service handles:
 * 1. Storing wallet addresses from frontend wallet connections
 * 2. Updating wallet balances from frontend services
 * 3. Providing wallet data for settings and dashboard displays
 */
class WalletDataService {

  /**
   * Update merchant wallet addresses from frontend wallet connection
   */
  async updateWalletAddresses(
    merchantId: string,
    walletData: {
      stacksAddress?: string;
      bitcoinAddress?: string;
      walletType?: string;
    }
  ): Promise<{ success: boolean; merchant?: IMerchant; error?: string }> {
    try {
      await connectToDatabase();

      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      // Update connected wallet addresses
      if (walletData.stacksAddress) {
        merchant.connectedWallets = merchant.connectedWallets || {};
        merchant.connectedWallets.stacksAddress = walletData.stacksAddress;
        merchant.connectedWallets.lastConnected = new Date();
        
        // Also update the main stacksAddress field for backward compatibility
        merchant.stacksAddress = walletData.stacksAddress;
      }

      if (walletData.bitcoinAddress) {
        merchant.connectedWallets = merchant.connectedWallets || {};
        merchant.connectedWallets.bitcoinAddress = walletData.bitcoinAddress;
        merchant.connectedWallets.lastConnected = new Date();
        
        // Also update the main bitcoinAddress field for backward compatibility
        merchant.bitcoinAddress = walletData.bitcoinAddress;
      }

      if (walletData.walletType) {
        merchant.connectedWallets = merchant.connectedWallets || {};
        merchant.connectedWallets.walletType = walletData.walletType;
      }

      await merchant.save();

      return { success: true, merchant };
    } catch (error) {
      console.error('Error updating wallet addresses:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update wallet addresses' 
      };
    }
  }

  /**
   * Update merchant wallet balances from frontend services
   */
  async updateWalletBalances(
    merchantId: string,
    balances: {
      stxBalance?: string;
      btcBalance?: string;
      sbtcBalance?: string;
    }
  ): Promise<{ success: boolean; merchant?: IMerchant; error?: string }> {
    try {
      await connectToDatabase();

      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      // Initialize wallet balances if not present
      if (!merchant.walletBalances) {
        merchant.walletBalances = {
          stxBalance: { amount: '0', lastUpdated: new Date() },
          btcBalance: { amount: '0', lastUpdated: new Date() },
          sbtcBalance: { amount: '0', lastUpdated: new Date() },
        };
      }

      const now = new Date();

      // Update individual balances if provided
      if (balances.stxBalance !== undefined) {
        merchant.walletBalances.stxBalance = {
          amount: balances.stxBalance,
          lastUpdated: now,
        };
      }

      if (balances.btcBalance !== undefined) {
        merchant.walletBalances.btcBalance = {
          amount: balances.btcBalance,
          lastUpdated: now,
        };
      }

      if (balances.sbtcBalance !== undefined) {
        merchant.walletBalances.sbtcBalance = {
          amount: balances.sbtcBalance,
          lastUpdated: now,
        };
      }

      await merchant.save();

      return { success: true, merchant };
    } catch (error) {
      console.error('Error updating wallet balances:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update wallet balances' 
      };
    }
  }

  /**
   * Get merchant wallet data for frontend consumption
   */
  async getWalletData(merchantId: string): Promise<{
    success: boolean;
    data?: {
      addresses: {
        stacksAddress?: string;
        bitcoinAddress?: string;
      };
      balances: {
        stxBalance: { amount: string; lastUpdated: Date };
        btcBalance: { amount: string; lastUpdated: Date };
        sbtcBalance: { amount: string; lastUpdated: Date };
      };
      walletType?: string;
      lastConnected?: Date;
    };
    error?: string;
  }> {
    try {
      await connectToDatabase();

      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      // Prepare wallet data
      const walletData = {
        addresses: {
          stacksAddress: merchant.connectedWallets?.stacksAddress || merchant.stacksAddress,
          bitcoinAddress: merchant.connectedWallets?.bitcoinAddress || merchant.bitcoinAddress,
        },
        balances: {
          stxBalance: merchant.walletBalances?.stxBalance || { amount: '0', lastUpdated: new Date() },
          btcBalance: merchant.walletBalances?.btcBalance || { amount: '0', lastUpdated: new Date() },
          sbtcBalance: merchant.walletBalances?.sbtcBalance || { amount: '0', lastUpdated: new Date() },
        },
        walletType: merchant.connectedWallets?.walletType,
        lastConnected: merchant.connectedWallets?.lastConnected,
      };

      return { success: true, data: walletData };
    } catch (error) {
      console.error('Error getting wallet data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get wallet data' 
      };
    }
  }

  /**
   * Update wallet addresses and balances in one call (useful for login/registration)
   */
  async updateCompleteWalletData(
    merchantId: string,
    walletData: {
      stacksAddress?: string;
      bitcoinAddress?: string;
      walletType?: string;
      stxBalance?: string;
      btcBalance?: string;
      sbtcBalance?: string;
    }
  ): Promise<{ success: boolean; merchant?: IMerchant; error?: string }> {
    try {
      await connectToDatabase();

      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      const now = new Date();

      // Update addresses
      if (walletData.stacksAddress || walletData.bitcoinAddress || walletData.walletType) {
        merchant.connectedWallets = merchant.connectedWallets || {};
        
        if (walletData.stacksAddress) {
          merchant.connectedWallets.stacksAddress = walletData.stacksAddress;
          merchant.stacksAddress = walletData.stacksAddress;
        }
        
        if (walletData.bitcoinAddress) {
          merchant.connectedWallets.bitcoinAddress = walletData.bitcoinAddress;
          merchant.bitcoinAddress = walletData.bitcoinAddress;
        }
        
        if (walletData.walletType) {
          merchant.connectedWallets.walletType = walletData.walletType;
        }
        
        merchant.connectedWallets.lastConnected = now;
      }

      // Update balances
      if (walletData.stxBalance !== undefined || walletData.btcBalance !== undefined || walletData.sbtcBalance !== undefined) {
        if (!merchant.walletBalances) {
          merchant.walletBalances = {
            stxBalance: { amount: '0', lastUpdated: now },
            btcBalance: { amount: '0', lastUpdated: now },
            sbtcBalance: { amount: '0', lastUpdated: now },
          };
        }

        if (walletData.stxBalance !== undefined) {
          merchant.walletBalances.stxBalance = {
            amount: walletData.stxBalance,
            lastUpdated: now,
          };
        }

        if (walletData.btcBalance !== undefined) {
          merchant.walletBalances.btcBalance = {
            amount: walletData.btcBalance,
            lastUpdated: now,
          };
        }

        if (walletData.sbtcBalance !== undefined) {
          merchant.walletBalances.sbtcBalance = {
            amount: walletData.sbtcBalance,
            lastUpdated: now,
          };
        }
      }

      await merchant.save();

      return { success: true, merchant };
    } catch (error) {
      console.error('Error updating complete wallet data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update wallet data' 
      };
    }
  }

  /**
   * Check if wallet balances need to be refreshed (older than 5 minutes)
   */
  async shouldRefreshBalances(merchantId: string): Promise<{
    shouldRefresh: boolean;
    lastUpdated?: {
      stx: Date;
      btc: Date;
      sbtc: Date;
    };
  }> {
    try {
      await connectToDatabase();

      const merchant = await Merchant.findById(merchantId);
      if (!merchant || !merchant.walletBalances) {
        return { shouldRefresh: true };
      }

      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const lastUpdated = {
        stx: merchant.walletBalances.stxBalance?.lastUpdated || new Date(0),
        btc: merchant.walletBalances.btcBalance?.lastUpdated || new Date(0),
        sbtc: merchant.walletBalances.sbtcBalance?.lastUpdated || new Date(0),
      };

      const shouldRefresh = 
        lastUpdated.stx < fiveMinutesAgo ||
        lastUpdated.btc < fiveMinutesAgo ||
        lastUpdated.sbtc < fiveMinutesAgo;

      return { shouldRefresh, lastUpdated };
    } catch (error) {
      console.error('Error checking if balances need refresh:', error);
      return { shouldRefresh: true };
    }
  }
}

export const walletDataService = new WalletDataService();
export default walletDataService;
