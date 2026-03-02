'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './navigation/Sidebar'
import Navbar from './navigation/Navbar'
import MobileMenu from './navigation/MobileMenu'
import EmailVerificationBanner from './verification/EmailVerificationBanner'
import { useAuth } from '@/hooks/use-auth'
import { Toaster } from '@/components/ui/toaster'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  // Prevent dashboard access without authentication
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <MobileMenu 
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top Navigation */}
        <Navbar 
          onMenuToggle={() => setSidebarOpen(true)}
          user={user}
        />

        {/* Email Verification Banner */}
        {user && user.email && <EmailVerificationBanner user={{ emailVerified: user.emailVerified, email: user.email }} />}

        {/* Page Content */}
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}

export default DashboardLayout
