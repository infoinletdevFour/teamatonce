/**
 * Subscription Plans Page
 * Public page for viewing and selecting subscription plans
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanSelector } from '@/components/subscription/PlanSelector';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

export const Plans: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelectPlan = (planId: string, priceId: string, isYearly: boolean) => {
    if (!user) {
      // Redirect to signup with plan info in query params
      navigate(`/auth/signup?plan=${planId}&priceId=${priceId}&yearly=${isYearly}`);
      return;
    }

    // Navigate to checkout
    navigate('/subscription/checkout', {
      state: { planId, priceId, isYearly },
    });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12">
        <PlanSelector onSelectPlan={handleSelectPlan} />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>
            Need help choosing a plan?{' '}
            <a href="/help" className="text-blue-600 hover:underline font-medium">
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Plans;
