/**
 * Plan Selector Component
 * Displays available subscription plans with pricing and features
 */

import React, { useState, useEffect } from 'react';
import { Check, Zap, Building2, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { paymentService } from '@/services/paymentService';

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  features: string[];
  recommended?: boolean;
  icon: React.ReactNode;
  buttonText: string;
}

const defaultPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams starting out',
    priceMonthly: 9.99,
    priceYearly: 99.99,
    features: [
      'Up to 5 team members',
      '10 active projects',
      'Basic support',
      '10GB storage',
      'Email notifications',
    ],
    icon: <Zap className="w-8 h-8" />,
    buttonText: 'Get Started',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing teams with advanced needs',
    priceMonthly: 19.99,
    priceYearly: 199.99,
    features: [
      'Up to 20 team members',
      'Unlimited projects',
      'Priority support',
      '100GB storage',
      'Advanced analytics',
      'Custom integrations',
      'Video conferencing',
    ],
    recommended: true,
    icon: <Rocket className="w-8 h-8" />,
    buttonText: 'Start Free Trial',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom requirements',
    priceMonthly: 49.99,
    priceYearly: 499.99,
    features: [
      'Unlimited team members',
      'Unlimited projects',
      '24/7 dedicated support',
      'Unlimited storage',
      'Custom analytics',
      'Advanced security',
      'White-label options',
      'SLA guarantee',
      'Custom contracts',
    ],
    icon: <Building2 className="w-8 h-8" />,
    buttonText: 'Select Plan',
  },
];

interface PlanSelectorProps {
  onSelectPlan?: (planId: string, priceId: string, isYearly: boolean) => void;
  currentPlanId?: string;
  showCurrentPlan?: boolean;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  onSelectPlan,
  currentPlanId,
  showCurrentPlan = true,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const fetchedPlans = await paymentService.getPlans();

      if (fetchedPlans && fetchedPlans.length > 0) {
        // Map backend plans to frontend structure
        const mappedPlans = fetchedPlans.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          stripePriceIdMonthly: plan.stripePriceIdMonthly,
          stripePriceIdYearly: plan.stripePriceIdYearly,
          features: plan.features || [],
          recommended: plan.recommended,
          icon: getIconForPlan(plan.name),
          buttonText: plan.buttonText || 'Select Plan',
        }));
        setPlans(mappedPlans);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      // Use default plans on error
    } finally {
      setLoading(false);
    }
  };

  const getIconForPlan = (name: string) => {
    if (name.toLowerCase().includes('enterprise')) return <Building2 className="w-8 h-8" />;
    if (name.toLowerCase().includes('pro')) return <Rocket className="w-8 h-8" />;
    return <Zap className="w-8 h-8" />;
  };

  const handleSelectPlan = (plan: Plan) => {
    if (!onSelectPlan) {
      toast.info('Please sign in to select a plan');
      return;
    }

    const priceId = billingCycle === 'yearly'
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly;

    if (!priceId) {
      toast.error('Price ID not available for this plan');
      return;
    }

    onSelectPlan(plan.id, priceId, billingCycle === 'yearly');
  };

  const calculateSavings = (monthly: number, yearly: number) => {
    const monthlyTotal = monthly * 12;
    const savings = monthlyTotal - yearly;
    const savingsPercent = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percent: savingsPercent };
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-xl text-gray-600">
          Select the perfect plan for your team's needs
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center items-center gap-4 mb-12">
        <span className={`text-lg ${billingCycle === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          className="relative inline-flex h-8 w-14 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-lg ${billingCycle === 'yearly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
          Yearly
          {billingCycle === 'yearly' && (
            <span className="ml-2 text-sm text-green-600 font-medium">
              2 months free
            </span>
          )}
        </span>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const savings = calculateSavings(plan.priceMonthly, plan.priceYearly);
            const isCurrentPlan = showCurrentPlan && currentPlanId === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  plan.recommended ? 'border-2 border-blue-600 scale-105' : 'border border-gray-200'
                }`}
              >
                {/* Recommended Badge */}
                {plan.recommended && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Recommended
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 bg-green-600 text-white px-4 py-1 text-sm font-semibold rounded-br-lg">
                    Current Plan
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className="text-blue-600 mb-4">{plan.icon}</div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900">${price}</span>
                      <span className="text-gray-600 ml-2">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && savings.percent > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        Save ${savings.amount}/year ({savings.percent}% off)
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      plan.recommended
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : isCurrentPlan
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.buttonText}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center text-gray-600">
        <p>
          All plans include a 14-day free trial. No credit card required.
        </p>
        <p className="mt-2">
          Questions? <a href="/help" className="text-blue-600 hover:underline">Contact our sales team</a>
        </p>
      </div>
    </div>
  );
};

export default PlanSelector;
