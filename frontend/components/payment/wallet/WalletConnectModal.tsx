'use client'

import { useState } from 'react'
import { motion} from 'framer-motion'
import { Wallet, Shield, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface WalletOption {
  id: string
  name: string
  description: string
  icon: string
  isRecommended?: boolean
  isNew?: boolean
}

interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
}

const WalletConnectModal = ({ isOpen, onClose }: WalletConnectModalProps) => {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const walletOptions: WalletOption[] = [
    {
      id: 'hiro',
      name: 'Hiro Wallet',
      description: 'The most trusted Stacks wallet',
      icon: '🟧',
      isRecommended: true
    },
    {
      id: 'xverse',
      name: 'Xverse',
      description: 'Bitcoin & Stacks wallet',
      icon: '🟣'
    },
    {
      id: 'leather',
      name: 'Leather',
      description: 'Open-source Stacks wallet',
      icon: '🟫',
      isNew: true
    },
    {
      id: 'asigna',
      name: 'Asigna',
      description: 'Multi-signature wallet',
      icon: '🔷'
    }
  ]

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId)
    setIsConnecting(true)
    
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Here you would integrate with actual wallet SDKs
    console.log(`Connecting to ${walletId}`)
    
    setIsConnecting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] w-full mx-auto bg-white dark:bg-gray-900 border-0 shadow-2xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 sm:p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Connect your wallet
            </DialogTitle>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Connect your Stacks wallet to manage your payment gateway
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 sm:pt-4">
          <div className="space-y-2 sm:space-y-3">
            {walletOptions.map((wallet, index) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => handleWalletSelect(wallet.id)}
                  disabled={isConnecting}
                  className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 text-left group relative overflow-hidden ${
                    selectedWallet === wallet.id && isConnecting
                      ? 'border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                      {wallet.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-200 text-sm sm:text-base">
                          {wallet.name}
                        </h3>
                        {wallet.isRecommended && (
                          <span className="px-1.5 sm:px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full whitespace-nowrap">
                            Recommended
                          </span>
                        )}
                        {wallet.isNew && (
                          <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full whitespace-nowrap">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                        {wallet.description}
                      </p>
                    </div>

                    <div className="flex items-center flex-shrink-0">
                      {isConnecting && selectedWallet === wallet.id ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-orange-500 dark:border-orange-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform group-hover:translate-x-1" />
                      )}
                    </div>
                  </div>

                  {/* Subtle hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -skew-x-12 transform translate-x-full group-hover:translate-x-[-150%] duration-700" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* New to Stacks section */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mt-0.5 flex-shrink-0">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  New to Stacks?
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-2 sm:mb-3">
                  Set up your merchant account to start accepting sBTC payments
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Learn about wallets
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Your wallet stays secure. We never store your private keys.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default WalletConnectModal