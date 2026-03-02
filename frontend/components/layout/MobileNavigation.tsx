// 'use client'

// import { motion, AnimatePresence } from 'framer-motion'
// import { Button } from '@/components/ui/button'
// import { ArrowRight, ExternalLink } from 'lucide-react'

// interface MenuItem {
//   icon: any
//   title: string
//   description: string
//   href: string
//   badge?: string
// }

// interface MobileNavProps {
//   isOpen: boolean
//   productItems: MenuItem[]
//   developerItems: MenuItem[]
//   onClose: () => void
// }

// const MobileNavigation = ({ isOpen, productItems, developerItems, onClose }: MobileNavProps) => {
//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div
//           initial={{ opacity: 0, height: 0 }}
//           animate={{ opacity: 1, height: "auto" }}
//           exit={{ opacity: 0, height: 0 }}
//           transition={{ duration: 0.3, ease: "easeInOut" }}
//           className="lg:hidden overflow-hidden bg-white  border-t border-gray-200/50 mt-4 rounded-2xl shadow-2xl mx-4"
//         >
//           <div className="px-6 py-8 space-y-8">
//             {/* Products Section */}
//             <div className="space-y-4">
//               <div className="flex items-center space-x-2">
//                 <h3 className="font-bold text-[#0A1628] text-sm uppercase tracking-wide">
//                   Products
//                 </h3>
//                 <div className="px-2 py-1 bg-gradient-to-r from-[#F7931A]/10 to-[#5546FF]/10 rounded-full">
//                   <span className="text-xs font-medium text-[#F7931A]">STACKS</span>
//                 </div>
//               </div>
              
//               <div className="space-y-3">
//                 {productItems.map((item, index) => (
//                   <motion.div
//                     key={item.title}
//                     initial={{ opacity: 0, x: -20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: index * 0.1 }}
//                     className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gradient-to-r hover:from-[#F7931A]/5 hover:to-[#5546FF]/5 cursor-pointer border border-transparent hover:border-[#F7931A]/20"
//                   >
//                     <div className="w-10 h-10 bg-gradient-to-br from-[#F7931A]/20 to-[#5546FF]/20 rounded-xl flex items-center justify-center">
//                       <item.icon className="w-5 h-5 text-[#5546FF]" />
//                     </div>
//                     <div className="flex-1">
//                       <div className="flex items-center space-x-2">
//                         <h4 className="font-semibold text-[#0A1628] text-sm">
//                           {item.title}
//                         </h4>
//                         {item.badge && (
//                           <span className="px-2 py-0.5 bg-[#16A34A]/10 text-[#16A34A] text-xs font-medium rounded-full">
//                             {item.badge}
//                           </span>
//                         )}
//                       </div>
//                       <p className="text-xs text-[#64748B] mt-1">
//                         {item.description}
//                       </p>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </div>

//             {/* Developers Section */}
//             <div className="space-y-4">
//               <div className="flex items-center space-x-2">
//                 <h3 className="font-bold text-[#0A1628] text-sm uppercase tracking-wide">
//                   Developers
//                 </h3>
//                 <div className="px-2 py-1 bg-gradient-to-r from-[#00D4FF]/10 to-[#16A34A]/10 rounded-full">
//                   <span className="text-xs font-medium text-[#00D4FF]">TOOLS</span>
//                 </div>
//               </div>
              
//               <div className="space-y-3">
//                 {developerItems.map((item, index) => (
//                   <motion.div
//                     key={item.title}
//                     initial={{ opacity: 0, x: -20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: index * 0.1 }}
//                     className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gradient-to-r hover:from-[#00D4FF]/5 hover:to-[#16A34A]/5 cursor-pointer border border-transparent hover:border-[#00D4FF]/20"
//                   >
//                     <div className="w-10 h-10 bg-gradient-to-br from-[#00D4FF]/20 to-[#16A34A]/20 rounded-xl flex items-center justify-center">
//                       <item.icon className="w-5 h-5 text-[#00D4FF]" />
//                     </div>
//                     <div className="flex-1">
//                       <div className="flex items-center space-x-2">
//                         <h4 className="font-semibold text-[#0A1628] text-sm">
//                           {item.title}
//                         </h4>
//                         {item.href.includes('github') && (
//                           <ExternalLink className="w-3 h-3 text-[#64748B]" />
//                         )}
//                       </div>
//                       <p className="text-xs text-[#64748B] mt-1">
//                         {item.description}
//                       </p>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </div>

//             {/* Additional Links */}
//             <div className="space-y-3 pt-4 border-t border-gray-200/50">
//               <Button 
//                 variant="ghost" 
//                 className="w-full justify-start text-[#64748B] hover:text-[#0A1628] font-medium hover:bg-[#F8FAFC]"
//               >
//                 Pricing
//               </Button>
//               <Button 
//                 variant="ghost" 
//                 className="w-full justify-start text-[#64748B] hover:text-[#0A1628] font-medium hover:bg-[#F8FAFC]"
//               >
//                 Company
//               </Button>
//               <Button 
//                 variant="ghost" 
//                 className="w-full justify-start text-[#64748B] hover:text-[#0A1628] font-medium hover:bg-[#F8FAFC]"
//               >
//                 Resources
//               </Button>
//             </div>

//             {/* CTA Buttons */}
//             <div className="space-y-4 pt-6 border-t border-gray-200/50">
//               <Button 
//                 variant="outline" 
//                 className="w-full text-[#64748B] hover:text-[#0A1628] border-gray-300 hover:border-gray-400"
//               >
//                 Sign in
//               </Button>
              
//               <motion.div
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//               >
//                 <Button 
//                   className="w-full bg-gradient-to-r from-[#F7931A] to-[#5546FF] hover:from-[#F7931A]/90 hover:to-[#5546FF]/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
//                   onClick={onClose}
//                 >
//                   Start Building
//                   <ArrowRight className="ml-2 w-4 h-4" />
//                 </Button>
//               </motion.div>
              
//               <div className="text-center pt-2">
//                 <p className="text-xs text-[#64748B]">
//                   Support for <span className="font-semibold text-[#5546FF]">Stacks</span> & <span className="font-semibold text-[#F7931A]">Bitcoin</span> wallets
//                 </p>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   )
// }

// export default MobileNavigation

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, ExternalLink } from 'lucide-react'

interface MenuItem {
  icon: any
  title: string
  description: string
  href: string
  badge?: string
}

interface MobileNavProps {
  isOpen: boolean
  productItems: MenuItem[]
  developerItems: MenuItem[]
  onClose: () => void
}

const MobileNavigation = ({ isOpen, productItems, developerItems, onClose }: MobileNavProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="lg:hidden overflow-hidden bg-white dark:bg-gray-900 border-t border-gray-200/50 dark:border-gray-700/50 mt-4 rounded-2xl shadow-2xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] mx-4"
        >
          <div className="px-6 py-8 space-y-8">
            {/* Products Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-[#0A1628] dark:text-gray-100 text-sm uppercase tracking-wide">
                  Products
                </h3>
                <div className="px-2 py-1 bg-gradient-to-r from-[#F7931A]/10 to-[#5546FF]/10 dark:from-[#F7931A]/20 dark:to-[#5546FF]/20 rounded-full">
                  <span className="text-xs font-medium text-[#F7931A] dark:text-orange-400">STACKS</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {productItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-[#F7931A]/5 hover:to-[#5546FF]/5 dark:hover:from-[#F7931A]/10 dark:hover:to-[#5546FF]/10 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-[#F7931A]/20 dark:hover:border-[#F7931A]/30 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-[#F7931A]/20 to-[#5546FF]/20 dark:from-[#F7931A]/30 dark:to-[#5546FF]/30 rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#5546FF] dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-[#0A1628] dark:text-gray-100 text-sm">
                          {item.title}
                        </h4>
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-[#16A34A]/10 dark:bg-[#16A34A]/20 text-[#16A34A] dark:text-green-400 text-xs font-medium rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Developers Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-[#0A1628] dark:text-gray-100 text-sm uppercase tracking-wide">
                  Developers
                </h3>
                <div className="px-2 py-1 bg-gradient-to-r from-[#00D4FF]/10 to-[#16A34A]/10 dark:from-[#00D4FF]/20 dark:to-[#16A34A]/20 rounded-full">
                  <span className="text-xs font-medium text-[#00D4FF] dark:text-cyan-400">TOOLS</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {developerItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-[#00D4FF]/5 hover:to-[#16A34A]/5 dark:hover:from-[#00D4FF]/10 dark:hover:to-[#16A34A]/10 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-[#00D4FF]/20 dark:hover:border-[#00D4FF]/30 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-[#00D4FF]/20 to-[#16A34A]/20 dark:from-[#00D4FF]/30 dark:to-[#16A34A]/30 rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#00D4FF] dark:text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-[#0A1628] dark:text-gray-100 text-sm">
                          {item.title}
                        </h4>
                        {item.href.includes('github') && (
                          <ExternalLink className="w-3 h-3 text-[#64748B] dark:text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Additional Links */}
            <div className="space-y-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-[#64748B] dark:text-gray-400 hover:text-[#0A1628] dark:hover:text-gray-100 font-medium hover:bg-[#F8FAFC] dark:hover:bg-gray-800"
              >
                Pricing
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-[#64748B] dark:text-gray-400 hover:text-[#0A1628] dark:hover:text-gray-100 font-medium hover:bg-[#F8FAFC] dark:hover:bg-gray-800"
              >
                Company
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-[#64748B] dark:text-gray-400 hover:text-[#0A1628] dark:hover:text-gray-100 font-medium hover:bg-[#F8FAFC] dark:hover:bg-gray-800"
              >
                Resources
              </Button>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button 
                variant="outline" 
                className="w-full text-[#64748B] dark:text-gray-400 hover:text-[#0A1628] dark:hover:text-gray-100 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Sign in
              </Button>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  className="w-full bg-gradient-to-r from-[#F7931A] to-[#5546FF] hover:from-[#F7931A]/90 hover:to-[#5546FF]/90 dark:from-[#F7931A] dark:to-[#5546FF] dark:hover:from-[#F7931A]/90 dark:hover:to-[#5546FF]/90 text-white font-semibold shadow-lg hover:shadow-xl dark:shadow-lg dark:hover:shadow-xl transition-all duration-300"
                  onClick={onClose}
                >
                  Start Building
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
              
              <div className="text-center pt-2">
                <p className="text-xs text-[#64748B] dark:text-gray-400">
                  Support for <span className="font-semibold text-[#5546FF] dark:text-blue-400">Stacks</span> & <span className="font-semibold text-[#F7931A] dark:text-orange-400">Bitcoin</span> wallets
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MobileNavigation