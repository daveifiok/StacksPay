'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play, Code, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

const HeroCTA = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.0 }}
      className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-start"
    >
      {/* Primary CTA */}
      <motion.div
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="w-full sm:w-auto"
      >
        <Button 
          size="lg"
          className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 sm:px-8 py-4 sm:py-3 rounded-full text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Code className="mr-2 sm:mr-3 w-5 h-5 sm:w-5 sm:h-5" />
          Start Building
          <motion.div
            className="ml-2"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowRight className="w-5 h-5 sm:w-5 sm:h-5" />
          </motion.div>
        </Button>
      </motion.div>

      {/* Tertiary CTA */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="hidden sm:block"
      >
        <Button 
          variant="ghost"
          size="lg"
          className="font-medium px-4 sm:px-6 py-3 sm:py-4 rounded-full text-base sm:text-lg text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 group"
        >
          <BookOpen className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
          Read Docs
          <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Button>
      </motion.div>

      {/* Mobile: Show tertiary CTA as a centered button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="sm:hidden w-full"
      >
        <button className="w-full py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-full transition-all duration-200 flex items-center justify-center group border border-slate-200 dark:border-slate-700">
          <BookOpen className="mr-2 w-4 h-4" />
          Read Documentation
          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </motion.div>
    </motion.div>
  )
}

export default HeroCTA