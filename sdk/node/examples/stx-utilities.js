/**
 * STX Utilities Example for sBTC Gateway Node.js SDK
 * 
 * This example demonstrates how to use STX utility functions
 * for amount conversion, validation, and formatting.
 */

import { STX, Currency, Address } from '@sbtc-gateway/node';

function main() {
  console.log('🔧 STX Utilities Demo\n');

  // === Amount Conversion ===
  console.log('💰 Amount Conversion:');
  
  // Convert STX to microSTX
  const stxAmount = 5.5;
  const microSTX = STX.toMicroSTX(stxAmount);
  console.log(`${stxAmount} STX = ${microSTX} microSTX`);
  
  // Convert microSTX back to STX
  const backToSTX = STX.fromMicroSTX(microSTX);
  console.log(`${microSTX} microSTX = ${backToSTX} STX`);
  
  // Format for display
  const formatted = STX.formatSTX(microSTX);
  console.log(`Formatted: ${formatted}`);
  
  // Different decimal places
  const shortFormat = STX.formatSTX(microSTX, 2);
  console.log(`Short format: ${shortFormat}\n`);

  // === Address Validation ===
  console.log('🏠 Address Validation:');
  
  // Valid mainnet STX addresses
  const validMainnetAddresses = [
    'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7',
    'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9'
  ];
  
  // Valid testnet STX addresses  
  const validTestnetAddresses = [
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
  ];
  
  // Invalid addresses
  const invalidAddresses = [
    'invalid',
    'SP123', // too short
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM0', // too long
    'XP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7' // wrong prefix
  ];
  
  console.log('Valid Mainnet Addresses:');
  validMainnetAddresses.forEach(addr => {
    const isValid = STX.isValidAddress(addr, 'mainnet');
    console.log(`  ${addr}: ${isValid ? '✅' : '❌'}`);
  });
  
  console.log('Valid Testnet Addresses:');
  validTestnetAddresses.forEach(addr => {
    const isValid = STX.isValidAddress(addr, 'testnet');
    console.log(`  ${addr}: ${isValid ? '✅' : '❌'}`);
  });
  
  console.log('Invalid Addresses:');
  invalidAddresses.forEach(addr => {
    const isValid = STX.isValidAddress(addr);
    console.log(`  ${addr}: ${isValid ? '✅' : '❌'}`);
  });
  
  console.log();

  // === Currency Utilities ===
  console.log('💱 Currency Utilities:');
  
  // Get currency info
  const stxInfo = Currency.getInfo('stx');
  console.log('STX Info:', stxInfo);
  
  // Format amounts for different currencies
  console.log('\nAmount Formatting:');
  console.log(`STX: ${Currency.formatAmount(5500000, 'stx')}`);
  console.log(`BTC: ${Currency.formatAmount(50000000, 'btc')}`);
  console.log(`sBTC: ${Currency.formatAmount(50000000, 'sbtc')}`);
  
  // Without symbols
  console.log('\nWithout Symbols:');
  console.log(`STX: ${Currency.formatAmount(5500000, 'stx', false)}`);
  console.log(`BTC: ${Currency.formatAmount(50000000, 'btc', false)}`);
  
  // Convert to/from smallest units
  console.log('\nUnit Conversion:');
  const stxInMain = 10.5;
  const stxInSmallest = Currency.toSmallestUnit(stxInMain, 'stx');
  const backToMain = Currency.fromSmallestUnit(stxInSmallest, 'stx');
  console.log(`${stxInMain} STX → ${stxInSmallest} microSTX → ${backToMain} STX`);
  
  // Amount validation
  console.log('\nAmount Validation:');
  const validAmount = 1000000; // 1 STX in microSTX
  const invalidAmount = 0;
  
  const validation1 = Currency.validateAmount(validAmount, 'stx');
  const validation2 = Currency.validateAmount(invalidAmount, 'stx');
  
  console.log(`${validAmount} microSTX: ${validation1.valid ? '✅ Valid' : '❌ ' + validation1.error}`);
  console.log(`${invalidAmount} microSTX: ${validation2.valid ? '✅ Valid' : '❌ ' + validation2.error}`);
  
  console.log();

  // === Address Utilities ===
  console.log('🏷️  Address Utilities:');
  
  const longAddress = 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7';
  const shortAddress = Address.formatForDisplay(longAddress);
  const customFormat = Address.formatForDisplay(longAddress, 8, 6);
  
  console.log(`Original: ${longAddress}`);
  console.log(`Default format: ${shortAddress}`);
  console.log(`Custom format: ${customFormat}`);
  
  // Validate different currency addresses
  console.log('\nAddress validation by currency:');
  console.log(`STX address: ${Address.isValid(longAddress, 'stx') ? '✅' : '❌'}`);
  console.log(`sBTC address: ${Address.isValid(longAddress, 'sbtc') ? '✅' : '❌'}`);
  
  console.log();

  // === Practical Examples ===
  console.log('🎯 Practical Examples:');
  
  // Example 1: Creating a payment amount
  console.log('Example 1: Creating a payment for 2.5 STX');
  const paymentSTX = 2.5;
  const paymentMicroSTX = STX.toMicroSTX(paymentSTX);
  console.log(`  Payment amount: ${paymentMicroSTX} microSTX`);
  console.log(`  Formatted: ${STX.formatSTX(paymentMicroSTX)}`);
  
  // Example 2: Processing a received payment
  console.log('\nExample 2: Processing received payment');
  const receivedMicroSTX = 7500000; // Received from blockchain
  const receivedSTX = STX.fromMicroSTX(receivedMicroSTX);
  console.log(`  Received: ${receivedMicroSTX} microSTX`);
  console.log(`  Equals: ${receivedSTX} STX`);
  console.log(`  Display: ${STX.formatSTX(receivedMicroSTX, 2)}`);
  
  // Example 3: Minimum amount check
  console.log('\nExample 3: Minimum amount validation');
  const minAmount = STX.getMinAmount();
  const testAmounts = [0, 1, 100, 1000000];
  
  testAmounts.forEach(amount => {
    const validation = Currency.validateAmount(amount, 'stx');
    console.log(`  ${amount} microSTX: ${validation.valid ? '✅' : '❌ ' + validation.error}`);
  });
  
  console.log('\n🎉 STX utilities demo completed!');
}

// Run the demo
main();