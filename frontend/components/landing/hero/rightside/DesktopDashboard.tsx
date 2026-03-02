'use client'

import Logo from '@/components/shared/Logo'
import { motion } from 'framer-motion'
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'

const DesktopDashboard = () => {
  const dailyData = [
    { time: '12:00 AM', volume: 12500 },
    { time: '4:00 AM', volume: 8200 },
    { time: '8:00 AM', volume: 25600 },
    { time: '12:00 PM', volume: 42800 },
    { time: '4:00 PM', volume: 38200 },
    { time: '8:00 PM', volume: 31500 },
    { time: 'Now, 2:00 PM', volume: 39274 }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="hidden md:block w-[800px] h-[500px] bg-gradient-to-br from-slate-50 via-white to-zinc-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-[0_20px_40px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.4)] border border-slate-200/40 dark:border-gray-700/40 backdrop-blur-sm overflow-hidden mr-12 relative"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.15),rgba(0,0,0,0))]"></div>
      </div>

      {/* Glass overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/[0.02] dark:from-white/[0.02] dark:via-transparent dark:to-white/[0.01] pointer-events-none"></div>

      {/* Desktop Header */}
      <div className="bg-gradient-to-r from-slate-50/60 via-white/80 to-slate-50/60 dark:from-gray-800/60 dark:via-gray-900/80 dark:to-gray-800/60 backdrop-blur-xl px-6 py-2.5 border-b border-slate-200/30 dark:border-gray-700/30 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-orange-600/10 dark:from-orange-400/20 dark:to-orange-600/20 rounded-lg blur-lg scale-110"></div>
              <div className="relative bg-gradient-to-br from-orange-50/80 to-orange-100/60 dark:from-orange-900/40 dark:to-orange-800/40 p-1.5 rounded-lg border border-orange-200/30 dark:border-orange-700/30 shadow-sm">
                <Logo size="md" showText={false} />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">StacksPay Analytics</h3>
              <p className="text-slate-600 dark:text-gray-400 text-xs font-medium leading-tight">Real-time payment dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-50/80 to-green-50/80 dark:from-emerald-900/40 dark:to-green-900/40 px-2.5 py-1 rounded-lg border border-green-200/30 dark:border-green-700/30 shadow-sm">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-sm"></div>
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
              </div>
              <span className="text-xs text-green-700 dark:text-green-400 font-semibold">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Content */}
      <div className="p-3 h-full relative z-10">
        <div className="grid grid-cols-4 gap-2 mb-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative bg-gradient-to-br from-blue-50/70 via-blue-50/50 to-blue-100/70 dark:from-blue-900/30 dark:via-blue-900/20 dark:to-blue-800/30 backdrop-blur-sm p-2 rounded-lg border border-blue-200/20 dark:border-blue-700/20 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-blue-600/[0.02] dark:from-blue-400/[0.05] dark:to-blue-500/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-lg font-bold bg-gradient-to-r from-blue-700 to-blue-900 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent leading-tight">$3.5M</div>
              <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">Net Volume</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/80 dark:bg-emerald-900/40 px-1 py-0.5 rounded-full mt-0.5 inline-block">+32.8%</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-br from-emerald-50/70 via-green-50/50 to-emerald-100/70 dark:from-emerald-900/30 dark:via-green-900/20 dark:to-emerald-800/30 backdrop-blur-sm p-2 rounded-lg border border-emerald-200/20 dark:border-emerald-700/20 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-green-600/[0.02] dark:from-emerald-400/[0.05] dark:to-green-500/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-green-900 dark:from-emerald-400 dark:to-green-300 bg-clip-text text-transparent leading-tight">2,847</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Transactions</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-100/80 dark:bg-slate-800/80 px-1 py-0.5 rounded-full mt-0.5 inline-block">Updated today</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative bg-gradient-to-br from-violet-50/70 via-purple-50/50 to-violet-100/70 dark:from-violet-900/30 dark:via-purple-900/20 dark:to-violet-800/30 backdrop-blur-sm p-2 rounded-lg border border-violet-200/20 dark:border-violet-700/20 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] to-purple-600/[0.02] dark:from-violet-400/[0.05] dark:to-purple-500/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-lg font-bold bg-gradient-to-r from-violet-700 to-purple-900 dark:from-violet-400 dark:to-purple-300 bg-clip-text text-transparent leading-tight">374</div>
              <div className="text-xs text-violet-700 dark:text-violet-400 font-medium">Active Users</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100/80 dark:bg-slate-800/80 px-1 py-0.5 rounded-full mt-0.5 inline-block">Last 24h</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative bg-gradient-to-br from-amber-50/70 via-orange-50/50 to-amber-100/70 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-amber-800/30 backdrop-blur-sm p-2 rounded-lg border border-amber-200/20 dark:border-amber-700/20 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-orange-600/[0.02] dark:from-amber-400/[0.05] dark:to-orange-500/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-lg font-bold bg-gradient-to-r from-amber-700 to-orange-900 dark:from-amber-400 dark:to-orange-300 bg-clip-text text-transparent leading-tight">$39K</div>
              <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">Sales Revenue</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100/80 dark:bg-slate-800/80 px-1 py-0.5 rounded-full mt-0.5 inline-block">vs $29,573</div>
            </div>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-gray-700/50 rounded-2xl p-3 pb-12 h-72 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.4)] transition-all duration-300"
        >
          {/* Chart header with enhanced styling */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Net volume from sales</h4>
              <p className="text-xs text-slate-500 dark:text-gray-400">Last 24 hours</p>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
              <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">Volume</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="desktopGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="desktopGradientDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1e40af"/>
                  <stop offset="50%" stopColor="#3b82f6"/>
                  <stop offset="100%" stopColor="#60a5fa"/>
                </linearGradient>
                <linearGradient id="strokeGradientDark" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6"/>
                  <stop offset="50%" stopColor="#60a5fa"/>
                  <stop offset="100%" stopColor="#93c5fd"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" className="dark:stroke-gray-700" strokeOpacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b"
                className="dark:stroke-gray-400"
                fontSize={10}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis 
                stroke="#64748b"
                className="dark:stroke-gray-400"
                fontSize={10}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                dx={-8}
                tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
              />
              <Area 
                type="monotone" 
                dataKey="volume" 
                stroke="url(#strokeGradient)" 
                strokeWidth={2.5}
                fill="url(#desktopGradient)"
                dot={{ fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff', r: 3 }}
                activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default DesktopDashboard