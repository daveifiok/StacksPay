import { SupportedCurrency, PaymentMethod, WidgetTheme, WidgetSize } from './types'

// Currency Utilities
export const CURRENCY_INFO = {
  BTC: { 
    name: 'Bitcoin', 
    symbol: '₿', 
    decimals: 8,
    minAmount: 0.00001,
    color: '#f7931a',
    icon: 'bitcoin'
  },
  sBTC: { 
    name: 'Synthetic Bitcoin', 
    symbol: '₿', 
    decimals: 8,
    minAmount: 0.00001,
    color: '#ea580c',
    icon: 'bitcoin'
  },
  STX: { 
    name: 'Stacks', 
    symbol: 'STX', 
    decimals: 6,
    minAmount: 0.000001,
    color: '#8b5cf6',
    icon: 'zap'
  },
  USDC: { 
    name: 'USD Coin', 
    symbol: '$', 
    decimals: 6,
    minAmount: 0.01,
    color: '#2563eb',
    icon: 'dollar-sign'
  }
} as const

export const formatCurrency = (amount: number, currency: SupportedCurrency): string => {
  const info = CURRENCY_INFO[currency]
  if (currency === 'USDC') {
    return `${info.symbol}${amount.toFixed(2)}`
  }
  
  if (amount < 0.001) {
    return `${amount.toFixed(info.decimals)} ${currency}`
  }
  
  if (amount < 1) {
    return `${amount.toFixed(6)} ${currency}`
  }
  
  return `${amount.toFixed(3)} ${currency}`
}

export const getCurrencyColor = (currency: SupportedCurrency): string => {
  return CURRENCY_INFO[currency].color
}

export const validateAmount = (
  amount: number, 
  currency: SupportedCurrency,
  minAmount?: number,
  maxAmount?: number
): { valid: boolean; error?: string } => {
  const info = CURRENCY_INFO[currency]
  
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' }
  }
  
  if (amount < info.minAmount) {
    return { valid: false, error: `Minimum amount is ${info.minAmount} ${currency}` }
  }
  
  if (minAmount && amount < minAmount) {
    return { valid: false, error: `Amount must be at least ${minAmount} ${currency}` }
  }
  
  if (maxAmount && amount > maxAmount) {
    return { valid: false, error: `Amount cannot exceed ${maxAmount} ${currency}` }
  }
  
  return { valid: true }
}

// Address Utilities
export const validateAddress = (address: string, currency: SupportedCurrency): boolean => {
  const patterns = {
    BTC: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    sBTC: /^S[PT][0-9A-Z]{39}$/,
    STX: /^S[PT][0-9A-Z]{39}$/,
    USDC: /^S[PT][0-9A-Z]{39}$/
  }
  
  return patterns[currency]?.test(address) || false
}

export const formatAddress = (address: string, startChars = 6, endChars = 4): string => {
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

export const generateMockAddress = (currency: SupportedCurrency, network: 'mainnet' | 'testnet' = 'mainnet'): string => {
  const prefixes = {
    BTC: network === 'mainnet' ? 'bc1' : 'tb1',
    sBTC: network === 'mainnet' ? 'SP' : 'ST',
    STX: network === 'mainnet' ? 'SP' : 'ST',
    USDC: network === 'mainnet' ? 'SP' : 'ST'
  }
  
  const prefix = prefixes[currency]
  const suffix = Math.random().toString(36).substring(2, 32).toUpperCase()
  return `${prefix}${suffix}`
}

// Theme Utilities
export const DEFAULT_THEMES: Record<string, WidgetTheme> = {
  stackspay: {
    primaryColor: '#ea580c',
    borderRadius: 12,
    customCSS: 'box-shadow: 0 10px 25px rgba(234, 88, 12, 0.15);'
  },
  stripe: {
    primaryColor: '#635bff',
    borderRadius: 8,
    customCSS: 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);'
  },
  minimal: {
    primaryColor: '#000000',
    borderRadius: 2,
    customCSS: 'border: 1px solid #e1e1e1; box-shadow: none;'
  },
  rounded: {
    primaryColor: '#10b981',
    borderRadius: 24,
    customCSS: 'box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15);'
  }
}

export const applyTheme = (theme: string | WidgetTheme): WidgetTheme => {
  if (typeof theme === 'string') {
    return DEFAULT_THEMES[theme] || DEFAULT_THEMES.stackspay
  }
  return theme
}

// Size Utilities
export const DEFAULT_SIZES: Record<string, WidgetSize> = {
  compact: { width: 320, height: 480 },
  standard: { width: 400, height: 600 },
  large: { width: 480, height: 720 },
  fullscreen: { width: -1, height: -1 } // -1 indicates full viewport
}

export const calculateOptimalSize = (content: string, features: string[]): WidgetSize => {
  let baseHeight = 400
  let baseWidth = 320
  
  // Adjust for content length
  if (content.length > 200) baseHeight += 100
  if (content.length > 500) baseHeight += 150
  
  // Adjust for features
  if (features.includes('qr')) baseHeight += 120
  if (features.includes('walletConnect')) baseHeight += 80
  if (features.includes('paymentMethods')) baseHeight += 60
  if (features.includes('customAmount')) baseHeight += 40
  
  // Adjust width for complex features
  if (features.includes('subscription') || features.includes('enterprise')) {
    baseWidth = Math.max(baseWidth, 480)
  }
  
  return { width: baseWidth, height: baseHeight }
}

// Validation Utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const validateApiKey = (apiKey: string): { valid: boolean; type?: 'public' | 'secret'; error?: string } => {
  if (!apiKey) {
    return { valid: false, error: 'API key is required' }
  }
  
  if (apiKey.startsWith('pk_')) {
    return { valid: true, type: 'public' }
  }
  
  if (apiKey.startsWith('sk_')) {
    return { valid: true, type: 'secret' }
  }
  
  return { valid: false, error: 'Invalid API key format' }
}

// Time Utilities
export const formatTimeRemaining = (targetDate: string | Date): string => {
  const target = new Date(targetDate)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  
  if (diff <= 0) return 'Expired'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

export const formatRelativeTime = (date: string | Date): string => {
  const target = new Date(date)
  const now = new Date()
  const diff = now.getTime() - target.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

// Calculation Utilities
export const calculateNetworkFee = (currency: SupportedCurrency, priority: 'low' | 'medium' | 'high' = 'medium'): number => {
  const fees = {
    BTC: { low: 0.0001, medium: 0.0005, high: 0.001 },
    sBTC: { low: 0.00001, medium: 0.00005, high: 0.0001 },
    STX: { low: 0.001, medium: 0.005, high: 0.01 },
    USDC: { low: 0.01, medium: 0.05, high: 0.1 }
  }
  
  return fees[currency][priority]
}

export const calculateUSDValue = (amount: number, currency: SupportedCurrency): number => {
  // Mock exchange rates - in production, fetch from real API
  const rates = {
    BTC: 45000,
    sBTC: 45000,
    STX: 0.6,
    USDC: 1
  }
  
  return amount * rates[currency]
}

export const calculateConversionRate = (fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency): number => {
  const usdRates = {
    BTC: 45000,
    sBTC: 45000,
    STX: 0.6,
    USDC: 1
  }
  
  const fromUsd = usdRates[fromCurrency]
  const toUsd = usdRates[toCurrency]
  
  return fromUsd / toUsd
}

// Error Utilities
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'An unknown error occurred'
}

export const createPaymentError = (code: string, message: string, details?: any) => ({
  code,
  message,
  details,
  timestamp: new Date().toISOString()
})

// Widget Utilities
export const generateWidgetId = (): string => {
  return `spw_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

export const createWidgetConfig = (type: string, props: any) => ({
  id: generateWidgetId(),
  type,
  props,
  created: new Date().toISOString(),
  version: '1.0.0'
})

// Storage Utilities
export const saveWidgetState = (widgetId: string, state: any): void => {
  try {
    localStorage.setItem(`stackspay_widget_${widgetId}`, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to save widget state:', error)
  }
}

export const loadWidgetState = (widgetId: string): any => {
  try {
    const saved = localStorage.getItem(`stackspay_widget_${widgetId}`)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.warn('Failed to load widget state:', error)
    return null
  }
}

export const clearWidgetState = (widgetId: string): void => {
  try {
    localStorage.removeItem(`stackspay_widget_${widgetId}`)
  } catch (error) {
    console.warn('Failed to clear widget state:', error)
  }
}

// Analytics Utilities
export const trackWidgetEvent = (widgetId: string, event: string, data?: any): void => {
  // In production, send to analytics service
  console.log('Widget Event:', { widgetId, event, data, timestamp: new Date().toISOString() })
}

export const trackPaymentEvent = (paymentId: string, event: string, amount?: number, currency?: string): void => {
  trackWidgetEvent('payment', event, { paymentId, amount, currency })
}

// Security Utilities
export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>\"'&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;'
    }
    return entities[char] || char
  })
}

export const validateCSP = (domain: string): boolean => {
  // Basic CSP validation for embedded widgets
  const allowedDomains = [
    'localhost',
    '*.stackspay.com',
    '*.vercel.app',
    '*.netlify.app'
  ]
  
  return allowedDomains.some(allowed => {
    if (allowed.startsWith('*.')) {
      const baseDomain = allowed.slice(2)
      return domain.endsWith(baseDomain)
    }
    return domain === allowed
  })
}