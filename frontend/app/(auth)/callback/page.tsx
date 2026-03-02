'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';

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

        // Exchange session for JWT tokens
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/session-exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!data.success) {
          // Handle error object or string
          const errorMessage = typeof data.error === 'object' && data.error?.userMessage 
            ? data.error.userMessage 
            : typeof data.error === 'object' && data.error?.message
            ? data.error.message
            : typeof data.error === 'string'
            ? data.error
            : 'Failed to authenticate with OAuth provider';
          setError(errorMessage);
          setStatus('error');
          return;
        }

        // Store tokens in localStorage
        localStorage.setItem('authToken', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        // Set user in auth store
        if (data.merchant) {
          setUser({
            id: data.merchant.id,
            name: data.merchant.name,
            email: data.merchant.email,
            stacksAddress: data.merchant.stacksAddress,
            emailVerified: data.merchant.emailVerified,
            verificationLevel: data.merchant.verificationLevel,
            businessType: data.merchant.businessType,
            authMethod: data.merchant.authMethod,
            walletConnected: !!data.merchant.stacksAddress,
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Completing authentication...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we log you in
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Authentication successful!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Redirecting you to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Authentication failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error}
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Redirecting you back to login...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
