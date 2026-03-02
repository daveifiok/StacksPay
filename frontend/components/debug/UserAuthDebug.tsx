'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Wallet, Mail, CheckCircle, XCircle } from 'lucide-react'

/**
 * Debug component to show current user authentication state
 * Useful for testing onboarding flow for different user types
 */
export const UserAuthDebug = () => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700 dark:text-red-300">
            <XCircle className="h-5 w-5 mr-2" />
            Not Authenticated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-400">User is not logged in</p>
        </CardContent>
      </Card>
    )
  }

  const authMethodColor = user.authMethod === 'wallet' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
  const walletStatusColor = user.walletConnected ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
          <User className="h-5 w-5 mr-2" />
          User Authentication State
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Authentication Method:</span>
              <Badge className={authMethodColor}>
                {user.authMethod === 'wallet' ? (
                  <>
                    <Wallet className="h-3 w-3 mr-1" />
                    Wallet
                  </>
                ) : (
                  <>
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Wallet Connected:</span>
              <Badge className={walletStatusColor}>
                {user.walletConnected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Yes
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    No
                  </>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email Verified:</span>
              <Badge className={user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                {user.emailVerified ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Yes
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    No
                  </>
                )}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">User ID:</span>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                {user.id}
              </p>
            </div>
            
            <div>
              <span className="text-sm font-medium">Name:</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {user.name}
              </p>
            </div>
            
            <div>
              <span className="text-sm font-medium">Email:</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {user.stacksAddress && (
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <span className="text-sm font-medium">Stacks Address:</span>
            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all mt-1">
              {user.stacksAddress}
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          <strong>Expected Onboarding Behavior:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {user.authMethod === 'wallet' && user.stacksAddress ? (
              <li>Should show "Wallet Connected" with option to continue or change address</li>
            ) : user.authMethod === 'wallet' && !user.stacksAddress ? (
              <li>Should show "Complete Wallet Setup" - wallet user without address</li>
            ) : user.authMethod === 'email' && !user.stacksAddress ? (
              <li>Should show "Connect Your Stacks Wallet" with email user instructions</li>
            ) : (
              <li>Should show wallet connection options</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
