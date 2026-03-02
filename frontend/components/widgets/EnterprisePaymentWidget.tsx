'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Users, 
  Lock, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Signature,
  FileText,
  Settings,
  Banknote,
  ArrowRightLeft,
  Timer,
  UserCheck,
  Building,
  Gavel,
  RefreshCw,
  Download,
  Search
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

interface Signer {
  id: string
  address: string
  name: string
  role: string
  status: 'pending' | 'signed' | 'rejected'
  signedAt?: string
  publicKey: string
}

interface EscrowConfig {
  amount: number
  currency: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  releaseConditions: string[]
  timelock?: number // hours
  disputeResolution: 'arbitrator' | 'majority' | 'unanimous'
  arbitrator?: string
  releaseTo: string
  description: string
  documents?: string[]
}

interface MultiSigConfig {
  threshold: number // Required signatures
  signers: Signer[]
  amount: number
  currency: 'BTC' | 'STX' | 'sBTC' | 'USDC'
  description: string
  deadline?: string
  autoExecute: boolean
}

interface Enterprise {
  id: string
  name: string
  type: 'corporation' | 'llc' | 'partnership' | 'government' | 'nonprofit'
  jurisdiction: string
  taxId: string
  complianceLevel: 'basic' | 'enhanced' | 'enterprise'
  kycStatus: 'pending' | 'verified' | 'rejected'
  documents: {
    incorporation: boolean
    operatingAgreement: boolean
    taxCertificate: boolean
    complianceCertification: boolean
  }
}

interface EnterprisePaymentWidgetProps {
  type: 'escrow' | 'multisig' | 'enterprise_onboarding' | 'compliance_dashboard'
  enterprise?: Enterprise
  onEscrowCreate?: (config: EscrowConfig) => void
  onMultiSigCreate?: (config: MultiSigConfig) => void
  onComplianceUpdate?: (updates: any) => void
  showComplianceFeatures?: boolean
  allowCustomContracts?: boolean
  requireKYB?: boolean // Know Your Business
}

const COMPLIANCE_LEVELS = {
  basic: {
    name: 'Basic Compliance',
    description: 'Standard AML/KYC checks',
    features: ['Transaction monitoring', 'Basic reporting', 'Standard KYC'],
    monthlyFee: 99
  },
  enhanced: {
    name: 'Enhanced Compliance',
    description: 'Advanced compliance features',
    features: ['Real-time monitoring', 'Advanced analytics', 'Enhanced KYC', 'Sanctions screening'],
    monthlyFee: 299
  },
  enterprise: {
    name: 'Enterprise Compliance',
    description: 'Full regulatory compliance suite',
    features: ['Full audit trails', 'Regulatory reporting', 'Custom compliance rules', 'Dedicated compliance manager'],
    monthlyFee: 999
  }
}

const ENTERPRISE_TYPES = {
  corporation: { name: 'Corporation', icon: Building },
  llc: { name: 'Limited Liability Company', icon: Shield },
  partnership: { name: 'Partnership', icon: Users },
  government: { name: 'Government Entity', icon: Gavel },
  nonprofit: { name: 'Non-Profit Organization', icon: UserCheck }
}

export default function EnterprisePaymentWidget({
  type,
  enterprise,
  onEscrowCreate,
  onMultiSigCreate,
  onComplianceUpdate,
  showComplianceFeatures = true,
  allowCustomContracts = true,
  requireKYB = true
}: EnterprisePaymentWidgetProps) {
  const { toast } = useToast()
  const [activeFeature, setActiveFeature] = useState<string>(type)
  const [isLoading, setIsLoading] = useState(false)
  
  // Escrow state
  const [escrowConfig, setEscrowConfig] = useState<EscrowConfig>({
    amount: 0,
    currency: 'sBTC',
    releaseConditions: [],
    disputeResolution: 'majority',
    releaseTo: '',
    description: ''
  })
  
  // Multi-sig state
  const [multiSigConfig, setMultiSigConfig] = useState<MultiSigConfig>({
    threshold: 2,
    signers: [],
    amount: 0,
    currency: 'sBTC',
    description: '',
    autoExecute: true
  })
  
  const [showSignerDialog, setShowSignerDialog] = useState(false)
  const [newSigner, setNewSigner] = useState({ address: '', name: '', role: '' })

  const handleCreateEscrow = async () => {
    if (!escrowConfig.description || escrowConfig.amount <= 0) {
      toast({
        title: 'Invalid Configuration',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      onEscrowCreate?.(escrowConfig)
      toast({
        title: 'Escrow Created',
        description: 'Smart escrow contract has been deployed',
      })
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create escrow contract',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMultiSig = async () => {
    if (multiSigConfig.signers.length < 2 || multiSigConfig.threshold > multiSigConfig.signers.length) {
      toast({
        title: 'Invalid Configuration',
        description: 'Need at least 2 signers and valid threshold',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      onMultiSigCreate?.(multiSigConfig)
      toast({
        title: 'Multi-Signature Wallet Created',
        description: 'Multi-sig contract deployed successfully',
      })
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create multi-sig wallet',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSigner = () => {
    if (!newSigner.address || !newSigner.name) {
      toast({
        title: 'Invalid Signer',
        description: 'Please provide address and name',
        variant: 'destructive'
      })
      return
    }

    const signer: Signer = {
      id: `signer_${Date.now()}`,
      address: newSigner.address,
      name: newSigner.name,
      role: newSigner.role || 'Signer',
      status: 'pending',
      publicKey: `pub_${newSigner.address.slice(-8)}`
    }

    setMultiSigConfig(prev => ({
      ...prev,
      signers: [...prev.signers, signer]
    }))

    setNewSigner({ address: '', name: '', role: '' })
    setShowSignerDialog(false)
  }

  const removeSigner = (signerId: string) => {
    setMultiSigConfig(prev => ({
      ...prev,
      signers: prev.signers.filter(s => s.id !== signerId)
    }))
  }

  // Escrow Widget
  if (type === 'escrow') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Smart Escrow</span>
          </CardTitle>
          <CardDescription>
            Create secure escrow contracts with customizable release conditions
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Configuration */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="any"
                    value={escrowConfig.amount || ''}
                    onChange={(e) => setEscrowConfig(prev => ({ 
                      ...prev, 
                      amount: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select 
                    value={escrowConfig.currency} 
                    onValueChange={(value) => setEscrowConfig(prev => ({ 
                      ...prev, 
                      currency: value as any 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sBTC">sBTC</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="STX">STX</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Release To Address</Label>
                <Input
                  value={escrowConfig.releaseTo}
                  onChange={(e) => setEscrowConfig(prev => ({ 
                    ...prev, 
                    releaseTo: e.target.value 
                  }))}
                  placeholder="Recipient address"
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={escrowConfig.description}
                  onChange={(e) => setEscrowConfig(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  placeholder="Purpose of this escrow..."
                  rows={3}
                />
              </div>
            </div>

            {/* Advanced Configuration */}
            <div className="space-y-4">
              <div>
                <Label>Dispute Resolution</Label>
                <Select 
                  value={escrowConfig.disputeResolution} 
                  onValueChange={(value) => setEscrowConfig(prev => ({ 
                    ...prev, 
                    disputeResolution: value as any 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="majority">Majority Vote</SelectItem>
                    <SelectItem value="unanimous">Unanimous</SelectItem>
                    <SelectItem value="arbitrator">Arbitrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {escrowConfig.disputeResolution === 'arbitrator' && (
                <div>
                  <Label>Arbitrator Address</Label>
                  <Input
                    value={escrowConfig.arbitrator || ''}
                    onChange={(e) => setEscrowConfig(prev => ({ 
                      ...prev, 
                      arbitrator: e.target.value 
                    }))}
                    placeholder="Arbitrator address"
                    className="font-mono text-sm"
                  />
                </div>
              )}

              <div>
                <Label>Timelock (Hours)</Label>
                <Input
                  type="number"
                  value={escrowConfig.timelock || ''}
                  onChange={(e) => setEscrowConfig(prev => ({ 
                    ...prev, 
                    timelock: parseInt(e.target.value) || undefined 
                  }))}
                  placeholder="Optional release delay"
                />
              </div>

              <div>
                <Label>Release Conditions</Label>
                <Textarea
                  value={escrowConfig.releaseConditions.join('\\n')}
                  onChange={(e) => setEscrowConfig(prev => ({ 
                    ...prev, 
                    releaseConditions: e.target.value.split('\\n').filter(Boolean) 
                  }))}
                  placeholder="Enter conditions (one per line)"
                  rows={4}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Each line represents a condition that must be met
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium mb-3">Escrow Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Amount:</span> {escrowConfig.amount} {escrowConfig.currency}
              </div>
              <div>
                <span className="font-medium">Dispute Method:</span> {escrowConfig.disputeResolution}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Conditions:</span> {escrowConfig.releaseConditions.length} specified
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateEscrow}
            disabled={isLoading || !escrowConfig.description || escrowConfig.amount <= 0}
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Create Escrow Contract
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Multi-Signature Widget
  if (type === 'multisig') {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Multi-Signature Wallet</span>
          </CardTitle>
          <CardDescription>
            Create a multi-signature wallet requiring multiple approvals
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration */}
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <Textarea
                  value={multiSigConfig.description}
                  onChange={(e) => setMultiSigConfig(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  placeholder="Purpose of this multi-sig wallet..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="any"
                    value={multiSigConfig.amount || ''}
                    onChange={(e) => setMultiSigConfig(prev => ({ 
                      ...prev, 
                      amount: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select 
                    value={multiSigConfig.currency} 
                    onValueChange={(value) => setMultiSigConfig(prev => ({ 
                      ...prev, 
                      currency: value as any 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sBTC">sBTC</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="STX">STX</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Required Signatures</Label>
                <Select 
                  value={multiSigConfig.threshold.toString()} 
                  onValueChange={(value) => setMultiSigConfig(prev => ({ 
                    ...prev, 
                    threshold: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: Math.max(1, multiSigConfig.signers.length) }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1} of {multiSigConfig.signers.length || 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Execution Deadline (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={multiSigConfig.deadline || ''}
                  onChange={(e) => setMultiSigConfig(prev => ({ 
                    ...prev, 
                    deadline: e.target.value || undefined 
                  }))}
                />
              </div>

              <Button
                onClick={() => setShowSignerDialog(true)}
                variant="outline"
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Signer
              </Button>
            </div>

            {/* Signers List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Authorized Signers ({multiSigConfig.signers.length})</Label>
                <Badge variant="secondary">
                  {multiSigConfig.threshold} of {multiSigConfig.signers.length} required
                </Badge>
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {multiSigConfig.signers.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No signers added yet</p>
                    <p className="text-xs">Add at least 2 signers to continue</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {multiSigConfig.signers.map((signer) => (
                      <div key={signer.id} className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{signer.name}</div>
                          <div className="text-xs text-gray-600 font-mono">
                            {signer.address.slice(0, 10)}...{signer.address.slice(-8)}
                          </div>
                          <div className="text-xs text-gray-500">{signer.role}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            signer.status === 'signed' ? 'default' :
                            signer.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {signer.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSigner(signer.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateMultiSig}
            disabled={isLoading || multiSigConfig.signers.length < 2 || !multiSigConfig.description}
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Create Multi-Signature Wallet
          </Button>
        </CardContent>

        {/* Add Signer Dialog */}
        <Dialog open={showSignerDialog} onOpenChange={setShowSignerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Authorized Signer</DialogTitle>
              <DialogDescription>
                Add a new signer to the multi-signature wallet
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={newSigner.name}
                  onChange={(e) => setNewSigner(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Signer name"
                />
              </div>
              
              <div>
                <Label>Address *</Label>
                <Input
                  value={newSigner.address}
                  onChange={(e) => setNewSigner(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Wallet address"
                  className="font-mono text-sm"
                />
              </div>
              
              <div>
                <Label>Role</Label>
                <Input
                  value={newSigner.role}
                  onChange={(e) => setNewSigner(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="CEO, CFO, etc."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSignerDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addSigner}>
                Add Signer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    )
  }

  // Enterprise Onboarding Widget
  if (type === 'enterprise_onboarding') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Enterprise Onboarding</span>
          </CardTitle>
          <CardDescription>
            Complete your enterprise verification and compliance setup
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="business" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="business">Business Info</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>

            <TabsContent value="business" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Business Name *</Label>
                  <Input placeholder="Your Company Inc." />
                </div>
                <div>
                  <Label>Business Type *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ENTERPRISE_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Jurisdiction *</Label>
                  <Input placeholder="Delaware, USA" />
                </div>
                <div>
                  <Label>Tax ID / EIN *</Label>
                  <Input placeholder="12-3456789" />
                </div>
              </div>

              <div>
                <Label>Business Address</Label>
                <Textarea placeholder="Full business address including postal code" rows={3} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Expected Monthly Volume</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-10k">$0 - $10,000</SelectItem>
                      <SelectItem value="10k-100k">$10,000 - $100,000</SelectItem>
                      <SelectItem value="100k-1m">$100,000 - $1,000,000</SelectItem>
                      <SelectItem value="1m+">$1,000,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Industry</Label>
                  <Input placeholder="Technology, Finance, etc." />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-6">
              <div className="space-y-4">
                {[
                  { name: 'Articles of Incorporation', required: true, uploaded: false },
                  { name: 'Operating Agreement / Bylaws', required: true, uploaded: true },
                  { name: 'Tax Certificate', required: true, uploaded: false },
                  { name: 'Bank Reference Letter', required: false, uploaded: false },
                  { name: 'Beneficial Ownership Form', required: true, uploaded: false }
                ].map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-gray-600">
                          {doc.required ? 'Required' : 'Optional'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.uploaded ? (
                        <Badge className="bg-green-50 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                      ) : (
                        <Button variant="outline" size="sm">
                          Upload
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6 mt-6">
              <div>
                <h3 className="font-medium mb-4">Choose Compliance Level</h3>
                <div className="space-y-4">
                  {Object.entries(COMPLIANCE_LEVELS).map(([key, level]) => (
                    <Card key={key} className="cursor-pointer hover:border-orange-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{level.name}</h4>
                              <Badge variant="outline">${level.monthlyFee}/month</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{level.description}</p>
                            <ul className="text-sm space-y-1">
                              {level.features.map((feature, index) => (
                                <li key={index} className="flex items-center space-x-2">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="verification" className="space-y-4 mt-6">
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Verification in Progress</h3>
                  <p className="text-gray-600">
                    Our compliance team is reviewing your application
                  </p>
                </div>
                <div className="max-w-sm mx-auto">
                  <Progress value={65} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>Estimated completion</span>
                    <span>2-3 business days</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { step: 'Document Review', status: 'completed', icon: FileText },
                  { step: 'KYB Verification', status: 'in_progress', icon: Search },
                  { step: 'Final Approval', status: 'pending', icon: CheckCircle2 }
                ].map((step, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      step.status === 'completed' ? 'bg-green-100 text-green-600' :
                      step.status === 'in_progress' ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div className="font-medium text-sm">{step.step}</div>
                    <div className={`text-xs mt-1 ${
                      step.status === 'completed' ? 'text-green-600' :
                      step.status === 'in_progress' ? 'text-orange-600' :
                      'text-gray-500'
                    }`}>
                      {step.status === 'completed' ? 'Complete' :
                       step.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  // Default fallback
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-12 text-center">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="font-medium text-lg mb-2">Enterprise Features</h3>
        <p className="text-gray-600">
          Advanced payment solutions for enterprise customers
        </p>
      </CardContent>
    </Card>
  )
}