/**
 * Project Payments Page for Team@Once
 *
 * Shows all payments and financial information for a specific project
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Filter,
  Receipt,
  TrendingUp,
  Calendar,
  Loader2,
  ExternalLink,
  Eye,
  ShieldCheck,
  ArrowDownRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { Payment, Milestone, PaymentStats, Currency } from '@/types/payment'
import { useCompany } from '@/contexts/CompanyContext'
import paymentService from '@/services/paymentService'
import projectService, { getProjectStats } from '@/services/projectService'
import { RejectedProjectBanner } from '@/components/project/RejectedProjectBanner'

const statusColors: Record<string, { bg: string; text: string; icon: React.ComponentType<any> }> = {
  completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  processing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Loader2 },
  failed: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-700', icon: ArrowDownRight },
}

const milestoneStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  review: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  paid: 'bg-emerald-100 text-emerald-700',
  disputed: 'bg-red-100 text-red-700',
}

export default function ProjectPayments() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ companyId: string; projectId: string }>()
  const { companyId, loading: companyLoading } = useCompany()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [approvalStatus, setApprovalStatus] = useState<string>('approved')
  const [rejectionReason, setRejectionReason] = useState<string>('')

  // Check if project is rejected
  const isProjectRejected = approvalStatus === 'rejected'

  useEffect(() => {
    if (companyId && projectId) {
      loadPaymentData()
      // Fetch project approval status
      getProjectStats(projectId).then((data) => {
        setApprovalStatus(data.project?.approval_status || 'approved')
        setRejectionReason(data.project?.approval_rejection_reason || '')
      }).catch(console.error)
    }
  }, [companyId, projectId])

  const loadPaymentData = async () => {
    if (!companyId || !projectId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch payments and milestones in parallel
      const [paymentsData, milestonesData] = await Promise.all([
        paymentService.getProjectPayments(companyId, projectId).catch(() => []),
        projectService.getProjectMilestones(projectId).catch(() => ({ milestones: [] })),
      ])

      // Transform payments to frontend format
      // Note: Payment amounts from Stripe are in cents (stored as strings), parse and convert to dollars
      const transformedPayments: Payment[] = (paymentsData || []).map((p: any) => ({
        id: p.id || `PAY-${p.id?.slice(0, 6)}`,
        projectId: p.project_id,
        milestoneId: p.milestone_id,
        amount: (Number(p.amount) || 0) / 100, // Parse string to number and convert cents to dollars
        currency: p.currency || 'USD',
        status: p.status || 'pending',
        method: p.payment_method === 'stripe' || p.payment_method === 'credit_card' ? 'card' : 'escrow',
        transactionId: p.transaction_id,
        paidBy: p.client_id,
        paidTo: p.developer_id || '',
        paidAt: p.transaction_date ? new Date(p.transaction_date) : undefined,
        createdAt: new Date(p.created_at),
      }))
      setPayments(transformedPayments)

      // Transform milestones to frontend format
      const milestonesList = milestonesData?.milestones || milestonesData || []
      const transformedMilestones: Milestone[] = milestonesList.map((m: any) => ({
        id: m.id,
        projectId: m.project_id || projectId || '',
        title: m.title || m.name,
        description: m.description || '',
        amount: Number(m.amount) || Number(m.budget) || 0, // Parse string to number (milestones stored in dollars)
        currency: 'USD' as const,
        status: mapMilestoneStatus(m.status) as any,
        dueDate: m.due_date ? new Date(m.due_date) : new Date(),
        completedDate: m.completed_at ? new Date(m.completed_at) : undefined,
        deliverables: m.deliverables || [],
        createdAt: new Date(m.created_at || Date.now()),
        updatedAt: new Date(m.updated_at || Date.now()),
      }))
      setMilestones(transformedMilestones)

    } catch (err: any) {
      console.error('Failed to load payment data:', err)
      setError(err.message || 'Failed to load payment data')
      toast.error('Failed to load payment data')
    } finally {
      setIsLoading(false)
    }
  }

  // Map backend milestone status to frontend status
  const mapMilestoneStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'pending',
      in_progress: 'in-progress',
      submitted: 'review',
      feedback_required: 'review',
      approved: 'completed',
      completed: 'paid',
    }
    return statusMap[status] || status
  }

  // Calculate stats
  const stats: PaymentStats = {
    totalEarned: payments.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0),
    totalPaid: payments.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0),
    inEscrow: payments.reduce((sum, p) => p.status === 'processing' ? sum + p.amount : sum, 0),
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    completedPayments: payments.filter(p => p.status === 'completed').length,
    currency: 'USD',
  }

  const totalProjectValue = milestones.reduce((sum, m) => sum + m.amount, 0)
  const paidAmount = milestones
    .filter(m => m.status === 'paid' || m.status === 'completed')
    .reduce((sum, m) => sum + m.amount, 0)
  const paymentProgress = totalProjectValue > 0 ? (paidAmount / totalProjectValue) * 100 : 0

  const filteredPayments = filterStatus === 'all'
    ? payments
    : payments.filter(p => p.status === filterStatus)

  const formatCurrency = (amount: number, currency: Currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (companyLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Payments</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadPaymentData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Project Payments
                </h1>
                <p className="text-muted-foreground text-sm">
                  Track payments and milestones for this project
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/company/${companyId}/project/${projectId}/payment/dashboard`)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Full Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Rejected Project Banner */}
        {isProjectRejected && (
          <RejectedProjectBanner
            reason={rejectionReason}
            className="mb-2"
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</p>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.inEscrow)}</p>
                  <p className="text-xs text-muted-foreground">In Escrow</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalProjectValue)}</p>
                  <p className="text-xs text-muted-foreground">Project Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Progress</CardTitle>
            <CardDescription>
              {formatCurrency(paidAmount)} of {formatCurrency(totalProjectValue)} paid ({paymentProgress.toFixed(0)}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={paymentProgress} className="h-3" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Paid: {formatCurrency(paidAmount)}</span>
              <span>Remaining: {formatCurrency(totalProjectValue - paidAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Milestones Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Milestone Payments
                  </CardTitle>
                  {!isProjectRejected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/company/${companyId}/project/${projectId}/milestone-approval`)}
                    >
                      Manage Milestones
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {milestone.id.replace('M', '')}
                        </div>
                        <div>
                          <p className="font-medium">{milestone.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {formatDate(milestone.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={milestoneStatusColors[milestone.status]}>
                          {milestone.status.replace('-', ' ')}
                        </Badge>
                        <span className="font-semibold">
                          {formatCurrency(milestone.amount, milestone.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment) => {
                    const StatusIcon = statusColors[payment.status]?.icon || Clock
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors[payment.status]?.bg}`}>
                            <StatusIcon className={`w-4 h-4 ${statusColors[payment.status]?.text}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{payment.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(payment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(payment.amount, payment.currency)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Milestones</CardTitle>
                <CardDescription>
                  Payment schedule based on project milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={milestone.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold">{milestone.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {milestone.description}
                            </p>
                          </div>
                        </div>
                        <Badge className={milestoneStatusColors[milestone.status]}>
                          {milestone.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Due: {formatDate(milestone.dueDate)}
                          </span>
                          {milestone.completedDate && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              Completed: {formatDate(milestone.completedDate)}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-lg">
                          {formatCurrency(milestone.amount, milestone.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transaction History</CardTitle>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredPayments.length > 0 ? (
                  <div className="space-y-3">
                    {filteredPayments.map((payment) => {
                      const StatusIcon = statusColors[payment.status]?.icon || Clock
                      const milestone = milestones.find(m => m.id === payment.milestoneId)
                      return (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColors[payment.status]?.bg}`}>
                              <StatusIcon className={`w-5 h-5 ${statusColors[payment.status]?.text}`} />
                            </div>
                            <div>
                              <p className="font-medium">{payment.id}</p>
                              {milestone && (
                                <p className="text-sm text-muted-foreground">
                                  {milestone.title}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {formatDate(payment.createdAt)}
                                {payment.transactionId && ` - ${payment.transactionId}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {formatCurrency(payment.amount, payment.currency)}
                              </p>
                              <Badge className={`${statusColors[payment.status]?.bg} ${statusColors[payment.status]?.text}`}>
                                {payment.status}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Escrow Notice */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Secure Escrow Payments</h3>
                <p className="text-sm text-blue-700 mt-1">
                  All payments are protected by our escrow system. Funds are only released
                  to developers after milestone approval by the client.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
