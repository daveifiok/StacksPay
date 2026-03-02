'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  Smartphone,
  Monitor,
  Shield,
  Zap,
  Info,
  Download,
  Edit3,
  User,
  ArrowRight,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth-store'
import { walletService } from '@/lib/services/wallet-service'
import { walletApiClient } from '@/lib/api/wallet-api'
import { OnboardingData } from '../MerchantOnboardingWizard'

interface WalletSetupStepProps {
  data: OnboardingData
  updateData: (section: keyof OnboardingData, updates: any) => void
  onComplete: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const WalletSetupStep = ({ data, updateData, onComplete, isLoading, setIsLoading }: WalletSetupStepProps) => {
  const { user } = useAuth()
  const [setupMode, setSetupMode] = useState<'detect' | 'connect' | 'manual' | 'confirm'>('detect')
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [manualAddress, setManualAddress] = useState('')
  const [isValidAddress, setIsValidAddress] = useState(false)
  const [connectedWalletAddress, setConnectedWalletAddress] = useState('')
  const [existingWalletAddress, setExistingWalletAddress] = useState('')
  const [showAddressOptions, setShowAddressOptions] = useState(false)

  const walletInfo = data.walletInfo

  // Check user's authentication method and existing wallet data on component mount
  useEffect(() => {
    const checkUserWalletStatus = async () => {
      try {
        const isWalletUser = user?.authMethod === 'wallet'
        const isEmailUser = user?.authMethod === 'email'
        
        // For wallet users, check if they already have an address
        if (isWalletUser && user?.stacksAddress) {
          setExistingWalletAddress(user.stacksAddress)
          setSetupMode('confirm')
          setShowAddressOptions(true)
          return
        }

        // For email users or wallet users without addresses, check current session
        const currentWalletData = await walletService.getCurrentWalletData()
        if (currentWalletData?.address) {
          setConnectedWalletAddress(currentWalletData.address)
          setSetupMode('confirm')
          setShowAddressOptions(true)
        } else {
          // Default to connect mode for both user types
          setSetupMode('connect')
        }
      } catch (error) {
        console.error('Error checking wallet status:', error)
        setSetupMode('connect')
      }
    }

    checkUserWalletStatus()
  }, [user])

  // Validate Stacks address format
  const validateStacksAddress = (address: string) => {
    const stacksAddressRegex = /^S[TP][0-9A-HJKMNP-Z]{38,40}$/
    return stacksAddressRegex.test(address)
  }

  useEffect(() => {
    setIsValidAddress(validateStacksAddress(manualAddress))
  }, [manualAddress])

  const connectWallet = async () => {
    setIsLoading(true)
    setConnectionStatus('connecting')

    try {
      const isEmailUser = user?.authMethod === 'email'
      
      let walletData
      if (isEmailUser) {
        // For email users, use the new explicit connection method that goes through auth/signing
        const result = await walletService.connectWalletForExistingUser()
        if (result.success) {
          walletData = { address: result.address }
        } else {
          throw new Error(result.error || 'Failed to connect wallet')
        }
      } else {
        // For wallet users or other cases, use the regular connection method
        walletData = await walletService.connectWallet()
      }
      
      if (walletData.address) {
        setConnectedWalletAddress(walletData.address)
        setConnectionStatus('connected')
        setSetupMode('confirm')
        setShowAddressOptions(true)
      } else {
        throw new Error('Failed to get wallet address')
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      setConnectionStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const saveWalletAddress = async (address: string, isConnected: boolean) => {
    setIsLoading(true)

    try {
      // Update onboarding data
      updateData('walletInfo', {
        stacksAddress: address,
        bitcoinAddress: '', // Will be set if wallet provides it
        walletType: isConnected ? 'connected' : 'manual',
        connected: isConnected
      })

      // Sync with backend and update auth store
      if (isConnected) {
        const syncResult = await walletApiClient.syncWalletConnection()
        if (!syncResult.success) {
          console.warn('Failed to sync wallet with backend:', syncResult.error)
        }
      } else {
        // Save manual address to backend
        const updateResult = await walletApiClient.updateWalletAddresses({
          stacksAddress: address,
          walletType: 'manual'
        })
        if (!updateResult.success) {
          console.warn('Failed to save manual address:', updateResult.error)
        }
      }

      // Update the auth store with wallet connection status
      // This ensures the wallet address is reflected across the app
      if (user) {
        const { setUser } = useAuthStore.getState()
        const updatedUser = {
          ...user,
          stacksAddress: address,
          walletConnected: isConnected
        }
        setUser(updatedUser)
      }

      // Save step completion to backend to trigger auto-authorization
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const token = localStorage.getItem('authToken')

        const response = await fetch(`${apiUrl}/api/onboarding/step`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            stepName: 'walletSetup',
            stepData: {
              stacksAddress: address,
              walletType: isConnected ? 'connected' : 'manual',
              connected: isConnected
            },
            currentStep: 3 // Wallet setup is step 3
          })
        })

        const result = await response.json()
        if (result.success) {
          console.log('✅ Wallet setup step saved, merchant auto-authorization triggered')
        } else {
          console.warn('⚠️ Failed to save wallet setup step:', result.error)
        }
      } catch (error) {
        console.error('❌ Error saving wallet setup step to backend:', error)
      }

      onComplete()
    } catch (error) {
      console.error('Error saving wallet address:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
  }

  // Different UI modes based on user state
  const renderWalletSetup = () => {
    if (setupMode === 'confirm' && (existingWalletAddress || connectedWalletAddress)) {
      const currentAddress = existingWalletAddress || connectedWalletAddress
      const isFromLogin = !!existingWalletAddress
      const isWalletUser = user?.authMethod === 'wallet'
      const isEmailUser = user?.authMethod === 'email'
      
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>
                  {isFromLogin && isWalletUser 
                    ? 'Wallet Connected'
                    : 'Wallet Address Detected'
                  }
                </span>
              </CardTitle>
              <CardDescription>
                {isFromLogin && isWalletUser
                  ? 'You signed in with your Stacks wallet'
                  : isEmailUser
                  ? 'Your connected wallet address'
                  : 'Wallet address ready for use'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Stacks Address
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 font-mono break-all">
                      {currentAddress}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyAddress(currentAddress)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {isWalletUser
                    ? 'Do you want to continue using this wallet address for receiving sBTC payments?'
                    : 'Would you like to use this address to receive sBTC payments?'
                  }
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => saveWalletAddress(currentAddress, !isFromLogin)}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {isWalletUser ? 'Continue with this address' : 'Yes, use this address'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setSetupMode('manual')}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    {isWalletUser ? 'Change address' : 'Use different address'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )
    }

    if (setupMode === 'manual') {
      const isEmailUser = user?.authMethod === 'email'
      
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Edit3 className="h-5 w-5" />
                <span>Enter Wallet Address Manually</span>
              </CardTitle>
              <CardDescription>
                {isEmailUser
                  ? 'Enter your Stacks wallet address to receive sBTC payments'
                  : 'Enter a different Stacks wallet address for receiving payments'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="stacks-address">Stacks Address</Label>
                <Input
                  id="stacks-address"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="SP1ABC123... or ST1ABC123..."
                  className="font-mono"
                />
                {manualAddress && (
                  <div className="flex items-center space-x-2 text-sm">
                    {isValidAddress ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Valid Stacks address</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-600" />
                        <span className="text-red-600">Invalid address format</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  <strong>Important:</strong> Make sure this is a Stacks address you control. 
                  All sBTC payments will be sent to this address and cannot be recovered if incorrect.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => saveWalletAddress(manualAddress, false)}
                  disabled={isLoading || !isValidAddress}
                  className="flex-1"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Save Address
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setSetupMode('connect')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet Instead
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )
    }

    // Default connect wallet mode
    const isEmailUser = user?.authMethod === 'email'
    const isWalletUser = user?.authMethod === 'wallet'
    
    return (
      <div className="space-y-6">
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>
                {isWalletUser ? 'Complete Wallet Setup' : 'Connect Your Stacks Wallet'}
              </span>
            </CardTitle>
            <CardDescription>
              {isEmailUser
                ? 'Connect your Stacks wallet to receive sBTC payments securely'
                : isWalletUser
                ? 'Finish setting up your wallet to start receiving payments'
                : 'Connect your Stacks wallet to automatically set up payments'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEmailUser && (
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  Since you signed in with email, you'll need to connect a Stacks wallet 
                  or manually enter your wallet address to receive sBTC payments.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto">
                <Wallet className="h-10 w-10 text-orange-600 dark:text-orange-400" />
              </div>
              
              <Button 
                size="lg"
                onClick={connectWallet}
                disabled={isLoading || connectionStatus === 'connecting'}
                className="min-w-[200px] bg-orange-600 hover:bg-orange-700 text-white"
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Stacks Wallet
                  </>
                )}
              </Button>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <span>OR</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>

              <Button 
                variant="outline"
                onClick={() => setSetupMode('manual')}
                disabled={isLoading}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Enter Address Manually
              </Button>

              {connectionStatus === 'error' && (
                <Alert className="bg-white dark:bg-gray-900 border shadow-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    Failed to connect wallet. Please make sure you have a Stacks wallet installed and try again.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Help section for users who don't have a wallet */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Don't have a Stacks wallet?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Get a Stacks wallet to securely manage your sBTC and STX tokens:
              </p>
              <div className="space-y-2">
                <a 
                  href="https://leather.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Leather Wallet (Recommended)
                </a>
                <br />
                <a 
                  href="https://xverse.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Xverse Wallet
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isEmailUser = user?.authMethod === 'email'
  const isWalletUser = user?.authMethod === 'wallet'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight">
          {isWalletUser ? 'Complete Wallet Setup' : 'Set Up Your Wallet'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {isEmailUser
            ? 'Connect or enter your Stacks wallet address to receive sBTC payments'
            : isWalletUser
            ? 'Complete your wallet configuration to start accepting payments'
            : 'Configure your wallet to start receiving sBTC payments'
          }
        </p>
      </div>

      {renderWalletSetup()}
    </div>
  )
}

export default WalletSetupStep