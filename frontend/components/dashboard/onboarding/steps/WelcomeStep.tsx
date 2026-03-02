'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Globe, 
  Shield, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  DollarSign,
  Users,
  Rocket
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OnboardingData } from '../MerchantOnboardingWizard'

interface WelcomeStepProps {
  data: OnboardingData
  updateData: (section: keyof OnboardingData, updates: any) => void
  onComplete: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const benefits = [
  {
    icon: DollarSign,
    title: '0.5% Processing Fees',
    description: '83% lower than traditional payment processors',
    highlight: 'vs 2.9% + 30¢'
  },
  {
    icon: Zap,
    title: 'Instant Settlement',
    description: 'Get paid immediately, no 2-7 day delays',
    highlight: 'Real-time Bitcoin'
  },
  {
    icon: Shield,
    title: 'No Chargebacks',
    description: 'Bitcoin finality protects your revenue',
    highlight: '0% chargeback rate'
  },
  {
    icon: Globe,
    title: 'Global by Default',
    description: 'Accept payments from anywhere in the world',
    highlight: 'No restrictions'
  }
]

const setupSteps = [
  'Connect your Stacks wallet (2 min)',
  'Configure payment preferences (1 min)', 
  'Generate API keys (30 sec)',
  'Copy integration code (1 min)',
  'Test your first payment (2 min)',
  'Go live and start earning (30 sec)'
]

const WelcomeStep = ({ onComplete }: WelcomeStepProps) => {
  useEffect(() => {
    // Auto-complete welcome step after viewing
    const timer = setTimeout(() => {
      onComplete()
    }, 1000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto"
        >
          <Rocket className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          The Future of Business Payments
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Join thousands of businesses already using StacksPay to accept Bitcoin payments 
          with the same simplicity as credit cards.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="relative overflow-hidden border-l-4 border-l-orange-500 bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {benefit.description}
                    </p>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                      {benefit.highlight}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Setup Overview */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Quick Setup Process
            </h3>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
              ~7 minutes
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {setupSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (0.1 * index) }}
                className="flex items-center space-x-3"
              >
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Proof */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            1,000+
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Merchants onboarded
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-2"
        >
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            $50M+
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Processed volume
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-2"
        >
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            99.9%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Uptime guarantee
          </div>
        </motion.div>
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center bg-white dark:bg-gray-900 border rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Ready to revolutionize your payments?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Let's get your business set up to accept Bitcoin payments in the next few minutes.
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span>No setup fees • No monthly fees • Cancel anytime</span>
        </div>
      </motion.div>
    </div>
  )
}

export default WelcomeStep