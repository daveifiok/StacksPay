'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Minimize2, 
  Maximize2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Zap,
  FileText,
  CreditCard,
  Settings,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Message, ChatAction, QuickAction, ChatContext } from '@/types/chat'
import { aiService } from '@/lib/services/ai-service'

const quickActions: QuickAction[] = [
  {
    label: "Getting Started",
    prompt: "How do I get started with StacksPay?",
    icon: <Zap className="w-4 h-4" />,
    category: "Setup"
  },
  {
    label: "Payment Integration",
    prompt: "How do I integrate payments into my website?",
    icon: <CreditCard className="w-4 h-4" />,
    category: "Integration"
  },
  {
    label: "API Documentation",
    prompt: "Show me the API documentation and examples",
    icon: <FileText className="w-4 h-4" />,
    category: "Documentation"
  },
  {
    label: "Dashboard Features",
    prompt: "What features are available in the merchant dashboard?",
    icon: <Settings className="w-4 h-4" />,
    category: "Features"
  },
  {
    label: "Crypto & Conversion",
    prompt: "How does Bitcoin and sBTC conversion work?",
    icon: <Bot className="w-4 h-4" />,
    category: "Crypto"
  },
  {
    label: "Troubleshooting",
    prompt: "I'm having issues with my integration",
    icon: <HelpCircle className="w-4 h-4" />,
    category: "Support"
  }
]

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "👋 Hi! I'm StacksPay Assistant. I'm here to help you with payments, integrations, and any questions about our platform. How can I assist you today?",
      timestamp: new Date(),
      suggestions: [
        "How do I get started?",
        "Show me payment options",
        "Help with integration",
        "Dashboard features"
      ],
      metadata: {
        confidence: 1.0,
        source: 'greeting',
        userType: 'visitor'
      }
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [chatContext, setChatContext] = useState<ChatContext>({
    sessionId: Date.now().toString(),
    userType: 'visitor',
    conversationHistory: []
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const generateBotResponse = async (userMessage: string): Promise<{ content: string; suggestions?: string[]; actions?: ChatAction[]; confidence: number }> => {
    // Simulate realistic AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500))

    try {
      // Update chat context with conversation history
      const updatedContext = {
        ...chatContext,
        conversationHistory: messages,
        currentPage: typeof window !== 'undefined' ? window.location.pathname : undefined
      }

      // Generate AI response using the AI service
      const aiResponse = await aiService.generateResponse(userMessage, updatedContext)
      
      // Update user type based on AI analysis
      const analyzedContext = aiService.analyzeContext([...messages, {
        id: Date.now().toString(),
        type: 'user',
        content: userMessage,
        timestamp: new Date()
      }])
      
      setChatContext(prev => ({
        ...prev,
        userType: analyzedContext.userType
      }))

      return {
        content: aiResponse.content,
        suggestions: aiResponse.suggestions,
        actions: aiResponse.actions,
        confidence: aiResponse.confidence
      }
    } catch (error) {
      console.error('AI service error:', error)
      
      // Fallback response
      return {
        content: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment or contact our support team at support@stackspay.com for immediate assistance.",
        suggestions: ["Contact support", "Try again", "View documentation"],
        confidence: 0.5
      }
    }
  }

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim()
    if (!messageContent) return

    setShowQuickActions(false)
    setInputValue('')

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // Generate bot response
    try {
      const botResponse = await generateBotResponse(messageContent)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse.content,
        timestamp: new Date(),
        suggestions: botResponse.suggestions,
        actions: botResponse.actions,
        metadata: {
          confidence: botResponse.confidence,
          source: 'ai_service',
          userType: chatContext.userType
        }
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment or contact our support team for immediate assistance.",
        timestamp: new Date(),
        suggestions: ["Contact support", "Try again", "View documentation"],
        metadata: {
          confidence: 0.5,
          source: 'error_fallback'
        }
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleActionClick = (action: ChatAction) => {
    if (action.type === 'navigate' && action.url) {
      window.location.href = action.url
    } else if (action.type === 'external' && action.url) {
      window.open(action.url, '_blank')
    } else if (action.type === 'modal') {
      // Handle modal actions (could integrate with existing modals)
      console.log('Modal action:', action.action)
    } else {
      // Default: send as a message
      handleSendMessage(action.action)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.prompt)
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    // You could add a toast notification here
  }

  const handleMessageFeedback = (messageId: string, isHelpful: boolean) => {
    // Update message feedback state
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, metadata: { ...msg.metadata, userFeedback: isHelpful ? 'helpful' : 'not_helpful' } }
        : msg
    ))

    // In a real app, you'd send this feedback to your analytics service
    console.log(`Message ${messageId} marked as ${isHelpful ? 'helpful' : 'not helpful'}`)
    
    // Show a thank you message for feedback
    if (!isHelpful) {
      setTimeout(() => {
        const feedbackMessage: Message = {
          id: (Date.now() + Math.random()).toString(),
          type: 'bot',
          content: "Thanks for the feedback! I'm still learning. Would you like me to connect you with our support team for better assistance?",
          timestamp: new Date(),
          suggestions: ["Contact support", "Try different question", "View documentation"],
          metadata: { confidence: 1.0, source: 'feedback_followup' }
        }
        setMessages(prev => [...prev, feedbackMessage])
      }, 1000)
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: "👋 Hi! I'm StacksPay Assistant. I'm here to help you with payments, integrations, and any questions about our platform. How can I assist you today?",
        timestamp: new Date(),
        suggestions: [
          "How do I get started?",
          "Show me payment options",
          "Help with integration",
          "Dashboard features"
        ],
        metadata: {
          confidence: 1.0,
          source: 'greeting',
          userType: 'visitor'
        }
      }
    ])
    setShowQuickActions(true)
    setChatContext({
      sessionId: Date.now().toString(),
      userType: 'visitor',
      conversationHistory: []
    })
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-4 ${
                isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-orange-600 text-white">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">StacksPay Assistant</h3>
                    <p className="text-xs opacity-90">
                      Online • {chatContext.userType === 'developer' ? '👨‍💻 Developer Mode' : 
                               chatContext.userType === 'merchant' ? '💼 Business Mode' : 
                               '🌟 General Help'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-white hover:bg-white/20 h-8 w-8 p-0"
                      >
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isMinimized ? 'Maximize' : 'Minimize'}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearChat}
                        className="text-white hover:bg-white/20 h-8 w-8 p-0"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Clear chat
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                        className="text-white hover:bg-white/20 h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Close chat
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages */}
                  <ScrollArea className="h-[400px] p-4">
                    <div className="space-y-4">
                      {showQuickActions && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6"
                        >
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Quick actions:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {quickActions.map((action, index) => (
                              <motion.button
                                key={action.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleQuickAction(action)}
                                className="flex items-center space-x-3 p-3 text-left text-sm bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                              >
                                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                  {action.icon}
                                </div>
                                <div className="flex-1">
                                  <span className="font-medium">{action.label}</span>
                                  <div className="text-xs text-gray-500 mt-1">{action.category}</div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                            <div className="flex items-start space-x-2">
                              {message.type === 'bot' && (
                                <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                  <Bot className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <div
                                className={`p-3 rounded-2xl ${
                                  message.type === 'user'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                }`}
                              >
                                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                <div className="flex items-center justify-between mt-2">
                                  <span className={`text-xs ${
                                    message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                                  }`}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {message.type === 'bot' && (
                                    <div className="flex items-center space-x-1">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyMessage(message.content)}
                                            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Copy message
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleMessageFeedback(message.id, true)}
                                            className="h-6 w-6 p-0 text-gray-500 hover:text-green-600"
                                          >
                                            <ThumbsUp className="w-3 h-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Helpful
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleMessageFeedback(message.id, false)}
                                            className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                                          >
                                            <ThumbsDown className="w-3 h-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Not helpful
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {message.type === 'user' && (
                                <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                  <User className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {message.actions && message.actions.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {message.actions.map((action, idx) => (
                                  <Button
                                    key={idx}
                                    variant={action.variant || "outline"}
                                    size="sm"
                                    onClick={() => handleActionClick(action)}
                                    className="text-xs mr-2 mb-2"
                                  >
                                    {action.icon && <span className="mr-1">{action.icon}</span>}
                                    {action.label}
                                    {action.type === 'external' && <ExternalLink className="w-3 h-3 ml-1" />}
                                    {action.type === 'navigate' && <ChevronRight className="w-3 h-3 ml-1" />}
                                  </Button>
                                ))}
                              </div>
                            )}

                            {/* Suggestions */}
                            {message.suggestions && message.suggestions.length > 0 && (
                              <div className="mt-3 space-x-2">
                                {message.suggestions.map((suggestion, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="text-xs mb-2"
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            )}

                            {/* Confidence indicator for bot messages */}
                            {message.type === 'bot' && message.metadata?.confidence && message.metadata.confidence < 0.7 && (
                              <div className="mt-2 flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">
                                  Not sure? Try rephrasing or contact support
                                </Badge>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <Bot className="w-3 h-3 text-white" />
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl">
                              <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        placeholder={
                          chatContext.userType === 'developer' 
                            ? "Ask about APIs, SDKs, integration..." 
                            : chatContext.userType === 'merchant'
                            ? "Ask about business features, analytics..."
                            : "Ask me anything about StacksPay..."
                        }
                        className="flex-1 border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500"
                        disabled={isTyping}
                      />
                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() || isTyping}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        Press Enter to send • AI-powered assistance
                      </p>
                      {messages.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          {messages.length - 1} messages
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-orange-600 hover:bg-orange-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <MessageCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Notification dot for new features */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
        </motion.button>
      </div>
    </TooltipProvider>
  )
}

export default ChatBot
