import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeyApiClient, ApiKeyCreateRequest, ApiKeyUpdateRequest, ApiKey } from '@/lib/api/api-key-api';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const apiKeyQueryKeys = {
  all: ['apiKeys'] as const,
  lists: () => [...apiKeyQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...apiKeyQueryKeys.lists(), filters] as const,
  details: () => [...apiKeyQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...apiKeyQueryKeys.details(), id] as const,
  usage: (id: string) => [...apiKeyQueryKeys.all, 'usage', id] as const,
  stats: () => [...apiKeyQueryKeys.all, 'stats'] as const,
  permissions: () => [...apiKeyQueryKeys.all, 'permissions'] as const,
};

// Hook for listing API keys
export const useApiKeys = (query?: {
  page?: number;
  limit?: number;
  environment?: 'test' | 'live';
  status?: string;
}) => {
  return useQuery({
    queryKey: apiKeyQueryKeys.list(query || {}),
    queryFn: async () => {
      const response = await apiKeyApiClient.listApiKeys(query);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch API keys');
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook for getting a single API key
export const useApiKey = (keyId: string | undefined) => {
  return useQuery({
    queryKey: apiKeyQueryKeys.detail(keyId!),
    queryFn: async () => {
      if (!keyId) return null;
      
      const response = await apiKeyApiClient.getApiKey(keyId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch API key');
      }
    },
    enabled: !!keyId,
    staleTime: 10000, // 10 seconds
    retry: 2,
  });
};

// Hook for creating API keys
export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (keyData: ApiKeyCreateRequest) => {
      const response = await apiKeyApiClient.createApiKey(keyData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create API key');
      }
    },
    onSuccess: (apiKey) => {
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.stats() });
      toast({
        title: "Success",
        description: "API key created successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create API key';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for updating API keys
export const useUpdateApiKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ keyId, updateData }: { 
      keyId: string; 
      updateData: ApiKeyUpdateRequest 
    }) => {
      const response = await apiKeyApiClient.updateApiKey(keyId, updateData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update API key');
      }
    },
    onSuccess: (apiKey) => {
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.detail(apiKey.keyId) });
      toast({
        title: "Success",
        description: "API key updated successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update API key';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for deleting API keys
export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const response = await apiKeyApiClient.deleteApiKey(keyId);
      
      if (response.success) {
        return keyId;
      } else {
        throw new Error(response.error || 'Failed to delete API key');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.stats() });
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete API key';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for regenerating API keys
export const useRegenerateApiKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const response = await apiKeyApiClient.regenerateApiKey(keyId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to regenerate API key');
      }
    },
    onSuccess: (result, keyId) => {
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.detail(keyId) });
      toast({
        title: "Success",
        description: "API key regenerated successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate API key';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for activating/deactivating API keys
export const useToggleApiKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ keyId, activate }: { keyId: string; activate: boolean }) => {
      const response = activate 
        ? await apiKeyApiClient.activateApiKey(keyId)
        : await apiKeyApiClient.deactivateApiKey(keyId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || `Failed to ${activate ? 'activate' : 'deactivate'} API key`);
      }
    },
    onSuccess: (apiKey, { activate }) => {
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.detail(apiKey.keyId) });
      toast({
        title: "Success",
        description: `API key ${activate ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle API key status';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for testing API keys
export const useTestApiKey = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const response = await apiKeyApiClient.testApiKey(keyId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to test API key');
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Success",
          description: `API key test successful (${result.status}) - Response time: ${result.responseTime}ms`,
        });
      } else {
        toast({
          title: "Error",
          description: `API key test failed: ${result.error}`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test API key';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook for getting API key usage
export const useApiKeyUsage = (keyId: string | undefined, period?: string) => {
  return useQuery({
    queryKey: apiKeyQueryKeys.usage(keyId!),
    queryFn: async () => {
      if (!keyId) return null;
      
      const response = await apiKeyApiClient.getApiKeyUsage(keyId, period);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch API key usage');
      }
    },
    enabled: !!keyId,
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook for API key statistics
export const useApiKeyStats = () => {
  return useQuery({
    queryKey: apiKeyQueryKeys.stats(),
    queryFn: async () => {
      const response = await apiKeyApiClient.getApiKeyStats();
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch API key statistics');
      }
    },
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook for available permissions
export const useAvailablePermissions = () => {
  return useQuery({
    queryKey: apiKeyQueryKeys.permissions(),
    queryFn: async () => {
      const response = await apiKeyApiClient.getAvailablePermissions();
      
      if (response.success && response.data) {
        return response.data.permissions;
      } else {
        throw new Error(response.error || 'Failed to fetch available permissions');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - permissions don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Hook for validating API key
export const useValidateApiKey = () => {
  return useMutation({
    mutationFn: async (key: string) => {
      const response = await apiKeyApiClient.validateApiKey(key);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to validate API key');
      }
    },
  });
};

// Utility function to refresh API key data
export const useRefreshApiKeys = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.lists() });
    queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.stats() });
    toast({
      title: "Success",
      description: "API key data refreshed",
    });
  };
};

// Legacy hook for backward compatibility
export const useRevokeApiKey = () => {
  return useDeleteApiKey();
};

export default {
  useApiKeys,
  useApiKey,
  useCreateApiKey,
  useUpdateApiKey,
  useDeleteApiKey,
  useRegenerateApiKey,
  useToggleApiKey,
  useTestApiKey,
  useApiKeyUsage,
  useApiKeyStats,
  useAvailablePermissions,
  useValidateApiKey,
  useRefreshApiKeys,
  useRevokeApiKey,
};
