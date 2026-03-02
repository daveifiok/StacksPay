'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, DollarSign, Loader2, CheckCircle, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DonationWidgetProps {
  // Required props
  apiKey: string
  organizationName: string
  cause: string
  
  // Optional customization
  currency?: 'BTC' | 'sBTC' | 'STX' | 'USDC'
  presetAmounts?: number[]
  minAmount?: number
  maxAmount?: number
  theme?: 'light' | 'dark' | 'auto'
  primaryColor?: string
  borderRadius?: number
  
  // Branding
  organizationLogo?: string
  backgroundImage?: string
  
  // Display options
  showProgress?: boolean
  goalAmount?: number
  currentAmount?: number
  donorCount?: number
  
  // Callbacks
  onDonation?: (donation: any) => void
  onError?: (error: string) => void
  
  // Styling
  className?: string
  style?: React.CSSProperties
}

export default function DonationWidget({
  apiKey,
  organizationName,
  cause,
  currency = 'BTC',
  presetAmounts = [0.001, 0.005, 0.01, 0.05],
  minAmount = 0.0001,
  maxAmount,
  theme = 'light',
  primaryColor = '#ea580c',
  borderRadius = 12,
  organizationLogo,
  backgroundImage,
  showProgress = false,
  goalAmount,
  currentAmount = 0,
  donorCount = 0,
  onDonation,
  onError,
  className = '',
  style = {}
}: DonationWidgetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [donationStatus, setDonationStatus] = useState<'idle' | 'processing' | 'success'>('idle')
  const [donationResult, setDonationResult] = useState<any>(null)

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'USDC') return `$${amount.toFixed(2)}`
    if (currency === 'BTC' || currency === 'sBTC') return `₿${amount.toFixed(6)}`
    if (currency === 'STX') return `${amount.toFixed(6)} STX`
    return `${amount} ${currency}`
  }

  const getFinalAmount = () => {
    if (selectedAmount !== null) return selectedAmount
    const amount = parseFloat(customAmount)
    return isNaN(amount) ? 0 : amount
  }

  const isValidAmount = () => {
    const amount = getFinalAmount()
    if (amount < minAmount) return false
    if (maxAmount && amount > maxAmount) return false
    return amount > 0
  }

  const handleDonate = async () => {
    if (!isValidAmount()) return

    setIsLoading(true)
    setDonationStatus('processing')
    
    try {
      // Simulate donation processing
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      const mockDonation = {
        id: `don_${Date.now()}`,
        amount: getFinalAmount(),
        currency,
        cause,
        organizationName,
        status: 'completed',
        transactionId: `tx_${Math.random().toString(36).substring(7)}`,
        timestamp: new Date().toISOString()
      }
      
      setDonationResult(mockDonation)
      setDonationStatus('success')
      onDonation?.(mockDonation)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Donation failed')
      setDonationStatus('idle')
    } finally {
      setIsLoading(false)
    }
  }

  const resetWidget = () => {
    setDonationStatus('idle')
    setDonationResult(null)
    setSelectedAmount(null)
    setCustomAmount('')
  }

  const progressPercentage = goalAmount ? Math.min((currentAmount / goalAmount) * 100, 100) : 0

  if (donationStatus === 'success') {
    return (
      <Card 
        className={`overflow-hidden ${className}`}
        style={{ 
          borderRadius: `${borderRadius}px`,
          ...style 
        }}
      >
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600 mb-4">
              Your donation of <span className="font-semibold" style={{ color: primaryColor }}>
                {formatCurrency(donationResult?.amount || 0, currency)}
              </span> makes a difference.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">
                Transaction ID: <span className="font-mono text-xs">{donationResult?.transactionId}</span>
              </p>
            </div>
            <Button
              onClick={resetWidget}
              variant="outline"
              className="w-full"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              Donate Again
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={`overflow-hidden ${className}`}
      style={{ 
        borderRadius: `${borderRadius}px`,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ...style 
      }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      )}
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center space-x-3">
          {organizationLogo ? (
            <img src={organizationLogo} alt={organizationName} className="w-10 h-10 rounded-full" />
          ) : (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Heart className="w-6 h-6 text-white" />
            </div>
          )}
          <div className={backgroundImage ? 'text-white' : ''}>
            <div className="font-bold text-lg">{organizationName}</div>
            <div className="text-sm opacity-80">{cause}</div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Progress Bar */}
        {showProgress && goalAmount && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={`font-medium ${backgroundImage ? 'text-white' : 'text-gray-900'}`}>
                Progress: {formatCurrency(currentAmount, currency)}
              </span>
              <span className={`${backgroundImage ? 'text-white/80' : 'text-gray-600'}`}>
                Goal: {formatCurrency(goalAmount, currency)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="h-2 rounded-full"
                style={{ backgroundColor: primaryColor }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className={backgroundImage ? 'text-white/80' : 'text-gray-600'}>
                {donorCount} donors
              </span>
              <span className={backgroundImage ? 'text-white/80' : 'text-gray-600'}>
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {donationStatus === 'processing' ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" style={{ color: primaryColor }} />
            <p className={`text-sm ${backgroundImage ? 'text-white' : 'text-gray-600'}`}>
              Processing your donation...
            </p>
          </div>
        ) : (
          <>
            {/* Preset Amounts */}
            <div className="grid grid-cols-2 gap-3">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  onClick={() => {
                    setSelectedAmount(amount)
                    setCustomAmount('')
                  }}
                  className="h-12 text-sm font-medium"
                  style={{
                    backgroundColor: selectedAmount === amount ? primaryColor : 'transparent',
                    borderColor: primaryColor,
                    color: selectedAmount === amount ? 'white' : primaryColor
                  }}
                >
                  {formatCurrency(amount, currency)}
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${backgroundImage ? 'text-white' : 'text-gray-700'}`}>
                Or enter custom amount
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.001"
                  step="0.000001"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    setSelectedAmount(null)
                  }}
                  className="pl-8"
                  style={{ borderColor: primaryColor }}
                />
                <DollarSign className="absolute left-2.5 top-3 h-4 w-4 text-gray-400" />
              </div>
              {minAmount && (
                <p className={`text-xs ${backgroundImage ? 'text-white/80' : 'text-gray-500'}`}>
                  Minimum: {formatCurrency(minAmount, currency)}
                </p>
              )}
            </div>

            {/* Selected Currency */}
            <div className="flex items-center justify-center space-x-2">
              <span className={`text-sm ${backgroundImage ? 'text-white/80' : 'text-gray-600'}`}>
                Donating in:
              </span>
              <Badge 
                variant="secondary"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                {currency}
              </Badge>
            </div>

            {/* Donate Button */}
            <Button
              onClick={handleDonate}
              disabled={!isValidAmount() || isLoading}
              className="w-full py-6 text-base font-semibold"
              style={{ 
                backgroundColor: primaryColor,
                borderRadius: `${borderRadius * 0.75}px`
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Donate {getFinalAmount() > 0 ? formatCurrency(getFinalAmount(), currency) : ''}
                </>
              )}
            </Button>

            {/* Security Info */}
            <div className="text-center">
              <p className={`text-xs ${backgroundImage ? 'text-white/80' : 'text-gray-500'}`}>
                🔒 Secure donation powered by Bitcoin blockchain
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}