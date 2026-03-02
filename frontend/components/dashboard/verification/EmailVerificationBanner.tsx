'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, AlertTriangle, Plus, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useAccountLinking } from '@/hooks/use-account-linking';
import { AccountLinkingSuggestionCard } from '@/components/dashboard/account-linking/AccountLinkingSuggestionCard';

interface EmailVerificationBannerProps {
  user: {
    emailVerified: boolean;
    email: string;
    authMethod?: string;
  };
}

export default function EmailVerificationBanner({ user }: EmailVerificationBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailUpdated, setEmailUpdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { 
    resendVerificationEmail, 
    isResendingVerification, 
    resendVerificationError,
  } = useAuth();

  const {
    updateEmail,
    isUpdatingEmail,
    linkingSuggestion,
    initiateLinking,
    isInitiatingLinking,
    clearLinkingSuggestion
  } = useAccountLinking();

  // Check if this is a placeholder email (GitHub/wallet user without email)
  const isPlaceholderEmail = user.email.includes('@github.local') || 
                            user.email.includes('@wallet.local') ||
                            !user.email ||
                            user.email === '';

  // Don't show if email is verified or banner is dismissed
  if (user.emailVerified || isDismissed) {
    return null;
  }

  const handleResendVerification = () => {
    console.log('Attempting to resend verification email to:', user.email);
    resendVerificationEmail(user.email);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 5000);
  };

  const handleAddEmail = () => {
    if (!newEmail.trim()) return;
    
    updateEmail(newEmail);
    setEmailUpdated(true);
    setShowEmailInput(false);
    setNewEmail('');
    setTimeout(() => setEmailUpdated(false), 5000);
  };

  const handleEmailInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddEmail();
    }
  };

  return (
    <AnimatePresence>
      <div className="space-y-4">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-500"
        >
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {isPlaceholderEmail ? (
                  <Plus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {isPlaceholderEmail ? 'Add Your Email Address' : 'Email Verification Required'}
                </h3>
                <div className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  {isPlaceholderEmail ? (
                    <p>
                      Add your email address to receive payment notifications, security alerts, and unlock all features.
                    </p>
                  ) : (
                    <p>
                      Please verify your email address ({user.email}) to unlock all features. 
                      Check your inbox for the verification email.
                    </p>
                  )}

                  {emailSent && !resendVerificationError && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 text-green-700 dark:text-green-300 font-medium flex items-center"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Verification email sent successfully! Check your inbox.
                    </motion.p>
                  )}

                  {emailUpdated && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 text-green-700 dark:text-green-300 font-medium flex items-center"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Email updated successfully! Check your inbox for verification.
                    </motion.p>
                  )}

                  {errorMessage && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 text-red-700 dark:text-red-300 font-medium flex items-center"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errorMessage}
                    </motion.p>
                  )}

                  {resendVerificationError && (
                    <p className="mt-2 text-red-700 dark:text-red-300 font-medium">
                      {resendVerificationError?.message || 'An error occurred'}
                    </p>
                  )}
                </div>

                <div className="mt-3">
                  {isPlaceholderEmail ? (
                    <div className="space-y-3">
                      {!showEmailInput ? (
                        <Button
                          size="sm"
                          onClick={() => setShowEmailInput(true)}
                          variant="outline"
                          className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-800/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Add Email Address
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="email"
                            placeholder="Enter your email address"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            onKeyPress={handleEmailInputKeyPress}
                            className="flex-1 bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-600 focus:border-amber-500"
                            disabled={isUpdatingEmail}
                          />
                          <Button
                            size="sm"
                            onClick={handleAddEmail}
                            disabled={isUpdatingEmail || !newEmail.trim()}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            {isUpdatingEmail ? 'Adding...' : 'Add'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowEmailInput(false);
                              setNewEmail('');
                            }}
                            disabled={isUpdatingEmail}
                            className="border-amber-300 dark:border-amber-600"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      variant="outline"
                      className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-800/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {isResendingVerification ? 'Sending...' : 'Resend Email'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        </motion.div>

        {/* Account Linking Suggestion */}
        {linkingSuggestion && (
          <AccountLinkingSuggestionCard
            suggestion={linkingSuggestion}
            onAccept={() => initiateLinking(linkingSuggestion.targetAccount.id)}
            onDecline={clearLinkingSuggestion}
            isLoading={isInitiatingLinking}
          />
        )}
      </div>
    </AnimatePresence>
  );
}