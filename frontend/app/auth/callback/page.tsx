'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api/auth-api';
import { useAuthStore } from '@/stores/auth-store';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const sessionId = searchParams.get('sessionId');
        const provider = searchParams.get('provider');

        if (!sessionId) {
          setError('No session ID received from OAuth provider');
          setStatus('error');
          return;
        }

        // Exchange session for JWT tokens using the API client
        const response = await apiClient.exchangeSessionForTokens(sessionId);

        if (!response.success) {
          // Handle error object or string
          const errorMessage = typeof response.error === 'string' 
            ? response.error 
            : (response.error as any)?.message || (response.error as any)?.userMessage || 'Failed to authenticate with OAuth provider';
          setError(errorMessage);
          setStatus('error');
          return;
        }

        // Store tokens in localStorage
        if (response.token) {
          localStorage.setItem('authToken', response.token);
        }
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }

        // Set user in auth store
        if (response.merchant) {
          setUser({
            id: response.merchant.id,
            name: response.merchant.name,
            email: response.merchant.email,
            stacksAddress: response.merchant.stacksAddress,
            emailVerified: response.merchant.emailVerified,
            verificationLevel: response.merchant.verificationLevel,
            businessType: response.merchant.businessType,
            authMethod: response.merchant.authMethod,
            walletConnected: !!response.merchant.stacksAddress,
          });
        }

        setStatus('success');
        
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);

      } catch (error: any) {
        console.error('OAuth callback error:', error);
        // Handle error object or string
        const errorMessage = typeof error === 'object' && error?.userMessage 
          ? error.userMessage 
          : typeof error === 'object' && error?.message
          ? error.message
          : typeof error === 'string'
          ? error
          : 'An unexpected error occurred during authentication';
        setError(errorMessage);
        setStatus('error');
      }
    };

    handleOAuthCallback();
  }, [searchParams, router, setUser]);

  // Handle errors by redirecting to login
  useEffect(() => {
    if (status === 'error') {
      const timer = setTimeout(() => {
        router.push('/login?error=oauth_callback_failed');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Elements - matching your hero section */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900" />
      
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.5) 1px, transparent 0), radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px, 40px 40px'
        }}
      />

      {/* Dark mode accent overlay */}
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 pointer-events-none" />

      {/* Main Content Card */}
      <div className="relative max-w-md w-full mx-4">
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-black/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {status === 'loading' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="mx-auto h-16 w-16 relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 animate-pulse" />
                    <div className="absolute inset-2 rounded-full bg-white dark:bg-black flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Completing Authentication
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Please wait while we securely log you in...
                    </p>
                  </div>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto h-16 w-16 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center"
                  >
                    <motion.svg
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="h-8 w-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Welcome to StacksPay!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Authentication successful. Taking you to your dashboard...
                    </p>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.8, duration: 2 }}
                    className="h-1 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                  />
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto h-16 w-16 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Authentication Failed
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      {error}
                    </p>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.8, duration: 3 }}
                    className="h-1 bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Redirecting you back to login...
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Floating elements for visual interest */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-8 -right-8 w-6 h-6 bg-orange-400/20 rounded-full blur-sm"
        />
        
        <motion.div
          animate={{
            y: [0, 8, 0],
            rotate: [0, -3, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-6 -left-6 w-4 h-4 bg-blue-400/20 rounded-full blur-sm"
        />
      </div>
    </div>
  );
}
