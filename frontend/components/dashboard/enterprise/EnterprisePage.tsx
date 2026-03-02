'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield,
  Building2,
  Users,
  FileText,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

export default function EnterprisePage() {
  const [enterprise] = useState({
    id: 'ent_1',
    name: 'Acme Corporation',
    type: 'corporation' as const,
    jurisdiction: 'Delaware, USA',
    taxId: '12-3456789',
    complianceLevel: 'enhanced' as const,
    kycStatus: 'verified' as const,
    documents: {
      incorporation: true,
      operatingAgreement: true,
      taxCertificate: true,
      complianceCertification: false
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getComplianceColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-blue-100 text-blue-700'
      case 'enhanced': return 'bg-purple-100 text-purple-700'
      case 'enterprise': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enterprise Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Advanced payment solutions for enterprise organizations
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Shield className="w-4 h-4 mr-2" />
          Upgrade Compliance
        </Button>
      </div>

      {/* Enterprise Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Organization Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-lg">{enterprise.name}</h3>
              <p className="text-gray-600 capitalize">{enterprise.type}</p>
              <p className="text-sm text-gray-500 mt-1">{enterprise.jurisdiction}</p>
              <p className="text-sm text-gray-500">Tax ID: {enterprise.taxId}</p>
            </div>
            
            <div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">KYC Status</span>
                  <Badge className={getStatusColor(enterprise.kycStatus)}>
                    {enterprise.kycStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Compliance Level</span>
                  <Badge className={getComplianceColor(enterprise.complianceLevel)}>
                    {enterprise.complianceLevel}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Document Status</h4>
              <div className="space-y-1">
                {Object.entries(enterprise.documents).map(([doc, status]) => (
                  <div key={doc} className="flex items-center space-x-2">
                    {status ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-sm capitalize">
                      {doc.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Escrow Contracts</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Multi-Sig Wallets</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Compliance Reports</p>
                <p className="text-2xl font-bold">28</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Volume (30d)</p>
                <p className="text-2xl font-bold">₿2.4</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Escrow Services */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Escrow Services</span>
            </CardTitle>
            <CardDescription>
              Secure multi-party payment solutions with automated release conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Active Contracts</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Total Value Locked</span>
                <span className="font-medium">₿1.25</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Success Rate</span>
                <span className="font-medium text-green-600">98.5%</span>
              </div>
            </div>
            <Link href="/dashboard/enterprise/escrow">
              <Button variant="outline" className="w-full mt-4 group">
                Manage Escrow
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Multi-Signature */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Multi-Signature</span>
            </CardTitle>
            <CardDescription>
              Shared control wallets requiring multiple signatures for transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Active Wallets</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Pending Signatures</span>
                <span className="font-medium text-yellow-600">3</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Total Signers</span>
                <span className="font-medium">18</span>
              </div>
            </div>
            <Link href="/dashboard/enterprise/multisig">
              <Button variant="outline" className="w-full mt-4 group">
                Manage Multi-Sig
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Compliance Dashboard */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Compliance</span>
            </CardTitle>
            <CardDescription>
              Regulatory compliance monitoring and automated reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Compliance Score</span>
                <span className="font-medium text-green-600">95%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Open Issues</span>
                <span className="font-medium text-yellow-600">2</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Next Audit</span>
                <span className="font-medium">Mar 15</span>
              </div>
            </div>
            <Link href="/dashboard/enterprise/compliance">
              <Button variant="outline" className="w-full mt-4 group">
                View Compliance
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest enterprise transactions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                type: 'escrow',
                title: 'Escrow Contract Released',
                description: 'Contract ESC_123 released ₿0.15 to recipient',
                time: '2 hours ago',
                status: 'success'
              },
              {
                type: 'multisig',
                title: 'Multi-Sig Signature Required',
                description: 'Transaction MSW_456 needs 1 more signature',
                time: '4 hours ago',
                status: 'pending'
              },
              {
                type: 'compliance',
                title: 'KYC Document Verified',
                description: 'Business license verification completed',
                time: '1 day ago',
                status: 'success'
              },
              {
                type: 'compliance',
                title: 'Compliance Alert',
                description: 'Monthly transaction limit approaching (85%)',
                time: '2 days ago',
                status: 'warning'
              }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-600' :
                  activity.status === 'pending' ? 'bg-yellow-600' :
                  activity.status === 'warning' ? 'bg-orange-600' :
                  'bg-gray-600'
                }`} />
                <div className="flex-1">
                  <h4 className="font-medium">{activity.title}</h4>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                </div>
                <div className="text-sm text-gray-500">{activity.time}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}