/**
 * Payment Success Page for Team@Once
 *
 * Displayed after a successful payment
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { CheckCircle, ArrowRight, Download, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import confetti from 'canvas-confetti'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const { companyId, projectId } = useParams()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)

  // Get payment details from URL params
  const paymentIntentId = searchParams.get('payment_intent')
  const amount = searchParams.get('amount')
  const milestoneName = searchParams.get('milestone')

  useEffect(() => {
    // Celebrate with confetti
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2,
        },
        colors: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'],
      })

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2,
        },
        colors: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'],
      })
    }, 250)

    // Simulate loading
    setTimeout(() => setIsLoading(false), 1500)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Processing your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full shadow-2xl border-0">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment has been processed successfully.
          </p>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            {amount && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">Amount Paid</span>
                <span className="text-xl font-bold text-gray-900">
                  ${(parseInt(amount) / 100).toFixed(2)}
                </span>
              </div>
            )}
            {milestoneName && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">Milestone</span>
                <span className="font-medium text-gray-900">{milestoneName}</span>
              </div>
            )}
            {paymentIntentId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono text-sm text-gray-500">
                  {paymentIntentId.slice(0, 20)}...
                </span>
              </div>
            )}
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Payment confirmation email sent to your inbox</li>
              <li>• Funds released to the developer upon milestone approval</li>
              <li>• Invoice available in your payment history</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate(`/company/${companyId}/project/${projectId}/contract-payment`)}
              className="w-full"
              size="lg"
            >
              View Project Payments
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/company/${companyId}/project/${projectId}/payment/dashboard`)}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Payment History
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
