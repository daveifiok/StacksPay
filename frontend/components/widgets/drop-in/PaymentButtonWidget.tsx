'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface PaymentButtonWidgetProps {
  // Required props
  apiKey: string
  amount: number
  currency: 'BTC' | 'sBTC' | 'STX' | 'USDC'
  description: string
  
  // Optional customization
  buttonText?: string
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  buttonSize?: 'sm' | 'md' | 'lg'
  theme?: 'light' | 'dark' | 'auto'
  primaryColor?: string
  borderRadius?: number
  
  // Branding
  merchantName?: string
  merchantLogo?: string
  
  // Callbacks
  onSuccess?: (payment: any) => void
  onError?: (error: string) => void
  onCancel?: () => void
  
  // Behavior
  autoClose?: boolean
  showReceipt?: boolean
  disabled?: boolean
  
  // Styling
  className?: string
  style?: React.CSSProperties
}

export default function PaymentButtonWidget({
  apiKey,
  amount,
  currency,
  description,
  buttonText = 'Pay Now',
  buttonVariant = 'primary',
  buttonSize = 'md',
  theme = 'light',
  primaryColor = '#ea580c',
  borderRadius = 6,
  merchantName = 'Merchant',
  merchantLogo,
  onSuccess,
  onError,
  onCancel,
  autoClose = false,
  showReceipt = true,
  disabled = false,
  className = '',
  style = {}
}: PaymentButtonWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [paymentResult, setPaymentResult] = useState<any>(null)

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'USDC') return `$${amount.toFixed(2)}`
    if (currency === 'BTC' || currency === 'sBTC') return `₿${amount.toFixed(6)}`
    if (currency === 'STX') return `${amount.toFixed(6)} STX`
    return `${amount} ${currency}`
  }

  const handlePayment = async () => {
    setIsLoading(true)
    setPaymentStatus('processing')
    
    try {
      // Create actual payment via API
      const paymentAmount = currency === 'STX' 
        ? Math.floor(amount * 1000000) // Convert STX to microSTX
        : amount;

      // Import STX transaction service for STX payments
      if (currency === 'STX') {
        const { stxTransactionService } = await import('@/lib/services/stx-transaction-service')
        
        // Create STX payment via backend API
        const createResult = await stxTransactionService.createSTXPayment({
          expectedAmount: paymentAmount,
          usdAmount: currency === 'USDC' ? amount : undefined,
          metadata: description,
          expiresInMinutes: 15
        });

        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to create STX payment');
        }

        // Redirect to checkout page for payment
        const checkoutUrl = `${window.location.origin}/checkout/${createResult.payment!.paymentId}`;
        window.open(checkoutUrl, '_blank');

        // For widget, we'll mark as processing and wait for webhook
        const mockPayment = {
          id: createResult.payment!.paymentId,
          amount,
          currency,
          description,
          status: 'processing',
          transactionId: '',
          timestamp: new Date().toISOString(),
          checkoutUrl
        }
        
        setPaymentResult(mockPayment)
        setPaymentStatus('success')
        onSuccess?.(mockPayment)
      } else {
        // For other currencies, simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const mockPayment = {
          id: `pay_${Date.now()}`,
          amount,
          currency,
          description,
          status: 'completed',
          transactionId: `tx_${Math.random().toString(36).substring(7)}`,
          timestamp: new Date().toISOString()
        }
        
        setPaymentResult(mockPayment)
        setPaymentStatus('success')
        onSuccess?.(mockPayment)
      }
      
      if (autoClose) {
        setTimeout(() => {
          setIsOpen(false)
          resetWidget()
        }, 3000)
      }
    } catch (error) {
      setPaymentStatus('error')
      onError?.(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsLoading(false)
    }
  }

  const resetWidget = () => {
    setPaymentStatus('idle')
    setPaymentResult(null)
    setIsLoading(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    resetWidget()
    if (paymentStatus === 'idle' || paymentStatus === 'processing') {
      onCancel?.()
    }
  }

  const getButtonVariantClasses = () => {
    const baseClasses = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
    
    const variantClasses = {
      primary: `bg-[${primaryColor}] hover:bg-[${primaryColor}]/90 text-white focus:ring-[${primaryColor}]/50`,
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      outline: `border border-[${primaryColor}] text-[${primaryColor}] hover:bg-[${primaryColor}] hover:text-white focus:ring-[${primaryColor}]/50`,
      ghost: `text-[${primaryColor}] hover:bg-[${primaryColor}]/10 focus:ring-[${primaryColor}]/50`
    }
    
    return `${baseClasses} ${sizeClasses[buttonSize]} ${variantClasses[buttonVariant]} ${className}`
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={getButtonVariantClasses()}
        style={{ 
          borderRadius: `${borderRadius}px`, 
          backgroundColor: buttonVariant === 'primary' ? primaryColor : undefined,
          borderColor: buttonVariant === 'outline' ? primaryColor : undefined,
          color: buttonVariant === 'outline' || buttonVariant === 'ghost' ? primaryColor : undefined,
          ...style 
        }}
      >
        <CreditCard className="w-4 h-4 mr-2" />
        {buttonText} {formatCurrency(amount, currency)}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md" style={{ borderRadius: `${borderRadius * 1.5}px` }}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              {merchantLogo && (
                <img src={merchantLogo} alt={merchantName} className="w-8 h-8 rounded" />
              )}
              <div>
                <div className="text-lg font-semibold">{merchantName}</div>
                {paymentStatus === 'idle' && (
                  <div className="text-sm font-normal text-gray-600">Secure Payment</div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="font-semibold text-lg" style={{ color: primaryColor }}>
                  {formatCurrency(amount, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Description</span>
                <span className="text-sm font-medium">{description}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Currency</span>
                <Badge variant="secondary">{currency}</Badge>
              </div>
            </div>

            {/* Payment Status */}
            {paymentStatus === 'processing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Payment</h3>
                <p className="text-sm text-gray-600">
                  Please wait while we process your payment...
                </p>
              </motion.div>
            )}

            {paymentStatus === 'success' && showReceipt && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
                <div className="bg-green-50 rounded-lg p-4 text-left space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Transaction ID:</span>
                    <span className="ml-2 font-mono text-xs">{paymentResult?.transactionId}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Amount:</span>
                    <span className="ml-2">{formatCurrency(amount, currency)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Time:</span>
                    <span className="ml-2">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
                {!autoClose && (
                  <Button 
                    onClick={handleClose}
                    className="mt-4"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Close
                  </Button>
                )}
              </motion.div>
            )}

            {paymentStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Failed</h3>
                <p className="text-sm text-gray-600 mb-4">
                  There was an error processing your payment. Please try again.
                </p>
                <div className="flex space-x-2 justify-center">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      setPaymentStatus('idle')
                      setPaymentResult(null)
                    }}
                    style={{ backgroundColor: primaryColor }}
                  >
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Payment Button */}
            {paymentStatus === 'idle' && (
              <Button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full py-3 text-base font-medium"
                style={{ 
                  backgroundColor: primaryColor,
                  borderRadius: `${borderRadius}px`
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay {formatCurrency(amount, currency)}
                  </>
                )}
              </Button>
            )}

            {/* Security Badge */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                🔒 Secured by StacksPay • Powered by Bitcoin
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}