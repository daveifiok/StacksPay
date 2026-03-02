import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Notification } from '@/lib/api/notification-api';

export interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean; // For dropdown/modal state
  lastFetched: number | null;
  
  // UI State
  filter: 'all' | 'unread' | 'read';
  selectedType: Notification['type'] | 'all';
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  
  // UI Actions
  setIsOpen: (open: boolean) => void;
  setFilter: (filter: 'all' | 'unread' | 'read') => void;
  setSelectedType: (type: Notification['type'] | 'all') => void;
  toggleOpen: () => void;
  
  // Utilities
  getFilteredNotifications: () => Notification[];
  getUnreadNotifications: () => Notification[];
  getNotificationsByType: (type: Notification['type']) => Notification[];
  hasUnreadNotifications: () => boolean;
  
  // Real-time updates
  addRealtimeNotification: (notification: Notification) => void;
  markRealtimeAsRead: (id: string) => void;
  updateRealtimeUnreadCount: (count: number) => void;
  
  // Cache management
  setLastFetched: (timestamp: number) => void;
  shouldRefetch: () => boolean;
  clearCache: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        notifications: [],
        unreadCount: 0,
        isOpen: false,
        lastFetched: null,
        filter: 'all',
        selectedType: 'all',

        // Core actions
        setNotifications: (notifications) => {
          set({ 
            notifications,
            lastFetched: Date.now()
          });
        },

        addNotification: (notification) => {
          set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: notification.status === 'unread' 
              ? state.unreadCount + 1 
              : state.unreadCount,
          }));
        },

        updateNotification: (id, updates) => {
          set((state) => ({
            notifications: state.notifications.map((notif) =>
              notif.id === id ? { ...notif, ...updates } : notif
            ),
          }));
        },

        removeNotification: (id) => {
          set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            const wasUnread = notification?.status === 'unread';
            
            return {
              notifications: state.notifications.filter((notif) => notif.id !== id),
              unreadCount: wasUnread 
                ? Math.max(0, state.unreadCount - 1) 
                : state.unreadCount,
            };
          });
        },

        setUnreadCount: (unreadCount) => {
          set({ unreadCount: Math.max(0, unreadCount) });
        },

        markAsRead: (id) => {
          set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            const wasUnread = notification?.status === 'unread';
            
            return {
              notifications: state.notifications.map((notif) =>
                notif.id === id 
                  ? { ...notif, status: 'read' as const, readAt: new Date().toISOString() } 
                  : notif
              ),
              unreadCount: wasUnread 
                ? Math.max(0, state.unreadCount - 1) 
                : state.unreadCount,
            };
          });
        },

        markAllAsRead: () => {
          set((state) => ({
            notifications: state.notifications.map((notif) => ({
              ...notif,
              status: 'read' as const,
              readAt: notif.readAt || new Date().toISOString(),
            })),
            unreadCount: 0,
          }));
        },

        // UI actions
        setIsOpen: (isOpen) => {
          set({ isOpen });
        },

        setFilter: (filter) => {
          set({ filter });
        },

        setSelectedType: (selectedType) => {
          set({ selectedType });
        },

        toggleOpen: () => {
          set((state) => ({ isOpen: !state.isOpen }));
        },

        // Computed getters
        getFilteredNotifications: () => {
          const { notifications, filter, selectedType } = get();
          
          let filtered = notifications;
          
          // Filter by status
          if (filter === 'unread') {
            filtered = filtered.filter(n => n.status === 'unread');
          } else if (filter === 'read') {
            filtered = filtered.filter(n => n.status === 'read');
          }
          
          // Filter by type
          if (selectedType !== 'all') {
            filtered = filtered.filter(n => n.type === selectedType);
          }
          
          return filtered.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        },

        getUnreadNotifications: () => {
          return get().notifications.filter(n => n.status === 'unread');
        },

        getNotificationsByType: (type) => {
          return get().notifications.filter(n => n.type === type);
        },

        hasUnreadNotifications: () => {
          return get().unreadCount > 0;
        },

        // Real-time update handlers
        addRealtimeNotification: (notification) => {
          set((state) => {
            // Check if notification already exists to prevent duplicates
            const exists = state.notifications.some(n => n.id === notification.id);
            if (exists) return state;
            
            return {
              notifications: [notification, ...state.notifications],
              unreadCount: notification.status === 'unread' 
                ? state.unreadCount + 1 
                : state.unreadCount,
            };
          });
        },

        markRealtimeAsRead: (id) => {
          get().markAsRead(id);
        },

        updateRealtimeUnreadCount: (count) => {
          set({ unreadCount: Math.max(0, count) });
        },

        // Cache management
        setLastFetched: (lastFetched) => {
          set({ lastFetched });
        },

        shouldRefetch: () => {
          const { lastFetched } = get();
          if (!lastFetched) return true;
          
          // Refetch if data is older than 5 minutes
          const fiveMinutes = 5 * 60 * 1000;
          return Date.now() - lastFetched > fiveMinutes;
        },

        clearCache: () => {
          set({
            notifications: [],
            unreadCount: 0,
            lastFetched: null,
            isOpen: false,
            filter: 'all',
            selectedType: 'all',
          });
        },
      }),
      {
        name: 'notification-storage',
        partialize: (state) => ({
          unreadCount: state.unreadCount,
          filter: state.filter,
          selectedType: state.selectedType,
          // Don't persist notifications - they should be fresh from server
        }),
      }
    ),
    {
      name: 'notification-store',
    }
  )
);
