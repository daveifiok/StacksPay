import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Link2, Mail, Wallet, Github } from 'lucide-react';
import { LinkingSuggestion } from '@/lib/api/account-linking-api';

interface AccountLinkingSuggestionProps {
  suggestion: LinkingSuggestion;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export function AccountLinkingSuggestionCard({
  suggestion,
  onAccept,
  onDecline,
  isLoading = false,
}: AccountLinkingSuggestionProps) {
  const getAuthMethodIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'wallet':
        return <Wallet className="h-4 w-4" />;
      case 'github':
        return <Github className="h-4 w-4" />;
      case 'google':
        return <Mail className="h-4 w-4" />;
      default:
        return <Link2 className="h-4 w-4" />;
    }
  };

  const getAuthMethodLabel = (method: string) => {
    switch (method) {
      case 'email':
        return 'Email/Password';
      case 'wallet':
        return 'Wallet';
      case 'github':
        return 'GitHub';
      case 'google':
        return 'Google';
      default:
        return method;
    }
  };

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-4">
        <div>
          <p className="font-medium text-orange-800 dark:text-orange-200">
            Account Found
          </p>
          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
            {suggestion.message}
          </p>
        </div>

        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {getAuthMethodIcon(suggestion.targetAccount.authMethod)}
                {suggestion.targetAccount.name}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {getAuthMethodLabel(suggestion.targetAccount.authMethod)}
              </Badge>
            </div>
            <CardDescription className="text-sm">
              {suggestion.targetAccount.email}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={onAccept}
            size="sm"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Linking...' : 'Link Accounts'}
          </Button>
          <Button
            onClick={onDecline}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex-1"
          >
            No Thanks
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
