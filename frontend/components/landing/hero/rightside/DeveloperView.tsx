'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Zap, 
  Shield, 
  Globe, 
  Clock, 
  Check, 
  Code, 
  ArrowRight,
  Terminal,
  BookOpen,
  Download
} from 'lucide-react'
import { useAutoScroll } from '@/hooks/useAutoScroll'

const DeveloperView = ({ tabIndex }: { tabIndex?: number }) => {
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
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="flex space-x-1">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
            <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">Integration.tsx</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">sBTC Payment Gateway</div>
          </div>
          <Settings className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>

        {/* Code Example */}
        <div className="bg-gray-900 dark:bg-gray-950 p-3 rounded-xl space-y-1.5 font-mono text-xs overflow-x-auto border border-gray-700 dark:border-gray-800">
          <div className="text-purple-400 dark:text-purple-300">import</div>
          <div className="text-yellow-300 dark:text-yellow-200">{'{ SbtcPayment }'}</div>
          <div className="text-gray-400 dark:text-gray-500">from</div>
          <div className="text-green-400 dark:text-green-300">"@stackspay/react"</div>
          
          <div className="pt-2" />
          
          <div className="text-blue-400 dark:text-blue-300">{'<SbtcPayment'}</div>
          <div className="text-cyan-300 dark:text-cyan-200 pl-4">amount={'{0.084}'}</div>
          <div className="text-cyan-300 dark:text-cyan-200 pl-4">currency="sBTC"</div>
          <div className="text-cyan-300 dark:text-cyan-200 pl-4">onSuccess={'{handleSuccess}'}</div>
          <div className="text-cyan-300 dark:text-cyan-200 pl-4">apiKey="pk_test_..."</div>
          <div className="text-blue-400 dark:text-blue-300">{'/>'}</div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-xs mb-3">Developer Features</h4>
          <div className="space-y-2">
            {[
              { icon: Zap, text: '3-line integration', color: 'text-yellow-600 dark:text-yellow-400' },
              { icon: Shield, text: 'Enterprise security', color: 'text-green-600 dark:text-green-400' },
              { icon: Globe, text: 'Global compatibility', color: 'text-blue-600 dark:text-blue-400' },
              { icon: Clock, text: 'Real-time webhooks', color: 'text-purple-600 dark:text-purple-400' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center space-x-2.5"
              >
                <feature.icon className={`w-3.5 h-3.5 ${feature.color}`} />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{feature.text}</span>
                <Check className="w-3.5 h-3.5 text-green-500 dark:text-green-400 ml-auto" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* API Status */}
        <div className="bg-gradient-to-br from-green-50 to-green-100/60 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-3 border border-green-200/60 dark:border-green-700/40 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-300">API Status: Online</span>
          </div>
          <div className="text-xs text-green-600 dark:text-green-300 space-y-0.5 leading-relaxed">
            <div>• Response time: <span className="font-medium">45ms</span></div>
            <div>• Uptime: <span className="font-medium">99.9%</span></div>
            <div>• Testnet ready</div>
          </div>
        </div>

        {/* SDK Installation */}
        <div className="bg-white dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-xs mb-2">Quick Start</h4>
          <div className="bg-gray-100 dark:bg-gray-900/60 p-2.5 rounded-lg font-mono text-xs mb-2 border dark:border-gray-700">
            <div className="text-gray-600 dark:text-gray-300">npm install @stackspay/react</div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Get started with sBTC payments in under 5 minutes
          </div>
        </div>

        {/* Documentation Links - Revealed by scroll */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-3 border border-blue-200/60 dark:border-blue-700/40 backdrop-blur-sm">
          <h4 className="font-semibold text-blue-700 dark:text-blue-300 text-xs mb-2">Documentation</h4>
          <div className="space-y-1.5">
            <button className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-gray-800/60 rounded-lg border border-blue-200/60 dark:border-blue-700/40 hover:bg-blue-50 dark:hover:bg-gray-700/60 transition-colors">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">API Reference</span>
              </div>
              <ArrowRight className="w-3 h-3 text-blue-400 dark:text-blue-500" />
            </button>
            <button className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-gray-800/60 rounded-lg border border-blue-200/60 dark:border-blue-700/40 hover:bg-blue-50 dark:hover:bg-gray-700/60 transition-colors">
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Code Examples</span>
              </div>
              <ArrowRight className="w-3 h-3 text-blue-400 dark:text-blue-500" />
            </button>
            <button className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-gray-800/60 rounded-lg border border-blue-200/60 dark:border-blue-700/40 hover:bg-blue-50 dark:hover:bg-gray-700/60 transition-colors">
              <div className="flex items-center space-x-2">
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">SDK Downloads</span>
              </div>
              <ArrowRight className="w-3 h-3 text-blue-400 dark:text-blue-500" />
            </button>
          </div>
        </div>

        {/* Main CTA Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 text-xs"
        >
          <Code className="w-4 h-4" />
          <span>View Documentation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>

        {/* Additional Resources */}
        <div className="bg-white dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-xs mb-2">Additional Resources</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-lg backdrop-blur-sm">
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-tight">GitHub Repository</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Open source SDK and examples</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 ml-2" />
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-lg backdrop-blur-sm">
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-tight">Discord Community</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Get help from developers</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 ml-2" />
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-lg backdrop-blur-sm">
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-tight">Video Tutorials</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Step-by-step integration guides</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 ml-2" />
            </div>
          </div>
        </div>

        {/* Support Contact */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/60 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-3 border border-orange-200/60 dark:border-orange-700/40 backdrop-blur-sm">
          <h4 className="font-semibold text-orange-700 dark:text-orange-300 text-xs mb-1.5">Need Help?</h4>
          <p className="text-xs text-orange-600 dark:text-orange-300 mb-2 leading-relaxed">
            Our developer support team is here to help you integrate sBTC payments.
          </p>
          <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2 rounded-lg text-xs font-semibold transition-all duration-300 shadow-sm hover:shadow-md">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeveloperView