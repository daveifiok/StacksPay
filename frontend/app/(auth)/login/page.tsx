'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Wallet, Chrome, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useWalletAuth } from '@/hooks/use-wallet-auth';
import { useAuth } from '@/hooks/use-auth';
import Logo from '@/components/shared/Logo';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { login: loginWithWallet, isLoggingIn, loginError: walletLoginError } = useWalletAuth();
  const { 
    loginWithEmail, 
    isLoginLoading, 
    loginError,
    clearError,
    isAuthenticated,
    requires2FA 
  } = useAuth();

  // Check for verification success and OAuth results
  useEffect(() => {
    const verified = searchParams?.get('verified');
    const auth = searchParams?.get('auth');
    const oauthError = searchParams?.get('error');
    
    if (verified === 'true') {
      setShowVerifiedMessage(true);
      // Auto-hide after 5 seconds
      setTimeout(() => setShowVerifiedMessage(false), 5000);
    }
    
    if (auth === 'success') {
      // OAuth login was successful, redirect to dashboard
      router.push('/dashboard');
    }
    
    if (oauthError) {
      if (oauthError === 'oauth_failed') {
        setError('OAuth authentication failed. Please try again.');
      } else if (oauthError === 'oauth_error') {
        setError('An error occurred during OAuth authentication. Please try again.');
      }
    }
  }, [searchParams, router]);

  // Handle successful login
  useEffect(() => {
    if (isAuthenticated && !isLoginLoading && !loginError) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoginLoading, loginError, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setError('');

    loginWithEmail({
      email: formData.email,
      password: formData.password,
      twoFactorCode: requires2FA && twoFactorCode ? twoFactorCode : undefined,
      rememberMe: formData.rememberMe,
    });
  };

  const handleWalletLogin = async () => {
    setWalletLoading(true);
    setError('');
    try {
      await loginWithWallet();
      // Success is handled by the mutation's onSuccess callback
      // which will redirect to the appropriate page
    } catch (error) {
      console.error('Wallet login error:', error);
      setError(error instanceof Error ? error.message : 'Wallet login failed');
    } finally {
      setWalletLoading(false);
    }
  };  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };


  return (
    <div className="flex items-center justify-center min-h-screen p-6 pt-16 bg-gray-50 dark:bg-gray-900">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-100 dark:bg-orange-950/30 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-100 dark:bg-blue-950/30 rounded-full blur-3xl opacity-50"></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >

        <Card className="bg-white dark:bg-gray-900 shadow-2xl border border-orange-200 dark:border-orange-800/30 rounded-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="mb-6 flex justify-center">
                <Logo size="md" showText={false} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to your StacksPay dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 h-10 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  placeholder="merchant@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-orange-600 hover:text-orange-500 font-medium"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="h-10 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 rounded-lg pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {requires2FA && (
                <div className="space-y-2">
                  <Label htmlFor="twoFactorCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Two-Factor Authentication Code
                  </Label>
                  <Input
                    id="twoFactorCode"
                    name="twoFactorCode"
                    type="text"
                    required={requires2FA}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="h-10 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 rounded-lg text-center font-mono text-lg tracking-wider"
                    placeholder="000000"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                  }
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-400">
                  Remember me on this device
                </Label>
              </div>

              {showVerifiedMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      Email verified successfully! You can now sign in to your account.
                    </div>
                  </div>
                </div>
              )}

              {(loginError || error || walletLoginError) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      {walletLoginError?.message || loginError?.message || error}
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoginLoading}
                className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                {isLoginLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">OR</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleWalletLogin}
                  disabled={walletLoading || isLoggingIn}
                  className="w-full h-10 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border-purple-200 dark:border-purple-700/50 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-800/40 dark:hover:to-blue-800/40 text-gray-900 dark:text-gray-100 rounded-lg transition-all duration-200"
                >
                  <Wallet className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                  {walletLoading || isLoggingIn ? 'Connecting...' : 'Continue with Stacks Wallet'}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`}
                    className="w-full h-10 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`}
                    className="w-full h-10 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link href="/register" className="text-orange-600 hover:text-orange-500 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}