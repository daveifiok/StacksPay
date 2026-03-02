'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Brain,
  Activity,
  Ban,
  Settings,
  TrendingUp,
  Users,
  MapPin,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SecurityEvent {
  id: string
  type: 'login' | 'api_key_created' | 'password_change' | '2fa_enabled' | 'suspicious_activity' | 'fraud_detected' | 'risk_alert'
  description: string
  timestamp: string
  location: string
  device: string
  status: 'success' | 'failed' | 'warning' | 'blocked'
  riskScore?: number
}

interface FraudRule {
  id: string
  name: string
  description: string
  enabled: boolean
  riskScore: number
  action: 'block' | 'flag' | 'review'
}

interface VelocityLimit {
  id: string
  name: string
  timeWindow: string
  maxAmount: number
  maxTransactions: number
  enabled: boolean
}

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: '1',
    type: 'login',
    description: 'Successful login',
    timestamp: '2024-01-15T10:30:00Z',
    location: 'San Francisco, CA',
    device: 'Chrome on macOS',
    status: 'success'
  },
  {
    id: '2',
    type: 'api_key_created',
    description: 'API key created for production',
    timestamp: '2024-01-15T09:15:00Z',
    location: 'San Francisco, CA',
    device: 'Chrome on macOS',
    status: 'success'
  },
  {
    id: '3',
    type: 'suspicious_activity',
    description: 'Multiple failed login attempts',
    timestamp: '2024-01-14T23:45:00Z',
    location: 'Unknown Location',
    device: 'Unknown Browser',
    status: 'warning'
  },
  {
    id: '4',
    type: 'fraud_detected',
    description: 'High-value transaction blocked - unusual location',
    timestamp: '2024-01-14T20:30:00Z',
    location: 'Moscow, Russia',
    device: 'Firefox on Windows',
    status: 'blocked',
    riskScore: 95
  },
  {
    id: '5',
    type: 'risk_alert',
    description: 'Velocity limit exceeded - 10 transactions in 5 minutes',
    timestamp: '2024-01-14T15:22:00Z',
    location: 'New York, NY',
    device: 'Chrome on Android',
    status: 'warning',
    riskScore: 78
  }
]

const mockFraudRules: FraudRule[] = [
  {
    id: '1',
    name: 'High-Value Transactions',
    description: 'Flag transactions over 1 sBTC from new locations',
    enabled: true,
    riskScore: 80,
    action: 'review'
  },
  {
    id: '2',
    name: 'Geolocation Anomaly',
    description: 'Block transactions from high-risk countries',
    enabled: true,
    riskScore: 90,
    action: 'block'
  },
  {
    id: '3',
    name: 'Device Fingerprinting',
    description: 'Flag transactions from unrecognized devices',
    enabled: false,
    riskScore: 60,
    action: 'flag'
  },
  {
    id: '4',
    name: 'Suspicious Patterns',
    description: 'Detect round-number amounts and sequential transactions',
    enabled: true,
    riskScore: 70,
    action: 'review'
  }
]

const mockVelocityLimits: VelocityLimit[] = [
  {
    id: '1',
    name: 'Daily Transaction Limit',
    timeWindow: '24 hours',
    maxAmount: 10,
    maxTransactions: 50,
    enabled: true
  },
  {
    id: '2',
    name: 'Hourly Burst Protection',
    timeWindow: '1 hour',
    maxAmount: 2,
    maxTransactions: 10,
    enabled: true
  },
  {
    id: '3',
    name: 'High-Value Weekly Limit',
    timeWindow: '7 days',
    maxAmount: 50,
    maxTransactions: 100,
    enabled: false
  }
]

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [notifications, setNotifications] = useState({
    loginAlerts: true,
    apiActivity: true,
    suspiciousActivity: true
  })
  const [fraudRules, setFraudRules] = useState<FraudRule[]>(mockFraudRules)
  const [velocityLimits, setVelocityLimits] = useState<VelocityLimit[]>(mockVelocityLimits)
  const [riskThreshold, setRiskThreshold] = useState(75)
  const [blockedCountries, setBlockedCountries] = useState(['CN', 'KP', 'IR'])
  const [whitelistedIPs, setWhitelistedIPs] = useState(['192.168.1.1', '10.0.0.1'])

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login':
        return <Key className="h-4 w-4" />
      case 'api_key_created':
        return <Globe className="h-4 w-4" />
      case 'password_change':
        return <Lock className="h-4 w-4" />
      case '2fa_enabled':
        return <Smartphone className="h-4 w-4" />
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4" />
      case 'fraud_detected':
        return <Ban className="h-4 w-4" />
      case 'risk_alert':
        return <Brain className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: SecurityEvent['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'blocked':
        return <Ban className="h-4 w-4 text-red-600" />
    }
  }

  const updateFraudRule = (ruleId: string, enabled: boolean) => {
    setFraudRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled } : rule
    ))
  }

  const updateVelocityLimit = (limitId: string, enabled: boolean) => {
    setVelocityLimits(prev => prev.map(limit => 
      limit.id === limitId ? { ...limit, enabled } : limit
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security & Fraud Detection</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage security settings and configure fraud protection
          </p>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Security Score</p>
              <p className="text-2xl font-bold text-green-600">85%</p>
            </div>
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Good security posture</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fraud Blocks</p>
              <p className="text-2xl font-bold text-red-600">12</p>
            </div>
            <Ban className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Last 24 hours</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Risk Alerts</p>
              <p className="text-2xl font-bold text-yellow-600">34</p>
            </div>
            <Brain className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Requiring review</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Rules</p>
              <p className="text-2xl font-bold text-blue-600">{fraudRules.filter(r => r.enabled).length}</p>
            </div>
            <Settings className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">of {fraudRules.length} total</p>
        </motion.div>
      </div>

      {/* Fraud Detection Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm"
      >
        <Tabs defaultValue="rules" className="w-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="rules">Fraud Rules</TabsTrigger>
              <TabsTrigger value="velocity">Velocity Limits</TabsTrigger>
              <TabsTrigger value="geo">Geographic</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>
          </div>

          {/* Fraud Rules Tab */}
          <TabsContent value="rules" className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fraud Detection Rules</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure automated fraud detection patterns</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="risk-threshold" className="text-sm">Risk Threshold:</Label>
                  <Input
                    id="risk-threshold"
                    type="number"
                    value={riskThreshold}
                    onChange={(e) => setRiskThreshold(Number(e.target.value))}
                    className="w-20"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {fraudRules.map((rule) => (
                <Card key={rule.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{rule.name}</h4>
                          <Badge 
                            variant={rule.action === 'block' ? 'destructive' : rule.action === 'review' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {rule.action}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Risk: {rule.riskScore}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{rule.description}</p>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => updateFraudRule(rule.id, enabled)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Velocity Limits Tab */}
          <TabsContent value="velocity" className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Velocity Limits</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Set transaction limits to prevent abuse</p>
              </div>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                <TrendingUp className="h-4 w-4 mr-2" />
                Add Limit
              </Button>
            </div>

            <div className="space-y-4">
              {velocityLimits.map((limit) => (
                <Card key={limit.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{limit.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {limit.timeWindow}
                          </Badge>
                        </div>
                        <div className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400">
                          <span>Max Amount: {limit.maxAmount} sBTC</span>
                          <span>Max Transactions: {limit.maxTransactions}</span>
                        </div>
                      </div>
                      <Switch
                        checked={limit.enabled}
                        onCheckedChange={(enabled) => updateVelocityLimit(limit.id, enabled)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Geographic Tab */}
          <TabsContent value="geo" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Blocked Countries</span>
                  </CardTitle>
                  <CardDescription>Countries where transactions are blocked</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {blockedCountries.map((country) => (
                      <Badge key={country} variant="destructive" className="text-xs">
                        {country}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-2"
                          onClick={() => setBlockedCountries(prev => prev.filter(c => c !== country))}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input placeholder="Add country code (e.g., US)" className="flex-1" />
                    <Button size="sm" variant="outline">Add</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Whitelisted IPs</span>
                  </CardTitle>
                  <CardDescription>IP addresses that bypass fraud checks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {whitelistedIPs.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <span className="text-sm font-mono">{ip}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setWhitelistedIPs(prev => prev.filter((_, i) => i !== index))}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input placeholder="Add IP address" className="flex-1" />
                    <Button size="sm" variant="outline">Add</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    <span>Real-time Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Fraud Engine</span>
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">ML Model</span>
                      <Badge className="bg-green-100 text-green-700">Online</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rule Engine</span>
                      <Badge className="bg-green-100 text-green-700">Running</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">False Positive Rate</span>
                      <Badge variant="outline">2.1%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Detection Rate</span>
                      <Badge variant="outline">97.3%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Response Time</span>
                      <Badge variant="outline">45ms</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span>Daily Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Transactions Analyzed</span>
                      <Badge variant="outline">1,234</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Fraud Blocked</span>
                      <Badge className="bg-red-100 text-red-700">12</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Under Review</span>
                      <Badge className="bg-yellow-100 text-yellow-700">34</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Security Notifications</CardTitle>
                <CardDescription>Configure when to receive security alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">Login alerts</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Get notified of new logins</p>
                    </div>
                    <Switch
                      checked={notifications.loginAlerts}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, loginAlerts: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">API activity</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Get notified of API key usage</p>
                    </div>
                    <Switch
                      checked={notifications.apiActivity}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, apiActivity: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">Suspicious activity</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Get notified of security threats</p>
                    </div>
                    <Switch
                      checked={notifications.suspiciousActivity}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, suspiciousActivity: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Activity Log</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monitor all security events and fraud alerts</p>
                </div>
                <div className="flex space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="fraud">Fraud Only</SelectItem>
                      <SelectItem value="alerts">Alerts Only</SelectItem>
                      <SelectItem value="blocked">Blocked Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    Export Log
                  </Button>
                </div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockSecurityEvents.map((event) => (
                  <div key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full">
                          {getEventIcon(event.type)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {event.description}
                            </p>
                            {getStatusIcon(event.status)}
                            {event.riskScore && (
                              <Badge 
                                variant={event.riskScore > 80 ? 'destructive' : event.riskScore > 60 ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                Risk: {event.riskScore}%
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                            <span>{event.location}</span>
                            <span>{event.device}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
