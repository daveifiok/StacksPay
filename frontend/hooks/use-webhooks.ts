import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhookApiClient, WebhookCreateRequest, WebhookUpdateRequest, Webhook, WebhookEvent } from '@/lib/api/webhook-api';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const webhookQueryKeys = {
  all: ['webhooks'] as const,
  lists: () => [...webhookQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...webhookQueryKeys.lists(), filters] as const,
  details: () => [...webhookQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...webhookQueryKeys.details(), id] as const,
  events: () => [...webhookQueryKeys.all, 'events'] as const,
  event: (id: string) => [...webhookQueryKeys.events(), id] as const,
  webhookEvents: (webhookId: string) => [...webhookQueryKeys.all, 'webhook-events', webhookId] as const,
  stats: () => [...webhookQueryKeys.all, 'stats'] as const,
};

// Hook for listing webhooks
export const useWebhooks = (query?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: webhookQueryKeys.list(query || {}),
    queryFn: async () => {
      const response = await webhookApiClient.listWebhooks(query);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch webhooks');
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook for getting a single webhook
export const useWebhook = (webhookId: string | undefined) => {
  return useQuery({
    queryKey: webhookQueryKeys.detail(webhookId!),
    queryFn: async () => {
      if (!webhookId) return null;
      
      const response = await webhookApiClient.getWebhook(webhookId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch webhook');
      }
    },
    enabled: !!webhookId,
    staleTime: 10000, // 10 seconds
    retry: 2,
  });
};

// Hook for creating webhooks
export const useCreateWebhook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (webhookData: WebhookCreateRequest) => {
      const response = await webhookApiClient.createWebhook(webhookData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create webhook');
      }
    },
    onSuccess: (webhook) => {
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.stats() });
      toast({
        title: "Success",
        description: "Webhook created successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create webhook';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for updating webhooks
export const useUpdateWebhook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ webhookId, updateData }: { 
      webhookId: string; 
      updateData: WebhookUpdateRequest 
    }) => {
      const response = await webhookApiClient.updateWebhook(webhookId, updateData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update webhook');
      }
    },
    onSuccess: (webhook) => {
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.detail(webhook.id) });
      toast({
        title: "Success",
        description: "Webhook updated successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update webhook';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for deleting webhooks
export const useDeleteWebhook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      const response = await webhookApiClient.deleteWebhook(webhookId);
      
      if (response.success) {
        return webhookId;
      } else {
        throw new Error(response.error || 'Failed to delete webhook');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.stats() });
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete webhook';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for testing webhooks
export const useTestWebhook = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ webhookId, eventType }: { 
      webhookId: string; 
      eventType: string 
    }) => {
      const response = await webhookApiClient.testWebhook(webhookId, eventType);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to test webhook');
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Success",
          description: `Webhook test successful (${result.status})`,
        });
      } else {
        toast({
          title: "Error",
          description: `Webhook test failed: ${result.error}`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test webhook';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for regenerating webhook secret
export const useRegenerateWebhookSecret = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      const response = await webhookApiClient.regenerateWebhookSecret(webhookId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to regenerate webhook secret');
      }
    },
    onSuccess: (result, webhookId) => {
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.detail(webhookId) });
      toast({
        title: "Success",
        description: "Webhook secret regenerated successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate webhook secret';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for getting webhook events
export const useWebhookEvents = (webhookId?: string, query?: {
  page?: number;
  limit?: number;
  status?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: webhookId 
      ? webhookQueryKeys.webhookEvents(webhookId)
      : [...webhookQueryKeys.events(), query || {}],
    queryFn: async () => {
      const response = webhookId 
        ? await webhookApiClient.getWebhookEvents(webhookId, query)
        : await webhookApiClient.getAllWebhookEvents(query);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch webhook events');
      }
    },
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Hook for getting a single webhook event
export const useWebhookEvent = (eventId: string | undefined) => {
  return useQuery({
    queryKey: webhookQueryKeys.event(eventId!),
    queryFn: async () => {
      if (!eventId) return null;
      
      const response = await webhookApiClient.getWebhookEvent(eventId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch webhook event');
      }
    },
    enabled: !!eventId,
    staleTime: 5000, // 5 seconds
    retry: 2,
  });
};

// Hook for retrying webhook events
export const useRetryWebhookEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await webhookApiClient.retryWebhookEvent(eventId);
      
      if (response.success) {
        return eventId;
      } else {
        throw new Error(response.error || 'Failed to retry webhook event');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.events() });
      toast({
        title: "Success",
        description: "Webhook event retry initiated",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry webhook event';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for webhook statistics
export const useWebhookStats = (webhookId?: string) => {
  return useQuery({
    queryKey: webhookId 
      ? [...webhookQueryKeys.stats(), webhookId]
      : webhookQueryKeys.stats(),
    queryFn: async () => {
      const response = await webhookApiClient.getWebhookStats(webhookId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch webhook statistics');
      }
    },
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook for real-time webhook event updates (using polling)
export const useWebhookEventPolling = (webhookId?: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: webhookId 
      ? [...webhookQueryKeys.webhookEvents(webhookId), 'polling']
      : [...webhookQueryKeys.events(), 'polling'],
    queryFn: async () => {
      const response = webhookId 
        ? await webhookApiClient.getWebhookEvents(webhookId, { limit: 10 })
        : await webhookApiClient.getAllWebhookEvents({ limit: 10 });
      
      if (response.success && response.data) {
        return response.data.events;
      } else {
        throw new Error(response.error || 'Failed to fetch recent webhook events');
      }
    },
    enabled: enabled,
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: false,
    staleTime: 0, // Always fetch fresh data
    retry: 1,
  });
};

// Utility function to refresh webhook data
export const useRefreshWebhooks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: webhookQueryKeys.lists() });
    queryClient.invalidateQueries({ queryKey: webhookQueryKeys.events() });
    queryClient.invalidateQueries({ queryKey: webhookQueryKeys.stats() });
    toast({
      title: "Success",
      description: "Webhook data refreshed",
    });
  };
};

export default {
  useWebhooks,
  useWebhook,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useRegenerateWebhookSecret,
  useWebhookEvents,
  useWebhookEvent,
  useRetryWebhookEvent,
  useWebhookStats,
  useWebhookEventPolling,
  useRefreshWebhooks,
};
