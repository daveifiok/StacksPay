'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  Key,
  Users,
  Webhook,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogOut,
  Bell,
  Shield,
  Zap,
  Globe,
  ArrowUpDown,
  Rocket,
  User,
  RefreshCw,
  Building2,
  FileText,
  Store
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/shared/Logo'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: string
  isNew?: boolean
  children?: NavItem[]
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
    name: 'Disputes',
    href: '/dashboard/disputes',
    icon: Shield,
    badge: '2',
  },
  {
    name: 'Subscriptions',
    href: '/dashboard/subscriptions',
    icon: RefreshCw,
    isNew: true,
  },
  {
    name: 'Enterprise',
    href: '/dashboard/enterprise',
    icon: Building2,
    children: [
      {
        name: 'Overview',
        href: '/dashboard/enterprise',
        icon: LayoutDashboard,
      },
      {
        name: 'Escrow',
        href: '/dashboard/enterprise/escrow',
        icon: Shield,
      },
      {
        name: 'Multi-Signature',
        href: '/dashboard/enterprise/multisig',
        icon: Users,
      },
      {
        name: 'Compliance',
        href: '/dashboard/enterprise/compliance',
        icon: FileText,
      },
    ],
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
  {
    name: 'Marketplace',
    href: '/dashboard/marketplace',
    icon: Store,
    isNew: true,
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

const Sidebar = ({ collapsed, onCollapse }: SidebarProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (itemName: string) => {
    if (collapsed) return
    
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const NavItem = ({ item, isChild = false }: { item: NavItem; isChild?: boolean }) => {
    const active = isActive(item.href)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.name)

    return (
      <div>
        <motion.button
          whileHover={{ x: collapsed ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (hasChildren && !collapsed) {
              toggleExpanded(item.name)
            } else {
              router.push(item.href)
            }
          }}
          className={cn(
            'group flex items-center w-full text-left rounded-lg transition-all duration-200',
            collapsed ? 'px-3 py-2.5 justify-center' : isChild ? 'px-4 py-2 ml-6' : 'px-3 py-2.5',
            active
              ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <item.icon className={cn(
            'flex-shrink-0 transition-colors',
            collapsed ? 'h-5 w-5' : 'h-5 w-5',
            active ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
          )} />
          
          {!collapsed && (
            <>
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
              
              {hasChildren && (
                <ChevronRight className={cn(
                  'ml-2 h-4 w-4 transition-transform',
                  isExpanded && 'rotate-90'
                )} />
              )}
            </>
          )}
        </motion.button>

        {/* Child Items */}
        {hasChildren && !collapsed && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 space-y-1"
          >
            {item.children!.map((child) => (
              <NavItem key={child.name} item={child} isChild />
            ))}
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'fixed left-0 top-0 z-30 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
      collapsed ? 'w-20' : 'w-64'
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800',
          collapsed && 'justify-center'
        )}>
          {!collapsed ? (
            <Logo size="sm" showText={true} />
          ) : (
            <Logo size="sm" showText={false} />
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapse(!collapsed)}
            className={cn(
              'h-8 w-8 p-0',
              collapsed && 'hidden'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Expand button for collapsed state */}
        {collapsed && (
          <div className="p-2 border-b border-gray-200 dark:border-gray-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCollapse(false)}
              className="h-8 w-8 p-0 mx-auto"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
          
          <Separator className="my-4" />
          
          {secondaryNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          {!collapsed && (
            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
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
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className={cn(
              'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400',
              collapsed ? 'w-8 h-8 p-0' : 'w-full justify-start'
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign out</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
