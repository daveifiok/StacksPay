'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search,
  Filter,
  Download,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  Edit3,
  Trash2,
  MoreHorizontal,
  Eye,
  CreditCard,
  Activity,
  Star,
  Users,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Customer {
  id: string
  name: string
  email: string
  avatar?: string
  totalSpent: number
  totalOrders: number
  lastOrderDate: string
  status: 'active' | 'inactive' | 'blocked'
  location: string
  joinDate: string
  phone?: string
  tags: string[]
}

const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('totalSpent')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [showDeleteCustomer, setShowDeleteCustomer] = useState(false)
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [showSendMessage, setShowSendMessage] = useState(false)
  const [customerToMessage, setCustomerToMessage] = useState<Customer | null>(null)
  const [messageData, setMessageData] = useState({
    subject: '',
    message: ''
  })
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    tags: '',
    notes: ''
  })

  // Mock data
  const customers: Customer[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      totalSpent: 2450.00,
      totalOrders: 12,
      lastOrderDate: '2024-01-15',
      status: 'active',
      location: 'San Francisco, CA',
      joinDate: '2023-08-15',
      phone: '+1 (555) 123-4567',
      tags: ['VIP', 'Frequent Buyer']
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael@example.com',
      totalSpent: 1890.50,
      totalOrders: 8,
      lastOrderDate: '2024-01-12',
      status: 'active',
      location: 'New York, NY',
      joinDate: '2023-10-22',
      tags: ['Enterprise']
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily@example.com',
      totalSpent: 750.25,
      totalOrders: 5,
      lastOrderDate: '2024-01-08',
      status: 'inactive',
      location: 'Austin, TX',
      joinDate: '2023-12-01',
      tags: ['New Customer']
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david@example.com',
      totalSpent: 3200.00,
      totalOrders: 18,
      lastOrderDate: '2024-01-14',
      status: 'active',
      location: 'Seattle, WA',
      joinDate: '2023-06-10',
      phone: '+1 (555) 987-6543',
      tags: ['VIP', 'Long-term']
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      email: 'lisa@example.com',
      totalSpent: 480.75,
      totalOrders: 3,
      lastOrderDate: '2023-12-20',
      status: 'blocked',
      location: 'Miami, FL',
      joinDate: '2023-11-15',
      tags: ['Risk']
    }
  ]

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    switch (sortBy) {
      case 'totalSpent':
        return b.totalSpent - a.totalSpent
      case 'totalOrders':
        return b.totalOrders - a.totalOrders
      case 'joinDate':
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
      default:
        return a.name.localeCompare(b.name)
    }
  })

  const getStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">Active</Badge>
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">Inactive</Badge>
      case 'blocked':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300">Blocked</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer)
    setNewCustomerData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      location: customer.location,
      tags: customer.tags.join(', '),
      notes: ''
    })
    setShowEditCustomer(true)
  }

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer)
    setShowDeleteCustomer(true)
  }

  const resetAddCustomerForm = () => {
    setNewCustomerData({
      name: '',
      email: '',
      phone: '',
      location: '',
      tags: '',
      notes: ''
    })
  }

  const handleAddCustomer = () => {
    // Here you would typically call an API to create the customer
    console.log('Adding customer:', newCustomerData)
    setShowAddCustomer(false)
    resetAddCustomerForm()
  }

  const handleUpdateCustomer = () => {
    // Here you would typically call an API to update the customer
    console.log('Updating customer:', customerToEdit?.id, newCustomerData)
    setShowEditCustomer(false)
    setCustomerToEdit(null)
  }

  const confirmDeleteCustomer = () => {
    // Here you would typically call an API to delete the customer
    console.log('Deleting customer:', customerToDelete?.id)
    setShowDeleteCustomer(false)
    setCustomerToDelete(null)
  }

  const handleSendMessage = (customer: Customer) => {
    setCustomerToMessage(customer)
    setMessageData({
      subject: '',
      message: ''
    })
    setShowSendMessage(true)
  }

  const sendMessage = () => {
    // Here you would typically call an API to send the message
    console.log('Sending message to:', customerToMessage?.email, messageData)
    setShowSendMessage(false)
    setCustomerToMessage(null)
    setMessageData({ subject: '', message: '' })
  }

  // Calculate stats
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const averageOrderValue = totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Customers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your customer relationships and data
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button 
            onClick={() => setShowAddCustomer(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Customers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {totalCustomers}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Customers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {activeCustomers}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg. Order Value
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(averageOrderValue)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-[300px]"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalSpent">Total Spent</SelectItem>
                  <SelectItem value="totalOrders">Total Orders</SelectItem>
                  <SelectItem value="joinDate">Join Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-orange-600" />
            <span>Customer List</span>
          </CardTitle>
          <CardDescription>
            Showing {filteredCustomers.length} of {totalCustomers} customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={customer.avatar} alt={customer.name} />
                          <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                            {customer.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {customer.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {customer.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {customer.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(customer.status)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell>
                      {customer.totalOrders}
                    </TableCell>
                    <TableCell>
                      {formatDate(customer.lastOrderDate)}
                    </TableCell>
                    <TableCell>
                      {formatDate(customer.joinDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendMessage(customer)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleDeleteCustomer(customer)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View and manage customer information
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedCustomer.avatar} alt={selectedCustomer.name} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 text-xl">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedCustomer.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {selectedCustomer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedCustomer.phone || 'Not provided'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedCustomer.location}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Total Spent</Label>
                  <p className="text-sm font-semibold">
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Total Orders</Label>
                  <p className="text-sm font-semibold">
                    {selectedCustomer.totalOrders}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Join Date</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(selectedCustomer.joinDate)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Order</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(selectedCustomer.lastOrderDate)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedCustomer(null)
                    handleSendMessage(selectedCustomer!)
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
                  onClick={() => {
                    setSelectedCustomer(null)
                    handleEditCustomer(selectedCustomer!)
                  }}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Customer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      <Dialog open={showAddCustomer} onOpenChange={(open) => {
        setShowAddCustomer(open)
        if (!open) resetAddCustomerForm()
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl bg-white dark:bg-gray-900">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-orange-600" />
              <span>Add New Customer</span>
            </DialogTitle>
            <DialogDescription>
              Create a new customer record in your sBTC payment gateway
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <User className="h-4 w-4 text-orange-600" />
                <span>Personal Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input 
                    id="customerName" 
                    placeholder="John Doe" 
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email Address *</Label>
                  <Input 
                    id="customerEmail" 
                    type="email" 
                    placeholder="john@example.com"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Phone className="h-4 w-4 text-orange-600" />
                <span>Contact Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input 
                    id="customerPhone" 
                    type="tel" 
                    placeholder="+1 (555) 123-4567"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerLocation">Location</Label>
                  <Input 
                    id="customerLocation" 
                    placeholder="San Francisco, CA"
                    value={newCustomerData.location}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Star className="h-4 w-4 text-orange-600" />
                <span>Additional Details</span>
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="customerTags">Customer Tags</Label>
                <Input 
                  id="customerTags" 
                  placeholder="VIP, Enterprise, New Customer (comma separated)"
                  value={newCustomerData.tags}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerNotes">Notes</Label>
                <Textarea 
                  id="customerNotes" 
                  placeholder="Additional notes about the customer, preferences, or special requirements"
                  rows={3}
                  value={newCustomerData.notes}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowAddCustomer(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddCustomer}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={showEditCustomer} onOpenChange={setShowEditCustomer}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl bg-white dark:bg-gray-900">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center space-x-2">
              <Edit3 className="h-5 w-5 text-orange-600" />
              <span>Edit Customer</span>
            </DialogTitle>
            <DialogDescription>
              Update customer information and details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <User className="h-4 w-4 text-orange-600" />
                <span>Personal Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCustomerName">Full Name *</Label>
                  <Input 
                    id="editCustomerName" 
                    placeholder="John Doe" 
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCustomerEmail">Email Address *</Label>
                  <Input 
                    id="editCustomerEmail" 
                    type="email" 
                    placeholder="john@example.com"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Phone className="h-4 w-4 text-orange-600" />
                <span>Contact Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCustomerPhone">Phone Number</Label>
                  <Input 
                    id="editCustomerPhone" 
                    type="tel" 
                    placeholder="+1 (555) 123-4567"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCustomerLocation">Location</Label>
                  <Input 
                    id="editCustomerLocation" 
                    placeholder="San Francisco, CA"
                    value={newCustomerData.location}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Star className="h-4 w-4 text-orange-600" />
                <span>Additional Details</span>
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="editCustomerTags">Customer Tags</Label>
                <Input 
                  id="editCustomerTags" 
                  placeholder="VIP, Enterprise, New Customer (comma separated)"
                  value={newCustomerData.tags}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editCustomerNotes">Notes</Label>
                <Textarea 
                  id="editCustomerNotes" 
                  placeholder="Additional notes about the customer, preferences, or special requirements"
                  rows={3}
                  value={newCustomerData.notes}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowEditCustomer(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCustomer}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700 w-full sm:w-auto"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Update Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation Modal */}
      <Dialog open={showDeleteCustomer} onOpenChange={setShowDeleteCustomer}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Delete Customer</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {customerToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={customerToDelete.avatar} alt={customerToDelete.name} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                    {customerToDelete.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {customerToDelete.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {customerToDelete.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Total Spent:</span>
                  <span className="font-medium ml-1">{formatCurrency(customerToDelete.totalSpent)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Orders:</span>
                  <span className="font-medium ml-1">{customerToDelete.totalOrders}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteCustomer(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteCustomer}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Modal */}
      <Dialog open={showSendMessage} onOpenChange={setShowSendMessage}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-orange-600" />
              <span>Send Email</span>
            </DialogTitle>
            <DialogDescription>
              Send an email message to the customer
            </DialogDescription>
          </DialogHeader>

          {customerToMessage && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={customerToMessage.avatar} alt={customerToMessage.name} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                    {customerToMessage.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {customerToMessage.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {customerToMessage.email}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="messageSubject">Subject *</Label>
              <Input 
                id="messageSubject" 
                placeholder="Enter email subject"
                value={messageData.subject}
                onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="messageBody">Message *</Label>
              <Textarea 
                id="messageBody" 
                placeholder="Enter your message here..."
                rows={6}
                value={messageData.message}
                onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                required
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowSendMessage(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={sendMessage}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700 w-full sm:w-auto"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomersPage
