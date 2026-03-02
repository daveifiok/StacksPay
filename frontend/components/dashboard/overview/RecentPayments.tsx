'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Copy,
  ExternalLink
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Payment {
  id: string
  customer: {
    name: string
    email: string
    avatar?: string
  }
  amount: number
  currency: 'BTC' | 'sBTC' | 'STX'
  status: 'completed' | 'pending' | 'failed' | 'cancelled'
  timestamp: string
  description: string
  transactionHash?: string
}

const mockPayments: Payment[] = [
  {
    id: 'pay_1',
    customer: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
    },
    amount: 0.025,
    currency: 'sBTC',
    status: 'completed',
    timestamp: '2 minutes ago',
    description: 'Premium subscription',
    transactionHash: '0x1234...5678'
  },
  {
    id: 'pay_2',
    customer: {
      name: 'Bob Wilson',
      email: 'bob@example.com',
    },
    amount: 0.05,
    currency: 'sBTC',
    status: 'pending',
    timestamp: '5 minutes ago',
    description: 'Product purchase',
  },
  {
    id: 'pay_3',
    customer: {
      name: 'Carol Smith',
      email: 'carol@example.com',
    },
    amount: 0.01,
    currency: 'sBTC',
    status: 'completed',
    timestamp: '12 minutes ago',
    description: 'Service payment',
    transactionHash: '0x5678...9012'
  },
  {
    id: 'pay_4',
    customer: {
      name: 'David Brown',
      email: 'david@example.com',
    },
    amount: 0.075,
    currency: 'sBTC',
    status: 'failed',
    timestamp: '18 minutes ago',
    description: 'Monthly billing',
  },
  {
    id: 'pay_5',
    customer: {
      name: 'Emma Davis',
      email: 'emma@example.com',
    },
    amount: 0.03,
    currency: 'sBTC',
    status: 'completed',
    timestamp: '23 minutes ago',
    description: 'API usage fees',
    transactionHash: '0x9012...3456'
  }
]

const RecentPayments = () => {
  const [payments] = useState<Payment[]>(mockPayments)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
    }

    return (
      <Badge className={cn('text-xs font-medium', variants[status as keyof typeof variants])}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Toast notification would go here
  }

  return (
    <div className="space-y-1">
      {payments.map((payment, index) => (
        <motion.div
          key={payment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Customer Avatar */}
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={payment.customer.avatar} alt={payment.customer.name} />
                <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                  {payment.customer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Payment Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {payment.customer.name}
                  </p>
                  {getStatusIcon(payment.status)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                  {payment.description}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {payment.timestamp}
                  </p>
                  {payment.transactionHash && (
                    <button
                      onClick={() => copyToClipboard(payment.transactionHash!)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                    >
                      <span>{payment.transactionHash.slice(0, 6)}...{payment.transactionHash.slice(-4)}</span>
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Amount and Status */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {payment.amount} {payment.currency}
                  </span>
                  {payment.status === 'completed' && (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  )}
                </div>
                <div className="mt-1">
                  {getStatusBadge(payment.status)}
                </div>
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    View Details
                  </DropdownMenuItem>
                  {payment.transactionHash && (
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Explorer
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Payment ID
                  </DropdownMenuItem>
                  {payment.status === 'failed' && (
                    <DropdownMenuItem>
                      Retry Payment
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>
      ))}

      {payments.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            No recent payments
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Payments will appear here once you start receiving them
          </p>
        </div>
      )}
    </div>
  )
}

export default RecentPayments
