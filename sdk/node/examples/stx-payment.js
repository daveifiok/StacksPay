/**
 * STX Payment Example for sBTC Gateway Node.js SDK
 * 
 * This example demonstrates how to create and manage STX payments
 * using the sBTC Gateway Node.js SDK.
 */

import SBTCGateway from '@sbtc-gateway/node';

async function main() {
  // Initialize the client
  const client = new SBTCGateway('sk_test_your_api_key_here', {
    baseURL: 'https://api.sbtc-gateway.com',
    timeout: 30000,
    retries: 3
  });

  try {
    console.log('🚀 Creating an STX payment...');
    
    // Create an STX payment
    const stxPayment = await client.payments.create({
      amount: 10000000, // 10 STX in microSTX (1 STX = 1,000,000 microSTX)
      currency: 'stx',
      description: 'NFT Purchase - Stacks Monkey #123',
      customer: {
        email: 'collector@example.com',
        name: 'Alice Collector'
      },
      metadata: {
        nft_id: 'stacks_monkey_123',
        collection: 'stacks_monkeys',
        marketplace: 'gamma'
      },
      webhook_url: 'https://yournftsite.com/webhook',
      redirect_url: 'https://yournftsite.com/nft/stacks_monkey_123',
      expires_in: 1800 // 30 minutes
    });

    console.log('✅ STX Payment created successfully!');
    console.log('Payment ID:', stxPayment.id);
    console.log('Payment URL:', stxPayment.payment_url);
    console.log('STX Address:', stxPayment.wallet_addresses.stacks);
    console.log('QR Code:', stxPayment.qr_code);
    console.log('Status:', stxPayment.status);
    console.log('Amount:', stxPayment.amount / 1000000, 'STX'); // Convert back to STX

    // Create a smaller STX donation
    console.log('\n💰 Creating an STX donation...');
    const donation = await client.payments.create({
      amount: 1000000, // 1 STX
      currency: 'stx',
      description: 'Support open source development',
      customer: {
        email: 'supporter@example.com'
      },
      metadata: {
        type: 'donation',
        project: 'stacks-tools'
      },
      expires_in: 3600 // 1 hour
    });

    console.log('✅ STX Donation created!');
    console.log('Donation ID:', donation.id);
    console.log('Amount:', donation.amount / 1000000, 'STX');

    // List all STX payments
    console.log('\n📄 Listing STX payments...');
    const { payments } = await client.payments.list({
      page: 1,
      limit: 10
    });

    const stxPayments = payments.filter(p => p.currency === 'stx');
    console.log(`Found ${stxPayments.length} STX payments`);
    
    stxPayments.forEach(payment => {
      console.log(`- ${payment.id}: ${payment.amount / 1000000} STX - ${payment.status}`);
    });

    // Demonstrate STX payment monitoring
    console.log('\n👀 Monitoring STX payment status...');
    let currentPayment = stxPayment;
    let attempts = 0;
    const maxAttempts = 5;

    while (currentPayment.status === 'pending' && attempts < maxAttempts) {
      console.log(`Attempt ${attempts + 1}: Checking payment status...`);
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      currentPayment = await client.payments.retrieve(stxPayment.id);
      console.log(`Status: ${currentPayment.status}`);
      
      if (currentPayment.status === 'paid') {
        console.log('🎉 Payment received!');
        console.log('Transaction Hash:', currentPayment.transaction_hash);
        console.log('Confirmations:', currentPayment.confirmations);
        break;
      }
      
      attempts++;
    }

    if (currentPayment.status === 'pending') {
      console.log('⏰ Payment still pending after monitoring period');
      console.log('You can continue monitoring or set up webhooks for real-time updates');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.details) {
      console.error('Error Details:', error.details);
    }
  }
}

// Helper function to format STX amounts
function formatSTX(microSTX) {
  return (microSTX / 1000000).toFixed(6) + ' STX';
}

// Run the example
main().catch(console.error);