#!/usr/bin/env node

/**
 * Check payment status directly from the smart contract
 * Usage: node scripts/check-contract-payment.js <payment-id>
 */

const { fetchCallReadOnlyFunction, Cl } = require('@stacks/transactions');
const { STACKS_TESTNET } = require('@stacks/network');

const CONTRACT_ADDRESS = 'SP328EHAG4RB6MYQMBH9Z0WVTE02HD5N50MQJXHFZ';
const CONTRACT_NAME = 'stackspay-stx-gateway';

async function checkPayment(paymentId) {
  try {
    console.log(`🔍 Checking payment status for: ${paymentId}`);
    console.log(`📝 Contract: ${CONTRACT_ADDRESS}.${CONTRACT_NAME}\n`);

    // Get payment data from contract
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-payment',
      functionArgs: [Cl.stringAscii(paymentId)],
      network: STACKS_TESTNET,
      senderAddress: CONTRACT_ADDRESS,
    });

    console.log('📊 Contract Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.type === 'optional' && result.value) {
      const payment = result.value.data;
      console.log('\n✅ Payment Found:');
      console.log(`Status: ${payment.status?.data || 'unknown'}`);
      console.log(`Merchant: ${payment.merchant?.address || 'unknown'}`);
      console.log(`Unique Address: ${payment['unique-address']?.address || 'unknown'}`);
      console.log(`Expected Amount: ${payment['expected-amount']?.value || 0} microSTX`);
      console.log(`Received Amount: ${payment['received-amount']?.value || 0} microSTX`);
      console.log(`Created At Block: ${payment['created-at']?.value || 0}`);
      console.log(`Expires At Block: ${payment['expires-at']?.value || 0}`);

      if (payment['confirmed-at']?.value) {
        console.log(`Confirmed At Block: ${payment['confirmed-at'].value}`);
      }
      if (payment['settled-at']?.value) {
        console.log(`Settled At Block: ${payment['settled-at'].value}`);
      }
    } else {
      console.log('\n❌ Payment not found in contract');
    }

    // Also check contract stats
    const stats = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-contract-stats',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: CONTRACT_ADDRESS,
    });

    console.log('\n📈 Contract Statistics:');
    if (stats.value?.data) {
      console.log(`Total Payments: ${stats.value.data['total-payments']?.value || 0}`);
      console.log(`Total Settlements: ${stats.value.data['total-settlements']?.value || 0}`);
      console.log(`Contract Paused: ${stats.value.data['is-paused']?.value || false}`);
    }

  } catch (error) {
    console.error('❌ Error checking payment:', error);
    if (error.message) {
      console.error('Error details:', error.message);
    }
  }
}

// Get payment ID from command line
const paymentId = process.argv[2];

if (!paymentId) {
  console.log('Usage: node scripts/check-contract-payment.js <payment-id>');
  console.log('Example: node scripts/check-contract-payment.js stx_pay_1728171234567_abc123');
  process.exit(1);
}

checkPayment(paymentId);
