/**
 * Test file to verify wallet API client functionality
 * Run this in the browser console when wallet is connected
 */

import { walletApiClient } from '@/lib/api/wallet-api';

export const testWalletAPI = async () => {
  console.log('🧪 Testing Wallet API Client...');
  
  try {
    // Test 0: Test direct wallet service STX balance
    console.log('\n🔍 Test 0: Testing direct wallet service STX balance...');
    const { walletService } = await import('@/lib/services/wallet-service');
    try {
      const directStxBalance = await walletService.getStxBalance();
      console.log('✅ Direct STX balance (microSTX):', directStxBalance.toString());
      console.log('✅ Direct STX balance (STX):', (Number(directStxBalance) / 1000000).toString());
      
      const currentAddress = await walletService.getCurrentAddress();
      console.log('✅ Current wallet address:', currentAddress);
    } catch (error) {
      console.error('❌ Direct wallet service test failed:', error);
    }

    // Test 1: Get all wallet balances from frontend services
    console.log('\n📊 Test 1: Getting wallet balances from frontend services...');
    const balancesResult = await walletApiClient.getAllWalletBalances();
    
    if (balancesResult.success) {
      console.log('✅ Frontend balances retrieved successfully:');
      console.log('  STX Balance:', balancesResult.data?.stxBalance);
      console.log('  BTC Balance:', balancesResult.data?.btcBalance);
      console.log('  sBTC Balance:', balancesResult.data?.sbtcBalance);
      console.log('  Stacks Address:', balancesResult.data?.addresses.stacks);
      console.log('  Bitcoin Address:', balancesResult.data?.addresses.bitcoin);
    } else {
      console.error('❌ Failed to get frontend balances:', balancesResult.error);
      return;
    }

    // Test 2: Sync wallet connection (addresses + balances) with backend
    console.log('\n🔄 Test 2: Syncing wallet connection with backend...');
    const syncResult = await walletApiClient.syncWalletConnection();
    
    if (syncResult.success) {
      console.log('✅ Wallet connection synced with backend successfully');
    } else {
      console.error('❌ Failed to sync wallet connection:', syncResult.error);
    }

    // Test 3: Get wallet data from backend
    console.log('\n📥 Test 3: Getting wallet data from backend...');
    const backendDataResult = await walletApiClient.getWalletData();
    
    if (backendDataResult.success) {
      console.log('✅ Backend wallet data retrieved successfully:');
      console.log('  Addresses:', backendDataResult.data?.addresses);
      console.log('  Balances:', backendDataResult.data?.balances);
      console.log('  Wallet Type:', backendDataResult.data?.walletType);
      console.log('  Last Connected:', backendDataResult.data?.lastConnected);
    } else {
      console.error('❌ Failed to get backend wallet data:', backendDataResult.error);
    }

    // Test 4: Refresh balances only
    console.log('\n🔄 Test 4: Refreshing wallet balances...');
    const refreshResult = await walletApiClient.refreshWalletBalances();
    
    if (refreshResult.success) {
      console.log('✅ Wallet balances refreshed successfully:');
      console.log('  Updated balances:', refreshResult.data);
    } else {
      console.error('❌ Failed to refresh wallet balances:', refreshResult.error);
    }

    console.log('\n🎉 All wallet API tests completed!');
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
};

// Usage instructions
console.log(`
🧪 Wallet API Test Suite

To run tests:
1. Make sure you have a wallet connected
2. Open browser console
3. Run: testWalletAPI()

Or test individual functions:
- walletApiClient.getAllWalletBalances()
- walletApiClient.syncWalletConnection()
- walletApiClient.getWalletData()
- walletApiClient.refreshWalletBalances()
`);

// Make available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testWalletAPI = testWalletAPI;
  (window as any).walletApiClient = walletApiClient;
}

export default testWalletAPI;
