'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Activity, ArrowUpRight, Eye, Bell, Bitcoin, BarChart3, Settings } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { useAutoScroll } from '@/hooks/useAutoScroll'

const DashboardView = ({ tabIndex }: { tabIndex?: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  useAutoScroll(scrollRef, tabIndex)

  const revenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 72000 },
    { month: 'Jun', revenue: 85000 }
  ]

  const pieData = [
    { name: 'sBTC', value: 65, color: '#f97316' },
    { name: 'Lightning', value: 25, color: '#3b82f6' },
    { name: 'On-chain', value: 10, color: '#10b981' }
  ]

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto"
      style={{ 
        scrollBehavior: 'smooth',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}
    >
      <div className="p-3 space-y-3 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight">Dashboard</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Your payment overview</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
            </div>
            <Bell className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-xl border border-blue-200/60 dark:border-blue-700/40 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <ArrowUpRight className="w-3 h-3 text-green-500 dark:text-green-400" />
            </div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300 leading-tight">$85K</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">This Month</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">+12.5%</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-xl border border-green-200/60 dark:border-green-700/40 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-1.5">
              <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
              <ArrowUpRight className="w-3 h-3 text-green-500 dark:text-green-400" />
            </div>
            <div className="text-lg font-bold text-green-700 dark:text-green-300 leading-tight">750</div>
            <div className="text-xs text-green-600 dark:text-green-400">Transactions</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">+8.3%</div>
          </motion.div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-xs">Revenue Trend</h4>
            <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenueDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#colorRevenue)" 
                  className="dark:fill-[url(#colorRevenueDark)]"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-xs mb-2">Payment Methods</h4>
          <div className="space-y-1.5">
            {pieData.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{item.value}%</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-xs mb-2">Recent Activity</h4>
          <div className="space-y-2">
            {[
              { amount: '0.05 sBTC', status: 'completed', time: '2m ago', merchant: 'TechStore' },
              { amount: '0.12 sBTC', status: 'completed', time: '5m ago', merchant: 'CoffeeShop' },
              { amount: '0.08 sBTC', status: 'pending', time: '7m ago', merchant: 'BookStore' }
            ].map((tx, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-lg backdrop-blur-sm"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                    <Bitcoin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="font-medium text-xs text-gray-900 dark:text-gray-100 leading-tight">{tx.amount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{tx.merchant}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    tx.status === 'completed' 
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' 
                      : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
                  }`}>
                    {tx.status}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tx.time}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions - This will be revealed by auto-scroll */}
        <div className="bg-white dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-xs mb-2">Quick Actions</h4>
          <div className="space-y-2">
            <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 text-xs">
              <Settings className="w-4 h-4" />
              <span>Manage Settings</span>
            </button>
            <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 text-xs">
              <BarChart3 className="w-4 h-4" />
              <span>View Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardView