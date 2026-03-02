'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Loader, Link2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccountLinking } from '@/hooks/use-account-linking';
import { useAuth } from '@/hooks/use-auth';

export default function LinkAccountsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { confirmLinking } = useAccountLinking();
  const { user } = useAuth();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing confirmation token');
      return;
    }

    const handleConfirmation = async () => {
      setIsConfirming(true);
      try {
        await confirmLinking(token);
        setConfirmed(true);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to confirm account linking');
      } finally {
        setIsConfirming(false);
      }
    };

    handleConfirmation();
  }, [token, confirmLinking, router]);

  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {isConfirming ? (
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : confirmed ? (
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              ) : error ? (
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Link2 className="w-8 h-8 text-blue-600" />
                </div>
              )}
            </div>
            
            <CardTitle className="text-2xl">
              {isConfirming && 'Confirming Account Link'}
              {confirmed && 'Accounts Successfully Linked'}
              {error && 'Confirmation Failed'}
              {!isConfirming && !confirmed && !error && 'Account Linking'}
            </CardTitle>
            
            <CardDescription>
              {isConfirming && 'Please wait while we confirm your account linking...'}
              {confirmed && 'Your accounts have been successfully linked together.'}
              {error && 'There was an issue confirming your account linking.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {confirmed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <Check className="h-4 w-4" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <div className="space-y-2">
                      <p className="font-medium">Account linking completed!</p>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• You can now log in using any linked authentication method</li>
                        <li>• Your payment history and settings have been merged</li>
                        <li>• All API keys remain active and functional</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <p className="font-medium">Error Details:</p>
                  <p className="text-sm mt-1">{error}</p>
                  {token && (
                    <p className="text-sm mt-2 text-red-600 dark:text-red-400">
                      The confirmation link may have expired or been used already.
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!isConfirming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: confirmed ? 2 : 0 }}
              >
                <Button
                  onClick={handleReturnToDashboard}
                  className="w-full"
                  variant={confirmed ? "default" : "outline"}
                >
                  {confirmed ? (
                    <>
                      Continue to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    'Return to Dashboard'
                  )}
                </Button>
              </motion.div>
            )}

            {confirmed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center text-sm text-gray-600 dark:text-gray-400"
              >
                Redirecting to dashboard in a few seconds...
              </motion.p>
            )}
          </CardContent>
        </Card>

        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Logged in as <span className="font-medium">{user.email}</span>
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
