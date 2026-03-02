'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  Eye,
  MoreHorizontal,
  Filter,
  Search,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
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

interface Dispute {
  id: string
  transactionId: string
  amount: number
  currency: string
  status: 'open' | 'under_review' | 'accepted' | 'rejected' | 'expired'
  reason: string
  category: 'unauthorized' | 'duplicate' | 'fraud' | 'product_not_received' | 'other'
  customerEmail: string
  customerName: string
  createdAt: string
  updatedAt: string
  evidenceRequired: boolean
  evidenceDeadline?: string
  responseCount: number
  riskScore: number
}

interface DisputeEvidence {
  id: string
  disputeId: string
  type: 'receipt' | 'communication' | 'shipping' | 'refund' | 'other'
  description: string
  fileUrl?: string
  uploadedAt: string
}

const mockDisputes: Dispute[] = [
  {
    id: 'disp_001',
    transactionId: 'txn_abc123',
    amount: 1.25,
    currency: 'sBTC',
    status: 'open',
    reason: 'Customer claims transaction was unauthorized',
    category: 'unauthorized',
    customerEmail: 'customer@example.com',
    customerName: 'John Doe',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    evidenceRequired: true,
    evidenceDeadline: '2024-01-22T23:59:59Z',
    responseCount: 0,
    riskScore: 85
  },
  {
    id: 'disp_002',
    transactionId: 'txn_def456',
    amount: 0.75,
    currency: 'sBTC',
    status: 'under_review',
    reason: 'Duplicate transaction charged twice',
    category: 'duplicate',
    customerEmail: 'alice@example.com',
    customerName: 'Alice Smith',
    createdAt: '2024-01-14T15:20:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
    evidenceRequired: true,
    evidenceDeadline: '2024-01-21T23:59:59Z',
    responseCount: 2,
    riskScore: 45
  },
  {
    id: 'disp_003',
    transactionId: 'txn_ghi789',
    amount: 2.10,
    currency: 'sBTC',
    status: 'accepted',
    reason: 'Product never received, merchant acknowledged shipping error',
    category: 'product_not_received',
    customerEmail: 'bob@example.com',
    customerName: 'Bob Johnson',
    createdAt: '2024-01-10T08:45:00Z',
    updatedAt: '2024-01-13T14:30:00Z',
    evidenceRequired: false,
    responseCount: 5,
    riskScore: 25
  },
  {
    id: 'disp_004',
    transactionId: 'txn_jkl012',
    amount: 0.45,
    currency: 'sBTC',
    status: 'rejected',
    reason: 'Customer claimed fraud, but evidence shows legitimate purchase',
    category: 'fraud',
    customerEmail: 'charlie@example.com',
    customerName: 'Charlie Brown',
    createdAt: '2024-01-08T12:00:00Z',
    updatedAt: '2024-01-12T16:45:00Z',
    evidenceRequired: false,
    responseCount: 3,
    riskScore: 15
  }
]

const mockEvidence: DisputeEvidence[] = [
  {
    id: 'ev_001',
    disputeId: 'disp_002',
    type: 'receipt',
    description: 'Original transaction receipt showing single charge',
    fileUrl: '/evidence/receipt_def456.pdf',
    uploadedAt: '2024-01-14T16:30:00Z'
  },
  {
    id: 'ev_002',
    disputeId: 'disp_002',
    type: 'communication',
    description: 'Customer service chat log acknowledging duplicate charge',
    uploadedAt: '2024-01-15T09:15:00Z'
  }
]

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>(mockDisputes)
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>(mockDisputes)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false)

  useEffect(() => {
    let filtered = disputes

    if (searchTerm) {
      filtered = filtered.filter(dispute => 
        dispute.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.reason.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(dispute => dispute.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(dispute => dispute.category === categoryFilter)
    }

    setFilteredDisputes(filtered)
  }, [disputes, searchTerm, statusFilter, categoryFilter])

  const getStatusColor = (status: Dispute['status']) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'accepted':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
      case 'rejected':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
      case 'expired':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: Dispute['status']) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-4 w-4" />
      case 'under_review':
        return <Clock className="h-4 w-4" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'expired':
        return <Clock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryIcon = (category: Dispute['category']) => {
    switch (category) {
      case 'unauthorized':
        return <Shield className="h-4 w-4" />
      case 'duplicate':
        return <CreditCard className="h-4 w-4" />
      case 'fraud':
        return <AlertTriangle className="h-4 w-4" />
      case 'product_not_received':
        return <FileText className="h-4 w-4" />
      case 'other':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const disputeStats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    underReview: disputes.filter(d => d.status === 'under_review').length,
    resolved: disputes.filter(d => d.status === 'accepted' || d.status === 'rejected').length,
    avgResolutionTime: '3.2 days',
    winRate: '68%'
  }

  const updateDisputeStatus = (disputeId: string, newStatus: Dispute['status']) => {
    setDisputes(prev => prev.map(dispute => 
      dispute.id === disputeId 
        ? { ...dispute, status: newStatus, updatedAt: new Date().toISOString() }
        : dispute
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Disputes & Chargebacks</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage payment disputes and provide evidence for resolution
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Dispute Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Disputes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{disputeStats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-orange-600" />
          </div>
          <p className="text-sm text-gray-500 mt-2">All time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
              <p className="text-2xl font-bold text-red-600">{disputeStats.open}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Awaiting response</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Under Review</p>
              <p className="text-2xl font-bold text-yellow-600">{disputeStats.underReview}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">In progress</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{disputeStats.resolved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Completed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
              <p className="text-2xl font-bold text-blue-600">{disputeStats.winRate}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Last 30 days</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Resolution</p>
              <p className="text-2xl font-bold text-purple-600">{disputeStats.avgResolutionTime}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Time to resolve</p>
        </motion.div>
      </div>

      {/* Dispute Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Disputes</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage and respond to payment disputes</p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search disputes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="unauthorized">Unauthorized</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                  <SelectItem value="fraud">Fraud</SelectItem>
                  <SelectItem value="product_not_received">Not Received</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredDisputes.map((dispute) => (
            <motion.div
              key={dispute.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(dispute.category)}
                      <Badge variant="outline" className="text-xs">
                        {dispute.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(dispute.status)}`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(dispute.status)}
                        <span className="capitalize">{dispute.status.replace('_', ' ')}</span>
                      </div>
                    </Badge>
                    <Badge 
                      variant={dispute.riskScore > 70 ? 'destructive' : dispute.riskScore > 40 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      Risk: {dispute.riskScore}%
                    </Badge>
                    {dispute.evidenceRequired && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        Evidence Required
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {dispute.customerName}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({dispute.customerEmail})
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {dispute.amount} {dispute.currency}
                        </span>
                        <span className="text-sm text-gray-500">
                          • {dispute.transactionId}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Created: {new Date(dispute.createdAt).toLocaleDateString()}
                        </span>
                        {dispute.evidenceDeadline && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-orange-600">
                              Evidence due: {new Date(dispute.evidenceDeadline).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Reason:</strong> {dispute.reason}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{dispute.responseCount} responses</span>
                        <span>Updated: {new Date(dispute.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDispute(dispute)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>

                  {dispute.evidenceRequired && dispute.status === 'open' && (
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={() => {
                        setSelectedDispute(dispute)
                        setIsEvidenceModalOpen(true)
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Evidence
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {dispute.status === 'open' && (
                        <DropdownMenuItem onClick={() => updateDisputeStatus(dispute.id, 'under_review')}>
                          Mark Under Review
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>Download Details</DropdownMenuItem>
                      <DropdownMenuItem>Contact Customer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredDisputes.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No disputes found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Try adjusting your search filters' 
                  : 'Great! You have no active disputes.'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Evidence Upload Modal */}
      <Dialog open={isEvidenceModalOpen} onOpenChange={setIsEvidenceModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Evidence for Dispute</DialogTitle>
            <DialogDescription>
              Provide evidence to support your case for dispute {selectedDispute?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Evidence Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">Transaction Receipt</SelectItem>
                    <SelectItem value="communication">Customer Communication</SelectItem>
                    <SelectItem value="shipping">Shipping Proof</SelectItem>
                    <SelectItem value="refund">Refund Documentation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>File Upload</Label>
                <Input type="file" accept=".pdf,.jpg,.png,.doc,.docx" />
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe this evidence and how it supports your case..."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEvidenceModalOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700">
                Submit Evidence
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}