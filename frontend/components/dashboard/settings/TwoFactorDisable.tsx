'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Lock, Smartphone } from 'lucide-react';
import { apiClient } from '@/lib/api/auth-api';

interface TwoFactorDisableProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TwoFactorDisable({ isOpen, onOpenChange, onSuccess }: TwoFactorDisableProps) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [method, setMethod] = useState<'password' | '2fa'>('password');

  const handleDisable2FA = async () => {
    if (method === 'password' && !password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    if (method === '2fa' && !twoFactorCode.trim()) {
      setError('Please enter your 2FA code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const credentials = method === 'password' 
        ? { password: password.trim() }
        : { twoFactorCode: twoFactorCode.trim() };

      const response = await apiClient.disable2FA(credentials);
      
      if (response.success) {
        onSuccess();
        onOpenChange(false);
        resetState();
      } else {
        setError(response.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      setError('Failed to disable 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPassword('');
    setTwoFactorCode('');
    setError('');
    setMethod('password');
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Disable Two-Factor Authentication</span>
          </DialogTitle>
          <DialogDescription>
            Disabling 2FA will make your account less secure. Please verify your identity to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">Security Warning</p>
                <p>Your account will be less secure without two-factor authentication.</p>
              </div>
            </div>
          </div>

          <Tabs value={method} onValueChange={(value) => setMethod(value as 'password' | '2fa')}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="password" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                <Lock className="mr-2 h-4 w-4" />
                Password
              </TabsTrigger>
              <TabsTrigger value="2fa" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                <Smartphone className="mr-2 h-4 w-4" />
                2FA Code
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="password" className="mt-0">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Enter the password you use to log into your account
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="2fa" className="mt-0">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="twoFactorCode">Authentication Code</Label>
                    <Input
                      id="twoFactorCode"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="text-center text-lg font-mono border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Enter the code from your authenticator app or use a backup code
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-200 dark:border-gray-700"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable2FA}
            disabled={loading || (method === 'password' && !password.trim()) || (method === '2fa' && !twoFactorCode.trim())}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : null}
            Disable 2FA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}