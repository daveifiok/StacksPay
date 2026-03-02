#!/usr/bin/env node

/**
 * Initialize STX Payment Gateway Contract
 * This script authorizes the backend and merchant addresses in the contract
 */

const { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, Cl } = require('@stacks/transactions');
const { STACKS_TESTNET } = require('@stacks/network');

const CONTRACT_ADDRESS = 'SP328EHAG4RB6MYQMBH9Z0WVTE02HD5N50MQJXHFZ';
const CONTRACT_NAME = 'stackspay-stx-gateway';
const BACKEND_PRIVATE_KEY = process.env.STX_BACKEND_PRIVATE_KEY || '0a507ac0327739a72c940bd07d37d36f110b14142a8059c647bc367572021b8401';

async function authorizeBackend() {
  console.log('🔐 Authorizing backend address in contract...');
  console.log(`📝 Contract: ${CONTRACT_ADDRESS}.${CONTRACT_NAME}\n`);

  try {
    // Authorize backend
    const txOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'authorize-backend',
      functionArgs: [
        Cl.standardPrincipal(CONTRACT_ADDRESS) // Authorize the contract deployer as backend
      ],
      senderKey: BACKEND_PRIVATE_KEY,
      network: STACKS_TESTNET,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction({ transaction, network: STACKS_TESTNET });

    if (broadcastResponse.error) {
      console.error('❌ Failed to authorize backend:', broadcastResponse.error);
      if (broadcastResponse.reason) {
        console.error('Reason:', broadcastResponse.reason);
      }
      return false;
    }

    console.log('✅ Backend authorization transaction broadcasted!');
    console.log(`📍 TX ID: ${broadcastResponse.txid}`);
    console.log(`🔗 View on explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=testnet\n`);

    return true;
  } catch (error) {
    console.error('❌ Error authorizing backend:', error.message);
    return false;
  }
}

async function authorizeMerchant(merchantAddress) {
  console.log(`🏪 Authorizing merchant: ${merchantAddress}`);

  try {
    // Authorize merchant with 1% fee (100 basis points)
    const txOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'authorize-merchant',
      functionArgs: [
        Cl.standardPrincipal(merchantAddress),
        Cl.uint(100) // 1% fee rate (100 basis points)
      ],
      senderKey: BACKEND_PRIVATE_KEY,
      network: STACKS_TESTNET,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction({ transaction, network: STACKS_TESTNET });

    if (broadcastResponse.error) {
      console.error('❌ Failed to authorize merchant:', broadcastResponse.error);
      if (broadcastResponse.reason) {
        console.error('Reason:', broadcastResponse.reason);
      }
      return false;
    }

    console.log('✅ Merchant authorization transaction broadcasted!');
    console.log(`📍 TX ID: ${broadcastResponse.txid}`);
    console.log(`🔗 View on explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=testnet\n`);

    return true;
  } catch (error) {
    console.error('❌ Error authorizing merchant:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Initializing STX Payment Gateway Contract\n');

  // Step 1: Authorize backend
  const backendAuthorized = await authorizeBackend();
  if (!backendAuthorized) {
    console.log('\n⚠️  Backend authorization failed. Contract may already be initialized or there was an error.');
  }

  // Wait a bit between transactions
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Authorize merchant (use backend address as default merchant for testing)
  const merchantAddress = process.argv[2] || CONTRACT_ADDRESS;
  console.log(`Using merchant address: ${merchantAddress}`);

  const merchantAuthorized = await authorizeMerchant(merchantAddress);
  if (!merchantAuthorized) {
    console.log('\n⚠️  Merchant authorization failed. Merchant may already be authorized or there was an error.');
  }

  console.log('\n✨ Contract initialization complete!');
  console.log('⏱️  Wait 1-2 minutes for transactions to confirm, then create a new test payment.');
}

main().catch(console.error);
