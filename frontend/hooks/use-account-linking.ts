import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountLinkingApi, LinkableAccount, LinkedAccount, LinkingSuggestion } from '@/lib/api/account-linking-api';
import { useToast } from './use-toast';

export function useAccountLinking() {
  const [linkingSuggestion, setLinkingSuggestion] = useState<LinkingSuggestion | null>(null);
  const [intendedEmail, setIntendedEmail] = useState<string | null>(null); // Store the email user wants to update to
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get suggested links
  const {
    data: suggestedLinks,
    isLoading: isLoadingSuggestions,
    refetch: refetchSuggestions
  } = useQuery({
    queryKey: ['account-linking', 'suggestions'],
    queryFn: () => accountLinkingApi.getSuggestedLinks(),
    select: (data) => data.suggestions || [],
    enabled: false, // Only fetch when explicitly called
  });

  // Get linked accounts
  const {
    data: linkedAccounts,
    isLoading: isLoadingLinked,
    refetch: refetchLinkedAccounts
  } = useQuery({
    queryKey: ['account-linking', 'linked'],
    queryFn: () => accountLinkingApi.getLinkedAccounts(),
    select: (data) => data.linkedAccounts || [],
  });

  // Initiate linking mutation
  const initiateLinkingMutation = useMutation({
    mutationFn: (params: { targetAccountId: string; targetEmail?: string }) => 
      accountLinkingApi.initiateLinking(params.targetAccountId, params.targetEmail),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Linking Initiated',
          description: data.message || 'Account linking request sent. Please check your email for confirmation.',
        });
      } else {
        toast({
          title: 'Linking Failed',
          description: data.error || 'Failed to initiate account linking.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Linking Error',
        description: error.message || 'Failed to initiate account linking.',
        variant: 'destructive',
      });
    },
  });

  // Confirm linking mutation
  const confirmLinkingMutation = useMutation({
    mutationFn: (linkingToken: string) => accountLinkingApi.confirmLinking(linkingToken),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Accounts Linked',
          description: 'Your accounts have been successfully linked.',
        });
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['account-linking'] });
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        setLinkingSuggestion(null);
      } else {
        toast({
          title: 'Linking Failed',
          description: data.error || 'Failed to confirm account linking.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Linking Error',
        description: error.message || 'Failed to confirm account linking.',
        variant: 'destructive',
      });
    },
  });

  // Unlink account mutation
  const unlinkAccountMutation = useMutation({
    mutationFn: (accountToUnlink: string) => accountLinkingApi.unlinkAccount(accountToUnlink),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Account Unlinked',
          description: 'Account has been successfully unlinked.',
        });
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['account-linking'] });
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      } else {
        toast({
          title: 'Unlink Failed',
          description: data.error || 'Failed to unlink account.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Unlink Error',
        description: error.message || 'Failed to unlink account.',
        variant: 'destructive',
      });
    },
  });

  // Enhanced update email mutation that handles linking suggestions
  const updateEmailMutation = useMutation({
    mutationFn: (email: string) => {
      setIntendedEmail(email); // Store the email user wants to update to
      return accountLinkingApi.updateEmail(email);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Email Updated',
          description: data.message || 'Email updated successfully. Please check your inbox for verification.',
        });
        // Invalidate auth queries to refresh user data
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      } else if (data.linkingSuggestion) {
        // Handle linking suggestion - don't show success message
        setLinkingSuggestion(data.linkingSuggestion);
        toast({
          title: 'Account Found',
          description: data.linkingSuggestion.message,
        });
      } else {
        toast({
          title: 'Update Failed',
          description: data.error || 'Failed to update email.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Error',
        description: error.message || 'Failed to update email.',
        variant: 'destructive',
      });
    },
  });

  return {
    // Data
    suggestedLinks: suggestedLinks || [],
    linkedAccounts: linkedAccounts || [],
    linkingSuggestion,
    
    // Loading states
    isLoadingSuggestions,
    isLoadingLinked,
    isInitiatingLinking: initiateLinkingMutation.isPending,
    isConfirmingLinking: confirmLinkingMutation.isPending,
    isUnlinking: unlinkAccountMutation.isPending,
    isUpdatingEmail: updateEmailMutation.isPending,
    
    // Actions
    loadSuggestions: refetchSuggestions,
    refreshLinkedAccounts: refetchLinkedAccounts,
    initiateLinking: (targetAccountId: string) => 
      initiateLinkingMutation.mutate({ targetAccountId, targetEmail: intendedEmail || undefined }),
    confirmLinking: confirmLinkingMutation.mutate,
    unlinkAccount: unlinkAccountMutation.mutate,
    updateEmail: updateEmailMutation.mutate,
    clearLinkingSuggestion: () => {
      setLinkingSuggestion(null);
      setIntendedEmail(null);
    },
    
    // Computed values
    hasLinkedAccounts: (linkedAccounts || []).length > 0,
    hasSuggestions: (suggestedLinks || []).length > 0,
  };
}
