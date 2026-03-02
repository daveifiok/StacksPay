'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
    Bitcoin,
    Zap,
    Shield,
    DollarSign,
    CheckCircle,
    TrendingUp,
    Activity,
    Clock,
    ArrowUpDown,
    Database,
    Cpu,
    Network,
    Server,
    Layers,
    Sparkles,
    ArrowRight
} from 'lucide-react'

const SpectacularDemo = () => {
    const [activeFlow, setActiveFlow] = useState(0)
    const [pulseIndex, setPulseIndex] = useState(0)
    const [liveMetrics, setLiveMetrics] = useState({
        volume: 2403847,
        transactions: 1247,
        avgSettlement: 6.2
    })

    const flows = [
        {
            id: 'customer-payment',
            title: 'Payment Selection',
            description: 'Multi-currency payment options with automatic sBTC conversion',
            nodes: [
                {
                    id: 'btc',
                    label: 'Bitcoin',
                    icon: Bitcoin,
                    color: 'orange',
                    time: '10-30 min',
                    fee: '$1-5'
                },
                {
                    id: 'stx',
                    label: 'STX',
                    icon: Zap,
                    color: 'purple',
                    time: '6 seconds',
                    fee: '$0.01'
                },
                {
                    id: 'sbtc',
                    label: 'sBTC',
                    icon: Shield,
                    color: 'green',
                    time: 'Instant',
                    fee: 'Minimal'
                }
            ]
        },
        {
            id: 'processing',
            title: 'Processing Engine',
            description: 'Real-time validation and conversion to sBTC',
            nodes: [
                {
                    id: 'validation',
                    label: 'Validation',
                    icon: Shield,
                    color: 'blue',
                    status: 'Verified'
                },
                {
                    id: 'conversion',
                    label: 'Conversion',
                    icon: ArrowUpDown,
                    color: 'purple',
                    status: 'Processing'
                },
                {
                    id: 'settlement',
                    label: 'Settlement',
                    icon: CheckCircle,
                    color: 'green',
                    status: 'Complete'
                }
            ]
        },
        {
            id: 'merchant-dashboard',
            title: 'Merchant Dashboard',
            description: 'Instant settlement with flexible withdrawal options',
            nodes: [
                {
                    id: 'settlement',
                    label: 'sBTC Settlement',
                    icon: CheckCircle,
                    color: 'green',
                    amount: '$2,847.50'
                },
                {
                    id: 'conversion',
                    label: 'Currency Options',
                    icon: DollarSign,
                    color: 'orange',
                    options: ['USD', 'USDC', 'USDT']
                },
                {
                    id: 'withdrawal',
                    label: 'Withdrawal',
                    icon: TrendingUp,
                    color: 'purple',
                    channels: ['Bank', 'Wallet', 'Exchange']
                }
            ]
        }
    ]

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'orange':
                return {
                    bg: 'bg-orange-500',
                    bgLight: 'bg-orange-50 dark:bg-orange-950/50',
                    text: 'text-orange-600 dark:text-orange-400',
                    border: 'border-orange-200 dark:border-orange-800',
                    pulse: 'shadow-orange-500/30'
                }
            case 'purple':
                return {
                    bg: 'bg-purple-500',
                    bgLight: 'bg-purple-50 dark:bg-purple-950/50',
                    text: 'text-purple-600 dark:text-purple-400',
                    border: 'border-purple-200 dark:border-purple-800',
                    pulse: 'shadow-purple-500/30'
                }
            case 'green':
                return {
                    bg: 'bg-green-500',
                    bgLight: 'bg-green-50 dark:bg-green-950/50',
                    text: 'text-green-600 dark:text-green-400',
                    border: 'border-green-200 dark:border-green-800',
                    pulse: 'shadow-green-500/30'
                }
            case 'blue':
                return {
                    bg: 'bg-blue-600',
                    bgLight: 'bg-blue-50 dark:bg-blue-950/50',
                    text: 'text-blue-600 dark:text-blue-400',
                    border: 'border-blue-200 dark:border-blue-800',
                    pulse: 'shadow-blue-500/30'
                }
            default:
                return {
                    bg: 'bg-gray-500',
                    bgLight: 'bg-gray-50 dark:bg-gray-950/50',
                    text: 'text-gray-600 dark:text-gray-400',
                    border: 'border-gray-200 dark:border-gray-800',
                    pulse: 'shadow-gray-500/30'
                }
        }
    }

    // Live data simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveMetrics(prev => ({
                volume: prev.volume + Math.floor(Math.random() * 1000),
                transactions: prev.transactions + Math.floor(Math.random() * 3),
                avgSettlement: 6.2 + (Math.random() - 0.5) * 0.5
            }))
        }, 3000)

        return () => clearInterval(interval)
    }, [])

    // Flow rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFlow(prev => (prev + 1) % flows.length)
            setPulseIndex(0)
        }, 6000)

        return () => clearInterval(interval)
    }, [flows.length])

    // Pulse animation through nodes
    useEffect(() => {
        const interval = setInterval(() => {
            setPulseIndex(prev => (prev + 1) % flows[activeFlow].nodes.length)
        }, 1000)

        return () => clearInterval(interval)
    }, [activeFlow, flows])

    return (
        <motion.div
            className="relative space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
        >
            {/* Demo Header - Elegant */}
            <div className="text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium mb-4 border border-gray-200 dark:border-gray-700">
                    <Activity className="w-4 h-4 mr-2" />
                    Live Demo
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Payment Processing
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Real-time payment flow visualization
                </p>
            </div>

            {/* Main Demo Container - Professional */}
            <motion.div
                className="relative bg-gray-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-gray-200 dark:border-slate-700/50"
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99,102,241,0.4) 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                    }} />
                </div>

                <div className="relative z-10">
                    {/* Flow Header with brand colors */}
                    <motion.div
                        key={activeFlow}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            {flows.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                        idx === activeFlow 
                                            ? 'bg-orange-500 dark:bg-orange-400' 
                                            : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                />
                            ))}
                        </div>
                        
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {flows[activeFlow].title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                            {flows[activeFlow].description}
                        </p>
                    </motion.div>

                    {/* Flow Visualization - Spectacular with brand colors */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeFlow}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.4 }}
                            className="relative h-56"
                        >
                            {/* Dynamic connection lines with brand colors */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 240">
                                <defs>
                                    <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="rgb(249 115 22)" stopOpacity="0.6" />
                                        <stop offset="33%" stopColor="rgb(147 51 234)" stopOpacity="0.4" />
                                        <stop offset="66%" stopColor="rgb(34 197 94)" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0.6" />
                                    </linearGradient>
                                </defs>
                                
                                {flows[activeFlow].nodes.map((_, index) => {
                                    if (index === flows[activeFlow].nodes.length - 1) return null
                                    
                                    const startX = 60 + (index * 120)
                                    const endX = 180 + (index * 120)
                                    const y = 120

                                    return (
                                        <g key={`connection-${index}`}>
                                            <motion.path
                                                d={`M ${startX} ${y} Q ${(startX + endX) / 2} ${y - 30} ${endX} ${y}`}
                                                stroke="url(#brandGradient)"
                                                strokeWidth="3"
                                                fill="none"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 1.5, delay: index * 0.3 }}
                                            />
                                            
                                            {/* Data pulse */}
                                            <motion.circle
                                                cx={startX}
                                                cy={y}
                                                r="4"
                                                fill="rgb(249 115 22)"
                                                initial={{ opacity: 0 }}
                                                animate={{
                                                    cx: [startX, endX],
                                                    opacity: [0, 1, 1, 0],
                                                    scale: [0.8, 1.2, 0.8]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    delay: index * 0.5,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        </g>
                                    )
                                })}
                            </svg>

                            {/* Flow Nodes - Modern with brand colors */}
                            <div className="relative z-10 h-full flex items-center justify-center">
                                <div className="grid grid-cols-3 gap-12 w-full max-w-2xl">
                                    {flows[activeFlow].nodes.map((node: any, index: number) => {
                                        const colors = getColorClasses(node.color)
                                        const isActive = pulseIndex === index
                                        
                                        return (
                                            <motion.div
                                                key={node.id}
                                                className="text-center"
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6, delay: index * 0.15 }}
                                            >
                                                {/* Node Icon - Elegant with subtle accent */}
                                                <motion.div
                                                    className={`relative w-14 h-14 mx-auto mb-3 rounded-xl bg-white dark:bg-slate-800/80 border-2 ${
                                                        isActive ? `${colors.border} shadow-lg` : 'border-gray-200 dark:border-slate-600/50'
                                                    } flex items-center justify-center transition-all duration-300`}
                                                    animate={isActive ? {
                                                        scale: [1, 1.05, 1],
                                                        y: [0, -2, 0]
                                                    } : {}}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                >
                                                    <node.icon className={`w-7 h-7 ${isActive ? colors.text : 'text-gray-600 dark:text-slate-300'} transition-colors duration-300`} />
                                                    
                                                    {/* Subtle pulse indicator */}
                                                    {isActive && (
                                                        <motion.div
                                                            className={`absolute -top-1 -right-1 w-3 h-3 ${colors.bg} rounded-full`}
                                                            animate={{
                                                                scale: [0.8, 1.2, 0.8],
                                                                opacity: [0.6, 1, 0.6]
                                                            }}
                                                            transition={{
                                                                duration: 2,
                                                                repeat: Infinity
                                                            }}
                                                        />
                                                    )}
                                                </motion.div>

                                                {/* Node Label */}
                                                <h5 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-2">
                                                    {node.label}
                                                </h5>

                                                {/* Node Details with brand colors */}
                                                <div className="space-y-1">
                                                    {node.time && (
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <Clock className={`w-3 h-3 ${colors.text}`} />
                                                            <span className={`text-xs font-medium ${colors.text}`}>
                                                                {node.time}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {node.fee && (
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                                            {node.fee}
                                                        </div>
                                                    )}

                                                    {node.status && (
                                                        <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                                            isActive ? colors.text : 'text-gray-600 dark:text-gray-400'
                                                        } transition-colors duration-300`}>
                                                            {node.status}
                                                        </div>
                                                    )}

                                                    {node.amount && (
                                                        <div className="text-base font-bold text-gray-900 dark:text-white">
                                                            {node.amount}
                                                        </div>
                                                    )}

                                                    {node.options && (
                                                        <div className="flex justify-center space-x-1 mt-2">
                                                            {node.options.map((option: string, idx: number) => (
                                                                <span 
                                                                    key={idx} 
                                                                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-slate-300 rounded-md"
                                                                >
                                                                    {option}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {node.channels && (
                                                        <div className="flex justify-center space-x-1 mt-2">
                                                            {node.channels.map((channel: string, idx: number) => (
                                                                <span 
                                                                    key={idx} 
                                                                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-slate-300 rounded-md"
                                                                >
                                                                    {channel}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* System Metrics - Clean and professional */}
            <div className="grid grid-cols-2 gap-4">
                {/* Performance Metrics */}
                <motion.div
                    className="bg-white dark:bg-slate-900/80 rounded-xl p-5 border border-gray-200 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    viewport={{ once: true }}
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 flex items-center justify-center">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-slate-100">Live Performance</h4>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-slate-300">Active Payments</span>
                            <motion.span 
                                className="text-lg font-bold text-orange-600 dark:text-orange-400"
                                key={liveMetrics.transactions}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {liveMetrics.transactions.toLocaleString()}
                            </motion.span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-slate-300">Volume Today</span>
                            <motion.span 
                                className="text-lg font-bold text-green-600 dark:text-green-400"
                                key={Math.floor(liveMetrics.volume / 1000)}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                ${(liveMetrics.volume / 1000000).toFixed(2)}M
                            </motion.span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-slate-300">Settlement Time</span>
                            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                {liveMetrics.avgSettlement.toFixed(1)}s
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* System Architecture */}
                <motion.div
                    className="bg-white dark:bg-slate-900/80 rounded-xl p-5 border border-gray-200 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 flex items-center justify-center">
                            <Server className="w-5 h-5" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-slate-100">Infrastructure</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: Layers, label: 'sBTC Protocol', status: 'Online', accent: 'green' },
                            { icon: Network, label: 'Multi-Chain', status: 'Active', accent: 'purple' },
                            { icon: Database, label: 'Real-time DB', status: '99.9%', accent: 'blue' },
                            { icon: Cpu, label: 'Processing', status: 'Optimal', accent: 'orange' }
                        ].map((item, idx) => {
                            const getAccentColor = (accent: string) => {
                                switch (accent) {
                                    case 'orange': return 'text-orange-600 dark:text-orange-400'
                                    case 'purple': return 'text-purple-600 dark:text-purple-400'
                                    case 'green': return 'text-green-600 dark:text-green-400'
                                    case 'blue': return 'text-blue-600 dark:text-blue-400'
                                    default: return 'text-gray-600 dark:text-gray-400'
                                }
                            }
                            
                            return (
                                <div
                                    key={idx}
                                    className="text-center p-3 rounded-lg bg-gray-50 dark:bg-slate-800/60"
                                >
                                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gray-100 dark:bg-slate-700/80 text-gray-600 dark:text-slate-300 flex items-center justify-center">
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <div className="text-xs text-gray-900 dark:text-slate-100 font-medium mb-1">{item.label}</div>
                                    <div className={`text-xs font-semibold ${getAccentColor(item.accent)}`}>{item.status}</div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Flow Navigation - Different brand colors for each */}
            <div className="flex justify-center space-x-2">
                {flows.map((flow, index) => {
                    const buttonColors = ['orange', 'purple', 'green']
                    const getButtonColor = (color: string, isActive: boolean) => {
                        if (!isActive) return 'bg-gray-100 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700/80'
                        
                        switch (color) {
                            case 'orange':
                                return 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                            case 'purple':
                                return 'bg-purple-500 text-white shadow-sm shadow-purple-500/20'
                            case 'green':
                                return 'bg-green-500 text-white shadow-sm shadow-green-500/20'
                            default:
                                return 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                        }
                    }

                    return (
                        <motion.button
                            key={flow.id}
                            onClick={() => setActiveFlow(index)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                getButtonColor(buttonColors[index], activeFlow === index)
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {flow.title}
                        </motion.button>
                    )
                })}
            </div>
        </motion.div>
    )
}

export default SpectacularDemo