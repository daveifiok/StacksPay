'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  HelpCircle, 
  Search, 
  Book, 
  MessageCircle, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  FileText,
  Video,
  Users,
  Zap,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

interface HelpResource {
  id: string
  title: string
  description: string
  type: 'guide' | 'video' | 'api' | 'community'
  icon: any
  url: string
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'How do I get started with StacksPay?',
    answer: 'To get started, create an account, verify your email, and generate your first API key. Then follow our quick start guide in the documentation.',
    category: 'Getting Started'
  },
  {
    id: '2',
    question: 'What are the transaction fees?',
    answer: 'StacksPay charges 1.5% + $0.30 per transaction for sBTC payments. Bitcoin network fees apply separately and vary based on network congestion.',
    category: 'Pricing'
  },
  {
    id: '3',
    question: 'How long do sBTC confirmations take?',
    answer: 'sBTC confirmations typically take 1-6 blocks on the Stacks blockchain (10-60 minutes). For faster processing, we recommend 1-2 confirmations for small amounts.',
    category: 'Technical'
  },
  {
    id: '4',
    question: 'Can I test payments without using real sBTC?',
    answer: 'Yes! Use our testnet environment with testnet sBTC. Switch to testnet mode in your dashboard settings and use testnet API keys.',
    category: 'Testing'
  },
  {
    id: '5',
    question: 'How do I handle payment failures?',
    answer: 'Payment failures are communicated via webhooks and API responses. Implement proper error handling and retry logic for network issues.',
    category: 'Technical'
  },
  {
    id: '6',
    question: 'What security measures should I implement?',
    answer: 'Use HTTPS endpoints, validate webhook signatures, implement proper API key management, and never expose API keys in client-side code.',
    category: 'Security'
  }
]

const helpResources: HelpResource[] = [
  {
    id: '1',
    title: 'API Documentation',
    description: 'Complete reference for all StacksPay APIs',
    type: 'api',
    icon: FileText,
    url: '/docs/api'
  },
  {
    id: '2',
    title: 'Integration Guide',
    description: 'Step-by-step integration tutorial',
    type: 'guide',
    icon: Book,
    url: '/docs/integration'
  },
  {
    id: '3',
    title: 'Video Tutorials',
    description: 'Watch how to integrate StacksPay',
    type: 'video',
    icon: Video,
    url: '/docs/videos'
  },
  {
    id: '4',
    title: 'Community Forum',
    description: 'Get help from other developers',
    type: 'community',
    icon: Users,
    url: 'https://community.stackspay.com'
  }
]

const supportChannels = [
  {
    name: 'Email Support',
    description: 'Get help via email (24h response)',
    icon: Mail,
    contact: 'support@stackspay.com',
    available: true
  },
  {
    name: 'Live Chat',
    description: 'Chat with our support team',
    icon: MessageCircle,
    contact: 'Available 9 AM - 6 PM PST',
    available: true
  },
  {
    name: 'Phone Support',
    description: 'Enterprise customers only',
    icon: Phone,
    contact: '+1 (555) 123-4567',
    available: false
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', ...Array.from(new Set(faqItems.map(item => item.category)))]

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find answers, documentation, and get help with StacksPay
          </p>
        </div>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Response Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2.1h</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Support Hours</p>
              <p className="text-2xl font-bold text-green-600">9 AM - 6 PM PST</p>
            </div>
            <HelpCircle className="h-8 w-8 text-orange-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">98.5%</p>
            </div>
            <Zap className="h-8 w-8 text-orange-600" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Help Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Book className="h-5 w-5 text-orange-600" />
              <span>Documentation & Resources</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive guides and references</p>
          </div>

          <div className="p-6 space-y-3">
            {helpResources.map((resource) => (
              <Button
                key={resource.id}
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <resource.icon className="h-5 w-5 text-orange-600" />
                  <div className="text-left">
                    <p className="font-medium">{resource.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{resource.description}</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Support Channels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-orange-600" />
              <span>Contact Support</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get direct help from our support team</p>
          </div>

          <div className="p-6 space-y-4">
            {supportChannels.map((channel, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  channel.available
                    ? 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer bg-white dark:bg-gray-900'
                    : 'border-gray-200 dark:border-gray-800 opacity-50 bg-white dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <channel.icon className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{channel.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{channel.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{channel.contact}</p>
                    </div>
                  </div>
                  {channel.available && <ChevronRight className="h-4 w-4" />}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-orange-600" />
            <span>Frequently Asked Questions</span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Common questions and answers</p>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-orange-600 hover:bg-orange-700" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredFAQs.map((faq) => (
            <div key={faq.id} className="p-6">
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">{faq.question}</h3>
                {expandedFAQ === faq.id ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {expandedFAQ === faq.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                    {faq.category}
                  </span>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
