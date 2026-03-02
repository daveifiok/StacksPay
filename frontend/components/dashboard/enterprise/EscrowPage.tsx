'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  DollarSign
} from 'lucide-react'
import EnterprisePaymentWidget from '@/components/widgets/EnterprisePaymentWidget'
import { EscrowConfig } from '@/components/widgets/types'

// Mock escrow data
const mockEscrowContracts = [
  {
    id: 'ESC_001',
    amount: 0.15,
    currency: 'BTC' as const,
    status: 'active',
    releaseConditions: ['Service delivery confirmation', 'Quality inspection passed'],
    timelock: 1708732800000, // Unix timestamp
    releaseTo: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    description: 'Software development milestone payment',
    createdAt: '2024-01-15T10:30:00Z',
    participants: ['Alice Corp', 'Bob LLC', 'Arbitrator Inc'],
    progress: 75
  },
  {
    id: 'ESC_002',
    amount: 0.08,
    currency: 'BTC' as const,
    status: 'pending_release',
    releaseConditions: ['Goods received', 'Customer approval'],
    releaseTo: 'SP1H7F9V2K8C3D6E9F1G2H3I4J5K6L7M8N9O0P',
    description: 'Product shipment escrow',
    createdAt: '2024-01-20T14:15:00Z',
    participants: ['Merchant Co', 'Customer Inc'],
    progress: 90
  },
  {
    id: 'ESC_003',
    amount: 0.25,
    currency: 'BTC' as const,
    status: 'disputed',
    releaseConditions: ['Service completion', 'Performance benchmarks met'],
    releaseTo: 'SP3A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R',
    description: 'Consulting services contract',
    createdAt: '2024-01-10T09:00:00Z',
    participants: ['Consultant Pro', 'Enterprise Client', 'Mediator LLC'],
    progress: 45
  }
]

export default function EscrowPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [contracts, setContracts] = useState(mockEscrowContracts)

  const handleEscrowCreate = (config: EscrowConfig) => {
    console.log('Creating escrow contract:', config)
    // Handle escrow creation
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending_release': return 'bg-yellow-100 text-yellow-700'
      case 'released': return 'bg-blue-100 text-blue-700'
      case 'disputed': return 'bg-red-100 text-red-700'
      case 'cancelled': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatTimelock = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Escrow Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Secure multi-party payment solutions with automated release conditions
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          New Escrow
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Contracts</p>
                <p className="text-2xl font-bold">
                  {contracts.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Value Locked</p>
                <p className="text-2xl font-bold">
                  ₿{contracts.reduce((sum, c) => sum + c.amount, 0).toFixed(3)}
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
                <p className="text-sm text-gray-600">Pending Release</p>
                <p className="text-2xl font-bold">
                  {contracts.filter(c => c.status === 'pending_release').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Disputes</p>
                <p className="text-2xl font-bold">
                  {contracts.filter(c => c.status === 'disputed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Active Contracts</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Contracts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Contracts</CardTitle>
                <CardDescription>Latest escrow activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contracts.slice(0, 3).map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{contract.id}</h4>
                        <p className="text-sm text-gray-600">{contract.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(contract.status)}>
                            {contract.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₿{contract.amount}</p>
                        <p className="text-sm text-gray-500">{contract.progress}% complete</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common escrow management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Escrow Contract
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Review Pending Releases
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Resolve Disputes
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Arbitrators
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Escrow Contracts</CardTitle>
              <CardDescription>Monitor and manage your escrow agreements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <motion.div
                    key={contract.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{contract.id}</h3>
                        <p className="text-gray-600">{contract.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status.replace('_', ' ')}
                        </Badge>
                        <p className="font-bold text-lg mt-1">₿{contract.amount}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{contract.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${contract.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Contract Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">Participants</h4>
                        <div className="space-y-1">
                          {contract.participants.map((participant, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{participant}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Release Conditions</h4>
                        <div className="space-y-1">
                          {contract.releaseConditions.map((condition, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm">{condition}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {contract.status === 'pending_release' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Release Funds
                        </Button>
                      )}
                      {contract.status === 'disputed' && (
                        <Button size="sm" variant="destructive">
                          Resolve Dispute
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Contact Parties
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Escrow Contract</CardTitle>
              <CardDescription>Set up a secure multi-party payment agreement</CardDescription>
            </CardHeader>
            <CardContent>
              <EnterprisePaymentWidget
                type="escrow"
                onEscrowCreate={handleEscrowCreate}
                showComplianceFeatures={true}
                allowCustomContracts={true}
                requireKYB={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}