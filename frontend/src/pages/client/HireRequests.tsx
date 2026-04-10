/**
 * Client Hire Requests Page
 *
 * Allows clients to view and manage all hire requests they've sent to sellers/developers
 * Features:
 * - View all sent hire requests grouped by project
 * - See status (pending, accepted, rejected, withdrawn)
 * - View developer responses and negotiation history
 * - Withdraw pending requests
 * - Navigate to project dashboard
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hireRequestService, HireRequest } from '@/services/hireRequestService';
import { Loader2, Briefcase, Clock, CheckCircle, XCircle, AlertCircle, Eye, Trash2, ExternalLink, ArrowLeft, MessageSquare, Check, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const HireRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFilter = searchParams.get('projectId');

  const [hireRequests, setHireRequests] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<HireRequest | null>(null);

  // Negotiation state
  const [negotiationData, setNegotiationData] = useState({
    counterBudget: 0,
    counterHourlyRate: 0,
    counterEstimatedHours: 0,
    proposedStartDate: '',
    proposedDuration: '',
    negotiationMessage: '',
  });

  useEffect(() => {
    fetchHireRequests();
  }, [user]);

  const fetchHireRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const requests = await hireRequestService.getClientHireRequests();

      // Filter by projectId if provided in query params
      const filteredRequests = projectIdFilter
        ? requests.filter(r => r.projectId === projectIdFilter)
        : requests;

      setHireRequests(filteredRequests);
    } catch (err: any) {
      console.error('Error fetching hire requests:', err);
      setError(err.message || 'Failed to load hire requests');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (hireRequestId: string) => {
    if (!confirm('Are you sure you want to withdraw this hire request?')) return;

    try {
      setWithdrawingId(hireRequestId);
      await hireRequestService.withdrawHireRequest(hireRequestId);
      // Update local state
      setHireRequests(prev =>
        prev.map(req =>
          req.id === hireRequestId ? { ...req, status: 'withdrawn' } : req
        )
      );
    } catch (err: any) {
      console.error('Error withdrawing hire request:', err);
      alert(err.message || 'Failed to withdraw hire request');
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleAccept = async (hireRequestId: string) => {
    if (!confirm('Are you sure you want to accept this offer?')) return;

    try {
      setRespondingId(hireRequestId);
      await hireRequestService.reviewHireRequest(hireRequestId, {
        status: 'accepted',
        responseMessage: 'Offer accepted by client',
      });
      // Refresh the list
      await fetchHireRequests();
      alert('Offer accepted successfully!');
    } catch (err: any) {
      console.error('Error accepting offer:', err);
      alert(err.message || 'Failed to accept offer');
    } finally {
      setRespondingId(null);
    }
  };

  const handleReject = async (hireRequestId: string) => {
    if (!confirm('Are you sure you want to reject this offer?')) return;

    try {
      setRespondingId(hireRequestId);
      await hireRequestService.reviewHireRequest(hireRequestId, {
        status: 'rejected',
        responseMessage: 'Offer rejected by client',
      });
      // Refresh the list
      await fetchHireRequests();
      alert('Offer rejected');
    } catch (err: any) {
      console.error('Error rejecting offer:', err);
      alert(err.message || 'Failed to reject offer');
    } finally {
      setRespondingId(null);
    }
  };

  const openNegotiateModal = (request: HireRequest) => {
    setSelectedRequest(request);
    // Pre-fill with current values
    setNegotiationData({
      counterBudget: request.fixedBudget || request.totalBudget || 0,
      counterHourlyRate: request.hourlyRate || 0,
      counterEstimatedHours: request.estimatedHours || 0,
      proposedStartDate: request.startDate || '',
      proposedDuration: request.duration || '',
      negotiationMessage: '',
    });
    setShowNegotiateModal(true);
  };

  const handleNegotiate = async () => {
    if (!selectedRequest) return;
    if (!negotiationData.negotiationMessage.trim()) {
      alert('Please provide a negotiation message');
      return;
    }

    try {
      setRespondingId(selectedRequest.id);

      // Build comprehensive message with counter-offer details
      const message = `Counter Offer from Client: ${
        selectedRequest.paymentType === 'hourly'
          ? `$${negotiationData.counterHourlyRate}/hr × ${negotiationData.counterEstimatedHours}h = $${
              negotiationData.counterHourlyRate * negotiationData.counterEstimatedHours
            }`
          : `Fixed: $${negotiationData.counterBudget}`
      } | Start: ${negotiationData.proposedStartDate} | Duration: ${negotiationData.proposedDuration} | Message: ${negotiationData.negotiationMessage}`;

      await hireRequestService.reviewHireRequest(selectedRequest.id, {
        status: 'negotiating' as any,
        responseMessage: message,
      });

      // Refresh the list
      await fetchHireRequests();
      setShowNegotiateModal(false);
      setSelectedRequest(null);
      alert('Counter-offer sent successfully!');
    } catch (err: any) {
      console.error('Error sending counter-offer:', err);
      alert(err.message || 'Failed to send counter-offer');
    } finally {
      setRespondingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'negotiating':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'withdrawn':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'negotiating':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatBudget = (request: HireRequest) => {
    if (request.paymentType === 'hourly' && request.hourlyRate && request.estimatedHours) {
      return `$${request.hourlyRate}/hr × ${request.estimatedHours}h = $${request.totalBudget}`;
    } else if (request.paymentType === 'fixed' && request.fixedBudget) {
      return `$${request.fixedBudget} (Fixed)`;
    }
    return `$${request.totalBudget}`;
  };

  // Group hire requests by project
  const groupedRequests = hireRequests.reduce((acc, request) => {
    const projectId = request.projectId || 'no-project';
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(request);
    return acc;
  }, {} as Record<string, HireRequest[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-sky-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading hire requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Hire Requests</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchHireRequests}
            className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {projectIdFilter ? 'Project Hire Requests' : 'My Hire Requests'}
          </h1>
          <p className="text-gray-600">
            {projectIdFilter
              ? 'View all hire requests sent for this specific project'
              : 'Manage all hire requests you\'ve sent to developers and companies'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{hireRequests.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-sky-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {hireRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">
                  {hireRequests.filter(r => r.status === 'accepted').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {hireRequests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Hire Requests List */}
        {hireRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Hire Requests Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't sent any hire requests. Browse developers and send your first hire request!
            </p>
            <button
              onClick={() => navigate('/browse-talent')}
              className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-medium"
            >
              Browse Developers
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedRequests).map(([projectId, requests]) => (
              <motion.div
                key={projectId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Project Header */}
                <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-white" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {requests[0].title}
                      </h3>
                      <p className="text-sm text-sky-100">
                        {requests.length} {requests.length === 1 ? 'request' : 'requests'} sent
                      </p>
                    </div>
                  </div>
                  {projectId !== 'no-project' && (
                    <button
                      onClick={() => navigate(`/company/${requests[0].companyId}/project/${projectId}/dashboard`)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition"
                    >
                      <span className="text-sm font-medium">View Project</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Requests List */}
                <div className="divide-y divide-gray-200">
                  {requests.map((request) => (
                    <div key={request.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Company Info */}
                        <div className="flex items-start gap-4 flex-1">
                          {request.company?.logo ? (
                            <img
                              src={request.company.logo}
                              alt={request.company.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {request.company?.name?.charAt(0) || 'C'}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {request.company?.name || 'Unknown Company'}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {request.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <strong>Budget:</strong> {formatBudget(request)}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <strong>Start:</strong> {formatDate(request.startDate)}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <strong>Duration:</strong> {request.duration}
                              </span>
                            </div>
                            {request.responseMessage && (
                              <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                                <p className="text-sm font-medium text-sky-900 mb-1">Response:</p>
                                <p className="text-sm text-sky-800">{request.responseMessage}</p>
                                {request.respondedAt && (
                                  <p className="text-xs text-sky-600 mt-1">
                                    Responded on {formatDate(request.respondedAt)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Status & Actions */}
                        <div className="flex flex-col items-end gap-3">
                          <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {getStatusIcon(request.status)}
                            <span className="text-sm font-semibold capitalize">{request.status}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {request.status === 'pending' && (
                              <button
                                onClick={() => handleWithdraw(request.id)}
                                disabled={withdrawingId === request.id}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {withdrawingId === request.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                Withdraw
                              </button>
                            )}
                            {request.status === 'negotiating' && (
                              <>
                                <button
                                  onClick={() => handleAccept(request.id)}
                                  disabled={respondingId === request.id}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {respondingId === request.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                  Accept
                                </button>
                                <button
                                  onClick={() => openNegotiateModal(request)}
                                  disabled={respondingId === request.id}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Negotiate
                                </button>
                                <button
                                  onClick={() => handleReject(request.id)}
                                  disabled={respondingId === request.id}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {respondingId === request.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <X className="w-4 h-4" />
                                  )}
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => navigate(`/developer/${request.companyId}`)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-sky-600 hover:bg-sky-50 border border-sky-200 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                              View Profile
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Sent {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Negotiation Modal */}
        {showNegotiateModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-white">Counter Offer</h2>
                  <p className="text-sm text-sky-100 mt-1">{selectedRequest.title}</p>
                </div>
                <button
                  onClick={() => setShowNegotiateModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Current Offer Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Current Offer from Seller</h3>
                  {selectedRequest.responseMessage && (
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedRequest.responseMessage}</p>
                  )}
                </div>

                {/* Payment Type */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Payment Type</p>
                  <p className="font-semibold text-gray-900 capitalize">{selectedRequest.paymentType}</p>
                </div>

                {/* Budget Fields */}
                {selectedRequest.paymentType === 'hourly' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Counter Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        value={negotiationData.counterHourlyRate}
                        onChange={(e) =>
                          setNegotiationData({ ...negotiationData, counterHourlyRate: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="Enter hourly rate"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Counter Estimated Hours
                      </label>
                      <input
                        type="number"
                        value={negotiationData.counterEstimatedHours}
                        onChange={(e) =>
                          setNegotiationData({ ...negotiationData, counterEstimatedHours: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="Enter estimated hours"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Counter Fixed Budget ($)
                    </label>
                    <input
                      type="number"
                      value={negotiationData.counterBudget}
                      onChange={(e) =>
                        setNegotiationData({ ...negotiationData, counterBudget: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="Enter fixed budget"
                    />
                  </div>
                )}

                {/* Timeline Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposed Start Date
                    </label>
                    <input
                      type="date"
                      value={negotiationData.proposedStartDate}
                      onChange={(e) =>
                        setNegotiationData({ ...negotiationData, proposedStartDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposed Duration
                    </label>
                    <select
                      value={negotiationData.proposedDuration}
                      onChange={(e) =>
                        setNegotiationData({ ...negotiationData, proposedDuration: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="">Select duration</option>
                      <option value="1-2 weeks">1-2 weeks</option>
                      <option value="2-4 weeks">2-4 weeks</option>
                      <option value="1-2 months">1-2 months</option>
                      <option value="2-3 months">2-3 months</option>
                      <option value="3-6 months">3-6 months</option>
                      <option value="6+ months">6+ months</option>
                    </select>
                  </div>
                </div>

                {/* Negotiation Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={negotiationData.negotiationMessage}
                    onChange={(e) =>
                      setNegotiationData({ ...negotiationData, negotiationMessage: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    rows={4}
                    placeholder="Explain your counter-offer and any conditions..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 sticky bottom-0">
                <button
                  onClick={() => setShowNegotiateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNegotiate}
                  disabled={respondingId === selectedRequest.id || !negotiationData.negotiationMessage.trim()}
                  className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {respondingId === selectedRequest.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Send Counter-Offer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HireRequests;
