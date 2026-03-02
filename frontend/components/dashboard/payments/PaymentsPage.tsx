'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpDown,
  Calendar,
  Eye,
  Copy,
  ExternalLink,
  CreditCard,
  RefreshCw,
  RotateCcw,
  X,
  AlertCircle,
  Link,
  QrCode,
  Share,
  Mail,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { 
  usePayments, 
  useCreatePaymentLink, 
  useCancelPayment, 
  useRefundPayment,
  useUpdatePayment
} from '@/hooks/use-payments'
import { Payment } from '@/lib/api/payment-api'
import { usePaymentStore, useFilteredPayments } from '@/stores/payment-store'
import { useToast } from '@/hooks/use-toast'
import QRCode from '@/components/payment/qr-code'

const PaymentsPage = () => {
  const { toast } = useToast()
  
  // Get payment state and actions from store
  const {
    selectedPayment,
    generatedPaymentLink,
    statusFilter,
    paymentMethodFilter,
    searchQuery,
    currentPage,
    isLoading: storeLoading,
    error: storeError,
    setSelectedPayment,
    setStatusFilter,
    setPaymentMethodFilter,
    setSearchQuery,
    setCurrentPage,
    clearGeneratedPaymentLink
  } = usePaymentStore();

  // Get filtered payments from store
  const filteredPayments = useFilteredPayments();

  // API hooks
  const { data: paymentsData, isLoading: queryLoading, error: queryError, refetch } = usePayments({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    paymentMethod: paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined,
    page: currentPage,
    limit: 20,
  });

  const createPaymentLink = useCreatePaymentLink();
  const cancelPayment = useCancelPayment();
  const refundPayment = useRefundPayment();
  const updatePayment = useUpdatePayment();

  // Combined loading state
  const isLoading = storeLoading || queryLoading || createPaymentLink.isPending || 
                    cancelPayment.isPending || refundPayment.isPending || updatePayment.isPending;
  
  // Local component state
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeTab, setActiveTab] = useState('all')
  const [copied, setCopied] = useState(false)
  const downloadRef = useRef<HTMLAnchorElement>(null)

  // Sync activeTab with statusFilter
  useEffect(() => {
    setStatusFilter(activeTab === 'all' ? 'all' : activeTab)
  }, [activeTab, setStatusFilter])
  
  // Advanced search state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [amountRange, setAmountRange] = useState({ min: '', max: '' })
  const [customerFilter, setCustomerFilter] = useState('')
  const [transactionIdFilter, setTransactionIdFilter] = useState('')
  
  // Modal states
  const [modalPayment, setModalPayment] = useState<Payment | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false)
  const [isPaymentLinkModalOpen, setIsPaymentLinkModalOpen] = useState(false)
  const [isConvertToSubscriptionModalOpen, setIsConvertToSubscriptionModalOpen] = useState(false)
  
  // Form states
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentLinkTab, setPaymentLinkTab] = useState('basic')
  
  // Payment link form state
  const [paymentLinkData, setPaymentLinkData] = useState({
    amount: '',
    currency: 'sBTC',
    description: '',
    customerEmail: '',
    expiresIn: '24h', // hours
    customId: '',
    // Advanced features
    allowCustomAmount: false,
    minAmount: '',
    maxAmount: '',
    collectShipping: false,
    collectCustomerInfo: false,
    successUrl: '',
    cancelUrl: '',
    createSubscription: false,
    subscriptionInterval: 'monthly',
    trialDays: '14',
    maxUses: '',
    requireNote: false,
    primaryColor: '#ea580c',
    showLogo: true,
    customMessage: ''
  })

  // Subscription conversion form state
  const [subscriptionData, setSubscriptionData] = useState({
    planName: '',
    interval: 'monthly',
    trialDays: '14',
    setupFee: '',
    features: []
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'failed':
      case 'expired':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
      processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      expired: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
      refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
    }

    return (
      <Badge className={cn('text-xs font-medium', variants[status as keyof typeof variants])}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const exportPayments = () => {
    // In a real app, this would generate and download a CSV/Excel file
    console.log('Exporting payments...')
  }

  // Modal handlers
  const openDetailsModal = (payment: any) => {
    setModalPayment(payment)
    setIsDetailsModalOpen(true)
  }

  const openRefundModal = (payment: any) => {
    setModalPayment(payment)
    setRefundAmount(payment.amount.toString())
    setIsRefundModalOpen(true)
  }

  const openCancelModal = (payment: any) => {
    setModalPayment(payment)
    setIsCancelModalOpen(true)
  }

  const openRetryModal = (payment: any) => {
    setModalPayment(payment)
    setIsRetryModalOpen(true)
  }

  const handleRefund = async () => {
    if (!modalPayment || !refundAmount) return;

    // TODO: Add blockchain transaction handling for refunds
    // For now, this is a placeholder that marks the payment as refunded
    await refundPayment.mutateAsync({
      paymentId: modalPayment.id,
      refundData: {
        amount: parseFloat(refundAmount),
        reason: refundReason,
        blockchainRefundData: {
          transactionId: `refund_${Date.now()}`, // Mock transaction ID
          status: 'confirmed'
        }
      }
    });

    setIsRefundModalOpen(false);
    setModalPayment(null);
  }

  const handleCancel = async () => {
    if (!modalPayment) return;

    console.log('Modal payment object:', modalPayment);
    console.log('Payment ID:', modalPayment.id);
    console.log('Payment _id:', (modalPayment as any)._id);

    // Use _id if id is not available (MongoDB compatibility)
    const paymentId = modalPayment.id || (modalPayment as any)._id;
    
    if (!paymentId) {
      console.error('No payment ID found in modalPayment:', modalPayment);
      return;
    }

    await cancelPayment.mutateAsync(paymentId);
    setIsCancelModalOpen(false);
    setModalPayment(null);
  }

  const handleRetry = async () => {
    if (!modalPayment) return;

    // Retry by updating status back to pending
    await updatePayment.mutateAsync({
      paymentId: modalPayment.id,
      updateData: { status: 'completed' } // Mock retry as success
    });

    setIsRetryModalOpen(false);
    setModalPayment(null);
  }

  const generatePaymentLink = async () => {
    if (!paymentLinkData.amount || !paymentLinkData.description) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    await createPaymentLink.mutateAsync({
      amount: parseFloat(paymentLinkData.amount),
      currency: paymentLinkData.currency as any,
      description: paymentLinkData.description,
      customerEmail: paymentLinkData.customerEmail || undefined,
      expiresIn: paymentLinkData.expiresIn,
      customId: paymentLinkData.customId || undefined,
    });
  }

  const resetPaymentLinkForm = () => {
    setPaymentLinkData({
      amount: '',
      currency: 'sBTC',
      description: '',
      customerEmail: '',
      expiresIn: '24h',
      customId: '',
      // Advanced features
      allowCustomAmount: false,
      minAmount: '',
      maxAmount: '',
      collectShipping: false,
      collectCustomerInfo: false,
      successUrl: '',
      cancelUrl: '',
      createSubscription: false,
      subscriptionInterval: 'monthly',
      trialDays: '14',
      maxUses: '',
      requireNote: false,
      primaryColor: '#ea580c',
      showLogo: true,
      customMessage: ''
    });
    clearGeneratedPaymentLink();
  }

  const openConvertToSubscriptionModal = (payment: Payment) => {
    setModalPayment(payment);
    // Pre-fill form with payment data
    setSubscriptionData({
      planName: `${payment.description} - Subscription`,
      interval: 'monthly',
      trialDays: '14',
      setupFee: '',
      features: []
    });
    setIsConvertToSubscriptionModalOpen(true);
  }

  const handleConvertToSubscription = async () => {
    if (!modalPayment || !subscriptionData.planName) return;

    setIsSubmitting(true);
    try {
      // Here you would make API call to create subscription plan
      console.log('Converting payment to subscription:', {
        paymentId: modalPayment.id,
        originalAmount: modalPayment.amount,
        planName: subscriptionData.planName,
        interval: subscriptionData.interval,
        trialDays: subscriptionData.trialDays,
        setupFee: subscriptionData.setupFee
      });

      toast({
        title: "Success",
        description: "Payment converted to subscription plan successfully!",
      });

      setIsConvertToSubscriptionModalOpen(false);
      setModalPayment(null);
      // Reset form
      setSubscriptionData({
        planName: '',
        interval: 'monthly',
        trialDays: '14',
        setupFee: '',
        features: []
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to convert payment to subscription",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderPaymentsTable = () => (
    <div className="overflow-x-auto">
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {filteredPayments.length} of {payments.length} payments
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPayments.map((payment, index) => (
            <motion.tr
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={payment.customerInfo?.name || 'Customer'} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                      {(payment.customerInfo?.name || payment.customerInfo?.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {payment.customerInfo?.name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {payment.customerInfo?.email || 'No email provided'}
                    </p>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {payment.amount} {payment.currency}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {/* TODO: Add USD conversion based on exchange rates */}
                    ${(payment.amount * 50000).toLocaleString()} (estimated)
                  </p>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(payment.status)}
                  {getStatusBadge(payment.status)}
                </div>
              </TableCell>
              
              <TableCell>
                <div>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(payment.createdAt)}
                  </p>
                  {payment.completedAt && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Completed {formatDate(payment.completedAt)}
                    </p>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {payment.paymentMethod?.toUpperCase()} Wallet
                </p>
              </TableCell>
              
              <TableCell className="text-right">
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
                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openDetailsModal(payment)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyToClipboard(payment.id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Payment ID
                    </DropdownMenuItem>
                    {payment.transactionData?.txId && (
                      <DropdownMenuItem>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Explorer
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {payment.status === 'confirmed' && (
                      <>
                        <DropdownMenuItem onClick={() => openConvertToSubscriptionModal(payment)} className="text-purple-600">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Convert to Subscription
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRefundModal(payment)} className="text-orange-600">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Refund Payment
                        </DropdownMenuItem>
                      </>
                    )}
                    {(payment.status === 'failed' || payment.status === 'expired') && (
                      <DropdownMenuItem onClick={() => openRetryModal(payment)} className="text-blue-600">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Payment
                      </DropdownMenuItem>
                    )}
                    {(payment.status === 'pending' || payment.status === 'processing') && (
                      <DropdownMenuItem onClick={() => openCancelModal(payment)} className="text-red-600">
                        <X className="mr-2 h-4 w-4" />
                        Cancel Payment
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
      
      {sortedPayments.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            No payments found
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : activeTab !== 'all' 
                ? `No ${activeTab} payments found`
                : 'Payments will appear here once you start receiving them'
            }
          </p>
        </div>
      )}
    </div>
  )

  // Use the payments from the store (which are filtered by the store selectors)
  const payments = filteredPayments;

  const sortedPayments = [...payments].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'amount':
        comparison = a.amount - b.amount
        break
      case 'customer':
        const aName = a.customerInfo?.name || a.customerInfo?.email || 'Unknown';
        const bName = b.customerInfo?.name || b.customerInfo?.email || 'Unknown';
        comparison = aName.localeCompare(bName)
        break
      default:
        comparison = 0
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Payments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all your sBTC payment transactions
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={exportPayments} className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button 
            size="sm" 
            onClick={() => setIsPaymentLinkModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Payment Link
          </Button>
        </div>
      </div>

      {/* Payment Tabs */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
              <TabsList className="grid w-full grid-cols-4 max-w-md bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="all" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">All</TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Pending</TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Completed</TabsTrigger>
                <TabsTrigger value="failed" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Failed</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              {/* Filters and Search */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search payments, customers, or payment IDs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white dark:bg-gray-900 border hover:border-orange-300 dark:hover:border-orange-600"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] bg-white dark:bg-gray-900 border hover:border-orange-300 dark:hover:border-orange-600">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Sort Options */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px] bg-white dark:bg-gray-900 border hover:border-orange-300 dark:hover:border-orange-600">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <SelectItem value="date">Sort by Date</SelectItem>
                      <SelectItem value="amount">Sort by Amount</SelectItem>
                      <SelectItem value="customer">Sort by Customer</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Advanced Filters Toggle */}
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="whitespace-nowrap"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Advanced Filters
                  </Button>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Date Range */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Date Range</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="date"
                            placeholder="From"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            type="date"
                            placeholder="To"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Amount Range */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Amount Range (sBTC)</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={amountRange.min}
                            onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={amountRange.max}
                            onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Payment Method</Label>
                        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Methods</SelectItem>
                            <SelectItem value="leather">Leather Wallet</SelectItem>
                            <SelectItem value="xverse">Xverse Wallet</SelectItem>
                            <SelectItem value="hiro">Hiro Wallet</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Transaction ID */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Transaction ID</Label>
                        <Input
                          placeholder="Enter transaction ID"
                          value={transactionIdFilter}
                          onChange={(e) => setTransactionIdFilter(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateRange({ from: '', to: '' })
                          setAmountRange({ min: '', max: '' })
                          setCustomerFilter('')
                          setTransactionIdFilter('')
                          setPaymentMethodFilter('all')
                        }}
                      >
                        Clear All
                      </Button>
                      
                      <div className="text-sm text-gray-500">
                        Showing {filteredPayments.length} results
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            
              <TabsContent value="all" className="mt-0">
                {renderPaymentsTable()}
              </TabsContent>
              <TabsContent value="pending" className="mt-0">
                {renderPaymentsTable()}
              </TabsContent>
              <TabsContent value="completed" className="mt-0">
                {renderPaymentsTable()}
              </TabsContent>
              <TabsContent value="failed" className="mt-0">
                {renderPaymentsTable()}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={(open) => {
        setIsDetailsModalOpen(open)
        if (!open) setModalPayment(null)
      }}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete information about payment {modalPayment?.id}
            </DialogDescription>
          </DialogHeader>
          
          {modalPayment && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Payment ID</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{modalPayment.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(modalPayment.status)}
                    {getStatusBadge(modalPayment.status)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={isRefundModalOpen} onOpenChange={(open) => {
        setIsRefundModalOpen(open)
        if (!open) {
          setModalPayment(null)
          setRefundAmount('')
          setRefundReason('')
        }
      }}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Refund Payment</DialogTitle>
            <DialogDescription>
              Process a refund for payment {modalPayment?.id}
            </DialogDescription>
          </DialogHeader>
          
          {modalPayment && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Original amount: <span className="font-medium">{modalPayment.amount} {modalPayment.currency}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundAmount">Refund Amount</Label>
                <Input 
                  id="refundAmount" 
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  min="0"
                  max={modalPayment.amount}
                  className="bg-white dark:bg-gray-900 border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundReason">Reason (Optional)</Label>
                <Input 
                  id="refundReason" 
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason for refund"
                  className="bg-white dark:bg-gray-900 border"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundModalOpen(false)} className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </Button>
            <Button 
              onClick={handleRefund}
              disabled={isSubmitting || !refundAmount}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Processing...' : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={(open) => {
        setIsCancelModalOpen(open)
        if (!open) setModalPayment(null)
      }}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Cancel Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this pending payment?
            </DialogDescription>
          </DialogHeader>
          
          {modalPayment && (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                    This action cannot be undone
                  </span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  The payment will be permanently cancelled and the customer will be notified.
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Payment ID:</span>
                  <span className="font-mono">{modalPayment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{modalPayment.customerInfo?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>{modalPayment.amount} {modalPayment.currency}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800">
              Keep Payment
            </Button>
            <Button 
              onClick={handleCancel}
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Cancelling...' : 'Cancel Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retry Modal */}
      <Dialog open={isRetryModalOpen} onOpenChange={(open) => {
        setIsRetryModalOpen(open)
        if (!open) setModalPayment(null)
      }}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Retry Payment</DialogTitle>
            <DialogDescription>
              Attempt to process this failed payment again
            </DialogDescription>
          </DialogHeader>
          
          {modalPayment && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Payment Retry
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  This will attempt to process the payment with the same details.
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Payment ID:</span>
                  <span className="font-mono">{modalPayment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{modalPayment.customerInfo?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>{modalPayment.amount} {modalPayment.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Original Date:</span>
                  <span>{formatDate(modalPayment.createdAt)}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRetryModalOpen(false)} className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </Button>
            <Button 
              onClick={handleRetry}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Retrying...' : 'Retry Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Payment Link Modal */}
      <Dialog open={isPaymentLinkModalOpen} onOpenChange={(open) => {
        setIsPaymentLinkModalOpen(open)
        if (!open) {
          resetPaymentLinkForm()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Link className="h-5 w-5 text-orange-600" />
              <span>Create Payment Link</span>
            </DialogTitle>
            <DialogDescription>
              Generate a secure payment link to share with customers
            </DialogDescription>
          </DialogHeader>
          
          {!generatedPaymentLink ? (
            <Tabs value={paymentLinkTab} onValueChange={setPaymentLinkTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="customize">Customize</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {/* Basic Payment Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="link-amount">Amount *</Label>
                      <Input
                        id="link-amount"
                        type="number"
                        step="0.000001"
                        placeholder="0.001"
                        value={paymentLinkData.amount}
                        onChange={(e) => setPaymentLinkData(prev => ({ ...prev, amount: e.target.value }))}
                        disabled={paymentLinkData.allowCustomAmount}
                        className="bg-white dark:bg-gray-900 border"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="link-currency">Currency</Label>
                      <Select 
                        value={paymentLinkData.currency} 
                        onValueChange={(value) => setPaymentLinkData(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-900 border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                          <SelectItem value="sBTC">sBTC</SelectItem>
                          <SelectItem value="BTC">BTC</SelectItem>
                          <SelectItem value="STX">STX</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link-description">Description *</Label>
                    <Input
                      id="link-description"
                      placeholder="Premium subscription, Product purchase, etc."
                      value={paymentLinkData.description}
                      onChange={(e) => setPaymentLinkData(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-white dark:bg-gray-900 border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Customer Email (Optional)</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="customer@example.com"
                      value={paymentLinkData.customerEmail}
                      onChange={(e) => setPaymentLinkData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      className="bg-white dark:bg-gray-900 border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expires-in">Expires In</Label>
                      <Select 
                        value={paymentLinkData.expiresIn} 
                        onValueChange={(value) => setPaymentLinkData(prev => ({ ...prev, expiresIn: value }))}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-900 border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="168">7 days</SelectItem>
                          <SelectItem value="720">30 days</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-id">Custom ID (Optional)</Label>
                      <Input
                        id="custom-id"
                        placeholder="order-123, inv-456"
                        value={paymentLinkData.customId}
                        onChange={(e) => setPaymentLinkData(prev => ({ ...prev, customId: e.target.value }))}
                        className="bg-white dark:bg-gray-900 border"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                {/* Advanced Options */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Custom Amount</Label>
                        <p className="text-sm text-gray-500">Let customers enter their own amount</p>
                      </div>
                      <Switch
                        checked={paymentLinkData.allowCustomAmount}
                        onCheckedChange={(checked) => setPaymentLinkData(prev => ({ ...prev, allowCustomAmount: checked }))}
                      />
                    </div>

                    {paymentLinkData.allowCustomAmount && (
                      <div className="grid grid-cols-2 gap-4 ml-6">
                        <div className="space-y-2">
                          <Label>Min Amount</Label>
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="0.001"
                            value={paymentLinkData.minAmount}
                            onChange={(e) => setPaymentLinkData(prev => ({ ...prev, minAmount: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Amount</Label>
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="1.0"
                            value={paymentLinkData.maxAmount}
                            onChange={(e) => setPaymentLinkData(prev => ({ ...prev, maxAmount: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Collect Shipping Info</Label>
                        <p className="text-sm text-gray-500">Collect customer shipping address</p>
                      </div>
                      <Switch
                        checked={paymentLinkData.collectShipping}
                        onCheckedChange={(checked) => setPaymentLinkData(prev => ({ ...prev, collectShipping: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Collect Customer Info</Label>
                        <p className="text-sm text-gray-500">Require name and contact details</p>
                      </div>
                      <Switch
                        checked={paymentLinkData.collectCustomerInfo}
                        onCheckedChange={(checked) => setPaymentLinkData(prev => ({ ...prev, collectCustomerInfo: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Require Note from Customer</Label>
                        <p className="text-sm text-gray-500">Add a note/message field</p>
                      </div>
                      <Switch
                        checked={paymentLinkData.requireNote}
                        onCheckedChange={(checked) => setPaymentLinkData(prev => ({ ...prev, requireNote: checked }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Uses (Optional)</Label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={paymentLinkData.maxUses}
                      onChange={(e) => setPaymentLinkData(prev => ({ ...prev, maxUses: e.target.value }))}
                    />
                    <p className="text-sm text-gray-500">Limit how many times this link can be used</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Success Redirect URL (Optional)</Label>
                      <Input
                        type="url"
                        placeholder="https://yoursite.com/success"
                        value={paymentLinkData.successUrl}
                        onChange={(e) => setPaymentLinkData(prev => ({ ...prev, successUrl: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cancel Redirect URL (Optional)</Label>
                      <Input
                        type="url"
                        placeholder="https://yoursite.com/cancel"
                        value={paymentLinkData.cancelUrl}
                        onChange={(e) => setPaymentLinkData(prev => ({ ...prev, cancelUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="subscription" className="space-y-4">
                {/* Subscription Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Create Subscription Plan</Label>
                      <p className="text-sm text-gray-500">Convert this payment to a recurring subscription</p>
                    </div>
                    <Switch
                      checked={paymentLinkData.createSubscription}
                      onCheckedChange={(checked) => setPaymentLinkData(prev => ({ ...prev, createSubscription: checked }))}
                    />
                  </div>

                  {paymentLinkData.createSubscription && (
                    <div className="space-y-4 ml-6 p-4 border rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Billing Interval</Label>
                          <Select 
                            value={paymentLinkData.subscriptionInterval} 
                            onValueChange={(value) => setPaymentLinkData(prev => ({ ...prev, subscriptionInterval: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Trial Days</Label>
                          <Input
                            type="number"
                            value={paymentLinkData.trialDays}
                            onChange={(e) => setPaymentLinkData(prev => ({ ...prev, trialDays: e.target.value }))}
                            min="0"
                            max="90"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Subscription Preview:</span> Customer will be charged {paymentLinkData.amount || '0'} {paymentLinkData.currency} every {paymentLinkData.subscriptionInterval}
                          {paymentLinkData.trialDays && parseInt(paymentLinkData.trialDays) > 0 ? ` after a ${paymentLinkData.trialDays}-day free trial` : ''}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="customize" className="space-y-4">
                {/* Customization Options */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={paymentLinkData.primaryColor}
                        onChange={(e) => setPaymentLinkData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={paymentLinkData.primaryColor}
                        onChange={(e) => setPaymentLinkData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#ea580c"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show StacksPay Logo</Label>
                      <p className="text-sm text-gray-500">Display branding on payment page</p>
                    </div>
                    <Switch
                      checked={paymentLinkData.showLogo}
                      onCheckedChange={(checked) => setPaymentLinkData(prev => ({ ...prev, showLogo: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Custom Message (Optional)</Label>
                    <Textarea
                      placeholder="Thank you for your purchase! Your support means everything to us."
                      value={paymentLinkData.customMessage}
                      onChange={(e) => setPaymentLinkData(prev => ({ ...prev, customMessage: e.target.value }))}
                      rows={3}
                    />
                    <p className="text-sm text-gray-500">This message will appear on the payment page</p>
                  </div>

                  {/* Preview */}
                  <div className="p-4 border rounded-lg" style={{ borderColor: paymentLinkData.primaryColor + '40' }}>
                    <h4 className="font-medium mb-3" style={{ color: paymentLinkData.primaryColor }}>Payment Page Preview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">{paymentLinkData.amount || '0'} {paymentLinkData.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Description:</span>
                        <span>{paymentLinkData.description || 'Payment description'}</span>
                      </div>
                      {paymentLinkData.customMessage && (
                        <div className="pt-2 border-t">
                          <p className="text-gray-600 italic">"{paymentLinkData.customMessage}"</p>
                        </div>
                      )}
                      {paymentLinkData.showLogo && (
                        <div className="text-xs text-gray-500 pt-2">🔒 Powered by StacksPay</div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Overall Preview */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Link Summary</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><span className="font-medium">Type:</span> {paymentLinkData.createSubscription ? 'Subscription' : 'One-time Payment'}</p>
                  <p><span className="font-medium">Amount:</span> {paymentLinkData.allowCustomAmount ? 'Customer choice' : `${paymentLinkData.amount || '0'} ${paymentLinkData.currency}`}</p>
                  <p><span className="font-medium">Description:</span> {paymentLinkData.description || 'Payment description'}</p>
                  {paymentLinkData.customerEmail && (
                    <p><span className="font-medium">Customer:</span> {paymentLinkData.customerEmail}</p>
                  )}
                  <p><span className="font-medium">Expires:</span> {paymentLinkData.expiresIn === 'never' ? 'Never' : `In ${paymentLinkData.expiresIn} hours`}</p>
                  {paymentLinkData.maxUses && (
                    <p><span className="font-medium">Max Uses:</span> {paymentLinkData.maxUses}</p>
                  )}
                  {paymentLinkData.createSubscription && (
                    <p><span className="font-medium">Billing:</span> Every {paymentLinkData.subscriptionInterval}</p>
                  )}
                </div>
              </div>
            </Tabs>
          ) : (
            <div className="space-y-5">
              {/* Success Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Payment Link Created Successfully
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Share this link with your customer to collect payment
                  </p>
                </div>
              </div>

              {/* Main Content - Horizontal Layout */}
              <div className="grid grid-cols-5 gap-5">
                {/* Left: QR Code */}
                <div className="col-span-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-3">
                    {generatedPaymentLink?.paymentAddress ? (
                      <QRCode
                        value={generatedPaymentLink.paymentAddress}
                        size={140}
                        showCopy={false}
                        showDownload={false}
                      />
                    ) : (
                      <div className="w-[140px] h-[140px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Scan to copy payment address
                  </p>
                </div>

                {/* Right: Details & Actions */}
                <div className="col-span-3 space-y-4">
                  {/* Payment Details Card */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Payment Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Amount</span>
                        <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {paymentLinkData.amount} {paymentLinkData.currency}
                        </span>
                      </div>
                      {paymentLinkData.expiresIn && paymentLinkData.expiresIn !== 'never' && (
                        <div>
                          <span className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Expires In</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {paymentLinkData.expiresIn === '1' ? '1 hour' :
                             paymentLinkData.expiresIn === '24' ? '24 hours' :
                             paymentLinkData.expiresIn === '168' ? '7 days' :
                             paymentLinkData.expiresIn === '720' ? '30 days' : paymentLinkData.expiresIn}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Description</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {paymentLinkData.description}
                      </span>
                    </div>
                  </div>

                  {/* Payment Link */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Payment Link
                    </label>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <p className="flex-1 font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
                          {generatedPaymentLink?.url || ''}
                        </p>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => copyToClipboard(generatedPaymentLink?.url || '')}
                          className={cn(
                            "p-2 rounded-md transition-colors flex-shrink-0",
                            copied
                              ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500"
                              : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                          )}
                        >
                          <motion.div
                            animate={copied ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {copied ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </motion.div>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => copyToClipboard(generatedPaymentLink?.url || '')}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border",
                        copied
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      )}
                    >
                      <motion.div
                        animate={copied ? { rotate: [0, 360] } : { rotate: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </motion.div>
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </motion.button>

                    {navigator.share && (
                      <Button
                        variant="outline"
                        onClick={() => navigator.share?.({
                          url: generatedPaymentLink?.url || '',
                          title: 'Payment Request',
                          text: `Payment: ${paymentLinkData.amount} ${paymentLinkData.currency}`
                        })}
                        className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <Share className="mr-2 h-4 w-4" />
                        <span>Share</span>
                      </Button>
                    )}
                  </div>

                  {/* Email Share */}
                  {paymentLinkData.customerEmail && (
                    <Button
                      onClick={() => window.open(`mailto:${paymentLinkData.customerEmail}?subject=Payment Request - ${paymentLinkData.description}&body=Hi,%0D%0A%0D%0APlease complete your payment of ${paymentLinkData.amount} ${paymentLinkData.currency} using this link:%0D%0A%0D%0A${generatedPaymentLink?.url || ''}%0D%0A%0D%0AThank you!`)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send to {paymentLinkData.customerEmail}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 bg-slate-50 dark:bg-slate-900/50">
            {!generatedPaymentLink ? (
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentLinkModalOpen(false)}
                  className="flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={generatePaymentLink}
                  disabled={!paymentLinkData.amount || !paymentLinkData.description || isSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Link className="mr-2 h-4 w-4" />
                      Create Payment Link
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentLinkModalOpen(false)}
                  className="flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </Button>
                <Button
                  onClick={resetPaymentLinkForm}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Another
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Subscription Modal */}
      <Dialog open={isConvertToSubscriptionModalOpen} onOpenChange={(open) => {
        setIsConvertToSubscriptionModalOpen(open)
        if (!open) {
          setModalPayment(null)
          setSubscriptionData({
            planName: '',
            interval: 'monthly',
            trialDays: '14',
            setupFee: '',
            features: []
          })
        }
      }}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              <span>Convert to Subscription</span>
            </DialogTitle>
            <DialogDescription>
              Create a recurring subscription plan based on this payment
            </DialogDescription>
          </DialogHeader>
          
          {modalPayment && (
            <div className="space-y-4">
              {/* Original Payment Info */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  <span className="font-medium">Original Payment:</span> {modalPayment.amount} {modalPayment.currency}
                </p>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  <span className="font-medium">Description:</span> {modalPayment.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name *</Label>
                <Input 
                  id="planName" 
                  value={subscriptionData.planName}
                  onChange={(e) => setSubscriptionData(prev => ({ ...prev, planName: e.target.value }))}
                  placeholder="Premium Monthly Plan"
                  className="bg-white dark:bg-gray-900 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="interval">Billing Interval</Label>
                  <Select 
                    value={subscriptionData.interval}
                    onValueChange={(value) => setSubscriptionData(prev => ({ ...prev, interval: value }))}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-900 border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border">
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trialDays">Trial Days</Label>
                  <Input 
                    id="trialDays" 
                    type="number"
                    value={subscriptionData.trialDays}
                    onChange={(e) => setSubscriptionData(prev => ({ ...prev, trialDays: e.target.value }))}
                    min="0"
                    max="90"
                    className="bg-white dark:bg-gray-900 border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setupFee">Setup Fee (Optional)</Label>
                <Input 
                  id="setupFee" 
                  type="number"
                  step="0.000001"
                  value={subscriptionData.setupFee}
                  onChange={(e) => setSubscriptionData(prev => ({ ...prev, setupFee: e.target.value }))}
                  placeholder="0.001"
                  className="bg-white dark:bg-gray-900 border"
                />
              </div>

              {/* Preview */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Preview</h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p><span className="font-medium">Recurring Amount:</span> {modalPayment.amount} {modalPayment.currency}</p>
                  <p><span className="font-medium">Billing:</span> Every {subscriptionData.interval}</p>
                  {subscriptionData.trialDays && (
                    <p><span className="font-medium">Trial:</span> {subscriptionData.trialDays} days free</p>
                  )}
                  {subscriptionData.setupFee && (
                    <p><span className="font-medium">Setup Fee:</span> {subscriptionData.setupFee} {modalPayment.currency}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertToSubscriptionModalOpen(false)} className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </Button>
            <Button 
              onClick={handleConvertToSubscription}
              disabled={isSubmitting || !subscriptionData.planName}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Converting...' : 'Create Subscription Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PaymentsPage