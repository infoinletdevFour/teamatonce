import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Edit,
  ChevronDown,
  ChevronUp,
  Shield,
  FileSignature,
  Loader2,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { contractService, ContractResponseDto } from '@/services/contractService';
import { milestoneService } from '@/services/milestoneService';
import { toast } from 'sonner';

/**
 * Contracts Page
 * View and manage all project contracts with status tracking
 */

interface ContractDisplay {
  id: string;
  projectId: string;
  projectName: string;
  contractNumber: string;
  status: 'draft' | 'pending_signature' | 'active' | 'completed' | 'terminated';
  totalValue: number;
  paidAmount: number;
  startDate: Date;
  endDate: Date;
  signedDate?: Date;
  milestones: number;
  completedMilestones: number;
  teamSize: number;
  contractType: 'fixed_price' | 'time_materials' | 'retainer';
  documents: {
    id: string;
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }[];
  terms: {
    paymentTerms: string;
    deliverySchedule: string;
    supportPeriod: string;
    cancellationPolicy: string;
  };
}

export const Contracts: React.FC = () => {
  const { company } = useCompany();
  const companyId = company?.id || '';

  const [contracts, setContracts] = useState<ContractDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Transform API response to display format
  const transformContract = useCallback((dto: ContractResponseDto, milestoneCounts?: { total: number; completed: number }): ContractDisplay => {
    // Map backend status to display status
    const statusMap: Record<string, ContractDisplay['status']> = {
      'draft': 'draft',
      'pending': 'pending_signature',
      'pending_signature': 'pending_signature',
      'active': 'active',
      'completed': 'completed',
      'cancelled': 'terminated',
      'terminated': 'terminated',
    };

    // Map contract type
    const typeMap: Record<string, ContractDisplay['contractType']> = {
      'fixed_price': 'fixed_price',
      'hourly': 'time_materials',
      'milestone_based': 'fixed_price',
    };

    // Parse payment terms from JSON if available
    let paymentTerms = 'As per agreement';
    let deliverySchedule = 'As per agreement';
    let supportPeriod = 'As per agreement';
    let cancellationPolicy = 'As per agreement';

    if (dto.payment_terms) {
      paymentTerms = dto.payment_terms.terms || dto.payment_terms.paymentTerms || paymentTerms;
      deliverySchedule = dto.payment_terms.deliverySchedule || deliverySchedule;
      supportPeriod = dto.payment_terms.supportPeriod || supportPeriod;
      cancellationPolicy = dto.payment_terms.cancellationPolicy || cancellationPolicy;
    }

    // Generate contract number from ID
    const contractNumber = `CNT-${new Date(dto.created_at).getFullYear()}-${dto.id.substring(0, 6).toUpperCase()}`;

    // Convert attachments to documents format
    const documents = (dto.attachments || []).map((att: any, idx: number) => ({
      id: att.id || `doc-${idx}`,
      name: att.name || att.filename || `Document ${idx + 1}`,
      url: att.url || '#',
      type: att.type || 'application/pdf',
      uploadedAt: new Date(att.uploadedAt || dto.created_at),
    }));

    // Add contract document if available
    if (dto.contract_document_url) {
      documents.unshift({
        id: 'main-contract',
        name: 'Contract Document.pdf',
        url: dto.contract_document_url,
        type: 'application/pdf',
        uploadedAt: new Date(dto.created_at),
      });
    }

    return {
      id: dto.id,
      projectId: dto.project_id,
      projectName: dto.title,
      contractNumber,
      status: statusMap[dto.status] || 'draft',
      totalValue: dto.total_amount || 0,
      paidAmount: 0, // Will be calculated from milestones
      startDate: new Date(dto.start_date),
      endDate: new Date(dto.end_date),
      signedDate: dto.signed_at ? new Date(dto.signed_at) : undefined,
      milestones: milestoneCounts?.total || 0,
      completedMilestones: milestoneCounts?.completed || 0,
      teamSize: 1, // Default, could be fetched from project
      contractType: typeMap[dto.contract_type] || 'fixed_price',
      documents,
      terms: {
        paymentTerms,
        deliverySchedule,
        supportPeriod,
        cancellationPolicy,
      },
    };
  }, []);

  // Load contracts
  const loadContracts = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const contractsData = await contractService.getCompanyContracts(companyId);

      // Transform contracts
      const transformedContracts = await Promise.all(
        contractsData.map(async (dto) => {
          // Try to get milestone counts for each contract's project
          let milestoneCounts = { total: 0, completed: 0 };
          try {
            const milestonesRes = await milestoneService.getProjectMilestones(companyId, dto.project_id);
            const milestones = milestonesRes.milestones || [];
            milestoneCounts = {
              total: milestones.length,
              completed: milestones.filter((m: any) => m.status === 'completed' || m.status === 'approved').length,
            };
          } catch (e) {
            // Milestone fetch failed, use defaults
          }

          return transformContract(dto, milestoneCounts);
        })
      );

      setContracts(transformedContracts);
    } catch (err: any) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [companyId, transformContract]);

  // Load on mount
  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const getStatusColor = (status: ContractDisplay['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'pending_signature':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'terminated':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: ContractDisplay['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'pending_signature':
        return <Clock className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'terminated':
        return <AlertCircle className="w-5 h-5" />;
      case 'draft':
        return <Edit className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: ContractDisplay['status']) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getContractTypeLabel = (type: ContractDisplay['contractType']) => {
    switch (type) {
      case 'fixed_price':
        return 'Fixed Price';
      case 'time_materials':
        return 'Time & Materials';
      case 'retainer':
        return 'Retainer';
      default:
        return type;
    }
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    active: contracts.filter((c) => c.status === 'active').length,
    pending: contracts.filter((c) => c.status === 'pending_signature').length,
    completed: contracts.filter((c) => c.status === 'completed').length,
    totalValue: contracts.reduce((sum, c) => sum + c.totalValue, 0),
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold mb-2">Error Loading Contracts</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadContracts}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Contracts
          </h1>
          <p className="text-gray-600">Manage and track all your project contracts</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-green-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">{stats.active}</div>
            <div className="text-sm text-gray-600">Active Contracts</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-yellow-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending Signature</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-blue-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-purple-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">
              ${stats.totalValue > 0 ? (stats.totalValue / 1000).toFixed(0) + 'K' : '0'}
            </div>
            <div className="text-sm text-gray-600">Total Contract Value</div>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-gray-200 mb-6"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contracts by project name or contract number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center space-x-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-700">Filter</span>
              </button>

              <AnimatePresence>
                {showFilterMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-10"
                  >
                    <div className="py-1">
                      {[
                        { value: 'all', label: 'All Contracts' },
                        { value: 'active', label: 'Active' },
                        { value: 'pending_signature', label: 'Pending Signature' },
                        { value: 'completed', label: 'Completed' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setStatusFilter(option.value);
                            setShowFilterMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                            statusFilter === option.value
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map((contract, index) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              {/* Contract Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <FileSignature className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900">
                          {contract.projectName}
                        </h3>
                        <p className="text-sm text-gray-600">{contract.contractNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold border-2 flex items-center space-x-2 ${getStatusColor(
                        contract.status
                      )}`}
                    >
                      {getStatusIcon(contract.status)}
                      <span>{getStatusLabel(contract.status)}</span>
                    </span>
                    <button
                      onClick={() =>
                        setExpandedContract(
                          expandedContract === contract.id ? null : contract.id
                        )
                      }
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {expandedContract === contract.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Contract Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-blue-700 font-semibold">Total Value</span>
                    </div>
                    <div className="text-2xl font-black text-blue-900">
                      ${contract.totalValue > 0 ? (contract.totalValue / 1000).toFixed(0) + 'K' : '0'}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Paid: ${(contract.paidAmount / 1000).toFixed(0)}K (
                      {contract.totalValue > 0 ? Math.round((contract.paidAmount / contract.totalValue) * 100) : 0}%)
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-purple-700 font-semibold">Milestones</span>
                    </div>
                    <div className="text-2xl font-black text-purple-900">
                      {contract.completedMilestones}/{contract.milestones}
                    </div>
                    <div className="text-xs text-purple-700 mt-1">
                      {contract.milestones > 0 ? Math.round((contract.completedMilestones / contract.milestones) * 100) : 0}%
                      Complete
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700 font-semibold">Duration</span>
                    </div>
                    <div className="text-2xl font-black text-green-900">
                      {Math.ceil(
                        (contract.endDate.getTime() - contract.startDate.getTime()) /
                          (1000 * 60 * 60 * 24 * 7)
                      )}
                      w
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      {contract.startDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {contract.endDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-4 h-4 text-orange-600" />
                      <span className="text-xs text-orange-700 font-semibold">Contract Type</span>
                    </div>
                    <div className="text-lg font-black text-orange-900">
                      {getContractTypeLabel(contract.contractType)}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-3">
                  {contract.status === 'pending_signature' && (
                    <button
                      onClick={() => toast.info('Contract signing will be available soon')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      <FileSignature className="w-4 h-4" />
                      <span>Sign Contract</span>
                    </button>
                  )}
                  <button
                    onClick={() => toast.info('Contract view will be available soon')}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-300 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => toast.info('Contract download will be available soon')}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-300 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedContract === contract.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 bg-gray-50"
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Contract Terms */}
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <span>Contract Terms</span>
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                Payment Terms
                              </div>
                              <div className="text-sm text-gray-600">
                                {contract.terms.paymentTerms}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                Delivery Schedule
                              </div>
                              <div className="text-sm text-gray-600">
                                {contract.terms.deliverySchedule}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                Support Period
                              </div>
                              <div className="text-sm text-gray-600">
                                {contract.terms.supportPeriod}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                Cancellation Policy
                              </div>
                              <div className="text-sm text-gray-600">
                                {contract.terms.cancellationPolicy}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Documents */}
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <span>Documents</span>
                          </h4>
                          {contract.documents.length > 0 ? (
                            <div className="space-y-3">
                              {contract.documents.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900">
                                        {doc.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {doc.uploadedAt.toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                      <Eye className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                      <Download className="w-4 h-4 text-gray-600" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No documents attached</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {filteredContracts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No contracts found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start a new project to create your first contract'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Contracts;
