/**
 * Stripe Payment Hook
 * Custom React hook for handling Stripe payment integration
 */

import { useState, useCallback } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { appConfig } from '@/config/app-config';
import { paymentService, PaymentResponseDto } from '@/services/paymentService';

// Initialize Stripe
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
  if (!stripePromise && appConfig.payment.stripe.publishableKey) {
    stripePromise = loadStripe(appConfig.payment.stripe.publishableKey);
  }
  return stripePromise;
};

interface UseStripePaymentResult {
  // State
  isLoading: boolean;
  error: string | null;
  paymentStatus: 'idle' | 'processing' | 'succeeded' | 'failed';

  // Methods
  initiatePayment: (paymentId: string) => Promise<void>;
  redirectToCheckout: (
    paymentId: string,
    successUrl?: string,
    cancelUrl?: string
  ) => Promise<void>;
  verifyPayment: (paymentId: string) => Promise<PaymentResponseDto | null>;
  handlePaymentReturn: (sessionId?: string) => Promise<void>;
  resetState: () => void;
}

/**
 * Custom hook for Stripe payment integration
 * @param companyId - The company ID for payment operations
 */
export const useStripePayment = (companyId: string): UseStripePaymentResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'processing' | 'succeeded' | 'failed'
  >('idle');

  /**
   * Reset state to initial values
   */
  const resetState = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setPaymentStatus('idle');
  }, []);

  /**
   * Initiate a payment (create payment intent)
   */
  const initiatePayment = useCallback(
    async (paymentId: string): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        setPaymentStatus('processing');

        // Check if Stripe is configured
        if (!appConfig.payment.stripe.enabled) {
          throw new Error('Stripe is not configured');
        }

        // Here you would typically create a payment intent on your backend
        // For now, we'll just update the payment status
        await paymentService.updatePayment(companyId, paymentId, {
          status: 'processing',
          paymentMethod: 'stripe',
        });

        setPaymentStatus('processing');
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Payment failed';
        setError(errorMessage);
        setPaymentStatus('failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId]
  );

  /**
   * Redirect to Stripe Checkout
   */
  const redirectToCheckout = useCallback(
    async (
      paymentId: string,
      successUrl?: string,
      cancelUrl?: string
    ): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        setPaymentStatus('processing');

        // Check if Stripe is configured
        if (!appConfig.payment.stripe.enabled) {
          throw new Error('Stripe is not configured');
        }

        // Get Stripe instance
        const stripe = await getStripe();
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }

        // Default URLs
        const defaultSuccessUrl = `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
        const defaultCancelUrl = `${window.location.origin}/payment/cancel`;

        // Create checkout session
        const session = await paymentService.createStripeCheckoutSession(
          companyId,
          paymentId,
          successUrl || defaultSuccessUrl,
          cancelUrl || defaultCancelUrl
        );

        // In newer versions of Stripe, use window.location instead of redirectToCheckout
        if (session.sessionId) {
          window.location.href = `https://checkout.stripe.com/c/pay/${session.sessionId}`;
        } else {
          throw new Error('No session ID returned from checkout session creation');
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to redirect to checkout';
        setError(errorMessage);
        setPaymentStatus('failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId]
  );

  /**
   * Verify payment status
   */
  const verifyPayment = useCallback(
    async (paymentId: string): Promise<PaymentResponseDto | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const payment = await paymentService.verifyStripePayment(companyId, paymentId);

        if (payment.status === 'completed') {
          setPaymentStatus('succeeded');
        } else if (payment.status === 'failed') {
          setPaymentStatus('failed');
          setError('Payment verification failed');
        } else {
          setPaymentStatus('processing');
        }

        return payment;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Payment verification failed';
        setError(errorMessage);
        setPaymentStatus('failed');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId]
  );

  /**
   * Handle return from Stripe Checkout
   * Call this on your success/cancel pages
   */
  const handlePaymentReturn = useCallback(async (sessionId?: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!sessionId) {
        // No session ID means payment was cancelled or failed
        setPaymentStatus('failed');
        setError('Payment was cancelled');
        return;
      }

      // Extract payment ID from session or query params
      const urlParams = new URLSearchParams(window.location.search);
      const paymentId = urlParams.get('payment_id');

      if (!paymentId) {
        throw new Error('Payment ID not found');
      }

      // Verify the payment
      await verifyPayment(paymentId);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to process payment return';
      setError(errorMessage);
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  }, [verifyPayment]);

  return {
    // State
    isLoading,
    error,
    paymentStatus,

    // Methods
    initiatePayment,
    redirectToCheckout,
    verifyPayment,
    handlePaymentReturn,
    resetState,
  };
};

/**
 * Helper hook for processing direct card payments
 * (if you want to use Stripe Elements instead of Checkout)
 * @param companyId - The company ID for payment operations
 */
export const useStripeElements = (companyId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processCardPayment = useCallback(
    async (paymentId: string, paymentMethodId: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        // Process the payment with the payment method
        await paymentService.processPayment(companyId, paymentId, {
          paymentMethod: 'stripe',
          metadata: {
            paymentMethodId,
          },
        });

        return true;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Card payment failed';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId]
  );

  return {
    isLoading,
    error,
    processCardPayment,
  };
};

export default useStripePayment;
