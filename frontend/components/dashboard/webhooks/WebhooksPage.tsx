'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus,
  Webhook,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Edit3,
  Trash2,
  Copy,
  Eye,
  RefreshCw,
  Activity,
  Clock,
  Shield,
  Zap,
  Code,
  Globe,
  TestTube
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  useWebhooks, 
  useWebhookEvents, 
  useWebhookStats,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useRegenerateWebhookSecret,
  useRetryWebhookEvent
} from '@/hooks/use-webhooks'
import { Webhook as WebhookType, WebhookEvent } from '@/lib/api/webhook-api'

const availableEvents = [
  'payment.succeeded',
  'payment.failed',
  'payment.refunded',
  'payment.disputed',
  'customer.created',
  'customer.updated',
  'subscription.created',
  'subscription.updated',
  'subscription.cancelled'
]

const WebhooksPage = () => {
  const [showAddWebhook, setShowAddWebhook] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookType | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null)
  const [activeTab, setActiveTab] = useState('endpoints')
  const [webhookData, setWebhookData] = useState({
    url: '',
    description: '',
    events: [] as string[],
    isActive: true
  })
  const [testResult, setTestResult] = useState<{status: number, message: string} | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // API hooks
  const { data: webhooksData, isLoading: isLoadingWebhooks } = useWebhooks()
  const { data: webhookEventsData, isLoading: isLoadingEvents } = useWebhookEvents()
  const { data: webhookStats } = useWebhookStats()
  const createWebhookMutation = useCreateWebhook()
  const updateWebhookMutation = useUpdateWebhook()
  const deleteWebhookMutation = useDeleteWebhook()
  const testWebhookMutation = useTestWebhook()
  const regenerateSecretMutation = useRegenerateWebhookSecret()
  const retryEventMutation = useRetryWebhookEvent()

  const webhookEndpoints = webhooksData?.webhooks || []
  const webhookEvents = webhookEventsData?.events || []

  // Calculate stats from real data
  const activeEndpoints = webhookStats?.activeWebhooks || 0
  const totalEvents = webhookStats?.totalEvents || 0
  const successfulEvents = webhookStats?.successfulEvents || 0
  const failedEvents = webhookStats?.failedEvents || 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300">Inactive</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300">Failed</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getEventStatusIcon = (status: WebhookEvent['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Handler functions
  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await createWebhookMutation.mutateAsync({
        url: webhookData.url,
        description: webhookData.description,
        events: webhookData.events,
        isActive: webhookData.isActive
      })
      
      setShowAddWebhook(false)
      setWebhookData({ url: '', description: '', events: [], isActive: true })
    } catch (error) {
      console.error('Failed to create webhook:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditWebhook = (webhook: WebhookType) => {
    setSelectedWebhook(webhook)
    setWebhookData({
      url: webhook.url,
      description: webhook.description || '',
      events: webhook.events,
      isActive: webhook.status === 'active'
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWebhook) return
    
    setIsSubmitting(true)
    
    try {
      await updateWebhookMutation.mutateAsync({
        webhookId: selectedWebhook.id,
        updateData: {
          url: webhookData.url,
          description: webhookData.description,
          events: webhookData.events,
          isActive: webhookData.isActive
        }
      })
      
      setIsEditDialogOpen(false)
      setSelectedWebhook(null)
      setWebhookData({ url: '', description: '', events: [], isActive: true })
    } catch (error) {
      console.error('Failed to update webhook:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return
    
    try {
      await deleteWebhookMutation.mutateAsync(selectedWebhook.id)
      setIsDeleteDialogOpen(false)
      setSelectedWebhook(null)
    } catch (error) {
      console.error('Failed to delete webhook:', error)
    }
  }

  const handleTestWebhook = async () => {
    if (!selectedWebhook) return
    
    setIsSubmitting(true)
    
    try {
      const result = await testWebhookMutation.mutateAsync({
        webhookId: selectedWebhook.id,
        eventType: 'test.webhook'
      })
      
      setTestResult({
        status: result.status || 200,
        message: result.response || 'Test successful'
      })
    } catch (error: any) {
      setTestResult({
        status: error.status || 500,
        message: error.message || 'Test failed'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegenerateSecret = async (webhookId: string) => {
    try {
      await regenerateSecretMutation.mutateAsync(webhookId)
    } catch (error) {
      console.error('Failed to regenerate secret:', error)
    }
  }

  const handleRetryEvent = async (eventId: string) => {
    try {
      await retryEventMutation.mutateAsync(eventId)
    } catch (error) {
      console.error('Failed to retry event:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Webhooks
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage webhook endpoints and monitor delivery events
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800">
            <Code className="mr-2 h-4 w-4" />
            Documentation
          </Button>
          <Button onClick={() => setShowAddWebhook(true)} className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Endpoint
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
                    Active Endpoints
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {activeEndpoints}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Webhook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                    Events Today
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {totalEvents}
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
                    Successful
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {successfulEvents}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
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
                    Failed
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {failedEvents}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle>Webhook Endpoints</CardTitle>
              <CardDescription>
                Manage your webhook endpoints and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Last Delivery</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingWebhooks ? (
                      Array.from({ length: 3 }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : webhookEndpoints.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Webhook className="h-8 w-8 text-gray-400" />
                            <p className="text-gray-500 dark:text-gray-400">No webhook endpoints configured</p>
                            <Button 
                              onClick={() => setShowAddWebhook(true)}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              Add Your First Webhook
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                    webhookEndpoints.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                              {webhook.url}
                            </p>
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">
                              {webhook.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(webhook.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.slice(0, 2).map((event) => (
                              <Badge key={event} variant="secondary" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                            {webhook.events.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{webhook.events.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${webhook.successRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {webhook.successRate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {webhook.lastDelivery ? formatDateTime(webhook.lastDelivery) : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelectedWebhook(webhook)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditWebhook(webhook)}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit Endpoint
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedWebhook(webhook)
                                setIsTestDialogOpen(true)
                              }}>
                                <TestTube className="mr-2 h-4 w-4" />
                                Test Endpoint
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyToClipboard(webhook.secret)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Secret
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600 dark:text-red-400"
                                onClick={() => {
                                  setSelectedWebhook(webhook)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Endpoint
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle>Event Log</CardTitle>
              <CardDescription>
                View recent webhook delivery attempts and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingEvents ? (
                      Array.from({ length: 3 }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : webhookEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <AlertCircle className="h-8 w-8 text-gray-400" />
                            <p className="text-gray-500 dark:text-gray-400">No webhook events yet</p>
                            <p className="text-sm text-gray-400">Events will appear here when webhooks are triggered</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                    webhookEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          {event.type}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getEventStatusIcon(event.status)}
                            <span className="capitalize">{event.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="truncate max-w-[200px]">
                          {event.endpoint}
                        </TableCell>
                        <TableCell>
                          {event.attempts}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              event.response.status >= 200 && event.response.status < 300
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                            }
                          >
                            {event.response.status || 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(event.timestamp)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle>Webhook Settings</CardTitle>
              <CardDescription>
                Configure global webhook behavior and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Retry Failed Deliveries</h4>
                    <p className="text-sm text-gray-500">Automatically retry failed webhook deliveries</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Signature Verification</h4>
                    <p className="text-sm text-gray-500">Require signature verification for all webhooks</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retryAttempts">Maximum Retry Attempts</Label>
                  <Select defaultValue="3">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <SelectItem value="1">1 attempt</SelectItem>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Request Timeout</Label>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Webhook Modal */}
      <Dialog open={showAddWebhook} onOpenChange={setShowAddWebhook}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Create a new webhook endpoint to receive event notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Endpoint URL</Label>
              <Input 
                id="webhookUrl" 
                placeholder="https://api.example.com/webhooks"
                value={webhookData.url}
                onChange={(e) => setWebhookData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookDescription">Description</Label>
              <Input 
                id="webhookDescription" 
                placeholder="Description of this webhook endpoint"
                value={webhookData.description}
                onChange={(e) => setWebhookData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Events to Send</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                {availableEvents.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id={`create-${event}`} 
                      className="rounded text-orange-600 focus:ring-orange-600" 
                      checked={webhookData.events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWebhookData(prev => ({ ...prev, events: [...prev.events, event] }))
                        } else {
                          setWebhookData(prev => ({ ...prev, events: prev.events.filter(e => e !== event) }))
                        }
                      }}
                    />
                    <Label htmlFor={`create-${event}`} className="text-sm cursor-pointer">{event}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWebhook(false)} className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </Button>
            <Button 
              onClick={handleAddWebhook}
              disabled={!webhookData.url || webhookData.events.length === 0 || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
            >
              {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Endpoint
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Detail Modal */}
      <Dialog open={!!selectedWebhook && !isEditDialogOpen && !isTestDialogOpen && !isDeleteDialogOpen} onOpenChange={() => setSelectedWebhook(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Webhook Details</DialogTitle>
            <DialogDescription>
              View webhook endpoint configuration and statistics
            </DialogDescription>
          </DialogHeader>
          
          {selectedWebhook && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={selectedWebhook.url} readOnly className="bg-gray-50 dark:bg-gray-800" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(selectedWebhook.url)}
                      className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div>
                    {getStatusBadge(selectedWebhook.status)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Success Rate</Label>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {selectedWebhook.successRate}%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Created</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateTime(selectedWebhook.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook Secret</Label>
                <div className="flex items-center space-x-2">
                  <Input value={selectedWebhook.secret} readOnly type="password" className="bg-gray-50 dark:bg-gray-800 font-mono" />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(selectedWebhook.secret)}
                    className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subscribed Events</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedWebhook.events.map((event) => (
                    <Badge key={event} variant="secondary" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWebhook(null)} className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              View webhook event delivery details
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <p className="font-medium">{selectedEvent.type}</p>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2">
                    {getEventStatusIcon(selectedEvent.status)}
                    <span className="capitalize">{selectedEvent.status}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Attempts</Label>
                  <p>{selectedEvent.attempts}</p>
                </div>

                <div className="space-y-2">
                  <Label>Response Code</Label>
                  <Badge 
                    className={
                      selectedEvent.response.status >= 200 && selectedEvent.response.status < 300
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                    }
                  >
                    {selectedEvent.response.status || 'Pending'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endpoint</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                  {selectedEvent.endpoint}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Timestamp</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDateTime(selectedEvent.timestamp)}
                </p>
              </div>

              {selectedEvent.response.body && (
                <div className="space-y-2">
                  <Label>Response Body</Label>
                  <Textarea 
                    value={selectedEvent.response.body} 
                    readOnly 
                    className="font-mono text-sm bg-gray-50 dark:bg-gray-800"
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)} className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800">
              Close
            </Button>
            <Button 
              onClick={() => selectedEvent && handleRetryEvent(selectedEvent.id)}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Webhook Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) setSelectedWebhook(null)
      }}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Update webhook endpoint configuration and event subscriptions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editWebhookUrl">Endpoint URL</Label>
              <Input 
                id="editWebhookUrl" 
                value={webhookData.url}
                onChange={(e) => setWebhookData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editWebhookDescription">Description</Label>
              <Input 
                id="editWebhookDescription" 
                value={webhookData.description}
                onChange={(e) => setWebhookData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={webhookData.isActive}
                    onCheckedChange={(checked) => setWebhookData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {webhookData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Events to Send</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                {availableEvents.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id={`edit-${event}`} 
                      className="rounded text-orange-600 focus:ring-orange-600" 
                      checked={webhookData.events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWebhookData(prev => ({ ...prev, events: [...prev.events, event] }))
                        } else {
                          setWebhookData(prev => ({ ...prev, events: prev.events.filter(e => e !== event) }))
                        }
                      }}
                    />
                    <Label htmlFor={`edit-${event}`} className="text-sm cursor-pointer">{event}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedWebhook(null)
              }} 
              className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateWebhook}
              disabled={!webhookData.url || webhookData.events.length === 0 || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
            >
              {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Webhook Modal */}
      <Dialog open={isTestDialogOpen} onOpenChange={(open) => {
        setIsTestDialogOpen(open)
        if (!open) {
          setSelectedWebhook(null)
          setTestResult(null)
        }
      }}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Test Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Send a test event to verify your webhook endpoint is working
            </DialogDescription>
          </DialogHeader>
          
          {selectedWebhook && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-mono">{selectedWebhook.url}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Test Event Type</Label>
                <Select defaultValue="payment.succeeded">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    {selectedWebhook.events.map(event => (
                      <SelectItem key={event} value={event}>{event}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border ${
                    testResult.status >= 200 && testResult.status < 300
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {testResult.status >= 200 && testResult.status < 300 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      Response: {testResult.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {testResult.message}
                  </p>
                </motion.div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsTestDialogOpen(false)
                setSelectedWebhook(null)
                setTestResult(null)
              }} 
              className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTestWebhook}
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
            >
              {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Testing...' : 'Send Test Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Webhook Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open)
        if (!open) setSelectedWebhook(null)
      }}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete Webhook Endpoint</DialogTitle>
            <DialogDescription>
              This will permanently delete the webhook endpoint "{selectedWebhook?.url}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
                  This action cannot be undone
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  All webhook events for this endpoint will stop being delivered immediately.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedWebhook(null)
              }} 
              className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteWebhook}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
            >
              Delete Endpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WebhooksPage
