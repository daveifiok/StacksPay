'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  Wallet, 
  QrCode, 
  Copy, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertTriangle,
  Loader2,
  Bitcoin,
  DollarSign,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

interface PaymentWidgetProps {
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

interface Payment {
  id: string
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'expired'
  amount: number
  currency: string
  paymentAddress: string
  qrCodeData: string
  expiresAt: string
}

export default function PaymentWidget({
  amount = 0.001,
  currency = 'sBTC',
  description = 'Payment',
  merchantName = 'StacksPay Merchant',
  onPaymentComplete,
  onPaymentFailed,
  showQR = true,
  showPaymentMethods = true,
  customStyles = {}
}: PaymentWidgetProps) {
  const { toast } = useToast()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>('wallet')
  const [walletConnected, setWalletConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState(0)

  const paymentMethods = [
    { id: 'wallet', name: 'Wallet Connect', icon: Wallet, description: 'Connect your Stacks wallet' },
    { id: 'qr', name: 'QR Code', icon: QrCode, description: 'Scan with mobile wallet' },
    { id: 'manual', name: 'Manual Transfer', icon: CreditCard, description: 'Copy address manually' }
  ]

  const supportedCurrencies = [
    { value: 'sBTC', label: 'sBTC', icon: Bitcoin, color: 'text-orange-500' },
    { value: 'STX', label: 'STX', icon: Zap, color: 'text-purple-500' },
    { value: 'BTC', label: 'BTC', icon: Bitcoin, color: 'text-orange-600' },
    { value: 'USDC', label: 'USDC', icon: DollarSign, color: 'text-blue-500' }
  ]

  // Initialize payment when component mounts
  useEffect(() => {
    initializePayment()
  }, [amount, currency])

  // Simulate progress updates
  useEffect(() => {
    if (payment?.status === 'processing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 10, 90)
          return newProgress
        })
      }, 500)

      const timeout = setTimeout(() => {
        setProgress(100)
        setPayment(prev => prev ? { ...prev, status: 'confirmed' } : null)
        clearInterval(interval)
        toast({
          title: "Payment Confirmed!",
          description: "Your payment has been successfully processed.",
        })
        onPaymentComplete?.(payment)
      }, 5000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [payment?.status])

  const initializePayment = async () => {
    setIsLoading(true)
    try {
      // Simulate payment creation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newPayment: Payment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        status: 'pending',
        amount,
        currency,
        paymentAddress: generateMockAddress(currency),
        qrCodeData: `${currency}:${generateMockAddress(currency)}?amount=${amount}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      }
      
      setPayment(newPayment)
    } catch (error) {
      toast({
        title: "Payment Creation Failed",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      })
      onPaymentFailed?.('Failed to initialize payment')
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockAddress = (currency: string): string => {
    const prefixes = {
      'BTC': 'bc1',
      'sBTC': 'SP',
      'STX': 'SP',
      'USDC': 'SP'
    }
    const prefix = prefixes[currency as keyof typeof prefixes] || 'SP'
    const suffix = Math.random().toString(36).substring(2, 32).toUpperCase()
    return `${prefix}${suffix}`
  }

  const connectWallet = async () => {
    setIsLoading(true)
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      setWalletConnected(true)
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully.",
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const processPayment = async () => {
    if (!payment || !walletConnected) return
    
    setIsLoading(true)
    setProgress(0)
    
    try {
      // Simulate payment processing
      setPayment(prev => prev ? { ...prev, status: 'processing' } : null)
      toast({
        title: "Payment Processing",
        description: "Your payment is being processed...",
      })
    } catch (error) {
      setPayment(prev => prev ? { ...prev, status: 'failed' } : null)
      toast({
        title: "Payment Failed",
        description: "Payment processing failed. Please try again.",
        variant: "destructive"
      })
      onPaymentFailed?.('Payment processing failed')
    } finally {
      setIsLoading(false)
    }
  }

  const copyAddress = async () => {
    if (!payment) return
    
    try {
      await navigator.clipboard.writeText(payment.paymentAddress)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Payment address copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy address",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = () => {
    switch (payment?.status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (payment?.status) {
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'expired':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (isLoading && !payment) {
    return (
      <Card className="w-full max-w-md mx-auto" style={customStyles}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
            <p className="text-sm text-gray-600">Initializing payment...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg" style={customStyles}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{merchantName}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {payment && (
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <Badge className={getStatusColor()}>
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Payment Amount */}
        <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {amount} {currency}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            ≈ ${(amount * (currency === 'sBTC' ? 50000 : currency === 'STX' ? 0.5 : currency === 'BTC' ? 50000 : 1)).toLocaleString()}
          </div>
        </div>

        {/* Payment Status */}
        {payment?.status === 'processing' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing payment...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Success State */}
        <AnimatePresence>
          {payment?.status === 'confirmed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-6 space-y-4"
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-700">Payment Successful!</h3>
                <p className="text-sm text-gray-600">Your payment has been confirmed</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Methods */}
        {payment && payment.status === 'pending' && showPaymentMethods && (
          <Tabs value={selectedMethod} onValueChange={setSelectedMethod}>
            <TabsList className="grid w-full grid-cols-3">
              {paymentMethods.map(method => {
                const Icon = method.icon
                return (
                  <TabsTrigger key={method.id} value={method.id} className="text-xs">
                    <Icon className="h-4 w-4 mr-1" />
                    {method.name}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Wallet Connect */}
            <TabsContent value="wallet" className="space-y-4">
              {!walletConnected ? (
                <Button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4 mr-2" />
                  )}
                  Connect {currency} Wallet
                </Button>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Wallet connected successfully
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={processPayment}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Send Payment
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* QR Code */}
            <TabsContent value="qr" className="space-y-4">
              {showQR && (
                <div className="text-center space-y-4">
                  <div className="inline-block p-4 bg-white rounded-lg border">
                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <QrCode className="h-12 w-12 text-gray-400 mx-auto" />
                        <div className="text-xs text-gray-500">QR Code</div>
                        <div className="text-xs font-mono break-all px-2">
                          {payment.paymentAddress.slice(0, 20)}...
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Scan with your {currency} wallet to pay
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Manual Transfer */}
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-3">
                <Label>Payment Address</Label>
                <div className="flex space-x-2">
                  <Input
                    value={payment.paymentAddress}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyAddress}
                    className={copied ? 'bg-green-50 border-green-200' : ''}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Send exactly {amount} {currency} to the address above
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Payment Info */}
        {payment && (
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Payment ID:</span>
              <span className="font-mono">{payment.id.slice(-8)}</span>
            </div>
            {payment.status === 'pending' && (
              <div className="flex justify-between">
                <span>Expires:</span>
                <span>{new Date(payment.expiresAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Secured by StacksPay
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
