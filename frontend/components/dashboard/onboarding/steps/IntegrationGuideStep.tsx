'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Code, 
  Copy, 
  CheckCircle, 
  ExternalLink, 
  Download, 
  FileText, 
  Zap, 
  Globe,
  Smartphone,
  Monitor,
  Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { OnboardingData } from '../MerchantOnboardingWizard'

interface IntegrationGuideStepProps {
  data: OnboardingData
  updateData: (section: keyof OnboardingData, updates: any) => void
  onComplete: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const IntegrationGuideStep = ({ data, updateData, onComplete }: IntegrationGuideStepProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedFramework, setSelectedFramework] = useState('react')

  const apiKey = data.apiKeys.testKey
  const webhookSecret = data.apiKeys.webhookSecret

  const frameworks = [
    { id: 'react', name: 'React', icon: '⚛️' },
    { id: 'nextjs', name: 'Next.js', icon: '▲' },
    { id: 'vue', name: 'Vue.js', icon: '💚' },
    { id: 'vanilla', name: 'HTML/JS', icon: '🌐' },
    { id: 'node', name: 'Node.js', icon: '🟢' },
    { id: 'python', name: 'Python', icon: '🐍' }
  ]

  const integrationExamples = {
    react: `// Install the StacksPay React SDK
npm install stacks-pay-react

// In your React component
import { SbtcPayment } from 'stacks-pay-react'

function CheckoutPage() {
  const handlePaymentSuccess = (payment) => {
    console.log('Payment successful:', payment)
    // Redirect to success page
  }

  return (
    <SbtcPayment 
      apiKey="${apiKey}"
      amount={0.001}
      currency="btc"
      description="Premium subscription"
      customerInfo={{
        email: "customer@example.com",
        name: "John Doe"
      }}
      onSuccess={handlePaymentSuccess}
      onError={(error) => console.error(error)}
    />
  )
}`,

    nextjs: `// pages/api/webhook.js - Webhook handler
import { verifyWebhookSignature } from 'stacks-pay-node'

export default async function handler(req, res) {
  const signature = req.headers['sbtc-signature']
  const payload = JSON.stringify(req.body)
  
  const isValid = verifyWebhookSignature(
    payload, 
    signature, 
    "${webhookSecret}"
  )
  
  if (isValid && req.body.type === 'payment.succeeded') {
    // Payment was successful
    await fulfillOrder(req.body.data.paymentId)
  }
  
  res.status(200).json({ received: true })
}

// In your page component
import { SbtcPayment } from 'stacks-pay-react'

export default function Checkout() {
  return (
    <SbtcPayment 
      apiKey="${apiKey}"
      amount={0.001}
      currency="btc"
      webhookUrl="/api/webhook"
    />
  )
}`,

    vanilla: `<!-- Include StacksPay JS -->
<script src="https://js.stackspay.com/v1/"></script>

<!-- Payment button -->
<div id="stackspay-payment"></div>

<script>
  const stacksPay = StacksPay('${apiKey}')
  
  stacksPay.mount('#stackspay-payment', {
    amount: 0.001,
    currency: 'btc',
    description: 'Your product',
    onSuccess: function(payment) {
      console.log('Payment successful:', payment)
      window.location.href = '/success'
    }
  })
</script>`,

    node: `// Install the Node.js SDK
npm install stacks-pay-node

// Create a payment
const StacksPay = require('stacks-pay-node')
const stacksPay = new StacksPay('${apiKey}')

app.post('/create-payment', async (req, res) => {
  try {
    const payment = await stacksPay.payments.create({
      amount: 0.001,
      currency: 'btc',
      description: 'Premium subscription',
      metadata: {
        orderId: req.body.orderId
      }
    })
    
    res.json({ 
      paymentId: payment.id,
      paymentUrl: payment.url 
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})`,

    python: `# Install the Python SDK
pip install stacks-pay-python

# Create a payment
from stacks_pay import StacksPay

stacksPay = StacksPay('${apiKey}')

@app.route('/create-payment', methods=['POST'])
def create_payment():
    try:
        payment = stacksPay.payments.create(
            amount=0.001,
            currency='btc',
            description='Premium subscription',
            metadata={
                'order_id': request.json['order_id']
            }
        )
        
        return {
            'payment_id': payment.id,
            'payment_url': payment.url
        }
    except Exception as e:
        return {'error': str(e)}, 400`,

    vue: `<!-- Install the Vue SDK -->
npm install stacks-pay-vue

<!-- In your Vue component -->
<template>
  <SbtcPayment 
    :api-key="'${apiKey}'"
    :amount="0.001"
    currency="btc"
    description="Premium subscription"
    @success="handlePaymentSuccess"
    @error="handlePaymentError"
  />
</template>

<script>
import { SbtcPayment } from 'stacks-pay-vue'

export default {
  components: {
    SbtcPayment
  },
  methods: {
    handlePaymentSuccess(payment) {
      console.log('Payment successful:', payment)
      this.$router.push('/success')
    },
    handlePaymentError(error) {
      console.error('Payment error:', error)
    }
  }
}
</script>`
  }

  const copyCode = (code: string, framework: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(framework)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const markIntegrationComplete = () => {
    updateData('integrationStatus', { codeGenerated: true })
    onComplete()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Integration Guide
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Copy and paste these code examples to start accepting Bitcoin payments
        </p>
      </div>

      {/* Framework Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Choose Your Technology</span>
          </CardTitle>
          <CardDescription>
            Select your framework to see customized integration code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {frameworks.map((framework) => (
              <motion.button
                key={framework.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedFramework(framework.id)}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  selectedFramework === framework.id
                    ? 'border-orange-500 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{framework.icon}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {framework.name}
                </div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <CardTitle>Integration Code</CardTitle>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                {frameworks.find(f => f.id === selectedFramework)?.name}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyCode(integrationExamples[selectedFramework as keyof typeof integrationExamples], selectedFramework)}
            >
              {copiedCode === selectedFramework ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
            <pre className="text-green-400 text-sm whitespace-pre-wrap">
              <code>
                {integrationExamples[selectedFramework as keyof typeof integrationExamples]}
              </code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Documentation
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Complete API reference and guides
            </p>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-3 w-3" />
              View Docs
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Download className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              SDK Downloads
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Official SDKs for all platforms
            </p>
            <Button variant="outline" size="sm">
              <Package className="mr-2 h-3 w-3" />
              Get SDKs
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Code className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Code Examples
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Working examples for common use cases
            </p>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-3 w-3" />
              Browse Examples
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                Ready to integrate?
              </h3>
              <p className="text-orange-700 dark:text-orange-300 text-sm mb-4">
                Copy the code above and follow these steps:
              </p>
              <ol className="list-decimal list-inside text-sm text-orange-700 dark:text-orange-300 space-y-1">
                <li>Install the StacksPay SDK for your framework</li>
                <li>Copy your API key to your environment variables</li>
                <li>Add the payment component to your checkout page</li>
                <li>Test with the next step to make sure everything works</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button 
          size="lg"
          onClick={markIntegrationComplete}
          className="min-w-[200px]"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Code Ready - Continue to Test
        </Button>
      </div>
    </div>
  )
}

export default IntegrationGuideStep