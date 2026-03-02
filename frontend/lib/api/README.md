# Payment API Architecture

This directory contains two distinct API client patterns for different use cases, similar to how Stripe separates dashboard operations from direct API usage.

## 🔐 Authentication Patterns

### 1. Dashboard Operations (Session-Based)
**File**: `payment-widget-api.ts` → `PaymentDashboardApiClient`
- **Authentication**: JWT session tokens
- **Use Case**: Merchant dashboard operations
- **Endpoints**: `/api/auth/payments/*`
- **Security**: Session middleware validation

### 2. External Integrations (API Key-Based)  
**File**: `external-payment-api.ts` → `ExternalPaymentApiClient`
- **Authentication**: API keys (`sk_test_*` / `sk_live_*`)
- **Use Case**: Merchant website/app integrations
- **Endpoints**: `/api/payments/*`
- **Security**: API key middleware validation

## 🏗️ Architecture Benefits

### Why Two Patterns?

1. **Security**: 
   - Dashboard never stores API keys in frontend
   - API keys remain hashed in database
   - Follows enterprise security practices

2. **Flexibility**:
   - Dashboard operations work immediately after login
   - External integrations work independently
   - Merchants can integrate without dashboard access

3. **Scalability**:
   - Dashboard operations don't need API key management
   - External integrations have proper rate limiting
   - Clear separation of concerns

## 📖 Usage Examples

### Dashboard Payment Creation
```typescript
import { paymentWidgetApiClient } from '@/lib/api/payment-widget-api';

// Uses session authentication automatically
const result = await paymentWidgetApiClient.createPaymentLink({
  amount: 100,
  currency: 'STX',
  description: 'Test payment'
});
```

### External Merchant Integration  
```typescript
import { createExternalPaymentClient } from '@/lib/api/external-payment-api';

// Merchant provides their API key
const client = createExternalPaymentClient('sk_test_abc123...');
const result = await client.createSTXPayment({
  amount: 100,
  currency: 'STX',
  description: 'Website payment'
});
```

## 🔄 Backend Route Structure

### Session-Based Routes (`sessionMiddleware`)
```
POST /api/auth/payments/stx       - Create STX payment (dashboard)
POST /api/auth/payments/links     - Create payment link (any currency)
GET  /api/auth/payments/stx       - List payments (dashboard)
GET  /api/auth/payments/stx/:id   - Get payment details (dashboard)
GET  /api/auth/payments/analytics - Get analytics (dashboard)
```

### API Key-Based Routes (`apiKeyMiddleware`)
```
POST /api/payments/stx            - Create STX payment (external)
GET  /api/payments/stx/:id        - Get payment status (external)
GET  /api/payments/custom/:id     - Get by custom ID (external)
POST /api/webhooks/stx            - Webhook endpoints (external)
```

## 🚀 Implementation Status

✅ **Session-based dashboard operations** - Complete  
✅ **API key-based external operations** - Complete  
✅ **Dual authentication middleware** - Complete  
✅ **Security-first architecture** - Complete  

This architecture solves the original localStorage/API key retrieval problem while maintaining enterprise-grade security practices.