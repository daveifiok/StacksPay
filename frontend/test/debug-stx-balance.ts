/**
 * Debug STX Balance - Simple test to check STX balance conversion
 * Use this in browser console to debug STX balance issues
 */

export const debugStxBalance = async () => {
  console.log('🔍 Debugging STX Balance...');
  
  try {
    const { walletService } = await import('@/lib/services/wallet-service');
    
    // Check if wallet is connected
    const currentAddress = await walletService.getCurrentAddress();
    if (!currentAddress) {
      console.error('❌ No wallet connected');
      return;
    }
    
    console.log('✅ Wallet address:', currentAddress);
    
    // Get network info
    const networkInfo = walletService.getNetworkInfo();
    console.log('🌐 Network info:', networkInfo);
    
    // Test the direct API call
    const apiUrl = networkInfo.isMainnet 
      ? 'https://api.hiro.so'
      : 'https://api.testnet.hiro.so';
    
    const apiEndpoint = `${apiUrl}/extended/v2/addresses/${currentAddress}/balances/stx?include_mempool=false`;
    console.log('🔗 API endpoint:', apiEndpoint);
    
    const response = await fetch(apiEndpoint);
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📡 Raw API response:', data);
    
    // Parse the balance
    const balanceMicroStx = data.balance || '0';
    const balanceStx = Number(balanceMicroStx) / 1000000;
    
    console.log('💰 Balance breakdown:');
    console.log('  Raw balance (microSTX):', balanceMicroStx);
    console.log('  Converted balance (STX):', balanceStx);
    console.log('  Formatted balance:', balanceStx.toFixed(6), 'STX');
    
    // Test the wallet service method
    console.log('\n🔧 Testing wallet service method...');
    const walletServiceBalance = await walletService.getStxBalance();
    console.log('  Wallet service result (microSTX):', walletServiceBalance.toString());
    console.log('  Wallet service result (STX):', (Number(walletServiceBalance) / 1000000).toFixed(6));
    
    // Check other balance fields
    if (data.total_received) {
      console.log('📈 Additional balance info:');
      console.log('  Total received (microSTX):', data.total_received);
      console.log('  Total received (STX):', (Number(data.total_received) / 1000000).toFixed(6));
    }
    
    if (data.locked && Number(data.locked) > 0) {
      console.log('🔒 Locked balance (microSTX):', data.locked);
      console.log('🔒 Locked balance (STX):', (Number(data.locked) / 1000000).toFixed(6));
    }
    
    console.log('\n✅ STX Balance debugging complete!');
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  }
};

// Make available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).debugStxBalance = debugStxBalance;
}

console.log(`
🔍 STX Balance Debugger

To debug STX balance issues:
1. Open browser console
2. Make sure wallet is connected
3. Run: debugStxBalance()

This will show:
- Current wallet address
- Network configuration  
- Raw API response from Hiro
- Balance conversion from microSTX to STX
- Wallet service method results
`);

export default debugStxBalance;
