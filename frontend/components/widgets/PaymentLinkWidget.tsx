'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Link, 
  Copy, 
  Share, 
  QrCode, 
  Mail, 
  MessageSquare,
  Download,
  ExternalLink,
  CheckCircle,
  Settings,
  Calendar,
  DollarSign,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  BarChart3,
  Users,
  CreditCard
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import QRCode from '@/components/payment/qr-code'

interface PaymentLinkConfig {
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

interface PaymentLink {
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

interface PaymentLinkWidgetProps {
  onLinkCreate?: (link: PaymentLink) => void
  onLinkUpdate?: (linkId: string, updates: Partial<PaymentLinkConfig>) => void
  onLinkDelete?: (linkId: string) => void
  existingLinks?: PaymentLink[]
  showAnalytics?: boolean
  allowCustomization?: boolean
  defaultCurrency?: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  merchantName?: string
}

const SHARE_METHODS = [
  { id: 'copy', name: 'Copy Link', icon: Copy },
  { id: 'qr', name: 'QR Code', icon: QrCode },
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'sms', name: 'SMS', icon: MessageSquare },
  { id: 'social', name: 'Social Media', icon: Share }
]

const CURRENCY_INFO = {
  BTC: { name: 'Bitcoin', symbol: '₿' },
  sBTC: { name: 'Synthetic Bitcoin', symbol: '₿' },
  STX: { name: 'Stacks', symbol: 'STX' },
  USDC: { name: 'USD Coin', symbol: '$' }
}

export default function PaymentLinkWidget({
  onLinkCreate,
  onLinkUpdate,
  onLinkDelete,
  existingLinks = [],
  showAnalytics = true,
  allowCustomization = true,
  defaultCurrency = 'sBTC',
  merchantName = 'Your Business'
}: PaymentLinkWidgetProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'analytics'>('create')
  const [config, setConfig] = useState<PaymentLinkConfig>({
    currency: defaultCurrency,
    description: '',
    allowCustomAmount: false,
    collectCustomerInfo: false,
    requireShipping: false
  })
  const [isCreating, setIsCreating] = useState(false)
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const generatePaymentLink = async (): Promise<PaymentLink> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const linkId = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    const url = `https://pay.stackspay.com/l/${linkId}`
    const shortUrl = `https://spay.co/${linkId.slice(-8)}`
    
    return {
      id: linkId,
      url,
      shortUrl,
      qrCode: url, // In real implementation, generate actual QR code
      config: { ...config },
      createdAt: new Date().toISOString(),
      stats: {
        views: 0,
        payments: 0,
        revenue: 0,
        conversionRate: 0
      },
      isActive: true
    }
  }

  const handleCreateLink = async () => {
    if (!config.description.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please enter a description for your payment link',
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    try {
      const newLink = await generatePaymentLink()
      onLinkCreate?.(newLink)
      toast({
        title: 'Payment Link Created!',
        description: 'Your payment link is ready to share',
      })
      setSelectedLink(newLink)
      setActiveTab('manage')
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create payment link. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyLink = async (url: string, type: string = 'link') => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(type)
      toast({
        title: 'Copied!',
        description: `${type === 'link' ? 'Payment link' : 'Short URL'} copied to clipboard`,
      })
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  const handleShare = async (method: string, link: PaymentLink) => {
    const shareData = {
      title: `Payment Request - ${merchantName}`,
      text: `${link.config.description}\n\n${link.config.amount ? `Amount: ${link.config.amount} ${link.config.currency}` : 'Custom amount'}`,
      url: link.shortUrl
    }

    switch (method) {
      case 'copy':
        handleCopyLink(link.shortUrl)
        break
      case 'email':
        const emailBody = encodeURIComponent(`${shareData.text}\\n\\nPay here: ${link.shortUrl}`)
        window.open(`mailto:?subject=${encodeURIComponent(shareData.title)}&body=${emailBody}`)
        break
      case 'sms':
        const smsBody = encodeURIComponent(`${shareData.text} - ${link.shortUrl}`)
        window.open(`sms:?body=${smsBody}`)
        break
      case 'social':
        if (navigator.share) {
          try {
            await navigator.share(shareData)
          } catch (error) {
            handleCopyLink(link.shortUrl)
          }
        } else {
          handleCopyLink(link.shortUrl)
        }
        break
      case 'qr':
        setSelectedLink(link)
        setShowQRDialog(true)
        break
    }
    setShowShareDialog(false)
  }

  const handleToggleLinkStatus = async (linkId: string, isActive: boolean) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      onLinkUpdate?.(linkId, { isActive } as any)
      toast({
        title: 'Link Updated',
        description: `Payment link ${isActive ? 'activated' : 'deactivated'}`,
      })
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update payment link',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      onLinkDelete?.(linkId)
      toast({
        title: 'Link Deleted',
        description: 'Payment link has been permanently deleted',
      })
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete payment link',
        variant: 'destructive'
      })
    }
  }

  const formatCurrency = (amount: number, currency: string): string => {
    const symbol = CURRENCY_INFO[currency as keyof typeof CURRENCY_INFO]?.symbol || currency
    if (currency === 'USDC') {
      return `${symbol}${amount.toFixed(2)}`
    }
    if (currency === 'STX') {
      return `${amount.toFixed(6)} ${symbol}`
    }
    if (currency === 'BTC' || currency === 'sBTC') {
      return `${symbol}${amount.toFixed(6)}`
    }
    return `${amount} ${currency}`
  }

  const calculateTotalStats = () => {
    return existingLinks.reduce((acc, link) => ({
      views: acc.views + link.stats.views,
      payments: acc.payments + link.stats.payments,
      revenue: acc.revenue + link.stats.revenue
    }), { views: 0, payments: 0, revenue: 0 })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Link className="h-5 w-5" />
          <span>Payment Links</span>
        </CardTitle>
        <CardDescription>
          Create shareable payment links for easy checkout
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Link</TabsTrigger>
            <TabsTrigger value="manage">
              Manage Links
              {existingLinks.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {existingLinks.length}
                </Badge>
              )}
            </TabsTrigger>
            {showAnalytics && (
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            )}
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount Configuration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Amount</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.allowCustomAmount}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, allowCustomAmount: checked }))
                      }
                    />
                    <span className="text-sm">Allow custom amount</span>
                  </div>
                </div>

                {!config.allowCustomAmount && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        step="any"
                        value={config.amount || ''}
                        onChange={(e) => 
                          setConfig(prev => ({ ...prev, amount: parseFloat(e.target.value) || undefined }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select 
                        value={config.currency} 
                        onValueChange={(value) => 
                          setConfig(prev => ({ ...prev, currency: value as any }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CURRENCY_INFO).map(([key, info]) => (
                            <SelectItem key={key} value={key}>
                              {info.symbol} {info.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {config.allowCustomAmount && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Min Amount (optional)</Label>
                      <Input
                        type="number"
                        step="any"
                        value={config.minAmount || ''}
                        onChange={(e) => 
                          setConfig(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || undefined }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Max Amount (optional)</Label>
                      <Input
                        type="number"
                        step="any"
                        value={config.maxAmount || ''}
                        onChange={(e) => 
                          setConfig(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || undefined }))
                        }
                        placeholder="No limit"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description & Settings */}
              <div className="space-y-4">
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={config.description}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="What is this payment for?"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Collect customer information</Label>
                    <Switch
                      checked={config.collectCustomerInfo}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, collectCustomerInfo: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Require shipping address</Label>
                    <Switch
                      checked={config.requireShipping}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, requireShipping: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            {allowCustomization && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Advanced Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Expiration Date (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={config.expiresAt || ''}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, expiresAt: e.target.value || undefined }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Max Uses (optional)</Label>
                    <Input
                      type="number"
                      value={config.maxUses || ''}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, maxUses: parseInt(e.target.value) || undefined }))
                      }
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Success URL (optional)</Label>
                    <Input
                      type="url"
                      value={config.successUrl || ''}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, successUrl: e.target.value || undefined }))
                      }
                      placeholder="https://yoursite.com/success"
                    />
                  </div>
                  
                  <div>
                    <Label>Cancel URL (optional)</Label>
                    <Input
                      type="url"
                      value={config.cancelUrl || ''}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, cancelUrl: e.target.value || undefined }))
                      }
                      placeholder="https://yoursite.com/cancel"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium mb-3">Preview</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Description:</span>
                  <span>{config.description || 'Payment description'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>
                    {config.allowCustomAmount 
                      ? 'Customer chooses' 
                      : config.amount 
                        ? formatCurrency(config.amount, config.currency)
                        : 'Not set'
                    }
                  </span>
                </div>
                {config.expiresAt && (
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span>{new Date(config.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleCreateLink}
              disabled={isCreating || !config.description.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              {isCreating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Link className="h-4 w-4 mr-2" />
              )}
              Create Payment Link
            </Button>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-4 mt-6">
            {existingLinks.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Link className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    No payment links yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create your first payment link to get started
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab('create')}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Create Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {existingLinks.map((link) => (
                  <Card key={link.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-medium">{link.config.description}</h3>
                        <div className="text-sm text-gray-600 space-x-4">
                          <span>
                            {link.config.allowCustomAmount 
                              ? 'Custom amount'
                              : formatCurrency(link.config.amount || 0, link.config.currency)
                            }
                          </span>
                          <span>•</span>
                          <span>{link.stats.views} views</span>
                          <span>•</span>
                          <span>{link.stats.payments} payments</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={link.isActive ? 'default' : 'secondary'}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-4">
                      <Input
                        value={link.shortUrl}
                        readOnly
                        className="font-mono text-sm flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(link.shortUrl)}
                        className={copied === 'link' ? 'bg-green-50 border-green-200' : ''}
                      >
                        {copied === 'link' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLink(link)
                          setShowShareDialog(true)
                        }}
                      >
                        <Share className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLink(link)
                          setShowQRDialog(true)
                        }}
                      >
                        <QrCode className="h-3 w-3 mr-1" />
                        QR Code
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleLinkStatus(link.id, !link.isActive)}
                      >
                        {link.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLink(link.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          {showAnalytics && (
            <TabsContent value="analytics" className="space-y-6 mt-6">
              {existingLinks.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      No analytics data
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Create payment links to see analytics
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      const stats = calculateTotalStats()
                      return [
                        { label: 'Total Views', value: stats.views, icon: Eye },
                        { label: 'Total Payments', value: stats.payments, icon: CreditCard },
                        { label: 'Total Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign }
                      ].map((stat, index) => {
                        const Icon = stat.icon
                        return (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                  <Icon className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {stat.label}
                                  </p>
                                  <p className="text-xl font-semibold">
                                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })
                    })()}
                  </div>

                  {/* Individual Link Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Link Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {existingLinks
                          .sort((a, b) => b.stats.views - a.stats.views)
                          .map((link) => (
                            <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <h3 className="font-medium text-sm">{link.config.description}</h3>
                                <div className="text-xs text-gray-600 mt-1">
                                  Created {new Date(link.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                                <div>
                                  <div className="font-medium">{link.stats.views}</div>
                                  <div className="text-gray-600">Views</div>
                                </div>
                                <div>
                                  <div className="font-medium">{link.stats.payments}</div>
                                  <div className="text-gray-600">Payments</div>
                                </div>
                                <div>
                                  <div className="font-medium">{link.stats.conversionRate.toFixed(1)}%</div>
                                  <div className="text-gray-600">Conversion</div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              Share this QR code for easy mobile payments
            </DialogDescription>
          </DialogHeader>
          
          {selectedLink && (
            <div className="space-y-4">
              <QRCode
                value={selectedLink.shortUrl}
                size={240}
                showCopy
                showDownload
                label={selectedLink.config.description}
              />
              
              <div className="text-center text-sm text-gray-600">
                Scan with any QR reader or compatible wallet
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Payment Link</DialogTitle>
            <DialogDescription>
              Choose how you'd like to share this payment link
            </DialogDescription>
          </DialogHeader>
          
          {selectedLink && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {SHARE_METHODS.map((method) => {
                  const Icon = method.icon
                  return (
                    <Button
                      key={method.id}
                      variant="outline"
                      onClick={() => handleShare(method.id, selectedLink)}
                      className="h-auto p-4 flex flex-col space-y-2"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{method.name}</span>
                    </Button>
                  )
                })}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Direct Link</Label>
                <div className="flex space-x-2">
                  <Input
                    value={selectedLink.shortUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleCopyLink(selectedLink.shortUrl)}
                    className={copied === 'link' ? 'bg-green-50 border-green-200' : ''}
                  >
                    {copied === 'link' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}