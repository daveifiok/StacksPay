// Core Payment Widgets
export { default as PaymentWidget } from '../payment/payment-widget'
export { default as PaymentForm } from '../payment/payment-form'
export { default as QRCode } from '../payment/qr-code'
export { default as WalletConnect } from '../payment/wallet-connect'
export { default as AmountInput } from '../payment/amount-input'

// Embeddable Widgets
export { default as EmbeddablePaymentWidget, createEmbeddedWidget, WIDGET_SIZES, WIDGET_THEMES } from './EmbeddablePaymentWidget'
export { default as SubscriptionWidget } from './SubscriptionWidget'
export { default as PaymentLinkWidget } from './PaymentLinkWidget'
export { default as EnterprisePaymentWidget } from './EnterprisePaymentWidget'

// Dashboard Conversion Widget
export { ConversionWidget } from '../dashboard/conversion/ConversionWidget'

// Widget Types
export type {
  // Payment Widget Types
  PaymentWidgetProps,
  PaymentFormData,
  QRCodeProps,
  WalletConnectProps,
  AmountInputProps,
  
  // Embeddable Widget Types
  EmbeddablePaymentWidgetProps,
  SubscriptionWidgetProps,
  PaymentLinkWidgetProps,
  EnterprisePaymentWidgetProps,
  
  // Subscription Types
  SubscriptionPlan,
  Subscription,
  
  // Payment Link Types
  PaymentLink,
  PaymentLinkConfig,
  
  // Enterprise Types
  EscrowConfig,
  MultiSigConfig,
  Enterprise,
  Signer,
  
  // Conversion Types
  ConversionWidgetProps
} from './types'

// Widget Utilities
export * from './utils'

// Widget Constants
export const SUPPORTED_CURRENCIES = ['BTC', 'sBTC', 'STX', 'USDC'] as const
export const DEFAULT_THEME = 'auto'
export const DEFAULT_PRIMARY_COLOR = '#ea580c'

// Widget Factory Functions
export const createPaymentWidget = (props: any) => ({
  type: 'payment',
  component: 'PaymentWidget',
  props
})

export const createSubscriptionWidget = (props: any) => ({
  type: 'subscription',
  component: 'SubscriptionWidget',
  props
})

export const createPaymentLinkWidget = (props: any) => ({
  type: 'payment_link',
  component: 'PaymentLinkWidget',
  props
})

export const createEnterpriseWidget = (props: any) => ({
  type: 'enterprise',
  component: 'EnterprisePaymentWidget',
  props
})

// Widget Registry for Dynamic Loading
export const WIDGET_REGISTRY = {
  payment: PaymentWidget,
  subscription: SubscriptionWidget,
  payment_link: PaymentLinkWidget,
  enterprise: EnterprisePaymentWidget,
  embeddable: EmbeddablePaymentWidget
}

// Widget Configuration Schemas
export const WIDGET_SCHEMAS = {
  payment: {
    required: ['amount', 'currency'],
    optional: ['description', 'merchantName', 'onPaymentComplete', 'onPaymentFailed']
  },
  subscription: {
    required: ['plans'],
    optional: ['selectedPlanId', 'onPlanSelect', 'onSubscribe', 'showTrialInfo']
  },
  payment_link: {
    required: [],
    optional: ['onLinkCreate', 'existingLinks', 'showAnalytics', 'defaultCurrency']
  },
  enterprise: {
    required: ['type'],
    optional: ['enterprise', 'onEscrowCreate', 'onMultiSigCreate', 'showComplianceFeatures']
  },
  embeddable: {
    required: ['apiKey', 'amount', 'currency'],
    optional: ['theme', 'primaryColor', 'embedded', 'resizable', 'closeable']
  }
}