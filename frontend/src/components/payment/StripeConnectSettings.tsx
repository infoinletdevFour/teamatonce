import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  CreditCard,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Building2,
  Wallet,
  ArrowRight,
  RefreshCw,
  Shield,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { paymentService, StripeConnectStatus, StripeConnectBalance } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';

interface StripeConnectSettingsProps {
  onStatusChange?: (isOnboarded: boolean) => void;
}

type AccountState = 'loading' | 'no_account' | 'pending_onboarding' | 'onboarded' | 'error';

const StripeConnectSettings: React.FC<StripeConnectSettingsProps> = ({ onStatusChange }) => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [accountState, setAccountState] = useState<AccountState>('loading');
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [balance, setBalance] = useState<StripeConnectBalance | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load account status on mount
  useEffect(() => {
    loadAccountStatus();
  }, []);

  const loadAccountStatus = async () => {
    setAccountState('loading');
    setError(null);

    try {
      const accountStatus = await paymentService.getConnectAccountStatus();
      setStatus(accountStatus);

      if (accountStatus.isOnboarded) {
        setAccountState('onboarded');
        onStatusChange?.(true);
        // Load balance for onboarded accounts
        try {
          const balanceData = await paymentService.getConnectBalance();
          setBalance(balanceData);
        } catch (balanceError) {
          console.error('Failed to load balance:', balanceError);
        }
      } else {
        setAccountState('pending_onboarding');
        onStatusChange?.(false);
      }
    } catch (err: any) {
      // 404 means no account exists yet
      if (err.response?.status === 404 || err.message?.includes('not found')) {
        setAccountState('no_account');
        onStatusChange?.(false);
      } else {
        setAccountState('error');
        setError(err.message || 'Failed to load account status');
      }
    }
  };

  const handleCreateAccount = async () => {
    if (!user?.email) {
      toast.error('User email not found');
      return;
    }

    setIsCreating(true);
    try {
      await paymentService.createConnectAccount({
        email: user.email,
        country: 'US',
        businessType: 'individual',
      });
      toast.success('Stripe Connect account created! Complete onboarding to receive payments.');
      await loadAccountStatus();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartOnboarding = async () => {
    setIsLoadingLink(true);
    try {
      // Save company ID for callback redirect
      if (company?.id) {
        localStorage.setItem('lastCompanyId', company.id);
      }
      const { url } = await paymentService.getConnectOnboardingLink();
      // Redirect to Stripe onboarding
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || 'Failed to get onboarding link');
    } finally {
      setIsLoadingLink(false);
    }
  };

  const handleOpenDashboard = async () => {
    setIsLoadingLink(true);
    try {
      const { url } = await paymentService.getConnectDashboardLink();
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error(err.message || 'Failed to open dashboard');
    } finally {
      setIsLoadingLink(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  };

  const getTotalBalance = (balanceArray: Array<{ amount: number; currency: string }> | undefined) => {
    if (!balanceArray || balanceArray.length === 0) return '$0.00';
    const total = balanceArray.reduce((sum, b) => sum + b.amount, 0);
    return formatCurrency(total, balanceArray[0]?.currency || 'usd');
  };

  // Loading state
  if (accountState === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading payment settings...</span>
      </div>
    );
  }

  // Error state
  if (accountState === 'error') {
    return (
      <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900">Error Loading Payment Settings</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={loadAccountStatus}
              className="mt-3 flex items-center space-x-2 text-red-700 hover:text-red-900 font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No account - show setup prompt
  if (accountState === 'no_account') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Set Up Payment Receiving</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Connect your Stripe account to receive payments from clients directly into your bank account.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">Secure Payouts</h4>
              <p className="text-sm text-gray-600">Bank-level security</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">Fast Transfers</h4>
              <p className="text-sm text-gray-600">1-2 business days</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">Low Fees</h4>
              <p className="text-sm text-gray-600">Competitive rates</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateAccount}
            disabled={isCreating}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Set Up Stripe Connect</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // Pending onboarding - account exists but not fully verified
  if (accountState === 'pending_onboarding') {
    return (
      <div className="space-y-6">
        {/* Status Banner */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Complete Your Account Setup</h3>
              <p className="text-gray-600 mb-4">
                Your Stripe Connect account has been created, but you need to complete the onboarding process to receive payments.
              </p>

              {/* Requirements */}
              {status?.currentlyDue && status.currentlyDue.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Required Information:</h4>
                  <ul className="space-y-1">
                    {status.currentlyDue.slice(0, 5).map((item, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                        <span>{item.replace(/_/g, ' ').replace(/\./g, ' > ')}</span>
                      </li>
                    ))}
                    {status.currentlyDue.length > 5 && (
                      <li className="text-sm text-gray-500">
                        +{status.currentlyDue.length - 5} more items
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartOnboarding}
                disabled={isLoadingLink}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
              >
                {isLoadingLink ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-5 h-5" />
                    <span>Complete Onboarding</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Status Details */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">Account Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                {status?.detailsSubmitted ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-semibold text-gray-700">Details</span>
              </div>
              <p className="text-sm text-gray-600">
                {status?.detailsSubmitted ? 'Submitted' : 'Pending'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                {status?.chargesEnabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-semibold text-gray-700">Charges</span>
              </div>
              <p className="text-sm text-gray-600">
                {status?.chargesEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                {status?.payoutsEnabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-semibold text-gray-700">Payouts</span>
              </div>
              <p className="text-sm text-gray-600">
                {status?.payoutsEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">Country</span>
              </div>
              <p className="text-sm text-gray-600">{status?.country || 'US'}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={loadAccountStatus}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>
    );
  }

  // Fully onboarded - show balance and dashboard access
  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-green-900">Payment Account Active</h3>
            <p className="text-sm text-green-700">You can receive payments from clients</p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-1">
              <Wallet className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">Available Balance</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {getTotalBalance(balance?.available)}
            </p>
            <p className="text-xs text-gray-500">Ready to pay out</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Pending Balance</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {getTotalBalance(balance?.pending)}
            </p>
            <p className="text-xs text-gray-500">Processing</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenDashboard}
            disabled={isLoadingLink}
            className="inline-flex items-center space-x-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold disabled:opacity-50"
          >
            {isLoadingLink ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ExternalLink className="w-5 h-5" />
            )}
            <span>Open Stripe Dashboard</span>
          </motion.button>
          <button
            onClick={loadAccountStatus}
            className="inline-flex items-center space-x-2 text-green-700 hover:text-green-900 px-4 py-2.5 font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4">Account Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="text-sm font-semibold text-gray-700">Account ID</span>
            <p className="text-sm text-gray-600 font-mono mt-1">
              {status?.accountId?.substring(0, 12)}...
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="text-sm font-semibold text-gray-700">Email</span>
            <p className="text-sm text-gray-600 mt-1 truncate">{status?.email}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="text-sm font-semibold text-gray-700">Country</span>
            <p className="text-sm text-gray-600 mt-1">{status?.country}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="text-sm font-semibold text-gray-700">Currency</span>
            <p className="text-sm text-gray-600 mt-1 uppercase">{status?.defaultCurrency || 'USD'}</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Powered by Stripe</h4>
            <p className="text-sm text-blue-700">
              Your payments are processed securely through Stripe. Payouts are typically sent within 1-2 business days.
              You can manage your bank accounts, view transaction history, and handle tax documents directly in the Stripe Dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeConnectSettings;
