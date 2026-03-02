'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { 
  QrCode, 
  Wallet, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  CreditCard,
  Sun,
  Moon,
  Home,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { usePaymentStatus } from '@/hooks/use-payments'
import Image from 'next/image'

interface PaymentData {
  id: string
  amount: number
  currency: string
  paymentMethod: string
  paymentAddress: string
  description: string
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'expired' | 'cancelled'
  expiresAt: string
  qrCode?: string
  merchantInfo?: {
    name: string
    logo?: string
  }
  paymentInstructions?: {
    title: string
    steps: string[]
    amount: string
    note: string
  }
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const paymentId = params.paymentId as string
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [transactionSent, setTransactionSent] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [qrCodeLoading, setQrCodeLoading] = useState(false)

  // Use real-time payment status polling
  const { data: statusData, isLoading: statusLoading } = usePaymentStatus(paymentId)

  // Fetch payment data on mount
  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!paymentId) return

      try {
        setLoading(true)
        setError(null)

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        
        // Try STX payment endpoint first, then fallback to general payments
        let response = await fetch(`${apiUrl}/api/public/stx/${paymentId}/status`);
        
        if (!response.ok && response.status === 404) {
          // If not found in STX, try general payments endpoint
          response = await fetch(`${apiUrl}/api/public/payments/${paymentId}/status`);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load payment')
        }

        setPaymentData(result.data)
        
        // Generate QR code for payment
        if (result.data && result.data.paymentAddress) {
          generateQRCode(result.data);
        }
      } catch (err) {
        console.error('Error fetching payment:', err)
        setError(err instanceof Error ? err.message : 'Failed to load payment')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentData()
  }, [paymentId])

  // Generate QR code for payment
  const generateQRCode = async (payment: PaymentData) => {
    try {
      setQrCodeLoading(true)
      
      // Import QR code utility
      const { generatePaymentQR } = await import('@/lib/utils/qr-code')
      
      const amount = payment.paymentMethod === 'stx' 
        ? Math.floor(payment.amount * 1000000) // Convert STX to microSTX
        : payment.amount;
      
      const qrUrl = await generatePaymentQR(
        payment.paymentMethod,
        payment.paymentAddress,
        amount,
        payment.description,
        { size: 256, margin: 2 }
      )
      
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      // QR code generation failure shouldn't block the payment flow
    } finally {
      setQrCodeLoading(false)
    }
  }

  // Real-time payment monitoring
  useEffect(() => {
    if (!paymentData || paymentData.status === 'confirmed') return;

    const pollInterval = setInterval(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        
        // Try STX payment endpoint first, then fallback to general payments
        let response = await fetch(`${apiUrl}/api/public/stx/${paymentId}/status`);
        
        if (!response.ok && response.status === 404) {
          // If not found in STX, try general payments endpoint
          response = await fetch(`${apiUrl}/api/public/payments/${paymentId}/status`);
        }
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const currentStatus = paymentData.status;
            const newStatus = result.data.status;
            
            // Update payment data if status changed
            if (currentStatus !== newStatus) {
              setPaymentData(result.data);
              
              // Show notification for status changes
              if (newStatus === 'confirmed') {
                toast({
                  title: "Payment Confirmed!",
                  description: "Your payment has been successfully processed.",
                });
                clearInterval(pollInterval); // Stop polling
              } else if (newStatus === 'processing') {
                toast({
                  title: "Payment Detected",
                  description: "Your payment is being processed...",
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Clean up interval on unmount or when payment is confirmed
    return () => clearInterval(pollInterval);
  }, [paymentData, paymentId, toast]);

  // Update payment data when status changes from the hook (but avoid infinite loops)
  useEffect(() => {
    if (statusData && paymentData && statusData.status !== paymentData.status) {
      setPaymentData(prev => prev ? { ...prev, status: statusData.status as PaymentData['status'] } : null)
    }
  }, [statusData?.status, paymentData?.status])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Payment address copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const connectWallet = async () => {
    try {
      // Import wallet service dynamically to avoid SSR issues
      const { walletService } = await import('@/lib/services/wallet-service')
      
      // Connect using the proper wallet service
      const walletData = await walletService.connectWallet({
        name: 'StacksPay Checkout',
        icon: window.location.origin + '/icons/apple-touch-icon.png'
      })
      
      console.log('Wallet connected:', walletData)
      setWalletConnected(true)
      
      toast({
        title: "Wallet Connected",
        description: `Connected ${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}`,
      })
    } catch (err) {
      console.error('Wallet connection failed:', err)
      toast({
        title: "Connection Failed",
        description: err instanceof Error ? err.message : "Failed to connect wallet. Please try again.",
        variant: "destructive"
      })
    }
  }

  const sendPayment = async () => {
    if (!paymentData || !walletConnected) return

    try {
      setTransactionSent(true)
      
      // Import wallet service dynamically
      const { walletService } = await import('@/lib/services/wallet-service')
      
      // Get current wallet data
      const walletData = await walletService.getCurrentWalletData()
      if (!walletData) {
        throw new Error('Wallet not connected')
      }

      let txId: string;

      // Handle different payment methods
      if (paymentData.paymentMethod === 'stx') {
        // Import STX transaction service for STX payments
        const { stxTransactionService } = await import('@/lib/services/stx-transaction-service')
        
        // Execute STX payment using the transaction service
        const result = await stxTransactionService.executeSTXPayment({
          paymentId: paymentData.id,
          recipient: paymentData.paymentAddress,
          amount: Math.floor(paymentData.amount * 1000000), // Convert STX to microSTX
          memo: `Payment for ${paymentData.description}`
        });

        if (!result.success) {
          throw new Error(result.error || 'STX payment failed')
        }

        txId = result.txId!;
        
        toast({
          title: "STX Payment Sent!",
          description: `Transaction ID: ${txId.slice(0, 8)}...${txId.slice(-8)}`,
        })
      } else {
        // Handle other payment methods (sBTC, BTC, etc.)
        // Generate a mock transaction ID for demo purposes
        txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
        
        toast({
          title: "Payment Sent!",
          description: "Your payment is being processed. You'll see confirmation shortly.",
        })
      }

      // Call the backend to notify about the payment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const endpoint = paymentData.paymentMethod === 'stx' 
        ? `/api/public/stx/${paymentId}/process`
        : `/api/public/payments/${paymentId}/process`;
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: walletData.address,
          transactionId: txId,
          paymentMethod: paymentData.paymentMethod,
          signature: 'mock_signature_for_demo',
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Update payment data to reflect the new status
        setPaymentData(prev => prev ? { ...prev, status: 'processing' } : null)
      } else {
        console.warn('Backend notification failed:', result.error)
        // Don't fail the payment if backend notification fails
        // The Chainhook will detect the payment anyway
      }
    } catch (err) {
      console.error('Payment failed:', err)
      setTransactionSent(false)
      toast({
        title: "Payment Failed",
        description: err instanceof Error ? err.message : 'Failed to send payment',
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'processing':
        return <Clock className="h-6 w-6 text-blue-500" />
      case 'pending':
        return <Clock className="h-6 w-6 text-orange-500" />
      case 'failed':
      case 'expired':
      case 'cancelled':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'pending':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'failed':
      case 'expired':
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        {/* Theme toggle for loading state */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
        
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        {/* Theme toggle for error state */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Payment Not Found</CardTitle>
            <CardDescription>
              {error || 'This payment link may be invalid or expired'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Button onClick={() => router.back()} variant="outline" className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => router.push('/')} variant="default">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = new Date() > new Date(paymentData.expiresAt)
  const isCompleted = paymentData.status === 'confirmed'
  const isFailed = ['failed', 'expired', 'cancelled'].includes(paymentData.status)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {paymentData.merchantInfo?.logo && (
                <Image
                  src={paymentData.merchantInfo.logo}
                  alt={paymentData.merchantInfo?.name || 'Merchant'}
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Payment to {paymentData.merchantInfo?.name || 'StacksPay Merchant'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Powered by StacksPay
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Home Link */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              
              {/* Payment Status */}
              <div className="flex items-center space-x-2">
                {getStatusIcon(paymentData.status)}
                <Badge className={getStatusColor(paymentData.status)}>
                  {paymentData.status.charAt(0).toUpperCase() + paymentData.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Details */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-orange-500" />
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {paymentData.amount} {paymentData.currency}
                  </p>
                  <p className="text-sm text-gray-500">
                    ≈ ${(paymentData.amount * 50000).toLocaleString()} USD
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-gray-100">{paymentData.description}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payment ID</p>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{paymentData.id}</p>
                </div>

                {!isExpired && !isCompleted && !isFailed && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Expires</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(paymentData.expiresAt).toLocaleDateString()} at{' '}
                      {new Date(paymentData.expiresAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Status */}
            <AnimatePresence mode="wait">
              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      Payment confirmed! Thank you for your payment.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {isFailed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 dark:text-red-300">
                      Payment {paymentData.status}. Please contact the merchant for assistance.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {isExpired && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 dark:text-red-300">
                      This payment link has expired. Please request a new payment link from the merchant.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Payment Interface */}
          <div className="space-y-6">
            {!isCompleted && !isFailed && !isExpired && (
              <>
                {/* QR Code */}
                <Card className="bg-white dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <QrCode className="h-5 w-5 text-orange-500" />
                      <span>Scan to Pay</span>
                    </CardTitle>
                    <CardDescription>
                      Scan with your {paymentData.paymentMethod.toUpperCase()} wallet
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="inline-block p-4 bg-white rounded-lg border">
                      {qrCodeLoading ? (
                        <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                        </div>
                      ) : qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="Payment QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                      ) : paymentData.qrCode ? (
                        <img
                          src={paymentData.qrCode}
                          alt="Payment QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                      ) : (
                        <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <QrCode className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Send {paymentData.amount} {paymentData.currency.toUpperCase()}
                      </p>
                      <div className="flex items-center justify-center space-x-2">
                        <p className="text-sm font-mono text-gray-600 dark:text-gray-400 break-all">
                          {paymentData.paymentAddress}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(paymentData.paymentAddress)}
                          className="flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Instructions */}
                {paymentData.paymentInstructions && (
                  <Card className="bg-white dark:bg-gray-900">
                    <CardHeader>
                      <CardTitle>{paymentData.paymentInstructions.title || 'Payment Instructions'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {(paymentData.paymentInstructions.steps || []).map((step, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                {index + 1}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{step}</p>
                          </div>
                        ))}
                      </div>
                      
                      {paymentData.paymentInstructions.note && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {paymentData.paymentInstructions.note}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Wallet Integration */}
                <Card className="bg-white dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Wallet className="h-5 w-5 text-orange-500" />
                      <span>Pay with Wallet</span>
                    </CardTitle>
                    <CardDescription>
                      Connect your wallet for seamless payment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!walletConnected ? (
                      <Button
                        onClick={connectWallet}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect {paymentData.paymentMethod.toUpperCase()} Wallet
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700 dark:text-green-300">
                            Wallet connected
                          </span>
                        </div>
                        
                        <Button
                          onClick={sendPayment}
                          disabled={transactionSent}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {transactionSent ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Send Payment
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Success State */}
            {isCompleted && (
              <Card className="bg-white dark:bg-gray-900 border-green-200">
                <CardContent className="p-6 text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Payment Successful!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your payment of {paymentData.amount} {paymentData.currency.toUpperCase()} has been confirmed.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.close()}
                    variant="outline"
                    className="bg-white dark:bg-gray-900"
                  >
                    Close
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Failed State */}
            {isFailed && (
              <Card className="bg-white dark:bg-gray-900 border-red-200">
                <CardContent className="p-6 text-center space-y-4">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Payment {paymentData.status.charAt(0).toUpperCase() + paymentData.status.slice(1)}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Please contact the merchant for assistance or try again.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="bg-white dark:bg-gray-900"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-4">
            <p>
              Secured by StacksPay • 
              <a href="https://stackspay.com" className="text-orange-600 hover:underline ml-1">
                Learn more
              </a>
            </p>
            <span>•</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-orange-600 p-0 h-auto"
            >
              <Home className="h-3 w-3 mr-1" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}