/**
 * Manage Subscription Page
 * Allows users to manage their subscription, payment methods, and view billing history
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { BillingHistory } from '@/components/subscription/BillingHistory';
import { PaymentMethodForm } from '@/components/subscription/PaymentMethodForm';
import { paymentService } from '@/services/paymentService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const Manage: React.FC = () => {
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subData, paymentMethodsData] = await Promise.all([
        paymentService.getSubscription(),
        paymentService.getPaymentMethods(),
      ]);

      setSubscription(subData);
      setPaymentMethods(paymentMethodsData);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/subscription/plans', {
      state: { currentPlan: subscription?.planName },
    });
  };

  const handleCancelSubscription = async () => {
    try {
      setActionLoading(true);
      await paymentService.cancelSubscription();

      toast.success('Subscription cancelled successfully');
      setShowCancelDialog(false);
      await loadSubscriptionData();
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setActionLoading(true);
      await paymentService.resumeSubscription();

      toast.success('Subscription resumed successfully');
      await loadSubscriptionData();
    } catch (error: any) {
      console.error('Failed to resume subscription:', error);
      toast.error(error.message || 'Failed to resume subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    setShowAddPaymentMethod(false);
    await loadSubscriptionData();
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      await paymentService.removePaymentMethod(paymentMethodId);
      toast.success('Payment method removed');
      await loadSubscriptionData();
    } catch (error: any) {
      console.error('Failed to remove payment method:', error);
      toast.error(error.message || 'Failed to remove payment method');
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      await paymentService.setDefaultPaymentMethod(paymentMethodId);
      toast.success('Default payment method updated');
      await loadSubscriptionData();
    } catch (error: any) {
      console.error('Failed to set default payment method:', error);
      toast.error(error.message || 'Failed to update default payment method');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Active Subscription
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have an active subscription. Choose a plan to get started.
          </p>
          <button
            onClick={() => navigate('/subscription/plans')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Manage Subscription
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscription Status */}
            <SubscriptionStatus
              subscription={subscription}
              usage={{
                teamMembers: { current: 3, limit: 5 },
                projects: { current: 7, limit: 10 },
                storage: { current: 4.5, limit: 10 },
              }}
              onUpgrade={handleUpgrade}
              onDowngrade={handleUpgrade}
              onCancel={() => setShowCancelDialog(true)}
              onResume={handleResumeSubscription}
            />

            {/* Billing History */}
            <BillingHistory limit={10} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Methods
                </h3>
                <button
                  onClick={() => setShowAddPaymentMethod(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {paymentMethods.length === 0 ? (
                  <p className="text-sm text-gray-600 text-center py-4">
                    No payment methods added
                  </p>
                ) : (
                  paymentMethods.map((method, index) => (
                    <motion.div
                      key={method.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            •••• {method.last4}
                          </p>
                          <p className="text-xs text-gray-600">
                            Expires {method.expMonth}/{method.expYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault ? (
                          <span className="text-xs text-blue-600 font-semibold">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                            className="text-xs text-gray-600 hover:text-blue-600"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemovePaymentMethod(method.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-800 mb-4">
                Our support team is here to assist you with any questions.
              </p>
              <a
                href="/help"
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddPaymentMethod} onOpenChange={setShowAddPaymentMethod}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <PaymentMethodForm
            onSuccess={handleAddPaymentMethod}
            onCancel={() => setShowAddPaymentMethod(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Before you cancel:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You'll lose access to all premium features</li>
                    <li>Your data will be retained for 30 days</li>
                    <li>You can reactivate anytime before period ends</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Manage;
