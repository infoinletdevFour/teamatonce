/**
 * Stripe Context Provider
 * Provides Stripe Elements context to the application
 */

import React, { createContext, useContext, useMemo } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

interface StripeContextType {
  stripe: Promise<Stripe | null>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Load Stripe with publishable key from environment
  const stripePromise = useMemo(() => {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.warn('Stripe publishable key not found in environment variables');
      return Promise.resolve(null);
    }

    return loadStripe(publishableKey);
  }, []);

  const contextValue: StripeContextType = {
    stripe: stripePromise,
  };

  // Elements options for customizing Stripe Elements appearance
  const elementsOptions = {
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <StripeContext.Provider value={contextValue}>
      <Elements stripe={stripePromise} options={elementsOptions}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
};

/**
 * Hook to access Stripe context
 */
export const useStripe = (): StripeContextType => {
  const context = useContext(StripeContext);

  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }

  return context;
};

export default StripeProvider;
