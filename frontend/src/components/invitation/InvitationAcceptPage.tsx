/**
 * Invitation Accept Page Component
 * Public page for accepting team invitations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  User,
  Shield,
  Code,
  Palette,
  Bug,
  Crown,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  isInvitationExpired,
  getTimeRemaining,
} from '@/services/invitationService';
import { InvitationDetails, TeamRole } from '@/types/invitation';

const InvitationAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getInvitationByToken(token);
      setInvitation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;

    try {
      setProcessing(true);
      setError(null);
      await acceptInvitation({ token });
      setSuccess(true);

      // Redirect to login or dashboard after 3 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: 'Invitation accepted! Please log in to continue.' } });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to decline this invitation?')) return;

    try {
      setProcessing(true);
      setError(null);
      await declineInvitation(token);
      setDeclined(true);
    } catch (err: any) {
      setError(err.message || 'Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return Crown;
      case 'admin':
        return Shield;
      case 'designer':
        return Palette;
      case 'qa':
        return Bug;
      case 'developer':
      default:
        return Code;
    }
  };

  const getRoleColor = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return 'from-yellow-500 to-orange-500';
      case 'admin':
        return 'from-indigo-500 to-purple-500';
      case 'designer':
        return 'from-pink-500 to-rose-500';
      case 'qa':
        return 'from-green-500 to-emerald-500';
      case 'developer':
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  const getRoleLabel = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      case 'designer':
        return 'Designer';
      case 'qa':
        return 'QA Engineer';
      case 'developer':
      default:
        return 'Developer';
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-600 font-semibold">Loading invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Invalid Invitation</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Go to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success State
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Invitation Accepted!
            </h2>
            <p className="text-gray-600">
              You have successfully joined <strong>{invitation?.company_display_name}</strong>.
            </p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Declined State
  if (declined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Invitation Declined</h2>
            <p className="text-gray-600">
              You have declined the invitation to join <strong>{invitation?.company_display_name}</strong>.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Go to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!invitation) return null;

  const expired = isInvitationExpired(invitation.expires_at);
  const RoleIcon = getRoleIcon(invitation.role);

  // Expired Invitation
  if (expired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Invitation Expired</h2>
            <p className="text-gray-600">
              This invitation to join <strong>{invitation.company_display_name}</strong> has expired.
            </p>
            <p className="text-sm text-gray-500">
              Please contact the team administrator for a new invitation.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Go to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Invitation View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Team Invitation
          </h1>
          <p className="text-gray-600">You've been invited to join a team!</p>
        </div>

        {/* Company Info */}
        {invitation.company && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">{invitation.company_display_name}</h2>
                {invitation.company.description && (
                  <p className="text-sm text-gray-600">{invitation.company.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invitation Details */}
        <div className="space-y-4 mb-6">
          {/* Role */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="text-sm font-semibold text-gray-600">Your Role</span>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getRoleColor(invitation.role)} flex items-center justify-center`}>
                <RoleIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">{getRoleLabel(invitation.role)}</span>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="text-sm font-semibold text-gray-600">Email</span>
            <span className="font-bold text-gray-900">{invitation.email}</span>
          </div>

          {/* Invited By */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="text-sm font-semibold text-gray-600">Invited By</span>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-bold text-gray-900">{invitation.invited_by_name}</span>
            </div>
          </div>

          {/* Expiration */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <span className="text-sm font-semibold text-yellow-700">Expires In</span>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-yellow-700">{getTimeRemaining(invitation.expires_at)}</span>
            </div>
          </div>

          {/* Skills */}
          {invitation.initial_skills && invitation.initial_skills.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="text-sm font-semibold text-gray-600 mb-2 block">Skills</span>
              <div className="flex flex-wrap gap-2">
                {invitation.initial_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Custom Message */}
          {invitation.message && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <span className="text-sm font-semibold text-blue-700 mb-2 block">Message</span>
              <p className="text-sm text-gray-700 italic">"{invitation.message}"</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-semibold">{error}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDecline}
            disabled={processing}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Decline
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAccept}
            disabled={processing}
            className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Accept Invitation</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default InvitationAcceptPage;
