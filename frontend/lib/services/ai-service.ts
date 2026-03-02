import { Message } from '@/types/chat'

export interface ChatContext {
  userId?: string
  sessionId: string
  userType: 'visitor' | 'merchant' | 'developer'
  currentPage?: string
  conversationHistory: Message[]
}

export interface AIResponse {
  content: string
  suggestions?: string[]
  actions?: Array<{
    label: string
    action: string
    url?: string
    type: 'navigate' | 'modal' | 'external'
  }>
  confidence: number
}

class StacksPayAIService {
  private knowledgeBase: Map<string, any>
  private responseTemplates: Map<string, string>

  constructor() {
    this.knowledgeBase = new Map()
    this.responseTemplates = new Map()
    this.initializeKnowledgeBase()
    this.initializeResponseTemplates()
  }

  private initializeKnowledgeBase() {
    // Payment Integration Knowledge
    this.knowledgeBase.set('payment_integration', {
      keywords: ['payment', 'integrate', 'api', 'sdk', 'widget', 'checkout'],
      response: `🔗 **Payment Integration Made Simple**

**Quick Start Options:**
1. **REST API** - Direct HTTP integration
2. **JavaScript SDK** - npm install @stackspay/sdk
3. **Payment Widgets** - Embed directly in your HTML
4. **Webhooks** - Real-time event notifications

**Sample Integration:**
\`\`\`javascript
import StacksPay from '@stackspay/sdk'

const payment = await StacksPay.payments.create({
  amount: 29.99,
  currency: 'USD',
  successUrl: '/success'
})
\`\`\`

Would you like me to show you a specific integration method?`,
      suggestions: ['Show me the SDK setup', 'Webhook configuration', 'Payment widget examples', 'API documentation'],
      confidence: 0.9
    })

    // Dashboard Features
    this.knowledgeBase.set('dashboard', {
      keywords: ['dashboard', 'features', 'overview', 'analytics', 'manage'],
      response: `📊 **StacksPay Dashboard Overview**

**Core Features:**
• **Overview** - Real-time metrics and quick actions
• **Payments** - Transaction management and history
• **Analytics** - Business insights with visual charts
• **Conversion** - Multi-currency balance management
• **Customers** - CRM and customer insights
• **API Management** - Keys, webhooks, and integration tools
• **Settings** - Account security and configuration

**Key Benefits:**
✅ Real-time updates via WebSocket
✅ Mobile-responsive design
✅ Export capabilities (PDF/CSV)
✅ Advanced filtering and search
✅ Role-based team access

Which dashboard section interests you most?`,
      suggestions: ['Analytics features', 'Payment management', 'API setup', 'Customer insights'],
      confidence: 0.95
    })

    // Cryptocurrency & Conversion
    this.knowledgeBase.set('crypto_conversion', {
      keywords: ['btc', 'sbtc', 'bitcoin', 'convert', 'currency', 'stacks', 'crypto'],
      response: `₿ **Cryptocurrency & Conversion Support**

**Supported Currencies:**
• **Bitcoin (BTC)** - Native Bitcoin payments
• **sBTC** - Stacks Bitcoin for smart contracts
• **USD/USDC** - Fiat and stablecoin support
• **Multiple Altcoins** - Via Coinbase Commerce

**Conversion Features:**
🔄 **Auto-conversion** - Set preferred receiving currency
📈 **Real-time rates** - Best rates from multiple providers
🏦 **Multi-provider** - Circle API, Coinbase, internal swaps
💱 **Instant settlements** - Fast conversion and withdrawal

**Smart Conversion Rules:**
- Convert volatile crypto to stablecoins
- Schedule regular fiat withdrawals
- Optimize conversion timing for better rates

Need help setting up conversions?`,
      suggestions: ['Conversion setup guide', 'Supported currencies', 'Rate optimization', 'Withdrawal methods'],
      confidence: 0.92
    })

    // Security & Compliance
    this.knowledgeBase.set('security', {
      keywords: ['security', 'safe', 'secure', 'compliance', 'keys', '2fa', 'authentication'],
      response: `🔒 **Enterprise-Grade Security**

**Security Features:**
• **API Key Management** - Granular permissions and rotation
• **Two-Factor Authentication** - SMS, TOTP, and hardware keys
• **IP Restrictions** - Whitelist trusted addresses
• **Webhook Signatures** - Cryptographic verification
• **SSL/TLS Encryption** - End-to-end security

**Compliance Standards:**
✅ **PCI DSS** compliant payment processing
✅ **AML/KYC** automated compliance checks
✅ **GDPR** data privacy protection
✅ **SOC 2** security audit certification

**Best Practices:**
1. Rotate API keys regularly
2. Use webhook signature verification
3. Enable 2FA for all team members
4. Monitor access logs regularly

Want guidance on securing your integration?`,
      suggestions: ['API security setup', '2FA configuration', 'Webhook verification', 'Compliance checklist'],
      confidence: 0.88
    })

    // Getting Started
    this.knowledgeBase.set('getting_started', {
      keywords: ['start', 'begin', 'setup', 'new', 'first', 'getting started'],
      response: `🚀 **Welcome to StacksPay!**

**5-Minute Setup Guide:**

**Step 1: Account Setup** (2 min)
- Create merchant account
- Complete business verification
- Set up 2FA security

**Step 2: Dashboard Configuration** (2 min)
- Configure payment preferences
- Set default currencies
- Add team members (optional)

**Step 3: Integration** (1 min)
- Generate API keys
- Choose integration method
- Test in sandbox mode

**Step 4: Go Live**
- Switch to production keys
- Configure webhooks
- Start accepting payments!

**Helpful Resources:**
📚 Complete documentation
🎯 Integration examples
🧪 Sandbox environment
💬 24/7 developer support

Ready to get started?`,
      suggestions: ['Create account', 'View documentation', 'Integration guide', 'Contact support'],
      confidence: 0.96
    })

    // Troubleshooting
    this.knowledgeBase.set('troubleshooting', {
      keywords: ['error', 'issue', 'problem', 'bug', 'not working', 'failed', 'help'],
      response: `🛠️ **Troubleshooting Assistant**

**Common Issues & Solutions:**

**Integration Problems:**
• Check API key permissions and expiry
• Verify endpoint URLs (sandbox vs production)
• Review request headers and authentication

**Payment Failures:**
• Confirm webhook endpoint is accessible
• Validate payment amounts and currencies
• Check customer payment method validity

**Dashboard Access:**
• Reset password or check 2FA settings
• Clear browser cache and cookies
• Try incognito/private browsing mode

**API Rate Limits:**
• Review current usage in dashboard
• Implement exponential backoff
• Contact support for limit increases

**Quick Diagnostics:**
1. Check system status page
2. Review error logs in dashboard
3. Test with sandbox environment
4. Verify webhook deliveries

Still experiencing issues?`,
      suggestions: ['Check system status', 'View error logs', 'Test integration', 'Contact support'],
      confidence: 0.85
    })
  }

  private initializeResponseTemplates() {
    this.responseTemplates.set('greeting', 
      "👋 Hi! I'm your StacksPay Assistant. I can help you with payments, integrations, dashboard features, and more. What would you like to know?")
    
    this.responseTemplates.set('clarification',
      "I'd be happy to help! Could you provide more details about what you're looking for? For example, are you interested in:\n\n• Payment integration\n• Dashboard features\n• API documentation\n• Troubleshooting\n• Account setup")
    
    this.responseTemplates.set('contact_support',
      "For complex technical issues or account-specific questions, you can reach our support team:\n\n📧 **Email**: support@stackspay.com\n💬 **Live Chat**: Available in your dashboard\n📞 **Priority Support**: Available for enterprise customers\n\nResponse time: Usually within 2-4 hours")
  }

  async generateResponse(message: string, context: ChatContext): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase()
    
    // Find best matching knowledge base entry
    let bestMatch: { key: string; entry: any; score: number } | null = null
    let maxScore = 0

    // Convert Map to entries array for iteration
    const knowledgeEntries = Array.from(this.knowledgeBase.entries())
    
    for (const [key, entry] of knowledgeEntries) {
      const score = this.calculateRelevanceScore(lowerMessage, entry.keywords)
      if (score > maxScore && score > 0.3) {
        maxScore = score
        bestMatch = { key, entry, score }
      }
    }

    if (bestMatch) {
      return {
        content: bestMatch.entry.response,
        suggestions: bestMatch.entry.suggestions,
        confidence: bestMatch.entry.confidence * maxScore
      }
    }

    // Handle specific patterns
    if (this.isGreeting(lowerMessage)) {
      return {
        content: this.responseTemplates.get('greeting')!,
        suggestions: ['Getting started', 'Payment integration', 'Dashboard tour', 'API documentation'],
        confidence: 0.95
      }
    }

    if (this.isContactRequest(lowerMessage)) {
      return {
        content: this.responseTemplates.get('contact_support')!,
        suggestions: ['Dashboard support', 'Schedule call', 'View documentation'],
        confidence: 0.9
      }
    }

    // Contextual responses based on user type and page
    if (context.userType === 'developer' && (lowerMessage.includes('code') || lowerMessage.includes('example'))) {
      return this.generateDeveloperResponse(message, context)
    }

    if (context.userType === 'merchant' && (lowerMessage.includes('business') || lowerMessage.includes('revenue'))) {
      return this.generateMerchantResponse(message, context)
    }

    // Default response with clarification
    return {
      content: this.responseTemplates.get('clarification')!,
      suggestions: ['Payment setup', 'Dashboard features', 'Integration help', 'Contact support'],
      confidence: 0.4
    }
  }

  private calculateRelevanceScore(message: string, keywords: string[]): number {
    let score = 0
    const messageWords = message.split(' ')
    
    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        score += 1
      }
      
      // Bonus for exact keyword matches
      if (messageWords.includes(keyword)) {
        score += 0.5
      }
    }
    
    return score / keywords.length
  }

  private isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']
    return greetings.some(greeting => message.includes(greeting))
  }

  private isContactRequest(message: string): boolean {
    const contactKeywords = ['contact', 'support', 'help me', 'speak to', 'talk to', 'human']
    return contactKeywords.some(keyword => message.includes(keyword))
  }

  private generateDeveloperResponse(message: string, context: ChatContext): AIResponse {
    return {
      content: `👨‍💻 **Developer Resources**

Here are some technical resources that might help:

**Integration Examples:**
• REST API samples in multiple languages
• WebSocket connection examples
• Webhook handler implementations
• Error handling best practices

**Development Tools:**
• Interactive API explorer
• Postman collection
• Sandbox environment
• Debug logs and monitoring

**Code Libraries:**
• JavaScript/TypeScript SDK
• Python SDK
• PHP SDK
• Go SDK

Need specific code examples for your use case?`,
      suggestions: ['API examples', 'SDK documentation', 'Webhook setup', 'Sandbox testing'],
      confidence: 0.87
    }
  }

  private generateMerchantResponse(message: string, context: ChatContext): AIResponse {
    return {
      content: `💼 **Business Solutions**

**Revenue Optimization:**
• Multi-currency payment acceptance
• Automated conversion strategies
• Real-time analytics and reporting
• Customer retention insights

**Operational Efficiency:**
• Automated reconciliation
• Bulk payment processing
• Team management tools
• Custom reporting

**Growth Features:**
• Subscription management
• Recurring payments
• Customer segmentation
• Marketing integrations

**Financial Management:**
• Multi-currency balances
• Automated withdrawals
• Tax reporting tools
• Financial forecasting

How can I help optimize your payment operations?`,
      suggestions: ['Revenue analytics', 'Conversion setup', 'Customer management', 'Financial reports'],
      confidence: 0.83
    }
  }

  // Method to train the AI with new responses (for future enhancement)
  addKnowledgeEntry(key: string, keywords: string[], response: string, suggestions: string[] = []) {
    this.knowledgeBase.set(key, {
      keywords,
      response,
      suggestions,
      confidence: 0.8
    })
  }

  // Method to get conversation context for better responses
  analyzeContext(messages: Message[]): ChatContext {
    // Analyze recent messages to understand user intent and context
    const recentMessages = messages.slice(-5)
    const userType = this.inferUserType(recentMessages)
    
    return {
      sessionId: Date.now().toString(),
      userType,
      conversationHistory: recentMessages
    }
  }

  private inferUserType(messages: Message[]): 'visitor' | 'merchant' | 'developer' {
    const developerKeywords = ['api', 'code', 'sdk', 'webhook', 'integration', 'endpoint']
    const merchantKeywords = ['business', 'revenue', 'customers', 'sales', 'dashboard', 'payments']
    
    const allText = messages.map(m => m.content.toLowerCase()).join(' ')
    
    const devScore = developerKeywords.reduce((score, keyword) => 
      score + (allText.includes(keyword) ? 1 : 0), 0)
    const merchantScore = merchantKeywords.reduce((score, keyword) => 
      score + (allText.includes(keyword) ? 1 : 0), 0)
    
    if (devScore > merchantScore) return 'developer'
    if (merchantScore > devScore) return 'merchant'
    return 'visitor'
  }
}

export const aiService = new StacksPayAIService()

export default StacksPayAIService
