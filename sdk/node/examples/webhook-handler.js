/**
 * Webhook Handler Example for sBTC Gateway Node.js SDK
 * 
 * This example shows how to handle incoming webhooks from sBTC Gateway
 * using Express.js and verify webhook signatures.
 */

import express from 'express';
import { WebhookUtils } from '@sbtc-gateway/node';

const app = express();
const port = 3000;

// Store raw body for signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Your webhook secret (get this from your sBTC Gateway dashboard)
const WEBHOOK_SECRET = 'whsec_your_webhook_secret_here';

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-signature'];
  const payload = req.body;

  console.log('📨 Received webhook:', {
    signature: signature ? 'present' : 'missing',
    payloadSize: payload.length
  });

  try {
    // Verify the webhook signature
    const isValid = WebhookUtils.verifySignature(
      payload,
      signature,
      WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log('✅ Webhook signature verified');

    // Parse the event
    const event = WebhookUtils.parseEvent(payload.toString());
    
    console.log('📦 Webhook event:', {
      id: event.id,
      type: event.type,
      livemode: event.livemode
    });

    // Handle different event types
    switch (event.type) {
      case 'payment.created':
        handlePaymentCreated(event.data.payment);
        break;
        
      case 'payment.paid':
        handlePaymentPaid(event.data.payment);
        break;
        
      case 'payment.completed':
        handlePaymentCompleted(event.data.payment);
        break;
        
      case 'payment.failed':
        handlePaymentFailed(event.data.payment);
        break;
        
      case 'payment.expired':
        handlePaymentExpired(event.data.payment);
        break;
        
      default:
        console.log('🤷 Unhandled event type:', event.type);
    }

    // Respond with success
    res.status(200).json({ 
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    res.status(400).json({ 
      success: false,
      error: 'Error processing webhook'
    });
  }
});

function handlePaymentCreated(payment) {
  console.log('🆕 Payment created:', {
    id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    description: payment.description
  });
  
  // Add your business logic here
  // e.g., send confirmation email, update database, etc.
}

function handlePaymentPaid(payment) {
  console.log('💰 Payment paid:', {
    id: payment.id,
    transaction_hash: payment.transaction_hash,
    confirmations: payment.confirmations
  });
  
  // Add your business logic here
  // e.g., start service provisioning, send receipt, etc.
}

function handlePaymentCompleted(payment) {
  console.log('✅ Payment completed:', {
    id: payment.id,
    transaction_hash: payment.transaction_hash,
    final_amount: payment.amount
  });
  
  // Add your business logic here
  // e.g., fulfill order, activate service, etc.
}

function handlePaymentFailed(payment) {
  console.log('❌ Payment failed:', {
    id: payment.id,
    status: payment.status
  });
  
  // Add your business logic here
  // e.g., notify customer, retry payment, etc.
}

function handlePaymentExpired(payment) {
  console.log('⏰ Payment expired:', {
    id: payment.id,
    expires_at: payment.expires_at
  });
  
  // Add your business logic here
  // e.g., clean up resources, notify customer, etc.
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Webhook server listening on port ${port}`);
  console.log(`📨 Webhook endpoint: http://localhost:${port}/webhook`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
});
