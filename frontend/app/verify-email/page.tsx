'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import Logo from '@/components/shared/Logo';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');
  const { verifyEmail, isVerifyingEmail, verifyEmailError } = useAuth();
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('Missing verification token');
      return;
    }

    // Auto-verify when component mounts
    verifyEmail(token);
  }, [token, verifyEmail]);

  useEffect(() => {
    if (verifyEmailError) {
      setVerificationStatus('error');
      setErrorMessage(verifyEmailError.message || 'Verification failed');
    }
  }, [verifyEmailError]);

  useEffect(() => {
    if (!isVerifyingEmail && !verifyEmailError) {
      setVerificationStatus('success');
    }
  }, [isVerifyingEmail, verifyEmailError]);

  const handleContinue = () => {
    if (verificationStatus === 'success') {
      router.push('/login?verified=true');
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-100 dark:bg-orange-950/30 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-100 dark:bg-blue-950/30 rounded-full blur-3xl opacity-50"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-2xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <Logo size="md" showText={false} />
            </div>

            {verificationStatus === 'loading' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Verifying Email
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we verify your email address...
                </p>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Email Verified!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Your email address has been successfully verified. You can now access all features of your StacksPay account.
                </p>
                <Button
                  onClick={handleContinue}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg"
                >
                  Continue to Dashboard
                </Button>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Verification Failed
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {errorMessage === 'Email already verified' 
                    ? 'This email has already been verified. You can sign in to your account.'
                    : errorMessage === 'Invalid or expired verification token'
                    ? 'This verification link has expired or is invalid. Please register again to receive a new verification email.'
                    : 'We encountered an error while verifying your email address.'
                  }
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={handleContinue}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg"
                  >
                    {errorMessage === 'Email already verified' ? 'Sign In' : 'Register Again'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/')}
                    className="w-full text-gray-600 dark:text-gray-400"
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Mail className="w-3 h-3" />
              <span>Email Verification</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}