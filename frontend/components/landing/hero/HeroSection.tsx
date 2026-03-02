'use client'

import HeroTitle from './leftside/HeroTitle'
import HeroCTA from './leftside/HeroCTA'
import SpectacularPhonePreview from './rightside/SpectacularPhonePreview'
import { motion } from 'framer-motion'

const HeroSection = () => {
  return (
    <section className="relative pt-28 mx-auto pb-20 lg:pt-24 lg:pb-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.5) 1px, transparent 0), radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px, 40px 40px'
        }}
      />

      {/* Dark mode accent overlay */}
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex lg:flex-row flex-col items-center justify-between">
          {/* Left Column - Clean Content */}
          <div className="flex-1 max-w-2xl space-y-8 lg:space-y-8 lg:pr-12">
            <HeroTitle />
            <HeroCTA />
          </div>

          {/* Right Column - Phone overlapping Desktop */}
          <div className="hidden md:block w-full mt-16 lg:mt-0 lg:flex-1 relative">
            <SpectacularPhonePreview />
          </div>
        </div>
      </div>

      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-black dark:via-black/50 dark:to-transparent" />

      {/* Sophisticated Curved Border Transition */}
      <div className="absolute -bottom-16 left-0 right-0 h-32 overflow-hidden pointer-events-none">
        {/* Main curved border flowing diagonally */}
        <div className="relative w-full h-full">
          {/* Primary curved shape with diagonal flow */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
            <div className="absolute -bottom-16 left-0 right-0 h-32">
              <div className="w-full h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 rounded-tl-[120px] rounded-tr-[80px] transform -translate-y-1/2 skew-x-3"></div>
            </div>
          </div>

          {/* Accent curved overlay with orange gradient */}
          <div className="absolute -bottom-16 left-0 right-0 h-32">
            <div className="w-full h-full bg-gradient-to-br from-orange-100/40 via-orange-200/30 to-transparent dark:from-orange-900/50 dark:via-orange-800/40 dark:to-transparent rounded-tl-[100px] rounded-tr-[60px] transform -translate-y-1/2 skew-x-3"></div>
          </div>

          {/* Secondary accent curve for depth */}
          <div className="absolute -bottom-16 left-0 right-0 h-32">
            <div className="w-full h-full bg-gradient-to-br from-blue-100/20 via-purple-100/15 to-transparent dark:from-blue-900/30 dark:via-purple-900/25 dark:to-transparent rounded-tl-[90px] rounded-tr-[50px] transform -translate-y-1/2 skew-x-2"></div>
          </div>
        </div>

        {/* Floating geometric elements along the curve */}
        <motion.div
          animate={{
            y: [0, -6, 0],
            rotate: [0, 3, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-8 left-1/4 w-3 h-3 bg-orange-400/30 rounded-full blur-sm"
        />

        <motion.div
          animate={{
            y: [0, 4, 0],
            rotate: [0, -2, 0]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-12 left-1/2 w-2 h-2 bg-blue-400/25 rounded-full blur-sm"
        />

        <motion.div
          animate={{
            y: [0, -3, 0],
            rotate: [0, 1, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-16 right-1/3 w-2.5 h-2.5 bg-purple-400/20 rounded-full blur-sm"
        />

        {/* Diagonal accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent dark:via-orange-600/50 transform -skew-x-12"></div>
      </div>
    </section>
  )
}

export default HeroSection