'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X,
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  Key,
  Users,
  Webhook,
  HelpCircle,
  LogOut,
  Shield,
  Zap,
  Globe,
  ArrowUpDown,
  User,
  Rocket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Logo from '@/components/shared/Logo'
import { cn } from '@/lib/utils'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: string
  isNew?: boolean
}

const navigation: NavItem[] = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Get Started',
    href: '/dashboard/onboarding',
    icon: Rocket,
    isNew: true,
  },
  {
    name: 'Payments',
    href: '/dashboard/payments',
    icon: CreditCard,
    badge: '12',
  },
  {
    name: 'Balance & Conversion',
    href: '/dashboard/conversion',
    icon: ArrowUpDown,
    isNew: true,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: User,
  },
  {
    name: 'API Keys',
    href: '/dashboard/api-keys',
    icon: Key,
  },
  {
    name: 'Webhooks',
    href: '/dashboard/webhooks',
    icon: Webhook,
  },
  {
    name: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
  },
]

const secondaryNavigation: NavItem[] = [
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
  {
    name: 'Security',
    href: '/dashboard/security',
    icon: Shield,
  },
  {
    name: 'Developer',
    href: '/dashboard/developer',
    icon: Zap,
  },
  {
    name: 'Help',
    href: '/dashboard/help',
    icon: HelpCircle,
  },
]

const MobileMenu = ({ open, onClose }: MobileMenuProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    onClose()
  }

  const NavItem = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href)

    return (
      <motion.button
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleNavigation(item.href)}
        className={cn(
          'group flex items-center w-full text-left px-4 py-3 rounded-lg transition-all duration-200',
          active
            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
        )}
      >
        <item.icon className={cn(
          'h-5 w-5 flex-shrink-0 transition-colors',
          active ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
        )} />
        
        <span className="ml-3 text-sm font-medium flex-1">{item.name}</span>
        
        {item.badge && (
          <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
            {item.badge}
          </Badge>
        )}
        
        {item.isNew && (
          <Badge className="ml-2 bg-blue-500 text-white text-xs">
            New
          </Badge>
        )}
      </motion.button>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="relative z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar */}
          <div className="fixed inset-0 flex">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative mr-16 flex w-full max-w-xs flex-1"
            >
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-4 border-r border-gray-200 dark:border-gray-800">
                {/* Header */}
                <div className="flex h-16 shrink-0 items-center justify-between">
                  <Logo size="sm" showText={true} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col">
                  <div className="space-y-2">
                    {navigation.map((item) => (
                      <NavItem key={item.name} item={item} />
                    ))}
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-2">
                    {secondaryNavigation.map((item) => (
                      <NavItem key={item.name} item={item} />
                    ))}
                  </div>

                  {/* Environment Badge */}
                  <div className="mt-6 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                        Testnet Mode
                      </span>
                    </div>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Switch to mainnet in settings
                    </p>
                  </div>

                  {/* Sign Out */}
                  <div className="mt-auto pt-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </Button>
                  </div>
                </nav>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default MobileMenu
