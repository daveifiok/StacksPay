/**
 * Debug Wallet Connection - Comprehensive wallet debugging
 * Use this in browser console to debug wallet connection issues
 */

const debugWalletConnection = async () => {
  console.log('🔍 Debugging Wallet Connection...');
  
  try {
    // Check wallet connection status
    const { isConnected, getLocalStorage } = await import('@stacks/connect');
    const { walletService } = await import('@/lib/services/wallet-service');
    
    console.log('📱 Wallet Connection Status:');
    const connected = await isConnected();
    console.log('  Connected:', connected);
    
    if (!connected) {
      console.error('❌ Wallet is not connected. Please connect your wallet first.');
      return;
    }
    
    // Get raw wallet data
    console.log('\n📦 Raw Wallet Data:');
    const rawWalletData = getLocalStorage();
    console.log('  Raw data:', JSON.stringify(rawWalletData, null, 2));
    
    // Test getCurrentWalletData
    console.log('\n🎯 Current Wallet Data (from service):');
    const currentWalletData = await walletService.getCurrentWalletData();
    console.log('  Service data:', currentWalletData);
    
    // Test getCurrentAddress
    console.log('\n📍 Current Stacks Address:');
    const stacksAddress = await walletService.getCurrentAddress();
    console.log('  Stacks address:', stacksAddress);
    
    // Test getCurrentBitcoinAddress
    console.log('\n₿ Current Bitcoin Address:');
    const bitcoinAddress = await walletService.getCurrentBitcoinAddress();
    console.log('  Bitcoin address:', bitcoinAddress);
    
    // Check what's actually in the addresses object
    if (rawWalletData?.addresses) {
      console.log('\n🏠 Available Addresses in Raw Data:');
      console.log('  Address keys:', Object.keys(rawWalletData.addresses));
      
      Object.entries(rawWalletData.addresses).forEach(([key, value]) => {
        console.log(`  ${key}:`, value);
      });
    }
    
    // Test different wallet structures
    console.log('\n🧪 Testing Different Address Extraction Methods:');
    
    if (rawWalletData?.addresses) {
      const methods = [
        () => (rawWalletData.addresses as any).stx?.[0]?.address,
        () => (rawWalletData.addresses as any).stx?.address,
        () => (rawWalletData.addresses as any).stx,
        () => (rawWalletData.addresses as any).btc?.[0]?.address,
        () => (rawWalletData.addresses as any).btc?.address,
        () => (rawWalletData.addresses as any).btc,
        () => (rawWalletData.addresses as any).bitcoin?.address,
        () => (rawWalletData.addresses as any).bitcoin?.[0]?.address,
        () => (rawWalletData.addresses as any).bitcoin,
      ];
      
      methods.forEach((method, index) => {
        try {
          const result = method();
          console.log(`  Method ${index + 1}:`, result);
        } catch (error) {
          console.log(`  Method ${index + 1}: Error -`, (error as Error).message);
        }
      });
    }
    
    // Test STX balance
    console.log('\n💰 STX Balance Test:');
    try {
      const stxBalance = await walletService.getStxBalance();
      console.log('  STX balance (microSTX):', stxBalance.toString());
      console.log('  STX balance (STX):', (Number(stxBalance) / 1000000).toString());
    } catch (error) {
      console.error('  STX balance error:', error);
    }
    
    // Check network
    console.log('\n🌐 Network Info:');
    const networkInfo = walletService.getNetworkInfo();
    console.log('  Network info:', networkInfo);
    
    // Check if this is a testnet vs mainnet issue
    if (stacksAddress && stacksAddress.startsWith('ST')) {
      console.log('  ✅ Testnet address detected');
    } else if (stacksAddress && stacksAddress.startsWith('SP')) {
      console.log('  ✅ Mainnet address detected');
    }
    
    console.log('\n✅ Wallet debugging complete!');
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  }
};

// Test wallet API client
const debugWalletAPI = async () => {
  console.log('🔧 Testing Wallet API Client...');
  
  try {
    const { walletApiClient } = await import('@/lib/api/wallet-api');
    
    console.log('\n📊 Testing getAllWalletBalances:');
    const balancesResult = await walletApiClient.getAllWalletBalances();
    console.log('  Result:', balancesResult);
    
  } catch (error) {
    console.error('💥 Wallet API test error:', error);
  }
};

// Make available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).debugWalletConnection = debugWalletConnection;
  (window as any).debugWalletAPI = debugWalletAPI;
}

console.log(`
🔍 Wallet Connection Debugger

To debug wallet connection issues:
1. Connect your wallet first
2. Open browser console
3. Run: debugWalletConnection()
4. Run: debugWalletAPI()

This will show:
- Raw wallet data structure
- Address extraction methods
- Network configuration
- Balance fetching results
- Detailed error information
`);

export { debugWalletConnection, debugWalletAPI };
