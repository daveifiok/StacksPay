'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Code, 
  Terminal, 
  FileCode, 
  Globe, 
  Key, 
  Book, 
  ExternalLink, 
  Copy, 
  CheckCircle,
  Download,
  Zap,
  Layers,
  Shield,
  Cpu,
  Puzzle,
  Eye,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import PaymentWidget from '@/components/payment/payment-widget'
import EmbeddablePaymentWidget from '@/components/widgets/EmbeddablePaymentWidget'
import { PaymentButtonWidget, DonationWidget, CheckoutWidget } from '@/components/widgets/drop-in'

interface CodeSnippet {
  id: string
  title: string
  language: string
  code: string
  description: string
}

const codeSnippets: CodeSnippet[] = [
  {
    id: '1',
    title: 'Initialize Payment',
    language: 'javascript',
    description: 'Create a new Bitcoin payment using our SDK',
    code: `import { StacksPay } from '@stackspay/sdk';

const stacksPay = new StacksPay({
  apiKey: 'your-api-key',
  network: 'testnet'
});

const payment = await stacksPay.payments.create({
  amount: 100000000, // 1 sBTC in satoshis
  currency: 'SBTC',
  description: 'Payment for services',
  customer: {
    email: 'customer@example.com'
  },
  webhook_url: 'https://your-site.com/webhooks'
});`
  },
  {
    id: '2',
    title: 'Verify Payment',
    language: 'javascript',
    description: 'Verify payment status and handle confirmations',
    code: `// Check payment status
const payment = await stacksPay.payments.retrieve(paymentId);

if (payment.status === 'confirmed') {
  // Payment confirmed on blockchain
  console.log('Payment confirmed:', payment.tx_id);
  
  // Update your database
  await updateOrderStatus(payment.metadata.order_id, 'paid');
} else if (payment.status === 'pending') {
  // Still waiting for confirmations
  console.log('Waiting for confirmations:', payment.confirmations);
}`
  },
  {
    id: '3',
    title: 'Handle Webhooks',
    language: 'javascript',
    description: 'Process webhook notifications from StacksPay',
    code: `app.post('/webhooks/stackspay', (req, res) => {
  const signature = req.headers['x-stackspay-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook signature
  if (!stacksPay.webhooks.verify(payload, signature)) {
    return res.status(400).send('Invalid signature');
  }
  
  const event = req.body;
  
  switch (event.type) {
    case 'payment.confirmed':
      console.log('Payment confirmed:', event.data.id);
      break;
    case 'payment.failed':
      console.log('Payment failed:', event.data.id);
      break;
  }
  
  res.status(200).send('OK');
});`
  },
  {
    id: '4',
    title: 'Initialize Payment',
    language: 'python',
    description: 'Create a new Bitcoin payment using Python SDK',
    code: `import stackspay

# Initialize client
client = stackspay.Client(
    api_key='your-api-key',
    network='testnet'
)

# Create payment
payment = client.payments.create({
    'amount': 100000000,  # 1 sBTC in satoshis
    'currency': 'SBTC',
    'description': 'Payment for services',
    'customer': {
        'email': 'customer@example.com'
    },
    'webhook_url': 'https://your-site.com/webhooks'
})`
  },
  {
    id: '5',
    title: 'Verify Payment',
    language: 'python',
    description: 'Check payment status in Python',
    code: `# Check payment status
payment = client.payments.retrieve(payment_id)

if payment['status'] == 'confirmed':
    # Payment confirmed on blockchain
    print(f"Payment confirmed: {payment['tx_id']}")
    
    # Update your database
    update_order_status(payment['metadata']['order_id'], 'paid')
elif payment['status'] == 'pending':
    # Still waiting for confirmations
    print(f"Waiting for confirmations: {payment['confirmations']}")`
  }
]

const sdkLanguages = [
  {
    name: 'Node.js',
    icon: Terminal,
    status: 'available',
    version: 'v2.1.0',
    installCommand: 'npm install @stackspay/sdk'
  },
  {
    name: 'Python',
    icon: Code,
    status: 'available',
    version: 'v1.8.0',
    installCommand: 'pip install stackspay'
  },
  {
    name: 'Rust',
    icon: FileCode,
    status: 'coming-soon',
    version: 'Coming Soon',
    installCommand: ''
  },
  {
    name: 'Go',
    icon: Code,
    status: 'coming-soon',
    version: 'Coming Soon',
    installCommand: ''
  }
]

export default function DeveloperPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeLanguage, setActiveLanguage] = useState('javascript')
  const [activeTab, setActiveTab] = useState('overview')
  
  // Widget playground state
  const [widgetConfig, setWidgetConfig] = useState({
    amount: 0.001,
    currency: 'BTC' as const,
    description: 'Test Payment',
    merchantName: 'Demo Merchant',
    theme: 'light' as const,
    primaryColor: '#ea580c',
    borderRadius: 12,
    showLogo: true,
    showQR: true,
    showPaymentMethods: true,
    embedded: false,
    resizable: true,
    closeable: true
  })
  
  const [generatedCode, setGeneratedCode] = useState('')

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const generateWidgetCode = () => {
    const jsCode = `
// HTML Embed Code
<div id="stackspay-widget"></div>
<script src="https://js.stackspay.com/v1/widget.js"></script>
<script>
  StacksPay.createWidget({
    apiKey: 'your-api-key',
    amount: ${widgetConfig.amount},
    currency: '${widgetConfig.currency}',
    description: '${widgetConfig.description}',
    merchantName: '${widgetConfig.merchantName}',
    theme: '${widgetConfig.theme}',
    primaryColor: '${widgetConfig.primaryColor}',
    borderRadius: ${widgetConfig.borderRadius},
    showLogo: ${widgetConfig.showLogo},
    showQR: ${widgetConfig.showQR},
    showPaymentMethods: ${widgetConfig.showPaymentMethods},
    embedded: ${widgetConfig.embedded},
    resizable: ${widgetConfig.resizable},
    closeable: ${widgetConfig.closeable},
    containerId: 'stackspay-widget',
    onPaymentSuccess: (payment) => {
      console.log('Payment successful:', payment);
    },
    onPaymentError: (error) => {
      console.error('Payment failed:', error);
    }
  });
</script>

// React Component
import { EmbeddablePaymentWidget } from '@stackspay/react';

function PaymentComponent() {
  return (
    <EmbeddablePaymentWidget
      apiKey="your-api-key"
      amount={${widgetConfig.amount}}
      currency="${widgetConfig.currency}"
      description="${widgetConfig.description}"
      merchantName="${widgetConfig.merchantName}"
      theme="${widgetConfig.theme}"
      primaryColor="${widgetConfig.primaryColor}"
      borderRadius={${widgetConfig.borderRadius}}
      showLogo={${widgetConfig.showLogo}}
      showQR={${widgetConfig.showQR}}
      showPaymentMethods={${widgetConfig.showPaymentMethods}}
      embedded={${widgetConfig.embedded}}
      resizable={${widgetConfig.resizable}}
      closeable={${widgetConfig.closeable}}
      onPaymentSuccess={(payment) => {
        console.log('Payment successful:', payment);
      }}
      onPaymentError={(error) => {
        console.error('Payment failed:', error);
      }}
    />
  );
}`;
    
    setGeneratedCode(jsCode)
  }

  const updateWidgetConfig = (key: string, value: any) => {
    setWidgetConfig(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Developer Resources</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tools, documentation, and code examples to integrate StacksPay
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="playground">Widget Playground</TabsTrigger>
          <TabsTrigger value="gallery">Widget Gallery</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">API Version</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">v2.1</p>
            </div>
            <Zap className="h-8 w-8 text-orange-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
              <p className="text-2xl font-bold text-green-600">99.9%</p>
            </div>
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Response Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">150ms</p>
            </div>
            <Cpu className="h-8 w-8 text-orange-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">SDKs Available</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
            </div>
            <Layers className="h-8 w-8 text-orange-600" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SDK Libraries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Layers className="h-5 w-5 text-orange-600" />
              <span>SDK Libraries</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Official SDKs for popular programming languages</p>
          </div>

          <div className="p-6 space-y-4">
            {sdkLanguages.map((sdk, index) => (
              <div key={sdk.name} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border shadow-sm">
                <div className="flex items-center space-x-3">
                  <sdk.icon className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{sdk.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{sdk.version}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={sdk.status === 'available' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' 
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                    }
                  >
                    {sdk.status === 'available' ? 'Available' : 'Coming Soon'}
                  </Badge>
                  {sdk.installCommand && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(sdk.installCommand, `install-${index}`)}
                    >
                      {copiedCode === `install-${index}` ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Globe className="h-5 w-5 text-orange-600" />
              <span>Quick Links</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Essential resources for developers</p>
          </div>

          <div className="p-6 space-y-3">
            <Button variant="ghost" className="w-full justify-between p-4 h-auto">
              <div className="flex items-center space-x-3">
                <Book className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">API Documentation</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Complete API reference</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button variant="ghost" className="w-full justify-between p-4 h-auto">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">sBTC Testnet</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Test your integration</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button variant="ghost" className="w-full justify-between p-4 h-auto">
              <div className="flex items-center space-x-3">
                <Key className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Webhook Guide</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Handle real-time events</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button variant="ghost" className="w-full justify-between p-4 h-auto">
              <div className="flex items-center space-x-3">
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Postman Collection</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Test API endpoints</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
        </TabsContent>

        <TabsContent value="playground" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Widget Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-orange-600" />
                  <span>Widget Configuration</span>
                </CardTitle>
                <CardDescription>Customize your payment widget settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.001"
                      value={widgetConfig.amount}
                      onChange={(e) => updateWidgetConfig('amount', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={widgetConfig.currency}
                      onValueChange={(value) => updateWidgetConfig('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="sBTC">Synthetic Bitcoin (sBTC)</SelectItem>
                        <SelectItem value="STX">Stacks (STX)</SelectItem>
                        <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={widgetConfig.description}
                    onChange={(e) => updateWidgetConfig('description', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="merchantName">Merchant Name</Label>
                  <Input
                    id="merchantName"
                    value={widgetConfig.merchantName}
                    onChange={(e) => updateWidgetConfig('merchantName', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={widgetConfig.theme}
                      onValueChange={(value) => updateWidgetConfig('theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={widgetConfig.primaryColor}
                      onChange={(e) => updateWidgetConfig('primaryColor', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="borderRadius">Border Radius</Label>
                  <Input
                    id="borderRadius"
                    type="range"
                    min="0"
                    max="24"
                    value={widgetConfig.borderRadius}
                    onChange={(e) => updateWidgetConfig('borderRadius', parseInt(e.target.value))}
                  />
                  <span className="text-sm text-gray-500">{widgetConfig.borderRadius}px</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showLogo">Show Logo</Label>
                    <Switch
                      id="showLogo"
                      checked={widgetConfig.showLogo}
                      onCheckedChange={(checked) => updateWidgetConfig('showLogo', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showQR">Show QR Code</Label>
                    <Switch
                      id="showQR"
                      checked={widgetConfig.showQR}
                      onCheckedChange={(checked) => updateWidgetConfig('showQR', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showPaymentMethods">Show Payment Methods</Label>
                    <Switch
                      id="showPaymentMethods"
                      checked={widgetConfig.showPaymentMethods}
                      onCheckedChange={(checked) => updateWidgetConfig('showPaymentMethods', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="resizable">Resizable</Label>
                    <Switch
                      id="resizable"
                      checked={widgetConfig.resizable}
                      onCheckedChange={(checked) => updateWidgetConfig('resizable', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="closeable">Closeable</Label>
                    <Switch
                      id="closeable"
                      checked={widgetConfig.closeable}
                      onCheckedChange={(checked) => updateWidgetConfig('closeable', checked)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={generateWidgetCode}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Generate Code
                </Button>
              </CardContent>
            </Card>

            {/* Widget Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-orange-600" />
                    <span>Live Preview</span>
                  </CardTitle>
                  <CardDescription>Preview your widget configuration</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="w-full max-w-md">
                    <PaymentWidget
                      amount={widgetConfig.amount}
                      currency={widgetConfig.currency}
                      description={widgetConfig.description}
                      merchantName={widgetConfig.merchantName}
                      showQR={widgetConfig.showQR}
                      showPaymentMethods={widgetConfig.showPaymentMethods}
                      customStyles={{
                        borderRadius: `${widgetConfig.borderRadius}px`,
                        borderColor: widgetConfig.primaryColor
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Generated Code */}
              {generatedCode && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Puzzle className="w-5 h-5 text-orange-600" />
                        <span>Generated Code</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedCode, 'generated')}
                      >
                        {copiedCode === 'generated' ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {copiedCode === 'generated' ? 'Copied!' : 'Copy'}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 rounded-lg overflow-hidden border">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-xs text-gray-400">Widget Code</span>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                          <code>{generatedCode}</code>
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Puzzle className="w-5 h-5 text-orange-600" />
                <span>Widget Gallery</span>
              </CardTitle>
              <CardDescription>Live preview of all available drop-in widgets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Payment Button Widget */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Payment Button Widget</h3>
                  <p className="text-sm text-gray-600">Simple payment button for single transactions</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Default Style</h4>
                    <PaymentButtonWidget
                      apiKey="pk_test_demo"
                      amount={0.001}
                      currency="BTC"
                      description="Premium Plan"
                      merchantName="Demo Store"
                      onSuccess={(payment) => console.log('Success:', payment)}
                      onError={(error) => console.log('Error:', error)}
                    />
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Outline Style</h4>
                    <PaymentButtonWidget
                      apiKey="pk_test_demo"
                      amount={0.005}
                      currency="sBTC"
                      description="Annual Subscription"
                      buttonVariant="outline"
                      buttonSize="lg"
                      primaryColor="#8b5cf6"
                      merchantName="Purple Co"
                      onSuccess={(payment) => console.log('Success:', payment)}
                    />
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Custom Color</h4>
                    <PaymentButtonWidget
                      apiKey="pk_test_demo"
                      amount={25}
                      currency="USDC"
                      description="Digital Product"
                      primaryColor="#10b981"
                      borderRadius={12}
                      merchantName="Green Shop"
                      merchantLogo="https://via.placeholder.com/32x32"
                      onSuccess={(payment) => console.log('Success:', payment)}
                    />
                  </div>
                </div>
              </div>

              {/* Donation Widget */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Donation Widget</h3>
                  <p className="text-sm text-gray-600">Customizable donation forms with preset amounts</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Basic Donation</h4>
                    <DonationWidget
                      apiKey="pk_test_demo"
                      organizationName="Save the Ocean"
                      cause="Marine Conservation"
                      currency="BTC"
                      presetAmounts={[0.001, 0.005, 0.01, 0.05]}
                      primaryColor="#0ea5e9"
                      onDonation={(donation) => console.log('Donation:', donation)}
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">With Progress Goal</h4>
                    <DonationWidget
                      apiKey="pk_test_demo"
                      organizationName="Tech for Good"
                      cause="Digital Education"
                      currency="BTC"
                      presetAmounts={[0.002, 0.01, 0.02, 0.1]}
                      showProgress={true}
                      goalAmount={1.0}
                      currentAmount={0.35}
                      donorCount={47}
                      primaryColor="#f59e0b"
                      onDonation={(donation) => console.log('Donation:', donation)}
                    />
                  </div>
                </div>
              </div>

              {/* Checkout Widget */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Checkout Widget</h3>
                  <p className="text-sm text-gray-600">Full e-commerce checkout with multiple items</p>
                </div>
                <div className="max-w-md">
                  <CheckoutWidget
                    apiKey="pk_test_demo"
                    items={[
                      {
                        id: '1',
                        name: 'Bitcoin T-Shirt',
                        description: '100% organic cotton',
                        price: 0.002,
                        quantity: 1,
                        image: 'https://via.placeholder.com/64x64'
                      },
                      {
                        id: '2',
                        name: 'Crypto Sticker Pack',
                        description: 'Set of 10 vinyl stickers',
                        price: 0.0005,
                        quantity: 2,
                        image: 'https://via.placeholder.com/64x64'
                      }
                    ]}
                    currency="BTC"
                    taxRate={0.08}
                    shippingCost={0.0001}
                    merchantName="Crypto Merch"
                    collectShipping={true}
                    collectEmail={true}
                    allowQuantityEdit={true}
                    onSuccess={(order) => console.log('Order:', order)}
                  />
                </div>
              </div>

              {/* Integration Instructions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">How to Use These Widgets</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="bg-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                    <p><strong>Copy the component:</strong> Use any of these widgets in your React app by importing them</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                    <p><strong>Configure props:</strong> Customize colors, amounts, and behavior with props</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                    <p><strong>Handle callbacks:</strong> Use onSuccess, onError callbacks to handle payment results</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                    <p><strong>Test & deploy:</strong> Test in development, then use your live API keys for production</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tip</h4>
                  <p className="text-sm text-blue-800">
                    All widgets are fully customizable and responsive. You can override styles, colors, and behavior to match your brand perfectly.
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
      {/* Code Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Code className="h-5 w-5 text-orange-600" />
            <span>Code Examples</span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Common integration patterns and examples</p>
        </div>

        <div className="p-6">
          <Tabs value={activeLanguage} onValueChange={setActiveLanguage}>
            <TabsList className="grid w-full grid-cols-2 max-w-md bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="javascript" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                JavaScript
              </TabsTrigger>
              <TabsTrigger value="python" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                Python
              </TabsTrigger>
            </TabsList>

            <TabsContent value="javascript" className="mt-6">
              <div className="space-y-6">
                {codeSnippets.filter(s => s.language === 'javascript').map((snippet) => (
                  <div key={snippet.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{snippet.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{snippet.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(snippet.code, snippet.id)}
                        className="bg-white dark:bg-gray-900"
                      >
                        {copiedCode === snippet.id ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {copiedCode === snippet.id ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="bg-gray-900 rounded-lg overflow-hidden border">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-xs text-gray-400">JavaScript</span>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
                          <code>{snippet.code}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="python" className="mt-6">
              <div className="space-y-6">
                {codeSnippets.filter(s => s.language === 'python').map((snippet) => (
                  <div key={snippet.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{snippet.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{snippet.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(snippet.code, snippet.id)}
                        className="bg-white dark:bg-gray-900"
                      >
                        {copiedCode === snippet.id ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {copiedCode === snippet.id ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="bg-gray-900 rounded-lg overflow-hidden border">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-xs text-gray-400">Python</span>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
                          <code>{snippet.code}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SDK Libraries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-orange-600" />
                  <span>SDK Libraries</span>
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Official SDKs for popular programming languages</p>
              </div>

              <div className="p-6 space-y-4">
                {sdkLanguages.map((sdk, index) => (
                  <div key={sdk.name} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border shadow-sm">
                    <div className="flex items-center space-x-3">
                      <sdk.icon className="h-6 w-6 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{sdk.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{sdk.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={sdk.status === 'available' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' 
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                        }
                      >
                        {sdk.status === 'available' ? 'Available' : 'Coming Soon'}
                      </Badge>
                      {sdk.installCommand && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(sdk.installCommand, `install-${index}`)}
                        >
                          {copiedCode === `install-${index}` ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-orange-600" />
                  <span>Quick Links</span>
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Essential resources for developers</p>
              </div>

              <div className="p-6 space-y-3">
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center space-x-3">
                    <Book className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">API Documentation</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Complete API reference</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">sBTC Testnet</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Test your integration</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Webhook Guide</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Handle real-time events</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Postman Collection</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Test API endpoints</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
