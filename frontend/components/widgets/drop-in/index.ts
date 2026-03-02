// Drop-in Widgets for Easy Website Integration
// These widgets can be easily embedded on any website with minimal setup

export { default as PaymentButtonWidget } from './PaymentButtonWidget'
export { default as DonationWidget } from './DonationWidget'  
export { default as CheckoutWidget } from './CheckoutWidget'

// Usage Examples:
// 
// 1. Simple Payment Button
// <PaymentButtonWidget
//   apiKey="pk_test_123"
//   amount={0.001}
//   currency="BTC"
//   description="Premium Plan"
//   merchantName="Your Store"
//   onSuccess={(payment) => console.log('Payment successful!', payment)}
// />
//
// 2. Donation Widget
// <DonationWidget
//   apiKey="pk_test_123"
//   organizationName="Save the Whales"
//   cause="Ocean Conservation"
//   presetAmounts={[0.001, 0.005, 0.01, 0.05]}
//   showProgress={true}
//   goalAmount={1.0}
//   currentAmount={0.3}
// />
//
// 3. E-commerce Checkout
// <CheckoutWidget
//   apiKey="pk_test_123"
//   items={[
//     { id: '1', name: 'T-Shirt', price: 0.002, quantity: 1 },
//     { id: '2', name: 'Hat', price: 0.001, quantity: 2 }
//   ]}
//   currency="BTC"
//   collectShipping={true}
//   onSuccess={(order) => console.log('Order complete!', order)}
// />

// Widget Types
export type {
  PaymentButtonWidgetProps,
  DonationWidgetProps,
  CheckoutWidgetProps
} from './types'

// Re-export from main widgets
export * from '../types'
export * from '../utils'