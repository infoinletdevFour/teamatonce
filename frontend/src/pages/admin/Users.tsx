import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Ban,
  CheckCircle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Calendar,
  MoreVertical,
  AlertTriangle,
  Pause,
  Play,
  Copy,
} from 'lucide-react';
import {
  getAdminUsers,
  getAdminUser,
  banUser,
  unbanUser,
  changeUserRole,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
} from '@/services/adminService';
import { AdminUser, PaginatedResponse } from '@/types/admin';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [roleChangeModal, setRoleChangeModal] = useState<AdminUser | null>(null);
  const [changingRole, setChangingRole] = useState(false);
  const [banModal, setBanModal] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<AdminUser | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [suspendModal, setSuspendModal] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendUntil, setSuspendUntil] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = {
        page,
        limit: 20,
      };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter === 'banned') params.isBanned = true;
      else if (statusFilter !== 'all') params.approvalStatus = statusFilter;

      const response: PaginatedResponse<AdminUser> = await getAdminUsers(params as any);
      setUsers(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleViewUser = async (user: AdminUser) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const fullUser = await getAdminUser(user.id);
      setSelectedUser(fullUser);
    } catch {
      // Keep the basic user data if detail fetch fails
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!banModal) return;
    try {
      setActionLoading(true);
      await banUser(banModal.id, banReason || 'Banned by admin');
      toast.success(`${banModal.name || banModal.email} has been banned`);
      setBanModal(null);
      setBanReason('');
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to ban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (user: AdminUser) => {
    try {
      setActionLoading(true);
      await unbanUser(user.id);
      toast.success(`${user.name || user.email} has been unbanned`);
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to unban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string, userName: string) => {
    try {
      setChangingRole(true);
      await changeUserRole(userId, newRole);
      toast.success(`${userName}'s role changed to ${newRole}`);
      setRoleChangeModal(null);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change role');
    } finally {
      setChangingRole(false);
    }
  };

  const handleApproveUser = async (user: AdminUser) => {
    try {
      setActionLoading(true);
      await approveUser(user.id);
      toast.success(`${user.name || user.email} has been approved`);
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to approve user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectUser = async () => {
    if (!rejectModal) return;
    try {
      setActionLoading(true);
      await rejectUser(rejectModal.id, rejectReason || 'Rejected by admin');
      toast.success(`${rejectModal.name || rejectModal.email} has been rejected`);
      setRejectModal(null);
      setRejectReason('');
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to reject user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!suspendModal) return;
    try {
      setActionLoading(true);
      await suspendUser(suspendModal.id, suspendReason || 'Suspended by admin', suspendUntil || undefined);
      toast.success(`${suspendModal.name || suspendModal.email} has been suspended`);
      setSuspendModal(null);
      setSuspendReason('');
      setSuspendUntil('');
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to suspend user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateUser = async (user: AdminUser) => {
    try {
      setActionLoading(true);
      await reactivateUser(user.id);
      toast.success(`${user.name || user.email} has been reactivated`);
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to reactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (user: AdminUser) => {
    if (user.isBanned) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
          <Ban className="w-3 h-3" />
          Banned
        </span>
      );
    }
    if (!user.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full border border-orange-200">
          <Pause className="w-3 h-3" />
          Suspended
        </span>
      );
    }
    switch (user.approvalStatus) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full border border-red-200">
            <UserX className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
      client: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: <Users className="w-3 h-3" />,
      },
      seller: {
        bg: 'bg-violet-50',
        text: 'text-violet-700',
        border: 'border-violet-200',
        icon: <UserCheck className="w-3 h-3" />,
      },
      admin: {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        icon: <Shield className="w-3 h-3" />,
      },
      super_admin: {
        bg: 'bg-gray-800',
        text: 'text-white',
        border: 'border-gray-700',
        icon: <Shield className="w-3 h-3" />,
      },
    };
    const c = config[role] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: null };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${c.bg} ${c.text} ${c.border}`}>
        {c.icon}
        {role.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Stats summary
  const stats = {
    total,
    active: users.filter((u) => !u.isBanned && u.isActive && u.approvalStatus === 'approved').length,
    pending: users.filter((u) => u.approvalStatus === 'pending').length,
    banned: users.filter((u) => u.isBanned).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage platform users, roles, and permissions</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, gradient: 'from-blue-500 to-blue-600' },
          { label: 'Active', value: stats.active, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600' },
          { label: 'Pending Approval', value: stats.pending, icon: Clock, gradient: 'from-amber-500 to-amber-600' },
          { label: 'Banned', value: stats.banned, icon: Ban, gradient: 'from-red-500 to-red-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      >
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 min-w-[240px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
              />
            </div>
          </form>

          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200 rounded-lg text-sm h-[42px]">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-gray-400" />
                <SelectValue placeholder="All Roles" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200 rounded-lg text-sm h-[42px]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                <SelectValue placeholder="All Statuses" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="approved">Active</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>

          {(roleFilter !== 'all' || statusFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setRoleFilter('all');
                setStatusFilter('all');
                setSearch('');
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm text-gray-500">Loading users...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-red-600 font-medium mb-1">Something went wrong</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium mb-1">No users found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {(user.name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name || 'Unnamed User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setRoleChangeModal(user)}>
                              <Shield className="w-4 h-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            {user.approvalStatus === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApproveUser(user)}>
                                  <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                                  Approve User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setRejectModal(user); setRejectReason(''); }}>
                                  <UserX className="w-4 h-4 mr-2 text-red-600" />
                                  Reject User
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            {user.isBanned ? (
                              <DropdownMenuItem onClick={() => handleUnbanUser(user)}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <>
                                {user.isActive ? (
                                  <DropdownMenuItem onClick={() => { setSuspendModal(user); setSuspendReason(''); setSuspendUntil(''); }}>
                                    <Pause className="w-4 h-4 mr-2 text-orange-600" />
                                    Suspend User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleReactivateUser(user)}>
                                    <Play className="w-4 h-4 mr-2 text-green-600" />
                                    Reactivate User
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => { setBanModal(user); setBanReason(''); }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Ban User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && users.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{(page - 1) * 20 + 1}</span>
              {' '}-{' '}
              <span className="font-medium text-gray-700">{Math.min(page * 20, total)}</span>
              {' '}of{' '}
              <span className="font-medium text-gray-700">{total}</span> users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* User Detail Slide-over */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
            >
              {/* Detail Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Profile Section */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0">
                      {(selectedUser.name || selectedUser.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 truncate">
                        {selectedUser.name || 'Unnamed User'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleBadge(selectedUser.role)}
                        {getStatusBadge(selectedUser)}
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-900">{selectedUser.email}</span>
                        <button
                          onClick={() => copyToClipboard(selectedUser.email)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Joined
                      </span>
                      <span className="text-sm font-medium text-gray-900">{formatDateTime(selectedUser.createdAt)}</span>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Last Login
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedUser.lastLoginAt ? formatDateTime(selectedUser.lastLoginAt) : 'Never'}
                      </span>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Email Verified
                      </span>
                      <span className={`text-sm font-medium ${selectedUser.emailVerified ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {selectedUser.emailVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">User ID</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {selectedUser.id.slice(0, 8)}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(selectedUser.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    {selectedUser.updatedAt && (
                      <>
                        <div className="h-px bg-gray-200" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Last Updated</span>
                          <span className="text-sm font-medium text-gray-900">{formatDateTime(selectedUser.updatedAt)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Metadata */}
                  {selectedUser.metadata && Object.keys(selectedUser.metadata).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Metadata</h4>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        {Object.entries(selectedUser.metadata).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{key}</span>
                            <span className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setRoleChangeModal(selectedUser)}
                        className="flex items-center gap-2 px-4 py-3 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-100 transition-colors border border-violet-200"
                      >
                        <Shield className="w-4 h-4" />
                        Change Role
                      </button>

                      {selectedUser.approvalStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveUser(selectedUser)}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200 disabled:opacity-50"
                          >
                            <UserCheck className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectModal(selectedUser); setRejectReason(''); }}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50"
                          >
                            <UserX className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}

                      {selectedUser.isBanned ? (
                        <button
                          onClick={() => handleUnbanUser(selectedUser)}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Unban
                        </button>
                      ) : (
                        <>
                          {selectedUser.isActive ? (
                            <button
                              onClick={() => { setSuspendModal(selectedUser); setSuspendReason(''); setSuspendUntil(''); }}
                              disabled={actionLoading}
                              className="flex items-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors border border-orange-200 disabled:opacity-50"
                            >
                              <Pause className="w-4 h-4" />
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateUser(selectedUser)}
                              disabled={actionLoading}
                              className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200 disabled:opacity-50"
                            >
                              <Play className="w-4 h-4" />
                              Reactivate
                            </button>
                          )}
                          <button
                            onClick={() => { setBanModal(selectedUser); setBanReason(''); }}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50"
                          >
                            <Ban className="w-4 h-4" />
                            Ban User
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Change Modal */}
      <AnimatePresence>
        {roleChangeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
            onClick={() => setRoleChangeModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mx-4"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Change User Role</h3>
                <button
                  onClick={() => setRoleChangeModal(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {(roleChangeModal.name || roleChangeModal.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{roleChangeModal.name || roleChangeModal.email}</p>
                  <p className="text-xs text-gray-500">Current role: {roleChangeModal.role}</p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { role: 'client', label: 'Client', desc: 'Can post projects and hire sellers', color: 'blue' },
                  { role: 'seller', label: 'Seller', desc: 'Can offer services and manage projects', color: 'violet' },
                  { role: 'admin', label: 'Admin', desc: 'Full platform management access', color: 'rose' },
                ].map(({ role, label, desc, color }) => {
                  const isCurrent = roleChangeModal.role === role;
                  return (
                    <button
                      key={role}
                      onClick={() => handleChangeRole(roleChangeModal.id, role, roleChangeModal.name || roleChangeModal.email)}
                      disabled={changingRole || isCurrent}
                      className={`w-full p-3.5 rounded-xl text-left transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'bg-gray-50 border-2 border-gray-200 cursor-not-allowed opacity-60'
                          : `bg-${color}-50 hover:bg-${color}-100 border border-${color}-200 hover:border-${color}-300`
                      }`}
                    >
                      <div>
                        <span className={`font-medium text-sm ${isCurrent ? 'text-gray-400' : `text-${color}-700`}`}>
                          {label}
                        </span>
                        <p className={`text-xs mt-0.5 ${isCurrent ? 'text-gray-400' : `text-${color}-600/70`}`}>
                          {desc}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2.5 py-1 rounded-full font-medium">Current</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {changingRole && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Updating role...
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ban Modal */}
      <AnimatePresence>
        {banModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
            onClick={() => setBanModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mx-4"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ban User</h3>
                  <p className="text-sm text-gray-500">This will prevent the user from accessing the platform</p>
                </div>
              </div>

              <div className="p-3 bg-red-50 rounded-xl mb-4 border border-red-100">
                <p className="text-sm text-red-800">
                  You are about to ban <span className="font-semibold">{banModal.name || banModal.email}</span>
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Provide a reason for banning this user..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBanModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Ban User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
            onClick={() => setRejectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mx-4"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reject User</h3>
                  <p className="text-sm text-gray-500">
                    Reject <span className="font-medium">{rejectModal.name || rejectModal.email}</span>
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRejectModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectUser}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suspend Modal */}
      <AnimatePresence>
        {suspendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
            onClick={() => setSuspendModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mx-4"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Pause className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Suspend User</h3>
                  <p className="text-sm text-gray-500">
                    Temporarily suspend <span className="font-medium">{suspendModal.name || suspendModal.email}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Provide a reason for suspension..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Suspend Until (optional)</label>
                  <input
                    type="datetime-local"
                    value={suspendUntil}
                    onChange={(e) => setSuspendUntil(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave empty for indefinite suspension</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSuspendModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendUser}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                  Suspend
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
