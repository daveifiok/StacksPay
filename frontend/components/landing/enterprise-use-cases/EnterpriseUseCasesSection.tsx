'use client'

import { motion } from 'framer-motion'

const EnterpriseUseCasesSection = () => {
    return (
        <section className="relative py-24 bg-gray-50 dark:bg-slate-950">
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
                        Use cases
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Built for every business
                    </h2>

                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        From startups to Fortune 500 companies, see how businesses use StacksPay 
                        to power their payment infrastructure.
                    </p>
                </motion.div>

                {/* Use Cases Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {[
                        {
                            title: 'E-commerce',
                            description: 'Accept Bitcoin payments alongside traditional methods. Instant settlements, lower fees, global reach.',
                            features: ['Multi-currency checkout', 'Instant settlements', 'Global accessibility'],
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5L2 21m5-8h10m0 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6z" />
                                </svg>
                            )
                        },
                        {
                            title: 'SaaS platforms',
                            description: 'Subscription billing with Bitcoin. Recurring payments, dunning management, revenue optimization.',
                            features: ['Subscription billing', 'Revenue recovery', 'Usage-based pricing'],
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                            )
                        },
                        {
                            title: 'Marketplaces',
                            description: 'Split payments between multiple parties. Escrow, dispute resolution, automated payouts.',
                            features: ['Split payments', 'Escrow protection', 'Automated payouts'],
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            )
                        },
                        {
                            title: 'DeFi protocols',
                            description: 'Bridge traditional payments with DeFi. Liquidity pools, yield farming, cross-chain swaps.',
                            features: ['Cross-chain bridges', 'Liquidity provision', 'Smart contracts'],
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            )
                        },
                        {
                            title: 'Gaming platforms',
                            description: 'In-game purchases, virtual assets, tournament prizes. Instant global transactions.',
                            features: ['In-game purchases', 'Virtual assets', 'Prize distributions'],
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            )
                        },
                        {
                            title: 'Creator economy',
                            description: 'Content monetization, fan funding, NFT marketplaces. Direct creator-to-fan payments.',
                            features: ['Content monetization', 'Fan funding', 'NFT integration'],
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            )
                        }
                    ].map((useCase, index) => (
                        <motion.div
                            key={useCase.title}
                            className="group p-6 bg-white dark:bg-slate-900/80 rounded-xl border border-gray-200 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                {useCase.icon}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {useCase.title}
                            </h3>
                            
                            <p className="text-gray-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                                {useCase.description}
                            </p>

                            <ul className="space-y-1">
                                {useCase.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-center text-xs text-gray-500 dark:text-slate-500">
                                        <div className="w-1 h-1 bg-indigo-500 rounded-full mr-2 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Stats section */}
                <motion.div
                    className="text-center py-16 border-t border-gray-200 dark:border-slate-800"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                >
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
                        Trusted by businesses worldwide
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: '$2.4M+', label: 'Volume processed' },
                            { value: '1,200+', label: 'Active merchants' },
                            { value: '99.9%', label: 'Uptime' },
                            { value: '0.5%', label: 'Transaction fee' }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                className="text-center"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <div className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-slate-400">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default EnterpriseUseCasesSection