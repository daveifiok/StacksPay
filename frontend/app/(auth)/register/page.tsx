'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  Globe, 
  TrendingUp, 
  Eye, 
  EyeOff,
  Wallet,
  Chrome,
  Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useWalletAuth } from '@/hooks/use-wallet-auth';
import { useAuth } from '@/hooks/use-auth';
import Logo from '@/components/shared/Logo';

const features = [
  {
    icon: Zap,
    title: 'Instant Settlements',
    description: 'Real-time Bitcoin payments with sub-second confirmations',
  },
  {
    icon: Shield,
    title: 'Advanced Security',
    description: 'Bank-grade encryption with non-custodial wallet integration',
  },
  {
    icon: Globe,
    title: 'Global Infrastructure',
    description: 'Built on Stacks blockchain with worldwide accessibility',
  },
  {
    icon: TrendingUp,
    title: 'Zero Risk Payments',
    description: 'Immutable transactions eliminate payment disputes',
  },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessType: '',
    acceptTerms: false,
    marketingConsent: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { register: registerWithWallet, isRegistering, registerError: walletRegisterError } = useWalletAuth();
  const { 
    registerWithEmail, 
    isRegisterLoading, 
    registerError,
    clearError,
    isAuthenticated 
  } = useAuth();

  // Check for OAuth results
  useEffect(() => {
    const auth = searchParams?.get('auth');
    const oauthError = searchParams?.get('error');
    
    if (auth === 'success') {
      // OAuth registration was successful, redirect to onboarding
      router.push('/dashboard/onboarding');
    }
    
    if (oauthError) {
      if (oauthError === 'oauth_failed') {
        setError('OAuth authentication failed. Please try again.');
      } else if (oauthError === 'oauth_error') {
        setError('An error occurred during OAuth authentication. Please try again.');
      }
    }
  }, [searchParams, router]);

  // Handle successful registration
  useEffect(() => {
    if (isAuthenticated && !isRegisterLoading && !registerError) {
      router.push('/dashboard/onboarding');
    }
  }, [isAuthenticated, isRegisterLoading, registerError, router]);

  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (!formData.acceptTerms) {
      setValidationError('Please accept the terms and conditions');
      return;
    }

    registerWithEmail({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      businessType: formData.businessType,
      acceptTerms: formData.acceptTerms,
      marketingConsent: formData.marketingConsent,
    });
  };

      const handleWalletRegister = async () => {
    setWalletLoading(true);
    setError('');
    try {
      await registerWithWallet();
      // Success is handled by the mutation's onSuccess callback
      // which will redirect to the appropriate page
    } catch (error) {
      console.error('Wallet registration error:', error);
      setError(error instanceof Error ? error.message : 'Wallet registration failed');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };


  return (
    <div className="grid lg:grid-cols-2 gap-0 min-h-screen pt-16">
          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative sm:flex justify-center hidden  p-8 lg:p-12 bg-gray-50 dark:bg-gray-900"
          >
            <div className="max-w-lg space-y-6">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center space-x-2 text-orange-600 font-semibold text-sm mb-6"
              >
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                <span>STACKSPAY</span>
              </motion.div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                Bitcoin Payments
                <br />
                <span className="text-orange-600">Made Simple</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Modern Bitcoin payment infrastructure built for businesses. 
                Secure, fast, and reliable payment processing.
              </p>
            </div>

            <div className="space-y-2">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="group flex items-center space-x-3 p-3 rounded-xl bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-600 dark:bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                    <feature.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-0.5">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            </div>
          </motion.div>

          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 overflow-hidden"
          >
            {/* Unique Brand Pattern Background */}
            <div className="absolute inset-0 opacity-20 dark:opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-300 to-yellow-400 rounded-full blur-2xl"></div>
            </div>
            
            {/* Hexagonal Pattern Overlay */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div 
                className="w-full h-full"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23f97316' stroke-width='1' opacity='0.3'/%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px'
                }}
              />
            </div>
            <div className="w-full max-w-lg relative">
              {/* Unique Form Card */}
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-orange-200 dark:border-orange-800/30 backdrop-blur-sm overflow-hidden">
                {/* Form Content */}
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="mb-4 flex justify-center">
                      <Logo size="md" showText={false} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Create Account
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Start accepting Bitcoin payments today
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Business name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 h-10 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                      placeholder="Your business name"
                    />
                  </div>

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
                      placeholder="business@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Business type
                    </Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}
                      required
                    >
                      <SelectTrigger className="mt-1 h-10 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 rounded-lg">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-900">
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="saas">SaaS Platform</SelectItem>
                        <SelectItem value="marketplace">Marketplace</SelectItem>
                        <SelectItem value="nonprofit">Non-profit</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="fintech">Fintech</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="h-10 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 rounded-lg pr-10"
                        placeholder="Create a strong password"
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

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="h-10 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 rounded-lg pr-10"
                        placeholder="Confirm your password"
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

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="acceptTerms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))
                        }
                        className="mt-0.5"
                      />
                      <Label htmlFor="acceptTerms" className="text-sm text-gray-600 dark:text-gray-400">
                        I agree to StacksPay's{' '}
                        <Link href="/legal/terms" className="text-orange-600 hover:text-orange-500 underline">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/legal/privacy" className="text-orange-600 hover:text-orange-500 underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="marketingConsent"
                        checked={formData.marketingConsent}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, marketingConsent: checked as boolean }))
                        }
                        className="mt-0.5"
                      />
                      <Label htmlFor="marketingConsent" className="text-sm text-gray-600 dark:text-gray-400">
                        Get emails from StacksPay about product updates, industry news, and events. You can{' '}
                        <Link href="/unsubscribe" className="text-orange-600 hover:text-orange-500 underline">
                          unsubscribe
                        </Link>{' '}
                        at any time.{' '}
                        <Link href="/legal/privacy" className="text-orange-600 hover:text-orange-500 underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                  </div>

                  {(validationError || registerError || error || walletRegisterError) && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          {validationError || walletRegisterError?.message || (
                            (registerError?.message || error) === 'Email already registered' ? (
                              <>
                                This email is already registered.{' '}
                                <Link href="/login" className="underline font-medium hover:text-red-600 dark:hover:text-red-400">
                                  Sign in instead
                                </Link>
                              </>
                            ) : (registerError?.message || error)
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isRegisterLoading || !formData.acceptTerms}
                    className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    {isRegisterLoading ? 'Creating account...' : 'Create Account'}
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
                      onClick={handleWalletRegister}
                      disabled={walletLoading || isRegistering}
                      className="w-full h-10 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border-purple-200 dark:border-purple-700/50 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-800/40 dark:hover:to-blue-800/40 text-gray-900 dark:text-gray-100 rounded-lg transition-all duration-200"
                    >
                      <Wallet className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                      {walletLoading || isRegistering ? 'Connecting...' : 'Continue with Stacks Wallet'}
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
                      Already have an account?{' '}
                      <Link href="/login" className="text-orange-600 hover:text-orange-500 font-medium">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
      </div>
  );
}