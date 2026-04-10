/**
 * SubmitMilestoneModal Integration Example
 *
 * This file demonstrates how to integrate the SubmitMilestoneModal component
 * into a parent component. Copy and adapt this code for your needs.
 */

import React, { useState } from 'react';
import { SubmitMilestoneModal } from './SubmitMilestoneModal';
import { Milestone, MilestoneStatus } from '@/types/milestone';
import { apiClient } from '@/lib/api-client';

export const MilestoneActionsExample: React.FC = () => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Example milestone data
  const exampleMilestone: Milestone = {
    id: 'milestone-123',
    title: 'Core API Development',
    description: 'Develop RESTful API endpoints for user management and authentication',
    status: 'in_progress' as MilestoneStatus,
    dueDate: '2024-12-31',
    progress: 90,
    amount: 5000,
    deliverables: ['User API endpoints', 'Authentication system', 'API documentation'],
    acceptanceCriteria: ['All tests passing', 'Code review completed', 'Documentation updated'],
    estimatedHours: 80,
    milestoneType: 'development',
    orderIndex: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };

  /**
   * Handle submit milestone action
   * This function will be called when the developer clicks "Submit for Review"
   */
  const handleSubmitMilestone = async (notes?: string) => {
    if (!selectedMilestone) return;

    setIsSubmitting(true);

    try {
      // API call to submit milestone
      const response = await apiClient.put(
        `/projects/milestones/${selectedMilestone.id}/submit`,
        {
          notes: notes,
          submittedAt: new Date().toISOString(),
        }
      );

      // Success handling
      console.log('Milestone submitted successfully:', response.data);

      // Show success notification (using your notification system)
      // toast.success('Milestone submitted for review!');

      // Update local state or refetch milestones
      // refreshMilestones();

      // Close modal
      setIsSubmitModalOpen(false);
      setSelectedMilestone(null);
    } catch (error: any) {
      console.error('Failed to submit milestone:', error);

      // Show error notification
      // toast.error(error.response?.data?.message || 'Failed to submit milestone');

      // Don't close modal on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Open submit modal for a specific milestone
   */
  const openSubmitModal = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setIsSubmitModalOpen(true);
  };

  /**
   * Close submit modal
   */
  const closeSubmitModal = () => {
    if (!isSubmitting) {
      setIsSubmitModalOpen(false);
      setSelectedMilestone(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Milestone Management</h1>

      {/* Example: Submit button in milestone card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-2">{exampleMilestone.title}</h3>
        <p className="text-gray-600 mb-4">{exampleMilestone.description}</p>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Progress: {exampleMilestone.progress}%
          </div>

          {/* Submit button - only show when milestone is in_progress */}
          {exampleMilestone.status === 'in_progress' && (
            <button
              onClick={() => openSubmitModal(exampleMilestone)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Submit for Review
            </button>
          )}
        </div>
      </div>

      {/* Submit Milestone Modal */}
      {selectedMilestone && (
        <SubmitMilestoneModal
          isOpen={isSubmitModalOpen}
          onClose={closeSubmitModal}
          onSubmit={handleSubmitMilestone}
          milestone={selectedMilestone}
          loading={isSubmitting}
        />
      )}
    </div>
  );
};

/**
 * ALTERNATIVE INTEGRATION EXAMPLE
 * Using the modal with React Hook Form for form validation
 */
export const MilestoneActionsWithFormExample: React.FC = () => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const handleSubmitWithValidation = async (notes?: string) => {
    if (!selectedMilestone) return;

    // Validate before submitting
    if (selectedMilestone.progress < 100) {
      const confirmSubmit = window.confirm(
        'This milestone is not 100% complete. Are you sure you want to submit it for review?'
      );

      if (!confirmSubmit) {
        return;
      }
    }

    try {
      // Your API call here
      await apiClient.put(
        `/projects/milestones/${selectedMilestone.id}/submit`,
        { notes }
      );

      setIsSubmitModalOpen(false);
      setSelectedMilestone(null);
    } catch (error) {
      console.error('Submission failed:', error);
      throw error; // Re-throw to keep modal open
    }
  };

  return (
    <div>
      {/* Your milestone list/card UI here */}

      {selectedMilestone && (
        <SubmitMilestoneModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSubmit={handleSubmitWithValidation}
          milestone={selectedMilestone}
        />
      )}
    </div>
  );
};

/**
 * INTEGRATION WITH ZUSTAND STORE EXAMPLE
 */
interface MilestoneStore {
  milestones: Milestone[];
  submitMilestone: (milestoneId: string, notes?: string) => Promise<void>;
}

// Example usage with Zustand
export const MilestoneActionsWithStoreExample: React.FC<{
  useMilestoneStore: () => MilestoneStore;
}> = ({ useMilestoneStore }) => {
  const { milestones, submitMilestone } = useMilestoneStore();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const handleSubmit = async (notes?: string) => {
    if (!selectedMilestone) return;

    await submitMilestone(selectedMilestone.id, notes);
    setIsSubmitModalOpen(false);
    setSelectedMilestone(null);
  };

  return (
    <div>
      {milestones.map((milestone) => (
        <div key={milestone.id} className="milestone-card">
          <button onClick={() => {
            setSelectedMilestone(milestone);
            setIsSubmitModalOpen(true);
          }}>
            Submit for Review
          </button>
        </div>
      ))}

      {selectedMilestone && (
        <SubmitMilestoneModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSubmit={handleSubmit}
          milestone={selectedMilestone}
        />
      )}
    </div>
  );
};

export default MilestoneActionsExample;
