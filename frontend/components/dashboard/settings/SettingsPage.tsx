'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Save,
  Bell,
  Shield,
  CreditCard,
  Key,
  Smartphone,
  Lock,
  Zap,
  Webhook,
  Monitor,
  AlertTriangle,
  Wallet,
  Landmark,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

import { Separator } from '@/components/ui/separator'
import { apiClient } from '@/lib/api/auth-api'
import { walletApiClient } from '@/lib/api/wallet-api'
import { useAuth } from '@/hooks/use-auth'
import { TwoFactorSetup } from './TwoFactorSetup'
import { TwoFactorDisable } from './TwoFactorDisable'
import { PasswordUpdate } from './PasswordUpdate'

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  webhookNotifications: boolean
  paymentAlerts: boolean
  securityAlerts: boolean
  marketingEmails: boolean
}

interface PaymentSettings {
  defaultCurrency: string
  autoConvert: boolean
  minimumAmount: number
  maximumAmount: number
  confirmationsRequired: number
  // Conversion settings
  autoConvertCurrency: string
  autoConvertThreshold: number
  preferredReceiveCurrency: string
  enableMultiCurrency: boolean
  slippageTolerance: number
  preferredProvider: string
  enableTestMode: boolean
  // Wallet addresses
  btcAddress: string
  stxAddress: string
  // Bank account
  bankName: string
  accountNumber: string
  routingNumber: string
}

interface SBTCSettings {
  network: 'testnet' | 'mainnet'
  walletAddress: string
  enableAutoDeposit: boolean
  minimumBalance: number
}

const SettingsPage = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('payments')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [show2FADisable, setShow2FADisable] = useState(false)
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [syncingWallet, setSyncingWallet] = useState(false)
  const [walletBalances, setWalletBalances] = useState<{
    stx: string;
    btc: string;
    sbtc: string;
  }>({
    stx: '0',
    btc: '0',
    sbtc: '0'
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    webhookNotifications: true,
    paymentAlerts: true,
    securityAlerts: true,
    marketingEmails: false
  })

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    defaultCurrency: 'USD',
    autoConvert: true,
    minimumAmount: 1,
    maximumAmount: 10000,
    confirmationsRequired: 3,
    // Conversion settings
    autoConvertCurrency: 'USD',
    autoConvertThreshold: 100,
    preferredReceiveCurrency: 'sBTC',
    enableMultiCurrency: true,
    slippageTolerance: 0.5,
    preferredProvider: 'circle',
    enableTestMode: false,
    // Wallet addresses
    btcAddress: '',
    stxAddress: '',
    // Bank account
    bankName: '',
    accountNumber: '',
    routingNumber: ''
  })

  const [sbtcSettings, setSBTCSettings] = useState<SBTCSettings>({
    network: 'testnet',
    walletAddress: '',
    enableAutoDeposit: false,
    minimumBalance: 0.001
  })

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        const response = await apiClient.getSettings();
        if (response.success && response.data) {
          const data = response.data;
          
          // Update notification preferences
          if (data.notificationPreferences) {
            setNotifications(data.notificationPreferences);
          }
          
          // Update 2FA status
          setTwoFactorEnabled(data.twoFactorEnabled || false);
          
          // Update payment settings
          if (data.paymentPreferences) {
            setPaymentSettings(prev => ({
              ...prev,
              defaultCurrency: data.paymentPreferences.preferredCurrency?.toUpperCase() || 'USD',
              autoConvert: data.paymentPreferences.autoConvertToUSD || false,
              minimumAmount: data.sbtcSettings?.minAmount ? data.sbtcSettings.minAmount / 100000000 : 1,
              maximumAmount: data.sbtcSettings?.maxAmount ? data.sbtcSettings.maxAmount / 100000000 : 10000,
              confirmationsRequired: data.sbtcSettings?.confirmationThreshold || 3
            }));
          }

          // Update wallet addresses from the new backend API
          if (data.connectedWallets) {
            setPaymentSettings(prev => ({
              ...prev,
              btcAddress: data.connectedWallets.bitcoinAddress || '',
              stxAddress: data.connectedWallets.stacksAddress || ''
            }));
          }
          
          // Update sBTC settings
          if (data.walletSetup?.sBTCWallet) {
            setSBTCSettings(prev => ({
              ...prev,
              walletAddress: data.walletSetup.sBTCWallet.address || '',
              enableAutoDeposit: data.sbtcSettings?.autoConvert || false,
              minimumBalance: data.sbtcSettings?.minAmount ? data.sbtcSettings.minAmount / 100000000 : 0.001
            }));
          }

          // If we have wallet addresses, also load and display balances
          if (data.walletBalances) {
            // Wallet balances loaded from backend
            setWalletBalances({
              stx: data.walletBalances.stxBalance?.amount || '0',
              btc: data.walletBalances.btcBalance?.amount || '0',
              sbtc: data.walletBalances.sbtcBalance?.amount || '0'
            });
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Sync wallet data from connected wallet
  const handleSyncWallet = async () => {
    setSyncingWallet(true);
    try {
      // Starting wallet sync...
      
      // First get balances directly from frontend services to show immediate feedback
      const balancesResult = await walletApiClient.getAllWalletBalances();
      if (balancesResult.success && balancesResult.data) {
        // Current wallet balances retrieved
        
        const walletData = balancesResult.data; // Store data in variable to avoid TS errors
        
        // Update local state immediately
        setWalletBalances({
          stx: walletData.stxBalance,
          btc: walletData.btcBalance,
          sbtc: walletData.sbtcBalance
        });
        
        // Update addresses immediately
        setPaymentSettings(prev => ({
          ...prev,
          stxAddress: walletData.addresses.stacks,
          btcAddress: walletData.addresses.bitcoin || ''
        }));
      }
      
      // Then sync with backend
      const result = await walletApiClient.syncWalletConnection();
      if (result.success) {
        // Wallet synced with backend successfully
        
        // Reload settings to get any additional backend data
        const response = await apiClient.getSettings();
        if (response.success && response.data) {
          const data = response.data;
          
          // Update wallet addresses from backend
          if (data.connectedWallets) {
            setPaymentSettings(prev => ({
              ...prev,
              btcAddress: data.connectedWallets.bitcoinAddress || prev.btcAddress,
              stxAddress: data.connectedWallets.stacksAddress || prev.stxAddress
            }));
          }

          // Update wallet balances from backend
          if (data.walletBalances) {
            setWalletBalances({
              stx: data.walletBalances.stxBalance?.amount || walletBalances.stx,
              btc: data.walletBalances.btcBalance?.amount || walletBalances.btc,
              sbtc: data.walletBalances.sbtcBalance?.amount || walletBalances.sbtc
            });
          }
        }
        
      } else {
        console.error('❌ Failed to sync with backend:', result.error);
        // Still show success for frontend data even if backend sync failed
      }
    } catch (error) {
      console.error('❌ Error syncing wallet:', error);
    } finally {
      setSyncingWallet(false);
    }
  };

  const handleSave = async (section: string) => {
    setLoading(true)
    try {
      let updateData: any = {};
      
      if (section === 'notifications') {
        updateData.notificationPreferences = notifications;
      } else if (section === 'payments') {
        updateData.paymentPreferences = {
          preferredCurrency: paymentSettings.defaultCurrency.toLowerCase(),
          autoConvertToUSD: paymentSettings.autoConvert
        };
        updateData.sbtcSettings = {
          minAmount: Math.round(paymentSettings.minimumAmount * 100000000),
          maxAmount: Math.round(paymentSettings.maximumAmount * 100000000),
          confirmationThreshold: paymentSettings.confirmationsRequired
        };
      } else if (section === 'sbtc') {
        updateData.walletSetup = {
          sBTCWallet: {
            address: sbtcSettings.walletAddress,
            isConfigured: !!sbtcSettings.walletAddress
          }
        };
        updateData.sbtcSettings = {
          autoConvert: sbtcSettings.enableAutoDeposit,
          minAmount: Math.round(sbtcSettings.minimumBalance * 100000000)
        };
      }
      
      const response = await apiClient.updateSettings(updateData);
      
      if (!response.success) {
        console.error(`${section} settings update failed:`, response.error);
      }
    } catch (error) {
      console.error(`${section} settings update error:`, error);
    } finally {
      setLoading(false)
    }
  }

  const handle2FASuccess = () => {
    setTwoFactorEnabled(true);
  };

  const handle2FADisableSuccess = () => {
    setTwoFactorEnabled(false);
  };

  const handlePasswordUpdateSuccess = () => {
    // Password update successful - no need to update local state
  };

  const updateNotificationSetting = (field: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }))
  }

  const updatePaymentSetting = (field: keyof PaymentSettings, value: any) => {
    setPaymentSettings(prev => ({ ...prev, [field]: value }))
  }

  const updateSBTCSetting = (field: keyof SBTCSettings, value: any) => {
    setSBTCSettings(prev => ({ ...prev, [field]: value }))
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure payment preferences, security, and system settings
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
              <TabsList className="grid w-full grid-cols-4 max-w-lg bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="payments" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Payments</TabsTrigger>
                <TabsTrigger value="sbtc" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">sBTC</TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Notifications</TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Security</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="payments" className="mt-0">
              <div className="space-y-6">
                {/* Payment Configuration */}
                <Card className="bg-white dark:bg-gray-900 border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Payment Configuration</span>
                    </CardTitle>
                    <CardDescription>
                      Configure your payment processing preferences and limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultCurrency">Default Currency</Label>
                        <Select 
                          value={paymentSettings.defaultCurrency}
                          onValueChange={(value) => updatePaymentSetting('defaultCurrency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="BTC">BTC - Bitcoin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmations">Required Confirmations</Label>
                        <Select 
                          value={paymentSettings.confirmationsRequired.toString()}
                          onValueChange={(value) => updatePaymentSetting('confirmationsRequired', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Confirmation</SelectItem>
                            <SelectItem value="3">3 Confirmations</SelectItem>
                            <SelectItem value="6">6 Confirmations</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minimumAmount">Minimum Payment Amount ($)</Label>
                        <Input
                          id="minimumAmount"
                          type="number"
                          step="0.01"
                          value={paymentSettings.minimumAmount}
                          onChange={(e) => updatePaymentSetting('minimumAmount', parseFloat(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maximumAmount">Maximum Payment Amount ($)</Label>
                        <Input
                          id="maximumAmount"
                          type="number"
                          step="0.01"
                          value={paymentSettings.maximumAmount}
                          onChange={(e) => updatePaymentSetting('maximumAmount', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium">Auto-convert to USD</h4>
                        <p className="text-sm text-gray-500">Automatically convert Bitcoin payments to USD</p>
                      </div>
                      <Switch
                        checked={paymentSettings.autoConvert}
                        onCheckedChange={(checked) => updatePaymentSetting('autoConvert', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Auto-Conversion Settings */}
                <Card className="bg-white dark:bg-gray-900 border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Auto-Conversion
                    </CardTitle>
                    <CardDescription>
                      Automatically convert received payments to your preferred currency
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Auto-Convert To</Label>
                        <Select
                          value={paymentSettings.autoConvertCurrency}
                          onValueChange={(value) => updatePaymentSetting('autoConvertCurrency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="USDC">USDC - USD Coin</SelectItem>
                            <SelectItem value="sBTC">sBTC - Synthetic Bitcoin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Minimum Amount for Auto-Conversion ($)</Label>
                        <Input
                          type="number"
                          value={paymentSettings.autoConvertThreshold}
                          onChange={(e) => updatePaymentSetting('autoConvertThreshold', parseFloat(e.target.value))}
                          placeholder="100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred Receive Currency</Label>
                        <Select
                          value={paymentSettings.preferredReceiveCurrency}
                          onValueChange={(value) => updatePaymentSetting('preferredReceiveCurrency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sBTC">sBTC - Synthetic Bitcoin</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="USDC">USDC - USD Coin</SelectItem>
                            <SelectItem value="STX">STX - Stacks</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Slippage Tolerance (%)</Label>
                        <Input
                          type="number"
                          value={paymentSettings.slippageTolerance}
                          onChange={(e) => updatePaymentSetting('slippageTolerance', parseFloat(e.target.value))}
                          placeholder="0.5"
                          min="0.1"
                          max="5"
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium">Enable Multi-Currency Payments</h4>
                        <p className="text-sm text-gray-500">Allow customers to pay in multiple currencies</p>
                      </div>
                      <Switch
                        checked={paymentSettings.enableMultiCurrency}
                        onCheckedChange={(checked) => updatePaymentSetting('enableMultiCurrency', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Provider</Label>
                      <Select
                        value={paymentSettings.preferredProvider}
                        onValueChange={(value) => updatePaymentSetting('preferredProvider', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="circle">Circle (Best for USD/USDC)</SelectItem>
                          <SelectItem value="coinbase">Coinbase Commerce</SelectItem>
                          <SelectItem value="internal">Internal (Best for sBTC/STX)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium">Test Mode</h4>
                        <p className="text-sm text-gray-500">Use testnet for all conversions</p>
                      </div>
                      <Switch
                        checked={paymentSettings.enableTestMode}
                        onCheckedChange={(checked) => updatePaymentSetting('enableTestMode', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Wallet Addresses */}
                <Card className="bg-white dark:bg-gray-900 border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Wallet Addresses
                    </CardTitle>
                    <CardDescription>
                      Configure your crypto wallet addresses for withdrawals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Sync from Connected Wallet</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Update addresses and balances from your connected wallet</p>
                      </div>
                      <Button
                        onClick={handleSyncWallet}
                        disabled={syncingWallet}
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        {syncingWallet ? (
                          <>
                            <Monitor className="h-4 w-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Sync Wallet
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Bitcoin Address</Label>
                        <Badge variant="outline" className="text-xs">
                          Balance: {parseFloat(walletBalances.btc).toFixed(8)} BTC
                        </Badge>
                      </div>
                      <Input
                        value={paymentSettings.btcAddress}
                        onChange={(e) => updatePaymentSetting('btcAddress', e.target.value)}
                        placeholder="bc1q..."
                        className="font-mono text-sm"
                        readOnly={!!paymentSettings.btcAddress}
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Your Bitcoin wallet address for receiving BTC
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Stacks Address</Label>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            STX: {parseFloat(walletBalances.stx).toFixed(6)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            sBTC: {parseFloat(walletBalances.sbtc).toFixed(8)}
                          </Badge>
                        </div>
                      </div>
                      <Input
                        value={paymentSettings.stxAddress}
                        onChange={(e) => updatePaymentSetting('stxAddress', e.target.value)}
                        placeholder="SP..."
                        className="font-mono text-sm"
                        readOnly={!!paymentSettings.stxAddress}
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Your Stacks wallet address for receiving STX tokens
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Bank Account */}
                <Card className="bg-white dark:bg-gray-900 border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="h-5 w-5" />
                      Bank Account
                    </CardTitle>
                    <CardDescription>
                      Configure your bank account for USD withdrawals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        value={paymentSettings.bankName}
                        onChange={(e) => updatePaymentSetting('bankName', e.target.value)}
                        placeholder="Bank Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        value={paymentSettings.accountNumber}
                        onChange={(e) => updatePaymentSetting('accountNumber', e.target.value)}
                        placeholder="****1234"
                        type="password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Routing Number</Label>
                      <Input
                        value={paymentSettings.routingNumber}
                        onChange={(e) => updatePaymentSetting('routingNumber', e.target.value)}
                        placeholder="121000248"
                      />
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Your banking information is encrypted and securely stored. We never store your full account details.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSave('payments')} 
                    disabled={loading}
                    className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </TabsContent>

              <TabsContent value="sbtc" className="mt-0">
                <Card className="bg-white dark:bg-gray-900 border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>sBTC Configuration</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your sBTC wallet and network settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="network">Network</Label>
                        <Select 
                          value={sbtcSettings.network}
                          onValueChange={(value) => updateSBTCSetting('network', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="testnet">Testnet</SelectItem>
                            <SelectItem value="mainnet">Mainnet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="walletAddress">Wallet Address</Label>
                        <Input
                          id="walletAddress"
                          value={sbtcSettings.walletAddress}
                          onChange={(e) => updateSBTCSetting('walletAddress', e.target.value)}
                          placeholder="SP1ABC..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minimumBalance">Minimum Balance (sBTC)</Label>
                        <Input
                          id="minimumBalance"
                          type="number"
                          step="0.000001"
                          value={sbtcSettings.minimumBalance}
                          onChange={(e) => updateSBTCSetting('minimumBalance', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium">Enable Auto Deposit</h4>
                        <p className="text-sm text-gray-500">Automatically deposit received sBTC to your wallet</p>
                      </div>
                      <Switch
                        checked={sbtcSettings.enableAutoDeposit}
                        onCheckedChange={(checked) => updateSBTCSetting('enableAutoDeposit', checked)}
                      />
                    </div>

                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-start space-x-3">
                        <Zap className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100">
                            Network Status: {sbtcSettings.network === 'testnet' ? 'Testnet' : 'Mainnet'}
                          </h4>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            {sbtcSettings.network === 'testnet' 
                              ? 'You are currently using the test network. Switch to mainnet for live transactions.'
                              : 'You are using the live network. All transactions are real and irreversible.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={() => handleSave('sbtc')} 
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <Card className="bg-white dark:bg-gray-900 border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>Notification Preferences</span>
                    </CardTitle>
                    <CardDescription>
                      Choose how you want to receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Email Notifications</h4>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={notifications.emailNotifications}
                          onCheckedChange={(checked) => updateNotificationSetting('emailNotifications', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">SMS Notifications</h4>
                          <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                        </div>
                        <Switch
                          checked={notifications.smsNotifications}
                          onCheckedChange={(checked) => updateNotificationSetting('smsNotifications', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Webhook Notifications</h4>
                          <p className="text-sm text-gray-500">Send notifications to your webhook endpoints</p>
                        </div>
                        <Switch
                          checked={notifications.webhookNotifications}
                          onCheckedChange={(checked) => updateNotificationSetting('webhookNotifications', checked)}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Payment Alerts</h4>
                          <p className="text-sm text-gray-500">Get notified about successful payments</p>
                        </div>
                        <Switch
                          checked={notifications.paymentAlerts}
                          onCheckedChange={(checked) => updateNotificationSetting('paymentAlerts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Security Alerts</h4>
                          <p className="text-sm text-gray-500">Important security notifications</p>
                        </div>
                        <Switch
                          checked={notifications.securityAlerts}
                          onCheckedChange={(checked) => updateNotificationSetting('securityAlerts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Marketing Emails</h4>
                          <p className="text-sm text-gray-500">Product updates and tips</p>
                        </div>
                        <Switch
                          checked={notifications.marketingEmails}
                          onCheckedChange={(checked) => updateNotificationSetting('marketingEmails', checked)}
                        />
                      </div>
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Webhook className="h-4 w-4 text-blue-600" />
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">Webhook Management</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Configure webhook endpoints and manage event subscriptions
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => router.push('/dashboard/webhooks')}
                        >
                          Manage Webhooks
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={() => handleSave('notifications')} 
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <div className="space-y-6">
                  {/* Security Overview */}
                  <Card className="bg-white dark:bg-gray-900 border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-orange-600" />
                        <span>Security Overview</span>
                      </CardTitle>
                      <CardDescription>
                        Quick security status and access to detailed security management
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Security Score */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                              <Shield className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-900 dark:text-green-100">Security Score</p>
                              <p className="text-lg font-bold text-green-600">85%</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <Monitor className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Active Sessions</p>
                              <p className="text-lg font-bold text-blue-600">2</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <Key className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">API Keys</p>
                              <p className="text-lg font-bold text-gray-600 dark:text-gray-400">3</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4 text-orange-600" />
                                <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Two-Factor Auth</span>
                                <Badge className={twoFactorEnabled 
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 text-xs"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 text-xs"
                                }>
                                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </div>
                              <p className="text-xs text-orange-700 dark:text-orange-300">
                                {twoFactorEnabled 
                                  ? 'Your account is protected with 2FA'
                                  : 'Add an extra layer of security to your account'
                                }
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => twoFactorEnabled ? setShow2FADisable(true) : setShow2FASetup(true)}
                              className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              {twoFactorEnabled ? 'Disable' : 'Enable'}
                            </Button>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Lock className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Password</span>
                                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 text-xs">
                                  30 days old
                                </Badge>
                              </div>
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                {user?.authMethod === 'wallet' ? 'Generated password - update recommended' : 'Secure your account with a strong password'}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setShowPasswordUpdate(true)}
                              className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              {user?.authMethod === 'wallet' ? 'Update' : 'Change'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Link to Full Security Page */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-r from-gray-50 to-orange-50 dark:from-gray-800 dark:to-orange-900/10">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-5 w-5 text-orange-600" />
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">Advanced Security Management</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              View security events, manage active sessions, and access advanced security features
                            </p>
                          </div>
                          <Button 
                            onClick={() => router.push('/dashboard/security')}
                            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
                          >
                            Open Security Center
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                        <CardHeader>
                          <CardTitle className="text-red-900 dark:text-red-100 text-base">Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-red-900 dark:text-red-100">
                                Delete Account
                              </h5>
                              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                Permanently delete your account and all associated data. This action cannot be undone.
                              </p>
                              <Button variant="destructive" size="sm" className="mt-3">
                                Delete Account
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* 2FA Modals */}
      <TwoFactorSetup
        isOpen={show2FASetup}
        onOpenChange={setShow2FASetup}
        onSuccess={handle2FASuccess}
      />
      
      <TwoFactorDisable
        isOpen={show2FADisable}
        onOpenChange={setShow2FADisable}
        onSuccess={handle2FADisableSuccess}
      />
      
      <PasswordUpdate
        isOpen={showPasswordUpdate}
        onOpenChange={setShowPasswordUpdate}
        onSuccess={handlePasswordUpdateSuccess}
      />
    </div>
  )
}

export default SettingsPage