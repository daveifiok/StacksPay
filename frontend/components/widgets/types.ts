// Core Payment Widget Types
export interface PaymentWidgetProps {
  amount?: number
  currency?: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  description?: string
  merchantName?: string
  onPaymentComplete?: (payment: any) => void
  onPaymentFailed?: (error: string) => void
  showQR?: boolean
  showPaymentMethods?: boolean
  customStyles?: React.CSSProperties
}

export interface PaymentFormData {
  amount: string
  currency: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  description: string
  recipient?: string
  memo?: string
  priority: 'low' | 'medium' | 'high'
  expires?: string
  allowPartialPayments: boolean
  requireConfirmation: boolean
}

export interface QRCodeProps {
  value: string
  size?: number
  label?: string
  showCopy?: boolean
  showDownload?: boolean
  showShare?: boolean
  logo?: string
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  margin?: number
  darkColor?: string
  lightColor?: string
  onScan?: () => void
}

export interface WalletConnectProps {
  onWalletConnect?: (wallet: ConnectedWallet) => void
  onWalletDisconnect?: () => void
  supportedWallets?: string[]
  autoConnect?: boolean
  showBalance?: boolean
  network?: 'mainnet' | 'testnet'
}

export interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  currency?: string
}

// Embeddable Widget Types
export interface EmbeddablePaymentWidgetProps {
  apiKey: string
  amount: number
  currency: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  description?: string
  theme?: 'light' | 'dark' | 'auto'
  primaryColor?: string
  borderRadius?: number
  showLogo?: boolean
  merchantName?: string
  embedded?: boolean
  resizable?: boolean
  closeable?: boolean
  fullscreen?: boolean
  autoClose?: boolean
  onPaymentSuccess?: (payment: any) => void
  onPaymentError?: (error: string) => void
  onClose?: () => void
  onResize?: (size: { width: number, height: number }) => void
  customCSS?: string
  allowedDomains?: string[]
  rateLimitByIP?: boolean
}

// Subscription Widget Types
export interface SubscriptionPlan {
  id: string
  name: string
  amount: number
  currency: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly'
  intervalCount?: number
  description: string
  features: string[]
  trialDays?: number
  setupFee?: number
  popular?: boolean
}

export interface Subscription {
  id: string
  planId: string
  status: 'active' | 'paused' | 'cancelled' | 'past_due' | 'trial' | 'incomplete'
  currentPeriodStart: string
  currentPeriodEnd: string
  nextPaymentDate: string
  nextPaymentAmount: number
  totalPayments: number
  totalAmount: number
  customerAddress: string
  trialEnd?: string
  cancelAtPeriodEnd: boolean
}

export interface SubscriptionWidgetProps {
  plans: SubscriptionPlan[]
  selectedPlanId?: string
  onPlanSelect?: (plan: SubscriptionPlan) => void
  onSubscribe?: (planId: string, paymentMethod: string) => void
  onSubscriptionUpdate?: (subscriptionId: string, updates: any) => void
  existingSubscription?: Subscription
  showTrialInfo?: boolean
  showFeatureComparison?: boolean
  allowPlanSwitching?: boolean
  merchantName?: string
  customization?: {
    primaryColor?: string
    accentColor?: string
    showPricing?: boolean
    showBillingHistory?: boolean
  }
}

// Payment Link Widget Types
export interface PaymentLinkConfig {
  amount?: number
  currency: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  description: string
  allowCustomAmount: boolean
  minAmount?: number
  maxAmount?: number
  expiresAt?: string
  maxUses?: number
  collectCustomerInfo: boolean
  requireShipping: boolean
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, any>
}

export interface PaymentLink {
  id: string
  url: string
  shortUrl: string
  qrCode: string
  config: PaymentLinkConfig
  createdAt: string
  stats: {
    views: number
    payments: number
    revenue: number
    conversionRate: number
  }
  isActive: boolean
}

export interface PaymentLinkWidgetProps {
  onLinkCreate?: (link: PaymentLink) => void
  onLinkUpdate?: (linkId: string, updates: Partial<PaymentLinkConfig>) => void
  onLinkDelete?: (linkId: string) => void
  existingLinks?: PaymentLink[]
  showAnalytics?: boolean
  allowCustomization?: boolean
  defaultCurrency?: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  merchantName?: string
}

// Enterprise Widget Types
export interface Signer {
  id: string
  address: string
  name: string
  role: string
  status: 'pending' | 'signed' | 'rejected'
  signedAt?: string
  publicKey: string
}

export interface EscrowConfig {
  amount: number
  currency: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  releaseConditions: string[]
  timelock?: number
  disputeResolution: 'arbitrator' | 'majority' | 'unanimous'
  arbitrator?: string
  releaseTo: string
  description: string
  documents?: string[]
}

export interface MultiSigConfig {
  threshold: number
  signers: Signer[]
  amount: number
  currency: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  description: string
  deadline?: string
  autoExecute: boolean
}

export interface Enterprise {
  id: string
  name: string
  type: 'corporation' | 'llc' | 'partnership' | 'government' | 'nonprofit'
  jurisdiction: string
  taxId: string
  complianceLevel: 'basic' | 'enhanced' | 'enterprise'
  kycStatus: 'pending' | 'verified' | 'rejected'
  documents: {
    incorporation: boolean
    operatingAgreement: boolean
    taxCertificate: boolean
    complianceCertification: boolean
  }
}

export interface EnterprisePaymentWidgetProps {
  type: 'escrow' | 'multisig' | 'enterprise_onboarding' | 'compliance_dashboard'
  enterprise?: Enterprise
  onEscrowCreate?: (config: EscrowConfig) => void
  onMultiSigCreate?: (config: MultiSigConfig) => void
  onComplianceUpdate?: (updates: any) => void
  showComplianceFeatures?: boolean
  allowCustomContracts?: boolean
  requireKYB?: boolean
}

// Conversion Widget Types
export interface Balance {
  currency: string
  amount: number
  usdValue: number
  available: number
}

export interface ConversionWidgetProps {
  balances: Balance[]
  onConversionComplete: (transaction: any) => void
}

// Wallet Types
export interface ConnectedWallet {
  address: string
  name: string
  network: string
  balance?: {
    STX: number
    sBTC: number
    BTC: number
  }
  isConnected: boolean
}

export interface WalletInfo {
  name: string
  icon: string
  description: string
  isInstalled: boolean
  isSupported: boolean
  downloadUrl?: string
}

// Payment Types
export interface Payment {
  id: string
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'expired'
  amount: number
  currency: string
  paymentAddress: string
  qrCodeData: string
  expiresAt: string
}

// Widget Configuration Types
export interface WidgetTheme {
  primaryColor: string
  borderRadius: number
  customCSS?: string
}

export interface WidgetSize {
  width: number
  height: number
}

// API Types
export interface WidgetAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface WidgetEventData {
  type: string
  payload: any
  timestamp: string
  widgetId: string
}

// Hook Types
export interface UsePaymentWidgetOptions {
  apiKey: string
  network?: 'mainnet' | 'testnet'
  autoConnect?: boolean
  theme?: 'light' | 'dark' | 'auto'
}

export interface UseSubscriptionOptions {
  plans: SubscriptionPlan[]
  defaultPlan?: string
  autoSelectPopular?: boolean
}

export interface UsePaymentLinkOptions {
  defaultCurrency?: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  analytics?: boolean
  maxLinksPerAccount?: number
}

// Utility Types
export type SupportedCurrency = 'BTC' | 'STX' | 'sBTC' | 'USDC'
export type PaymentMethod = 'wallet' | 'qr' | 'manual'
export type SubscriptionInterval = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type WidgetType = 'payment' | 'subscription' | 'payment_link' | 'enterprise' | 'embeddable'
export type EnterpriseType = 'corporation' | 'llc' | 'partnership' | 'government' | 'nonprofit'
export type ComplianceLevel = 'basic' | 'enhanced' | 'enterprise'