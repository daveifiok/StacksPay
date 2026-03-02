'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Calendar,
  Filter,
  Download,
  Wallet,
  Landmark,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MetricCard from './MetricCard'
import QuickActions from './QuickActions'
import RecentPayments from './RecentPayments'
import PaymentChart from './PaymentChart'
import { PaymentButtonWidget } from '@/components/widgets/drop-in'

interface DashboardStats {
  totalRevenue: number
  revenueChange: number
  totalPayments: number
  paymentsChange: number
  successRate: number
  successRateChange: number
  activeCustomers: number
  customersChange: number
}

const mockStats: DashboardStats = {
  totalRevenue: 12847.32,
  revenueChange: 12.5,
  totalPayments: 1453,
  paymentsChange: 8.2,
  successRate: 98.7,
  successRateChange: 0.3,
  activeCustomers: 324,
  customersChange: -2.1,
}

const DashboardOverview = () => {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>(mockStats)
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(false)
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false)
  const [withdrawalData, setWithdrawalData] = useState({
    amount: '',
    method: '',
    recipientAddress: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const refreshData = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
  }

  const handleWithdrawal = async () => {
    setIsSubmitting(true)
    // Simulate withdrawal processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setIsWithdrawalModalOpen(false)
    setWithdrawalData({ amount: '', method: '', recipientAddress: '' })
  }

  const withdrawalMethods = [
    { id: 'bank_usd', name: 'Bank Transfer (ACH)', type: 'bank', currency: 'USD', time: '1-3 business days' },
    { id: 'crypto_btc', name: 'Bitcoin Wallet', type: 'crypto', currency: 'sBTC', time: '10-30 minutes' },
    { id: 'crypto_usdc', name: 'USDC Wallet', type: 'crypto', currency: 'USDC', time: '5-15 minutes' }
  ]

  const selectedMethod = withdrawalMethods.find(m => m.id === withdrawalData.method)

  useEffect(() => {
    refreshData()
  }, [timeRange])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your sBTC payment performance and business metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button size="sm" onClick={refreshData} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Activity className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change={stats.revenueChange}
          icon={DollarSign}
          description="Revenue in USD equivalent"
          loading={loading}
        />
        
        <MetricCard
          title="Total Payments"
          value={stats.totalPayments.toLocaleString()}
          change={stats.paymentsChange}
          icon={CreditCard}
          description="Successful payments"
          loading={loading}
        />
        
        <MetricCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          change={stats.successRateChange}
          icon={TrendingUp}
          description="Payment success rate"
          loading={loading}
        />
        
        <MetricCard
          title="Active Customers"
          value={stats.activeCustomers.toLocaleString()}
          change={stats.customersChange}
          icon={Users}
          description="Customers with recent activity"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts and Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Chart */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Volume</CardTitle>
                  <CardDescription>
                    sBTC payments over time
                  </CardDescription>
                </div>
                <Tabs defaultValue="volume" className="w-auto">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="volume">Volume</TabsTrigger>
                    <TabsTrigger value="count">Count</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <PaymentChart timeRange={timeRange} />
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>
                    Latest transactions from your customers
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/dashboard/payments')}
                  className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <RecentPayments />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Network Status */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">Network Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Stacks Network</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  Operational
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Bitcoin Network</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  Operational
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">sBTC Bridge</span>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                  Testnet
                </Badge>
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last updated</span>
                  <span>2 minutes ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Overview */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">Balance Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Available Balance</span>
                  <span className="font-medium">2.847 sBTC</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending Settlements</span>
                  <span className="font-medium">0.125 sBTC</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">USD Equivalent</span>
                  <span className="font-medium">$12,847.32</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800" 
                  onClick={() => setIsWithdrawalModalOpen(true)}
                >
                  Withdraw Funds
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <Dialog open={isWithdrawalModalOpen} onOpenChange={setIsWithdrawalModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Transfer your available balance to an external account
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount">Amount</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="withdrawal-amount"
                  type="number"
                  placeholder="0.00"
                  value={withdrawalData.amount}
                  onChange={(e) => setWithdrawalData(prev => ({ ...prev, amount: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawalData(prev => ({ ...prev, amount: '2.847' }))}
                  className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Available: 2.847 sBTC (~$12,847.32)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Withdrawal Method</Label>
              <div className="space-y-2">
                {withdrawalMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      withdrawalData.method === method.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
                    }`}
                    onClick={() => setWithdrawalData(prev => ({ ...prev, method: method.id }))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {method.type === 'bank' ? (
                          <Landmark className="h-4 w-4" />
                        ) : (
                          <Wallet className="h-4 w-4" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{method.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {method.currency} • {method.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedMethod?.type === 'crypto' && (
              <div className="space-y-2">
                <Label htmlFor="recipient-address">
                  Recipient Address *
                </Label>
                <Input
                  id="recipient-address"
                  placeholder={`Enter ${selectedMethod.currency} address`}
                  value={withdrawalData.recipientAddress}
                  onChange={(e) => setWithdrawalData(prev => ({ ...prev, recipientAddress: e.target.value }))}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsWithdrawalModalOpen(false)} 
              className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleWithdrawal}
              disabled={!withdrawalData.amount || !withdrawalData.method || (selectedMethod?.type === 'crypto' && !withdrawalData.recipientAddress) || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
            >
              {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Processing...' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Widget Preview Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Quick Widget Preview</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard/developer?tab=gallery')}
            >
              View All Widgets
            </Button>
          </CardTitle>
          <CardDescription>
            Test the drop-in widgets you can embed on any website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Payment Button</h4>
              <p className="text-sm text-gray-600">Simple payment button for quick transactions</p>
              <PaymentButtonWidget
                apiKey="pk_test_demo"
                amount={0.001}
                currency="BTC"
                description="Demo Payment"
                merchantName="Your Store"
                buttonSize="sm"
                onSuccess={(payment) => console.log('Payment successful:', payment)}
                onError={(error) => console.log('Payment error:', error)}
              />
            </div>
            
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Developer Tools</h4>
              <p className="text-sm text-gray-600">Explore all widgets and get code examples</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => router.push('/dashboard/developer')}
              >
                Open Developer Console
              </Button>
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Widget Playground</h4>
              <p className="text-sm text-gray-600">Customize and preview widgets live</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => router.push('/dashboard/developer?tab=playground')}
              >
                Try Widget Builder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardOverview
