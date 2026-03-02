import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Payment, PaymentCreateRequest, PaymentLinkRequest } from '@/lib/api/payment-api';

interface PaymentState {
  // State
  payments: Payment[];
  selectedPayment: Payment | null;
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalPayments: number;
  
  // Filters
  statusFilter: string;
  paymentMethodFilter: string;
  searchQuery: string;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };

  // Payment Link State
  generatedPaymentLink: {
    id: string;
    url: string;
    qrCode: string;
    paymentAddress: string; // The unique STX address for this payment
    expiresAt?: string;
  } | null;

  // Actions
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (paymentId: string, updates: Partial<Payment>) => void;
  removePayment: (paymentId: string) => void;
  setSelectedPayment: (payment: Payment | null) => void;
  
  // Filters and Search
  setStatusFilter: (status: string) => void;
  setPaymentMethodFilter: (method: string) => void;
  setSearchQuery: (query: string) => void;
  setDateRange: (range: { startDate: string | null; endDate: string | null }) => void;
  
  // Pagination
  setCurrentPage: (page: number) => void;
  setPagination: (total: number, pages: number) => void;
  
  // Loading and Error States
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Payment Link Actions
  setGeneratedPaymentLink: (link: PaymentState['generatedPaymentLink']) => void;
  clearGeneratedPaymentLink: () => void;
  
  // Utility Actions
  reset: () => void;
  clearFilters: () => void;
}

const initialState = {
  payments: [],
  selectedPayment: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalPayments: 0,
  statusFilter: 'all',
  paymentMethodFilter: 'all',
  searchQuery: '',
  dateRange: {
    startDate: null,
    endDate: null,
  },
  generatedPaymentLink: null,
};

export const usePaymentStore = create<PaymentState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Payment Management
      setPayments: (payments) => set({ payments }, false, 'setPayments'),
      
      addPayment: (payment) => set((state) => ({
        payments: [payment, ...state.payments],
        totalPayments: state.totalPayments + 1,
      }), false, 'addPayment'),
      
      updatePayment: (paymentId, updates) => set((state) => ({
        payments: state.payments.map(payment =>
          payment.id === paymentId ? { ...payment, ...updates } : payment
        ),
        selectedPayment: state.selectedPayment?.id === paymentId 
          ? { ...state.selectedPayment, ...updates }
          : state.selectedPayment,
      }), false, 'updatePayment'),
      
      removePayment: (paymentId) => set((state) => ({
        payments: state.payments.filter(payment => payment.id !== paymentId),
        selectedPayment: state.selectedPayment?.id === paymentId ? null : state.selectedPayment,
        totalPayments: Math.max(0, state.totalPayments - 1),
      }), false, 'removePayment'),
      
      setSelectedPayment: (payment) => set({ selectedPayment: payment }, false, 'setSelectedPayment'),

      // Filters and Search
      setStatusFilter: (statusFilter) => set({ statusFilter, currentPage: 1 }, false, 'setStatusFilter'),
      
      setPaymentMethodFilter: (paymentMethodFilter) => set({ 
        paymentMethodFilter, 
        currentPage: 1 
      }, false, 'setPaymentMethodFilter'),
      
      setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }, false, 'setSearchQuery'),
      
      setDateRange: (dateRange) => set({ dateRange, currentPage: 1 }, false, 'setDateRange'),

      // Pagination
      setCurrentPage: (currentPage) => set({ currentPage }, false, 'setCurrentPage'),
      
      setPagination: (totalPayments, totalPages) => set({ 
        totalPayments, 
        totalPages 
      }, false, 'setPagination'),

      // Loading and Error States
      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
      
      setError: (error) => set({ error }, false, 'setError'),

      // Payment Link Actions
      setGeneratedPaymentLink: (generatedPaymentLink) => set({ 
        generatedPaymentLink 
      }, false, 'setGeneratedPaymentLink'),
      
      clearGeneratedPaymentLink: () => set({ 
        generatedPaymentLink: null 
      }, false, 'clearGeneratedPaymentLink'),

      // Utility Actions
      reset: () => set(initialState, false, 'reset'),
      
      clearFilters: () => set({
        statusFilter: 'all',
        paymentMethodFilter: 'all',
        searchQuery: '',
        dateRange: { startDate: null, endDate: null },
        currentPage: 1,
      }, false, 'clearFilters'),
    }),
    {
      name: 'payment-store',
      partialize: (state: PaymentState) => ({
        // Only persist filters and pagination preferences
        statusFilter: state.statusFilter,
        paymentMethodFilter: state.paymentMethodFilter,
        currentPage: state.currentPage,
        dateRange: state.dateRange,
      }),
    }
  )
);

// Computed selectors for filtered payments
export const useFilteredPayments = () => {
  const {
    payments,
    statusFilter,
    paymentMethodFilter,
    searchQuery,
    dateRange,
  } = usePaymentStore();

  return payments.filter((payment) => {
    // Status filter
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    // Payment method filter
    const matchesPaymentMethod = paymentMethodFilter === 'all' || 
                                  payment.paymentMethod === paymentMethodFilter;
    
    // Search query (search in customer info, payment ID, description)
    const matchesSearch = !searchQuery || 
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customerInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customerInfo?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date range filter
    const matchesDateRange = !dateRange.startDate && !dateRange.endDate ? true :
      (() => {
        const paymentDate = new Date(payment.createdAt);
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
        
        if (startDate && paymentDate < startDate) return false;
        if (endDate && paymentDate > endDate) return false;
        return true;
      })();

    return matchesStatus && matchesPaymentMethod && matchesSearch && matchesDateRange;
  });
};

// Payment statistics selector
export const usePaymentStats = () => {
  const payments = usePaymentStore((state) => state.payments);

  const stats = {
    totalPayments: payments.length,
    completedPayments: payments.filter(p => p.status === 'confirmed').length,
    pendingPayments: payments.filter(p => p.status === 'pending' || p.status === 'processing').length,
    failedPayments: payments.filter(p => p.status === 'failed' || p.status === 'expired').length,
    totalVolume: payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, payment) => sum + payment.amount, 0),
    successRate: payments.length > 0 
      ? (payments.filter(p => p.status === 'confirmed').length / payments.length) * 100 
      : 0,
  };

  return stats;
};

export default usePaymentStore;