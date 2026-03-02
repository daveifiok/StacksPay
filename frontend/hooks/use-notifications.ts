import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { notificationApiClient } from '@/lib/api/notification-api';
import { useNotificationStore } from '@/stores/notification-store';
import { useAuthStore } from '@/stores/auth-store';
import type { NotificationFilters, Notification } from '@/lib/api/notification-api';

export const useNotifications = (filters: NotificationFilters = {}) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const {
    setNotifications,
    setUnreadCount,
    markAsRead: storeMarkAsRead,
    markAllAsRead: storeMarkAllAsRead,
    removeNotification: storeRemoveNotification,
    shouldRefetch,
    setLastFetched,
  } = useNotificationStore();

  // Get notifications query
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationApiClient.getNotifications(filters),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time feel
    retry: 3,
  });

  // Get unread count query (separate for frequent updates)
  const {
    data: unreadCountData,
    isLoading: isLoadingUnreadCount,
    refetch: refetchUnreadCount,
  } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApiClient.getUnreadCount(),
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 1000, // Frequent updates for badge
    retry: 3,
  });

  // Sync server data with store
  useEffect(() => {
    if (notificationsData?.success && notificationsData.data) {
      setNotifications(notificationsData.data.notifications);
      setUnreadCount(notificationsData.data.unreadCount);
      setLastFetched(Date.now());
    }
  }, [notificationsData, setNotifications, setUnreadCount, setLastFetched]);

  useEffect(() => {
    if (unreadCountData?.success && unreadCountData.data) {
      setUnreadCount(unreadCountData.data.unreadCount);
    }
  }, [unreadCountData, setUnreadCount]);

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationApiClient.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      // Optimistic update
      storeMarkAsRead(notificationId);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      
      return { notificationId };
    },
    onSuccess: (response, notificationId) => {
      if (response.success) {
        // Invalidate queries to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      }
    },
    onError: (error, notificationId, context) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      console.error('Failed to mark notification as read:', error);
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApiClient.markAllAsRead(),
    onMutate: async () => {
      // Optimistic update
      storeMarkAllAsRead();
      
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      }
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      console.error('Failed to mark all notifications as read:', error);
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationApiClient.deleteNotification(notificationId),
    onMutate: async (notificationId) => {
      // Optimistic update
      storeRemoveNotification(notificationId);
      
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      
      return { notificationId };
    },
    onSuccess: (response, notificationId) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      }
    },
    onError: (error, notificationId, context) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      console.error('Failed to delete notification:', error);
    },
  });

  // Create test notification (for development)
  const createTestNotificationMutation = useMutation({
    mutationFn: (options: {
      type?: Notification['type'];
      urgency?: Notification['urgency'];
      amount?: number;
      currency?: string;
    }) => notificationApiClient.createTestNotification(options),
    onSuccess: (response) => {
      if (response.success) {
        // Refresh notifications to show the new test notification
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      }
    },
    onError: (error) => {
      console.error('Failed to create test notification:', error);
    },
  });

  // Force refresh function
  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      refetchNotifications(),
      refetchUnreadCount(),
    ]);
  }, [refetchNotifications, refetchUnreadCount]);

  // Real-time update handlers (for WebSocket integration later)
  const handleRealtimeNotification = useCallback((notification: Notification) => {
    // Add to store
    useNotificationStore.getState().addRealtimeNotification(notification);
    
    // Invalidate queries to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
  }, [queryClient]);

  const handleRealtimeRead = useCallback((notificationId: string) => {
    useNotificationStore.getState().markRealtimeAsRead(notificationId);
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
  }, [queryClient]);

  const handleRealtimeUnreadCount = useCallback((count: number) => {
    useNotificationStore.getState().updateRealtimeUnreadCount(count);
  }, []);

  return {
    // Data
    notifications: notificationsData?.data?.notifications || [],
    unreadCount: unreadCountData?.data?.unreadCount || 0,
    pagination: notificationsData?.data?.pagination,
    
    // Loading states
    isLoading: isLoadingNotifications,
    isLoadingUnreadCount,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isCreatingTest: createTestNotificationMutation.isPending,
    
    // Errors
    error: notificationsError,
    markAsReadError: markAsReadMutation.error,
    markAllAsReadError: markAllAsReadMutation.error,
    deleteError: deleteNotificationMutation.error,
    createTestError: createTestNotificationMutation.error,
    
    // Actions
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    createTestNotification: createTestNotificationMutation.mutate,
    refreshNotifications,
    
    // Real-time handlers (for WebSocket integration)
    handleRealtimeNotification,
    handleRealtimeRead,
    handleRealtimeUnreadCount,
    
    // Query utilities
    refetch: refetchNotifications,
    refetchUnreadCount,
  };
};

// Separate hook for just unread count (useful for navbar badge)
export const useUnreadNotificationCount = () => {
  const { isAuthenticated } = useAuthStore();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApiClient.getUnreadCount(),
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 1000, // Frequent updates
    retry: 3,
  });

  const count = data?.data?.unreadCount || 0;

  return {
    unreadCount: count,
    isLoading,
    error,
    hasUnread: count > 0,
  };
};
