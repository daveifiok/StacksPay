'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, CreditCard, Loader2, CheckCircle, Package, Truck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CheckoutItem {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  image?: string
}

interface CheckoutWidgetProps {
  // Required props
  apiKey: string
  items: CheckoutItem[]
  currency: 'BTC' | 'sBTC' | 'STX' | 'USDC'
  
  // Optional pricing
  taxRate?: number
  shippingCost?: number
  discountAmount?: number
  
  // Customization
  theme?: 'light' | 'dark' | 'auto'
  primaryColor?: string
  borderRadius?: number
  
  // Merchant info
  merchantName?: string
  merchantLogo?: string
  
  // Customer fields
  collectShipping?: boolean
  collectEmail?: boolean
  requireCustomerInfo?: boolean
  
  // Callbacks
  onSuccess?: (checkout: any) => void
  onError?: (error: string) => void
  onCancel?: () => void
  
  // Styling
  className?: string
  style?: React.CSSProperties
  
  // Behavior
  showOrderSummary?: boolean
  allowQuantityEdit?: boolean
}

export default function CheckoutWidget({
  apiKey,
  items,
  currency,
  taxRate = 0,
  shippingCost = 0,
  discountAmount = 0,
  theme = 'light',
  primaryColor = '#ea580c',
  borderRadius = 8,
  merchantName = 'Store',
  merchantLogo,
  collectShipping = true,
  collectEmail = true,
  requireCustomerInfo = false,
  onSuccess,
  onError,
  onCancel,
  className = '',
  style = {},
  showOrderSummary = true,
  allowQuantityEdit = false
}: CheckoutWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'summary' | 'customer' | 'payment' | 'processing' | 'success'>('summary')
  const [orderItems, setOrderItems] = useState<CheckoutItem[]>(items)
  const [isLoading, setIsLoading] = useState(false)
  
  // Customer info
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })
  
  const [orderResult, setOrderResult] = useState<any>(null)

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'USDC') return `$${amount.toFixed(2)}`
    if (currency === 'BTC' || currency === 'sBTC') return `₿${amount.toFixed(6)}`
    if (currency === 'STX') return `${amount.toFixed(6)} STX`
    return `${amount} ${currency}`
  }

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * taxRate
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + shippingCost - discountAmount
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (!allowQuantityEdit) return
    if (newQuantity < 1) return
    
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ))
  }

  const removeItem = (itemId: string) => {
    if (!allowQuantityEdit) return
    setOrderItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleCheckout = async () => {
    setIsLoading(true)
    setCheckoutStep('processing')
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const mockOrder = {
        id: `order_${Date.now()}`,
        items: orderItems,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        shipping: shippingCost,
        discount: discountAmount,
        total: calculateTotal(),
        currency,
        customer: customerInfo,
        status: 'completed',
        transactionId: `tx_${Math.random().toString(36).substring(7)}`,
        timestamp: new Date().toISOString()
      }
      
      setOrderResult(mockOrder)
      setCheckoutStep('success')
      onSuccess?.(mockOrder)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Checkout failed')
      setCheckoutStep('payment')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = () => {
    if (!requireCustomerInfo) return true
    if (collectEmail && !customerInfo.email) return false
    if (collectShipping && (!customerInfo.firstName || !customerInfo.address || !customerInfo.city)) return false
    return true
  }

  const resetCheckout = () => {
    setCheckoutStep('summary')
    setOrderResult(null)
    setIsLoading(false)
    setCustomerInfo({
      email: '',
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    })
  }

  const totalItemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="relative"
        style={{ 
          backgroundColor: primaryColor,
          borderRadius: `${borderRadius}px`
        }}
        disabled={orderItems.length === 0}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Checkout ({totalItemCount}) • {formatCurrency(calculateTotal(), currency)}
        {totalItemCount > 0 && (
          <Badge 
            className="ml-2 bg-white text-black text-xs px-2 py-1"
          >
            {totalItemCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          onCancel?.()
          resetCheckout()
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              {merchantLogo && (
                <img src={merchantLogo} alt={merchantName} className="w-8 h-8 rounded" />
              )}
              <div>
                <div className="text-lg font-semibold">{merchantName}</div>
                <div className="text-sm font-normal text-gray-600">
                  {checkoutStep === 'summary' && 'Order Summary'}
                  {checkoutStep === 'customer' && 'Customer Information'}
                  {checkoutStep === 'payment' && 'Payment Details'}
                  {checkoutStep === 'processing' && 'Processing Order'}
                  {checkoutStep === 'success' && 'Order Complete'}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Summary Step */}
            {checkoutStep === 'summary' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Items in your order</h3>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                        <p className="text-sm font-medium" style={{ color: primaryColor }}>
                          {formatCurrency(item.price, currency)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {allowQuantityEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                        )}
                        <span className="w-8 text-center">{item.quantity}</span>
                        {allowQuantityEdit && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(calculateSubtotal(), currency)}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                      <span>{formatCurrency(calculateTax(), currency)}</span>
                    </div>
                  )}
                  {shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatCurrency(shippingCost, currency)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(discountAmount, currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span style={{ color: primaryColor }}>
                      {formatCurrency(calculateTotal(), currency)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => requireCustomerInfo ? setCheckoutStep('customer') : setCheckoutStep('payment')}
                  className="w-full py-3"
                  style={{ backgroundColor: primaryColor }}
                >
                  Continue to {requireCustomerInfo ? 'Customer Info' : 'Payment'}
                </Button>
              </div>
            )}

            {/* Customer Information Step */}
            {checkoutStep === 'customer' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Customer Information</h3>
                
                {collectEmail && (
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                )}

                {collectShipping && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>First Name *</Label>
                        <Input
                          value={customerInfo.firstName}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          value={customerInfo.lastName}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Address *</Label>
                      <Input
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 Main St"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>City *</Label>
                        <Input
                          value={customerInfo.city}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          value={customerInfo.state}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, state: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Zip Code</Label>
                        <Input
                          value={customerInfo.zipCode}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          value={customerInfo.country}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="United States"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setCheckoutStep('summary')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setCheckoutStep('payment')}
                    disabled={!isFormValid()}
                    className="flex-1"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Step */}
            {checkoutStep === 'payment' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Payment Details</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Cryptocurrency Payment</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    You'll be redirected to complete your payment with {currency} on the secure StacksPay network.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Order Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{orderItems.length} item(s)</span>
                      <span>{formatCurrency(calculateSubtotal(), currency)}</span>
                    </div>
                    {taxRate > 0 && (
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>{formatCurrency(calculateTax(), currency)}</span>
                      </div>
                    )}
                    {shippingCost > 0 && (
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{formatCurrency(shippingCost, currency)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span style={{ color: primaryColor }}>
                        {formatCurrency(calculateTotal(), currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setCheckoutStep(requireCustomerInfo ? 'customer' : 'summary')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="flex-1"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay {formatCurrency(calculateTotal(), currency)}
                  </Button>
                </div>
              </div>
            )}

            {/* Processing Step */}
            {checkoutStep === 'processing' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600 mb-4" />
                <h3 className="text-lg font-medium mb-2">Processing Your Order</h3>
                <p className="text-gray-600">
                  Please wait while we process your payment and prepare your order...
                </p>
              </div>
            )}

            {/* Success Step */}
            {checkoutStep === 'success' && orderResult && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Order Complete!</h3>
                <p className="text-gray-600 mb-6">
                  Thank you for your purchase. Your order has been confirmed.
                </p>
                
                <div className="bg-green-50 rounded-lg p-4 text-left space-y-2 mb-6">
                  <div className="font-medium">Order Details:</div>
                  <div className="text-sm space-y-1">
                    <div>Order ID: <span className="font-mono">{orderResult.id}</span></div>
                    <div>Transaction ID: <span className="font-mono">{orderResult.transactionId}</span></div>
                    <div>Total: <span className="font-semibold">{formatCurrency(orderResult.total, currency)}</span></div>
                    <div>Items: {orderResult.items.length} item(s)</div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false)
                      resetCheckout()
                    }}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      // Here you could trigger order tracking or receipt download
                      console.log('Track order:', orderResult.id)
                    }}
                    className="flex-1"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Track Order
                  </Button>
                </div>
              </div>
            )}

            {/* Security Badge */}
            {!['processing', 'success'].includes(checkoutStep) && (
              <div className="text-center border-t pt-4">
                <p className="text-xs text-gray-500">
                  🔒 Secured by StacksPay • Powered by Bitcoin blockchain
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}