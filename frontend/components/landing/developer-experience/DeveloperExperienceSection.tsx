'use client'

import { motion } from 'framer-motion'

const DeveloperExperienceSection = () => {
  return (
    <section className="relative py-24 bg-white dark:bg-slate-950">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px), linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 text-sm font-medium mb-4">
            Developer tools
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Built for developers
          </h2>

          <p className="text-lg text-gray-600 dark:text-slate-400 max-w-3xl mx-auto">
            Familiar APIs, comprehensive documentation, and powerful SDKs. 
            Start building in minutes, not days.
          </p>
        </motion.div>

        {/* API Features Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Features */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Stripe-compatible API
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-8">
                If you know Stripe, you already know our API. Drop-in replacement 
                with Bitcoin superpowers.
              </p>
            </div>
            
            <div className="space-y-6">
              {[
                { 
                  title: 'Same endpoints', 
                  desc: 'Identical routes, parameters, and responses',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )
                },
                { 
                  title: 'Multiple SDKs', 
                  desc: 'JavaScript, Python, PHP, Ruby, and more',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  )
                },
                { 
                  title: 'Real-time webhooks', 
                  desc: 'Reliable event delivery with retry logic',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )
                },
                { 
                  title: 'Test environment', 
                  desc: 'Complete sandbox with realistic test data',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Code Example */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Get started in minutes
              </h3>
            </div>
            
            {/* Code Block - Professional with light mode support */}
            <div className="bg-gray-900 dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700/50">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-gray-500 dark:text-slate-400 text-xs font-medium">payment.js</span>
              </div>
              <div className="p-6 font-mono text-sm bg-white dark:bg-slate-900">
                <div className="text-gray-500 dark:text-slate-500">// Same as Stripe, but with Bitcoin</div>
                <div className="mt-2">
                  <span className="text-blue-600 dark:text-blue-400">import</span> <span className="text-gray-900 dark:text-white">sbtc</span> <span className="text-blue-600 dark:text-blue-400">from</span> <span className="text-green-600 dark:text-green-400">'@sbtc/gateway'</span>
                </div>
                <div className="mt-4">
                  <span className="text-blue-600 dark:text-blue-400">const</span> <span className="text-gray-900 dark:text-white">payment</span> = <span className="text-blue-600 dark:text-blue-400">await</span> <span className="text-gray-900 dark:text-white">sbtc</span>.<span className="text-yellow-600 dark:text-yellow-400">payments</span>.<span className="text-green-600 dark:text-green-400">create</span>({'{'}
                </div>
                <div className="ml-4 mt-1">
                  <div className="text-gray-900 dark:text-white">amount: <span className="text-orange-600 dark:text-orange-400">5000</span>,</div>
                  <div className="text-gray-900 dark:text-white">currency: <span className="text-green-600 dark:text-green-400">'usd'</span>,</div>
                  <div className="text-gray-900 dark:text-white">payment_method_types: [<span className="text-green-600 dark:text-green-400">'bitcoin'</span>]</div>
                </div>
                <div className="text-gray-900 dark:text-white">{'}'});</div>
              </div>
            </div>

            {/* SDK Grid - Enhanced with brand colors */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              {[
                { name: 'JavaScript', icon: 'JS', color: 'bg-yellow-500', accent: 'orange' },
                { name: 'Python', icon: 'PY', color: 'bg-blue-500', accent: 'blue' },
                { name: 'PHP', icon: 'PHP', color: 'bg-purple-500', accent: 'purple' },
                { name: 'Ruby', icon: 'RB', color: 'bg-red-500', accent: 'green' }
              ].map((sdk, index) => {
                const getAccentBorder = (accent: string) => {
                  switch (accent) {
                    case 'orange': return 'hover:border-orange-200 dark:hover:border-orange-700'
                    case 'blue': return 'hover:border-blue-200 dark:hover:border-blue-700'
                    case 'purple': return 'hover:border-purple-200 dark:hover:border-purple-700'
                    case 'green': return 'hover:border-green-200 dark:hover:border-green-700'
                    default: return 'hover:border-gray-300 dark:hover:border-slate-600'
                  }
                }
                
                return (
                  <motion.div
                    key={sdk.name}
                    className={`flex items-center space-x-3 p-4 bg-gray-50 dark:bg-slate-900/80 rounded-xl border border-gray-200 dark:border-slate-700/50 ${getAccentBorder(sdk.accent)} transition-all duration-200`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.02, y: -1 }}
                  >
                    <div className={`w-10 h-10 ${sdk.color} text-white text-xs font-bold rounded-lg flex items-center justify-center shadow-sm`}>
                      {sdk.icon}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{sdk.name}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Documentation Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'API Reference',
              description: 'Complete documentation with examples and interactive testing.',
              href: '/docs/api'
            },
            {
              title: 'Integration guides',
              description: 'Step-by-step tutorials for popular frameworks and platforms.',
              href: '/docs/integration'
            },
            {
              title: 'Community',
              description: 'Join developers building the future of Bitcoin payments.',
              href: '/community'
            }
          ].map((doc, index) => (
            <motion.a
              key={doc.title}
              href={doc.href}
              className="group block p-6 bg-gray-50 dark:bg-slate-900/80 rounded-xl border border-gray-200 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {doc.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                {doc.description}
              </p>
              <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                Learn more
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DeveloperExperienceSection