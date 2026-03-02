'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const Logo = ({ size = 'md', showText = true, className = '' }: LogoProps) => {
  const router = useRouter()
  
  const sizeClasses = {
    sm: { container: 'w-10 h-10', sText: 'text-lg', btcText: 'text-sm' },
    md: { container: 'w-12 h-12', sText: 'text-xl', btcText: 'text-base' }, 
    lg: { container: 'w-16 h-16', sText: 'text-2xl', btcText: 'text-lg' }
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <motion.div 
      onClick={() => router.push('/')}
      className={`flex items-center space-x-2 cursor-pointer ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative">
        {/* Sophisticated Hexagonal sBTC Logo */}
        <motion.div 
          className={`${sizeClasses[size].container} relative`}
          animate={{ 
            rotateY: [0, 360],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          {/* Clean Hexagonal Shape */}
          <div 
            className="relative w-full h-full bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-2xl"
            style={{
              clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))'
            }}
          >
            {/* Subtle Inner Shadow for Depth */}
            <div 
              className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"
              style={{
                clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)'
              }}
            />
            
            {/* sBTC Symbol */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, -360] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="flex items-center justify-center"
              >
                {/* S and Bitcoin Symbol */}
                <div className="relative flex items-center">
                  <div className={`${sizeClasses[size].sText} font-black text-white leading-none drop-shadow-lg`}>
                    S
                  </div>
                  <div className={`${sizeClasses[size].btcText} font-black text-yellow-300 leading-none drop-shadow-lg -ml-1`}>
                    ₿
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Clean Shine Effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{
                clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)'
              }}
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      </div>
      
      {showText && (
        <motion.div 
          className="block"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1 
            className={`${textSizeClasses[size]} font-bold text-gray-900 dark:text-white`}
            whileHover={{ scale: 1.02 }}
          >
            StacksPay
          </motion.h1>
          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium tracking-wide">
            StacksPay
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Logo