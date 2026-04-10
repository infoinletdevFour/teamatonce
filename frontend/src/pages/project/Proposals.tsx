import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  Users,
  User,
  FileText,
  AlertCircle,
  Star,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { proposalService } from '@/services/proposalService';
import type { Proposal } from '@/types/proposal';

export const Proposals: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { companyId } = useCompany();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    const fetchProposals = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching proposals for project:', projectId);

        const proposalsData = await proposalService.getProjectProposals(projectId);
        console.log('Proposals fetched:', proposalsData);

        setProposals(proposalsData || []);
      } catch (err: any) {
        console.error('Error fetching proposals:', err);
        setError(err.message || 'Failed to load proposals');
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [projectId]);

  const handleViewDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowDetailModal(true);
  };

  const handleAcceptProposal = async (proposalId: string) => {
    try {
      await proposalService.reviewProposal(proposalId, {
        status: 'accepted',
        reviewNotes: 'Proposal accepted',
      });
      // Refresh proposals
      const proposalsData = await proposalService.getProjectProposals(projectId!);
      setProposals(proposalsData || []);
      setShowDetailModal(false);
    } catch (err: any) {
      console.error('Error accepting proposal:', err);
      alert('Failed to accept proposal: ' + err.message);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    try {
      await proposalService.reviewProposal(proposalId, {
        status: 'rejected',
        reviewNotes: 'Proposal rejected',
      });
      // Refresh proposals
      const proposalsData = await proposalService.getProjectProposals(projectId!);
      setProposals(proposalsData || []);
      setShowDetailModal(false);
    } catch (err: any) {
      console.error('Error rejecting proposal:', err);
      alert('Failed to reject proposal: ' + err.message);
    }
  };

  const filteredProposals = proposals.filter((proposal) => {
    if (filter === 'all') return true;
    return proposal.status === filter;
  });

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'pending':
        return Clock;
      default:
        return FileText;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md border border-gray-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading Proposals</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Compact Header */}
        <div className="mb-4">
          <button
            onClick={() => navigate(`/company/${companyId}/project/${projectId}/dashboard`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-sky-600 mb-3 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-600 to-sky-700 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">
                  Proposals Received
                </h1>
                <p className="text-xs text-gray-600 flex items-center space-x-2">
                  <span className="font-semibold text-sky-600">{proposals.length}</span>
                  <span>proposal{proposals.length !== 1 ? 's' : ''} • </span>
                  <span>
                    {proposals.filter(p => p.status === 'pending').length} pending review
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 mb-4 bg-white p-1.5 rounded-lg shadow-sm border border-gray-200 w-fit">
          {[
            { value: 'all', label: 'All Proposals', icon: FileText },
            { value: 'pending', label: 'Pending', icon: Clock },
            { value: 'accepted', label: 'Accepted', icon: CheckCircle },
            { value: 'rejected', label: 'Rejected', icon: XCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const count = tab.value === 'all' ? proposals.length : proposals.filter((p) => p.status === tab.value).length;

            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center space-x-1.5 ${
                  filter === tab.value
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  filter === tab.value
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProposals.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {filter === 'all' ? 'No proposals yet' : `No ${filter} proposals`}
            </h3>
            <p className="text-sm text-gray-600">
              {filter === 'all'
                ? 'Sellers will be able to submit proposals for this project'
                : `No proposals with status "${filter}"`}
            </p>
          </div>
        )}

        {/* Proposals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProposals.map((proposal, idx) => {
            const StatusIcon = getStatusIcon(proposal.status);

            return (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:border-sky-300 hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {proposal.company?.name || proposal.company_name || 'Company'}
                      </h3>
                      <button
                        onClick={() => navigate(`/user/${proposal.submittedBy}`)}
                        className="p-1 hover:bg-sky-50 rounded-md transition-colors group"
                        title="View Seller Profile"
                      >
                        <User className="w-4 h-4 text-gray-400 group-hover:text-sky-600" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Submitted {new Date(proposal.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 border ${getStatusBadgeClasses(proposal.status)}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="capitalize">{proposal.status}</span>
                  </div>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center space-x-2 p-2.5 bg-green-50 rounded-lg border border-green-100">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600">Proposed Cost</p>
                      <p className="font-bold text-gray-900 text-sm">${proposal.proposedCost.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-2.5 bg-sky-50 rounded-lg border border-sky-100">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <div>
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="font-bold text-gray-900 text-sm">{proposal.proposedDurationDays} days</p>
                    </div>
                  </div>
                </div>

                {/* Cover Letter Preview */}
                {proposal.coverLetter && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1.5 font-semibold">Cover Letter</p>
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{proposal.coverLetter}</p>
                  </div>
                )}

                {/* Milestones Badge */}
                {proposal.proposedMilestones && proposal.proposedMilestones.length > 0 && (
                  <div className="mb-4 flex items-center space-x-2 p-2.5 bg-sky-50 rounded-lg border border-sky-100">
                    <Star className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-semibold text-sky-700">
                      {proposal.proposedMilestones.length} Milestone{proposal.proposedMilestones.length !== 1 ? 's' : ''} Proposed
                    </span>
                  </div>
                )}

                {/* AI Match Score */}
                {proposal.matchScore !== undefined && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-600 font-semibold">Match Score</span>
                      <span className="font-bold text-sky-600">{proposal.matchScore}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all"
                        style={{ width: `${proposal.matchScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleViewDetails(proposal)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  {proposal.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAcceptProposal(proposal.id)}
                        className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRejectProposal(proposal.id)}
                        className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedProposal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDetailModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedProposal.company?.name || selectedProposal.company_name || 'Company'}
                      </h2>
                      <button
                        onClick={() => navigate(`/user/${selectedProposal.submittedBy}`)}
                        className="p-1.5 hover:bg-sky-50 rounded-md transition-colors group"
                        title="View Seller Profile"
                      >
                        <User className="w-4 h-4 text-gray-400 group-hover:text-sky-600" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Submitted {new Date(selectedProposal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Proposal Details */}
                <div className="space-y-5">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <DollarSign className="w-6 h-6 text-green-600 mb-2" />
                      <p className="text-xs text-gray-600 mb-1">Proposed Cost</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${selectedProposal.proposedCost.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Calendar className="w-6 h-6 text-blue-600 mb-2" />
                      <p className="text-xs text-gray-600 mb-1">Duration</p>
                      <p className="text-xl font-bold text-gray-900">
                        {selectedProposal.proposedDurationDays} days
                      </p>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {selectedProposal.coverLetter && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2 text-sm">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>Cover Letter</span>
                      </h3>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedProposal.coverLetter}</p>
                      </div>
                    </div>
                  )}

                  {/* Milestones */}
                  {selectedProposal.proposedMilestones && selectedProposal.proposedMilestones.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2 text-sm">
                        <Star className="w-4 h-4 text-yellow-600" />
                        <span>Proposed Milestones</span>
                      </h3>
                      <div className="space-y-2.5">
                        {selectedProposal.proposedMilestones.map((milestone, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 text-sm">{milestone.name}</h4>
                              <span className="text-green-600 font-bold text-sm">${milestone.amount.toLocaleString()}</span>
                            </div>
                            {milestone.description && (
                              <p className="text-xs text-gray-600 mb-2">{milestone.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{milestone.estimatedHours} hours</span>
                              {milestone.dueDate && (
                                <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Composition */}
                  {selectedProposal.teamComposition && selectedProposal.teamComposition.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2 text-sm">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>Team Composition</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-2.5">
                        {selectedProposal.teamComposition.map((member, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                            <p className="text-xs text-gray-600">{member.role}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedProposal.status === 'pending' && (
                    <div className="flex gap-3 pt-5 border-t border-gray-200">
                      <button
                        onClick={() => handleAcceptProposal(selectedProposal.id)}
                        className="flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept Proposal</span>
                      </button>
                      <button
                        onClick={() => handleRejectProposal(selectedProposal.id)}
                        className="flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Proposal</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Proposals;
