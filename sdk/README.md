# StacksPay SDK Development Setup

This directory contains the official SDKs for StacksPay - The Stripe for sBTC.

## Available SDKs

### Node.js SDK (`stacks-pay-node`)

- **Package**: `stacks-pay-node`
- **Installation**: `npm install stacks-pay-node`
- **Language**: TypeScript/JavaScript
- **Node.js**: >= 14.0.0

### Python SDK (`stacks-pay-python`)

- **Package**: `stacks-pay-python`
- **Installation**: `pip install stacks-pay-python`
- **Language**: Python
- **Python**: >= 3.8

## Quick Examples

### Node.js

```javascript
const StacksPay = require("stacks-pay-node");

const client = new StacksPay("sk_live_your_api_key");
const payment = await client.payments.create({
  amount: 50000,
  currency: "sbtc",
  description: "Premium subscription",
});
```

### Python

```javascript
import stacks_pay_python

client = stacks_pay_python.Client('sk_live_your_api_key')
payment = client.payments.create(stacks_pay_python.PaymentRequest(
    amount=50000,
    currency='sbtc',
    description='Premium subscription'
))
```

## Development

### Building Node.js SDK

```bash
cd sdk/node
npm install
npm run build
npm test
```

### Building Python SDK

```bash
cd sdk/python
pip install -e .
python -m pytest
```

### Publishing SDKs

```bash
# Make sure you're logged in to npm and PyPI
npm login
python -m twine configure

# Run the publish script
./sdk/publish.sh
```

## SDK Features

Both SDKs provide:

✅ **Payment Management**: Create, retrieve, list, cancel payments  
✅ **Merchant API**: Get and update merchant information  
✅ **Webhook Utils**: Verify webhook signatures securely  
✅ **Error Handling**: Comprehensive error types and handling  
✅ **Type Safety**: Full TypeScript support (Node.js) and type hints (Python)  
✅ **Async Support**: Promise-based (Node.js) and async/await compatible  
✅ **Testing**: Test API key support for development  
✅ **Documentation**: Comprehensive examples and API reference

## API Compatibility

Both SDKs are compatible with the StacksPay API v1:

- **Base URL**: `https://api.stackspay.com`
- **Authentication**: Bearer token (API key)
- **Format**: JSON REST API
- **Webhooks**: HMAC-SHA256 signature verification

## Support Matrix

| Feature        | Node.js SDK | Python SDK      |
| -------------- | ----------- | --------------- |
| Payments API   | ✅          | ✅              |
| Merchant API   | ✅          | ✅              |
| Webhooks       | ✅          | ✅              |
| TypeScript     | ✅          | ✅ (Type hints) |
| Async/Await    | ✅          | ✅              |
| Error Handling | ✅          | ✅              |
| Rate Limiting  | ✅          | ✅              |
| Retries        | ✅          | ✅              |
| Timeouts       | ✅          | ✅              |

## Next Steps

1. **Test the SDKs** with your test API keys
2. **Read the documentation** in each SDK's README
3. **Try the examples** to understand the API
4. **Integrate** into your application
5. **Deploy** with live API keys

## Contributing

To contribute to the SDKs:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## License

MIT License - see individual SDK directories for details.
