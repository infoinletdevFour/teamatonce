import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Clock,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Loader2,
  AlertCircle,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import {
  hireRequestService,
  HireRequest,
  HireRequestStatus,
} from '@/services/hireRequestService';
import { toast } from 'sonner';

const HireRequests: React.FC = () => {
  const { companyId, company, loading: companyLoading } = useCompany();
  const [hireRequests, setHireRequests] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HireRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [responding, setResponding] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [filter, setFilter] = useState<'all' | HireRequestStatus>('all');

  // Helper function to strip HTML tags
  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

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
    if (companyId) {
      loadHireRequests();
    }
  }, [companyId]);

  const loadHireRequests = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const requests = await hireRequestService.getCompanyHireRequests(companyId);
      setHireRequests(requests);
    } catch (error) {
      console.error('Error loading hire requests:', error);
      toast.error('Failed to load hire requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (status: 'accepted' | 'rejected') => {
    if (!selectedRequest) return;

    try {
      setResponding(true);
      await hireRequestService.reviewHireRequest(selectedRequest.id, {
        status,
        responseMessage: responseMessage || undefined,
      });

      toast.success(
        status === 'accepted'
          ? 'Hire request accepted! A project has been created.'
          : 'Hire request declined.'
      );

      setShowDetailModal(false);
      setSelectedRequest(null);
      setResponseMessage('');
      loadHireRequests();
    } catch (error: any) {
      console.error('Error responding to hire request:', error);
      toast.error(error.message || 'Failed to respond to hire request');
    } finally {
      setResponding(false);
    }
  };

  const openDetailModal = (request: HireRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const openNegotiateModal = (request: HireRequest) => {
    setSelectedRequest(request);
    // Initialize with current values
    setNegotiationData({
      counterBudget: request.paymentType === 'fixed' ? request.fixedBudget || 0 : 0,
      counterHourlyRate: request.hourlyRate || 0,
      counterEstimatedHours: request.estimatedHours || 0,
      proposedStartDate: request.startDate,
      proposedDuration: request.duration,
      negotiationMessage: '',
    });
    setShowDetailModal(false);
    setShowNegotiateModal(true);
  };

  const handleNegotiate = async () => {
    if (!selectedRequest) return;

    const message = `Counter Offer: ${
      selectedRequest.paymentType === 'hourly'
        ? `$${negotiationData.counterHourlyRate}/hr x ${negotiationData.counterEstimatedHours}h = $${
            negotiationData.counterHourlyRate * negotiationData.counterEstimatedHours
          }`
        : `Fixed: $${negotiationData.counterBudget}`
    } | Start: ${negotiationData.proposedStartDate} | Duration: ${negotiationData.proposedDuration}${
      negotiationData.negotiationMessage ? ` | ${negotiationData.negotiationMessage}` : ''
    }`;

    try {
      setResponding(true);
      await hireRequestService.reviewHireRequest(selectedRequest.id, {
        status: 'negotiating' as any, // Mark as negotiating with counter offer
        responseMessage: message,
      });

      toast.success('Counter offer sent to client!');
      setShowNegotiateModal(false);
      setSelectedRequest(null);
      loadHireRequests();
    } catch (error: any) {
      console.error('Error sending counter offer:', error);
      toast.error(error.message || 'Failed to send counter offer');
    } finally {
      setResponding(false);
    }
  };

  const getStatusBadge = (status: HireRequestStatus) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      negotiating: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
      expired: 'bg-gray-100 text-gray-600',
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredRequests = hireRequests.filter((request) => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const pendingCount = hireRequests.filter((r) => r.status === 'pending').length;

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading company information...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Company Selected</h2>
          <p className="text-gray-600 mb-6">
            You need to select or create a company to view hire requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Hire Requests
          </h1>
          <p className="text-gray-600 text-lg">
            View and respond to direct hire requests from clients.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">{pendingCount} pending request{pendingCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'negotiating', 'accepted', 'rejected', 'withdrawn'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All Requests' : status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && pendingCount > 0 && (
                <span className="ml-2 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading hire requests...</p>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        /* Empty State */
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Hire Requests</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {filter === 'all'
              ? "You haven't received any hire requests yet. When clients want to work with you, their requests will appear here."
              : `No ${filter} hire requests found.`}
          </p>
        </div>
      ) : (
        /* Hire Requests List */
        <div className="space-y-4">
          {filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border ${
                request.status === 'pending' ? 'border-yellow-300' : 'border-gray-200'
              } overflow-hidden hover:shadow-xl transition-shadow`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Client Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      {request.client?.avatar ? (
                        <img
                          src={request.client.avatar}
                          alt={request.client.name}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {request.title}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        From: <span className="font-medium">{request.client?.name || 'Unknown Client'}</span>
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">{stripHtml(request.description)}</p>
                      {request.status === 'negotiating' && request.responseMessage && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-medium text-blue-900 mb-1">Client's Counter-Offer:</p>
                          <p className="text-sm text-blue-800">{request.responseMessage}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Budget & Actions */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-black text-gray-900 mb-1">
                      {formatCurrency(request.totalBudget)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {request.paymentType === 'hourly'
                        ? `${formatCurrency(request.hourlyRate || 0)}/hr x ${request.estimatedHours}h`
                        : 'Fixed Price'}
                    </p>
                    <button
                      onClick={() => openDetailModal(request)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span>{request.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Start: {formatDate(request.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{request.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-gray-400">Received:</span>
                    <span>{formatDate(request.createdAt)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedRequest.title}
                    </h2>
                    <p className="text-gray-600">
                      From: {selectedRequest.client?.name || 'Unknown Client'}
                    </p>
                  </div>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Budget Section */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Budget</p>
                      <p className="text-3xl font-black text-gray-900">
                        {formatCurrency(selectedRequest.totalBudget)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Payment Type</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {selectedRequest.paymentType}
                      </p>
                      {selectedRequest.paymentType === 'hourly' && (
                        <p className="text-sm text-gray-600">
                          {formatCurrency(selectedRequest.hourlyRate || 0)}/hr x {selectedRequest.estimatedHours}h
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-sm">Category</span>
                    </div>
                    <p className="font-semibold text-gray-900">{selectedRequest.category}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Duration</span>
                    </div>
                    <p className="font-semibold text-gray-900">{selectedRequest.duration}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Start Date</span>
                    </div>
                    <p className="font-semibold text-gray-900">{formatDate(selectedRequest.startDate)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Received</span>
                    </div>
                    <p className="font-semibold text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Project Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{stripHtml(selectedRequest.description)}</p>
                </div>

                {/* Additional Details */}
                {selectedRequest.additionalDetails && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Additional Details</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedRequest.additionalDetails}</p>
                  </div>
                )}

                {/* Counter-Offer Display (for negotiating status) */}
                {selectedRequest.status === 'negotiating' && selectedRequest.responseMessage && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-700" />
                      <h3 className="font-bold text-blue-900">Client's Counter-Offer</h3>
                    </div>
                    <p className="text-blue-800 whitespace-pre-wrap">{selectedRequest.responseMessage}</p>
                    {selectedRequest.respondedAt && (
                      <p className="text-xs text-blue-600 mt-2">
                        Received: {formatDate(selectedRequest.respondedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Response Section (for pending and negotiating requests) */}
                {(selectedRequest.status === 'pending' || selectedRequest.status === 'negotiating') && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {selectedRequest.status === 'negotiating' ? 'Respond to Counter-Offer' : 'Your Response'}
                    </h3>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder={
                        selectedRequest.status === 'negotiating'
                          ? 'Add a message (optional)...'
                          : 'Add a message to the client (optional)...'
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleResponse('accepted')}
                        disabled={responding}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {responding ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => openNegotiateModal(selectedRequest)}
                        disabled={responding}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <MessageSquare className="w-5 h-5" />
                        {selectedRequest.status === 'negotiating' ? 'Counter-Offer' : 'Negotiate'}
                      </button>
                      <button
                        onClick={() => handleResponse('rejected')}
                        disabled={responding}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {responding ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {/* Response Message (for responded requests) */}
                {selectedRequest.responseMessage && selectedRequest.status !== 'pending' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Your Response</h3>
                    <p className="text-gray-600">{selectedRequest.responseMessage}</p>
                    {selectedRequest.respondedAt && (
                      <p className="text-sm text-gray-500 mt-2">
                        Responded on {formatDate(selectedRequest.respondedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Negotiation Modal */}
      <AnimatePresence>
        {showNegotiateModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNegotiateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Counter Offer
                </h2>
                <p className="text-gray-600">
                  Propose different terms for: {selectedRequest.title}
                </p>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Original Request Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Original Request</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <span className="ml-2 font-semibold">{formatCurrency(selectedRequest.totalBudget)}</span>
                    </div>
                    {selectedRequest.paymentType === 'hourly' && (
                      <>
                        <div>
                          <span className="text-gray-600">Rate:</span>
                          <span className="ml-2 font-semibold">{formatCurrency(selectedRequest.hourlyRate || 0)}/hr</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Hours:</span>
                          <span className="ml-2 font-semibold">{selectedRequest.estimatedHours}h</span>
                        </div>
                      </>
                    )}
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <span className="ml-2 font-semibold">{formatDate(selectedRequest.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 font-semibold">{selectedRequest.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Counter Offer Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Your Counter Offer</h3>

                  {/* Budget/Rate Section */}
                  {selectedRequest.paymentType === 'hourly' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Counter Hourly Rate
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={negotiationData.counterHourlyRate}
                            onChange={(e) =>
                              setNegotiationData({
                                ...negotiationData,
                                counterHourlyRate: Number(e.target.value),
                              })
                            }
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Hours
                        </label>
                        <input
                          type="number"
                          value={negotiationData.counterEstimatedHours}
                          onChange={(e) =>
                            setNegotiationData({
                              ...negotiationData,
                              counterEstimatedHours: Number(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Counter Fixed Budget
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={negotiationData.counterBudget}
                          onChange={(e) =>
                            setNegotiationData({
                              ...negotiationData,
                              counterBudget: Number(e.target.value),
                            })
                          }
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Timeline Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proposed Start Date
                      </label>
                      <input
                        type="date"
                        value={negotiationData.proposedStartDate}
                        onChange={(e) =>
                          setNegotiationData({
                            ...negotiationData,
                            proposedStartDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proposed Duration
                      </label>
                      <select
                        value={negotiationData.proposedDuration}
                        onChange={(e) =>
                          setNegotiationData({
                            ...negotiationData,
                            proposedDuration: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Less than 1 month">Less than 1 month</option>
                        <option value="1-3 months">1-3 months</option>
                        <option value="3-6 months">3-6 months</option>
                        <option value="6+ months">6+ months</option>
                        <option value="Ongoing">Ongoing</option>
                      </select>
                    </div>
                  </div>

                  {/* Total Display */}
                  {selectedRequest.paymentType === 'hourly' && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">Counter Total:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(
                            negotiationData.counterHourlyRate * negotiationData.counterEstimatedHours
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        ${negotiationData.counterHourlyRate}/hr × {negotiationData.counterEstimatedHours}h
                      </p>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Message (Optional)
                    </label>
                    <textarea
                      value={negotiationData.negotiationMessage}
                      onChange={(e) =>
                        setNegotiationData({
                          ...negotiationData,
                          negotiationMessage: e.target.value,
                        })
                      }
                      placeholder="Explain your counter offer to the client..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowNegotiateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNegotiate}
                  disabled={responding}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {responding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5" />
                      Send Counter Offer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default HireRequests;
