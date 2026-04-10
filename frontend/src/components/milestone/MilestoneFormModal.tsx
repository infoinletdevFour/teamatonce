import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, DollarSign, Package, CheckSquare, Clock } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';

export type MilestoneType = 'planning' | 'design' | 'development' | 'testing' | 'deployment' | 'maintenance';

export interface MilestoneFormData {
  name: string;
  description: string;
  milestoneType: MilestoneType;
  orderIndex: number;
  deliverables: string[];
  acceptanceCriteria: string[];
  estimatedHours?: number;
  dueDate?: string;
  milestoneAmount?: number;
}

interface MilestoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MilestoneFormData) => Promise<void>;
  initialData?: Partial<MilestoneFormData>;
  isLoading?: boolean;
  existingMilestones?: number; // For auto-calculating orderIndex
}

const milestoneTypes: { value: MilestoneType; label: string; description: string }[] = [
  { value: 'planning', label: 'Planning', description: 'Project planning and requirements' },
  { value: 'design', label: 'Design', description: 'UI/UX and architecture design' },
  { value: 'development', label: 'Development', description: 'Core development and coding' },
  { value: 'testing', label: 'Testing', description: 'QA, testing, and bug fixes' },
  { value: 'deployment', label: 'Deployment', description: 'Deployment and launch' },
  { value: 'maintenance', label: 'Maintenance', description: 'Post-launch maintenance' },
];

export const MilestoneFormModal: React.FC<MilestoneFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  existingMilestones = 0,
}) => {
  const [formData, setFormData] = useState<MilestoneFormData>({
    name: '',
    description: '',
    milestoneType: 'development',
    orderIndex: existingMilestones + 1,
    deliverables: [],
    acceptanceCriteria: [],
    estimatedHours: undefined,
    dueDate: '',
    milestoneAmount: undefined,
  });

  const [deliverableInput, setDeliverableInput] = useState('');
  const [criteriaInput, setCriteriaInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Helper function to convert ISO date to yyyy-MM-dd format
  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Load initial data when editing
  useEffect(() => {
    if (isOpen) {
      // Scroll to top when modal opens
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollTop = 0;
        }
      }, 100);

      if (initialData) {
        console.log('Loading initial data for edit:', initialData);
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          milestoneType: initialData.milestoneType || 'development',
          orderIndex: initialData.orderIndex || existingMilestones + 1,
          deliverables: initialData.deliverables || [],
          acceptanceCriteria: initialData.acceptanceCriteria || [],
          estimatedHours: initialData.estimatedHours,
          dueDate: formatDateForInput(initialData.dueDate),
          milestoneAmount: initialData.milestoneAmount,
        });
      } else {
        // Reset for new milestone
        setFormData({
          name: '',
          description: '',
          milestoneType: 'development',
          orderIndex: existingMilestones + 1,
          deliverables: [],
          acceptanceCriteria: [],
          estimatedHours: undefined,
          dueDate: '',
          milestoneAmount: undefined,
        });
      }
      setError(null);
    }
  }, [initialData, existingMilestones, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Milestone name is required');
      return;
    }

    if (formData.orderIndex < 1) {
      setError('Order index must be at least 1');
      return;
    }

    if (!formData.milestoneAmount || formData.milestoneAmount <= 0) {
      setError('Milestone amount is required and must be greater than 0');
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save milestone');
    }
  };

  const addDeliverable = () => {
    if (deliverableInput.trim() && !formData.deliverables.includes(deliverableInput.trim())) {
      setFormData({
        ...formData,
        deliverables: [...formData.deliverables, deliverableInput.trim()],
      });
      setDeliverableInput('');
    }
  };

  const removeDeliverable = (index: number) => {
    setFormData({
      ...formData,
      deliverables: formData.deliverables.filter((_, i) => i !== index),
    });
  };

  const addCriteria = () => {
    if (criteriaInput.trim() && !formData.acceptanceCriteria.includes(criteriaInput.trim())) {
      setFormData({
        ...formData,
        acceptanceCriteria: [...formData.acceptanceCriteria, criteriaInput.trim()],
      });
      setCriteriaInput('');
    }
  };

  const removeCriteria = (index: number) => {
    setFormData({
      ...formData,
      acceptanceCriteria: formData.acceptanceCriteria.filter((_, i) => i !== index),
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Milestone' : 'Create New Milestone'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="px-6 py-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Milestone Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="e.g., Core API Development"
                required
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Describe what this milestone entails..."
                height={150}
                minHeight={100}
                disabled={isLoading}
              />
            </div>

            {/* Milestone Type & Order Index */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Milestone Type *
                </label>
                <select
                  value={formData.milestoneType}
                  onChange={(e) =>
                    setFormData({ ...formData, milestoneType: e.target.value as MilestoneType })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  required
                  disabled={isLoading}
                >
                  {milestoneTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {milestoneTypes.find((t) => t.value === formData.milestoneType)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Order Index *
                </label>
                <input
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) =>
                    setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  min="1"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Sequence in project timeline</p>
              </div>
            </div>

            {/* Due Date, Hours, Amount */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Est. Hours
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="0"
                  min="0"
                  step="0.5"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.milestoneAmount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      milestoneAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Deliverables
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={deliverableInput}
                  onChange={(e) => setDeliverableInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="Add deliverable (press Enter)"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={addDeliverable}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium"
                  disabled={isLoading}
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.deliverables.map((deliverable, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                  >
                    {deliverable}
                    <button
                      type="button"
                      onClick={() => removeDeliverable(index)}
                      className="hover:text-blue-900"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Acceptance Criteria
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={criteriaInput}
                  onChange={(e) => setCriteriaInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCriteria())}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="Add acceptance criteria (press Enter)"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={addCriteria}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-medium"
                  disabled={isLoading}
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.acceptanceCriteria.map((criteria, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm"
                  >
                    {criteria}
                    <button
                      type="button"
                      onClick={() => removeCriteria(index)}
                      className="hover:text-green-900"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Milestone' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default MilestoneFormModal;
