'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Building, 
  Globe, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OnboardingData } from '../MerchantOnboardingWizard'
import { merchantApiClient } from '@/lib/api/merchant-api'
import { onboardingApiClient } from '@/lib/api/onboarding-api'

interface BusinessInfoStepProps {
  data: OnboardingData
  updateData: (section: keyof OnboardingData, updates: any) => void
  onComplete: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const businessTypes = [
  { value: 'ecommerce', label: 'E-commerce Store', description: 'Online retail and product sales' },
  { value: 'saas', label: 'SaaS/Software', description: 'Software as a Service platform' },
  { value: 'marketplace', label: 'Marketplace', description: 'Multi-seller platform like eBay' },
  { value: 'nonprofit', label: 'Non-profit', description: 'Non-profit organization' },
  { value: 'consulting', label: 'Consulting/Services', description: 'Professional services business' },
  { value: 'other', label: 'Other', description: 'Other type of business' }
]

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
  'Japan', 'Australia', 'Netherlands', 'Singapore', 'Switzerland'
]

const BusinessInfoStep = ({ data, updateData, onComplete, isLoading, setIsLoading }: BusinessInfoStepProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValid, setIsValid] = useState(false)

  const businessInfo = data.businessInfo

  const updateBusinessInfo = (field: string, value: string) => {
    updateData('businessInfo', { [field]: value })
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!businessInfo.name.trim()) {
      newErrors.name = 'Business name is required'
    }

    if (!businessInfo.businessType) {
      newErrors.businessType = 'Please select your business type'
    }

    if (!businessInfo.country) {
      newErrors.country = 'Please select your country'
    }

    if (businessInfo.website && !isValidUrl(businessInfo.website)) {
      newErrors.website = 'Please enter a valid website URL'
    }

    if (businessInfo.phone && !isValidPhone(businessInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Save business info using the merchant API client
      const result = await merchantApiClient.saveBusinessInfo(businessInfo)

      if (result.success) {
        console.log('✅ Business info saved successfully')

        // Mark this onboarding step as complete in backend
        try {
          await onboardingApiClient.updateOnboardingStep('businessInfo', {
            businessName: businessInfo.name,
            businessType: businessInfo.businessType,
            country: businessInfo.country
          }, 2) // Step 2 is business info
          console.log('✅ Business info onboarding step marked as completed')
        } catch (error) {
          console.error('Error marking businessInfo step as complete:', error)
        }

        onComplete()
      } else {
        console.error('❌ Failed to save business info:', result.error)
        // Still allow progression but show error
        onComplete()
      }
    } catch (error) {
      console.error('Error saving business info:', error)
      // Still allow progression to prevent blocking user
      onComplete()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Only check required fields - ignore optional field validation errors
    const hasRequiredFields = Boolean(
      businessInfo.name?.trim() &&
      businessInfo.businessType &&
      businessInfo.country
    )
    setIsValid(hasRequiredFields)
  }, [businessInfo])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Tell us about your business
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This information helps us provide the best payment experience for your customers
        </p>
      </div>

      {/* Business Info Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Basic Info */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Business Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="Enter your business name"
                  value={businessInfo.name}
                  onChange={(e) => updateBusinessInfo('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">
                  Business Type <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={businessInfo.businessType}
                  onValueChange={(value) => updateBusinessInfo('businessType', value)}
                >
                  <SelectTrigger className={errors.businessType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    {businessTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.businessType && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.businessType}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe what your business does..."
                  value={businessInfo.description}
                  onChange={(e) => updateBusinessInfo('description', e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  This helps us understand your business for compliance purposes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://your-business.com"
                  value={businessInfo.website}
                  onChange={(e) => updateBusinessInfo('website', e.target.value)}
                  className={errors.website ? 'border-red-500' : ''}
                />
                {errors.website && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.website}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Contact Info */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={businessInfo.country}
                  onValueChange={(value) => updateBusinessInfo('country', value)}
                >
                  <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.country}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Your city"
                    value={businessInfo.city}
                    onChange={(e) => updateBusinessInfo('city', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    placeholder="12345"
                    value={businessInfo.postalCode}
                    onChange={(e) => updateBusinessInfo('postalCode', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  placeholder="123 Business Street"
                  value={businessInfo.address}
                  onChange={(e) => updateBusinessInfo('address', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={businessInfo.phone}
                  onChange={(e) => updateBusinessInfo('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID (Optional)</Label>
                <Input
                  id="taxId"
                  placeholder="EIN or SSN"
                  value={businessInfo.taxId}
                  onChange={(e) => updateBusinessInfo('taxId', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Required for businesses processing over $20,000/year
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Alert className="bg-white dark:bg-gray-900 border shadow-sm">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Data Security:</strong> All information is encrypted and stored securely. 
              We use this data for compliance and to provide the best payment experience.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button 
          size="lg"
          onClick={handleSave}
          disabled={!isValid || isLoading}
          className="min-w-[200px] bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Saving Business Info...' : 'Save & Continue'}
        </Button>
      </div>

      {/* Preview Card */}
      {businessInfo.name && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-green-800 dark:text-green-200">
                Business Profile Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Business Name:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">{businessInfo.name}</span>
                </div>
                {businessInfo.businessType && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {businessTypes.find(t => t.value === businessInfo.businessType)?.label}
                    </span>
                  </div>
                )}
                {businessInfo.country && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Country:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{businessInfo.country}</span>
                  </div>
                )}
                {businessInfo.website && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Website:</span>
                    <span className="ml-2 text-blue-600 dark:text-blue-400">{businessInfo.website}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default BusinessInfoStep