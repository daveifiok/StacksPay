'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Calendar, 
  DollarSign, 
  Users,
  TrendingUp,
  Settings,
  Pause,
  Play,
  X,
  Edit
} from 'lucide-react'
import SubscriptionWidget from '@/components/widgets/SubscriptionWidget'
import { SubscriptionPlan, Subscription } from '@/components/widgets/types'

// Mock data for demonstration
const mockPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    amount: 0.001,
    currency: 'BTC',
    interval: 'monthly',
    description: 'Perfect for small businesses',
    features: [
      'Up to 100 transactions/month',
      'Basic analytics',
      'Email support',
      'Payment widgets'
    ],
    trialDays: 14
  },
  {
    id: 'professional',
    name: 'Professional',
    amount: 0.005,
    currency: 'BTC',
    interval: 'monthly',
    description: 'For growing businesses',
    features: [
      'Up to 1000 transactions/month',
      'Advanced analytics',
      'Priority support',
      'Custom widgets',
      'API access',
      'Webhooks'
    ],
    popular: true,
    trialDays: 14
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    amount: 0.02,
    currency: 'BTC',
    interval: 'monthly',
    description: 'For large organizations',
    features: [
      'Unlimited transactions',
      'Enterprise analytics',
      'Dedicated support',
      'Multi-signature',
      'Escrow services',
      'Custom contracts',
      'Compliance tools'
    ],
    setupFee: 0.01,
    trialDays: 30
  }
]

const mockSubscriptions: Subscription[] = [
  {
    id: 'sub_1',
    planId: 'professional',
    status: 'active',
    currentPeriodStart: '2024-01-01T00:00:00Z',
    currentPeriodEnd: '2024-02-01T00:00:00Z',
    nextPaymentDate: '2024-02-01T00:00:00Z',
    nextPaymentAmount: 0.005,
    totalPayments: 12,
    totalAmount: 0.06,
    customerAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    cancelAtPeriodEnd: false
  }
]

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPlan, setSelectedPlan] = useState<string>()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockSubscriptions)

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.id)
  }

  const handleSubscribe = (planId: string, paymentMethod: string) => {
    console.log('Subscribe to plan:', planId, 'with method:', paymentMethod)
    // Handle subscription creation
  }

  const handleSubscriptionUpdate = (subscriptionId: string, updates: any) => {
    setSubscriptions(prev => 
      prev.map(sub => 
        sub.id === subscriptionId 
          ? { ...sub, ...updates }
          : sub
      )
    )
  }

  const handlePauseSubscription = (subscriptionId: string) => {
    handleSubscriptionUpdate(subscriptionId, { status: 'paused' })
  }

  const handleResumeSubscription = (subscriptionId: string) => {
    handleSubscriptionUpdate(subscriptionId, { status: 'active' })
  }

  const handleCancelSubscription = (subscriptionId: string) => {
    handleSubscriptionUpdate(subscriptionId, { cancelAtPeriodEnd: true })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'paused': return 'bg-yellow-100 text-yellow-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      case 'past_due': return 'bg-orange-100 text-orange-700'
      case 'trial': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your subscription plans and recurring billing
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Subscribers</p>
                <p className="text-2xl font-bold">127</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">₿0.635</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold">+23%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Churn Rate</p>
                <p className="text-2xl font-bold">2.1%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="active">Active Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Subscriptions</CardTitle>
                <CardDescription>Latest subscription activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptions.map((sub) => {
                    const plan = mockPlans.find(p => p.id === sub.planId)
                    return (
                      <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{plan?.name} Plan</h4>
                          <p className="text-sm text-gray-600">
                            Next payment: {new Date(sub.nextPaymentDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(sub.status)}>
                            {sub.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            ₿{sub.nextPaymentAmount}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common subscription management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Plan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Billing Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Create and manage your subscription offerings</CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionWidget
                plans={mockPlans}
                selectedPlanId={selectedPlan}
                onPlanSelect={handlePlanSelect}
                onSubscribe={handleSubscribe}
                showTrialInfo={true}
                showFeatureComparison={true}
                allowPlanSwitching={true}
                merchantName="StacksPay"
                customization={{
                  primaryColor: '#ea580c',
                  showPricing: true,
                  showBillingHistory: true
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>Manage your active customer subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((sub) => {
                  const plan = mockPlans.find(p => p.id === sub.planId)
                  return (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{plan?.name} Plan</h3>
                          <p className="text-sm text-gray-600">
                            Customer: {sub.customerAddress.slice(0, 8)}...{sub.customerAddress.slice(-6)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(sub.status)}>
                          {sub.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Next Payment</p>
                          <p className="font-medium">₿{sub.nextPaymentAmount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Due Date</p>
                          <p className="font-medium">
                            {new Date(sub.nextPaymentDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Payments</p>
                          <p className="font-medium">{sub.totalPayments}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="font-medium">₿{sub.totalAmount}</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {sub.status === 'active' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePauseSubscription(sub.id)}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleResumeSubscription(sub.id)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Resume
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleCancelSubscription(sub.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>

                      {sub.cancelAtPeriodEnd && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-800">
                            This subscription will be cancelled at the end of the current period.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Analytics</CardTitle>
              <CardDescription>Track your subscription performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Analytics Dashboard Coming Soon
                </h3>
                <p className="text-gray-600">
                  Detailed subscription analytics and insights will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}