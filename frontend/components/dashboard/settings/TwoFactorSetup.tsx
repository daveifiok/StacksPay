'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Smartphone, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api/auth-api';

interface TwoFactorSetupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TwoFactorSetup({ isOpen, onOpenChange, onSuccess }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.enable2FA();
      
      if (response.success && response.data) {
        setQrCode(response.data.qrCode);
        setSecret(response.data.secret);
        setStep('verify');
      } else {
        setError(response.error || 'Failed to enable 2FA');
      }
    } catch (error) {
      setError('Failed to enable 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.confirm2FA(verificationCode.trim());
      
      if (response.success && response.data) {
        setBackupCodes(response.data.backupCodes || []);
        setStep('backup');
      } else {
        setError(response.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setStep('setup');
    setQrCode('');
    setSecret('');
    setVerificationCode('');
    setBackupCodes([]);
    setError('');
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  };

  const downloadBackupCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'sbtc-payment-gateway-backup-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {step === 'setup' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-orange-600" />
                <span>Enable Two-Factor Authentication</span>
              </DialogTitle>
              <DialogDescription>
                Add an extra layer of security to your account using an authenticator app.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Before you begin:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>• Keep your phone nearby for setup</li>
                  <li>• Have a secure place to store backup codes</li>
                </ul>
              </div>

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
                onClick={() => onOpenChange(false)}
                className="border-gray-200 dark:border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnable2FA}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'verify' && (
          <>
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Use your authenticator app to scan this QR code, then enter the verification code.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                  <QRCodeSVG value={qrCode} size={200} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Manual Entry Key</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={secret}
                    readOnly
                    className="font-mono text-sm bg-gray-50 dark:bg-gray-800"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copySecret}
                    className="px-3"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Use this key if you can't scan the QR code
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center text-lg font-mono"
                />
              </div>

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
                onClick={() => {
                  setStep('setup');
                  setError('');
                }}
                className="border-gray-200 dark:border-gray-700"
              >
                Back
              </Button>
              <Button
                onClick={handleVerify2FA}
                disabled={loading || !verificationCode.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Verify & Enable
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'backup' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>2FA Enabled Successfully!</span>
              </DialogTitle>
              <DialogDescription>
                Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Backup Codes</CardTitle>
                  <CardDescription className="text-sm">
                    Each code can only be used once
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="p-2 bg-white dark:bg-gray-900 rounded border text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyBackupCodes}
                      className="flex-1"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadBackupCodes}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <p className="font-medium">Important:</p>
                    <p>Store these codes safely. You won't be able to see them again.</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleComplete}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Complete Setup
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}