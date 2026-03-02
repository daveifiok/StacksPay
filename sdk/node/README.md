# sBTC Gateway Node.js SDK

[![npm version](https://badge.fury.io/js/%40sbtc-gateway%2Fnode.svg)](https://badge.fury.io/js/%40sbtc-gateway%2Fnode)
[![Node.js CI](https://github.com/TheSoftNode/sbtc-payment-gateway/workflows/Node.js%20CI/badge.svg)](https://github.com/TheSoftNode/sbtc-payment-gateway/actions)

Official Node.js SDK for the sBTC Payment Gateway. Accept Bitcoin and STX payments with ease.

## Features

✅ **Payment Management**: Create, retrieve, list, cancel, and refund payments  
✅ **Merchant API**: Get and update merchant information  
✅ **Webhook Management**: Create and manage webhooks for real-time notifications  
✅ **API Key Management**: Generate and manage API keys  
✅ **Webhook Utils**: Verify webhook signatures securely  
✅ **Error Handling**: Comprehensive error types and handling  
✅ **Type Safety**: Full TypeScript support with detailed type definitions  
✅ **Async Support**: Promise-based API with async/await support  
✅ **Automatic Retries**: Built-in retry logic with exponential backoff  
✅ **Rate Limiting**: Automatic handling of rate limits

## Installation

```bash
npm install @sbtc-gateway/node
```

## Quick Start

```javascript
import SBTCGateway from "@sbtc-gateway/node";

// Initialize the client
const client = new SBTCGateway("sk_test_your_api_key_here");

// Create a payment
const payment = await client.payments.create({
  amount: 50000, // 0.0005 BTC in satoshis
  currency: "sbtc",
  description: "Premium subscription",
  customer: {
    email: "customer@example.com",
    name: "John Doe",
  },
});

console.log(payment.payment_url); // Send this URL to your customer
console.log(payment.qr_code); // Or show this QR code
```

Official Node.js SDK for the sBTC Payment Gateway. Accept Bitcoin and STX payments with ease.

## Installation

```bash
npm install @sbtc-gateway/node
# or
yarn add @sbtc-gateway/node
```

## Quick Start

```javascript
const SBTCGateway = require("@sbtc-gateway/node");

// Initialize the client
const client = new SBTCGateway("sk_live_your_api_key_here");

// Create a payment
const payment = await client.payments.create({
  amount: 50000, // 50,000 satoshis
  currency: "sbtc",
  description: "Premium subscription",
  customer: {
    email: "customer@example.com",
    name: "John Doe",
  },
});

console.log(`Payment URL: ${payment.payment_url}`);
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import SBTCGateway, { Payment, PaymentRequest } from "@sbtc-gateway/node";

const client = new SBTCGateway("sk_live_your_api_key_here");

const paymentData: PaymentRequest = {
  amount: 50000,
  currency: "sbtc",
  description: "Premium subscription",
};

const payment: Payment = await client.payments.create(paymentData);
```

## API Reference

### Initialize Client

```javascript
const client = new SBTCGateway(apiKey, options);
```

**Parameters:**

- `apiKey` (string): Your API key (starts with `sk_test_` or `sk_live_`)
- `options` (object, optional):
  - `baseURL` (string): API base URL (default: 'https://api.sbtc-gateway.com')
  - `timeout` (number): Request timeout in milliseconds (default: 30000)

### Payments API

#### Create Payment

```javascript
const payment = await client.payments.create({
  amount: 50000, // Amount in satoshis
  currency: "sbtc", // 'sbtc', 'btc', or 'stx'
  description: "Payment description",
  customer: {
    email: "customer@example.com",
    name: "John Doe",
  },
  metadata: {
    order_id: "order_12345",
    user_id: "user_67890",
  },
  webhook_url: "https://yourapp.com/webhooks/payment",
  redirect_url: "https://yourapp.com/success",
});
```

#### Retrieve Payment

```javascript
const payment = await client.payments.retrieve("pay_1234567890");
```

#### List Payments

```javascript
const { payments, pagination } = await client.payments.list({
  page: 1,
  limit: 20,
  status: "completed",
  customer_email: "customer@example.com",
});
```

#### Cancel Payment

```javascript
const payment = await client.payments.cancel("pay_1234567890");
```

### Merchant API

#### Get Current Merchant

```javascript
const merchant = await client.merchant.getCurrent();
```

#### Update Merchant

```javascript
const merchant = await client.merchant.update({
  name: "New Business Name",
  website: "https://newwebsite.com",
});
```

### Webhook Utilities

#### Verify Webhook Signature

```javascript
const { WebhookUtils } = require("@sbtc-gateway/node");

// In your webhook endpoint
app.post("/webhooks/sbtc", (req, res) => {
  const signature = req.headers["x-sbtc-signature"];
  const payload = JSON.stringify(req.body);
  const secret = "your_webhook_secret";

  try {
    const event = WebhookUtils.verifyAndParseEvent(payload, signature, secret);

    switch (event.type) {
      case "payment.completed":
        console.log("Payment completed:", event.data.payment);
        break;
      case "payment.failed":
        console.log("Payment failed:", event.data.payment);
        break;
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook verification failed:", error);
    res.status(400).send("Invalid signature");
  }
});
```

## Error Handling

```javascript
const { SBTCGatewayError } = require("@sbtc-gateway/node");

try {
  const payment = await client.payments.create({
    amount: 50000,
    currency: "sbtc",
    description: "Test payment",
  });
} catch (error) {
  if (error instanceof SBTCGatewayError) {
    console.error("API Error:", error.message);
    console.error("Error Code:", error.code);
    console.error("Details:", error.details);
  } else {
    console.error("Network Error:", error.message);
  }
}
```

## Webhooks

Handle real-time payment updates:

```javascript
app.post(
  "/webhooks/sbtc",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-sbtc-signature"];

    try {
      const event = WebhookUtils.verifyAndParseEvent(
        req.body,
        signature,
        process.env.SBTC_WEBHOOK_SECRET
      );

      switch (event.type) {
        case "payment.created":
          // Payment initiated
          break;
        case "payment.paid":
          // Payment received (but not confirmed)
          break;
        case "payment.completed":
          // Payment confirmed and completed
          fulfillOrder(event.data.payment);
          break;
        case "payment.failed":
          // Payment failed
          notifyCustomer(event.data.payment);
          break;
        case "payment.expired":
          // Payment expired
          cleanupOrder(event.data.payment);
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).send("Webhook error");
    }
  }
);
```

## Testing

Use test API keys for development:

```javascript
// Test API key (starts with sk_test_)
const client = new SBTCGateway("sk_test_your_test_key_here");

// All payments will use Bitcoin testnet and Stacks testnet
const payment = await client.payments.create({
  amount: 10000, // 0.0001 BTC
  currency: "sbtc",
  description: "Test payment",
});
```

## Environment Variables

Create a `.env` file:

```bash
# Production
SBTC_API_KEY=sk_live_your_live_key_here
SBTC_WEBHOOK_SECRET=whsec_your_webhook_secret

# Development
SBTC_API_KEY=sk_test_your_test_key_here
SBTC_WEBHOOK_SECRET=whsec_your_test_webhook_secret
```

## Support

- **Documentation**: https://docs.sbtc-gateway.com
- **API Reference**: https://docs.sbtc-gateway.com/api
- **GitHub Issues**: https://github.com/TheSoftNode/sbtc-payment-gateway/issues
- **Email Support**: developers@sbtc-gateway.com

## License

MIT License. See [LICENSE](LICENSE) for details.
