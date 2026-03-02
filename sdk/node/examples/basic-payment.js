/**
 * Basic Payment Example for sBTC Gateway Node.js SDK
 * 
 * This example demonstrates how to create, retrieve, and manage payments
 * using the sBTC Gateway Node.js SDK.
 */

import SBTCGateway from '@sbtc-gateway/node';

async function main() {
  // Initialize the client
  const client = new SBTCGateway('sk_test_your_api_key_here', {
    // Optional: Custom configuration
    baseURL: 'https://api.sbtc-gateway.com', // Default
    timeout: 30000, // 30 seconds
    retries: 3
  });

  try {
    console.log('🚀 Creating a payment...');
    
    // Create a payment
    const payment = await client.payments.create({
      amount: 50000000, // 50 STX in microSTX (for STX payments) or 0.0005 BTC in satoshis (for BTC/sBTC)
      currency: 'stx', // Supports 'stx', 'sbtc', or 'btc'
      description: 'Premium subscription',
      customer: {
        email: 'customer@example.com',
        name: 'John Doe'
      },
      metadata: {
        order_id: 'order_123',
        user_id: '456'
      },
      webhook_url: 'https://yoursite.com/webhook',
      redirect_url: 'https://yoursite.com/success',
      expires_in: 3600 // 1 hour
    });

    console.log('✅ Payment created successfully!');
    console.log('Payment ID:', payment.id);
    console.log('Payment URL:', payment.payment_url);
    console.log('QR Code:', payment.qr_code);
    console.log('Status:', payment.status);

    // Retrieve the payment
    console.log('\n📋 Retrieving payment...');
    const retrievedPayment = await client.payments.retrieve(payment.id);
    console.log('Retrieved payment status:', retrievedPayment.status);

    // List payments
    console.log('\n📄 Listing payments...');
    const { payments, pagination } = await client.payments.list({
      page: 1,
      limit: 10,
      status: 'pending'
    });

    console.log(`Found ${payments.length} payments`);
    console.log('Pagination:', pagination);

    // Example: Cancel a payment if it's still pending
    if (payment.status === 'pending') {
      console.log('\n❌ Cancelling payment...');
      const cancelledPayment = await client.payments.cancel(payment.id);
      console.log('Payment cancelled:', cancelledPayment.status);
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

// Run the example
main().catch(console.error);
