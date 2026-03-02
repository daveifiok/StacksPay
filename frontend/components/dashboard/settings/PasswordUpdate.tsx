'use client';

import { useState, useEffect } from 'react';
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
import { Eye, EyeOff, Lock, Copy, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/auth-api';
import { useAuth } from '@/hooks/use-auth';

interface PasswordUpdateProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PasswordUpdate({ isOpen, onOpenChange, onSuccess }: PasswordUpdateProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [hasUpdatedPassword, setHasUpdatedPassword] = useState(true);

  const isWalletUser = user?.authMethod === 'wallet';
  const requiresCurrentPassword = !isWalletUser || hasUpdatedPassword;

  useEffect(() => {
    if (isOpen && isWalletUser) {
      loadGeneratedPassword();
    }
  }, [isOpen, isWalletUser]);

  const loadGeneratedPassword = async () => {
    try {
      const response = await apiClient.getGeneratedPassword();
      if (response.success && response.data) {
        setGeneratedPassword(response.data.generatedPassword);
        setHasUpdatedPassword(response.data.hasUpdatedPassword);
      }
    } catch (error) {
      console.error('Failed to load generated password:', error);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      setError('New password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (requiresCurrentPassword && !currentPassword.trim()) {
      setError('Current password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.updatePassword({
        currentPassword: requiresCurrentPassword ? currentPassword : undefined,
        newPassword,
      });

      if (response.success) {
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        setError(response.error || 'Failed to update password');
      }
    } catch (error) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setGeneratedPassword(null);
  };

  const copyGeneratedPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-orange-600" />
            <span>Update Password</span>
          </DialogTitle>
          <DialogDescription>
            {isWalletUser && !hasUpdatedPassword
              ? 'Set a custom password for your account'
              : 'Change your account password'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show generated password for wallet users who haven't updated */}
          {isWalletUser && !hasUpdatedPassword && generatedPassword && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-blue-900 dark:text-blue-100">
                  Your Generated Password
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  This is your current password. You can set a custom one below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    value={generatedPassword}
                    readOnly
                    className="font-mono text-sm bg-white dark:bg-gray-900"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyGeneratedPassword}
                    className="px-3"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-start space-x-2 text-xs">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <span className="text-yellow-700 dark:text-yellow-300">
                    Save this password securely before updating to a custom one.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Password Field (if required) */}
          {requiresCurrentPassword && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 pr-10"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 pr-10"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Password must be at least 8 characters long</p>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">Security Notice</p>
                <p>You will receive an email notification about this password change.</p>
              </div>
            </div>
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
            onClick={handleClose}
            className="border-gray-200 dark:border-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePassword}
            disabled={loading || !newPassword.trim() || newPassword !== confirmPassword}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Update Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}