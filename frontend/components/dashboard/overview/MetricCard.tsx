'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: LucideIcon
  description?: string
  loading?: boolean
}

const MetricCard = ({ title, value, change, icon: Icon, description, loading }: MetricCardProps) => {
  const isPositive = change > 0
  const isNeutral = change === 0

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Card className="relative overflow-hidden border shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {value}
              </p>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {description}
                </p>
              )}
            </div>
            
            <div className="ml-4">
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className={cn(
              'flex items-center space-x-1 text-sm font-medium',
              isPositive ? 'text-green-600 dark:text-green-400' : 
              isNeutral ? 'text-gray-500 dark:text-gray-400' : 'text-red-600 dark:text-red-400'
            )}>
              {!isNeutral && (
                isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )
              )}
              <span>
                {isNeutral ? '0' : `${isPositive ? '+' : ''}${change.toFixed(1)}`}%
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              vs last period
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default MetricCard
