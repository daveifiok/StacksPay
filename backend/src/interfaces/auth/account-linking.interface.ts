export interface LinkableAccount {
  id: string;
  email: string;
  authMethod: string;
  name: string;
  createdAt: Date;
  confidence: 'high' | 'medium' | 'low';
  matchingFields: string[];
}

export interface LinkingRequest {
  primaryAccountId: string;
  secondaryAccountId: string;
  linkingToken: string;
  expiresAt: Date;
  confirmedAt?: Date;
  status: 'pending' | 'confirmed' | 'expired' | 'rejected';
  targetEmail?: string; // The email that the user wants to update to
}

export interface LinkedAccount {
  accountId: string;
  authMethod: string;
  email?: string;
  stacksAddress?: string;
  googleId?: string;
  githubId?: string;
  linkedAt: Date;
  isPrimary: boolean;
}

export interface AccountLinkingResult {
  success: boolean;
  error?: string;
  linkingToken?: string;
  expiresAt?: Date;
  linkedAccount?: any;
}

export interface AuthMethodCheckResult {
  canUse: boolean;
  accountId?: string;
  primaryAccountId?: string;
}
