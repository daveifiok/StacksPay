export interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  isTyping?: boolean
  suggestions?: string[]
  actions?: ChatAction[]
  metadata?: {
    confidence?: number
    source?: string
    userType?: 'visitor' | 'merchant' | 'developer'
  }
}

export interface ChatAction {
  label: string
  action: string
  icon?: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary'
  url?: string
  type?: 'navigate' | 'modal' | 'external'
}

export interface QuickAction {
  label: string
  prompt: string
  icon: React.ReactNode
  category: string
  color?: string
}

export interface ChatSession {
  id: string
  userId?: string
  startTime: Date
  endTime?: Date
  messages: Message[]
  userType: 'visitor' | 'merchant' | 'developer'
  context: {
    page?: string
    referrer?: string
    userAgent?: string
    location?: string
  }
}

export interface AIResponse {
  content: string
  suggestions?: string[]
  actions?: ChatAction[]
  confidence: number
  metadata?: {
    source: string
    processingTime: number
    userType?: 'visitor' | 'merchant' | 'developer'
  }
}

export interface ChatContext {
  userId?: string
  sessionId: string
  userType: 'visitor' | 'merchant' | 'developer'
  currentPage?: string
  conversationHistory: Message[]
  preferences?: {
    language: string
    timezone: string
    theme: 'light' | 'dark'
  }
}

export interface ChatbotConfig {
  apiEndpoint?: string
  enableAI?: boolean
  maxMessages?: number
  typingDelay?: number
  responseDelay?: number
  theme?: {
    primaryColor: string
    accentColor: string
    fontFamily: string
  }
  features?: {
    voiceInput?: boolean
    fileUpload?: boolean
    screenshare?: boolean
    videoCall?: boolean
  }
}

export interface KnowledgeBaseEntry {
  id: string
  keywords: string[]
  response: string
  suggestions: string[]
  confidence: number
  category: string
  lastUpdated: Date
  usage: {
    timesUsed: number
    averageRating: number
    feedbackCount: number
  }
}

export interface ChatAnalytics {
  sessionId: string
  totalMessages: number
  averageResponseTime: number
  userSatisfaction?: number
  resolvedQueries: string[]
  unresolvedQueries: string[]
  commonTopics: string[]
  conversionEvents: Array<{
    type: 'signup' | 'demo_request' | 'contact' | 'purchase'
    timestamp: Date
    value?: number
  }>
}

export interface MessageFeedback {
  messageId: string
  rating: 'helpful' | 'not_helpful'
  feedback?: string
  timestamp: Date
  improvements?: string[]
}
