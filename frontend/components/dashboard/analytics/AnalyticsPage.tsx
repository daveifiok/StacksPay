'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Users,
  Activity,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Calculator,
  Receipt,
  Building,
  MapPin
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
import { cn } from '@/lib/utils'

interface AnalyticsData {
  revenue: {
    current: number
    previous: number
    change: number
  }
  transactions: {
    current: number
    previous: number
    change: number
  }
  customers: {
    current: number
    previous: number
    change: number
  }
  avgTransaction: {
    current: number
    previous: number
    change: number
  }
}

const mockAnalytics: AnalyticsData = {
  revenue: {
    current: 12847.32,
    previous: 11456.28,
    change: 12.1
  },
  transactions: {
    current: 1453,
    previous: 1298,
    change: 11.9
  },
  customers: {
    current: 324,
    previous: 298,
    change: 8.7
  },
  avgTransaction: {
    current: 39.6,
    previous: 38.4,
    change: 3.1
  }
}

// Currency-specific analytics data
const currencyAnalytics = {
  stx: {
    revenue: 4234.56, // USD equivalent
    revenueInCurrency: 8469.12, // Actual STX amount
    transactions: 487,
    successRate: 97.9,
    avgTransaction: 17.4 // STX
  },
  sbtc: {
    revenue: 6789.23,
    revenueInCurrency: 0.1508, // BTC amount
    transactions: 654,
    successRate: 99.1,
    avgTransaction: 0.000231 // BTC
  },
  btc: {
    revenue: 1823.53,
    revenueInCurrency: 0.0405, // BTC amount
    transactions: 312,
    successRate: 98.4,
    avgTransaction: 0.0001298 // BTC
  }
}

// Mock data for charts - now includes currency breakdown
const revenueData = [
  { date: 'Aug 1', revenue: 850, stx: 340, sbtc: 380, btc: 130, transactions: 45 },
  { date: 'Aug 3', revenue: 920, stx: 368, sbtc: 414, btc: 138, transactions: 52 },
  { date: 'Aug 5', revenue: 1100, stx: 440, sbtc: 495, btc: 165, transactions: 48 },
  { date: 'Aug 7', revenue: 980, stx: 392, sbtc: 441, btc: 147, transactions: 41 },
  { date: 'Aug 9', revenue: 1250, stx: 500, sbtc: 563, btc: 187, transactions: 55 },
  { date: 'Aug 11', revenue: 1180, stx: 472, sbtc: 531, btc: 177, transactions: 49 },
  { date: 'Aug 13', revenue: 1320, stx: 528, sbtc: 594, btc: 198, transactions: 62 },
  { date: 'Aug 15', revenue: 1450, stx: 580, sbtc: 653, btc: 217, transactions: 58 },
  { date: 'Aug 17', revenue: 1280, stx: 512, sbtc: 576, btc: 192, transactions: 53 },
  { date: 'Aug 18', revenue: 1380, stx: 552, sbtc: 621, btc: 207, transactions: 61 }
]

// Currency distribution data for pie chart
const currencyDistributionData = [
  { name: 'STX', value: 33, amount: 4234.56, transactions: 487, color: '#8b5cf6' },
  { name: 'sBTC', value: 53, amount: 6789.23, transactions: 654, color: '#ea580c' },
  { name: 'BTC', value: 14, amount: 1823.53, transactions: 312, color: '#f59e0b' }
]

const paymentMethodsData = [
  { name: 'Leather Wallet', value: 45, count: 652, stxCount: 198, sbtcCount: 312, btcCount: 142 },
  { name: 'Xverse Wallet', value: 32, count: 465, stxCount: 156, sbtcCount: 201, btcCount: 108 },
  { name: 'Hiro Wallet', value: 18, count: 261, stxCount: 89, sbtcCount: 124, btcCount: 48 },
  { name: 'Other', value: 5, count: 75, stxCount: 44, sbtcCount: 17, btcCount: 14 }
]

const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#8b5cf6']

// Mock tax data - now includes STX transactions
const taxDataByRegion = [
  { region: 'United States', taxRate: 8.25, transactions: 450, taxCollected: 2547.32, stxTransactions: 148, sbtcTransactions: 201, btcTransactions: 101 },
  { region: 'European Union', taxRate: 20.0, transactions: 280, taxCollected: 3421.18, stxTransactions: 95, sbtcTransactions: 123, btcTransactions: 62 },
  { region: 'United Kingdom', taxRate: 20.0, transactions: 180, taxCollected: 1876.45, stxTransactions: 61, sbtcTransactions: 79, btcTransactions: 40 },
  { region: 'Canada', taxRate: 13.0, transactions: 95, taxCollected: 847.21, stxTransactions: 32, sbtcTransactions: 41, btcTransactions: 22 },
  { region: 'Australia', taxRate: 10.0, transactions: 62, taxCollected: 456.78, stxTransactions: 21, sbtcTransactions: 27, btcTransactions: 14 }
]

const monthlyTaxData = [
  { month: 'Jan', taxCollected: 2845.32, transactions: 156, stxTax: 948.44, sbtcTax: 1421.66, btcTax: 475.22 },
  { month: 'Feb', taxCollected: 3123.45, transactions: 189, stxTax: 1041.15, sbtcTax: 1561.73, btcTax: 520.57 },
  { month: 'Mar', taxCollected: 2987.21, transactions: 174, stxTax: 995.74, sbtcTax: 1493.61, btcTax: 497.86 },
  { month: 'Apr', taxCollected: 3456.78, transactions: 203, stxTax: 1150.76, sbtcTax: 1728.39, btcTax: 577.63 },
  { month: 'May', taxCollected: 3721.45, transactions: 218, stxTax: 1240.48, sbtcTax: 1860.73, btcTax: 620.24 },
  { month: 'Jun', taxCollected: 3987.32, transactions: 234, stxTax: 1329.11, sbtcTax: 1993.66, btcTax: 664.55 }
]

const taxReports = [
  {
    id: '1',
    name: 'Q3 2024 Tax Summary',
    type: 'Quarterly',
    dateRange: 'Jul 1 - Sep 30, 2024',
    status: 'completed',
    totalTax: 12456.78,
    fileSize: '2.3 MB'
  },
  {
    id: '2',
    name: 'August 2024 Detailed Report',
    type: 'Monthly',
    dateRange: 'Aug 1 - Aug 31, 2024',
    status: 'completed',
    totalTax: 4123.45,
    fileSize: '1.8 MB'
  },
  {
    id: '3',
    name: 'EU VAT Report - Q3',
    type: 'VAT',
    dateRange: 'Jul 1 - Sep 30, 2024',
    status: 'processing',
    totalTax: 8765.43,
    fileSize: '3.1 MB'
  }
]

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>(mockAnalytics)
  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(false)

  const refreshData = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
  }

  useEffect(() => {
    refreshData()
  }, [timeRange])

  const MetricCard = ({ 
    title, 
    current, 
    previous, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string
    current: number
    previous: number
    change: number
    icon: any
    format?: 'number' | 'currency' | 'percentage'
  }) => {
    const isPositive = change > 0
    const formatValue = (value: number) => {
      switch (format) {
        case 'currency':
          return `$${value.toLocaleString()}`
        case 'percentage':
          return `${value}%`
        default:
          return value.toLocaleString()
      }
    }

    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Card className="relative overflow-hidden bg-white dark:bg-gray-900 border shadow-sm hover:shadow-md transition-shadow duration-200">
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
                  {formatValue(current)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  vs {formatValue(previous)} last period
                </p>
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
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>
                  {isPositive ? '+' : ''}{change.toFixed(1)}%
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Analytics & Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Deep insights, tax reporting, and performance analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          
          <Button 
            size="sm" 
            onClick={refreshData} 
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Activity className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tax-reporting">Tax Reporting</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          current={analytics.revenue.current}
          previous={analytics.revenue.previous}
          change={analytics.revenue.change}
          icon={DollarSign}
          format="currency"
        />
        
        <MetricCard
          title="Transactions"
          current={analytics.transactions.current}
          previous={analytics.transactions.previous}
          change={analytics.transactions.change}
          icon={CreditCard}
        />
        
        <MetricCard
          title="Active Customers"
          current={analytics.customers.current}
          previous={analytics.customers.previous}
          change={analytics.customers.change}
          icon={Users}
        />
        
        <MetricCard
          title="Avg Transaction"
          current={analytics.avgTransaction.current}
          previous={analytics.avgTransaction.previous}
          change={analytics.avgTransaction.change}
          icon={TrendingUp}
          format="currency"
        />
      </div>

      {/* Currency Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(currencyAnalytics).map(([currency, data]) => (
          <Card key={currency} className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 uppercase">
                    {currency}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currency === 'stx' ? 'Stacks' : currency === 'sbtc' ? 'Synthetic Bitcoin' : 'Bitcoin'}
                  </p>
                </div>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: currency === 'stx' ? '#8b5cf6' : currency === 'sbtc' ? '#ea580c' : '#f59e0b' 
                  }}
                />
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${data.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {currency === 'stx' 
                      ? `${data.revenueInCurrency.toLocaleString()} STX`
                      : `${data.revenueInCurrency.toFixed(6)} ${currency.toUpperCase()}`
                    }
                  </p>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Transactions</span>
                  <span className="font-medium">{data.transactions}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                  <span className="font-medium text-green-600">{data.successRate}%</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Avg Transaction</span>
                  <span className="font-medium">
                    {currency === 'stx' 
                      ? `${data.avgTransaction} STX`
                      : `${data.avgTransaction.toFixed(6)} ${currency.toUpperCase()}`
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend by Currency */}
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <span>Revenue by Currency</span>
            </CardTitle>
            <CardDescription>
              Revenue breakdown by STX, sBTC, and BTC over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorSTX" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSBTC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBTC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                    className="text-gray-600 dark:text-gray-400"
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: any, name: string) => [`$${value}`, name.toUpperCase()]}
                  />
                  <Area
                    type="monotone"
                    dataKey="stx"
                    stackId="1"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSTX)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sbtc"
                    stackId="1"
                    stroke="#ea580c"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSBTC)"
                  />
                  <Area
                    type="monotone"
                    dataKey="btc"
                    stackId="1"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBTC)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm">STX</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-600" />
                <span className="text-sm">sBTC</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm">BTC</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Distribution */}
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5 text-orange-600" />
              <span>Revenue by Currency</span>
            </CardTitle>
            <CardDescription>
              Payment distribution by currency type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currencyDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {currencyDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: any, name: any, props: any) => [
                      `${value}% ($${props.payload.amount.toLocaleString()})`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="space-y-2 mt-4">
              {currencyDistributionData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{entry.value}%</span>
                    <p className="text-xs text-gray-500">
                      ${entry.amount.toLocaleString()} • {entry.transactions} payments
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Customers */}
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <span>Top Customers</span>
            </CardTitle>
            <CardDescription>
              Highest spending customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Alice Johnson', totalUSD: 1847.50, stx: 425.0, sbtc: 0.0412, btc: 0.0089, transactions: 28 },
              { name: 'Bob Wilson', totalUSD: 1234.80, stx: 298.5, sbtc: 0.0234, btc: 0.0067, transactions: 15 },
              { name: 'Carol Smith', totalUSD: 987.25, stx: 189.2, sbtc: 0.0189, btc: 0.0045, transactions: 22 },
            ].map((customer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {customer.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {customer.transactions} transactions
                  </p>
                  <div className="flex space-x-2 text-xs text-gray-500 mt-1">
                    <span>{customer.stx} STX</span>
                    <span>•</span>
                    <span>{customer.sbtc} sBTC</span>
                    <span>•</span>
                    <span>{customer.btc} BTC</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    ${customer.totalUSD.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <span>Success Rate</span>
            </CardTitle>
            <CardDescription>
              Payment completion rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                98.7%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                1,432 of 1,453 payments successful
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="text-green-600">1,432</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed</span>
                  <span className="text-red-600">21</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Stats */}
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <span>Network Performance</span>
            </CardTitle>
            <CardDescription>
              Blockchain metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Block Time</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                10.2 min
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Network Fee</span>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                0.0001 sBTC
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Confirmation Time</span>
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                2.3 min
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        {/* Tax Reporting Tab */}
        <TabsContent value="tax-reporting" className="space-y-8">
          {/* Tax Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Total Tax Collected
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      $9,148.94
                    </p>
                  </div>
                  <Calculator className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">This quarter</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Tax Jurisdictions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {taxDataByRegion.length}
                    </p>
                  </div>
                  <MapPin className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Active regions</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Pending Reports
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {taxReports.filter(r => r.status === 'processing').length}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">In processing</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Compliance Status
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      100%
                    </p>
                  </div>
                  <Building className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">All regions compliant</p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Tax Collection */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <span>Monthly Tax Collection</span>
                </CardTitle>
                <CardDescription>
                  Tax collected over time by month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTaxData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'currentColor' }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'currentColor' }}
                        className="text-gray-600 dark:text-gray-400"
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: any) => [`$${value}`, 'Tax Collected']}
                      />
                      <Bar
                        dataKey="taxCollected"
                        fill="#ea580c"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tax by Region */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="h-5 w-5 text-orange-600" />
                  <span>Tax by Region</span>
                </CardTitle>
                <CardDescription>
                  Tax distribution across jurisdictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taxDataByRegion.map((region, index) => (
                    <div key={region.region} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {region.region}
                          </p>
                          <p className="text-xs text-gray-500">
                            {region.transactions} transactions • {region.taxRate}% rate
                          </p>
                          <p className="text-xs text-gray-400">
                            {region.stxTransactions} STX • {region.sbtcTransactions} sBTC • {region.btcTransactions} BTC
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${region.taxCollected.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tax Reports */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Receipt className="h-5 w-5 text-orange-600" />
                    <span>Tax Reports</span>
                  </CardTitle>
                  <CardDescription>
                    Generate and download tax compliance reports
                  </CardDescription>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taxReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{report.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{report.dateRange}</span>
                          <Badge variant={report.type === 'VAT' ? 'default' : 'outline'} className="text-xs">
                            {report.type}
                          </Badge>
                          <span>{report.fileSize}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">${report.totalTax.toLocaleString()}</p>
                        <Badge 
                          variant={report.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {report.status}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" disabled={report.status === 'processing'}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-8">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Advanced Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Custom reporting, A/B testing, and advanced metrics coming soon
            </p>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsPage
