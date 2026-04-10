import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  DollarSign,
  Clock,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createAdjustmentRequest,
  MilestoneChanges,
} from '@/services/milestoneAdjustmentService';

interface Milestone {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  milestoneAmount: number;
  dueDate?: string;
  deliverables: string[];
  acceptanceCriteria: string[];
}

interface MilestoneAdjustmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone;
  onSuccess?: () => void;
}

export const MilestoneAdjustmentRequestModal: React.FC<
  MilestoneAdjustmentRequestModalProps
> = ({ isOpen, onClose, milestone, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  // Proposed changes
  const [newName, setNewName] = useState(milestone.name);
  const [newDescription, setNewDescription] = useState(milestone.description);
  const [newEstimatedHours, setNewEstimatedHours] = useState(milestone.estimatedHours);
  const [newMilestoneAmount, setNewMilestoneAmount] = useState(milestone.milestoneAmount);
  const [newDueDate, setNewDueDate] = useState(milestone.dueDate || '');
  const [newDeliverables, setNewDeliverables] = useState<string[]>([...milestone.deliverables]);
  const [newAcceptanceCriteria, setNewAcceptanceCriteria] = useState<string[]>([
    ...milestone.acceptanceCriteria,
  ]);

  // Track what changed
  const [changeFlags, setChangeFlags] = useState({
    name: false,
    description: false,
    estimatedHours: false,
    milestoneAmount: false,
    dueDate: false,
    deliverables: false,
    acceptanceCriteria: false,
  });

  const handleToggleChange = (field: keyof typeof changeFlags) => {
    setChangeFlags({ ...changeFlags, [field]: !changeFlags[field] });
  };

  const addDeliverable = () => {
    setNewDeliverables([...newDeliverables, '']);
  };

  const updateDeliverable = (index: number, value: string) => {
    const updated = [...newDeliverables];
    updated[index] = value;
    setNewDeliverables(updated);
  };

  const removeDeliverable = (index: number) => {
    setNewDeliverables(newDeliverables.filter((_, i) => i !== index));
  };

  const addCriterion = () => {
    setNewAcceptanceCriteria([...newAcceptanceCriteria, '']);
  };

  const updateCriterion = (index: number, value: string) => {
    const updated = [...newAcceptanceCriteria];
    updated[index] = value;
    setNewAcceptanceCriteria(updated);
  };

  const removeCriterion = (index: number) => {
    setNewAcceptanceCriteria(newAcceptanceCriteria.filter((_, i) => i !== index));
  };

  const hasAnyChanges = () => {
    return Object.values(changeFlags).some(flag => flag);
  };

  const handleSubmit = async () => {
    if (!hasAnyChanges()) {
      toast.error('Please select at least one field to change');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for requesting changes');
      return;
    }

    try {
      setSubmitting(true);

      // Build changes object with only selected fields
      const changes: MilestoneChanges = {};

      if (changeFlags.name) changes.name = newName;
      if (changeFlags.description) changes.description = newDescription;
      if (changeFlags.estimatedHours) changes.estimatedHours = newEstimatedHours;
      if (changeFlags.milestoneAmount) changes.milestoneAmount = newMilestoneAmount;
      if (changeFlags.dueDate) changes.dueDate = newDueDate;
      if (changeFlags.deliverables) {
        changes.deliverables = newDeliverables.filter(d => d.trim());
      }
      if (changeFlags.acceptanceCriteria) {
        changes.acceptanceCriteria = newAcceptanceCriteria.filter(c => c.trim());
      }

      await createAdjustmentRequest(milestone.id, {
        milestoneId: milestone.id,
        changes,
        reason: reason.trim(),
      });

      toast.success('Adjustment request submitted! Client will review your changes.');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to submit adjustment request:', error);
      toast.error(error.message || 'Failed to submit adjustment request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl max-w-3xl w-full my-8 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Request Milestone Changes</h2>
              <p className="text-sm text-gray-600 mt-1">
                Propose changes to: <span className="font-semibold">{milestone.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Select which fields you want to change</li>
                    <li>Provide updated values and explain why</li>
                    <li>Client reviews and approves/rejects your request</li>
                  </ul>
                </div>
              </div>

              {/* Name */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 font-semibold text-gray-900">
                    <FileText className="w-4 h-4 text-gray-600" />
                    Milestone Name
                  </label>
                  <button
                    onClick={() => handleToggleChange('name')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      changeFlags.name
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {changeFlags.name ? 'Changing' : 'Change'}
                  </button>
                </div>
                {changeFlags.name ? (
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new milestone name"
                  />
                ) : (
                  <p className="text-gray-600 text-sm">{milestone.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 font-semibold text-gray-900">
                    <FileText className="w-4 h-4 text-gray-600" />
                    Description
                  </label>
                  <button
                    onClick={() => handleToggleChange('description')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      changeFlags.description
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {changeFlags.description ? 'Changing' : 'Change'}
                  </button>
                </div>
                {changeFlags.description ? (
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new description"
                  />
                ) : (
                  <p className="text-gray-600 text-sm">{milestone.description}</p>
                )}
              </div>

              {/* Budget & Timeline */}
              <div className="grid grid-cols-3 gap-4">
                {/* Estimated Hours */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                      <Clock className="w-4 h-4 text-gray-600" />
                      Hours
                    </label>
                    <button
                      onClick={() => handleToggleChange('estimatedHours')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        changeFlags.estimatedHours
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {changeFlags.estimatedHours ? '✓' : 'Edit'}
                    </button>
                  </div>
                  {changeFlags.estimatedHours ? (
                    <input
                      type="number"
                      value={newEstimatedHours}
                      onChange={(e) => setNewEstimatedHours(parseFloat(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{milestone.estimatedHours}h</p>
                  )}
                </div>

                {/* Budget */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                      Budget
                    </label>
                    <button
                      onClick={() => handleToggleChange('milestoneAmount')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        changeFlags.milestoneAmount
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {changeFlags.milestoneAmount ? '✓' : 'Edit'}
                    </button>
                  </div>
                  {changeFlags.milestoneAmount ? (
                    <input
                      type="number"
                      value={newMilestoneAmount}
                      onChange={(e) => setNewMilestoneAmount(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      ${milestone.milestoneAmount}
                    </p>
                  )}
                </div>

                {/* Due Date */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      Due Date
                    </label>
                    <button
                      onClick={() => handleToggleChange('dueDate')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        changeFlags.dueDate
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {changeFlags.dueDate ? '✓' : 'Edit'}
                    </button>
                  </div>
                  {changeFlags.dueDate ? (
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">
                      {milestone.dueDate || 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              {/* Deliverables */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 font-semibold text-gray-900">
                    <CheckCircle className="w-4 h-4 text-gray-600" />
                    Deliverables
                  </label>
                  <button
                    onClick={() => handleToggleChange('deliverables')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      changeFlags.deliverables
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {changeFlags.deliverables ? 'Changing' : 'Change'}
                  </button>
                </div>
                {changeFlags.deliverables ? (
                  <div className="space-y-2">
                    {newDeliverables.map((deliverable, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={deliverable}
                          onChange={(e) => updateDeliverable(idx, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Deliverable"
                        />
                        <button
                          onClick={() => removeDeliverable(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addDeliverable}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Deliverable
                    </button>
                  </div>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {milestone.deliverables.map((d, idx) => (
                      <li key={idx} className="text-gray-600 text-sm">
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Acceptance Criteria */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 font-semibold text-gray-900">
                    <CheckCircle className="w-4 h-4 text-gray-600" />
                    Acceptance Criteria
                  </label>
                  <button
                    onClick={() => handleToggleChange('acceptanceCriteria')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      changeFlags.acceptanceCriteria
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {changeFlags.acceptanceCriteria ? 'Changing' : 'Change'}
                  </button>
                </div>
                {changeFlags.acceptanceCriteria ? (
                  <div className="space-y-2">
                    {newAcceptanceCriteria.map((criterion, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={criterion}
                          onChange={(e) => updateCriterion(idx, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Criterion"
                        />
                        <button
                          onClick={() => removeCriterion(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addCriterion}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Criterion
                    </button>
                  </div>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {milestone.acceptanceCriteria.map((c, idx) => (
                      <li key={idx} className="text-gray-600 text-sm">
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Reason for Changes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain why these changes are needed. Be specific and professional (e.g., 'Discovered additional complexity in the API integration that requires 10 more hours...')"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The client will review your reason before approving changes
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {hasAnyChanges() ? (
                <span className="text-green-600 font-medium">
                  {Object.values(changeFlags).filter(Boolean).length} field(s) selected
                </span>
              ) : (
                <span className="text-gray-500">No changes selected</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !hasAnyChanges() || !reason.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>Submit Request</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
