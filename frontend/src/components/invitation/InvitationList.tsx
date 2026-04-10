/**
 * Invitation List Component
 * Display and manage sent team invitations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  AlertCircle,
  User,
  Calendar,
  Shield,
  Code,
  Palette,
  Bug,
  Crown,
} from 'lucide-react';
import {
  getInvitations,
  revokeInvitation,
  resendInvitation,
  getTimeRemaining,
  isInvitationExpired,
} from '@/services/invitationService';
import { Invitation, InvitationStatus, TeamRole } from '@/types/invitation';

interface InvitationListProps {
  companyId: string;
  onUpdate?: () => void;
}

const InvitationList: React.FC<InvitationListProps> = ({ companyId, onUpdate }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, [companyId]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInvitations(companyId);
      setInvitations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      await resendInvitation(companyId, invitationId);
      await loadInvitations();
      onUpdate?.();
    } catch (err: any) {
      alert(err.message || 'Failed to resend invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    try {
      setProcessingId(invitationId);
      await revokeInvitation(companyId, invitationId);
      await loadInvitations();
      onUpdate?.();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke invitation');
    } finally {
      setProcessingId(null);
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

  const getStatusBadge = (invitation: Invitation) => {
    const expired = isInvitationExpired(invitation.expires_at);

    switch (invitation.status) {
      case InvitationStatus.PENDING:
        if (expired) {
          return (
            <span className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
              <Clock className="w-3 h-3" />
              <span>Expired</span>
            </span>
          );
        }
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case InvitationStatus.ACCEPTED:
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
            <CheckCircle className="w-3 h-3" />
            <span>Accepted</span>
          </span>
        );
      case InvitationStatus.REVOKED:
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
            <XCircle className="w-3 h-3" />
            <span>Revoked</span>
          </span>
        );
      case InvitationStatus.EXPIRED:
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
            <Clock className="w-3 h-3" />
            <span>Expired</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-600 font-semibold">Loading invitations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
        <button
          onClick={loadInvitations}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-semibold">No invitations sent yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Click "Invite Team Member" to send your first invitation
        </p>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === InvitationStatus.PENDING && !isInvitationExpired(inv.expires_at)
  );
  const otherInvitations = invitations.filter(
    (inv) => inv.status !== InvitationStatus.PENDING || isInvitationExpired(inv.expires_at)
  );

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span>Pending Invitations ({pendingInvitations.length})</span>
          </h3>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => {
              const RoleIcon = getRoleIcon(invitation.role);
              const isProcessing = processingId === invitation.id;

              return (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-bold text-gray-900">{invitation.email}</p>
                          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getRoleColor(invitation.role)} flex items-center justify-center`}>
                            <RoleIcon className="w-3 h-3 text-white" />
                          </div>
                          <span className="px-2 py-0.5 bg-gradient-to-r text-white text-xs font-bold rounded">
                            {getRoleLabel(invitation.role)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>By {invitation.invited_by_name}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(invitation.created_at).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1 text-yellow-600 font-semibold">
                            <Clock className="w-3 h-3" />
                            <span>{getTimeRemaining(invitation.expires_at)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {getStatusBadge(invitation)}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleResend(invitation.id)}
                        disabled={isProcessing}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
                        title="Resend invitation"
                      >
                        <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRevoke(invitation.id)}
                        disabled={isProcessing}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                        title="Revoke invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {invitation.initial_skills && invitation.initial_skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {invitation.initial_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {invitation.message && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 italic">"{invitation.message}"</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Invitations (Accepted, Revoked, Expired) */}
      {otherInvitations.length > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Invitation History ({otherInvitations.length})
          </h3>
          <div className="space-y-3">
            {otherInvitations.map((invitation) => {
              const RoleIcon = getRoleIcon(invitation.role);

              return (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-bold text-gray-700">{invitation.email}</p>
                          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getRoleColor(invitation.role)} flex items-center justify-center opacity-50`}>
                            <RoleIcon className="w-3 h-3 text-white" />
                          </div>
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-bold rounded">
                            {getRoleLabel(invitation.role)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(invitation.created_at).toLocaleDateString()}</span>
                          </span>
                          {invitation.accepted_at && (
                            <span className="text-green-600 font-semibold">
                              Accepted {new Date(invitation.accepted_at).toLocaleDateString()}
                            </span>
                          )}
                          {invitation.declined_at && (
                            <span className="text-red-600 font-semibold">
                              Declined {new Date(invitation.declined_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">{getStatusBadge(invitation)}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationList;
