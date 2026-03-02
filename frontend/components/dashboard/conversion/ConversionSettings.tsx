"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings,
  Wallet,
  CreditCard,
  Landmark,
  Shield,
  Zap,
  Info,
  CheckCircle,
  AlertTriangle,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ConversionSettingsProps {
  onSettingsUpdate: () => void;
}

export function ConversionSettings({ onSettingsUpdate }: ConversionSettingsProps) {
  const [settings, setSettings] = useState({
    // Auto-conversion settings
    autoConvertEnabled: true,
    autoConvertCurrency: 'USD',
    autoConvertThreshold: '100',
    
    // Payment preferences
    preferredReceiveCurrency: 'sBTC',
    enableMultiCurrency: true,
    
    // Wallet addresses
    btcAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    stacksAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    ethAddress: '0x742d35Cc6464C532d6B8E1b4a4f6c0E4C4',
    
    // Bank account details
    bankName: 'Wells Fargo',
    accountNumber: '****1234',
    routingNumber: '121000248',
    
    // Notifications
    emailNotifications: true,
    webhookNotifications: true,
    webhookUrl: 'https://api.mystore.com/webhooks/payments',
    
    // Advanced settings
    slippageTolerance: '0.5',
    preferredProvider: 'circle',
    enableTestMode: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSavedMessage('Settings saved successfully!');
      onSettingsUpdate();
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setSavedMessage('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Conversion Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your currency preferences and withdrawal methods
          </p>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700">
          {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {savedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className={savedMessage.includes('success') ? 'bg-white dark:bg-gray-900 border border-green-500 shadow-sm' : 'bg-white dark:bg-gray-900 border border-red-500 shadow-sm'}>
            {savedMessage.includes('success') ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
            <AlertDescription className={savedMessage.includes('success') ? 'text-green-800' : 'text-red-800'}>
              {savedMessage}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Auto-Conversion</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Convert incoming payments automatically
                </p>
              </div>
              <Switch
                checked={settings.autoConvertEnabled}
                onCheckedChange={(checked) => updateSetting('autoConvertEnabled', checked)}
              />
            </div>

            {settings.autoConvertEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Convert To</Label>
                  <Select
                    value={settings.autoConvertCurrency}
                    onValueChange={(value) => updateSetting('autoConvertCurrency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="USDC">USDC - USD Coin</SelectItem>
                      <SelectItem value="sBTC">sBTC - Synthetic Bitcoin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Amount for Auto-Conversion</Label>
                  <Input
                    type="number"
                    value={settings.autoConvertThreshold}
                    onChange={(e) => updateSetting('autoConvertThreshold', e.target.value)}
                    placeholder="100"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Only convert payments above this amount
                  </p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Payment Preferences */}
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payment Preferences
            </CardTitle>
            <CardDescription>
              Configure how you want to receive payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred Receive Currency</Label>
              <Select
                value={settings.preferredReceiveCurrency}
                onValueChange={(value) => updateSetting('preferredReceiveCurrency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="sBTC">sBTC - Synthetic Bitcoin</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="USDC">USDC - USD Coin</SelectItem>
                  <SelectItem value="STX">STX - Stacks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Multi-Currency Payments</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Allow customers to pay in multiple currencies
                </p>
              </div>
              <Switch
                checked={settings.enableMultiCurrency}
                onCheckedChange={(checked) => updateSetting('enableMultiCurrency', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Wallet Addresses */}
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Wallet Addresses
            </CardTitle>
            <CardDescription>
              Configure your crypto wallet addresses for withdrawals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bitcoin Address</Label>
              <Input
                value={settings.btcAddress}
                onChange={(e) => updateSetting('btcAddress', e.target.value)}
                placeholder="bc1q..."
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Stacks Address</Label>
              <Input
                value={settings.stacksAddress}
                onChange={(e) => updateSetting('stacksAddress', e.target.value)}
                placeholder="SP..."
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Ethereum Address</Label>
              <Input
                value={settings.ethAddress}
                onChange={(e) => updateSetting('ethAddress', e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
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
                value={settings.bankName}
                onChange={(e) => updateSetting('bankName', e.target.value)}
                placeholder="Bank Name"
              />
            </div>

            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={settings.accountNumber}
                onChange={(e) => updateSetting('accountNumber', e.target.value)}
                placeholder="****1234"
                type="password"
              />
            </div>

            <div className="space-y-2">
              <Label>Routing Number</Label>
              <Input
                value={settings.routingNumber}
                onChange={(e) => updateSetting('routingNumber', e.target.value)}
                placeholder="121000248"
              />
            </div>

            <Alert className="bg-white dark:bg-gray-900 border shadow-sm">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your banking information is encrypted and securely stored. We never store your full account details.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you want to be notified about conversions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive email updates for conversions
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Webhook Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Send conversion updates to your webhook URL
                </p>
              </div>
              <Switch
                checked={settings.webhookNotifications}
                onCheckedChange={(checked) => updateSetting('webhookNotifications', checked)}
              />
            </div>

            {settings.webhookNotifications && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <Label>Webhook URL</Label>
                <Input
                  value={settings.webhookUrl}
                  onChange={(e) => updateSetting('webhookUrl', e.target.value)}
                  placeholder="https://api.mystore.com/webhooks"
                />
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Fine-tune your conversion parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Slippage Tolerance (%)</Label>
              <Input
                type="number"
                value={settings.slippageTolerance}
                onChange={(e) => updateSetting('slippageTolerance', e.target.value)}
                placeholder="0.5"
                min="0.1"
                max="5"
                step="0.1"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Maximum acceptable price difference during conversion
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preferred Provider</Label>
              <Select
                value={settings.preferredProvider}
                onValueChange={(value) => updateSetting('preferredProvider', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="circle">Circle (Best for USD/USDC)</SelectItem>
                  <SelectItem value="coinbase">Coinbase Commerce</SelectItem>
                  <SelectItem value="internal">Internal (Best for sBTC/STX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Test Mode</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use testnet for all conversions
                </p>
              </div>
              <Switch
                checked={settings.enableTestMode}
                onCheckedChange={(checked) => updateSetting('enableTestMode', checked)}
              />
            </div>

            {settings.enableTestMode && (
              <Alert className="bg-white dark:bg-gray-900 border border-yellow-500 shadow-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Test mode is enabled. All conversions will use testnet currencies.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
