import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string | null;
  stacksAddress?: string;
  emailVerified: boolean;
  verificationLevel: 'none' | 'basic' | 'full';
  businessType: string;
  walletConnected: boolean;
  profileComplete?: boolean;
  authMethod: 'email' | 'wallet';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requires2FA: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRequires2FA: (requires: boolean) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        requires2FA: false,

        setUser: (user) => {
          set({ 
            user, 
            isAuthenticated: !!user,
            error: null,
            requires2FA: false
          });
        },

        setLoading: (isLoading) => {
          set({ isLoading });
        },

        setRequires2FA: (requires2FA) => {
          set({ requires2FA });
        },

        setError: (error) => {
          set({ error, isLoading: false });
        },

        logout: () => {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          });
          // Clear persisted state
          localStorage.removeItem('auth-storage');
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user, 
          isAuthenticated: state.isAuthenticated 
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);
