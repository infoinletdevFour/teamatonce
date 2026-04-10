/**
 * Company Overview Page for Team@Once
 *
 * Dashboard view showing company statistics, team overview, and recent activity
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Users,
  FolderKanban,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  CheckCircle,
  UserPlus,
  Settings,
  Loader2,
  RefreshCw,
  BarChart3,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  getCompanyById,
  getCompanyStats,
  getCompanyMembers,
} from '@/services/companyService'
import {
  Company,
  CompanyStats,
  CompanyMember,
  SubscriptionTier,
  SubscriptionStatus,
  MemberRole,
} from '@/types/company'

const subscriptionColors: Record<SubscriptionTier, string> = {
  [SubscriptionTier.FREE]: 'bg-gray-100 text-gray-700',
  [SubscriptionTier.BASIC]: 'bg-blue-100 text-blue-700',
  [SubscriptionTier.PRO]: 'bg-purple-100 text-purple-700',
  [SubscriptionTier.ENTERPRISE]: 'bg-amber-100 text-amber-700',
}

const subscriptionStatusColors: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.ACTIVE]: 'bg-green-100 text-green-700',
  [SubscriptionStatus.INACTIVE]: 'bg-gray-100 text-gray-700',
  [SubscriptionStatus.TRIAL]: 'bg-blue-100 text-blue-700',
  [SubscriptionStatus.CANCELLED]: 'bg-red-100 text-red-700',
  [SubscriptionStatus.PAST_DUE]: 'bg-amber-100 text-amber-700',
}

export default function CompanyOverview() {
  const navigate = useNavigate()
  const { companyId } = useParams<{ companyId: string }>()

  const [company, setCompany] = useState<Company | null>(null)
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = async (showRefresh = false) => {
    if (!companyId) return

    if (showRefresh) {
      setIsRefreshing(true)
    }

    try {
      const [companyData, statsData, membersData] = await Promise.all([
        getCompanyById(companyId),
        getCompanyStats(companyId),
        getCompanyMembers(companyId),
      ])

      setCompany(companyData)
      setStats(statsData)
      setMembers(membersData)
    } catch (error: any) {
      console.error('Error fetching company data:', error)
      toast.error(error.message || 'Failed to load company data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  const handleRefresh = () => {
    fetchData(true)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: company?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatAddress = (address: Company['business_address']) => {
    if (!address) return 'Not specified'
    const parts = [address.street, address.city, address.state, address.postal_code, address.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Not specified'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading company overview...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Company Not Found</h2>
          <p className="text-muted-foreground mb-4">The company you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/select-company')}>Select Company</Button>
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
              <div className="flex items-center gap-3">
                {company.logo_url ? (
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={company.logo_url} alt={company.display_name} />
                    <AvatarFallback>{getInitials(company.display_name)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{company.display_name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={subscriptionColors[company.subscription_tier]}>
                      {company.subscription_tier.charAt(0).toUpperCase() + company.subscription_tier.slice(1)}
                    </Badge>
                    <Badge className={subscriptionStatusColors[company.subscription_status]}>
                      {company.subscription_status.replace('_', ' ')}
                    </Badge>
                    {company.is_verified && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/company/${companyId}/settings/company`)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_members}</p>
                    <p className="text-xs text-muted-foreground">Team Members</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {stats.active_members} active, {stats.pending_invitations} pending
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.active_projects}</p>
                    <p className="text-xs text-muted-foreground">Active Projects</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {stats.completed_projects} completed
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {formatCurrency(stats.monthly_revenue)} this month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.on_time_delivery_rate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">On-Time Delivery</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Company Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Details
              </CardTitle>
              <CardDescription>
                {company.description || 'No description provided'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{company.business_email || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{company.business_phone || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {company.website}
                        </a>
                      ) : (
                        <p className="text-sm font-medium">Not specified</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm font-medium">{formatAddress(company.business_address)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="text-sm font-medium">
                        {new Date(company.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Company Size</p>
                      <p className="text-sm font-medium">{company.company_size} employees</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Business Type</p>
                  <p className="text-sm font-medium capitalize">{company.business_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Timezone</p>
                  <p className="text-sm font-medium">{company.timezone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="text-sm font-medium">{company.currency}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/company/${companyId}/settings/team`)}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Invite
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.slice(0, 6).map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user?.avatar} alt={member.user?.name} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.user?.name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant={member.role === MemberRole.OWNER ? 'default' : 'outline'}
                      className="text-xs capitalize"
                    >
                      {member.role}
                    </Badge>
                  </div>
                ))}

                {members.length > 6 && (
                  <Button
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => navigate(`/company/${companyId}/settings/team`)}
                  >
                    View all {members.length} members
                  </Button>
                )}

                {members.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No team members yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Overview
              </CardTitle>
              <CardDescription>Key metrics for your company</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Project Completion Rate</span>
                    <span className="font-medium">
                      {stats.active_projects + stats.completed_projects > 0
                        ? Math.round(
                            (stats.completed_projects /
                              (stats.active_projects + stats.completed_projects)) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.active_projects + stats.completed_projects > 0
                        ? (stats.completed_projects /
                            (stats.active_projects + stats.completed_projects)) *
                          100
                        : 0
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Team Utilization</span>
                    <span className="font-medium">
                      {stats.total_members > 0
                        ? Math.round((stats.active_members / stats.total_members) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.total_members > 0
                        ? (stats.active_members / stats.total_members) * 100
                        : 0
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">On-Time Delivery</span>
                    <span className="font-medium">{stats.on_time_delivery_rate.toFixed(0)}%</span>
                  </div>
                  <Progress value={stats.on_time_delivery_rate} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/company/${companyId}/client/post-project`)}
          >
            <FolderKanban className="w-5 h-5" />
            <span>Post New Project</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/company/${companyId}/settings/team`)}
          >
            <UserPlus className="w-5 h-5" />
            <span>Invite Team Member</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/company/${companyId}/billing`)}
          >
            <DollarSign className="w-5 h-5" />
            <span>Billing & Subscription</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/company/${companyId}/settings/company`)}
          >
            <Settings className="w-5 h-5" />
            <span>Company Settings</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
