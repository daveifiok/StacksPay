'use client'

import { motion } from 'framer-motion'

interface PhoneFrameProps {
  views: Array<{
    id: string
    title: string
    icon: any
  }>
  currentView: number
  setCurrentView: (index: number) => void
  children: React.ReactNode
}

const PhoneFrame = ({ views, currentView, setCurrentView, children }: PhoneFrameProps) => {
  return (
    <div className="relative flex-shrink-0">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative mx-auto w-[340px] h-[610px]"
      >
        {/* Phone Outer Frame */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-800 dark:from-gray-700 dark:to-gray-800 rounded-[3rem] p-2 shadow-2xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]" 
             style={{
               boxShadow: '0 35px 60px -15px rgba(0, 0, 0, 0.4), 0 8px 25px -8px rgba(0, 0, 0, 0.3)'
             }}
        >
          {/* Phone Inner Frame */}
          <div className="relative w-full h-full bg-black dark:bg-gray-900 rounded-[2.5rem] overflow-hidden">
            {/* Screen */}
            <div className="absolute inset-0 dark:inset-2 bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden">
              {/* Dynamic Island */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black dark:bg-gray-800 rounded-full z-20" />
              
              {/* Status Bar */}
              <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-black dark:text-gray-100 z-10">
                <span className="text-sm font-semibold">9:41</span>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-2 bg-green-500 dark:bg-green-400 rounded-sm" />
                </div>
              </div>

              {/* Bottom Tab Navigation */}
              <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 z-10">
                <div className="flex">
                  {views.map((view, index) => (
                    <motion.button
                      key={view.id}
                      onClick={() => setCurrentView(index)}
                      className={`flex-1 py-3 px-2 flex flex-col items-center space-y-1 transition-all duration-300 ${
                        index === currentView 
                          ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20' 
                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <view.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{view.title}</span>
                    </motion.button>
                  ))}
                </div>
                
                {/* View Indicators - Inside Phone */}
                <div className="flex justify-center pb-3 pt-1.5">
                  {views.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-1 mx-1 rounded-full transition-all duration-300 ${
                        index === currentView 
                          ? 'w-6 bg-orange-500 dark:bg-orange-400' 
                          : 'w-1 bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Content Area */}
              <div className="absolute top-16 bottom-24 left-0 right-0 overflow-hidden">
                {children}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default PhoneFrame
