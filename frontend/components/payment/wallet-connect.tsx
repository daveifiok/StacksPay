'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  ExternalLink,
  Copy,
  Zap,
  Shield,
  RefreshCw,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface WalletInfo {
  name: string
  icon: string
  description: string
  isInstalled: boolean
  isSupported: boolean
  downloadUrl?: string
}

interface ConnectedWallet {
  address: string
  name: string
  network: string
  balance?: {
    STX: number
    sBTC: number
    BTC: number
  }
  isConnected: boolean
}

interface WalletConnectProps {
  onWalletConnect?: (wallet: ConnectedWallet) => void
  onWalletDisconnect?: () => void
  supportedWallets?: string[]
  autoConnect?: boolean
  showBalance?: boolean
  network?: 'mainnet' | 'testnet'
}

const SUPPORTED_WALLETS: WalletInfo[] = [
  {
    name: 'Leather',
    icon: '🔶',
    description: 'The most popular Stacks wallet',
    isInstalled: false,
    isSupported: true,
    downloadUrl: 'https://leather.io'
  },
  {
    name: 'Xverse',
    icon: '🎯',
    description: 'Multi-chain Bitcoin wallet',
    isInstalled: false,
    isSupported: true,
    downloadUrl: 'https://xverse.app'
  },
  {
    name: 'Asigna',
    icon: '🔐',
    description: 'Enterprise-grade wallet',
    isInstalled: false,
    isSupported: true,
    downloadUrl: 'https://asigna.io'
  },
  {
    name: 'OKX Wallet',
    icon: '⭕',
    description: 'Global crypto wallet',
    isInstalled: false,
    isSupported: true,
    downloadUrl: 'https://okx.com/wallet'
  }
]

export default function WalletConnect({
  onWalletConnect,
  onWalletDisconnect,
  supportedWallets = ['Leather', 'Xverse', 'Asigna', 'OKX Wallet'],
  autoConnect = false,
  showBalance = true,
  network = 'mainnet'
}: WalletConnectProps) {
  const { toast } = useToast()
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null)
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    detectWallets()
    if (autoConnect) {
      attemptAutoConnect()
    }
  }, [])

  const detectWallets = () => {
    const detected = SUPPORTED_WALLETS.filter(wallet => 
      supportedWallets.includes(wallet.name)
    ).map(wallet => ({
      ...wallet,
      // Simulate wallet detection - in real implementation, check window objects
      isInstalled: Math.random() > 0.5 // Random for demo
    }))
    
    setAvailableWallets(detected)
  }

  const attemptAutoConnect = async () => {
    // Try to reconnect to previously connected wallet
    const savedWallet = localStorage.getItem('stackspay-connected-wallet')
    if (savedWallet) {
      try {
        const walletInfo = JSON.parse(savedWallet)
        await connectWallet(walletInfo.name, true)
      } catch (error) {
        console.error('Auto-connect failed:', error)
        localStorage.removeItem('stackspay-connected-wallet')
      }
    }
  }

  const connectWallet = async (walletName: string, isAutoConnect = false) => {
    const wallet = availableWallets.find(w => w.name === walletName)
    if (!wallet) return

    if (!wallet.isInstalled && !isAutoConnect) {
      // Redirect to wallet installation
      if (wallet.downloadUrl) {
        window.open(wallet.downloadUrl, '_blank')
        return
      }
    }

    setIsConnecting(true)
    setConnectionError(null)
    
    try {
      // Simulate wallet connection - in real implementation, use wallet APIs
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate connection failure sometimes for demo
      if (!isAutoConnect && Math.random() < 0.1) {
        throw new Error('User rejected connection')
      }
      
      const mockAddress = generateMockAddress()
      const connected: ConnectedWallet = {
        address: mockAddress,
        name: walletName,
        network: network,
        balance: showBalance ? {
          STX: Math.random() * 1000,
          sBTC: Math.random() * 0.1,
          BTC: Math.random() * 0.05
        } : undefined,
        isConnected: true
      }
      
      setConnectedWallet(connected)
      setShowWalletDialog(false)
      
      // Save to localStorage for auto-reconnect
      localStorage.setItem('stackspay-connected-wallet', JSON.stringify({
        name: walletName,
        address: mockAddress
      }))
      
      if (!isAutoConnect) {
        toast({
          title: "Wallet Connected",
          description: `Successfully connected to ${walletName}`,
        })
      }
      
      onWalletConnect?.(connected)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      setConnectionError(errorMessage)
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setConnectedWallet(null)
    localStorage.removeItem('stackspay-connected-wallet')
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
    onWalletDisconnect?.()
  }

  const generateMockAddress = (): string => {
    const prefix = network === 'mainnet' ? 'SP' : 'ST'
    const suffix = Math.random().toString(36).substring(2, 32).toUpperCase()
    return `${prefix}${suffix}`
  }

  const copyAddress = async () => {
    if (!connectedWallet) return
    
    try {
      await navigator.clipboard.writeText(connectedWallet.address)
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy address",
        variant: "destructive"
      })
    }
  }

  const formatBalance = (amount: number): string => {
    if (amount < 0.001) return amount.toFixed(8)
    if (amount < 1) return amount.toFixed(6)
    return amount.toFixed(3)
  }

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Connected State
  if (connectedWallet) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-sm">{connectedWallet.name} Connected</CardTitle>
                <CardDescription className="text-xs">
                  {formatAddress(connectedWallet.address)}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              {network}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Address */}
          <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <code className="text-xs flex-1 font-mono">
              {connectedWallet.address}
            </code>
            <Button variant="ghost" size="sm" onClick={copyAddress}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>

          {/* Balance */}
          {showBalance && connectedWallet.balance && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Wallet Balance
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/10 rounded">
                  <div className="font-semibold text-orange-700 dark:text-orange-400">
                    {formatBalance(connectedWallet.balance.sBTC)}
                  </div>
                  <div className="text-orange-600 dark:text-orange-500">sBTC</div>
                </div>
                <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/10 rounded">
                  <div className="font-semibold text-purple-700 dark:text-purple-400">
                    {formatBalance(connectedWallet.balance.STX)}
                  </div>
                  <div className="text-purple-600 dark:text-purple-500">STX</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded">
                  <div className="font-semibold text-yellow-700 dark:text-yellow-400">
                    {formatBalance(connectedWallet.balance.BTC)}
                  </div>
                  <div className="text-yellow-600 dark:text-yellow-500">BTC</div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={disconnectWallet}
              className="flex-1"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Disconnect
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(`https://explorer.stacks.co/address/${connectedWallet.address}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Connection State
  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Connect Wallet</span>
          </CardTitle>
          <CardDescription>
            Connect your Stacks wallet to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {connectionError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}

          {/* Quick Connect (most popular wallet) */}
          {availableWallets.length > 0 && (
            <Button 
              onClick={() => connectWallet(availableWallets[0].name)}
              disabled={isConnecting}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <>
                  <span className="mr-2">{availableWallets[0].icon}</span>
                  Connect {availableWallets[0].name}
                </>
              )}
            </Button>
          )}

          {/* More Options */}
          {availableWallets.length > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setShowWalletDialog(true)}
              className="w-full"
            >
              More Wallet Options
            </Button>
          )}

          {/* Network Info */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>Secure connection to {network}</span>
            </div>
            <div>Your wallet stays in your control</div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Selection Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Wallet</DialogTitle>
            <DialogDescription>
              Select a wallet to connect to StacksPay
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            {availableWallets.map((wallet) => (
              <motion.div
                key={wallet.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  onClick={() => connectWallet(wallet.name)}
                  disabled={isConnecting}
                  className="w-full h-auto p-4 justify-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="text-left flex-1">
                    <div className="font-medium">{wallet.name}</div>
                    <div className="text-xs text-gray-500">{wallet.description}</div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {wallet.isInstalled ? (
                      <Badge variant="secondary" className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Installed
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Install
                      </Badge>
                    )}
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="text-xs text-gray-500 text-center mt-4">
            Don't have a wallet? 
            <Button variant="link" className="h-auto p-0 text-xs ml-1">
              Learn more
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
