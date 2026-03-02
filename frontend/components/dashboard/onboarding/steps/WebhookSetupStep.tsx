'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Webhook,
  CheckCircle,
  AlertCircle,
  Globe,
  Shield,
  Copy,
  ExternalLink,
  TestTube,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
  AlertTriangle,
  Zap,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { OnboardingData } from '../MerchantOnboardingWizard'
import { onboardingApiClient } from '@/lib/api/onboarding-api'

interface WebhookSetupStepProps {
  data: OnboardingData
  updateData: (section: keyof OnboardingData, updates: any) => void
  onComplete: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const AVAILABLE_EVENTS = [
  { id: 'payment.created', name: 'Payment Created', description: 'Triggered when a new payment is initiated' },
  { id: 'payment.completed', name: 'Payment Completed', description: 'Triggered when payment is successfully completed' },
  { id: 'payment.failed', name: 'Payment Failed', description: 'Triggered when payment fails' },
  { id: 'payment.expired', name: 'Payment Expired', description: 'Triggered when payment link expires' },
]

const WebhookSetupStep = ({ data, updateData, onComplete, isLoading, setIsLoading }: WebhookSetupStepProps) => {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'payment.created',
    'payment.completed',
    'payment.failed',
    'payment.expired'
  ])
  const [webhookSecret, setWebhookSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    status?: number
    message: string
  } | null>(null)
  const [urlError, setUrlError] = useState('')
  const [copied, setCopied] = useState(false)

  const validateWebhookUrl = (url: string): boolean => {
    if (!url) {
      setUrlError('Webhook URL is required')
      return false
    }

    try {
      const parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        setUrlError('URL must use HTTP or HTTPS protocol')
        return false
      }
      if (parsedUrl.protocol === 'http:' && !url.includes('localhost')) {
        setUrlError('HTTP is only allowed for localhost. Please use HTTPS for production.')
        return false
      }
      setUrlError('')
      return true
    } catch (error) {
      setUrlError('Invalid URL format')
      return false
    }
  }

  const handleConfigureWebhook = async () => {
    if (!validateWebhookUrl(webhookUrl)) {
      return
    }

    if (selectedEvents.length === 0) {
      setUrlError('Please select at least one event to listen to')
      return
    }

    setIsLoading(true)
    setUrlError('')

    try {
      console.log('🔄 Configuring webhook:', { webhookUrl, events: selectedEvents })

      const result = await onboardingApiClient.configureWebhook(webhookUrl, selectedEvents)

      if (result.success && result.data) {
        setWebhookSecret(result.data.webhookSecret)
        setIsConfigured(true)

        console.log('✅ Webhook configured successfully')

        // Show success message briefly before auto-testing
        setTimeout(() => {
          handleTestWebhook()
        }, 1500)
      } else {
        setUrlError(result.error || 'Failed to configure webhook')
        console.error('❌ Webhook configuration failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Error configuring webhook:', error)
      setUrlError(error instanceof Error ? error.message : 'Failed to configure webhook')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestWebhook = async () => {
    if (!isConfigured) {
      setUrlError('Please configure webhook first')
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      console.log('🧪 Testing webhook endpoint:', webhookUrl)

      const result = await onboardingApiClient.testWebhook()

      if (result.success && result.data) {
        setTestResult({
          success: result.data.responseOk,
          status: result.data.responseStatus,
          message: result.data.responseOk
            ? 'Webhook endpoint is responding correctly! ✓'
            : `Webhook returned status ${result.data.responseStatus}. Please check your endpoint.`
        })
        console.log('✅ Webhook test completed:', result.data)
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Webhook test failed. Could not reach endpoint.'
        })
        console.error('❌ Webhook test failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Error testing webhook:', error)
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test webhook'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleContinue = () => {
    if (isConfigured && testResult?.success) {
      onComplete()
    }
  }

  const handleSkip = () => {
    // Allow skipping webhook setup for now
    onComplete()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto">
          <Webhook className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Configure Webhooks
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Webhooks notify your server about payment events in real-time. Enter your endpoint URL to receive notifications.
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <strong>New to webhooks?</strong> No worries! You can set this up later and use our dashboard to monitor payments for now.
        </AlertDescription>
      </Alert>

      <AnimatePresence mode="wait">
        {!isConfigured ? (
          /* Configuration Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Webhook URL Input */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  <CardTitle>Webhook Endpoint URL</CardTitle>
                </div>
                <CardDescription>
                  The URL where StacksPay will send payment event notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Endpoint URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://your-domain.com/webhooks/stackspay"
                    value={webhookUrl}
                    onChange={(e) => {
                      setWebhookUrl(e.target.value)
                      setUrlError('')
                    }}
                    onBlur={() => webhookUrl && validateWebhookUrl(webhookUrl)}
                    className={urlError ? 'border-red-500' : ''}
                  />
                  {urlError && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{urlError}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Example: https://api.yourstore.com/webhooks/payments
                  </p>
                </div>

                <Alert className="bg-white dark:bg-gray-900 border shadow-sm">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security:</strong> All webhook requests are signed with HMAC-SHA256.
                    You'll receive a secret key to verify request authenticity.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Event Selection */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <CardTitle>Select Events to Listen</CardTitle>
                </div>
                <CardDescription>
                  Choose which payment events should trigger webhook notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Checkbox
                        id={event.id}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={event.id}
                          className="font-medium text-sm cursor-pointer"
                        >
                          {event.name}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Testing Services Helper */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <TestTube className="h-4 w-4" />
                  <span>Testing Webhooks Locally?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Use these tools to expose your local development server:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://webhook.site" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Webhook.site
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://ngrok.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      ngrok
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://localtunnel.github.io" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      localtunnel
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Skip for now
              </Button>
              <Button
                size="lg"
                onClick={handleConfigureWebhook}
                disabled={isLoading || !webhookUrl || selectedEvents.length === 0}
                className="min-w-[180px] bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  <>
                    <Webhook className="mr-2 h-4 w-4" />
                    Configure Webhook
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Configured & Testing */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Success Message */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Card className="bg-white dark:bg-gray-900 border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                        Webhook Configured Successfully!
                      </h3>
                      <p className="text-green-700 dark:text-green-300">
                        Your webhook endpoint is ready to receive events
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Webhook Details */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-purple-600" />
                  <span>Webhook Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Endpoint URL</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={webhookUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={showSecret ? webhookSecret : webhookSecret.replace(/./g, '•')}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(webhookSecret)}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Use this secret to verify webhook signatures (HMAC-SHA256)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Selected Events</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvents.map((eventId) => (
                      <Badge key={eventId} variant="secondary">
                        {AVAILABLE_EVENTS.find(e => e.id === eventId)?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Webhook */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TestTube className="h-5 w-5 text-blue-600" />
                    <CardTitle>Test Your Webhook</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestWebhook}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-3 w-3" />
                        Test Again
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  We'll send a test event to verify your endpoint is working
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testResult && (
                  <Alert className={testResult.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}>
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}>
                      {testResult.message}
                      {testResult.status && (
                        <span className="block text-sm mt-1">
                          HTTP Status: {testResult.status}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {!testResult && !isTesting && (
                  <p className="text-sm text-gray-500">
                    Click "Test Again" to send a test webhook event
                  </p>
                )}

                {isTesting && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending test event to your endpoint...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Signature Verification Example */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Webhook Signature Verification</CardTitle>
                <CardDescription>
                  Use this code to verify webhook signatures in your server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-xs">
                    <code>{`// Node.js example
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === expectedSignature;
}

// Express.js webhook handler
app.post('/webhooks/stackspay', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const webhookSecret = '${webhookSecret.substring(0, 20)}...';

  if (!verifyWebhookSignature(req.body, signature, webhookSecret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook event
  const event = req.body;
  console.log('Received event:', event.type);

  res.status(200).json({ received: true });
});`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Continue Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!testResult?.success}
                className="min-w-[200px] bg-purple-600 hover:bg-purple-700 text-white"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default WebhookSetupStep
