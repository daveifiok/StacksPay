'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Store,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Settings,
  Eye,
  MoreHorizontal,
  Percent,
  Building,
  User,
  CreditCard,
  ArrowRightLeft,
  Split,
  Share,
  Globe,
  ShoppingBag,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Merchant {
  id: string
  name: string
  email: string
  businessType: string
  status: 'active' | 'pending' | 'suspended'
  joinedAt: string
  totalVolume: number
  totalTransactions: number
  commissionRate: number
  avatar?: string
}

interface SplitPayment {
  id: string
  orderId: string
  totalAmount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  splits: {
    merchantId: string
    merchantName: string
    amount: number
    percentage: number
    status: 'pending' | 'completed' | 'failed'
  }[]
  platformFee: number
  customer: {
    name: string
    email: string
  }
}

interface MarketplaceStats {
  totalMerchants: number
  activeMerchants: number
  totalVolume: number
  totalTransactions: number
  platformRevenue: number
  avgCommission: number
}

const mockMerchants: Merchant[] = [
  {
    id: 'merch_001',
    name: 'Bitcoin Books Store',
    email: 'admin@bitcoinbooks.com',
    businessType: 'E-commerce',
    status: 'active',
    joinedAt: '2024-01-15T10:30:00Z',
    totalVolume: 45.67,
    totalTransactions: 234,
    commissionRate: 2.5,
    avatar: ''
  },
  {
    id: 'merch_002',
    name: 'Crypto Consulting LLC',
    email: 'contact@cryptoconsult.com',
    businessType: 'Services',
    status: 'active',
    joinedAt: '2024-01-10T14:20:00Z',
    totalVolume: 123.45,
    totalTransactions: 89,
    commissionRate: 3.0,
    avatar: ''
  },
  {
    id: 'merch_003',
    name: 'NFT Gallery',
    email: 'hello@nftgallery.art',
    businessType: 'Digital Art',
    status: 'pending',
    joinedAt: '2024-01-20T09:15:00Z',
    totalVolume: 0,
    totalTransactions: 0,
    commissionRate: 5.0,
    avatar: ''
  }
]

const mockSplitPayments: SplitPayment[] = [
  {
    id: 'split_001',
    orderId: 'ORD-2024-001',
    totalAmount: 10.0,
    currency: 'sBTC',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    splits: [
      {
        merchantId: 'merch_001',
        merchantName: 'Bitcoin Books Store',
        amount: 7.0,
        percentage: 70,
        status: 'completed'
      },
      {
        merchantId: 'merch_002',
        merchantName: 'Crypto Consulting LLC',
        amount: 2.5,
        percentage: 25,
        status: 'completed'
      }
    ],
    platformFee: 0.5,
    customer: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  {
    id: 'split_002',
    orderId: 'ORD-2024-002',
    totalAmount: 5.0,
    currency: 'sBTC',
    status: 'pending',
    createdAt: '2024-01-16T14:20:00Z',
    splits: [
      {
        merchantId: 'merch_001',
        merchantName: 'Bitcoin Books Store',
        amount: 4.0,
        percentage: 80,
        status: 'pending'
      }
    ],
    platformFee: 1.0,
    customer: {
      name: 'Alice Smith',
      email: 'alice@example.com'
    }
  }
]

const mockStats: MarketplaceStats = {
  totalMerchants: 3,
  activeMerchants: 2,
  totalVolume: 169.12,
  totalTransactions: 323,
  platformRevenue: 4.23,
  avgCommission: 3.5
}

export default function MarketplacePage() {
  const [merchants, setMerchants] = useState<Merchant[]>(mockMerchants)
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>(mockSplitPayments)
  const [stats] = useState<MarketplaceStats>(mockStats)
  
  const [isAddMerchantOpen, setIsAddMerchantOpen] = useState(false)
  const [isCreateSplitOpen, setIsCreateSplitOpen] = useState(false)
  
  const [newMerchant, setNewMerchant] = useState({
    name: '',
    email: '',
    businessType: '',
    commissionRate: 2.5
  })
  
  const [newSplitPayment, setNewSplitPayment] = useState({
    orderId: '',
    totalAmount: '',
    splits: [{ merchantId: '', percentage: 100 }],
    platformFeePercentage: 5
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'suspended':
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'suspended':
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const addSplit = () => {
    setNewSplitPayment(prev => ({
      ...prev,
      splits: [...prev.splits, { merchantId: '', percentage: 0 }]
    }))
  }

  const removeSplit = (index: number) => {
    setNewSplitPayment(prev => ({
      ...prev,
      splits: prev.splits.filter((_, i) => i !== index)
    }))
  }

  const updateSplit = (index: number, field: string, value: any) => {
    setNewSplitPayment(prev => ({
      ...prev,
      splits: prev.splits.map((split, i) => 
        i === index ? { ...split, [field]: value } : split
      )
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage merchants, split payments, and marketplace operations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button 
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => setIsAddMerchantOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Merchant
          </Button>
        </div>
      </div>

      {/* Marketplace Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Merchants</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMerchants}</p>
            </div>
            <Store className="h-8 w-8 text-orange-600" />
          </div>
          <p className="text-sm text-gray-500 mt-2">All registered</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Merchants</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeMerchants}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Currently trading</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Volume</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalVolume} sBTC</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">All time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalTransactions}</p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Total processed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Platform Revenue</p>
              <p className="text-2xl font-bold text-green-600">{stats.platformRevenue} sBTC</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">From commissions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Commission</p>
              <p className="text-2xl font-bold text-orange-600">{stats.avgCommission}%</p>
            </div>
            <Percent className="h-8 w-8 text-orange-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Platform fee</p>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm"
      >
        <Tabs defaultValue="merchants" className="w-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="merchants">Merchants</TabsTrigger>
              <TabsTrigger value="split-payments">Split Payments</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          {/* Merchants Tab */}
          <TabsContent value="merchants" className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Merchant Directory</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your marketplace merchants</p>
              </div>
              <Button onClick={() => setIsAddMerchantOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Merchant
              </Button>
            </div>

            <div className="space-y-4">
              {merchants.map((merchant) => (
                <Card key={merchant.id} className="border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={merchant.avatar} />
                          <AvatarFallback className="bg-orange-100 text-orange-600">
                            {merchant.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{merchant.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{merchant.email}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {merchant.businessType}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(merchant.status)}`}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(merchant.status)}
                                <span className="capitalize">{merchant.status}</span>
                              </div>
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-right">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Volume</p>
                          <p className="font-semibold">{merchant.totalVolume} sBTC</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                          <p className="font-semibold">{merchant.totalTransactions}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Commission</p>
                          <p className="font-semibold">{merchant.commissionRate}%</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Suspend Merchant
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Split Payments Tab */}
          <TabsContent value="split-payments" className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Split Payments</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage multi-party payment distributions</p>
              </div>
              <Button onClick={() => setIsCreateSplitOpen(true)}>
                <Split className="h-4 w-4 mr-2" />
                Create Split Payment
              </Button>
            </div>

            <div className="space-y-4">
              {splitPayments.map((payment) => (
                <Card key={payment.id} className="border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {payment.orderId}
                          </h4>
                          <Badge className={`text-xs ${getStatusColor(payment.status)}`}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(payment.status)}
                              <span className="capitalize">{payment.status}</span>
                            </div>
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>{payment.customer.name}</span>
                          <span>{payment.customer.email}</span>
                          <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {payment.totalAmount} {payment.currency}
                        </p>
                        <p className="text-sm text-gray-500">
                          Platform fee: {payment.platformFee} {payment.currency}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900 dark:text-white">Payment Splits:</h5>
                      {payment.splits.map((split, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {split.merchantName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {split.percentage}% of total
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <p className="font-semibold">
                              {split.amount} {payment.currency}
                            </p>
                            <Badge className={`text-xs ${getStatusColor(split.status)}`}>
                              {split.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Marketplace Settings</CardTitle>
                  <CardDescription>Configure your marketplace parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Default Commission Rate (%)</Label>
                    <Input type="number" placeholder="2.5" defaultValue="2.5" />
                  </div>
                  <div>
                    <Label>Platform Fee (%)</Label>
                    <Input type="number" placeholder="5.0" defaultValue="5.0" />
                  </div>
                  <div>
                    <Label>Minimum Payout Threshold (sBTC)</Label>
                    <Input type="number" placeholder="0.1" defaultValue="0.1" />
                  </div>
                  <div>
                    <Label>Settlement Period</Label>
                    <Select defaultValue="weekly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Merchant Onboarding</CardTitle>
                  <CardDescription>Configure merchant approval process</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Auto-approve merchants</Label>
                    <Select defaultValue="manual">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatic</SelectItem>
                        <SelectItem value="manual">Manual Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Required Documents</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Business Registration</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Tax ID Verification</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Bank Account Verification</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add Merchant Modal */}
      <Dialog open={isAddMerchantOpen} onOpenChange={setIsAddMerchantOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Merchant</DialogTitle>
            <DialogDescription>
              Register a new merchant to your marketplace
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Business Name</Label>
              <Input
                placeholder="Enter business name"
                value={newMerchant.name}
                onChange={(e) => setNewMerchant(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Business Email</Label>
              <Input
                type="email"
                placeholder="Enter business email"
                value={newMerchant.email}
                onChange={(e) => setNewMerchant(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Business Type</Label>
              <Select value={newMerchant.businessType} onValueChange={(value) => setNewMerchant(prev => ({ ...prev, businessType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="e-commerce">E-commerce</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="digital-art">Digital Art</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Commission Rate (%)</Label>
              <Input
                type="number"
                placeholder="2.5"
                value={newMerchant.commissionRate}
                onChange={(e) => setNewMerchant(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsAddMerchantOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700">
              Add Merchant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Split Payment Modal */}
      <Dialog open={isCreateSplitOpen} onOpenChange={setIsCreateSplitOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Split Payment</DialogTitle>
            <DialogDescription>
              Configure how payment will be distributed among merchants
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Order ID</Label>
                <Input
                  placeholder="ORD-2024-001"
                  value={newSplitPayment.orderId}
                  onChange={(e) => setNewSplitPayment(prev => ({ ...prev, orderId: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Total Amount (sBTC)</Label>
                <Input
                  type="number"
                  placeholder="10.0"
                  value={newSplitPayment.totalAmount}
                  onChange={(e) => setNewSplitPayment(prev => ({ ...prev, totalAmount: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Payment Splits</Label>
              <div className="space-y-4 mt-2">
                {newSplitPayment.splits.map((split, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Select value={split.merchantId} onValueChange={(value) => updateSplit(index, 'merchantId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select merchant" />
                        </SelectTrigger>
                        <SelectContent>
                          {merchants.filter(m => m.status === 'active').map(merchant => (
                            <SelectItem key={merchant.id} value={merchant.id}>
                              {merchant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Percentage"
                        value={split.percentage}
                        onChange={(e) => updateSplit(index, 'percentage', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSplit(index)}
                      disabled={newSplitPayment.splits.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" onClick={addSplit} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Split
              </Button>
            </div>
            
            <div>
              <Label>Platform Fee (%)</Label>
              <Input
                type="number"
                placeholder="5"
                value={newSplitPayment.platformFeePercentage}
                onChange={(e) => setNewSplitPayment(prev => ({ ...prev, platformFeePercentage: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateSplitOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700">
              Create Split Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}