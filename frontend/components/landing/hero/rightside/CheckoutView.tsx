'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, Bitcoin, Check, QrCode, Wallet, Shield, CheckCircle } from 'lucide-react'
import { useAutoScroll } from '@/hooks/useAutoScroll'

const CheckoutView = ({ tabIndex }: { tabIndex?: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  useAutoScroll(scrollRef, tabIndex)

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto"
      style={{ 
        scrollBehavior: 'smooth',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}
    >
      <div className="p-3 space-y-3 pb-20">
        {/* Header */}
        <div className="text-center space-y-2 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 rounded-full mx-auto flex items-center justify-center shadow-sm">
            <Smartphone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight">TechStore Pro</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Secure sBTC Checkout</p>
          </div>
        </div>

        {/* Product */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">MacBook Pro M3</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">15-inch, 512GB</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Qty: 1</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">$2,499</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">≈ 0.084 sBTC</div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Payment Method</h4>
          
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="p-3 border-2 border-orange-200/60 dark:border-orange-700/60 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl backdrop-blur-sm"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
                <Bitcoin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-orange-900 dark:text-orange-100 text-sm leading-tight">Pay with sBTC</div>
                <div className="text-xs text-orange-700 dark:text-orange-300">Secure Bitcoin payment</div>
              </div>
              <Check className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>

            {/* QR Code Placeholder */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg mb-3 border border-gray-100 dark:border-gray-700">
              <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <QrCode className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-center mt-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Scan to pay</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">0.084 sBTC</div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 text-sm"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </motion.button>
          </motion.div>

          {/* Payment Info */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-xl border border-blue-200/60 dark:border-blue-700/40 backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Secure Payment</span>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-300 space-y-0.5 leading-relaxed">
              <div>• No chargebacks or reversals</div>
              <div>• Instant settlement to your wallet</div>
              <div>• Protected by Bitcoin network</div>
            </div>
          </div>

          {/* Additional Security Info - Revealed by scroll */}
          <div className="bg-gradient-to-br from-green-50 to-green-100/60 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-xl border border-green-200/60 dark:border-green-700/40 backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-300">Transaction Security</span>
            </div>
            <div className="text-xs text-green-600 dark:text-green-300 space-y-0.5 leading-relaxed">
              <div>• End-to-end encryption</div>
              <div>• Multi-signature validation</div>
              <div>• Real-time fraud monitoring</div>
            </div>
          </div>

          {/* Order Summary - Additional scrollable content */}
          <div className="bg-white dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-xs mb-2">Order Summary</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">$2,499.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Processing Fee</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">$12.50</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-1.5 mt-1.5">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-gray-900 dark:text-gray-100">$2,511.50</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">≈ 0.084 sBTC</div>
              </div>
            </div>
          </div>

          {/* Payment Guarantee */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/60 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-xl border border-purple-200/60 dark:border-purple-700/40 backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">StacksPay Guarantee</span>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-300 space-y-0.5 leading-relaxed">
              <div>• 100% secure transaction processing</div>
              <div>• Industry-leading fraud protection</div>
              <div>• 24/7 customer support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutView