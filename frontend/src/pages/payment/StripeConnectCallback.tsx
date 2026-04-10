import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const StripeConnectCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your Stripe Connect setup...');

  useEffect(() => {
    // Get the company ID from localStorage or session
    const lastCompanyId = localStorage.getItem('lastCompanyId');

    // Check for success or refresh params from Stripe
    const isRefresh = window.location.pathname.includes('refresh');

    if (isRefresh) {
      // User clicked "refresh" from Stripe - they need to restart onboarding
      setStatus('error');
      setMessage('Your onboarding session expired. Please try again.');

      setTimeout(() => {
        if (lastCompanyId) {
          navigate(`/company/${lastCompanyId}/seller/settings`);
        } else {
          navigate('/select-company');
        }
      }, 2000);
    } else {
      // Success - user completed onboarding
      setStatus('success');
      setMessage('Stripe Connect setup complete! Redirecting to settings...');

      setTimeout(() => {
        if (lastCompanyId) {
          navigate(`/company/${lastCompanyId}/seller/settings`);
        } else {
          navigate('/select-company');
        }
      }, 2000);
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Processing</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Success!</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Session Expired</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default StripeConnectCallback;
