import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { walletService } from '@/lib/services/wallet-service';
import { useAuthStore } from '@/stores/auth-store';

export const useWalletAuth = () => {
  const router = useRouter();
  const { setUser, setLoading, setError } = useAuthStore();

  // Simplified wallet registration - no forms needed!
  const registerMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      setError(null);

      
      const result = await walletService.registerWithWallet();
      
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      return result;
    },
    onSuccess: (response) => {
      if (response.merchant) {
        setUser({
          id: response.merchant.id,
          name: response.merchant.name,
          email: response.merchant.email,
          stacksAddress: response.merchant.stacksAddress,
          emailVerified: response.merchant.emailVerified || false,
          verificationLevel: 'basic' as 'none' | 'basic' | 'full',
          businessType: response.merchant.businessType || '',
          walletConnected: true,
          profileComplete: response.merchant.profileComplete || false,
          authMethod: 'wallet',
        });

        // Redirect based on profile completion
        if (response.merchant.profileComplete) {
          router.push('/dashboard');
        } else {
          router.push('/dashboard/onboarding');
        }
      }
      setLoading(false);
    },
    onError: (error: any) => {
      setError(error.message || 'Wallet registration failed');
      setLoading(false);
    },
  });

  // Login existing merchant with wallet authentication
  const loginMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      setError(null);

      console.log('🔐 Starting wallet login...');
      
      // This calls the enhanced walletService which handles:
      // 1. Wallet connection
      // 2. Challenge retrieval from backend
      // 3. Message signing
      // 4. Backend login API call
      const result = await walletService.loginWithWallet();
      
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      console.log('✅ Wallet login successful');
      return result;
    },
    onSuccess: (response) => {
      if (response.merchant) {
        setUser({
          id: response.merchant.id,
          name: response.merchant.name,
          email: response.merchant.email,
          stacksAddress: response.merchant.stacksAddress,
          emailVerified: response.merchant.emailVerified || false,
          verificationLevel: 'basic' as 'none' | 'basic' | 'full',
          businessType: response.merchant.businessType || '',
          walletConnected: true,
          profileComplete: response.merchant.profileComplete || false,
          authMethod: 'wallet',
        });

        // Redirect to dashboard (existing users should have complete profiles)
        router.push('/dashboard');
      }
      setLoading(false);
    },
    onError: (error: any) => {
      setError(error.message || 'Wallet login failed');
      setLoading(false);
    },
  });

  // Verify wallet signature for payments
  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ 
      paymentId, 
      amount 
    }: { 
      paymentId: string; 
      amount: number; 
    }) => {
      console.log('🔍 Verifying payment signature...');
      
      // This calls the enhanced walletService which handles:
      // 1. Payment challenge retrieval from backend
      // 2. Payment message signing with wallet
      // 3. Backend verification API call
      const result = await walletService.verifyWalletSignature('payment', paymentId, amount);
      
      if (!result.success || !result.verified) {
        throw new Error(result.error || 'Payment verification failed');
      }

      console.log('✅ Payment signature verified');
      return result;
    },
  });

  // Check wallet connection status
  const walletStatusQuery = useQuery({
    queryKey: ['wallet-status'],
    queryFn: async () => {
      const isConnected = await walletService.isWalletConnected();
      if (isConnected) {
        const walletData = await walletService.getCurrentWalletData();
        return { isConnected, walletData };
      }
      return { isConnected: false, walletData: null };
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  return {
    // Simplified Registration - no forms needed!
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    registerSuccess: registerMutation.isSuccess,

    // Login
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    loginSuccess: loginMutation.isSuccess,

    // Payment verification
    verifyPayment: verifyPaymentMutation.mutate,
    isVerifyingPayment: verifyPaymentMutation.isPending,
    verifyPaymentError: verifyPaymentMutation.error,
    verifyPaymentSuccess: verifyPaymentMutation.isSuccess,

    // Wallet status
    walletStatus: walletStatusQuery.data,
    isCheckingWallet: walletStatusQuery.isLoading,
    walletError: walletStatusQuery.error,
    refetchWalletStatus: walletStatusQuery.refetch,

    // Utilities
    disconnectWallet: async () => {
      await walletService.disconnectWallet();
      walletStatusQuery.refetch();
    },
  };
};
