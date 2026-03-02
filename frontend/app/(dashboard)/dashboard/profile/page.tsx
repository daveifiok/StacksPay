'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Camera,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  Wallet,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api/auth-api';

interface ProfileData {
  name: string;
  email: string;
  businessType: string;
  website: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  taxId: string;
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    businessType: '',
    website: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    taxId: '',
  });

  // Load profile data from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiClient.getProfile();
        if (response.success && response.data) {
          setProfileData({
            name: response.data.name || '',
            email: response.data.email || '',
            businessType: response.data.businessType || '',
            website: response.data.website || '',
            description: response.data.businessDescription || '',
            phone: response.data.phone || '',
            address: response.data.address || '',
            city: response.data.city || '',
            postalCode: response.data.postalCode || '',
            country: response.data.country || '',
            taxId: response.data.taxId || '',
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        // Fallback to user data from auth hook
        if (user) {
          setProfileData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
            businessType: user.businessType || '',
          }));
        }
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await apiClient.updateProfile({
        name: profileData.name,
        email: profileData.email,
        businessType: profileData.businessType,
        website: profileData.website,
        businessDescription: profileData.description,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        postalCode: profileData.postalCode,
        country: profileData.country,
        taxId: profileData.taxId,
      });
      
      if (response.success) {
        setIsEditing(false);
      } else {
        console.error('Profile update failed:', response.error);
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const getVerificationBadge = () => {
    if (!user) return null;
    
    if (user.emailVerified && user.walletConnected) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Fully Verified</Badge>;
    } else if (user.emailVerified) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">Email Verified</Badge>;
    } else {
      return <Badge variant="destructive">Unverified</Badge>;
    }
  };

  const getProfileCompletion = () => {
    const fields = [user?.name, user?.email, user?.businessType, profileData.website, profileData.phone];
    const completed = fields.filter(Boolean).length;
    const total = fields.length;
    return Math.round((completed / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account information and business identity
          </p>
        </div>
        <Button 
          onClick={() => setIsEditing(!isEditing)}
          variant="outline"
          className="border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20"
        >
          <Edit3 className="mr-2 h-4 w-4" />
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar & Status */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div className="relative mx-auto w-24 h-24">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="" alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-2xl font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button size="sm" className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full bg-orange-600 hover:bg-orange-700">
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {user?.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                  {getVerificationBadge()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{getProfileCompletion()}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${getProfileCompletion()}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  {user?.emailVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className={user?.emailVerified ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}>
                    Email Verification
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {user?.walletConnected ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className={user?.walletConnected ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}>
                    Wallet Connected
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {profileData.website ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className={profileData.website ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}>
                    Business Website
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Level */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-orange-600" />
                <span>Verification Level</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Current Level</span>
                <Badge variant={user?.verificationLevel === 'full' ? 'default' : 'secondary'} className="capitalize">
                  {user?.verificationLevel || 'none'}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• <strong className="text-gray-700 dark:text-gray-300">Basic:</strong> Email verified</p>
                <p>• <strong className="text-gray-700 dark:text-gray-300">Advanced:</strong> Business details + wallet</p>
                <p>• <strong className="text-gray-700 dark:text-gray-300">Full:</strong> Complete verification</p>
              </div>
              
              {user?.verificationLevel !== 'full' && (
                <Button size="sm" variant="outline" className="w-full border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20">
                  <Shield className="mr-2 h-4 w-4" />
                  Increase Level
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Profile Content */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                  <TabsList className="grid w-full grid-cols-2 max-w-md bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="personal" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                      Personal Info
                    </TabsTrigger>
                    <TabsTrigger value="business" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                      Business Info
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="personal" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                          Personal Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
                            <Input
                              id="fullName"
                              value={profileData.name}
                              onChange={(e) => updateProfileData('name', e.target.value)}
                              disabled={!isEditing}
                              className={!isEditing ? 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <span>Email Address</span>
                              {user?.emailVerified ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                              )}
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={profileData.email}
                              onChange={(e) => updateProfileData('email', e.target.value)}
                              disabled={!isEditing}
                              className={!isEditing ? 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'}
                            />
                            {!user?.emailVerified && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                Email verification required
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditing(false)}
                            className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            {loading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="business" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                          Business Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="businessType" className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Type</Label>
                            <Select 
                              value={profileData.businessType}
                              onValueChange={(value) => updateProfileData('businessType', value)}
                              disabled={!isEditing}
                            >
                              <SelectTrigger className={!isEditing ? 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'}>
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                <SelectItem value="ecommerce">E-commerce</SelectItem>
                                <SelectItem value="saas">SaaS Platform</SelectItem>
                                <SelectItem value="marketplace">Marketplace</SelectItem>
                                <SelectItem value="nonprofit">Non-profit</SelectItem>
                                <SelectItem value="consulting">Consulting</SelectItem>
                                <SelectItem value="fintech">Fintech</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="website" className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</Label>
                            <Input
                              id="website"
                              type="url"
                              value={profileData.website}
                              onChange={(e) => updateProfileData('website', e.target.value)}
                              placeholder="https://your-website.com"
                              disabled={!isEditing}
                              className={!isEditing ? 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Description</Label>
                            <Textarea
                              id="description"
                              value={profileData.description}
                              onChange={(e) => updateProfileData('description', e.target.value)}
                              placeholder="Brief description of your business"
                              rows={3}
                              disabled={!isEditing}
                              className={!isEditing ? 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => updateProfileData('phone', e.target.value)}
                              placeholder="+1 (555) 123-4567"
                              disabled={!isEditing}
                              className={!isEditing ? 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="country" className="text-sm font-medium text-gray-700 dark:text-gray-300">Country</Label>
                            <Select 
                              value={profileData.country}
                              onValueChange={(value) => updateProfileData('country', value)}
                              disabled={!isEditing}
                            >
                              <SelectTrigger className={!isEditing ? 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'}>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                <SelectItem value="us">United States</SelectItem>
                                <SelectItem value="ca">Canada</SelectItem>
                                <SelectItem value="gb">United Kingdom</SelectItem>
                                <SelectItem value="de">Germany</SelectItem>
                                <SelectItem value="fr">France</SelectItem>
                                <SelectItem value="jp">Japan</SelectItem>
                                <SelectItem value="au">Australia</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Address</Label>
                            <Input
                              id="address"
                              value={profileData.address}
                              onChange={(e) => updateProfileData('address', e.target.value)}
                              placeholder="Street address"
                              disabled={!isEditing}
                              className={!isEditing ? 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300">City</Label>
                            <Input
                              id="city"
                              value={profileData.city}
                              onChange={(e) => updateProfileData('city', e.target.value)}
                              placeholder="City"
                              disabled={!isEditing}
                              className={!isEditing ? 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">Postal Code</Label>
                            <Input
                              id="postalCode"
                              value={profileData.postalCode}
                              onChange={(e) => updateProfileData('postalCode', e.target.value)}
                              placeholder="ZIP/Postal code"
                              disabled={!isEditing}
                              className={!isEditing ? 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="taxId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tax ID</Label>
                            <Input
                              id="taxId"
                              value={profileData.taxId}
                              onChange={(e) => updateProfileData('taxId', e.target.value)}
                              placeholder="Business tax identification"
                              disabled={!isEditing}
                              className={!isEditing ? 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'}
                            />
                          </div>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditing(false)}
                            className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            {loading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connected Accounts */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-orange-600" />
            <span>Connected Accounts</span>
          </CardTitle>
          <CardDescription>
            Manage your connected wallets and external accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Stacks Wallet</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {user?.stacksAddress ? `${user.stacksAddress.slice(0, 6)}...${user.stacksAddress.slice(-4)}` : 'Not connected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {user?.walletConnected ? (
                  <>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Connected
                    </Badge>
                    <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" className="border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20">
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}