/**
 * Subscription Status Component
 * Displays current subscription information and management options
 */

import React from 'react';
import { Calendar, CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SubscriptionStatusProps {
  subscription: {
    id: string;
    planName: string;
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    billingCycle: 'monthly' | 'yearly';
    amount: number;
    currency: string;
  };
  usage?: {
    teamMembers: { current: number; limit: number };
    projects: { current: number; limit: number | 'unlimited' };
    storage: { current: number; limit: number };
  };
  onUpgrade?: () => void;
  onDowngrade?: () => void;
  onCancel?: () => void;
  onResume?: () => void;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscription,
  usage,
  onUpgrade,
  onDowngrade,
  onCancel,
  onResume,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'trialing':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      case 'past_due':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5" />;
      case 'trialing':
        return <TrendingUp className="w-5 h-5" />;
      case 'past_due':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const calculateUsagePercentage = (current: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 0;
    return Math.min((current / limit) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Subscription Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{subscription.planName}</h3>
              <p className="text-blue-100 mt-1">
                {formatAmount(subscription.amount, subscription.currency)} /
                {subscription.billingCycle === 'yearly' ? 'year' : 'month'}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${getStatusColor(subscription.status)}`}>
              {getStatusIcon(subscription.status)}
              <span className="font-semibold capitalize">{subscription.status}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Billing Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Billing Date</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Billing Cycle</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {subscription.billingCycle}
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Warning */}
          {subscription.cancelAtPeriodEnd && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900">Subscription Ending</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Your subscription will end on {formatDate(subscription.currentPeriodEnd)}.
                    You will lose access to premium features after this date.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Usage Metrics */}
          {usage && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-4">Usage Overview</h4>
              <div className="space-y-4">
                {/* Team Members */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Team Members</span>
                    <span className="font-medium text-gray-900">
                      {usage.teamMembers.current} / {usage.teamMembers.limit}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{
                        width: `${calculateUsagePercentage(
                          usage.teamMembers.current,
                          usage.teamMembers.limit
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Projects */}
                {usage.projects.limit !== 'unlimited' && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Active Projects</span>
                      <span className="font-medium text-gray-900">
                        {usage.projects.current} / {usage.projects.limit}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{
                          width: `${calculateUsagePercentage(
                            usage.projects.current,
                            usage.projects.limit
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Storage */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Storage</span>
                    <span className="font-medium text-gray-900">
                      {usage.storage.current}GB / {usage.storage.limit}GB
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{
                        width: `${calculateUsagePercentage(
                          usage.storage.current,
                          usage.storage.limit
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-4 flex flex-wrap gap-3">
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <>
                {onUpgrade && (
                  <button
                    onClick={onUpgrade}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Upgrade Plan
                  </button>
                )}
                {onDowngrade && (
                  <button
                    onClick={onDowngrade}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Change Plan
                  </button>
                )}
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors ml-auto"
                  >
                    Cancel Subscription
                  </button>
                )}
              </>
            )}

            {subscription.cancelAtPeriodEnd && onResume && (
              <button
                onClick={onResume}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                Resume Subscription
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionStatus;
