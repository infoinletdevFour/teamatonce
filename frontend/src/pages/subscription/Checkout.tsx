/**
 * Subscription Checkout Page
 * Handles subscription payment and setup
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Loader } from 'lucide-react';
import { PaymentMethodForm } from '@/components/subscription/PaymentMethodForm';
import { paymentService } from '@/services/paymentService';

interface CheckoutState {
  planId: string;
  priceId: string;
  isYearly: boolean;
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as CheckoutState;
  const [loading, setLoading] = useState(false);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [step, setStep] = useState<'payment' | 'processing' | 'success'>('payment');

  useEffect(() => {
    if (!state?.planId || !state?.priceId) {
      toast.error('Invalid checkout session');
      navigate('/subscription/plans');
      return;
    }

    loadPlanDetails();
  }, [state]);

  const loadPlanDetails = async () => {
    try {
      const plans = await paymentService.getPlans();
      const plan = plans.find((p: any) => p.id === state.planId);

      if (plan) {
        setPlanDetails(plan);
      }
    } catch (error) {
      console.error('Failed to load plan details:', error);
    }
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    try {
      setLoading(true);
      setStep('processing');

      // Create subscription with payment method
      await paymentService.createSubscription(
        state.priceId,
        paymentMethodId
      );

      setStep('success');
      toast.success('Subscription activated successfully!');

      // Redirect to manage page after 2 seconds
      setTimeout(() => {
        navigate('/subscription/manage');
      }, 2000);
    } catch (error: any) {
      console.error('Subscription creation failed:', error);
      toast.error(error.message || 'Failed to create subscription');
      setStep('payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/subscription/plans');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!state?.planId || !state?.priceId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Plans</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              {planDetails ? (
                <>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {planDetails.name} Plan
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {planDetails.description}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Plan</span>
                      <span className="font-medium text-gray-900">
                        {planDetails.name}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Billing Cycle</span>
                      <span className="font-medium text-gray-900">
                        {state.isYearly ? 'Yearly' : 'Monthly'}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t border-gray-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">
                        {formatAmount(
                          state.isYearly ? planDetails.priceYearly : planDetails.priceMonthly
                        )}
                        /{state.isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                  </div>

                  {state.isYearly && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        You're saving{' '}
                        <span className="font-semibold">
                          {formatAmount(
                            planDetails.priceMonthly * 12 - planDetails.priceYearly
                          )}
                        </span>{' '}
                        with yearly billing!
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      What's included:
                    </h4>
                    <ul className="space-y-2">
                      {planDetails.features?.slice(0, 5).map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="flex justify-center py-8">
                  <Loader className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              )}
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Details</h2>

            {step === 'payment' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <PaymentMethodForm
                  onSuccess={handlePaymentSuccess}
                  onCancel={handleCancel}
                  submitButtonText="Subscribe Now"
                  showCancelButton={true}
                />
              </div>
            )}

            {step === 'processing' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Loader className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processing Your Subscription
                </h3>
                <p className="text-gray-600">
                  Please wait while we set up your account...
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Subscription Activated!
                </h3>
                <p className="text-gray-600 mb-4">
                  Welcome to {planDetails?.name}. Redirecting you to your dashboard...
                </p>
              </div>
            )}

            {/* Trust Badges */}
            {step === 'payment' && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>14-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Secure payment via Stripe</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
