'use client'

import { motion } from 'framer-motion'
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  ArrowRight, 
  ExternalLink,
  Code,
  BookOpen,
  Zap,
  Shield,
  Globe,
  Users,
  Heart,
  Star
} from 'lucide-react'
import Logo from '../shared/Logo'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Payment API', href: '#', description: 'Accept Bitcoin payments' },
        { name: 'Payment Widgets', href: '#', description: 'Drop-in components' },
        { name: 'Enterprise', href: '#', description: 'Custom solutions' },
        { name: 'Pricing', href: '#', description: 'Transparent pricing' }
      ]
    },
    {
      title: 'Developers',
      links: [
        { name: 'Documentation', href: '#', description: 'Complete guides' },
        { name: 'API Reference', href: '#', description: 'Interactive docs' },
        { name: 'SDKs', href: '#', description: 'Multi-language support' },
        { name: 'GitHub', href: '#', description: 'Open source' }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '#', description: 'Our mission' },
        { name: 'Blog', href: '#', description: 'Latest updates' },
        { name: 'Careers', href: '#', description: 'Join our team' },
        { name: 'Contact', href: '#', description: 'Get in touch' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Help Center', href: '#', description: 'Support & guides' },
        { name: 'Community', href: '#', description: 'Developer forum' },
        { name: 'Status', href: '#', description: 'System status' },
        { name: 'Security', href: '#', description: 'Trust & compliance' }
      ]
    }
  ]

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'Email', icon: Mail, href: '#' }
  ]

  return (
    <footer className="relative bg-white dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-white border-t border-gray-200 dark:border-slate-800/50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Sophisticated grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0),
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)
          `,
          backgroundSize: '40px 40px, 40px 40px'
        }} />

        {/* Subtle floating elements */}
        <motion.div
          className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-br from-orange-200/10 dark:from-orange-400/10 to-transparent rounded-full blur-2xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-purple-200/10 dark:from-purple-400/10 to-transparent rounded-full blur-2xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content - Compact and professional */}
        <div className="py-16">
          {/* Top Section with Logo and CTA - More compact */}
          <div className="grid lg:grid-cols-5 gap-8 mb-12">
            {/* Left: Logo and Description - Spans 2 columns */}
            <motion.div
              className="lg:col-span-2 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Logo size="md" showText={true} />
              <p className="text-base text-gray-600 dark:text-slate-300 leading-relaxed max-w-sm">
                The complete sBTC payment ecosystem. Accept Bitcoin payments with Stripe's simplicity.
              </p>
              
              {/* Compact Stats Row */}
              <div className="flex items-center space-x-6 pt-2">
                {[
                  { value: '99.9%', label: 'Uptime', color: 'green' },
                  { value: '6s', label: 'Settlement', color: 'purple' },
                  { value: '0.5%', label: 'Fees', color: 'orange' }
                ].map((stat, index) => {
                  const getStatColor = (color: string) => {
                    switch (color) {
                      case 'green': return 'text-green-600 dark:text-green-400'
                      case 'purple': return 'text-purple-600 dark:text-purple-400'
                      case 'orange': return 'text-orange-600 dark:text-orange-400'
                      default: return 'text-gray-600 dark:text-slate-400'
                    }
                  }
                  
                  return (
                    <motion.div
                      key={stat.label}
                      className="text-center"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <div className={`text-lg font-bold ${getStatColor(stat.color)}`}>{stat.value}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-500">{stat.label}</div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Right: CTA Section - Spans 3 columns */}
            <motion.div
              className="lg:col-span-3 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="lg:max-w-sm">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to get started?</h3>
                  <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed">
                    Join 1,200+ businesses processing Bitcoin payments with enterprise-grade reliability.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start Building
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>
                  
                  <motion.button
                    className="px-6 py-3 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-xl hover:border-orange-300 dark:hover:border-orange-600 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Docs
                  </motion.button>
                </div>
              </div>

              {/* Trust Indicators - Compact */}
              <div className="flex items-center justify-center lg:justify-end space-x-6 pt-2">
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-500">
                  <Shield className="w-3 h-3 text-green-500" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-500">
                  <Globe className="w-3 h-3 text-blue-500" />
                  <span>Global Infrastructure</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Links Grid - Compact and elegant */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {footerSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                className="space-y-3"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
              >
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <motion.li
                      key={link.name}
                      initial={{ opacity: 0, x: -5 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: linkIndex * 0.03 }}
                    >
                      <a
                        href={link.href}
                        className="group block text-gray-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200"
                      >
                        <div className="text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                          {link.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
                          {link.description}
                        </div>
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Newsletter Section - Sleek and compact */}
          <motion.div
            className="bg-gray-50 dark:bg-slate-900/80 rounded-2xl p-6 mb-12 border border-gray-200 dark:border-slate-700/50"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="lg:max-w-md">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Developer Newsletter</h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm">
                  sBTC updates, integration guides, and developer resources. No spam.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 lg:min-w-[320px]">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                />
                <motion.button
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section - Clean and professional */}
        <div className="border-t border-gray-200 dark:border-slate-800/50 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            {/* Left: Copyright and Legal Links */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
              <div className="text-gray-500 dark:text-slate-500">
                © {currentYear} StacksPay. All rights reserved.
              </div>
              <div className="flex items-center space-x-4">
                <a href="#" className="text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">Privacy</a>
                <a href="#" className="text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">Terms</a>
                <a href="#" className="text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">Security</a>
              </div>
            </div>

            {/* Center: Trust Indicators - Mobile responsive */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-slate-500">
                <Shield className="w-3 h-3 text-green-500" />
                <span className="hidden sm:inline">SOC 2</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-slate-500">
                <Globe className="w-3 h-3 text-blue-500" />
                <span className="hidden sm:inline">Global</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-slate-500">
                <Heart className="w-3 h-3 text-red-500" />
                <span className="hidden sm:inline">Built with care</span>
              </div>
            </div>

            {/* Right: Social Links - Enhanced */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social, index) => {
                const getSocialColor = (name: string) => {
                  switch (name) {
                    case 'GitHub': return 'hover:text-gray-900 dark:hover:text-white'
                    case 'Twitter': return 'hover:text-blue-500'
                    case 'LinkedIn': return 'hover:text-blue-600'
                    case 'Email': return 'hover:text-orange-500'
                    default: return 'hover:text-gray-700 dark:hover:text-slate-300'
                  }
                }
                
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    className={`text-gray-500 dark:text-slate-500 transition-colors duration-200 ${getSocialColor(social.name)}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.1, y: -1 }}
                  >
                    <social.icon className="w-4 h-4" />
                    <span className="sr-only">{social.name}</span>
                  </motion.a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
