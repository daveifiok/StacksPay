import { Types } from 'mongoose';
import crypto from 'crypto';
import { createLogger } from '@/utils/logger';
import { 
  LinkableAccount, 
  LinkingRequest, 
  LinkedAccount, 
  AccountLinkingResult,
  AuthMethodCheckResult 
} from '@/interfaces/auth/account-linking.interface';

const logger = createLogger('AccountLinkingService');

export class AccountLinkingService {
  /**
   * Detect accounts that could potentially be linked with the given account
   */
  async detectLinkableAccounts(
    currentAccountId: string,
    email?: string,
    stacksAddress?: string,
    name?: string
  ): Promise<LinkableAccount[]> {
    try {
      const { Merchant } = await import('@/models/merchant/Merchant');
      const linkableAccounts: LinkableAccount[] = [];

      // Get current account using Mongoose model to access new fields
      const currentAccount = await Merchant.findById(currentAccountId);
      if (!currentAccount) {
        return [];
      }

      // Skip if account already has linked accounts
      if (currentAccount.linkedAccounts && currentAccount.linkedAccounts.length > 0) {
        return [];
      }

      const searchCriteria: any[] = [];

      // Search by email (exact match)
      if (email && !email.includes('@github.local') && !email.includes('@wallet.local')) {
        searchCriteria.push({ email: email.toLowerCase() });
      }

      // Search by wallet address
      if (stacksAddress) {
        searchCriteria.push({ stacksAddress });
      }

      // Search by name (fuzzy match for business accounts)
      if (name) {
        searchCriteria.push({ 
          name: { $regex: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        });
      }

      if (searchCriteria.length === 0) {
        return [];
      }

      // Find potential matches
      const potentialMatches = await Merchant.find({
        $and: [
          { _id: { $ne: currentAccountId } },
          { $or: searchCriteria },
          {
            $or: [
              { linkedAccounts: { $exists: false } },
              { linkedAccounts: { $size: 0 } },
              { 'linkedAccounts.accountId': { $ne: currentAccountId } }
            ]
          }
        ]
      }).limit(5);

      // Analyze matches and assign confidence scores
      for (const match of potentialMatches) {
        const matchingFields: string[] = [];
        let confidence: 'high' | 'medium' | 'low' = 'low';

        // Email match (highest confidence)
        if (email && match.email && 
            match.email.toLowerCase() === email.toLowerCase() &&
            !match.email.includes('@github.local') && 
            !match.email.includes('@wallet.local')) {
          matchingFields.push('email');
          confidence = 'high';
        }

        // Wallet address match (high confidence)
        if (stacksAddress && match.stacksAddress === stacksAddress) {
          matchingFields.push('stacksAddress');
          confidence = confidence === 'high' ? 'high' : 'high';
        }

        // Name match (medium confidence)
        if (name && match.name && 
            match.name.toLowerCase().includes(name.toLowerCase())) {
          matchingFields.push('name');
          if (confidence === 'low') confidence = 'medium';
        }

        // Only include accounts with at least one meaningful match
        if (matchingFields.length > 0) {
          linkableAccounts.push({
            id: match._id.toString(),
            email: match.email || '',
            authMethod: match.authMethod || 'email',
            name: match.name,
            createdAt: match.createdAt,
            confidence,
            matchingFields
          });
        }
      }

      // Sort by confidence and creation date
      linkableAccounts.sort((a, b) => {
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
          return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      logger.info('Detected linkable accounts', {
        currentAccountId,
        foundAccounts: linkableAccounts.length,
        highConfidence: linkableAccounts.filter(a => a.confidence === 'high').length
      });

      return linkableAccounts;

    } catch (error) {
      logger.error('Error detecting linkable accounts:', error);
      return [];
    }
  }

  /**
   * Initiate account linking process
   */
  async initiateLinking(
    primaryAccountId: string,
    secondaryAccountId: string,
    requestedBy: 'primary' | 'secondary' = 'primary',
    targetEmail?: string // Optional target email to use for confirmation
  ): Promise<AccountLinkingResult> {
    try {
      const { Merchant } = await import('@/models/merchant/Merchant');
      const { emailService } = await import('@/services/email/email-service');

      // Validate both accounts exist
      const [primaryAccount, secondaryAccount] = await Promise.all([
        Merchant.findById(primaryAccountId),
        Merchant.findById(secondaryAccountId)
      ]);

      if (!primaryAccount || !secondaryAccount) {
        return { success: false, error: 'One or both accounts not found' };
      }

      // Check if accounts are already linked
      const isAlreadyLinked = primaryAccount.linkedAccounts?.some(
        (linked: any) => linked.accountId === secondaryAccountId
      ) || secondaryAccount.linkedAccounts?.some(
        (linked: any) => linked.accountId === primaryAccountId
      );

      if (isAlreadyLinked) {
        return { success: false, error: 'Accounts are already linked' };
      }

      // Generate linking token
      const linkingToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store linking request in both accounts
      const linkingRequest: LinkingRequest = {
        primaryAccountId,
        secondaryAccountId,
        linkingToken,
        expiresAt,
        status: 'pending',
        targetEmail: targetEmail // Store the intended email
      };

      await Promise.all([
        Merchant.findByIdAndUpdate(primaryAccountId, {
          $push: { pendingLinkingRequests: linkingRequest }
        }),
        Merchant.findByIdAndUpdate(secondaryAccountId, {
          $push: { pendingLinkingRequests: linkingRequest }
        })
      ]);

      // Send account linking confirmation email to the appropriate account
      const targetAccount = requestedBy === 'primary' ? primaryAccount : secondaryAccount;
      const emailAddress = targetEmail || targetAccount.email; // Use provided targetEmail or fallback to account email

      if (emailAddress) {
        try {
          const emailData = {
            merchantName: targetAccount.name || targetAccount.email || 'Merchant',
            primaryAccount: {
              businessName: primaryAccount.name || primaryAccount.email || 'Primary Account',
              email: targetEmail || primaryAccount.email || '' // Use target email for primary account if provided
            },
            secondaryAccount: {
              businessName: secondaryAccount.name || secondaryAccount.email || 'Secondary Account',
              email: secondaryAccount.email || ''
            },
            linkingMethod: requestedBy === 'primary' ? primaryAccount.authMethod || 'email' : secondaryAccount.authMethod || 'email',
            confirmationToken: linkingToken,
            email: emailAddress, // Add for template compatibility
            recipientEmail: emailAddress // Add for base template
          };

          logger.info('Sending account linking email with data:', {
            targetEmail: emailAddress,
            fullEmailData: JSON.stringify(emailData, null, 2)
          });

          await emailService.sendAccountLinkingEmail(emailAddress, emailData);

          logger.info('Account linking email sent', {
            to: emailAddress,
            primaryAccountId,
            secondaryAccountId
          });
        } catch (emailError) {
          logger.error('Failed to send account linking email:', {
            error: emailError instanceof Error ? emailError.message : String(emailError),
            stack: emailError instanceof Error ? emailError.stack : undefined,
            targetEmail: emailAddress,
            primaryAccountId,
            secondaryAccountId
          });
          // Don't fail the linking process if email fails
        }
      }

      logger.info('Account linking initiated', {
        primaryAccountId,
        secondaryAccountId,
        requestedBy,
        linkingToken: linkingToken.substring(0, 8) + '...'
      });

      return {
        success: true,
        linkingToken,
        expiresAt
      };

    } catch (error) {
      logger.error('Error initiating account linking:', error);
      return { success: false, error: 'Failed to initiate linking process' };
    }
  }

  /**
   * Confirm account linking with token
   */
  async confirmLinking(
    linkingToken: string,
    confirmingAccountId: string
  ): Promise<AccountLinkingResult> {
    try {
      const { Merchant } = await import('@/models/merchant/Merchant');

      // Find the linking request
      const accountWithRequest = await Merchant.findOne({
        'pendingLinkingRequests.linkingToken': linkingToken,
        'pendingLinkingRequests.status': 'pending',
        'pendingLinkingRequests.expiresAt': { $gt: new Date() }
      });

      if (!accountWithRequest) {
        return { success: false, error: 'Invalid or expired linking token' };
      }

      const linkingRequest = accountWithRequest.pendingLinkingRequests?.find(
        (req: any) => req.linkingToken === linkingToken
      );

      if (!linkingRequest) {
        return { success: false, error: 'Linking request not found' };
      }

      // Verify the confirming account is part of the linking request
      if (confirmingAccountId !== linkingRequest.primaryAccountId && 
          confirmingAccountId !== linkingRequest.secondaryAccountId) {
        return { success: false, error: 'Unauthorized to confirm this linking request' };
      }

      // Get both accounts
      const [primaryAccount, secondaryAccount] = await Promise.all([
        Merchant.findById(linkingRequest.primaryAccountId),
        Merchant.findById(linkingRequest.secondaryAccountId)
      ]);

      if (!primaryAccount || !secondaryAccount) {
        return { success: false, error: 'One or both accounts not found' };
      }

      // Perform the linking
      const linkingResult = await this.linkAccounts(
        linkingRequest.primaryAccountId,
        linkingRequest.secondaryAccountId,
        linkingRequest.targetEmail // Pass the target email
      );

      if (!linkingResult.success) {
        return { success: false, error: linkingResult.error };
      }

      // Mark linking request as confirmed and clean up
      await Promise.all([
        Merchant.findByIdAndUpdate(linkingRequest.primaryAccountId, {
          $pull: { pendingLinkingRequests: { linkingToken } }
        }),
        Merchant.findByIdAndUpdate(linkingRequest.secondaryAccountId, {
          $pull: { pendingLinkingRequests: { linkingToken } }
        })
      ]);

      logger.info('Account linking confirmed', {
        primaryAccountId: linkingRequest.primaryAccountId,
        secondaryAccountId: linkingRequest.secondaryAccountId,
        confirmedBy: confirmingAccountId
      });

      return {
        success: true,
        linkedAccount: linkingResult.linkedAccount
      };

    } catch (error) {
      logger.error('Error confirming account linking:', error);
      return { success: false, error: 'Failed to confirm account linking' };
    }
  }

  /**
   * Actually link two accounts together
   */
  private async linkAccounts(
    primaryAccountId: string,
    secondaryAccountId: string,
    targetEmail?: string // The email to update the primary account to
  ): Promise<AccountLinkingResult> {
    try {
      const { Merchant } = await import('@/models/merchant/Merchant');

      // Get both accounts
      const [primaryAccount, secondaryAccount] = await Promise.all([
        Merchant.findById(primaryAccountId),
        Merchant.findById(secondaryAccountId)
      ]);

      if (!primaryAccount || !secondaryAccount) {
        return { success: false, error: 'Accounts not found' };
      }

      // Create linked account entries
      const primaryLinkedAccount: LinkedAccount = {
        accountId: primaryAccountId,
        authMethod: primaryAccount.authMethod || 'email',
        email: primaryAccount.email,
        stacksAddress: primaryAccount.stacksAddress,
        googleId: primaryAccount.googleId,
        githubId: primaryAccount.githubId,
        linkedAt: new Date(),
        isPrimary: true
      };

      const secondaryLinkedAccount: LinkedAccount = {
        accountId: secondaryAccountId,
        authMethod: secondaryAccount.authMethod || 'email',
        email: secondaryAccount.email,
        stacksAddress: secondaryAccount.stacksAddress,
        googleId: secondaryAccount.googleId,
        githubId: secondaryAccount.githubId,
        linkedAt: new Date(),
        isPrimary: false
      };

      // Update both accounts with linking information
      const primaryUpdate: any = {
        linkedAccounts: [secondaryLinkedAccount],
        primaryAuthMethod: primaryAccount.authMethod,
        isLinkedAccount: false
      };

      // If target email is provided, update the primary account's email
      if (targetEmail) {
        primaryUpdate.email = targetEmail;
        primaryUpdate.emailVerified = true; // Mark as verified since they confirmed via email
        primaryUpdate.requiresEmailVerification = false; // No longer needs email addition
      }

      await Promise.all([
        Merchant.findByIdAndUpdate(primaryAccountId, {
          $set: primaryUpdate
        }),
        Merchant.findByIdAndUpdate(secondaryAccountId, {
          $set: {
            linkedAccounts: [primaryLinkedAccount],
            primaryAuthMethod: primaryAccount.authMethod,
            isLinkedAccount: true,
            linkedToPrimary: primaryAccountId
          }
        })
      ]);

      return {
        success: true,
        linkedAccount: {
          id: secondaryAccountId,
          authMethod: secondaryAccount.authMethod || 'email',
          email: secondaryAccount.email,
          name: secondaryAccount.name
        }
      };

    } catch (error) {
      logger.error('Error linking accounts:', error);
      return { success: false, error: 'Failed to link accounts' };
    }
  }

  /**
   * Unlink accounts
   */
  async unlinkAccounts(
    accountId: string,
    accountToUnlink: string
  ): Promise<AccountLinkingResult> {
    try {
      const { Merchant } = await import('@/models/merchant/Merchant');

      // Remove linking from both accounts
      await Promise.all([
        Merchant.findByIdAndUpdate(accountId, {
          $pull: { linkedAccounts: { accountId: accountToUnlink } }
        }),
        Merchant.findByIdAndUpdate(accountToUnlink, {
          $pull: { linkedAccounts: { accountId } },
          $unset: { 
            isLinkedAccount: 1,
            linkedToPrimary: 1,
            primaryAuthMethod: 1
          }
        })
      ]);

      logger.info('Accounts unlinked', {
        accountId,
        unlinkedAccount: accountToUnlink
      });

      return { success: true };

    } catch (error) {
      logger.error('Error unlinking accounts:', error);
      return { success: false, error: 'Failed to unlink accounts' };
    }
  }

  /**
   * Get all linked accounts for a given account
   */
  async getLinkedAccounts(accountId: string): Promise<LinkedAccount[]> {
    try {
      const { Merchant } = await import('@/models/merchant/Merchant');
      
      const account = await Merchant.findById(accountId);
      if (!account) {
        return [];
      }

      return account.linkedAccounts || [];

    } catch (error) {
      logger.error('Error getting linked accounts:', error);
      return [];
    }
  }

  /**
   * Check if an account can use a specific auth method through linked accounts
   */
  async canUseAuthMethod(
    identifier: string, // email, wallet address, or account ID
    authMethod: string
  ): Promise<AuthMethodCheckResult> {
    try {
      const { Merchant } = await import('@/models/merchant/Merchant');

      // First try to find by the identifier directly
      let account = await Merchant.findOne({
        $or: [
          { email: identifier },
          { stacksAddress: identifier },
          { _id: Types.ObjectId.isValid(identifier) ? identifier : null },
          { googleId: identifier },
          { githubId: identifier }
        ]
      });

      if (!account) {
        return { canUse: false };
      }

      // Check if this account supports the auth method
      if (account.authMethod === authMethod) {
        return { 
          canUse: true, 
          accountId: account._id.toString(),
          primaryAccountId: account.isLinkedAccount ? account.linkedToPrimary : account._id.toString()
        };
      }

      // Check linked accounts
      if (account.linkedAccounts && account.linkedAccounts.length > 0) {
        const linkedWithAuthMethod = account.linkedAccounts.find(
          (linked: any) => linked.authMethod === authMethod
        );

        if (linkedWithAuthMethod) {
          return { 
            canUse: true, 
            accountId: linkedWithAuthMethod.accountId,
            primaryAccountId: account.isLinkedAccount ? account.linkedToPrimary : account._id.toString()
          };
        }
      }

      return { canUse: false };

    } catch (error) {
      logger.error('Error checking auth method availability:', error);
      return { canUse: false };
    }
  }
}

export const accountLinkingService = new AccountLinkingService();
