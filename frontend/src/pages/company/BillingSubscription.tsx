/**
 * Billing & Subscription Page for Team@Once
 *
 * Manage company subscription, billing history, and payment methods
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  Download,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Zap,
  Building2,
  Users,
  FolderKanban,
  Shield,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getCompanyById } from '@/services/companyService'
import {
  Company,
  SubscriptionTier,
  SubscriptionStatus,
} from '@/types/company'

interface PricingPlan {
  tier: SubscriptionTier
  name: string
  price: number
  priceYearly: number
  description: string
  features: string[]
  limits: {
    projects: number | 'Unlimited'
    members: number | 'Unlimited'
    storage: string
  }
  recommended?: boolean
}

interface InvoiceItem {
  id: string
  date: string
  description: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
}

const pricingPlans: PricingPlan[] = [
  {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    price: 0,
    priceYearly: 0,
    description: 'Perfect for getting started',
    features: [
      'Basic project management',
      'Up to 3 projects',
      'Up to 2 team members',
      'Email support',
    ],
    limits: {
      projects: 3,
      members: 2,
      storage: '1 GB',
    },
  },
  {
    tier: SubscriptionTier.BASIC,
    name: 'Starter',
    price: 9.99,
    priceYearly: 99.99,
    description: 'For small teams',
    features: [
      'Everything in Free',
      'Up to 10 projects',
      'Up to 5 team members',
      'Priority email support',
      'Basic analytics',
    ],
    limits: {
      projects: 10,
      members: 5,
      storage: '10 GB',
    },
  },
  {
    tier: SubscriptionTier.PRO,
    name: 'Professional',
    price: 19.99,
    priceYearly: 199.99,
    description: 'For growing businesses',
    features: [
      'Everything in Starter',
      'Unlimited projects',
      'Up to 25 team members',
      'Advanced analytics',
      'Custom workflows',
      'API access',
      'Phone support',
    ],
    limits: {
      projects: 'Unlimited',
      members: 25,
      storage: '100 GB',
    },
    recommended: true,
  },
  {
    tier: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    price: 49.99,
    priceYearly: 499.99,
    description: 'For large organizations',
    features: [
      'Everything in Professional',
      'Unlimited team members',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'SSO & SAML',
      'Audit logs',
      'Custom contract',
    ],
    limits: {
      projects: 'Unlimited',
      members: 'Unlimited',
      storage: 'Unlimited',
    },
  },
]

const subscriptionStatusColors: Record<SubscriptionStatus, { bg: string; text: string }> = {
  [SubscriptionStatus.ACTIVE]: { bg: 'bg-green-100', text: 'text-green-700' },
  [SubscriptionStatus.INACTIVE]: { bg: 'bg-gray-100', text: 'text-gray-700' },
  [SubscriptionStatus.TRIAL]: { bg: 'bg-blue-100', text: 'text-blue-700' },
  [SubscriptionStatus.CANCELLED]: { bg: 'bg-red-100', text: 'text-red-700' },
  [SubscriptionStatus.PAST_DUE]: { bg: 'bg-amber-100', text: 'text-amber-700' },
}

export default function BillingSubscription() {
  const navigate = useNavigate()
  const { companyId } = useParams<{ companyId: string }>()

  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [invoices] = useState<InvoiceItem[]>([])

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return

      try {
        const companyData = await getCompanyById(companyId)
        setCompany(companyData)
      } catch (error: any) {
        console.error('Error fetching company:', error)
        toast.error(error.message || 'Failed to load company data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompany()
  }, [companyId])

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setIsUpgrading(true)
    // In production, this would redirect to Stripe checkout or handle subscription change
    toast.info(`Upgrade to ${tier} plan - This would integrate with Stripe`)
    setTimeout(() => {
      setIsUpgrading(false)
    }, 1500)
  }

  const handleManagePaymentMethod = () => {
    // In production, this would open Stripe's customer portal
    toast.info('Manage payment method - This would open Stripe customer portal')
  }

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Downloading invoice ${invoiceId}...`)
  }

  const getCurrentPlan = () => {
    return pricingPlans.find((plan) => plan.tier === company?.subscription_tier) || pricingPlans[0]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading billing information...</p>
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
          <p className="text-muted-foreground mb-4">Unable to load billing information.</p>
          <Button onClick={() => navigate('/select-company')}>Select Company</Button>
        </div>
      </div>
    )
  }

  const currentPlan = getCurrentPlan()
  const statusColors = subscriptionStatusColors[company.subscription_status]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  Billing & Subscription
                </h1>
                <p className="text-muted-foreground text-sm">
                  Manage your subscription and payment methods
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Current Plan Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan
                  <Badge className={`${statusColors.bg} ${statusColors.text}`}>
                    {company.subscription_status.replace('_', ' ')}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  You are currently on the {currentPlan.name} plan
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  ${billingCycle === 'monthly' ? currentPlan.price : currentPlan.priceYearly}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </p>
                {company.subscription_tier !== SubscriptionTier.FREE && (
                  <p className="text-sm text-muted-foreground">
                    Next billing: {new Date().toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FolderKanban className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Projects</p>
                  <p className="font-semibold">{currentPlan.limits.projects}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="font-semibold">{currentPlan.limits.members}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Storage</p>
                  <p className="font-semibold">{currentPlan.limits.storage}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={handleManagePaymentMethod}>
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Payment Method
            </Button>
            {company.subscription_tier !== SubscriptionTier.FREE && (
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                Cancel Subscription
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Subscription Warning */}
        {company.subscription_status === SubscriptionStatus.PAST_DUE && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900">Payment Past Due</h3>
              <p className="text-sm text-amber-700">
                Your subscription payment is overdue. Please update your payment method to avoid service interruption.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-amber-600 text-amber-600 hover:bg-amber-100"
                onClick={handleManagePaymentMethod}
              >
                Update Payment Method
              </Button>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Available Plans</h2>
              <p className="text-muted-foreground text-sm">Choose the plan that best fits your needs</p>
            </div>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs">
                  2 months free
                </Badge>
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.tier}
                className={`relative ${
                  plan.recommended
                    ? 'border-primary shadow-lg'
                    : company.subscription_tier === plan.tier
                    ? 'border-green-500'
                    : ''
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Recommended
                    </Badge>
                  </div>
                )}
                {company.subscription_tier === plan.tier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      ${billingCycle === 'monthly' ? plan.price : plan.priceYearly}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {company.subscription_tier === plan.tier ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.recommended ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      {pricingPlans.findIndex((p) => p.tier === plan.tier) >
                      pricingPlans.findIndex((p) => p.tier === company.subscription_tier)
                        ? 'Upgrade'
                        : 'Downgrade'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Billing History
            </CardTitle>
            <CardDescription>View and download your past invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.date).toLocaleDateString()} - {invoice.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">${invoice.amount.toFixed(2)}</p>
                        <Badge
                          variant="outline"
                          className={
                            invoice.status === 'paid'
                              ? 'text-green-600'
                              : invoice.status === 'pending'
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No billing history yet</p>
              </div>
            )}
          </CardContent>
          {invoices.length > 0 && (
            <CardFooter className="border-t pt-4">
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                View All Invoices in Stripe
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                  VISA
                </div>
                <div>
                  <p className="font-medium">**** **** **** 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/25</p>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                Default
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button variant="outline" onClick={handleManagePaymentMethod}>
              <CreditCard className="w-4 h-4 mr-2" />
              Update Payment Method
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
