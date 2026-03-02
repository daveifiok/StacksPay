# StacksPay

> **A comprehensive payment gateway solution for the Stacks ecosystem, enabling seamless Bitcoin, STX, and sBTC transactions for merchants and developers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

---

## Overview

StacksPay is a production-ready payment processing platform that bridges traditional e-commerce with the Stacks Bitcoin Layer. Built as "Stripe for sBTC," it enables merchants to accept Bitcoin, STX, and sBTC payments with the same ease as traditional payment processors, while providing developers with familiar APIs and comprehensive SDKs.

### **[📚 Complete Documentation →](./docs/README.md)**

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [SDK Integration](#sdk-integration)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### For Merchants

- **Zero-Crypto Onboarding** - Start accepting payments without blockchain knowledge
- **Payment Links** - Generate and share payment links instantly
- **Real-time Dashboard** - Track payments, revenue, and customer analytics
- **Multi-Wallet Support** - Compatible with Leather, Xverse, and all major Stacks wallets
- **QR Code Payments** - Mobile-friendly payment experience
- **Automated Settlement** - Configurable auto-conversion to sBTC

### For Developers

- **RESTful API** - Stripe-compatible API for seamless integration
- **Official SDKs** - Node.js and Python SDKs with TypeScript support
- **Webhook Support** - Real-time payment event notifications
- **Comprehensive Documentation** - Step-by-step integration guides and API reference
- **Test Environment** - Full sandbox for development and testing

### Technical Capabilities

- **Multi-Currency Support** - Accept Bitcoin, STX, and sBTC payments
- **sBTC Native** - First-class support for wrapped Bitcoin on Stacks
- **Smart Contract Backend** - Decentralized payment processing using Clarity
- **Real-time Processing** - Instant payment confirmations and status updates
- **Production Security** - Enterprise-grade error handling, monitoring, and security

---

## Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend Layer    │    │   Backend Layer     │    │  Blockchain Layer   │
│   (Next.js 14)      │    │   (Node.js)         │    │   (Clarity)         │
│                     │    │                     │    │                     │
│ • Merchant Dashboard│◄──►│ • Payment API       │◄──►│ • STX Gateway       │
│ • Checkout Pages    │    │ • Authentication    │    │ • sBTC Bridge       │
│ • Wallet Integration│    │ • Webhook Service   │    │ • Smart Contracts   │
│ • Analytics UI      │    │ • Database Layer    │    │ • Transaction Pool  │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
         │                           │                           │
         └───────────────────────────┴───────────────────────────┘
                              WebSocket Events
```

**[View Complete Architecture Documentation →](./docs/architecture.md)**

---

## Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **MongoDB** 5.0 or higher
- **Git**
- **pnpm** (recommended) or npm

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/daveifiok/StacksPay.git
cd StacksPay
```

2. **Setup Backend**

```bash
cd backend
pnpm install
cp .env.example .env
# Edit .env with your configuration
pnpm run dev
```

3. **Setup Frontend**

```bash
cd frontend
pnpm install
cp .env.example .env.local
# Edit .env.local with your configuration
pnpm run dev
```

4. **Deploy Smart Contracts** (Optional - Testnet)

```bash
cd contract
npm install
clarinet integrate  # For local testing
```

### Access the Application

- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **API Documentation**: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

---

## Documentation

### Quick Navigation

| Documentation | Description |
|--------------|-------------|
| [📚 Documentation Index](./docs/README.md) | Complete documentation overview |
| [🚀 Integration Guide](./docs/integration-guide.md) | Step-by-step integration in 5 minutes |
| [🛠️ SDK Guide](./docs/sdk-guide.md) | Official SDK usage and examples |
| [📘 API Reference](./docs/api-reference.md) | Complete API endpoint documentation |
| [🏗️ Architecture](./docs/architecture.md) | System design and architecture |
| [☁️ Deployment Guide](./DEPLOYMENT.md) | Production deployment instructions |
| [🔐 Security Guide](./SECURITY.md) | Security best practices |

---

## SDK Integration

StacksPay provides official SDKs for easy integration:

### Node.js SDK

```bash
npm install stacks-pay-node
```

```javascript
const StacksPay = require("stacks-pay-node");
const client = new StacksPay(process.env.STACKSPAY_API_KEY);

// Create a payment
const payment = await client.payments.create({
  amount: 1000000, // Amount in satoshis
  currency: "BTC",
  description: "Order #12345",
  metadata: { orderId: "12345" }
});

console.log(`Payment URL: ${payment.checkoutUrl}`);
```

### Python SDK

```bash
pip install stacks-pay-python
```

```python
from stacks_pay import StacksPay

client = StacksPay(api_key=os.environ.get("STACKSPAY_API_KEY"))

# Create a payment
payment = client.payments.create(
    amount=1000000,  # Amount in satoshis
    currency="BTC",
    description="Order #12345",
    metadata={"orderId": "12345"}
)

print(f"Payment URL: {payment.checkout_url}")
```

**[View Complete SDK Documentation →](./docs/sdk-guide.md)**

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: shadcn/ui
- **Wallet Integration**: @stacks/connect

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: JWT
- **Validation**: Zod

### Blockchain
- **Platform**: Stacks Blockchain
- **Smart Contracts**: Clarity
- **sBTC Integration**: sBTC Bridge Protocol
- **Wallet Support**: Leather, Xverse, Hiro Wallet

### DevOps & Infrastructure
- **Deployment**: Google Cloud Run, Docker
- **CI/CD**: GitHub Actions
- **Monitoring**: Custom logging and metrics
- **Event Processing**: Chainhook

---

## Project Structure

```
StacksPay/
├── backend/                 # Backend API Server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utility functions
│   ├── chainhook/          # Blockchain event listeners
│   └── scripts/            # Automation scripts
│
├── frontend/               # Next.js Application
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API clients
│   ├── stores/            # State management
│   └── types/             # TypeScript definitions
│
├── contract/              # Smart Contracts
│   ├── contracts/         # Clarity contracts
│   ├── tests/             # Contract tests
│   └── deployments/       # Deployment configurations
│
├── sdk/                   # Official SDKs
│   ├── node/              # Node.js/TypeScript SDK
│   └── python/            # Python SDK
│
├── docs/                  # Documentation
│   ├── README.md          # Documentation index
│   ├── integration-guide.md
│   ├── sdk-guide.md
│   ├── api-reference.md
│   └── architecture.md
│
└── Infras/                # Infrastructure & DevOps
    └── scripts/           # Deployment scripts
```

---

## Deployment

StacksPay supports multiple deployment options:

### Development

```bash
# Backend
cd backend && pnpm run dev

# Frontend
cd frontend && pnpm run dev
```

### Production

**Docker Deployment**

```bash
# Build and run with Docker Compose
docker-compose up -d
```

**Google Cloud Run**

```bash
# Deploy backend
gcloud run deploy stackspay-backend --source ./backend

# Deploy frontend
gcloud run deploy stackspay-frontend --source ./frontend
```

**[View Complete Deployment Guide →](./DEPLOYMENT.md)**

---

## Environment Configuration

### Backend Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/stackspay

# Authentication
JWT_SECRET=your-secure-secret-key

# Stacks Network
STACKS_NETWORK=mainnet
STACKS_API_URL=https://api.mainnet.hiro.so

# API Configuration
PORT=4000
NODE_ENV=production
```

### Frontend Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.stackspay.com

# Stacks Network
NEXT_PUBLIC_STACKS_NETWORK=mainnet

# Application
NEXT_PUBLIC_APP_URL=https://stackspay.com
```

**Note**: Never commit `.env` files. Use `.env.example` as a template.

---

## Contributing

We welcome contributions to StacksPay! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## Security

StacksPay takes security seriously. If you discover a security vulnerability, please email security@stackspay.com instead of using the issue tracker.

**[View Security Best Practices →](./SECURITY.md)**

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- **Documentation**: [docs/README.md](./docs/README.md)
- **Issues**: [GitHub Issues](https://github.com/daveifiok/StacksPay/issues)
- **Discussions**: [GitHub Discussions](https://github.com/daveifiok/StacksPay/discussions)

---

## Acknowledgments

Built with ❤️ for the Stacks ecosystem and Bitcoin community.

- **Stacks Foundation** - For the amazing blockchain platform
- **sBTC Working Group** - For making wrapped Bitcoin possible
- **Open Source Community** - For the incredible tools and libraries

---

<div align="center">

**[Documentation](./docs/README.md)** • **[Integration Guide](./docs/integration-guide.md)** • **[API Reference](./docs/api-reference.md)** • **[SDK Guide](./docs/sdk-guide.md)**

Made with TypeScript, Next.js, and Clarity

</div>
