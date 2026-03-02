'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Plus,
  Send,
  Key,
  FileText,
  Settings,
  Webhook,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  external?: boolean
}

const quickActions: QuickAction[] = [
  {
    id: 'create-payment',
    title: 'Create Payment Link',
    description: 'Generate a payment link for customers',
    icon: Plus,
    href: '/dashboard/payments',
    variant: 'primary'
  },
  {
    id: 'send-invoice',
    title: 'Send Invoice',
    description: 'Create and send a Bitcoin invoice',
    icon: Send,
    href: '/dashboard/payments'
  },
  {
    id: 'api-keys',
    title: 'Manage API Keys',
    description: 'View and manage your API credentials',
    icon: Key,
    href: '/dashboard/api-keys'
  },
  {
    id: 'documentation',
    title: 'View Documentation',
    description: 'Integration guides and API reference',
    icon: FileText,
    href: 'https://docs.example.com',
    external: true
  },
  {
    id: 'webhooks',
    title: 'Configure Webhooks',
    description: 'Set up payment notifications',
    icon: Webhook,
    href: '/dashboard/webhooks'
  },
  {
    id: 'settings',
    title: 'Account Settings',
    description: 'Update your business profile',
    icon: Settings,
    href: '/dashboard/settings'
  }
]

const QuickActions = () => {
  const router = useRouter()
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      if (action.external) {
        window.open(action.href, '_blank')
      } else {
        router.push(action.href)
      }
    }
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onHoverStart={() => setHoveredAction(action.id)}
            onHoverEnd={() => setHoveredAction(null)}
          >
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick(action)}
              className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                action.variant === 'primary'
                  ? 'bg-white dark:bg-gray-900 border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-md ${
                    action.variant === 'primary'
                      ? 'bg-orange-100 dark:bg-orange-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <action.icon className={`h-4 w-4 ${
                      action.variant === 'primary'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      action.variant === 'primary'
                        ? 'text-orange-900 dark:text-orange-100'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {action.title}
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      action.variant === 'primary'
                        ? 'text-orange-700 dark:text-orange-300'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {action.description}
                    </p>
                  </div>
                </div>
                
                <motion.div
                  animate={{ 
                    x: hoveredAction === action.id ? 2 : 0,
                    opacity: hoveredAction === action.id ? 1 : 0.6
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {action.external ? (
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  )}
                </motion.div>
              </div>
            </motion.button>
            
            {index < quickActions.length - 1 && (
              <Separator className="mt-3" />
            )}
          </motion.div>
        ))}
        
        <div className="pt-2 mt-4 border-t border-gray-200 dark:border-gray-800">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => router.push('/dashboard/onboarding')}
          >
            View All Actions
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickActions
