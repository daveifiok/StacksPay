/**
 * Merchant API Client
 * Handles all merchant profile, settings, and onboarding data operations
 */

interface MerchantProfile {
  id?: string
  name: string
  email?: string
  businessName?: string
  businessDescription?: string
  businessType: string
  website?: string
  country?: string
  address?: string
  city?: string
  postalCode?: string
  phone?: string
  taxId?: string
  stacksAddress?: string
  walletConnected?: boolean
  walletType?: string
  [key: string]: any
}

interface MerchantSettings {
  paymentMethods?: {
    bitcoin?: { enabled: boolean }
    stx?: { enabled: boolean }
    sbtc?: { enabled: boolean }
  }
  preferredCurrency?: string
  autoConvertToUSD?: boolean
  settlementFrequency?: string
  apiKeys?: {
    test?: string
    live?: string
  }
  webhooks?: {
    secret?: string
    url?: string
  }
  integrationStatus?: {
    codeGenerated?: boolean
    testPaymentMade?: boolean
    webhooksConfigured?: boolean
    readyForLive?: boolean
  }
  [key: string]: any
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class MerchantApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  }

  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  /**
   * Get merchant profile data
   */
  async getProfile(): Promise<ApiResponse<MerchantProfile>> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/profile`, {
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`)
      }

      const result = await response.json()
      return {
        success: true,
        data: result.data || result.merchant || result
      }
    } catch (error) {
      console.error('❌ Error fetching merchant profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      }
    }
  }

  /**
   * Update merchant profile data
   */
  async updateProfile(profileData: Partial<MerchantProfile>): Promise<ApiResponse<MerchantProfile>> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`)
      }

      const result = await response.json()
      return {
        success: true,
        data: result.data || result.merchant || result,
        message: 'Profile updated successfully'
      }
    } catch (error) {
      console.error('❌ Error updating merchant profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      }
    }
  }

  /**
   * Get merchant settings
   */
  async getSettings(): Promise<ApiResponse<MerchantSettings>> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/settings`, {
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`)
      }

      const result = await response.json()
      const settings = result.data || result.settings || result
      
      // Store settings in localStorage for payment client to access API keys
      if (settings && typeof window !== 'undefined') {
        try {
          localStorage.setItem('merchantSettings', JSON.stringify(settings))
        } catch (error) {
          console.warn('⚠️ Failed to store settings in localStorage:', error)
        }
      }
      
      return {
        success: true,
        data: settings
      }
    } catch (error) {
      console.error('❌ Error fetching merchant settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch settings'
      }
    }
  }

  /**
   * Update merchant settings
   */
  async updateSettings(settingsData: Partial<MerchantSettings>): Promise<ApiResponse<MerchantSettings>> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/settings`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(settingsData)
      })

      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.statusText}`)
      }

      const result = await response.json()
      return {
        success: true,
        data: result.data || result.settings || result,
        message: 'Settings updated successfully'
      }
    } catch (error) {
      console.error('❌ Error updating merchant settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update settings'
      }
    }
  }

  /**
   * Save business information from onboarding
   */
  async saveBusinessInfo(businessInfo: {
    name: string
    description?: string
    businessType: string
    website?: string
    country?: string
    address?: string
    city?: string
    postalCode?: string
    phone?: string
    taxId?: string
  }): Promise<ApiResponse> {
    try {
      // Map onboarding business info to profile format
      const profileData = {
        name: businessInfo.name,
        businessName: businessInfo.name,
        businessDescription: businessInfo.description,
        businessType: businessInfo.businessType,
        website: businessInfo.website,
        country: businessInfo.country,
        address: businessInfo.address,
        city: businessInfo.city,
        postalCode: businessInfo.postalCode,
        phone: businessInfo.phone,
        taxId: businessInfo.taxId
      }

      return await this.updateProfile(profileData)
    } catch (error) {
      console.error('❌ Error saving business info:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save business info'
      }
    }
  }

  /**
   * Save payment preferences from onboarding
   */
  async savePaymentPreferences(preferences: {
    acceptBitcoin: boolean
    acceptSTX: boolean
    acceptSBTC: boolean
    preferredCurrency: string
    autoConvertToUSD: boolean
    settlementFrequency: string
  }): Promise<ApiResponse> {
    try {
      const settingsData = {
        paymentMethods: {
          bitcoin: { enabled: preferences.acceptBitcoin },
          stx: { enabled: preferences.acceptSTX },
          sbtc: { enabled: preferences.acceptSBTC }
        },
        preferredCurrency: preferences.preferredCurrency,
        autoConvertToUSD: preferences.autoConvertToUSD,
        settlementFrequency: preferences.settlementFrequency
      }

      return await this.updateSettings(settingsData)
    } catch (error) {
      console.error('❌ Error saving payment preferences:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save payment preferences'
      }
    }
  }

  /**
   * Update integration status
   */
  async updateIntegrationStatus(status: {
    codeGenerated?: boolean
    testPaymentMade?: boolean
    webhooksConfigured?: boolean
    readyForLive?: boolean
  }): Promise<ApiResponse> {
    try {
      const settingsData = {
        integrationStatus: status
      }

      return await this.updateSettings(settingsData)
    } catch (error) {
      console.error('❌ Error updating integration status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update integration status'
      }
    }
  }

  /**
   * Save API keys from onboarding
   */
  async saveApiKeys(apiKeys: {
    testKey: string
    liveKey: string
    webhookSecret: string
  }): Promise<ApiResponse> {
    try {
      const settingsData = {
        apiKeys: {
          test: apiKeys.testKey,
          live: apiKeys.liveKey
        },
        webhooks: {
          secret: apiKeys.webhookSecret
        }
      }

      const result = await this.updateSettings(settingsData)
      
      // Store API keys in localStorage for payment client to use
      if (result.success && typeof window !== 'undefined') {
        try {
          localStorage.setItem('merchantSettings', JSON.stringify(settingsData))
          console.log('✅ API keys stored in localStorage for payment operations')
        } catch (error) {
          console.warn('⚠️ Failed to store API keys in localStorage:', error)
        }
      }

      return result
    } catch (error) {
      console.error('❌ Error saving API keys:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save API keys'
      }
    }
  }

  /**
   * Complete onboarding step and save progress
   */
  async completeOnboardingStep(step: string, data: any): Promise<ApiResponse> {
    try {
      let result: ApiResponse

      switch (step) {
        case 'business':
          result = await this.saveBusinessInfo(data)
          break
        case 'preferences':
          result = await this.savePaymentPreferences(data)
          break
        case 'integration':
          result = await this.updateIntegrationStatus({ codeGenerated: true })
          break
        case 'test':
          result = await this.updateIntegrationStatus({ testPaymentMade: true })
          break
        case 'go-live':
          result = await this.updateIntegrationStatus({ readyForLive: true })
          break
        default:
          result = { success: true, message: 'Step completed' }
      }

      if (result.success) {
        console.log(`✅ Onboarding step '${step}' completed and saved`)
      }

      return result
    } catch (error) {
      console.error(`❌ Error completing onboarding step '${step}':`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete step'
      }
    }
  }
}

// Export singleton instance
export const merchantApiClient = new MerchantApiClient()
