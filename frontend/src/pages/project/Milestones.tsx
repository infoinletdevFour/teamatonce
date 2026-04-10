import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  AlertCircle,
  Send,
  ThumbsUp,
  Package,
  Target,
  TrendingUp,
  FileCheck,
  MessageSquare,
} from 'lucide-react';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import { FormModal, ConfirmModal } from '@/components/ui/Modal';
import { useCompany } from '@/contexts/CompanyContext';
import type { Milestone, MilestoneStatus, MilestoneType } from '@/types/milestone';
import {
  getProjectMilestones,
  getProjectStats,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  submitMilestone,
  approveMilestone,
  requestMilestoneFeedback,
} from '@/services/projectService';
import { RejectedProjectBanner } from '@/components/project/RejectedProjectBanner';

/**
 * Milestones Page
 *
 * Displays all project milestones with progress tracking
 * Supports different workflows for clients and developers:
 * - Clients: Create, edit, approve, request changes
 * - Developers: Submit milestones, view approval status
 */

interface MilestoneFormData {
  title: string;
  description: string;
  milestoneType: MilestoneType;
  orderIndex: number;
  deliverables: string[];
  acceptanceCriteria: string[];
  estimatedHours?: number;
  dueDate: string;
  amount?: number;
}

const MILESTONE_TYPES: { value: MilestoneType; label: string; icon: React.ComponentType<any>; color: string }[] = [
  { value: 'planning', label: 'Planning', icon: Target, color: 'blue' },
  { value: 'design', label: 'Design', icon: Package, color: 'purple' },
  { value: 'development', label: 'Development', icon: FileCheck, color: 'green' },
  { value: 'testing', label: 'Testing', icon: CheckCircle, color: 'orange' },
  { value: 'deployment', label: 'Deployment', icon: TrendingUp, color: 'pink' },
  { value: 'maintenance', label: 'Maintenance', icon: Clock, color: 'gray' },
];

export const Milestones: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentMembership } = useCompany();

  // State
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<string>('active');
  const [approvalStatus, setApprovalStatus] = useState<string>('approved');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Check if project is completed/ended or rejected
  const isProjectCompleted = projectStatus === 'completed' || projectStatus === 'ended';
  const isProjectRejected = approvalStatus === 'rejected';
  const isReadOnly = isProjectCompleted || isProjectRejected;

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Selected milestone
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  // Form data
  const [formData, setFormData] = useState<MilestoneFormData>({
    title: '',
    description: '',
    milestoneType: 'development',
    orderIndex: 1,
    deliverables: [''],
    acceptanceCriteria: [''],
    estimatedHours: undefined,
    dueDate: '',
    amount: undefined,
  });

  // Feedback state
  const [feedback, setFeedback] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [approveNotes, setApproveNotes] = useState('');

  // Determine user role (client or developer)
  // In production, this would come from project membership or assignment
  const isClient = currentMembership?.role === 'owner' || currentMembership?.role === 'admin';
  const isDeveloper = !isClient; // Simplified for this implementation

  // Load milestones
  const loadMilestones = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getProjectMilestones(projectId);
      setMilestones(response.milestones || []);
    } catch (err: any) {
      console.error('Error loading milestones:', err);
      setError(err.message || 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMilestones();
    // Fetch project status and approval status
    if (projectId) {
      getProjectStats(projectId).then((data) => {
        setProjectStatus(data.project?.status || 'active');
        setApprovalStatus(data.project?.approval_status || 'approved');
        setRejectionReason(data.project?.approval_rejection_reason || '');
      }).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Get status badge color
  const getStatusColor = (status: MilestoneStatus): string => {
    const colors: Record<MilestoneStatus, string> = {
      pending: 'bg-gray-100 text-gray-700 border-gray-300',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
      submitted: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      feedback_required: 'bg-orange-100 text-orange-700 border-orange-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      approved: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    };
    return colors[status] || colors.pending;
  };

  // Get status icon
  const getStatusIcon = (status: MilestoneStatus) => {
    const icons: Record<MilestoneStatus, React.ComponentType<any>> = {
      pending: Clock,
      in_progress: TrendingUp,
      submitted: Send,
      feedback_required: MessageSquare,
      completed: CheckCircle,
      approved: ThumbsUp,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  // Get milestone type info
  const getMilestoneTypeInfo = (type: string) => {
    return MILESTONE_TYPES.find(t => t.value === type) || MILESTONE_TYPES[0];
  };

  // Calculate progress percentage
  const calculateProgress = (milestone: Milestone): number => {
    // Progress is stored in the milestone object
    return milestone.progress || 0;
  };

  // Handle create milestone
  const handleCreateMilestone = async () => {
    if (!projectId) return;

    // Validate required fields
    if (!formData.amount || formData.amount <= 0) {
      alert('Please enter a valid milestone amount greater than 0');
      return;
    }

    try {
      const newMilestone = await createMilestone(projectId, {
        name: formData.title,
        description: formData.description,
        milestoneType: formData.milestoneType,
        orderIndex: formData.orderIndex,
        deliverables: formData.deliverables.filter(d => d.trim() !== ''),
        acceptanceCriteria: formData.acceptanceCriteria.filter(c => c.trim() !== ''),
        estimatedHours: formData.estimatedHours,
        dueDate: formData.dueDate,
        milestoneAmount: formData.amount,
      });

      setMilestones(prev => [...prev, newMilestone].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error creating milestone:', err);
      alert(err.message || 'Failed to create milestone');
    }
  };

  // Handle edit milestone
  const handleEditMilestone = async () => {
    if (!selectedMilestone) return;

    // Validate required fields
    if (!formData.amount || formData.amount <= 0) {
      alert('Please enter a valid milestone amount greater than 0');
      return;
    }

    try {
      const updated = await updateMilestone(selectedMilestone.id, {
        name: formData.title,
        description: formData.description,
        milestoneType: formData.milestoneType,
        orderIndex: formData.orderIndex,
        deliverables: formData.deliverables.filter(d => d.trim() !== ''),
        acceptanceCriteria: formData.acceptanceCriteria.filter(c => c.trim() !== ''),
        estimatedHours: formData.estimatedHours,
        dueDate: formData.dueDate,
        milestoneAmount: formData.amount,
      });

      setMilestones(prev =>
        prev.map(m => (m.id === updated.id ? updated : m)).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      );
      setShowEditModal(false);
      setSelectedMilestone(null);
      resetForm();
    } catch (err: any) {
      console.error('Error updating milestone:', err);
      alert(err.message || 'Failed to update milestone');
    }
  };

  // Handle delete milestone
  const handleDeleteMilestone = async () => {
    if (!selectedMilestone) return;

    try {
      await deleteMilestone(selectedMilestone.id);
      setMilestones(prev => prev.filter(m => m.id !== selectedMilestone.id));
      setShowDeleteConfirm(false);
      setSelectedMilestone(null);
    } catch (err: any) {
      console.error('Error deleting milestone:', err);
      alert(err.message || 'Failed to delete milestone');
    }
  };

  // Handle submit milestone (developer)
  const handleSubmitMilestone = async () => {
    if (!selectedMilestone) return;

    try {
      const updated = await submitMilestone(selectedMilestone.id, submitNotes);
      setMilestones(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      setShowSubmitConfirm(false);
      setSelectedMilestone(null);
      setSubmitNotes('');
    } catch (err: any) {
      console.error('Error submitting milestone:', err);
      alert(err.message || 'Failed to submit milestone');
    }
  };

  // Handle approve milestone (client)
  const handleApproveMilestone = async () => {
    if (!selectedMilestone) return;

    try {
      const updated = await approveMilestone(selectedMilestone.id, { notes: approveNotes });
      setMilestones(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      setShowApproveConfirm(false);
      setSelectedMilestone(null);
      setApproveNotes('');
    } catch (err: any) {
      console.error('Error approving milestone:', err);
      alert(err.message || 'Failed to approve milestone');
    }
  };

  // Handle request feedback (client)
  const handleRequestFeedback = async () => {
    if (!selectedMilestone || !feedback.trim()) return;

    try {
      const updated = await requestMilestoneFeedback(selectedMilestone.id, feedback);
      setMilestones(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      setShowFeedbackModal(false);
      setSelectedMilestone(null);
      setFeedback('');
    } catch (err: any) {
      console.error('Error requesting feedback:', err);
      alert(err.message || 'Failed to request feedback');
    }
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      orderIndex: milestones.length + 1,
    }));
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    // Convert deliverables to string array (extract title from DeliverableFile objects)
    const deliverablesArray = milestone.deliverables.length > 0
      ? milestone.deliverables.map(d => typeof d === 'string' ? d : d.title)
      : [''];

    setFormData({
      title: milestone.title,
      description: milestone.description || '',
      milestoneType: (milestone.milestoneType as MilestoneType) || 'development',
      orderIndex: milestone.orderIndex || 1,
      deliverables: deliverablesArray,
      acceptanceCriteria: milestone.acceptanceCriteria.length > 0 ? milestone.acceptanceCriteria : [''],
      estimatedHours: milestone.estimatedHours || undefined,
      dueDate: milestone.dueDate ? milestone.dueDate.split('T')[0] : '',
      amount: milestone.amount || undefined,
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      milestoneType: 'development',
      orderIndex: 1,
      deliverables: [''],
      acceptanceCriteria: [''],
      estimatedHours: undefined,
      dueDate: '',
      amount: undefined,
    });
  };

  // Add/remove deliverable
  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, ''],
    }));
  };

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  };

  const updateDeliverable = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => (i === index ? value : d)),
    }));
  };

  // Add/remove acceptance criteria
  const addCriteria = () => {
    setFormData(prev => ({
      ...prev,
      acceptanceCriteria: [...prev.acceptanceCriteria, ''],
    }));
  };

  const removeCriteria = (index: number) => {
    setFormData(prev => ({
      ...prev,
      acceptanceCriteria: prev.acceptanceCriteria.filter((_, i) => i !== index),
    }));
  };

  const updateCriteria = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      acceptanceCriteria: prev.acceptanceCriteria.map((c, i) => (i === index ? value : c)),
    }));
  };

  // Calculate statistics
  // Note: Milestone amounts may come as strings from API, parse to numbers
  const stats = {
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'approved' || m.status === 'completed').length,
    inProgress: milestones.filter(m => m.status === 'in_progress').length,
    pending: milestones.filter(m => m.status === 'pending').length,
    totalBudget: milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0),
    paidAmount: milestones
      .filter(m => m.status === 'approved' && m.paymentStatus === 'paid')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0),
  };

  // Render milestone form
  const renderMilestoneForm = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Milestone Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Complete user authentication module"
          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what needs to be accomplished in this milestone"
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
      </div>

      {/* Milestone Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Milestone Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MILESTONE_TYPES.map(type => {
            const Icon = type.icon;
            const isSelected = formData.milestoneType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, milestoneType: type.value }))}
                className={`p-3 rounded-xl border-2 transition-all flex items-center space-x-2 ${
                  isSelected
                    ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold text-sm">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dates and Budget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Order Index</label>
          <input
            type="number"
            value={formData.orderIndex}
            onChange={e => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 1 }))}
            min="1"
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Amount ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.amount || ''}
            onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || undefined }))}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Hours</label>
        <input
          type="number"
          value={formData.estimatedHours || ''}
          onChange={e => setFormData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || undefined }))}
          placeholder="0"
          min="0"
          step="0.5"
          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Deliverables */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">Deliverables</label>
          <button
            type="button"
            onClick={addDeliverable}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
        <div className="space-y-2">
          {formData.deliverables.map((deliverable, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={deliverable}
                onChange={e => updateDeliverable(index, e.target.value)}
                placeholder="e.g., Login page with email/password"
                className="flex-1 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
              {formData.deliverables.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDeliverable(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">Acceptance Criteria</label>
          <button
            type="button"
            onClick={addCriteria}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
        <div className="space-y-2">
          {formData.acceptanceCriteria.map((criteria, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={criteria}
                onChange={e => updateCriteria(index, e.target.value)}
                placeholder="e.g., Users can successfully log in with valid credentials"
                className="flex-1 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
              {formData.acceptanceCriteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCriteria(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <ProjectPageLayout title="Milestones" subtitle="Track project milestones and deliverables">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading milestones...</p>
          </div>
        </div>
      </ProjectPageLayout>
    );
  }

  if (error) {
    return (
      <ProjectPageLayout title="Milestones" subtitle="Track project milestones and deliverables">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Milestones</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadMilestones}
            className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout
      title="Milestones"
      subtitle="Track project milestones and deliverables"
      headerActions={
        !isReadOnly ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Milestone</span>
          </motion.button>
        ) : null
      }
    >
      {/* Rejected Project Banner */}
      {isProjectRejected && (
        <RejectedProjectBanner
          reason={rejectionReason}
          className="mb-6"
        />
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Milestones</p>
              <p className="text-3xl font-black text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-black text-green-600">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-black text-blue-600">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Budget</p>
              <p className="text-3xl font-black text-purple-600">${stats.totalBudget.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Milestones Grid */}
      {milestones.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-12 text-center"
        >
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Milestones Yet</h3>
          <p className="text-gray-600 mb-6">
            {isReadOnly
              ? isProjectRejected
                ? 'This project has been rejected and is no longer available for modifications'
                : 'This project has been completed'
              : 'Create your first milestone to start tracking project progress'}
          </p>
          {!isReadOnly && (
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Create First Milestone
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {milestones.map((milestone, index) => {
            const typeInfo = getMilestoneTypeInfo(milestone.milestoneType || 'development');
            const TypeIcon = typeInfo.icon;
            const progress = calculateProgress(milestone);
            const daysUntilDue = milestone.dueDate
              ? Math.ceil((new Date(milestone.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`w-12 h-12 rounded-xl bg-${typeInfo.color}-100 flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon className={`w-6 h-6 text-${typeInfo.color}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{milestone.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1 ${getStatusColor(milestone.status)}`}>
                            {getStatusIcon(milestone.status)}
                            <span>{milestone.status.replace('_', ' ').toUpperCase()}</span>
                          </span>
                          <span className={`px-2 py-1 bg-${typeInfo.color}-50 text-${typeInfo.color}-700 rounded-full text-xs font-semibold`}>
                            {typeInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions - Both clients and developers can edit/delete milestones (only if project is not completed/rejected) */}
                    {!isReadOnly && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditModal(milestone)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit milestone"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMilestone(milestone);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mb-4">{milestone.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 font-semibold">Progress</span>
                      <span className="font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                      />
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="flex items-center space-x-1 text-gray-500 mb-1">
                        <DollarSign className="w-3 h-3" />
                        <span className="text-xs">Amount</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {milestone.amount ? `$${milestone.amount.toLocaleString()}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-500 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">Est. Hours</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {milestone.estimatedHours || 'N/A'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-1 text-gray-500 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs">Due Date</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {milestone.dueDate ? (
                          <>
                            {new Date(milestone.dueDate).toLocaleDateString()}
                            {daysUntilDue !== null && (
                              <span
                                className={`ml-2 text-xs ${
                                  daysUntilDue < 0
                                    ? 'text-red-600'
                                    : daysUntilDue < 7
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                                }`}
                              >
                                ({daysUntilDue < 0 ? 'Overdue' : `${daysUntilDue} days left`})
                              </span>
                            )}
                          </>
                        ) : (
                          'No due date'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deliverables */}
                  {milestone.deliverables.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Deliverables</h4>
                      <div className="space-y-1">
                        {milestone.deliverables.slice(0, 3).map((deliverable, idx) => {
                          const deliverableText = typeof deliverable === 'string' ? deliverable : deliverable.title;
                          return (
                            <div key={idx} className="flex items-start space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{deliverableText}</span>
                            </div>
                          );
                        })}
                        {milestone.deliverables.length > 3 && (
                          <p className="text-xs text-gray-500 ml-6">+{milestone.deliverables.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {milestone.feedback && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-semibold text-orange-900">Client Feedback</span>
                      </div>
                      <p className="text-sm text-orange-800">{milestone.feedback}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isReadOnly && (
                    <div className="flex gap-2">
                      {isDeveloper && milestone.status === 'in_progress' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedMilestone(milestone);
                            setShowSubmitConfirm(true);
                          }}
                          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          <Send className="w-4 h-4" />
                          <span>Submit for Review</span>
                        </motion.button>
                      )}

                      {isClient && milestone.status === 'submitted' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedMilestone(milestone);
                              setShowApproveConfirm(true);
                            }}
                            className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>Approve</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedMilestone(milestone);
                              setShowFeedbackModal(true);
                            }}
                            className="flex-1 flex items-center justify-center space-x-2 bg-white border-2 border-orange-600 text-orange-600 px-4 py-3 rounded-xl font-bold hover:bg-orange-50 transition-all"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Request Changes</span>
                          </motion.button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Milestone Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Milestone"
        description="Define a new milestone for the project"
        size="lg"
        onSubmit={handleCreateMilestone}
        submitText="Create Milestone"
      >
        {renderMilestoneForm()}
      </FormModal>

      {/* Edit Milestone Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMilestone(null);
          resetForm();
        }}
        title="Edit Milestone"
        description="Update milestone details"
        size="lg"
        onSubmit={handleEditMilestone}
        submitText="Save Changes"
      >
        {renderMilestoneForm()}
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedMilestone(null);
        }}
        title="Delete Milestone"
        message={`Are you sure you want to delete "${selectedMilestone?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteMilestone}
        icon={<Trash2 className="w-6 h-6 text-red-600" />}
      />

      {/* Submit Milestone Confirmation */}
      <FormModal
        isOpen={showSubmitConfirm}
        onClose={() => {
          setShowSubmitConfirm(false);
          setSelectedMilestone(null);
          setSubmitNotes('');
        }}
        title="Submit Milestone"
        description={`Submit "${selectedMilestone?.title}" for client review`}
        onSubmit={handleSubmitMilestone}
        submitText="Submit"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Submission Notes (Optional)
          </label>
          <textarea
            value={submitNotes}
            onChange={e => setSubmitNotes(e.target.value)}
            placeholder="Add any notes for the client about this submission..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>
      </FormModal>

      {/* Approve Milestone Confirmation */}
      <FormModal
        isOpen={showApproveConfirm}
        onClose={() => {
          setShowApproveConfirm(false);
          setSelectedMilestone(null);
          setApproveNotes('');
        }}
        title="Approve Milestone"
        description={`Approve "${selectedMilestone?.title}" and mark as completed`}
        onSubmit={handleApproveMilestone}
        submitText="Approve"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Approval Notes (Optional)
          </label>
          <textarea
            value={approveNotes}
            onChange={e => setApproveNotes(e.target.value)}
            placeholder="Add any notes about this approval..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>
      </FormModal>

      {/* Request Feedback Modal */}
      <FormModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedMilestone(null);
          setFeedback('');
        }}
        title="Request Changes"
        description={`Request revisions for "${selectedMilestone?.title}"`}
        onSubmit={handleRequestFeedback}
        submitText="Send Feedback"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Feedback <span className="text-red-500">*</span>
          </label>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Describe what changes are needed..."
            rows={6}
            required
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Be specific about what needs to be changed or improved.
          </p>
        </div>
      </FormModal>
    </ProjectPageLayout>
  );
};

export default Milestones;
