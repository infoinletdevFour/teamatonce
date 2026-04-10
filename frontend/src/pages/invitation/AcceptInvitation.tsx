/**
 * Accept Invitation Page
 * Handles accepting team invitations to join a company
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyStore } from '@/stores/companyStore';
import {
  getInvitationByToken,
  acceptInvitation,
  isInvitationExpired,
  getTimeRemaining,
} from '@/services/invitationService';
import { InvitationDetails } from '@/types/invitation';
import { Mail, Building2, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

const AcceptInvitation: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { fetchUserCompanies } = useCompanyStore();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get token from URL params or search params
  const invitationToken = token || searchParams.get('token') || '';

  // Load invitation details function
  const loadInvitationDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const invitationData = await getInvitationByToken(invitationToken);
      setInvitation(invitationData);

      // Check if invitation email matches user email
      if (user && invitationData.email.toLowerCase() !== user.email.toLowerCase()) {
        setError(
          `This invitation was sent to ${invitationData.email}, but you are logged in as ${user.email}. Please log out and sign in with the correct email.`
        );
      }

      // Check if already accepted
      if (invitationData.status === 'accepted') {
        setError('This invitation has already been accepted.');
      }

      // Check if revoked
      if (invitationData.status === 'revoked') {
        setError('This invitation has been cancelled by the sender.');
      }

      // Check if expired
      if (isInvitationExpired(invitationData.expires_at)) {
        setError('This invitation has expired.');
      }
    } catch (err: any) {
      console.error('Failed to load invitation:', err);
      setError(err.message || 'Failed to load invitation details. The link may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If not authenticated and has token, store it and redirect to login
    if (!authLoading && !isAuthenticated && invitationToken) {
      localStorage.setItem('pending_invitation_token', invitationToken);
      navigate(`/auth/login?invitation=${invitationToken}`);
      return;
    }

    // If authenticated, load invitation details
    if (isAuthenticated && invitationToken) {
      loadInvitationDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, invitationToken]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    try {
      setIsAccepting(true);

      // Accept the invitation
      await acceptInvitation({ token: invitationToken });

      // Clear pending invitation from localStorage
      localStorage.removeItem('pending_invitation_token');

      // Refresh user's companies
      await fetchUserCompanies();

      toast.success('Successfully joined the team!');

      // Redirect to company dashboard based on user role
      const section = user.role === 'developer' ? 'developer' : 'client';
      const companyId = invitation.company?.id || invitation.company_id;
      navigate(`/company/${companyId}/${section}/dashboard`, { replace: true });
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      toast.error(err.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    localStorage.removeItem('pending_invitation_token');
    navigate('/auth/login');
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/auth/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // No invitation loaded
  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">No Invitation Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find an invitation with this link. Please check your email for the correct invitation link.
          </p>
          <button
            onClick={() => navigate('/auth/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Success - show invitation details
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Invitation</h1>
          <p className="text-gray-600">You've been invited to join a team on Team@Once</p>
        </div>

        {/* Invitation Details */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-4">
          {/* Company */}
          <div className="flex items-start space-x-3">
            <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Company</p>
              <p className="text-lg font-semibold text-gray-900">
                {invitation.company?.name || invitation.company_display_name || invitation.company_name}
              </p>
              {invitation.company?.description && (
                <p className="text-sm text-gray-600 mt-1">{invitation.company.description}</p>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="flex items-start space-x-3">
            <Users className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Role</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{invitation.role}</p>
            </div>
          </div>

          {/* Invited By */}
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Invited by</p>
              <p className="text-lg font-semibold text-gray-900">{invitation.invited_by_name}</p>
            </div>
          </div>

          {/* Expiration */}
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Expires</p>
              <p className="text-lg font-semibold text-gray-900">
                {getTimeRemaining(invitation.expires_at)}
              </p>
            </div>
          </div>

          {/* Custom Message */}
          {invitation.message && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-2">Message from {invitation.invited_by_name}</p>
              <p className="text-gray-700 italic">"{invitation.message}"</p>
            </div>
          )}

          {/* Skills (if any) */}
          {invitation.initial_skills && invitation.initial_skills.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {invitation.initial_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleDecline}
            disabled={isAccepting}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Decline
          </button>
          <button
            onClick={handleAcceptInvitation}
            disabled={isAccepting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isAccepting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Accepting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Accept Invitation</span>
              </>
            )}
          </button>
        </div>

        {/* User Info Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Logged in as <span className="font-medium text-gray-700">{user?.email}</span>
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('pending_invitation_token');
              navigate('/auth/login');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
          >
            Not you? Switch account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
