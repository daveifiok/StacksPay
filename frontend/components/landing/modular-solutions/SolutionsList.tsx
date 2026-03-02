'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const SolutionsList = () => {
  const [activeSolution, setActiveSolution] = useState(0)

  const solutions = [
    {
      title: 'Accept payments',
      description: 'Process Bitcoin, STX, and sBTC with automatic conversion to your preferred settlement currency.',
      features: ['Multi-currency support', 'Instant settlements', 'Global accessibility'],
      accent: 'orange'
    },
    {
      title: 'Connect wallets',
      description: 'Universal wallet integration supporting all major Bitcoin and Stacks wallets.',
      features: ['12+ wallet integrations', 'Wallet-less options', 'Secure connections'],
      accent: 'purple'
    },
    {
      title: 'Convert currencies',
      description: 'Real-time conversion between cryptocurrencies and fiat with competitive rates.',
      features: ['Real-time rates', 'Low conversion fees', 'Multiple withdrawal options'],
      accent: 'green'
    },
    {
      title: 'Developer tools',
      description: 'Stripe-compatible APIs, comprehensive SDKs, and extensive documentation.',
      features: ['Stripe-like API', 'Multiple SDKs', 'Complete documentation'],
      accent: 'blue'
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSolution(prev => (prev + 1) % solutions.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [solutions.length])

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Everything you need
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Complete payment infrastructure designed for modern businesses
        </p>
      </div>

      <div className="space-y-4">
        {solutions.map((solution, index) => {
          const getAccentClasses = (accent: string) => {
            switch (accent) {
              case 'orange':
                return {
                  active: 'bg-white dark:bg-slate-900/80 border-orange-200 dark:border-orange-700 shadow-sm shadow-orange-500/10',
                  title: 'text-orange-600 dark:text-orange-400',
                  indicator: 'bg-orange-500'
                }
              case 'purple':
                return {
                  active: 'bg-white dark:bg-slate-900/80 border-purple-200 dark:border-purple-700 shadow-sm shadow-purple-500/10',
                  title: 'text-purple-600 dark:text-purple-400',
                  indicator: 'bg-purple-500'
                }
              case 'green':
                return {
                  active: 'bg-white dark:bg-slate-900/80 border-green-200 dark:border-green-700 shadow-sm shadow-green-500/10',
                  title: 'text-green-600 dark:text-green-400',
                  indicator: 'bg-green-500'
                }
              case 'blue':
                return {
                  active: 'bg-white dark:bg-slate-900/80 border-blue-200 dark:border-blue-700 shadow-sm shadow-blue-500/10',
                  title: 'text-blue-600 dark:text-blue-400',
                  indicator: 'bg-blue-600'
                }
              default:
                return {
                  active: 'bg-white dark:bg-slate-900/80 border-gray-200 dark:border-slate-700',
                  title: 'text-gray-900 dark:text-slate-100',
                  indicator: 'bg-gray-300 dark:bg-slate-600'
                }
            }
          }

          const accentClasses = getAccentClasses(solution.accent)
          
          return (
            <motion.div
              key={index}
              className={`group p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                activeSolution === index
                  ? accentClasses.active
                  : 'bg-white dark:bg-slate-900/80 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-sm'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              onClick={() => setActiveSolution(index)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`text-lg font-semibold mb-2 transition-colors ${
                    activeSolution === index
                      ? accentClasses.title
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {solution.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                    {solution.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {solution.features.map((feature, featureIndex) => (
                      <motion.span
                        key={featureIndex}
                        className="text-xs px-3 py-1.5 bg-gray-50 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 rounded-lg border border-gray-200 dark:border-slate-600/50"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.1 }}
                      >
                        {feature}
                      </motion.span>
                    ))}
                  </div>
                </div>
                <motion.div 
                  className={`w-3 h-3 rounded-full mt-2 transition-all duration-300 ${
                    activeSolution === index
                      ? `${accentClasses.indicator} shadow-lg`
                      : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                  animate={activeSolution === index ? { 
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Stats - Elegant with subtle brand accents */}
      <motion.div
        className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
      >
        {[
          { value: '0.5%', label: 'Transaction fee', color: 'orange' },
          { value: '99.9%', label: 'Uptime', color: 'green' },
          { value: '6s', label: 'Settlement', color: 'purple' }
        ].map((stat, index) => {
          const getStatColor = (color: string) => {
            switch (color) {
              case 'orange': return 'text-orange-600 dark:text-orange-400'
              case 'green': return 'text-green-600 dark:text-green-400'
              case 'purple': return 'text-purple-600 dark:text-purple-400'
              default: return 'text-gray-600 dark:text-gray-400'
            }
          }
          
          return (
            <motion.div 
              key={index} 
              className="text-center p-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className={`text-2xl font-bold ${getStatColor(stat.color)} mb-1`}
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  delay: index * 0.5 
                }}
              >
                {stat.value}
              </motion.div>
              <div className="text-xs text-gray-600 dark:text-slate-400 font-medium">
                {stat.label}
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

export default SolutionsList