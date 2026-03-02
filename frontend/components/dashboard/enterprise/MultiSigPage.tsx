'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Signature,
  DollarSign,
  Settings
} from 'lucide-react'
import EnterprisePaymentWidget from '@/components/widgets/EnterprisePaymentWidget'
import { MultiSigConfig, Signer } from '@/components/widgets/types'

// Mock multi-sig data
const mockWallets = [
  {
    id: 'MSW_001',
    name: 'Executive Wallet',
    address: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    threshold: 2,
    totalSigners: 3,
    balance: { BTC: 0.45, STX: 1250.5, sBTC: 0.42 },
    transactions: [
      {
        id: 'TX_001',
        amount: 0.05,
        currency: 'BTC' as const,
        description: 'Marketing budget allocation',
        status: 'pending',
        signatures: 1,
        required: 2,
        deadline: '2024-02-15T23:59:59Z',
        signers: [
          { id: '1', name: 'Alice Johnson', address: 'SP1...ABC', status: 'signed' as const, role: 'CEO' },
          { id: '2', name: 'Bob Smith', address: 'SP2...DEF', status: 'pending' as const, role: 'CTO' },
          { id: '3', name: 'Carol Davis', address: 'SP3...GHI', status: 'pending' as const, role: 'CFO' }
        ]
      }
    ]
  },
  {
    id: 'MSW_002',
    name: 'Treasury Wallet',
    address: 'SP1H7F9V2K8C3D6E9F1G2H3I4J5K6L7M8N9O0P',
    threshold: 3,
    totalSigners: 5,
    balance: { BTC: 1.2, STX: 5000.0, sBTC: 1.15 },
    transactions: [
      {
        id: 'TX_002',
        amount: 0.2,
        currency: 'BTC' as const,
        description: 'Quarterly dividend payment',
        status: 'active',
        signatures: 3,
        required: 3,
        deadline: '2024-02-20T18:00:00Z',
        signers: [
          { id: '1', name: 'Alice Johnson', address: 'SP1...ABC', status: 'signed' as const, role: 'CEO' },
          { id: '2', name: 'Bob Smith', address: 'SP2...DEF', status: 'signed' as const, role: 'CTO' },
          { id: '3', name: 'Carol Davis', address: 'SP3...GHI', status: 'signed' as const, role: 'CFO' },
          { id: '4', name: 'David Wilson', address: 'SP4...JKL', status: 'pending' as const, role: 'Board Member' },
          { id: '5', name: 'Eve Brown', address: 'SP5...MNO', status: 'pending' as const, role: 'Board Member' }
        ]
      }
    ]
  }
]

export default function MultiSigPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [wallets, setWallets] = useState(mockWallets)

  const handleMultiSigCreate = (config: MultiSigConfig) => {
    console.log('Creating multi-sig wallet:', config)
    // Handle multi-sig creation
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'signed': return 'bg-blue-100 text-blue-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'expired': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'completed': return 'bg-blue-100 text-blue-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'expired': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const totalTransactionsPending = wallets.reduce((sum, wallet) => 
    sum + wallet.transactions.filter(tx => tx.status === 'pending').length, 0
  )

  const totalSignaturesPending = wallets.reduce((sum, wallet) => 
    sum + wallet.transactions.reduce((txSum, tx) => txSum + (tx.required - tx.signatures), 0), 0
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Multi-Signature Wallets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Shared control wallets requiring multiple signatures for transactions
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          New Multi-Sig
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Wallets</p>
                <p className="text-2xl font-bold">{wallets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold">
                  ₿{wallets.reduce((sum, w) => sum + w.balance.BTC, 0).toFixed(3)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Transactions</p>
                <p className="text-2xl font-bold">{totalTransactionsPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Signature className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Signatures Needed</p>
                <p className="text-2xl font-bold">{totalSignaturesPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="transactions">Pending Transactions</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wallet Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Wallet Summary</CardTitle>
                <CardDescription>Overview of your multi-signature wallets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wallets.map((wallet) => (
                    <div key={wallet.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{wallet.name}</h4>
                        <p className="text-sm text-gray-600">
                          {wallet.threshold} of {wallet.totalSigners} signatures required
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₿{wallet.balance.BTC}</p>
                        <p className="text-sm text-gray-500">
                          {wallet.transactions.filter(tx => tx.status === 'pending').length} pending
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Signatures */}
            <Card>
              <CardHeader>
                <CardTitle>Action Required</CardTitle>
                <CardDescription>Transactions awaiting your signature</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wallets.flatMap(wallet => 
                    wallet.transactions
                      .filter(tx => tx.status === 'pending')
                      .map(tx => (
                        <div key={tx.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{tx.description}</h4>
                            <Badge className={getTransactionStatusColor(tx.status)}>
                              {tx.signatures}/{tx.required} signed
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Amount: ₿{tx.amount} • Wallet: {wallet.name}
                          </p>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            <Signature className="w-4 h-4 mr-1" />
                            Sign Transaction
                          </Button>
                        </div>
                      ))
                  )}
                  {wallets.every(wallet => wallet.transactions.every(tx => tx.status !== 'pending')) && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-2" />
                      <p className="text-gray-600">No pending signatures</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wallets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {wallets.map((wallet) => (
              <Card key={wallet.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>{wallet.name}</span>
                  </CardTitle>
                  <CardDescription>
                    {wallet.threshold} of {wallet.totalSigners} signatures required
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Wallet Info */}
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">BTC Balance</p>
                        <p className="font-bold">₿{wallet.balance.BTC}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">STX Balance</p>
                        <p className="font-bold">{wallet.balance.STX.toLocaleString()} STX</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">sBTC Balance</p>
                        <p className="font-bold">₿{wallet.balance.sBTC}</p>
                      </div>
                    </div>
                    
                    <div className="text-center text-xs text-gray-500 p-2 bg-gray-50 rounded">
                      {wallet.address}
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div>
                    <h4 className="font-medium mb-3">Recent Transactions</h4>
                    <div className="space-y-3">
                      {wallet.transactions.map((tx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{tx.description}</p>
                              <p className="text-xs text-gray-600">₿{tx.amount} • {tx.currency}</p>
                            </div>
                            <Badge className={getTransactionStatusColor(tx.status)}>
                              {tx.signatures}/{tx.required}
                            </Badge>
                          </div>
                          
                          {/* Signers */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tx.signers.map((signer) => (
                              <div key={signer.id} className="flex items-center space-x-1">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {signer.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`w-2 h-2 rounded-full ${
                                  signer.status === 'signed' ? 'bg-green-500' :
                                  signer.status === 'pending' ? 'bg-yellow-500' :
                                  'bg-gray-400'
                                }`} />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="w-4 h-4 mr-1" />
                      Settings
                    </Button>
                    <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700">
                      <Plus className="w-4 h-4 mr-1" />
                      New Transaction
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Transactions</CardTitle>
              <CardDescription>All transactions awaiting signatures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wallets.flatMap(wallet =>
                  wallet.transactions
                    .filter(tx => tx.status === 'pending')
                    .map(tx => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{tx.description}</h3>
                            <p className="text-gray-600">From: {wallet.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">₿{tx.amount}</p>
                            <Badge className={getTransactionStatusColor(tx.status)}>
                              {tx.signatures}/{tx.required} signed
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <h4 className="font-medium mb-3">Signers</h4>
                            <div className="space-y-2">
                              {tx.signers.map((signer) => (
                                <div key={signer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="text-sm">
                                        {signer.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm">{signer.name}</p>
                                      <p className="text-xs text-gray-600">{signer.role}</p>
                                    </div>
                                  </div>
                                  <Badge className={getStatusColor(signer.status)}>
                                    {signer.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-3">Transaction Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Transaction ID:</span>
                                <span className="font-mono">{tx.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Deadline:</span>
                                <span>{new Date(tx.deadline).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Auto-execute:</span>
                                <span>Yes</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-4 border-t">
                          <Button className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Sign & Approve
                          </Button>
                          <Button variant="outline">
                            View Details
                          </Button>
                          <Button variant="destructive">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Multi-Signature Wallet</CardTitle>
              <CardDescription>Set up a new shared control wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <EnterprisePaymentWidget
                type="multisig"
                onMultiSigCreate={handleMultiSigCreate}
                showComplianceFeatures={true}
                allowCustomContracts={true}
                requireKYB={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}