'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  CheckCircle, 
  DollarSign, 
  Zap, 
  Clock, 
  BarChart, 
  Info,
  ArrowRightLeft,
  Wallet,
  Bitcoin,
  Coins
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { OnboardingData } from '../MerchantOnboardingWizard'
import { merchantApiClient } from '@/lib/api/merchant-api'
import { onboardingApiClient } from '@/lib/api/onboarding-api'

interface PaymentPreferencesStepProps {
  data: OnboardingData
  updateData: (section: keyof OnboardingData, updates: any) => void
  onComplete: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const paymentMethods = [
  {
    id: 'bitcoin',
    name: 'Bitcoin (BTC)',
    description: 'Direct Bitcoin payments from any wallet',
    icon: Bitcoin,
    fees: '~$2-5 network fee',
    speed: '10-60 minutes',
    popular: true
  },
  {
    id: 'stx',
    name: 'Stacks (STX)',
    description: 'Fast Stacks token payments',
    icon: Coins,
    fees: '~$0.05 network fee',
    speed: '1-2 minutes',
    popular: false
  },
  {
    id: 'sbtc',
    name: 'sBTC',
    description: 'Bitcoin-backed tokens on Stacks',
    icon: Wallet,
    fees: '~$0.10 network fee',
    speed: '1-2 minutes',
    popular: true
  }
]

const settlementOptions = [
  {
    value: 'instant',
    label: 'Instant Settlement',
    description: 'Receive payments immediately (recommended)',
    fee: 'No additional fee',
    icon: Zap
  },
  {
    value: 'daily',
    label: 'Daily Batch',
    description: 'Receive payments once daily at 6 PM UTC',
    fee: 'Save 0.1% in fees',
    icon: Clock
  },
  {
    value: 'weekly',
    label: 'Weekly Batch',
    description: 'Receive payments weekly on Fridays',
    fee: 'Save 0.2% in fees',
    icon: BarChart
  }
]

const currencies = [
  {
    value: 'sbtc',
    label: 'sBTC',
    description: 'Keep as Bitcoin-backed tokens',
    symbol: '₿',
    recommended: true
  },
  {
    value: 'usd',
    label: 'USD',
    description: 'Convert to US Dollars automatically',
    symbol: '$',
    recommended: false
  },
  {
    value: 'usdt',
    label: 'USDT',
    description: 'Convert to Tether stablecoin',
    symbol: '₮',
    recommended: false
  }
]

const PaymentPreferencesStep = ({ data, updateData, onComplete, isLoading, setIsLoading }: PaymentPreferencesStepProps) => {
  const [isValid, setIsValid] = useState(false)
  const preferences = data.paymentPreferences

  const updatePreferences = (field: string, value: any) => {
    updateData('paymentPreferences', { [field]: value })
  }

  const handleSave = async () => {
    if (!isValid) return

    setIsLoading(true)

    try {
      // Save payment preferences using the merchant API client
      const result = await merchantApiClient.savePaymentPreferences(preferences)

      if (result.success) {
        console.log('✅ Payment preferences saved successfully')

        // Mark this onboarding step as complete in backend
        try {
          await onboardingApiClient.updateOnboardingStep('paymentPreferences', {
            acceptSTX: preferences.acceptSTX,
            acceptBitcoin: preferences.acceptBitcoin,
            acceptSBTC: preferences.acceptSBTC,
            preferredCurrency: preferences.preferredCurrency
          }, 4) // Step 4 is payment preferences
          console.log('✅ Payment preferences onboarding step marked as completed')
        } catch (error) {
          console.error('Error marking paymentPreferences step as complete:', error)
        }

        onComplete()
      } else {
        console.error('❌ Failed to save payment preferences:', result.error)
        // Still allow progression but show error
        onComplete()
      }
    } catch (error) {
      console.error('Error saving payment preferences:', error)
      // Still allow progression to prevent blocking user
      onComplete()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check if at least one payment method is selected
    const hasPaymentMethod = preferences.acceptBitcoin || preferences.acceptSTX || preferences.acceptSBTC
    const hasPreferredCurrency = Boolean(preferences.preferredCurrency)
    const hasSettlementFrequency = Boolean(preferences.settlementFrequency)
    
    const isFormValid = hasPaymentMethod && hasPreferredCurrency && hasSettlementFrequency
    setIsValid(Boolean(isFormValid))
  }, [preferences])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Configure Payment Options
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose which payment methods to accept and how you want to receive settlements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Payment Methods */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Accepted Payment Methods</span>
              </CardTitle>
              <CardDescription>
                Select which cryptocurrencies your customers can use to pay you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const fieldName = `accept${method.id.toUpperCase()}` as keyof typeof preferences
                const isAccepted = preferences[fieldName]

                return (
                  <motion.div
                    key={method.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isAccepted 
                        ? 'border-orange-500 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => updatePreferences(fieldName, !isAccepted)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isAccepted ? 'bg-orange-100 dark:bg-orange-900/20' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Icon className={`h-5 w-5 ${isAccepted ? 'text-orange-600' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {method.name}
                          </h4>
                          {method.popular && (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {method.description}
                        </p>
                        <div className="flex space-x-4 text-xs text-gray-500">
                          <span>Fee: {method.fees}</span>
                          <span>Speed: {method.speed}</span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isAccepted 
                          ? 'border-orange-500 bg-orange-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isAccepted && <CheckCircle className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settlement Options */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowRightLeft className="h-5 w-5" />
                <span>Settlement Preferences</span>
              </CardTitle>
              <CardDescription>
                Choose how you want to receive and convert your payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preferred Currency */}
              <div className="space-y-3">
                <Label>Preferred Settlement Currency</Label>
                <div className="grid grid-cols-1 gap-2">
                  {currencies.map((currency) => (
                    <motion.div
                      key={currency.value}
                      whileHover={{ scale: 1.02 }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        preferences.preferredCurrency === currency.value
                          ? 'border-orange-500 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => updatePreferences('preferredCurrency', currency.value)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          preferences.preferredCurrency === currency.value
                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {currency.symbol}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {currency.label}
                            </span>
                            {currency.recommended && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {currency.description}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          preferences.preferredCurrency === currency.value
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {preferences.preferredCurrency === currency.value && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Settlement Frequency */}
              <div className="space-y-3">
                <Label>Settlement Frequency</Label>
                <Select 
                  value={preferences.settlementFrequency}
                  onValueChange={(value) => updatePreferences('settlementFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose settlement frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    {settlementOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <option.icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Auto-convert Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-convert to USD</Label>
                    <p className="text-sm text-gray-500">
                      Automatically convert Bitcoin payments to USD
                    </p>
                  </div>
                  <Switch
                    checked={preferences.autoConvertToUSD}
                    onCheckedChange={(checked) => updatePreferences('autoConvertToUSD', checked)}
                  />
                </div>

                {preferences.autoConvertToUSD && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pl-4 border-l-2 border-blue-500 dark:border-blue-500"
                  >
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Auto-conversion:</strong> Payments will be converted to USD 
                        at market rates. A 0.25% conversion fee applies.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fee Preview */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-green-800 dark:text-green-200">
                Your Fee Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    StacksPay Fee
                  </span>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                    0.5%
                  </Badge>
                </div>
                
                {preferences.autoConvertToUSD && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Currency Conversion Fee
                    </span>
                    <Badge variant="secondary">
                      0.25%
                    </Badge>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between items-center font-medium">
                  <span className="text-gray-900 dark:text-gray-100">
                    Total Processing Fee
                  </span>
                  <span className="text-lg text-green-600 dark:text-green-400">
                    {preferences.autoConvertToUSD ? '0.75%' : '0.5%'}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  Still 83% lower than traditional processors (2.9% + 30¢)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Configuration Preview */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
            Configuration Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Payment Methods
              </h4>
              <div className="space-y-1">
                {preferences.acceptBitcoin && <div className="text-gray-600 dark:text-gray-400">✓ Bitcoin (BTC)</div>}
                {preferences.acceptSTX && <div className="text-gray-600 dark:text-gray-400">✓ Stacks (STX)</div>}
                {preferences.acceptSBTC && <div className="text-gray-600 dark:text-gray-400">✓ sBTC</div>}
                {!preferences.acceptBitcoin && !preferences.acceptSTX && !preferences.acceptSBTC && (
                  <div className="text-gray-400">No methods selected</div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Settlement
              </h4>
              <div className="text-gray-600 dark:text-gray-400">
                Currency: {currencies.find(c => c.value === preferences.preferredCurrency)?.label || 'Not selected'}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Frequency: {settlementOptions.find(o => o.value === preferences.settlementFrequency)?.label || 'Not selected'}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Auto-convert: {preferences.autoConvertToUSD ? 'Yes' : 'No'}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Fees
              </h4>
              <div className="text-gray-600 dark:text-gray-400">
                Processing: 0.5%
              </div>
              {preferences.autoConvertToUSD && (
                <div className="text-gray-600 dark:text-gray-400">
                  Conversion: 0.25%
                </div>
              )}
              <div className="font-medium text-green-600 dark:text-green-400">
                Total: {preferences.autoConvertToUSD ? '0.75%' : '0.5%'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button 
          size="lg"
          onClick={handleSave}
          disabled={!isValid || isLoading}
          className="min-w-[200px] bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Saving Preferences...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}

export default PaymentPreferencesStep