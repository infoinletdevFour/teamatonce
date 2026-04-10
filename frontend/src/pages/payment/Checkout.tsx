/**
 * Payment Checkout Page for Team@Once
 *
 * Secure checkout page for milestone payments using Stripe
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  Shield,
  Lock,
  Loader2,
  Calendar,
  FileText,
  Info,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { milestoneService } from '@/services/milestoneService'
import { getProject, getProjectMembers } from '@/services/projectService'
import { apiClient } from '@/lib/api-client'
import type { Milestone as MilestoneType } from '@/types/milestone'

// Load Stripe (use environment variable for the publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

interface InvoiceData {
  id: string
  invoiceNumber: string
  projectName: string
  milestoneName: string
  milestoneId: string
  description: string
  amount: number
  serviceFee: number
  total: number
  currency: string
  dueDate: string
  clientName: string
  developerName: string
}

// Stripe CardElement styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
}

// Inner checkout form component that uses Stripe hooks
interface CheckoutFormProps {
  invoice: InvoiceData
  onSuccess: () => void
}

function CheckoutForm({ invoice, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      toast.error('Payment system not loaded. Please refresh the page.')
      return
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms to continue')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      toast.error('Card element not found')
      return
    }

    setIsProcessing(true)
    setCardError(null)

    try {
      // Create a payment method using Stripe Elements
      const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (methodError) {
        setCardError(methodError.message || 'Card validation failed')
        setIsProcessing(false)
        return
      }

      // Fund the milestone via escrow endpoint
      const response = await apiClient.post('/escrow/fund-milestone', {
        milestoneId: invoice.milestoneId,
        paymentMethodId: paymentMethod.id,
        amount: invoice.total,
        currency: invoice.currency,
      })

      if (response.data.success) {
        toast.success('Payment successful! Funds are now held in escrow.')
        onSuccess()
      } else {
        throw new Error(response.data.message || 'Payment failed')
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Payment failed. Please try again.'
      toast.error(errorMessage)
      setCardError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete)
    setCardError(event.error ? event.error.message : null)
  }

  const isFormValid = cardComplete && agreedToTerms && !isProcessing

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Card Details</Label>
        <div className="mt-1.5 p-3 border rounded-md bg-white">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {cardError}
          </p>
        )}
      </div>

      <Separator className="my-6" />

      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={agreedToTerms}
          onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
        />
        <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
          I agree to the{' '}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{' '}
          and understand that this payment will be held in escrow until
          the milestone is approved.
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!isFormValid}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Pay {formatCurrency(invoice.total)}
          </>
        )}
      </Button>
    </form>
  )
}

export default function PaymentCheckout() {
  const navigate = useNavigate()
  const { companyId, projectId } = useParams()
  const [searchParams] = useSearchParams()
  const milestoneId = searchParams.get('milestone')

  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!companyId || !projectId || !milestoneId) {
        setError('Missing required parameters')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch milestone details
        const milestone: MilestoneType = await milestoneService.getMilestone(companyId, milestoneId)

        // Fetch project details
        let projectName = 'Project'
        let clientName = 'Client'
        let developerName = 'Developer'

        try {
          const project = await getProject(projectId)
          projectName = project.name || 'Project'
        } catch (err) {
          console.warn('Could not fetch project details:', err)
        }

        // Fetch project members
        try {
          const membersResponse = await getProjectMembers(projectId)
          const clientMember = membersResponse.members.find(m => m.memberType === 'client')
          const developerMember = membersResponse.members.find(m => m.memberType === 'developer')

          if (clientMember?.user) {
            clientName = clientMember.user.name || 'Client'
          }
          if (developerMember?.user) {
            developerName = developerMember.user.name || 'Developer'
          }
        } catch (err) {
          console.warn('Could not fetch project members:', err)
        }

        // Calculate service fee (5%)
        const amount = milestone.amount || 0
        const serviceFee = amount * 0.05
        const total = amount + serviceFee

        setInvoice({
          id: milestone.id,
          invoiceNumber: `INV-${milestone.id.slice(0, 8).toUpperCase()}`,
          projectName,
          milestoneName: milestone.title,
          milestoneId: milestone.id,
          description: milestone.description || `Payment for milestone: ${milestone.title}`,
          amount,
          serviceFee,
          total,
          currency: 'USD',
          dueDate: milestone.dueDate || new Date().toISOString(),
          clientName,
          developerName,
        })
      } catch (err: any) {
        console.error('Error fetching invoice data:', err)
        setError(err.response?.data?.message || 'Failed to load payment details')
        toast.error('Failed to load payment details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoiceData()
  }, [companyId, projectId, milestoneId])

  const handlePaymentSuccess = () => {
    navigate(`/company/${companyId}/project/${projectId}/payment/success?milestone=${milestoneId}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice?.currency || 'USD',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Checkout</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
          <p className="text-muted-foreground mb-4">
            Please select a milestone to pay for.
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  Secure Checkout
                </h1>
                <p className="text-muted-foreground text-sm">
                  Complete your payment securely
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>SSL Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>
                  Enter your card information to complete the payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    invoice={invoice}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900">Your payment is secure</h3>
                <p className="text-sm text-green-700">
                  Payments are processed securely by Stripe. Your card information is never stored on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{invoice.projectName}</p>
                  <p className="text-sm text-muted-foreground">{invoice.milestoneName}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Number</span>
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Developer</span>
                    <span className="font-medium">{invoice.developerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due Date
                    </span>
                    <span className="font-medium">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Milestone Amount</span>
                    <span>{formatCurrency(invoice.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Platform Fee (5%)
                      <Info className="w-3 h-3" />
                    </span>
                    <span>{formatCurrency(invoice.serviceFee)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(invoice.total)}</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Funds will be held securely in escrow until the milestone
                    is approved by you.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex-col space-y-2 text-center text-xs text-muted-foreground">
                <div className="flex items-center justify-center gap-4">
                  <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-6" />
                  <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-6" />
                  <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" className="h-6" />
                </div>
                <p>Powered by Stripe</p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
