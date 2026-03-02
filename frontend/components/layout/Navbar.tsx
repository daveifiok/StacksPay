'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Menu, 
  X, 
  ChevronDown,
  Code, 
  BookOpen, 
  Zap, 
  Shield, 
  ArrowRight,
  Database,
  GitBranch,
  LayoutDashboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Logo from '../shared/Logo'
import ThemeToggle from '../shared/ThemeToggle'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { LogOut, User, Settings, Wallet, Copy, CheckCircle, ExternalLink, Mail } from 'lucide-react'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = () => {
      if (showUserDropdown) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showUserDropdown])

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800' 
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto sm:px-6 ">
          <div className="flex justify-between px-4 sm:px-0  items-center h-16 sm:h-[4.5rem]">
            {/* Logo */}
            <Logo size="md" showText={true} />

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {/* Products */}
              <div className="relative group">
                <Button 
                  variant="ghost" 
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium px-3 py-2"
                >
                  Products
                  <ChevronDown className="ml-1 w-4 h-4" />
                </Button>
                
                {/* Dropdown - Stacks style */}
                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4">
                  <div className="grid gap-3">
                    <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <Code className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Payment API</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Accept Bitcoin payments</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Payment Widgets</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Drop-in components</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Enterprise</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Custom solutions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Developers */}
              <div className="relative group">
                <Button 
                  variant="ghost" 
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium px-3 py-2"
                >
                  Developers
                  <ChevronDown className="ml-1 w-4 h-4" />
                </Button>
                
                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4">
                  <div className="grid gap-3">
                    <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Documentation</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Complete guides</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">API Reference</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Interactive docs</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <GitBranch className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">GitHub</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Open source</p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium">
                Pricing
              </Button>
              
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium">
                Company
              </Button>
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {isAuthenticated && user ? (
                /* User Dropdown */
                <div className="relative">
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUserDropdown(!showUserDropdown);
                      }}
                      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                    <div className="flex items-center space-x-3">
                      {/* Avatar with wallet indicator */}
                      <div className="relative">
                        <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        {user.stacksAddress && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                            <Wallet className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* User info */}
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {user.name || 'Anonymous User'}
                        </div>
                        {user.stacksAddress ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {truncateAddress(user.stacksAddress)}
                          </div>
                        ) : user.email ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            No contact info
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200" />
                  </Button>

                  {showUserDropdown && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 py-2 z-50 overflow-hidden"
                    >
                      {/* User Header */}
                      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            {user.stacksAddress && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                                <Wallet className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {user.name || 'Anonymous User'}
                            </p>
                            
                            {user.stacksAddress ? (
                              <div className="space-y-2 mt-1">
                                <div className="flex items-center space-x-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                                    <Wallet className="w-3 h-3 mr-1" />
                                    Wallet Connected
                                  </span>
                                </div>
                                
                                {/* Wallet Address Display */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                                        Stacks Address
                                      </p>
                                      <p className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                                        {user.stacksAddress}
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center space-x-1 ml-3">
                                      <button
                                        onClick={() => copyToClipboard(user.stacksAddress!)}
                                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                                        title="Copy address"
                                      >
                                        {copiedAddress ? (
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                                        )}
                                      </button>
                                      
                                      <button
                                        onClick={() => window.open(`https://explorer.stacks.co/address/${user.stacksAddress}?chain=testnet`, '_blank')}
                                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                                        title="View on explorer"
                                      >
                                        <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : user.email ? (
                              <div className="space-y-1 mt-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {user.email}
                                </p>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email Account
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1 mt-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  No contact info
                                </p>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                                  <User className="w-3 h-3 mr-1" />
                                  Guest Account
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            router.push('/dashboard');
                            setShowUserDropdown(false);
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                            <LayoutDashboard className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="text-gray-900 dark:text-gray-100 font-medium">Dashboard</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Overview & insights</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            router.push('/dashboard/profile');
                            setShowUserDropdown(false);
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                            <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="text-gray-900 dark:text-gray-100 font-medium">Profile</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Personal & business info</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            router.push('/dashboard/settings');
                            setShowUserDropdown(false);
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                            <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="text-gray-900 dark:text-gray-100 font-medium">Settings</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Preferences & security</div>
                          </div>
                        </button>
                        
                        <div className="border-t border-gray-200 dark:border-gray-800 mt-2 pt-2">
                          <button
                            onClick={() => {
                              logout();
                              setShowUserDropdown(false);
                            }}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                              <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <div className="text-red-600 dark:text-red-400 font-medium">Sign out</div>
                              <div className="text-xs text-red-500 dark:text-red-500">End your session</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Unauthenticated CTA */
                <>
                  <Button 
                    variant="ghost" 
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium"
                    onClick={() => router.push("/login")}
                  >
                    Sign in
                  </Button>
                  
                  <Button 
                    className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium rounded-full px-6 transition-colors"
                    onClick={() => router.push("/register")}
                  >
                    Start Building
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              {/* Mobile Theme Toggle */}
              <ThemeToggle />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden w-full border-t bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 p-4"
            >
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Products</h3>
                  <div className="space-y-2 pl-4">
                    <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Payment API</a>
                    <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Payment Widgets</a>
                    <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Enterprise</a>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Developers</h3>
                  <div className="space-y-2 pl-4">
                    <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Documentation</a>
                    <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">API Reference</a>
                    <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">GitHub</a>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {isAuthenticated && user ? (
                    <>
                      {/* Mobile User Header */}
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl mb-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            {user.stacksAddress && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                                <Wallet className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {user.name || 'Anonymous User'}
                            </p>
                            
                            {user.stacksAddress ? (
                              <div className="space-y-2 mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                                  <Wallet className="w-3 h-3 mr-1" />
                                  Wallet Connected
                                </span>
                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                                  {truncateAddress(user.stacksAddress, 8, 6)}
                                </p>
                              </div>
                            ) : user.email ? (
                              <div className="space-y-1 mt-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {user.email}
                                </p>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email Account
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1 mt-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  No contact info
                                </p>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                                  <User className="w-3 h-3 mr-1" />
                                  Guest Account
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Mobile Wallet Address Actions */}
                        {user.stacksAddress && (
                          <div className="mt-3 flex items-center space-x-2">
                            <button
                              onClick={() => copyToClipboard(user.stacksAddress!)}
                              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              {copiedAddress ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">Copy Address</span>
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => window.open(`https://explorer.stacks.co/address/${user.stacksAddress}?chain=testnet`, '_blank')}
                              className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => {
                          router.push("/dashboard");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => {
                          router.push("/dashboard/profile");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => {
                          router.push("/dashboard/settings");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => router.push("/login")}
                      >
                        Sign in
                      </Button>
                      <Button 
                        className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-full transition-colors"
                        onClick={() => router.push("/register")}
                      >
                        Start Building
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </nav>
      </motion.header>
    </>
  )
}

export default Navbar