'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  Users,
  TrendingUp,
  Download,
  Upload,
  Eye,
  Calendar
} from 'lucide-react'
import EnterprisePaymentWidget from '@/components/widgets/EnterprisePaymentWidget'

// Mock compliance data
const complianceData = {
  overall_score: 95,
  level: 'enhanced',
  kyc_status: 'verified',
  last_audit: '2024-01-15',
  next_audit: '2024-07-15',
  open_issues: 2,
  resolved_issues: 24,
  documents: [
    { name: 'Articles of Incorporation', status: 'verified', expires: '2026-12-31', uploaded: '2023-01-15' },
    { name: 'Operating Agreement', status: 'verified', expires: '2025-06-30', uploaded: '2023-02-10' },
    { name: 'Tax Certificate', status: 'verified', expires: '2024-12-31', uploaded: '2023-12-01' },
    { name: 'Compliance Certification', status: 'pending', expires: '2024-03-31', uploaded: null },
    { name: 'AML Policy', status: 'verified', expires: '2025-01-31', uploaded: '2024-01-01' },
    { name: 'KYC Procedures', status: 'verified', expires: '2025-01-31', uploaded: '2024-01-01' }
  ],
  risk_assessment: {
    overall: 'low',
    transaction_volume: 'medium',
    geographic_risk: 'low',
    business_type: 'low',
    customer_base: 'low'
  },
  monitoring: {
    transaction_monitoring: true,
    sanctions_screening: true,
    pep_screening: true,
    adverse_media: true,
    ongoing_monitoring: true
  },
  reports: [
    { id: 'RPT_001', type: 'Monthly Compliance Report', date: '2024-01-31', status: 'completed' },
    { id: 'RPT_002', type: 'Transaction Monitoring', date: '2024-01-30', status: 'completed' },
    { id: 'RPT_003', type: 'Risk Assessment Update', date: '2024-01-15', status: 'completed' },
    { id: 'RPT_004', type: 'Sanctions Screening', date: '2024-02-01', status: 'pending' }
  ]
}

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'expired': case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'high': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compliance Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Regulatory compliance monitoring and automated reporting
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Compliance Score Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold">Compliance Score</span>
              </div>
              <div className={`text-4xl font-bold ${getComplianceColor(complianceData.overall_score)}`}>
                {complianceData.overall_score}%
              </div>
              <Progress value={complianceData.overall_score} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Building2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">KYC Status</span>
              </div>
              <Badge className={getStatusColor(complianceData.kyc_status)} size="lg">
                {complianceData.kyc_status}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                Level: {complianceData.level}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Open Issues</span>
              </div>
              <div className="text-3xl font-bold text-yellow-600">
                {complianceData.open_issues}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {complianceData.resolved_issues} resolved
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Next Audit</span>
              </div>
              <div className="text-lg font-bold">
                {new Date(complianceData.next_audit).toLocaleDateString()}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Last: {new Date(complianceData.last_audit).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Compliance Activity</CardTitle>
                <CardDescription>Latest compliance events and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      type: 'document',
                      title: 'AML Policy Updated',
                      description: 'Annual AML policy review completed',
                      time: '2 hours ago',
                      status: 'completed'
                    },
                    {
                      type: 'screening',
                      title: 'Sanctions Screening',
                      description: '500 transactions screened successfully',
                      time: '6 hours ago',
                      status: 'completed'
                    },
                    {
                      type: 'alert',
                      title: 'Document Expiring Soon',
                      description: 'Tax Certificate expires in 45 days',
                      time: '1 day ago',
                      status: 'warning'
                    },
                    {
                      type: 'report',
                      title: 'Monthly Report Generated',
                      description: 'January 2024 compliance report ready',
                      time: '2 days ago',
                      status: 'completed'
                    }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'completed' ? 'bg-green-600' :
                        activity.status === 'warning' ? 'bg-yellow-600' :
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

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle>Action Items</CardTitle>
                <CardDescription>Compliance tasks requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-yellow-800">Document Renewal Required</h4>
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <p className="text-sm text-yellow-700">
                    Compliance Certification expires in 30 days
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Renew Document
                  </Button>
                </div>
                
                <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-800">Risk Assessment Update</h4>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm text-blue-700">
                    Quarterly risk assessment due next week
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Schedule Assessment
                  </Button>
                </div>
                
                <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-800">All Systems Operational</h4>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-green-700">
                    Monitoring systems are functioning normally
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Documents</CardTitle>
              <CardDescription>Manage your regulatory and compliance documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {complianceData.documents.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium mb-2">{doc.name}</h4>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div className="flex justify-between">
                        <span>Expires:</span>
                        <span>{new Date(doc.expires).toLocaleDateString()}</span>
                      </div>
                      {doc.uploaded && (
                        <div className="flex justify-between">
                          <span>Uploaded:</span>
                          <span>{new Date(doc.uploaded).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {doc.uploaded ? (
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700">
                          <Upload className="w-4 h-4 mr-1" />
                          Upload
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment Overview</CardTitle>
                <CardDescription>Current risk profile analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(complianceData.risk_assessment).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium capitalize">
                        {key.replace('_', ' ')}
                      </span>
                      <Badge className={getRiskColor(value)}>
                        {value.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Mitigation Actions</CardTitle>
                <CardDescription>Recommended actions to reduce risk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800">Enhanced Due Diligence</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Implement enhanced screening for high-value transactions
                    </p>
                  </div>
                  
                  <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800">Geographic Monitoring</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Increase monitoring for transactions from high-risk jurisdictions
                    </p>
                  </div>
                  
                  <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800">Customer Segmentation</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Review and update customer risk scoring methodology
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring Systems Status</CardTitle>
                <CardDescription>Real-time compliance monitoring overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(complianceData.monitoring).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        {value ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium capitalize">
                          {key.replace('_', ' ')}
                        </span>
                      </div>
                      <Badge className={value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {value ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring Statistics</CardTitle>
                <CardDescription>Recent monitoring activity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1,247</div>
                    <div className="text-sm text-gray-600">Transactions Monitored</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">99.8%</div>
                    <div className="text-sm text-gray-600">Clean Rate</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">3</div>
                    <div className="text-sm text-gray-600">Alerts Generated</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">2.1s</div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>Generated compliance and audit reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceData.reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{report.type}</h4>
                        <p className="text-sm text-gray-600">
                          Generated: {new Date(report.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center pt-6">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Generate New Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}