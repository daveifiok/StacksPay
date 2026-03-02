import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApiClient, PaymentCreateRequest, PaymentLinkRequest, PaymentUpdateRequest } from '@/lib/api/payment-api';
import { paymentWidgetApiClient } from '@/lib/api/payment-widget-api';
import { usePaymentStore } from '@/stores/payment-store';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const paymentQueryKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...paymentQueryKeys.lists(), filters] as const,
  details: () => [...paymentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentQueryKeys.details(), id] as const,
  status: (id: string) => [...paymentQueryKeys.all, 'status', id] as const,
  analytics: () => [...paymentQueryKeys.all, 'analytics'] as const,
  exchangeRates: () => ['exchange-rates'] as const,
};

// Hook for listing payments with filters
export const usePayments = (query?: {
  status?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const { setPayments, setLoading, setError, setPagination } = usePaymentStore();

  return useQuery({
    queryKey: paymentQueryKeys.list(query || {}),
    queryFn: async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await paymentApiClient.listPaymentsForMerchant(query);
        
        if (response.success && response.data) {
          setPayments(response.data.payments);
          setPagination(response.data.pagination.total, response.data.pagination.totalPages);
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to fetch payments');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payments';
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook for getting a single payment
export const usePayment = (paymentId: string | undefined) => {
  const { setSelectedPayment } = usePaymentStore();

  return useQuery({
    queryKey: paymentQueryKeys.detail(paymentId!),
    queryFn: async () => {
      if (!paymentId) return null;
      
      const response = await paymentApiClient.getPaymentForMerchant(paymentId);
      
      if (response.success && response.data) {
        setSelectedPayment(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch payment');
      }
    },
    enabled: !!paymentId,
    staleTime: 10000, // 10 seconds
    retry: 2,
  });
};

// Hook for payment status (public endpoint)
export const usePaymentStatus = (paymentId: string | undefined) => {
  return useQuery({
    queryKey: paymentQueryKeys.status(paymentId!),
    queryFn: async () => {
      if (!paymentId) return null;
      
      const response = await paymentApiClient.getPaymentStatus(paymentId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch payment status');
      }
    },
    enabled: !!paymentId,
    refetchInterval: (query) => {
      // Auto-refresh every 5 seconds for pending payments
      const data = query.state.data;
      if (data?.status === 'pending' || data?.status === 'processing') {
        return 5000;
      }
      return false;
    },
    staleTime: 0, // Always fetch fresh status
    retry: 3,
  });
};

// Hook for creating payments
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { addPayment, setLoading, setError } = usePaymentStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentData: PaymentCreateRequest) => {
      setLoading(true);
      setError(null);
      
      const response = await paymentApiClient.createPaymentForMerchant(paymentData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create payment');
      }
    },
    onSuccess: (payment) => {
      addPayment(payment);
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.lists() });
      toast({
        title: "Success",
        description: "Payment created successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// Hook for creating payment links
export const useCreatePaymentLink = () => {
  const queryClient = useQueryClient();
  const { setGeneratedPaymentLink, setLoading, setError } = usePaymentStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (linkData: PaymentLinkRequest) => {
      setLoading(true);
      setError(null);
      
      const response = await paymentWidgetApiClient.createPaymentLink(linkData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || response.message || 'Failed to create payment link');
      }
    },
    onSuccess: (paymentLink) => {
      setGeneratedPaymentLink(paymentLink);
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.lists() });
      toast({
        title: "Success",
        description: "Payment link created successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment link';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// Hook for updating payment status
export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  const { updatePayment, setLoading, setError } = usePaymentStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ paymentId, updateData }: { 
      paymentId: string; 
      updateData: PaymentUpdateRequest 
    }) => {
      setLoading(true);
      setError(null);
      
      const response = await paymentApiClient.updatePaymentForMerchant(paymentId, updateData);
      
      if (response.success) {
        return { paymentId, updateData };
      } else {
        throw new Error(response.error || 'Failed to update payment');
      }
    },
    onSuccess: ({ paymentId, updateData }) => {
      updatePayment(paymentId, { status: updateData.status as any });
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.detail(paymentId) });
      toast({
        title: "Success",
        description: "Payment updated successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// Hook for cancelling payments
export const useCancelPayment = () => {
  const queryClient = useQueryClient();
  const { updatePayment, setLoading, setError } = usePaymentStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      setLoading(true);
      setError(null);
      
      const response = await paymentApiClient.cancelPaymentForMerchant(paymentId);
      
      if (response.success) {
        return paymentId;
      } else {
        throw new Error(response.error || 'Failed to cancel payment');
      }
    },
    onSuccess: (paymentId) => {
      updatePayment(paymentId, { status: 'cancelled' as any });
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.detail(paymentId) });
      toast({
        title: "Success",
        description: "Payment cancelled successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel payment';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// Hook for refunding payments
export const useRefundPayment = () => {
  const queryClient = useQueryClient();
  const { updatePayment, setLoading, setError } = usePaymentStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      paymentId, 
      refundData 
    }: { 
      paymentId: string; 
      refundData: {
        amount?: number;
        reason?: string;
        blockchainRefundData: {
          transactionId: string;
          blockHeight?: number;
          status?: 'pending' | 'confirmed';
          feesPaid?: number;
        };
      }
    }) => {
      setLoading(true);
      setError(null);
      
      const response = await paymentApiClient.refundPaymentForMerchant(paymentId, refundData);
      
      if (response.success) {
        return paymentId;
      } else {
        throw new Error(response.error || 'Failed to process refund');
      }
    },
    onSuccess: (paymentId) => {
      updatePayment(paymentId, { status: 'refunded' });
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.detail(paymentId) });
      toast({
        title: "Success",
        description: "Refund processed successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process refund';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// Hook for verifying payments
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  const { updatePayment, setLoading, setError } = usePaymentStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      paymentId, 
      verificationData 
    }: { 
      paymentId: string; 
      verificationData: {
        signature: string;
        blockchainData?: {
          txId?: string;
          txHash?: string;
          blockHeight?: number;
          confirmations?: number;
          timestamp?: string;
        };
        customerWalletAddress?: string;
      }
    }) => {
      setLoading(true);
      setError(null);
      
      const response = await paymentApiClient.verifyPaymentForMerchant(paymentId, verificationData);
      
      if (response.success) {
        return { paymentId, verificationData };
      } else {
        throw new Error(response.error || 'Failed to verify payment');
      }
    },
    onSuccess: ({ paymentId, verificationData }) => {
      updatePayment(paymentId, { 
        status: 'confirmed',
        transactionData: {
          txId: verificationData.blockchainData?.txId || verificationData.blockchainData?.txHash,
          confirmations: verificationData.blockchainData?.confirmations,
          timestamp: verificationData.blockchainData?.timestamp || new Date().toISOString(),
        }
      });
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.detail(paymentId) });
      toast({
        title: "Success",
        description: "Payment verified and confirmed",
        variant: "default",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify payment';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// Hook for exchange rates
export const useExchangeRates = () => {
  return useQuery({
    queryKey: paymentQueryKeys.exchangeRates(),
    queryFn: async () => {
      const response = await paymentApiClient.getExchangeRates();
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch exchange rates');
      }
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
  });
};

// Hook for payment analytics
export const usePaymentAnalytics = (query?: {
  startDate?: string;
  endDate?: string;
  currency?: string;
  paymentMethod?: string;
}) => {
  return useQuery({
    queryKey: [...paymentQueryKeys.analytics(), query || {}],
    queryFn: async () => {
      const response = await paymentApiClient.getPaymentAnalytics(query);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch payment analytics');
      }
    },
    staleTime: 300000, // 5 minutes
    retry: 2,
  });
};

// Hook for generating QR codes
export const useGenerateQRCode = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ paymentId, size }: { paymentId: string; size?: number }) => {
      const response = await paymentApiClient.generateQRCode(paymentId, size);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to generate QR code');
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Utility function to refresh payment data
export const useRefreshPayments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: paymentQueryKeys.lists() });
    toast({
      title: "Success",
      description: "Payment data refreshed",
      variant: "default",
    });
  };
};

// Hook for real-time payment updates (using polling)
export const usePaymentPolling = (paymentId: string | undefined, enabled: boolean = false) => {
  const { updatePayment } = usePaymentStore();

  return useQuery({
    queryKey: paymentQueryKeys.status(paymentId!),
    queryFn: async () => {
      if (!paymentId) return null;
      
      const response = await paymentApiClient.getPaymentStatus(paymentId);
      
      if (response.success && response.data) {
        // Update the payment in the store if status changed
        updatePayment(paymentId, {
          status: response.data.status as any,
          depositAddress: response.data.depositAddress,
        });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch payment status');
      }
    },
    enabled: enabled && !!paymentId,
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: false,
    retry: 1,
  });
};

export default {
  usePayments,
  usePayment,
  usePaymentStatus,
  useCreatePayment,
  useCreatePaymentLink,
  useUpdatePayment,
  useCancelPayment,
  useRefundPayment,
  useVerifyPayment,
  useExchangeRates,
  usePaymentAnalytics,
  useGenerateQRCode,
  useRefreshPayments,
  usePaymentPolling,
};