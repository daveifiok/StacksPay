# StacksPay Documentation

Welcome to the complete documentation for StacksPay - the comprehensive payment gateway for the Stacks ecosystem.

## Quick Start

- **[Integration Guide](./integration-guide.md)** - Get started with StacksPay in 5 minutes
- **[SDK Guide](./sdk-guide.md)** - Official SDKs and how to use them
- **[API Reference](./api-reference.md)** - Complete API documentation

## Architecture & Deep Dive

- **[System Architecture](./architecture.md)** - How everything works and connects

## Getting Started

### 1. For Developers

Start with the **[Integration Guide](./integration-guide.md)** to integrate StacksPay into your application.

### 2. For SDK Users

Check out the **[SDK Guide](./sdk-guide.md)** for language-specific integration using our official SDKs.

### 3. For API Users

Refer to the **[API Reference](./api-reference.md)** for complete endpoint documentation.

## What is StacksPay?

StacksPay is a comprehensive payment gateway solution built for the Stacks ecosystem that enables seamless Bitcoin, STX, and sBTC transactions for merchants and developers.

### Key Features

- **Multi-Currency Support**: Accept Bitcoin, STX, and sBTC payments
- **Developer-Friendly**: Complete SDK and API ecosystem
- **Real-time Processing**: Instant payment confirmations
- **Enterprise Ready**: Dashboard, analytics, and merchant tools
- **Seamless Integration**: Drop-in widgets and payment links

### How It Works

1. **Merchant Setup**: Create account and generate API keys
2. **Integration**: Use SDKs or direct API to create payments
3. **Customer Payment**: Customers pay with their preferred crypto
4. **Processing**: Real-time monitoring and confirmation
5. **Settlement**: Automatic settlement in merchant's wallet

## Documentation Structure

### For Beginners

1. Start with [Integration Guide](./integration-guide.md)
2. Use our [Node.js](./sdk-guide.md#nodejs-sdk) or [Python](./sdk-guide.md#python-sdk) SDK
3. Test with our sandbox environment

### For Advanced Users

1. Read the [System Architecture](./architecture.md)
2. Explore the complete [API Reference](./api-reference.md)
3. Implement custom solutions

## SDKs and Libraries

### Official SDKs

#### Node.js SDK

```bash
npm install stacks-pay-node
```

**Documentation**: [SDK Guide - Node.js Section](./sdk-guide.md#nodejs-sdk)

#### Python SDK

```bash
pip install stacks-pay-python
```

**Documentation**: [SDK Guide - Python Section](./sdk-guide.md#python-sdk)

### Publishing Details

Our SDKs are published to their respective package managers:

- **NPM**: [stacks-pay-node](https://www.npmjs.com/package/stacks-pay-node)
- **PyPI**: [stacks-pay-python](https://pypi.org/project/stacks-pay-python/)

Full publishing process and version management details are covered in the [SDK Guide](./sdk-guide.md#sdk-publishing-process).

## API Endpoints

Base URLs:

- **Testnet**: `https://api-testnet.stackspay.com`
- **Mainnet**: `https://api.stackspay.com`

Key endpoints:

- `POST /api/payments` - Create payment
- `GET /api/payments/{id}` - Get payment status
- `POST /api/webhooks` - Setup webhooks
- `GET /api/analytics` - Payment analytics

Full API documentation: [API Reference](./api-reference.md)

## System Architecture

StacksPay consists of several interconnected components:

```
Frontend (Next.js) ←→ Backend (Node.js) ←→ Smart Contracts (Clarity)
                            ↓
                      Database (MongoDB)
                            ↓
                    External APIs (Stacks, Bitcoin)
```

Detailed architecture explanation: [System Architecture](./architecture.md)

## Integration Examples

### Quick Payment Creation

**Node.js:**

```javascript
const StacksPay = require("stacks-pay-node");
const client = new StacksPay({ apiKey: "sk_test_..." });

const payment = await client.payments.create({
  amount: 1000000, // 0.01 BTC in satoshis
  currency: "BTC",
  description: "Order #12345",
});
```

**Python:**

```python
import stacks_pay_python

client = stacks_pay_python.Client(api_key='sk_test_...')
payment = client.payments.create(
    amount=1000000,
    currency='BTC',
    description='Order #12345'
)
```

**Direct API:**

```bash
curl -X POST https://api-testnet.stackspay.com/api/payments \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000000, "currency": "BTC", "description": "Order #12345"}'
```

More examples: [Integration Guide](./integration-guide.md)

## Webhooks

StacksPay uses webhooks to notify your application of payment events:

```javascript
// Webhook event types
{
  "type": "payment.completed",
  "data": {
    "payment": {
      "id": "pay_123...",
      "status": "completed",
      "amount": 1000000,
      "currency": "BTC"
    }
  }
}
```

Complete webhook documentation: [API Reference - Webhooks](./api-reference.md#webhooks-api)

## Framework Integration

### Supported Frameworks

- **Express.js**: [Integration Guide](./integration-guide.md#expressjs-integration)
- **Next.js**: [Integration Guide](./integration-guide.md#nextjs-integration)
- **Django**: [Integration Guide](./integration-guide.md#django-integration)
- **Flask**: [SDK Guide - Flask Example](./sdk-guide.md#flask-integration-example)

### Integration Patterns

- **E-commerce**: [Integration Guide](./integration-guide.md#e-commerce-integration)
- **Subscriptions**: [Integration Guide](./integration-guide.md#subscriptionsaas-integration)
- **Marketplaces**: [Integration Guide](./integration-guide.md#marketplace-integration)
- **Donations**: [Integration Guide](./integration-guide.md#donationcrowdfunding-integration)

## Security

### Authentication

All API requests require authentication using API keys:

```
Authorization: Bearer sk_test_your_api_key_here
```

### Webhook Security

Webhooks are signed with HMAC-SHA256 for verification:

```javascript
const isValid = client.webhooks.verifySignature(payload, signature, secret);
```

### Rate Limits

- **Per API Key**: 1,000 requests/hour
- **Per IP**: 100 requests/hour
- **Payment Creation**: 10 requests/minute

Full security details: [API Reference - Authentication](./api-reference.md#authentication)

## Testing

### Test Environment

- Use test API keys (`sk_test_...`)
- No real money involved
- Full functionality available

### Testing Tools

- SDK test suites
- Webhook testing with ngrok
- Postman collection available

Testing guidance: [Integration Guide - Testing](./integration-guide.md#testing-your-integration)

## Support and Community

### Documentation

- **Guides**: Integration and SDK guides
- **Reference**: Complete API documentation
- **Examples**: Framework-specific examples

### Community

- **GitHub**: Report issues and contribute
- **Discord**: Join our developer community
- **Email**: support@stackspay.com

### Resources

- **Status Page**: https://status.stackspay.com
- **Changelog**: Track updates and new features
- **Blog**: Best practices and tutorials

## Contributing

We welcome contributions to improve StacksPay:

1. **Documentation**: Help improve our guides
2. **SDKs**: Contribute to existing SDKs or create new ones
3. **Examples**: Share integration examples
4. **Feedback**: Report issues and suggest features

## License

StacksPay is released under the MIT License. See the LICENSE file for details.

---

**Get Started**: [Integration Guide](./integration-guide.md) | **API Docs**: [API Reference](./api-reference.md) | **SDKs**: [SDK Guide](./sdk-guide.md)
