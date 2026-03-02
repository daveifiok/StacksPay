'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  DollarSign, 
  Calculator, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Bitcoin,
  Zap,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

interface PaymentFormData {
  amount: string
  currency: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  description: string
  recipient?: string
  memo?: string
  priority: 'low' | 'medium' | 'high'
  expires?: string
  allowPartialPayments: boolean
  requireConfirmation: boolean
}

interface PaymentFormProps {
  onSubmit?: (data: PaymentFormData) => void
  onCancel?: () => void
  initialData?: Partial<PaymentFormData>
  loading?: boolean
  showAdvancedOptions?: boolean
  currencies?: Array<'BTC' | 'STX' | 'sBTC' | 'USDC'>
  maxAmount?: number
  minAmount?: number
  recipientRequired?: boolean
}

const CURRENCY_INFO = {
  BTC: { 
    name: 'Bitcoin', 
    icon: Bitcoin, 
    color: 'text-orange-600',
    decimals: 8,
    minAmount: 0.00001,
    fees: { low: 0.0001, medium: 0.0005, high: 0.001 }
  },
  sBTC: { 
    name: 'Synthetic Bitcoin', 
    icon: Bitcoin, 
    color: 'text-orange-500',
    decimals: 8,
    minAmount: 0.00001,
    fees: { low: 0.00001, medium: 0.00005, high: 0.0001 }
  },
  STX: { 
    name: 'Stacks', 
    icon: Zap, 
    color: 'text-purple-600',
    decimals: 6,
    minAmount: 0.000001,
    fees: { low: 0.001, medium: 0.005, high: 0.01 }
  },
  USDC: { 
    name: 'USD Coin', 
    icon: DollarSign, 
    color: 'text-blue-600',
    decimals: 6,
    minAmount: 0.01,
    fees: { low: 0.01, medium: 0.05, high: 0.1 }
  }
}

const PRIORITY_INFO = {
  low: { name: 'Economy', description: 'Slower confirmation, lower fees', multiplier: 0.5 },
  medium: { name: 'Standard', description: 'Balanced speed and cost', multiplier: 1 },
  high: { name: 'Priority', description: 'Faster confirmation, higher fees', multiplier: 2 }
}

export default function PaymentForm({
  onSubmit,
  onCancel,
  initialData = {},
  loading = false,
  showAdvancedOptions = false,
  currencies = ['BTC', 'sBTC', 'STX', 'USDC'],
  maxAmount,
  minAmount,
  recipientRequired = false
}: PaymentFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    currency: 'sBTC',
    description: '',
    recipient: '',
    memo: '',
    priority: 'medium',
    allowPartialPayments: false,
    requireConfirmation: true,
    ...initialData
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [usdValue, setUsdValue] = useState<number | null>(null)
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions)
  const [isCalculating, setIsCalculating] = useState(false)

  // Calculate USD value and fees when amount or currency changes
  useEffect(() => {
    if (formData.amount && parseFloat(formData.amount) > 0) {
      calculateValues()
    } else {
      setUsdValue(null)
      setEstimatedFee(null)
    }
  }, [formData.amount, formData.currency, formData.priority])

  const calculateValues = async () => {
    setIsCalculating(true)
    try {
      // Simulate API call for live rates
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const amount = parseFloat(formData.amount)
      const currency = formData.currency
      const priority = formData.priority
      
      // Mock exchange rates
      const rates = {
        BTC: 45000,
        sBTC: 45000,
        STX: 0.6,
        USDC: 1
      }
      
      const usdAmount = amount * rates[currency]
      setUsdValue(usdAmount)
      
      // Calculate fee
      const feeAmount = CURRENCY_INFO[currency].fees[priority]
      setEstimatedFee(feeAmount)
      
    } catch (error) {
      console.error('Failed to calculate values:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Amount validation
    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else {
      const amount = parseFloat(formData.amount)
      const currencyInfo = CURRENCY_INFO[formData.currency]
      
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Please enter a valid amount'
      } else if (amount < currencyInfo.minAmount) {
        newErrors.amount = `Minimum amount is ${currencyInfo.minAmount} ${formData.currency}`
      } else if (minAmount && amount < minAmount) {
        newErrors.amount = `Amount must be at least ${minAmount} ${formData.currency}`
      } else if (maxAmount && amount > maxAmount) {
        newErrors.amount = `Amount cannot exceed ${maxAmount} ${formData.currency}`
      }
    }
    
    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length > 200) {
      newErrors.description = 'Description is too long (max 200 characters)'
    }
    
    // Recipient validation
    if (recipientRequired && !formData.recipient?.trim()) {
      newErrors.recipient = 'Recipient address is required'
    } else if (formData.recipient && !isValidAddress(formData.recipient, formData.currency)) {
      newErrors.recipient = 'Invalid recipient address format'
    }
    
    // Expiry validation
    if (formData.expires) {
      const expiryDate = new Date(formData.expires)
      if (expiryDate <= new Date()) {
        newErrors.expires = 'Expiry date must be in the future'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidAddress = (address: string, currency: string): boolean => {
    // Basic address validation - in production, use proper validation libraries
    const patterns = {
      BTC: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
      sBTC: /^SP[0-9A-Z]{39}$/,
      STX: /^S[PT][0-9A-Z]{39}$/,
      USDC: /^SP[0-9A-Z]{39}$/
    }
    
    return patterns[currency as keyof typeof patterns]?.test(address) || false
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      })
      return
    }
    
    onSubmit?.(formData)
  }

  const handleInputChange = (field: keyof PaymentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatAmount = (amount: string): string => {
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    
    const decimals = CURRENCY_INFO[formData.currency].decimals
    return num.toFixed(Math.min(decimals, 8))
  }

  const CurrencyIcon = CURRENCY_INFO[formData.currency].icon

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Create Payment</span>
        </CardTitle>
        <CardDescription>
          Set up a payment request with customizable options
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  className={`pr-12 ${errors.amount ? 'border-red-500' : ''}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  {isCalculating && <Loader2 className="h-3 w-3 animate-spin" />}
                  <CurrencyIcon className={`h-4 w-4 ${CURRENCY_INFO[formData.currency].color}`} />
                </div>
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount}</p>
              )}
              {usdValue && (
                <p className="text-sm text-gray-600">
                  ≈ ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => {
                    const Icon = CURRENCY_INFO[currency].icon
                    return (
                      <SelectItem key={currency} value={currency}>
                        <div className="flex items-center space-x-2">
                          <Icon className={`h-4 w-4 ${CURRENCY_INFO[currency].color}`} />
                          <span>{currency}</span>
                          <span className="text-xs text-gray-500">
                            {CURRENCY_INFO[currency].name}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="What is this payment for?"
              className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Be clear about what you're requesting payment for</span>
              <span>{formData.description.length}/200</span>
            </div>
          </div>

          {/* Recipient (optional) */}
          {(showAdvanced || recipientRequired) && (
            <div className="space-y-2">
              <Label htmlFor="recipient">
                Recipient Address {recipientRequired && '*'}
              </Label>
              <Input
                id="recipient"
                value={formData.recipient}
                onChange={(e) => handleInputChange('recipient', e.target.value)}
                placeholder={`Enter ${formData.currency} address`}
                className={`font-mono text-sm ${errors.recipient ? 'border-red-500' : ''}`}
              />
              {errors.recipient && (
                <p className="text-sm text-red-600">{errors.recipient}</p>
              )}
            </div>
          )}

          {/* Priority */}
          <div className="space-y-3">
            <Label>Transaction Priority</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PRIORITY_INFO).map(([key, info]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="button"
                    variant={formData.priority === key ? 'default' : 'outline'}
                    onClick={() => handleInputChange('priority', key)}
                    className="h-auto p-3 flex flex-col space-y-1 w-full"
                  >
                    <span className="font-medium">{info.name}</span>
                    <span className="text-xs opacity-75">{info.description}</span>
                    {estimatedFee && (
                      <Badge variant="secondary" className="text-xs">
                        {(estimatedFee * info.multiplier).toFixed(6)} {formData.currency}
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between"
            >
              Advanced Options
              <motion.div
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </Button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Expiry */}
                  <div className="space-y-2">
                    <Label htmlFor="expires">Expiry Date (Optional)</Label>
                    <Input
                      id="expires"
                      type="datetime-local"
                      value={formData.expires}
                      onChange={(e) => handleInputChange('expires', e.target.value)}
                      className={errors.expires ? 'border-red-500' : ''}
                    />
                    {errors.expires && (
                      <p className="text-sm text-red-600">{errors.expires}</p>
                    )}
                  </div>

                  {/* Memo */}
                  <div className="space-y-2">
                    <Label htmlFor="memo">Memo (Optional)</Label>
                    <Input
                      id="memo"
                      value={formData.memo}
                      onChange={(e) => handleInputChange('memo', e.target.value)}
                      placeholder="Additional note for the transaction"
                      maxLength={100}
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Allow Partial Payments</Label>
                        <p className="text-xs text-gray-600">
                          Accept payments less than the full amount
                        </p>
                      </div>
                      <Switch
                        checked={formData.allowPartialPayments}
                        onCheckedChange={(checked) => handleInputChange('allowPartialPayments', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Require Confirmation</Label>
                        <p className="text-xs text-gray-600">
                          Wait for blockchain confirmation before completing
                        </p>
                      </div>
                      <Switch
                        checked={formData.requireConfirmation}
                        onCheckedChange={(checked) => handleInputChange('requireConfirmation', checked)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Summary */}
          {formData.amount && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-medium">
                  {formatAmount(formData.amount)} {formData.currency}
                </span>
              </div>
              {estimatedFee && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Fee:</span>
                  <span className="text-sm">
                    {estimatedFee * PRIORITY_INFO[formData.priority].multiplier} {formData.currency}
                  </span>
                </div>
              )}
              {usdValue && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">USD Value:</span>
                  <span className="text-sm">
                    ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-700">
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Create Payment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
