'use client'

import { Wallet, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Menu,
  Search,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Globe,
  Moon,
  Sun
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/use-auth'
import { useUnreadNotificationCount } from '@/hooks/use-notifications'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { cn } from '@/lib/utils'

interface NavbarProps {
  onMenuToggle: () => void
  user: {
    id: string
    name: string
    email?: string | null
    stacksAddress?: string
    authMethod?: 'email' | 'wallet'
    walletConnected?: boolean
    emailVerified?: boolean
    verificationLevel?: string
    businessType?: string
  } | null
}

const Navbar = ({ onMenuToggle, user }: NavbarProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedAddress, setCopiedAddress] = useState(false)
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const { unreadCount } = useUnreadNotificationCount()

  // Helper function to copy wallet address to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Helper function to truncate wallet address
  const truncateAddress = (address: string, startLength = 6, endLength = 4) => {
    if (!address) return '';
    if (address.length <= startLength + endLength) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  };

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="hidden sm:block relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search payments, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-64 lg:w-80 bg-gray-50 dark:bg-gray-800 border-0 focus:bg-white dark:focus:bg-gray-900 transition-colors"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Environment Badge */}
          <Badge variant="outline" className="hidden sm:flex bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
            <Globe className="h-3 w-3 mr-1" />
            Testnet
          </Badge>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden sm:flex"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                    {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Demo User'}</p>
                    {user?.authMethod === 'wallet' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 text-orange-700 dark:text-orange-400 font-medium border border-orange-200 dark:border-orange-800">
                        <Wallet className="w-3 h-3 mr-1" />
                        Wallet Account
                      </span>
                    )}
                  </div>
                  
                  {user?.stacksAddress ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Wallet Address</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => copyToClipboard(user.stacksAddress!)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                            title="Copy address"
                          >
                            {copiedAddress ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 px-2 py-1 rounded border break-all">
                        {user.stacksAddress}
                      </div>
                    </div>
                  ) : user?.email ? (
                    <div className="space-y-1">
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      {user?.authMethod === 'email' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                          <User className="w-3 h-3 mr-1" />
                          Email Account
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs leading-none text-muted-foreground">
                      No contact info
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => logout()}
                className="text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default Navbar
