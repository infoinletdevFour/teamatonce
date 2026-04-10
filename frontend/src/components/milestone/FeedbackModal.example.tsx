/**
 * FeedbackModal Usage Examples
 *
 * This file demonstrates various ways to use the FeedbackModal component
 * in your application.
 */

import React, { useState } from 'react';
import { FeedbackModal } from './FeedbackModal';
import type { Milestone } from '@/types/milestone';

// ==================== EXAMPLE 1: Basic Usage ====================

export const BasicFeedbackModalExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Example milestone data
  const milestone: Milestone = {
    id: 'milestone-123',
    title: 'Core API Development',
    description: 'Implement RESTful API endpoints with authentication',
    status: 'completed',
    dueDate: '2024-12-31',
    progress: 100,
    amount: 5000,
    deliverables: ['API Documentation', 'Test Suite', 'Deployment Scripts'],
    acceptanceCriteria: ['All endpoints working', 'Test coverage > 80%'],
    estimatedHours: 120,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };

  const handleFeedbackSubmit = async (feedback: string) => {
    console.log('Feedback submitted:', feedback);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Close modal after successful submission
    setIsOpen(false);

    // Show success message (using your preferred notification system)
    alert('Feedback submitted successfully!');
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        Request Changes
      </button>

      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleFeedbackSubmit}
        milestone={milestone}
      />
    </div>
  );
};

// ==================== EXAMPLE 2: With API Integration ====================

export const ApiIntegratedFeedbackModal: React.FC<{ milestoneId: string }> = ({
  milestoneId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [milestone, setMilestone] = useState<Milestone | null>(null);

  // Fetch milestone data
  const fetchMilestone = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/milestones/${milestoneId}`);
      const data = await response.json();
      setMilestone(data);
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to fetch milestone:', error);
      alert('Failed to load milestone data');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (feedback: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/milestones/${milestoneId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsOpen(false);
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error; // Re-throw to show error in modal
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={fetchMilestone}
        disabled={loading}
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Request Changes'}
      </button>

      {milestone && (
        <FeedbackModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSubmit={handleFeedbackSubmit}
          milestone={milestone}
          loading={loading}
        />
      )}
    </div>
  );
};

// ==================== EXAMPLE 3: With React Hook Form ====================

export const FeedbackModalWithValidation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const milestone: Milestone = {
    id: 'milestone-789',
    title: 'UI/UX Design Phase',
    description: 'Complete design mockups and prototypes',
    status: 'completed',
    dueDate: '2024-11-30',
    progress: 100,
    amount: 3000,
    deliverables: ['Figma Designs', 'Style Guide', 'Prototype'],
    acceptanceCriteria: ['All screens designed', 'Client approval received'],
    estimatedHours: 80,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  };

  const onSubmit = async (feedback: string) => {
    // Validate feedback length
    if (feedback.length < 10) {
      throw new Error('Feedback must be at least 10 characters long');
    }

    if (feedback.length > 1000) {
      throw new Error('Feedback must be less than 1000 characters');
    }

    // Submit to API
    console.log('Submitting feedback:', feedback);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsOpen(false);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        Request Changes
      </button>

      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={onSubmit}
        milestone={milestone}
      />
    </div>
  );
};

// ==================== EXAMPLE 4: In a Milestone List ====================

export const MilestoneListWithFeedback: React.FC = () => {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Example milestones
  const milestones: Milestone[] = [
    {
      id: 'milestone-1',
      title: 'Project Planning',
      description: '',
      status: 'approved',
      dueDate: null,
      progress: 100,
      amount: null,
      deliverables: [],
      acceptanceCriteria: [],
      estimatedHours: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z',
    },
    {
      id: 'milestone-2',
      title: 'Core Development',
      description: '',
      status: 'completed',
      dueDate: null,
      progress: 100,
      amount: null,
      deliverables: [],
      acceptanceCriteria: [],
      estimatedHours: null,
      createdAt: '2024-01-06T00:00:00Z',
      updatedAt: '2024-01-20T00:00:00Z',
    },
  ];

  const handleRequestChanges = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setIsFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async (feedback: string) => {
    if (!selectedMilestone) return;

    console.log(`Feedback for ${selectedMilestone.title}:`, feedback);

    // Submit to API
    await fetch(`/api/milestones/${selectedMilestone.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });

    setIsFeedbackModalOpen(false);
    setSelectedMilestone(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Project Milestones</h2>

      {milestones.map((milestone) => (
        <div key={milestone.id} className="p-4 border rounded-lg">
          <h3 className="font-bold">{milestone.title}</h3>
          <p className="text-sm text-gray-600">Status: {milestone.status}</p>

          {milestone.status === 'completed' && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleRequestChanges(milestone)}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Request Changes
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Approve
              </button>
            </div>
          )}
        </div>
      ))}

      {selectedMilestone && (
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => {
            setIsFeedbackModalOpen(false);
            setSelectedMilestone(null);
          }}
          onSubmit={handleFeedbackSubmit}
          milestone={selectedMilestone}
        />
      )}
    </div>
  );
};

// ==================== EXAMPLE 5: With Toast Notifications ====================

import { toast } from 'sonner';

export const FeedbackModalWithToast: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const milestone: Milestone = {
    id: 'milestone-999',
    title: 'Final Testing & QA',
    description: 'Comprehensive testing and bug fixes',
    status: 'completed',
    dueDate: '2024-12-15',
    progress: 100,
    amount: 2500,
    deliverables: ['Test Reports', 'Bug Fixes', 'Performance Report'],
    acceptanceCriteria: ['All tests passing', 'No critical bugs'],
    estimatedHours: 60,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-25T00:00:00Z',
  };

  const handleFeedbackSubmit = async () => {
    try {
      // Show loading toast
      toast.loading('Submitting feedback...', { id: 'feedback-submit' });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success
      toast.success('Feedback submitted successfully!', { id: 'feedback-submit' });
      setIsOpen(false);
    } catch (error) {
      // Error
      toast.error('Failed to submit feedback. Please try again.', { id: 'feedback-submit' });
      throw error; // Re-throw to keep modal open
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        Request Changes
      </button>

      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleFeedbackSubmit}
        milestone={milestone}
      />
    </div>
  );
};
