/**
 * Complete Workspace Selector Example
 * Shows all features and integration patterns
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceSelector, DeskiveHeader } from '@/components/workspace';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  Building2,
  Users,
  FolderKanban,
  Settings,
  Plus,
  TrendingUp,
} from 'lucide-react';

// ============================================================================
// Example 1: Basic Workspace Display
// ============================================================================

export function BasicWorkspaceDisplay() {
  const { currentWorkspace, workspaces, isLoading } = useWorkspace();

  if (isLoading) {
    return <div className="p-4">Loading workspaces...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Workspaces</h2>

      {/* Current Workspace */}
      {currentWorkspace && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold">Current Workspace</h3>
          <p className="text-lg">{currentWorkspace.name}</p>
          <p className="text-sm text-gray-600">{currentWorkspace.description}</p>
        </div>
      )}

      {/* All Workspaces */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold">{workspace.name}</h3>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{workspace.member_count || 0} members</span>
              </div>
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-4 h-4" />
                <span>{workspace.project_count || 0} projects</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Example 2: Complete Dashboard with Workspace Selector
// ============================================================================

export function WorkspaceDashboard() {
  const { currentWorkspace, workspaceId } = useWorkspace();
  const { workspaceStats, fetchWorkspaceStats, isLoadingStats } = useWorkspaceStore();

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceStats(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceStats]);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Workspace Selected</h2>
          <p className="text-gray-600 mb-4">Please select a workspace to continue</p>
          <WorkspaceSelector />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DeskiveHeader showWorkspaceSelector={true} />

      <main className="p-8">
        {/* Workspace Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentWorkspace.name}
              </h1>
              {currentWorkspace.description && (
                <p className="text-gray-600 mt-1">{currentWorkspace.description}</p>
              )}
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {isLoadingStats ? (
          <div className="text-center py-8">Loading stats...</div>
        ) : workspaceStats ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              icon={<FolderKanban className="w-6 h-6" />}
              label="Total Projects"
              value={workspaceStats.total_projects}
              color="blue"
            />
            <StatCard
              icon={<Users className="w-6 h-6" />}
              label="Team Members"
              value={workspaceStats.total_members}
              color="green"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Active Projects"
              value={workspaceStats.active_projects}
              color="purple"
            />
            <StatCard
              icon={<Settings className="w-6 h-6" />}
              label="Completed Tasks"
              value={workspaceStats.completed_tasks}
              color="orange"
            />
          </div>
        ) : null}

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <ActivityItem
              action="Project created"
              project="Website Redesign"
              time="2 hours ago"
            />
            <ActivityItem
              action="Member added"
              project="Sarah Johnson joined the workspace"
              time="5 hours ago"
            />
            <ActivityItem
              action="Task completed"
              project="Design mockups finished"
              time="1 day ago"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Example 3: Create Workspace Form
// ============================================================================

export function CreateWorkspaceForm() {
  const navigate = useNavigate();
  const { createWorkspace } = useWorkspaceStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const workspace = await createWorkspace(formData);
      navigate(`/workspace/${workspace.id}/dashboard`);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      alert('Failed to create workspace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Workspace</h1>
          <p className="text-gray-600">Set up a new workspace for your team</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Workspace Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Marketing Team"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Workspace Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace URL (optional)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., marketing-team"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              deskive.com/workspace/{formData.slug || 'your-workspace'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your workspace"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Workspace Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Color
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-12 rounded-lg cursor-pointer"
              />
              <span className="text-sm text-gray-600">Choose a brand color</span>
            </div>
          </div>


          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

interface ActivityItemProps {
  action: string;
  project: string;
  time: string;
}

function ActivityItem({ action, project, time }: ActivityItemProps) {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
      <div className="flex-1">
        <div className="text-sm text-gray-900">
          <span className="font-semibold">{action}</span> - {project}
        </div>
        <div className="text-xs text-gray-500 mt-1">{time}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Export all examples
// ============================================================================

export default {
  BasicWorkspaceDisplay,
  WorkspaceDashboard,
  CreateWorkspaceForm,
};
