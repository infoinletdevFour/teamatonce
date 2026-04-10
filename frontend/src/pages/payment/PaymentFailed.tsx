/**
 * Payment Failed Page for Team@Once
 *
 * Displayed when a payment fails
 */

import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { XCircle, RefreshCw, HelpCircle, ArrowLeft, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function PaymentFailed() {
  const navigate = useNavigate()
  const { companyId, projectId } = useParams()
  const [searchParams] = useSearchParams()

  // Get error details from URL params
  const errorCode = searchParams.get('error_code')
  const errorMessage = searchParams.get('error_message')
  const invoiceId = searchParams.get('invoice_id')

  // Common error messages
  const getErrorDetails = (code: string | null) => {
    switch (code) {
      case 'card_declined':
        return {
          title: 'Card Declined',
          description: 'Your card was declined. Please try a different payment method.',
        }
      case 'insufficient_funds':
        return {
          title: 'Insufficient Funds',
          description: 'Your card has insufficient funds. Please try a different card.',
        }
      case 'expired_card':
        return {
          title: 'Card Expired',
          description: 'Your card has expired. Please update your payment method.',
        }
      case 'incorrect_cvc':
        return {
          title: 'Invalid CVC',
          description: 'The CVC code is incorrect. Please check and try again.',
        }
      case 'processing_error':
        return {
          title: 'Processing Error',
          description: 'There was an error processing your payment. Please try again.',
        }
      default:
        return {
          title: 'Payment Failed',
          description: errorMessage || 'We were unable to process your payment. Please try again.',
        }
    }
  }

  const error = getErrorDetails(errorCode)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full shadow-2xl border-0">
        <CardContent className="p-8 text-center">
          {/* Failed Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {error.title}
          </h1>
          <p className="text-gray-600 mb-6">
            {error.description}
          </p>

          {/* Error Details */}
          {errorCode && (
            <div className="bg-red-50 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Error Code: {errorCode}</h3>
                  <p className="text-sm text-red-700">
                    If this issue persists, please contact support with this error code.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Common Solutions */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Try these solutions:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Check your card details and try again
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Use a different payment method
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Contact your bank if the issue persists
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Reach out to our support team for assistance
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => {
                if (invoiceId) {
                  navigate(`/company/${companyId}/project/${projectId}/payment/checkout/${invoiceId}`)
                } else {
                  navigate(`/company/${companyId}/project/${projectId}/contract-payment`)
                }
              }}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/company/${companyId}/project/${projectId}/dashboard`)}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/help')}
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
