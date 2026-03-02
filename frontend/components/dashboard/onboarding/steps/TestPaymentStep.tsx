'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TestTube,
  CheckCircle,
  PlayCircle,
  Clock,
  AlertCircle,
  Zap,
  QrCode,
  Wallet,
  ExternalLink,
  RefreshCw,
  Copy,
  Eye,
  DollarSign,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { OnboardingData } from '../MerchantOnboardingWizard'
import { QRCodeSVG } from 'qrcode.react'

interface TestPaymentStepProps {
  data: OnboardingData
  updateData: (section: keyof OnboardingData, updates: any) => void
  onComplete: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

interface TestPayment {
  paymentId: string
  amount: number
  currency: string
  status: string
  paymentLink: string
  uniqueAddress: string
  qrCode?: string
  expectedAmount: number
  expiresAt: string
  createdAt: string
}

const TestPaymentStep = ({ data, updateData, onComplete, isLoading, setIsLoading }: TestPaymentStepProps) => {
  const [testPayment, setTestPayment] = useState<TestPayment | null>(null)
  const [testAmount, setTestAmount] = useState('1')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'creating' | 'waiting' | 'completed' | 'failed'>('idle')
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string>('')

  const createTestPayment = async () => {
    // Check if API keys are available
    if (!data.apiKeys.testKey || data.apiKeys.testKey.length < 20) {
      setError('Test API key not available. Please complete the API Keys setup step first.')
      setPaymentStatus('failed')
      return
    }

    setIsLoading(true)
    setPaymentStatus('creating')
    setError('')

    try {
      console.log('🔄 Creating STX test payment...')

      // Create real STX payment using API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/payments/stx`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.apiKeys.testKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expectedAmount: Math.floor(parseFloat(testAmount) * 1000000), // Convert STX to microSTX
          metadata: 'Test payment from onboarding',
          expiresInMinutes: 30,
          customerEmail: 'test@onboarding.com',
          successUrl: `${window.location.origin}/dashboard/payments`,
          cancelUrl: `${window.location.origin}/dashboard/onboarding`
        })
      })

      const paymentData = await response.json()

      if (!response.ok || !paymentData.success) {
        throw new Error(paymentData.error || `API Error: ${response.status}`)
      }

      console.log('✅ Payment created:', paymentData.payment)

      const realPayment: TestPayment = {
        paymentId: paymentData.payment.paymentId,
        amount: paymentData.payment.expectedAmount / 1000000, // Total amount in STX (includes fees)
        currency: 'STX',
        status: paymentData.payment.status || 'pending',
        paymentLink: paymentData.payment.paymentLink || '',
        uniqueAddress: paymentData.payment.uniqueAddress,
        qrCode: paymentData.payment.qrCodeData || paymentData.payment.qrCode, // Use qrCodeData from API
        expectedAmount: paymentData.payment.expectedAmount,
        expiresAt: paymentData.payment.expiresAt,
        createdAt: paymentData.payment.createdAt || new Date().toISOString()
      }

      setTestPayment(realPayment)
      setPaymentStatus('waiting')
      updateData('integrationStatus', { testPaymentMade: true })

    } catch (error: any) {
      console.error('❌ Error creating test payment:', error)
      setError(error.message || 'Failed to create test payment')
      setPaymentStatus('failed')
    } finally {
      setIsLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!testPayment) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/payments/stx/${testPayment.paymentId}`, {
        headers: {
          'Authorization': `Bearer ${data.apiKeys.testKey}`
        }
      })

      const result = await response.json()

      if (result.success && result.payment.status === 'completed') {
        setTestPayment(prev => prev ? { ...prev, status: 'completed' } : null)
        setPaymentStatus('completed')
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleComplete = () => {
    if (paymentStatus === 'completed' || paymentStatus === 'waiting') {
      onComplete()
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto">
          <TestTube className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Test Your Integration
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Create a real STX test payment and complete it with your Stacks wallet to verify everything works
        </p>
      </div>

      <AnimatePresence mode="wait">
        {paymentStatus === 'idle' && (
          /* Test Payment Setup */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto space-y-6"
          >
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <CardTitle className="text-center">Create Test Payment</CardTitle>
                <CardDescription className="text-center">
                  Generate a real STX test payment that you'll pay with your wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testAmount">Test Amount (STX)</Label>
                  <Input
                    id="testAmount"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500">
                    Testnet STX - use your testnet wallet to pay
                  </p>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <TestTube className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900 dark:text-blue-100">
                    <strong>Real Test:</strong> You'll create an actual payment and pay it with your Stacks wallet.
                    Make sure you have testnet STX!
                  </AlertDescription>
                </Alert>

                {/* Prerequisites Check */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 ${data.apiKeys.testKey ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>API key configured</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 ${data.walletInfo.connected ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Wallet connected</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  onClick={createTestPayment}
                  disabled={isLoading || !testAmount || parseFloat(testAmount) <= 0 || !data.apiKeys.testKey}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Create Test Payment
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {paymentStatus === 'creating' && (
          <motion.div
            key="creating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <TestTube className="h-8 w-8 text-blue-600" />
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Creating Test Payment...
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Setting up your STX payment
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {paymentStatus === 'waiting' && testPayment && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            {/* Payment Created Success */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Test Payment Created Successfully!
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      Now pay it with your Stacks wallet to complete the test
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: QR Code */}
              <Card className="bg-white dark:bg-gray-900 border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5 text-purple-600" />
                    <span>Scan to Pay</span>
                  </CardTitle>
                  <CardDescription>
                    Scan with your Stacks wallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border mx-auto w-fit">
                    {testPayment.qrCode || testPayment.uniqueAddress ? (
                      <QRCodeSVG
                        value={testPayment.qrCode || testPayment.uniqueAddress}
                        size={200}
                      />
                    ) : (
                      <div className="w-[200px] h-[200px] flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <QrCode className="h-12 w-12 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-500">Generating...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right: Payment Details */}
              <Card className="bg-white dark:bg-gray-900 border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-orange-600" />
                    <span>Payment Details</span>
                  </CardTitle>
                  <CardDescription>
                    Send STX to this address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Amount</p>
                      <p className="text-2xl font-bold text-orange-600">{testPayment.amount} STX</p>
                      <p className="text-xs text-gray-500">({testPayment.expectedAmount} microSTX)</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Payment ID</p>
                      <p className="font-mono text-xs text-gray-900 dark:text-gray-100 break-all">
                        {testPayment.paymentId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                        {testPayment.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Unique Address */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <CardTitle>STX Address</CardTitle>
                <CardDescription>
                  Send exactly {testPayment.amount} STX to this address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    value={testPayment.uniqueAddress}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(testPayment.uniqueAddress, 'address')}
                  >
                    {copied === 'address' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                    <strong>Important:</strong> Send exactly {testPayment.amount} STX. The payment will expire in 30 minutes.
                  </AlertDescription>
                </Alert>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkPaymentStatus}
                    className="flex-1"
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Check Status
                  </Button>
                  {testPayment.paymentLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <a href={testPayment.paymentLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-3 w-3" />
                        View Payment Page
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-sm">📱 How to Pay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">1.</span>
                  <p>Open your Stacks wallet (Leather, Xverse, etc.)</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">2.</span>
                  <p>Scan the QR code or copy the STX address above</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">3.</span>
                  <p>Send exactly <strong>{testPayment.amount} STX</strong> (testnet)</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">4.</span>
                  <p>Wait for blockchain confirmation (~10 minutes)</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">5.</span>
                  <p>Click "Check Status" or your webhook will be triggered automatically!</p>
                </div>
              </CardContent>
            </Card>

            {/* Continue Button */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPaymentStatus('idle')}
              >
                Create Another Test
              </Button>
              <Button
                size="lg"
                onClick={handleComplete}
                className="min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {paymentStatus === 'completed' && testPayment && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                  Test Payment Completed! 🎉
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-6">
                  Your integration is working perfectly. You're ready to accept real STX payments!
                </p>

                {/* Test Results */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <Zap className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Integration Works
                    </p>
                    <p className="text-xs text-gray-500">
                      API connection verified
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <Wallet className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Payment Received
                    </p>
                    <p className="text-xs text-gray-500">
                      {testPayment.amount} STX confirmed
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Webhooks Active
                    </p>
                    <p className="text-xs text-gray-500">
                      Events delivered
                    </p>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleComplete}
                  className="min-w-[200px] bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Test - Continue
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {paymentStatus === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto"
          >
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                  Test Payment Failed
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  {error || 'There was an issue creating your test payment.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentStatus('idle')
                    setError('')
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Section */}
      {paymentStatus === 'idle' && (
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  Need testnet STX?
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                  Get free testnet STX tokens from the Stacks faucet to test your integration.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://explorer.hiro.so/sandbox/faucet?chain=testnet" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Get Testnet STX
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TestPaymentStep
