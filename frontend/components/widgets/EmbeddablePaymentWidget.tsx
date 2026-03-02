'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  X, 
  ExternalLink, 
  Shield,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PaymentWidget from '@/components/payment/payment-widget'

interface EmbeddablePaymentWidgetProps {
  // Core payment props
  apiKey: string
  amount: number
  currency: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  description?: string
  
  // Customization props
  theme?: 'light' | 'dark' | 'auto'
  primaryColor?: string
  borderRadius?: number
  showLogo?: boolean
  merchantName?: string
  
  // Behavior props
  embedded?: boolean
  resizable?: boolean
  closeable?: boolean
  fullscreen?: boolean
  autoClose?: boolean
  
  // Event handlers
  onPaymentSuccess?: (payment: any) => void
  onPaymentError?: (error: string) => void
  onClose?: () => void
  onResize?: (size: { width: number, height: number }) => void
  
  // Advanced props
  customCSS?: string
  allowedDomains?: string[]
  rateLimitByIP?: boolean
}

interface WidgetSize {
  width: number
  height: number
}

const DEFAULT_SIZES = {
  compact: { width: 320, height: 480 },
  standard: { width: 400, height: 600 },
  large: { width: 480, height: 720 }
}

export default function EmbeddablePaymentWidget({
  apiKey,
  amount,
  currency,
  description = 'Payment',
  theme = 'auto',
  primaryColor = '#ea580c',
  borderRadius = 8,
  showLogo = true,
  merchantName = 'StacksPay Merchant',
  embedded = false,
  resizable = false,
  closeable = true,
  fullscreen = false,
  autoClose = false,
  onPaymentSuccess,
  onPaymentError,
  onClose,
  onResize,
  customCSS,
  allowedDomains,
  rateLimitByIP = true
}: EmbeddablePaymentWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(fullscreen)
  const [size, setSize] = useState<WidgetSize>(DEFAULT_SIZES.standard)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(true)
  const [isValidated, setIsValidated] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Validate configuration on mount
  useEffect(() => {
    validateConfiguration()
  }, [apiKey, allowedDomains])

  // Handle domain validation
  useEffect(() => {
    if (allowedDomains && allowedDomains.length > 0) {
      const currentDomain = window.location.hostname
      const isAllowed = allowedDomains.some(domain => 
        currentDomain === domain || currentDomain.endsWith('.' + domain)
      )
      
      if (!isAllowed) {
        setValidationError(`This widget is not authorized for domain: ${currentDomain}`)
        return
      }
    }
    setIsValidated(true)
  }, [allowedDomains])

  const validateConfiguration = () => {
    if (!apiKey || !apiKey.startsWith('pk_')) {
      setValidationError('Invalid API key provided')
      return
    }
    
    if (amount <= 0) {
      setValidationError('Amount must be greater than 0')
      return
    }
    
    setValidationError(null)
    setIsValidated(true)
  }

  const handlePaymentSuccess = (payment: any) => {
    onPaymentSuccess?.(payment)
    
    if (autoClose) {
      setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, 2000)
    }
  }

  const handlePaymentError = (error: string) => {
    onPaymentError?.(error)
  }

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  const toggleExpanded = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    
    if (newExpanded) {
      setSize({ width: window.innerWidth * 0.9, height: window.innerHeight * 0.9 })
    } else {
      setSize(DEFAULT_SIZES.standard)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (embedded) return
    
    setIsDragging(true)
    const rect = widgetRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && !embedded) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Resize functionality
  const handleResizeStart = (e: React.MouseEvent) => {
    if (!resizable) return
    
    e.stopPropagation()
    setIsResizing(true)
  }

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !widgetRef.current) return
    
    const rect = widgetRef.current.getBoundingClientRect()
    const newWidth = Math.max(280, e.clientX - rect.left)
    const newHeight = Math.max(400, e.clientY - rect.top)
    
    const newSize = { width: newWidth, height: newHeight }
    setSize(newSize)
    onResize?.(newSize)
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
  }

  // Global event listeners for drag and resize
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing])

  // CSS custom properties for theming
  const cssVariables = {
    '--widget-primary-color': primaryColor,
    '--widget-border-radius': `${borderRadius}px`,
    '--widget-theme': theme
  } as React.CSSProperties

  if (!isVisible) return null

  if (!isValidated) {
    return (
      <Card 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 shadow-2xl"
        style={{ width: 400 }}
      >
        <CardContent className="p-6 text-center space-y-4">
          <div className="text-red-500">
            <X className="h-12 w-12 mx-auto mb-2" />
            <h3 className="font-semibold">Configuration Error</h3>
            <p className="text-sm text-gray-600 mt-2">{validationError}</p>
          </div>
          {closeable && (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const widgetContent = (
    <div
      ref={widgetRef}
      className={`
        ${embedded ? 'relative' : 'fixed z-50'}
        ${isDragging ? 'cursor-grabbing' : 'cursor-auto'}
      `}
      style={{
        ...cssVariables,
        width: size.width,
        height: size.height,
        ...(embedded ? {} : { 
          left: position.x, 
          top: position.y,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }),
        ...customCSS ? { cssText: customCSS } : {}
      }}
    >
      {/* Widget Header (for non-embedded) */}
      {!embedded && (
        <div 
          className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 border-b cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            {showLogo && (
              <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                <CreditCard className="h-3 w-3 text-white" />
              </div>
            )}
            <span className="text-sm font-medium">StacksPay</span>
            <Badge variant="secondary" className="text-xs">
              Secure
            </Badge>
          </div>
          
          <div className="flex items-center space-x-1">
            {resizable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://stackspay.com', '_blank')}
              className="h-6 w-6 p-0"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            
            {closeable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Widget Body */}
      <div className={`${embedded ? 'h-full' : 'flex-1'} overflow-hidden`}>
        <PaymentWidget
          amount={amount}
          currency={currency}
          description={description}
          merchantName={merchantName}
          onPaymentComplete={handlePaymentSuccess}
          onPaymentFailed={handlePaymentError}
          customStyles={{
            height: '100%',
            boxShadow: 'none',
            border: embedded ? '1px solid #e5e7eb' : 'none'
          }}
        />
      </div>

      {/* Resize Handle */}
      {resizable && !embedded && (
        <div
          ref={resizeRef}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-gray-400" />
        </div>
      )}

      {/* Security Badge */}
      {!embedded && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <Badge variant="outline" className="bg-white dark:bg-gray-900 text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Secured by StacksPay
          </Badge>
        </div>
      )}
    </div>
  )

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={embedded ? { opacity: 1 } : { opacity: 0, scale: 0.8, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 100 }}
          transition={{ duration: 0.3, type: 'spring', damping: 25 }}
        >
          {widgetContent}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Utility function for creating embedded widgets
export const createEmbeddedWidget = (
  containerId: string, 
  props: EmbeddablePaymentWidgetProps
) => {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error(`Container with id "${containerId}" not found`)
    return null
  }

  // Create React root and render widget
  // This would be used in the actual SDK implementation
  return {
    container,
    props: { ...props, embedded: true },
    destroy: () => {
      container.innerHTML = ''
    },
    update: (newProps: Partial<EmbeddablePaymentWidgetProps>) => {
      // Update widget props
    }
  }
}

// Widget sizing utilities
export const WIDGET_SIZES = DEFAULT_SIZES

// Theme presets
export const WIDGET_THEMES = {
  stripe: {
    primaryColor: '#635bff',
    borderRadius: 8,
    customCSS: 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);'
  },
  minimal: {
    primaryColor: '#000000',
    borderRadius: 2,
    customCSS: 'border: 1px solid #e1e1e1;'
  },
  stackspay: {
    primaryColor: '#ea580c',
    borderRadius: 12,
    customCSS: 'background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%);'
  }
}