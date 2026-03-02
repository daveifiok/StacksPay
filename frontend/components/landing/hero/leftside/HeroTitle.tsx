'use client'

import { motion } from 'framer-motion'

const HeroTitle = () => {
  return (
    <div className="space-y-6 lg:space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight"
      >
        <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
          Accept{' '}
        </span>
        <span className="relative inline-block">
          <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent font-extrabold">
            sBTC
          </span>
          <motion.div
            className="absolute -bottom-0.5 sm:-bottom-1 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full shadow-lg shadow-orange-500/30"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
          />
          <motion.div
            className="absolute -bottom-0.5 sm:-bottom-1 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full blur-sm"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.6 }}
            transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
          />
        </span>
        <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
          {' '}payments{' '}
        </span>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="block sm:inline bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 dark:from-gray-200 dark:via-gray-100 dark:to-gray-200 bg-clip-text text-transparent"
        >
          in minutes
        </motion.span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="space-y-3 sm:space-y-4 max-w-2xl"
      >
        <p className="text-base sm:text-lg md:text-xl lg:text-xl font-medium leading-relaxed">
          <span className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 dark:from-slate-300 dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
            The first payment gateway built for{' '}
          </span>
          <span className="font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            sBTC
          </span>
          <span className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 dark:from-slate-300 dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
            . Enable Bitcoin payments on your platform with a few lines of code.
          </span>
        </p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="text-sm sm:text-base lg:text-lg font-medium"
        >
          <span className="bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 dark:from-slate-400 dark:via-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
            Zero chargebacks • Global reach • Instant settlement
          </span>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default HeroTitle
