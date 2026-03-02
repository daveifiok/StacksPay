'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  Calendar, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  Pause,
  Square,
  Edit3,
  Trash2,
  Settings,
  DollarSign,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionPlan {
  id: string
  name: string
  amount: number
  currency: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly'
  intervalCount?: number
  description: string
  features: string[]
  trialDays?: number
  setupFee?: number
  popular?: boolean
}

interface Subscription {
  id: string
  planId: string
  status: 'active' | 'paused' | 'cancelled' | 'past_due' | 'trial' | 'incomplete'
  currentPeriodStart: string
  currentPeriodEnd: string
  nextPaymentDate: string
  nextPaymentAmount: number
  totalPayments: number
  totalAmount: number
  customerAddress: string
  trialEnd?: string
  cancelAtPeriodEnd: boolean
}

interface SubscriptionWidgetProps {
  plans: SubscriptionPlan[]
  selectedPlanId?: string
  onPlanSelect?: (plan: SubscriptionPlan) => void
  onSubscribe?: (planId: string, paymentMethod: string) => void
  onSubscriptionUpdate?: (subscriptionId: string, updates: any) => void
  existingSubscription?: Subscription
  showTrialInfo?: boolean
  showFeatureComparison?: boolean
  allowPlanSwitching?: boolean
  merchantName?: string
  customization?: {
    primaryColor?: string
    accentColor?: string
    showPricing?: boolean
    showBillingHistory?: boolean
  }
}

const INTERVAL_LABELS = {
  daily: { singular: 'day', plural: 'days', multiplier: 1 },
  weekly: { singular: 'week', plural: 'weeks', multiplier: 7 },
  monthly: { singular: 'month', plural: 'months', multiplier: 30 },
  yearly: { singular: 'year', plural: 'years', multiplier: 365 }
}

const STATUS_CONFIG = {
  active: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  trial: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  paused: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Pause },
  cancelled: { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Square },
  past_due: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  incomplete: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: RefreshCw }
}

export default function SubscriptionWidget({
  plans,
  selectedPlanId,
  onPlanSelect,
  onSubscribe,
  onSubscriptionUpdate,
  existingSubscription,
  showTrialInfo = true,
  showFeatureComparison = true,
  allowPlanSwitching = true,
  merchantName = 'StacksPay Service',
  customization = {}
}: SubscriptionWidgetProps) {
  const { toast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    plans.find(p => p.id === selectedPlanId) || plans[0] || null
  )
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showBillingHistory, setShowBillingHistory] = useState(false)

  useEffect(() => {
    if (selectedPlanId && plans.length > 0) {
      const plan = plans.find(p => p.id === selectedPlanId)
      if (plan) {
        setSelectedPlan(plan)
        onPlanSelect?.(plan)
      }
    }
  }, [selectedPlanId, plans])

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    onPlanSelect?.(plan)
    setShowPlanDialog(false)
  }

  const handleSubscribe = async (paymentMethod: string = 'wallet') => {
    if (!selectedPlan) return

    setIsSubscribing(true)
    try {
      // Simulate subscription creation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Subscription Created!',
        description: `Successfully subscribed to ${selectedPlan.name}`,
      })
      
      onSubscribe?.(selectedPlan.id, paymentMethod)
    } catch (error) {
      toast({
        title: 'Subscription Failed',
        description: 'Failed to create subscription. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleSubscriptionAction = async (action: string, data?: any) => {
    if (!existingSubscription) return

    setIsUpdating(true)
    try {
      // Simulate subscription update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const messages = {
        pause: 'Subscription paused',
        resume: 'Subscription resumed',
        cancel: 'Subscription cancelled',
        update: 'Subscription updated'
      }
      
      toast({
        title: 'Success',
        description: messages[action as keyof typeof messages] || 'Action completed',
      })
      
      onSubscriptionUpdate?.(existingSubscription.id, { action, ...data })
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: 'Failed to update subscription',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const calculateAnnualSavings = (monthlyAmount: number, yearlyAmount: number): number => {
    const monthlyYearly = monthlyAmount * 12
    return ((monthlyYearly - yearlyAmount) / monthlyYearly) * 100
  }

  const formatInterval = (interval: string, count: number = 1): string => {
    const config = INTERVAL_LABELS[interval as keyof typeof INTERVAL_LABELS]
    if (!config) return interval
    
    if (count === 1) {
      return `per ${config.singular}`
    } else {
      return `every ${count} ${config.plural}`
    }
  }

  const formatCurrency = (amount: number, currency: string): string => {
    if (currency === 'USDC') {
      return `$${amount.toFixed(2)}`
    }
    return `${amount} ${currency}`
  }

  const getDaysUntilNextPayment = (): number => {
    if (!existingSubscription) return 0
    const nextPayment = new Date(existingSubscription.nextPaymentDate)
    const now = new Date()
    return Math.ceil((nextPayment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getTrialDaysRemaining = (): number => {
    if (!existingSubscription?.trialEnd) return 0
    const trialEnd = new Date(existingSubscription.trialEnd)
    const now = new Date()
    return Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Existing Subscription Management
  if (existingSubscription) {
    const StatusIcon = STATUS_CONFIG[existingSubscription.status].icon
    const currentPlan = plans.find(p => p.id === existingSubscription.planId)
    const trialDaysRemaining = getTrialDaysRemaining()
    const daysUntilNextPayment = getDaysUntilNextPayment()

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Your Subscription</span>
              </CardTitle>
              <CardDescription>{merchantName}</CardDescription>
            </div>
            <Badge className={STATUS_CONFIG[existingSubscription.status].color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {existingSubscription.status.replace('_', ' ').charAt(0).toUpperCase() + existingSubscription.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Trial Information */}
          {existingSubscription.status === 'trial' && trialDaysRemaining > 0 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your free trial ends in {trialDaysRemaining} days. 
                Your first payment of {formatCurrency(existingSubscription.nextPaymentAmount, currentPlan?.currency || 'USDC')} 
                will be processed on {new Date(existingSubscription.nextPaymentDate).toLocaleDateString()}.
              </AlertDescription>
            </Alert>
          )}

          {/* Plan Details */}
          {currentPlan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{currentPlan.name}</h3>
                  <p className="text-gray-600 text-sm">{currentPlan.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(currentPlan.amount, currentPlan.currency)} {formatInterval(currentPlan.interval)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Paid:</span>
                    <span className="font-medium">
                      {formatCurrency(existingSubscription.totalAmount, currentPlan.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payments:</span>
                    <span className="font-medium">{existingSubscription.totalPayments}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Billing Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Period:</span>
                      <span>
                        {new Date(existingSubscription.currentPeriodStart).toLocaleDateString()} - 
                        {new Date(existingSubscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Payment:</span>
                      <span>
                        {daysUntilNextPayment > 0 ? `in ${daysUntilNextPayment} days` : 'Today'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress to next payment */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Billing Period</span>
                    <span>{Math.max(0, daysUntilNextPayment)} days left</span>
                  </div>
                  <Progress 
                    value={Math.max(0, Math.min(100, ((30 - daysUntilNextPayment) / 30) * 100))} 
                    className="h-2" 
                  />
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {existingSubscription.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleSubscriptionAction('pause')}
                  disabled={isUpdating}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                
                {allowPlanSwitching && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPlanDialog(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Change Plan
                  </Button>
                )}
              </>
            )}

            {existingSubscription.status === 'paused' && (
              <Button
                onClick={() => handleSubscriptionAction('resume')}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}

            {existingSubscription.status === 'past_due' && (
              <Button
                onClick={() => handleSubscriptionAction('retry_payment')}
                disabled={isUpdating}
                className="bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Payment
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setShowBillingHistory(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Billing History
            </Button>

            {!existingSubscription.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                onClick={() => handleSubscriptionAction('cancel')}
                disabled={isUpdating}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <Square className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            )}
          </div>

          {existingSubscription.cancelAtPeriodEnd && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your subscription is scheduled to cancel at the end of the current billing period 
                ({new Date(existingSubscription.currentPeriodEnd).toLocaleDateString()}).
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // New Subscription Setup
  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Choose Your Plan</CardTitle>
          <CardDescription className="text-center">
            Subscribe to {merchantName} and get instant access
          </CardDescription>
          
          {/* Billing Toggle */}
          <div className="flex justify-center mt-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={billingInterval === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingInterval('monthly')}
                className="px-4"
              >
                Monthly
              </Button>
              <Button
                variant={billingInterval === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingInterval('yearly')}
                className="px-4"
              >
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs">
                  Save 20%
                </Badge>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans
              .filter(plan => plan.interval === billingInterval)
              .map((plan) => {
                const isSelected = selectedPlan?.id === plan.id
                const monthlyPlan = plans.find(p => p.name === plan.name && p.interval === 'monthly')
                const savings = monthlyPlan && billingInterval === 'yearly' 
                  ? calculateAnnualSavings(monthlyPlan.amount * 12, plan.amount)
                  : 0

                return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`relative cursor-pointer transition-all ${
                        isSelected 
                          ? 'ring-2 ring-orange-500 border-orange-500' 
                          : 'hover:border-gray-300'
                      } ${plan.popular ? 'border-orange-200 bg-orange-50/50' : ''}`}
                      onClick={() => handlePlanSelect(plan)}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500">
                          Most Popular
                        </Badge>
                      )}

                      <CardHeader className="text-center">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold">
                            {formatCurrency(plan.amount, plan.currency)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatInterval(plan.interval, plan.intervalCount)}
                          </div>
                          {savings > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Save {savings.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Features */}
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Trial Info */}
                        {plan.trialDays && showTrialInfo && (
                          <Alert>
                            <Clock className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {plan.trialDays}-day free trial included
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Setup Fee */}
                        {plan.setupFee && plan.setupFee > 0 && (
                          <div className="text-xs text-gray-600">
                            + {formatCurrency(plan.setupFee, plan.currency)} setup fee
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
          </div>

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{selectedPlan.name}</h3>
                  <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {formatCurrency(selectedPlan.amount, selectedPlan.currency)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatInterval(selectedPlan.interval)}
                  </div>
                </div>
              </div>

              {selectedPlan.trialDays && (
                <Alert className="mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Start your {selectedPlan.trialDays}-day free trial today. 
                    Cancel anytime during the trial period.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => handleSubscribe()}
                disabled={isSubscribing}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                size="lg"
              >
                {isSubscribing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {selectedPlan.trialDays ? 'Start Free Trial' : 'Subscribe Now'}
              </Button>
            </div>
          )}

          {/* Feature Comparison */}
          {showFeatureComparison && plans.length > 1 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 text-center">Compare Plans</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Feature</th>
                      {plans.filter(p => p.interval === billingInterval).map(plan => (
                        <th key={plan.id} className="text-center p-2">{plan.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Generate feature comparison rows */}
                    {Array.from(new Set(plans.flatMap(p => p.features))).map(feature => (
                      <tr key={feature} className="border-t">
                        <td className="p-2">{feature}</td>
                        {plans.filter(p => p.interval === billingInterval).map(plan => (
                          <td key={plan.id} className="text-center p-2">
                            {plan.features.includes(feature) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Selection Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Choose a new plan. Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {plans.filter(p => p.interval === 'monthly').map(plan => (
              <Card 
                key={plan.id}
                className="cursor-pointer hover:border-orange-300"
                onClick={() => handlePlanSelect(plan)}
              >
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    <div className="text-lg font-bold">
                      {formatCurrency(plan.amount, plan.currency)}
                      <span className="text-sm font-normal text-gray-600">
                        /{plan.interval}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{plan.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}