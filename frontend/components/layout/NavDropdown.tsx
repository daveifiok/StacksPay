'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MenuItem {
  icon: any
  title: string
  description: string
  href: string
  badge?: string
  gradient?: string
}

interface NavDropdownProps {
  title: string
  items: MenuItem[]
  gradientFrom?: string
  gradientTo?: string
}

const NavDropdown = ({ 
  title, 
  items, 
  gradientFrom = '#F7931A', 
  gradientTo = '#5546FF' 
}: NavDropdownProps) => {
  // Convert hex to RGB for opacity variations
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  const fromRgb = hexToRgb(gradientFrom);
  const toRgb = hexToRgb(gradientTo);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="text-[#64748B] dark:text-gray-400 hover:text-[#0A1628] dark:hover:text-gray-100 font-medium h-auto p-2 hover:bg-[#F8FAFC] dark:hover:bg-gray-800 group transition-colors duration-200"
        >
          {title}
          <ChevronDown className="ml-1 w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] rounded-2xl">
        <div className="space-y-2">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <DropdownMenuItem className="p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-[#F8FAFC] hover:to-[#F1F5F9] dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 cursor-pointer group border border-gray-100 dark:border-gray-700 hover:border-gray-200/50 dark:hover:border-gray-600/50 transition-all duration-200">
                <div className="flex items-start space-x-4 w-full">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                    style={{
                      background: fromRgb && toRgb 
                        ? `linear-gradient(135deg, rgba(${fromRgb.r}, ${fromRgb.g}, ${fromRgb.b}, 0.15), rgba(${toRgb.r}, ${toRgb.g}, ${toRgb.b}, 0.15))`
                        : `linear-gradient(135deg, ${gradientFrom}15, ${gradientTo}15)`
                    }}
                  >
                    <item.icon 
                      className="w-5 h-5" 
                      style={{ color: gradientFrom }} 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-[#0A1628] dark:text-gray-100 group-hover:text-[#1E293B] dark:group-hover:text-white transition-colors duration-200">
                        {item.title}
                      </h4>
                      {item.badge && (
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded-full border transition-colors duration-200"
                          style={{
                            background: fromRgb && toRgb 
                              ? `linear-gradient(135deg, rgba(${fromRgb.r}, ${fromRgb.g}, ${fromRgb.b}, 0.1), rgba(${toRgb.r}, ${toRgb.g}, ${toRgb.b}, 0.1))`
                              : `linear-gradient(135deg, ${gradientFrom}10, ${gradientTo}10)`,
                            borderColor: fromRgb 
                              ? `rgba(${fromRgb.r}, ${fromRgb.g}, ${fromRgb.b}, 0.3)`
                              : `${gradientFrom}30`,
                            color: gradientFrom
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1 leading-relaxed group-hover:text-[#475569] dark:group-hover:text-gray-300 transition-colors duration-200">
                      {item.description}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            </motion.div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NavDropdown