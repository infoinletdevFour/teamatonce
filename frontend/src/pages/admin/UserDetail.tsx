import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
} from 'lucide-react';
import { getAdminUser, banUser, unbanUser, approveUser, rejectUser } from '@/services/adminService';
import { AdminUser } from '@/types/admin';
import { toast } from 'sonner';

const AdminUserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchUser = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminUser(userId);
      setUser(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleBan = async () => {
    if (!user || !confirm(`Are you sure you want to ban ${user.name || user.email}?`)) return;
    try {
      setProcessing(true);
      await banUser(user.id, 'Banned by admin');
      toast.success('User banned successfully');
      fetchUser();
    } catch {
      toast.error('Failed to ban user');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnban = async () => {
    if (!user) return;
    try {
      setProcessing(true);
      await unbanUser(user.id);
      toast.success('User unbanned successfully');
      fetchUser();
    } catch {
      toast.error('Failed to unban user');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    try {
      setProcessing(true);
      await approveUser(user.id, 'Approved by admin');
      toast.success('User approved successfully');
      fetchUser();
    } catch {
      toast.error('Failed to approve user');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user) return;
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    try {
      setProcessing(true);
      await rejectUser(user.id, reason);
      toast.success('User rejected successfully');
      fetchUser();
    } catch {
      toast.error('Failed to reject user');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'User not found'}</p>
        <button onClick={() => navigate('/admin/users')} className="text-blue-600 hover:underline">
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
          <p className="text-gray-500 mt-1">View and manage user information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{user.name || 'No Name'}</h2>
              <div className="flex items-center gap-2 mt-1 text-gray-500">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  user.role === 'seller' ? 'bg-purple-100 text-purple-700' :
                  user.role === 'admin' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {user.role}
                </span>
                {user.isBanned ? (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
                    Banned
                  </span>
                ) : user.approvalStatus === 'pending' ? (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700">
                    Pending Approval
                  </span>
                ) : user.approvalStatus === 'rejected' ? (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
                    Rejected
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Joined</p>
              <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">{new Date(user.updatedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email Verified</p>
              <p className="font-medium">{user.emailVerified ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Status</p>
              <p className="font-medium">{user.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
          <div className="space-y-3">
            {user.approvalStatus === 'pending' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve User
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject User
                </button>
              </>
            )}

            {user.isBanned ? (
              <button
                onClick={handleUnban}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Unban User
              </button>
            ) : (
              <button
                onClick={handleBan}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                Ban User
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
