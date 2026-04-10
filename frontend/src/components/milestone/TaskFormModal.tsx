import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar as CalendarIcon, Flag, Tag, User, Loader2, ChevronDown, GitBranch } from 'lucide-react';
import { getProjectTeam } from '@/services/teamMemberService';
import type { TeamMember } from '@/types/teamMember';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'initialized' | 'inprogress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  parent_task_id?: string;
}

interface TaskFormData {
  title: string;
  description: string;
  taskType: string;
  priority: 'low' | 'medium' | 'high';
  status: 'initialized' | 'inprogress' | 'done';
  assignedTo: string;
  dueDate: string;
  estimatedHours: string;
  tags: string[];
  parentTaskId: string;
}

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  editingTask?: Task | null;
  projectId?: string;
  availableTasks?: Task[]; // List of tasks that can be parents
  preselectedParentTaskId?: string; // For when creating subtask from task card
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTask,
  projectId,
  availableTasks = [],
  preselectedParentTaskId,
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    taskType: 'feature',
    priority: 'medium',
    status: 'initialized',
    assignedTo: '',
    dueDate: '',
    estimatedHours: '',
    tags: [],
    parentTaskId: '',
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);

  // Get tasks that can be parents (tasks without a parent_task_id and not the current editing task)
  const parentableTasks = availableTasks.filter(
    (task) => !task.parent_task_id && task.id !== editingTask?.id
  );

  // Fetch team members when modal opens
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!isOpen || !projectId) return;

      setLoadingTeamMembers(true);
      try {
        const members = await getProjectTeam(projectId);
        setTeamMembers(members);
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        setTeamMembers([]);
      } finally {
        setLoadingTeamMembers(false);
      }
    };

    fetchTeamMembers();
  }, [isOpen, projectId]);

  // Populate form when editing or when preselected parent is set
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || '',
        taskType: 'feature', // Default since not in mock data
        priority: editingTask.priority || 'medium',
        status: editingTask.status,
        assignedTo: editingTask.assignedTo || '',
        dueDate: editingTask.dueDate || '',
        estimatedHours: '', // Default since not in mock data
        tags: editingTask.tags || [],
        parentTaskId: editingTask.parent_task_id || '',
      });
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        taskType: 'feature',
        priority: 'medium',
        status: 'initialized',
        assignedTo: '',
        dueDate: '',
        estimatedHours: '',
        tags: [],
        parentTaskId: preselectedParentTaskId || '',
      });
    }
    setErrors({});
  }, [editingTask, isOpen, preselectedParentTaskId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.taskType) {
      newErrors.taskType = 'Task type is required';
    }

    if (formData.estimatedHours && isNaN(Number(formData.estimatedHours))) {
      newErrors.estimatedHours = 'Must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Check if this task is being created as a subtask
  const isCreatingSubtask = !!formData.parentTaskId;
  const parentTask = parentableTasks.find((t) => t.id === formData.parentTaskId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative"
        >
          {/* Loading Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900">
                  {editingTask ? 'Updating task...' : 'Creating task...'}
                </p>
                <p className="text-sm text-gray-600 mt-1">Please wait</p>
              </div>
            </div>
          )}
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {isCreatingSubtask && !editingTask && (
                  <GitBranch className="w-6 h-6 text-indigo-600" />
                )}
                {editingTask ? 'Edit Task' : isCreatingSubtask ? 'Create Subtask' : 'Create New Task'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {editingTask
                  ? 'Update task details'
                  : isCreatingSubtask
                  ? `Creating subtask under "${parentTask?.title}"`
                  : 'Add a new task to this milestone'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Parent Task Dropdown - Only show when creating new task and there are parentable tasks */}
            {!editingTask && parentableTasks.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <GitBranch className="w-4 h-4" />
                  <span>Parent Task</span>
                  <span className="text-xs font-normal text-gray-500">(optional - makes this a subtask)</span>
                </label>
                <div className="relative">
                  <select
                    name="parentTaskId"
                    value={formData.parentTaskId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all appearance-none bg-white pr-10"
                  >
                    <option value="">No parent (standalone task)</option>
                    {parentableTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title} ({task.status === 'done' ? 'Done' : task.status === 'inprogress' ? 'In Progress' : 'To Do'})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                {formData.parentTaskId && (
                  <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    This task will be created as a subtask
                  </p>
                )}
              </div>
            )}

            {/* Show parent task info when editing a subtask */}
            {editingTask?.parent_task_id && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-indigo-700">
                  <GitBranch className="w-4 h-4" />
                  <span className="text-sm font-medium">This is a subtask</span>
                </div>
                <p className="text-sm text-indigo-600 mt-1">
                  Parent: {parentableTasks.find((t) => t.id === editingTask.parent_task_id)?.title || 'Unknown'}
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="e.g., Implement user authentication"
                className={`w-full px-4 py-3 border-2 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                } rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                placeholder="Describe the task in detail..."
                height={150}
                minHeight={100}
                disabled={isSubmitting}
              />
            </div>

            {/* Task Type & Priority - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Task Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="taskType"
                  value={formData.taskType}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 ${
                    errors.taskType ? 'border-red-500' : 'border-gray-300'
                  } rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none bg-white`}
                >
                  <option value="feature">Feature</option>
                  <option value="bug">Bug Fix</option>
                  <option value="enhancement">Enhancement</option>
                  <option value="documentation">Documentation</option>
                </select>
                {errors.taskType && <p className="text-red-500 text-sm mt-1">{errors.taskType}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <Flag className="w-4 h-4" />
                  <span>Priority</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Status & Assigned To - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none bg-white"
                >
                  <option value="initialized">Initialized</option>
                  <option value="inprogress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Assigned To</span>
                </label>
                <div className="relative">
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    disabled={loadingTeamMembers}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                  >
                    <option value="">
                      {loadingTeamMembers ? 'Loading team members...' : 'Select team member'}
                    </option>
                    {teamMembers.map((member) => (
                      <option key={member.user_id || member.id} value={member.user_id || member.id}>
                        {member.name} {member.role ? `(${member.role})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {loadingTeamMembers ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {teamMembers.length === 0 && !loadingTeamMembers && (
                  <p className="text-xs text-gray-500 mt-1">
                    No team members assigned to this project yet
                  </p>
                )}
              </div>
            </div>

            {/* Due Date & Estimated Hours - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Due Date</span>
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  placeholder="e.g., 8"
                  min="0"
                  step="0.5"
                  className={`w-full px-4 py-3 border-2 ${
                    errors.estimatedHours ? 'border-red-500' : 'border-gray-300'
                  } rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                />
                {errors.estimatedHours && (
                  <p className="text-red-500 text-sm mt-1">{errors.estimatedHours}</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Tags</span>
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag..."
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center space-x-2"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-3 ${
                isCreatingSubtask && !editingTask
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600'
              } text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{editingTask ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  {isCreatingSubtask && !editingTask && <GitBranch className="w-4 h-4" />}
                  <span>{editingTask ? 'Update Task' : isCreatingSubtask ? 'Create Subtask' : 'Create Task'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
