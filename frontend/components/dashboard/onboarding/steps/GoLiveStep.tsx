'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Rocket, 
  CheckCircle, 
  AlertCircle, 
  Star, 
  TrendingUp, 
  Shield, 
  Zap, 
  Globe,
  FileText,
  Users,
  CreditCard,
  ExternalLink,
  ArrowRight,
  Clock,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { OnboardingData } from '../MerchantOnboardingWizard'

interface GoLiveStepProps {
  data: OnboardingData
  updateData: (section: keyof OnboardingData, updates: any) => void
  onComplete: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const verificationChecklist = [
  {
    id: 'business_info',
    title: 'Business Information',
    description: 'Complete business profile',
    icon: FileText,
    status: 'completed'
  },
  {
    id: 'wallet_setup',
    title: 'Wallet Connection',
    description: 'Stacks wallet verified',
    icon: Shield,
    status: 'completed'
  },
  {
    id: 'test_payment',
    title: 'Test Payment',
    description: 'Integration tested successfully',
    icon: CheckCircle,
    status: 'completed'
  },
  {
    id: 'email_verification',
    title: 'Email Verification',
    description: 'Verify your email address',
    icon: Mail,
    status: 'pending'
  }
]

const benefits = [
  {
    icon: TrendingUp,
    title: 'Start Earning Immediately',
    description: 'Accept Bitcoin payments and grow your revenue'
  },
  {
    icon: Globe,
    title: 'Global Customer Base',
    description: 'Reach customers worldwide with borderless payments'
  },
  {
    icon: Zap,
    title: 'Instant Settlements',
    description: 'Get paid immediately, no waiting for bank transfers'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade security protects you and your customers'
  }
]

const GoLiveStep = ({ data, updateData, onComplete, isLoading, setIsLoading }: GoLiveStepProps) => {
  const [activationStatus, setActivationStatus] = useState<'checking' | 'ready' | 'pending_verification' | 'activated'>('checking')
  const [liveApiKey, setLiveApiKey] = useState('')
  const [activationProgress, setActivationProgress] = useState(0)

  const checkReadinessStatus = async () => {
    setIsLoading(true)
    
    try {
      // Simulate checking account readiness
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check all requirements
      const hasBusinessInfo = data.businessInfo.name && data.businessInfo.businessType
      const hasWalletConnected = data.walletInfo.connected
      const hasTestPayment = data.integrationStatus.testPaymentMade
      
      if (hasBusinessInfo && hasWalletConnected && hasTestPayment) {
        setActivationStatus('ready')
        setActivationProgress(100)
      } else {
        setActivationStatus('pending_verification')
        setActivationProgress(75)
      }
      
    } catch (error) {
      console.error('Error checking readiness:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const activateAccount = async () => {
    setIsLoading(true)

    try {
      // Call the backend to mark onboarding as complete
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const token = localStorage.getItem('authToken')

      if (!token) {
        throw new Error('No authentication token found. Please log in again.')
      }

      const response = await fetch(`${apiUrl}/api/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        const errorMsg = result.error || 'Failed to complete onboarding'
        const missingSteps = result.missingSteps ? `\nMissing steps: ${result.missingSteps.join(', ')}` : ''
        console.error('❌ Onboarding completion failed:', result)

        // Show user-friendly message
        const stepNames: Record<string, string> = {
          businessInfo: 'Business Info (Step 2)',
          walletSetup: 'Wallet Setup (Step 3)',
          paymentPreferences: 'Payment Preferences (Step 4)',
          apiKeys: 'API Keys (Step 5)'
        }
        const missingStepNames = result.missingSteps?.map((s: string) => stepNames[s] || s).join(', ')

        alert(`⚠️ Please complete these required steps first:\n\n${missingStepNames}\n\nGo back and click "Save & Continue" on each step to mark them as complete.`)
        throw new Error(errorMsg + missingSteps)
      }

      console.log('✅ Onboarding marked as complete')

      // Activate live API key if it exists
      if (data.apiKeys.liveKey) {
        try {
          const activateResponse = await fetch(`${apiUrl}/api/apikeys/${data.apiKeys.liveKey}/activate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          })

          if (activateResponse.ok) {
            console.log('✅ Live API key activated')
          }
        } catch (error) {
          console.error('Error activating live API key:', error)
        }
      }

      updateData('integrationStatus', {
        ...data.integrationStatus,
        readyForLive: true
      })

      setActivationStatus('activated')

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)

    } catch (error) {
      console.error('Error activating account:', error)
      alert('Failed to complete onboarding. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkReadinessStatus()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Ready to Go Live?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          You're almost ready to start accepting real Bitcoin payments from customers
        </p>
      </div>

      {activationStatus === 'checking' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Rocket className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Checking Account Readiness...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Verifying all setup requirements
            </p>
          </div>
        </motion.div>
      )}

      {activationStatus === 'ready' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Readiness Check */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <CardTitle className="text-green-800 dark:text-green-200">
                  All Requirements Met!
                </CardTitle>
              </div>
              <CardDescription>
                Your account is ready for live Bitcoin payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verificationChecklist.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.status === 'completed' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          item.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Activation Button */}
          <div className="text-center space-y-4">
            <Button 
              size="lg"
              onClick={activateAccount}
              disabled={isLoading}
              className="min-w-[250px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Activating Account...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Activate Live Payments
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500">
              This will generate your live API key and enable real payments
            </p>
          </div>
        </motion.div>
      )}

      {activationStatus === 'activated' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Success Message */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                🎉 Congratulations!
              </h2>
              <p className="text-lg text-green-700 dark:text-green-300 mb-6">
                Your StacksPay account is now live and ready to accept real Bitcoin payments!
              </p>

              {/* Live API Key */}
              <Card className="bg-white dark:bg-gray-800 border shadow-sm mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">Live API Key</p>
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        {liveApiKey}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Button className="flex-1" onClick={() => window.location.href = '/dashboard'}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
                <Button variant="outline" className="flex-1">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's Next?</CardTitle>
              <CardDescription>
                Here are some recommended next steps to optimize your payment experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {benefit.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pro Tips */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle className="text-purple-800 dark:text-purple-200">
                Pro Tips for Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">
                      Configure Webhooks
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Set up webhook endpoints to receive real-time payment notifications
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">
                      Monitor Analytics
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Use the analytics dashboard to track performance and optimize conversions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">
                      Enable 2FA
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Add two-factor authentication for enhanced account security
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Our team is here to support your success
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <span className="font-medium">Documentation</span>
                  <span className="text-xs text-gray-500">Complete guides & API reference</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Users className="h-6 w-6 text-green-600" />
                  <span className="font-medium">Community</span>
                  <span className="text-xs text-gray-500">Join our developer community</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Mail className="h-6 w-6 text-purple-600" />
                  <span className="font-medium">Support</span>
                  <span className="text-xs text-gray-500">Get help from our team</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activationStatus === 'pending_verification' && (
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  Verification in Progress
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                  We're reviewing your account for compliance. This usually takes 24-48 hours.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Verification Progress</span>
                    <span>{activationProgress}%</span>
                  </div>
                  <Progress value={activationProgress} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {activationStatus === 'ready' && (
          <Button 
            size="lg"
            onClick={activateAccount}
            disabled={isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Activating...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Go Live Now!
              </>
            )}
          </Button>
        )}
        
        {activationStatus === 'activated' && (
          <Button 
            size="lg"
            onClick={() => window.location.href = '/dashboard'}
            className="min-w-[200px]"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Enter Dashboard
          </Button>
        )}
      </div>
    </div>
  )
}

export default GoLiveStep