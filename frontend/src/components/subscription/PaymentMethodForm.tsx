/**
 * Payment Method Form Component
 * Stripe card element form for adding payment methods
 */

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { paymentService } from '@/services/paymentService';

interface PaymentMethodFormProps {
  onSuccess?: (paymentMethodId: string) => void;
  onCancel?: () => void;
  submitButtonText?: string;
  showCancelButton?: boolean;
}

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  onSuccess,
  onCancel,
  submitButtonText = 'Add Payment Method',
  showCancelButton = true,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
        iconColor: '#3b82f6',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: false,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Stripe has not loaded yet');
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      toast.error('Card element not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment method with Stripe
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Send payment method to backend
      await paymentService.addPaymentMethod(paymentMethod.id);

      toast.success('Payment method added successfully');

      // Call success callback
      if (onSuccess) {
        onSuccess(paymentMethod.id);
      }

      // Clear the card element
      cardElement.clear();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add payment method';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (event: any) => {
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 p-3 rounded-lg">
          <CreditCard className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Add Payment Method</h3>
          <p className="text-sm text-gray-600">Enter your card details below</p>
        </div>
      </div>

      {/* Card Element */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Card Information
        </label>
        <div
          className="border border-gray-300 rounded-lg p-4 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all relative"
          style={{ isolation: 'isolate' }}
        >
          {!cardReady && (
            <div className="text-sm text-gray-500 mb-2">Loading card input...</div>
          )}
          <CardElement
            options={cardElementOptions}
            onChange={handleCardChange}
            onReady={() => {
              console.log('[PaymentMethodForm] CardElement is ready');
              setCardReady(true);
            }}
          />
        </div>
        {!stripe && (
          <p className="text-sm text-yellow-600 flex items-center gap-1">
            <span className="font-medium">Warning:</span> Stripe is not loaded. Check your VITE_STRIPE_PUBLISHABLE_KEY environment variable.
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <span className="font-medium">Error:</span> {error}
          </p>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <p className="text-sm text-gray-700 font-medium">Secure Payment</p>
            <p className="text-xs text-gray-600 mt-1">
              Your payment information is encrypted and securely processed by Stripe.
              We never store your card details.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>{submitButtonText}</span>
            </>
          )}
        </button>

        {showCancelButton && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Stripe Badge */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Powered by{' '}
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            Stripe
          </a>
        </p>
      </div>
    </form>
  );
};

export default PaymentMethodForm;
