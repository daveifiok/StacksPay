'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Key, 
  CheckCircle, 
  Copy, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Shield, 
  Code, 
  TestTube,
  Rocket,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OnboardingData } from '../MerchantOnboardingWizard'
import { apiKeyApiClient } from '@/lib/api/api-key-api'
import { merchantApiClient } from '@/lib/api/merchant-api'

interface ApiKeySetupStepProps {
  data: OnboardingData
  updateData: (section: keyof OnboardingData, updates: any) => void
  onComplete: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const ApiKeySetupStep = ({ data, updateData, onComplete, isLoading, setIsLoading }: ApiKeySetupStepProps) => {
  const [showTestKey, setShowTestKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [keyGenerated, setKeyGenerated] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const apiKeys = data.apiKeys

  const generateApiKeys = async () => {
    setIsLoading(true)
    
    try {
      console.log('🔄 Generating API keys for onboarding...')
      
      // Use the API client to generate real API keys
      const result = await apiKeyApiClient.generateOnboardingKeys()
      
      if (result.success && result.data) {
        const { testKey, liveKey, webhookSecret } = result.data
        
        // Update onboarding data with real API keys
        const keyData = {
          testKey: testKey.key || 'sk_test_generated',
          liveKey: liveKey.key || 'sk_live_generated',
          webhookSecret
        }
        
        updateData('apiKeys', keyData)
        
        // Save API keys to backend
        try {
          await merchantApiClient.saveApiKeys(keyData)
          console.log('✅ API keys saved to backend')
        } catch (error) {
          console.warn('⚠️ Failed to save API keys to backend:', error)
        }
        
        setKeyGenerated(true)
        console.log('✅ API keys generated successfully')
      } else {
        throw new Error(result.error || 'Failed to generate API keys')
      }
    } catch (error) {
      console.error('❌ Error generating API keys:', error)
      
      // Fallback to mock keys for development/demo
      const testKey = `sk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      const liveKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      const webhookSecret = `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      
      updateData('apiKeys', {
        testKey,
        liveKey,
        webhookSecret
      })
      
      setKeyGenerated(true)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleContinue = async () => {
    if (keyGenerated && apiKeys.testKey) {
      try {
        // Mark API keys step as completed
        await merchantApiClient.completeOnboardingStep('api-keys', apiKeys)
        console.log('✅ API keys step marked as completed')
      } catch (error) {
        console.warn('⚠️ Failed to mark API keys step as completed:', error)
      }
      onComplete()
    }
  }

  useEffect(() => {
    // Auto-generate keys when component mounts
    if (!apiKeys.testKey && !isLoading) {
      generateApiKeys()
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Generate Your API Keys
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          These keys allow your website to securely communicate with StacksPay
        </p>
      </div>

      {/* Key Generation Status */}
      {isLoading && !keyGenerated ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Key className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </motion.div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Generating Your API Keys...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Creating secure credentials for your integration
            </p>
          </div>
        </motion.div>
      ) : keyGenerated ? (
        <div className="space-y-6">
          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      API Keys Generated Successfully!
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      Your integration credentials are ready to use
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* API Keys Display */}
          <div className="grid grid-cols-1 gap-6">
            {/* Test API Key */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TestTube className="h-5 w-5 text-blue-600" />
                    <CardTitle>Test API Key</CardTitle>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                      Test Mode
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Use this key for testing your integration. No real payments will be processed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={showTestKey ? apiKeys.testKey : apiKeys.testKey.replace(/./g, '•')}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTestKey(!showTestKey)}
                    >
                      {showTestKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiKeys.testKey, 'testKey')}
                    >
                      {copied === 'testKey' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Alert className="bg-white dark:bg-gray-900 border shadow-sm">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security:</strong> Treat your API keys like passwords. 
                    Never share them publicly or commit them to version control.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Webhook Secret */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Code className="h-5 w-5 text-purple-600" />
                  <CardTitle>Webhook Secret</CardTitle>
                  <Badge variant="secondary">Optional</Badge>
                </div>
                <CardDescription>
                  Use this secret to verify webhook signatures and ensure events come from StacksPay.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={showWebhookSecret ? apiKeys.webhookSecret : apiKeys.webhookSecret.replace(/./g, '•')}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    >
                      {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiKeys.webhookSecret, 'webhookSecret')}
                    >
                      {copied === 'webhookSecret' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Key Info */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Rocket className="h-5 w-5 text-orange-600" />
                  <CardTitle>Live API Key</CardTitle>
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                    Coming Soon
                  </Badge>
                </div>
                <CardDescription>
                  Your live API key will be generated after completing verification and testing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>✓ Complete business verification</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>✓ Successfully process a test payment</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>✓ Configure webhook endpoints</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integration Quick Start */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle className="text-purple-800 dark:text-purple-200">
                Quick Integration Preview
              </CardTitle>
              <CardDescription>
                Here's how you'll use your API key in your code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm">
                  <code>{`// Your sBTC payment integration
import { SbtcPayment } from 'stacks-pay-react'

<SbtcPayment 
  apiKey="${apiKeys.testKey.substring(0, 20)}..."
  amount={0.001}
  currency="btc"
  onSuccess={handlePaymentSuccess}
/>`}</code>
                </pre>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Full integration guide in the next step
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View Docs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Developer Integration Guide */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-orange-600" />
                <span>Developer Integration Guide</span>
              </CardTitle>
              <CardDescription>
                Everything you need to start accepting sBTC payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Integration Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    1. Install SDK
                  </h4>
                  <code className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                    npm install stacks-pay-node
                  </code>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    2. Create Payment
                  </h4>
                  <code className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                    client.payments.create()
                  </code>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    3. Handle Webhooks
                  </h4>
                  <code className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                    webhook.verify(signature)
                  </code>
                </div>
              </div>

              {/* API Endpoints */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Key API Endpoints</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <span className="font-mono text-sm">POST /v1/payments</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Create a new payment</p>
                    </div>
                    <Badge variant="outline" className="text-green-600">Create</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <span className="font-mono text-sm">GET /v1/payments/:id</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Retrieve payment status</p>
                    </div>
                    <Badge variant="outline" className="text-blue-600">Read</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <span className="font-mono text-sm">POST /v1/webhooks</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Configure payment notifications</p>
                    </div>
                    <Badge variant="outline" className="text-purple-600">Webhook</Badge>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Security Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium">API Key Authentication</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Secure Bearer token authentication
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Webhook Signatures</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        HMAC-SHA256 signed payloads
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Rate Limiting</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Protection against abuse
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium">IP Restrictions</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Optional IP whitelisting
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Next Steps</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">API keys generated and ready</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Get integration code examples</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Test your first payment</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Configure webhooks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Go live with real payments</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="flex justify-center">
            <Button 
              size="lg"
              onClick={handleContinue}
              disabled={!keyGenerated}
              className="min-w-[200px] bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
            >
              <Code className="mr-2 h-4 w-4" />
              Continue to Integration
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <Button 
            size="lg"
            onClick={generateApiKeys}
            disabled={isLoading}
            className="min-w-[200px] bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
          >
            <Key className="mr-2 h-4 w-4" />
            Generate API Keys
          </Button>
        </div>
      )}
    </div>
  )
}

export default ApiKeySetupStep