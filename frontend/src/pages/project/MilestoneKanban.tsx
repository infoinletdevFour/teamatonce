import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  MoreVertical,
  FileText,
  User,
  GitBranch,
  Link2,
  Settings,
} from 'lucide-react';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { TaskFormModal } from '@/components/milestone/TaskFormModal';
import { MilestoneAdjustmentRequestModal } from '@/components/MilestoneAdjustmentRequestModal';
import * as taskService from '@/services/taskService';
import { getProjectMilestones, getMilestone, getProject } from '@/services/projectService';
import { socketClient } from '@/lib/websocket-client';

// Types
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'initialized' | 'inprogress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  assigned_to_name?: string;
  dueDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  updated_by?: string;
  updated_by_name?: string;
  milestoneId?: string;
  projectId?: string;
  parent_task_id?: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: string;
}

type ColumnId = 'initialized' | 'inprogress' | 'done';

interface Column {
  id: ColumnId;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const columns: Column[] = [
  {
    id: 'initialized',
    title: 'To Do',
    color: 'text-blue-700',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    textColor: 'text-blue-600',
  },
  {
    id: 'inprogress',
    title: 'In Progress',
    color: 'text-yellow-700',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    textColor: 'text-yellow-600',
  },
  {
    id: 'done',
    title: 'Done',
    color: 'text-green-700',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    textColor: 'text-green-600',
  },
];

const getColumnDotColor = (columnId: ColumnId) => {
  switch (columnId) {
    case 'initialized':
      return 'bg-blue-500';
    case 'inprogress':
      return 'bg-yellow-500';
    case 'done':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const getColumnCountBgColor = (columnId: ColumnId) => {
  switch (columnId) {
    case 'initialized':
      return 'bg-gray-100 text-gray-700';
    case 'inprogress':
      return 'bg-gray-100 text-gray-700';
    case 'done':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// SVG Connection Lines Component
const ConnectionLines: React.FC<{
  tasks: Task[];
  cardRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
  containerRef: React.RefObject<HTMLDivElement>;
  isDragging: boolean;
}> = ({ tasks, cardRefs, containerRef, isDragging }) => {
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; id: string }[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const updateLines = useCallback(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines: { x1: number; y1: number; x2: number; y2: number; id: string }[] = [];

    tasks.forEach((task) => {
      if (task.parent_task_id) {
        const parentCard = cardRefs.current.get(task.parent_task_id);
        const childCard = cardRefs.current.get(task.id);

        if (parentCard && childCard) {
          const parentRect = parentCard.getBoundingClientRect();
          const childRect = childCard.getBoundingClientRect();

          // Calculate positions relative to container
          const x1 = parentRect.right - containerRect.left;
          const y1 = parentRect.top + parentRect.height / 2 - containerRect.top;
          const x2 = childRect.left - containerRect.left;
          const y2 = childRect.top + childRect.height / 2 - containerRect.top;

          newLines.push({
            x1,
            y1,
            x2,
            y2,
            id: `${task.parent_task_id}-${task.id}`,
          });
        }
      }
    });

    setLines(newLines);
  }, [tasks, cardRefs, containerRef]);

  // Continuous update loop during drag
  useEffect(() => {
    if (isDragging) {
      const animate = () => {
        updateLines();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Final update when drag ends
      updateLines();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, updateLines]);

  useEffect(() => {
    updateLines();
    // Update lines on resize
    window.addEventListener('resize', updateLines);
    // Also update after a short delay to handle layout changes
    const timeout = setTimeout(updateLines, 100);
    return () => {
      window.removeEventListener('resize', updateLines);
      clearTimeout(timeout);
    };
  }, [updateLines, tasks]);

  if (lines.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
        </marker>
      </defs>
      {lines.map((line) => {
        // Calculate control points for a smooth curve
        const midX = (line.x1 + line.x2) / 2;
        const path = `M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`;

        return (
          <g key={line.id}>
            {/* Shadow/glow effect */}
            <path
              d={path}
              fill="none"
              stroke="#6366f1"
              strokeWidth="4"
              strokeOpacity="0.2"
            />
            {/* Main line */}
            <path
              d={path}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              strokeDasharray="8,4"
              markerEnd="url(#arrowhead)"
              style={{ transition: isDragging ? 'none' : 'd 0.2s ease-out' }}
            />
          </g>
        );
      })}
    </svg>
  );
};

export const MilestoneKanban: React.FC = () => {
  const { projectId, milestoneId } = useParams<{ projectId: string; milestoneId: string }>();
  const { companyId } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [project, setProject] = useState<any>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [preselectedParentTaskId, setPreselectedParentTaskId] = useState<string | undefined>();
  const [showConnections, setShowConnections] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  // Role checking
  const isClient = project?.clientId === user?.id || project?.client_id === user?.id;
  const isDeveloper = !isClient; // If not client, then developer/team member

  // Refs for SVG connections
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // Load milestone and tasks from API
  const loadData = useCallback(async () => {
    if (!projectId || !milestoneId) return;

    setLoading(true);
    try {
      // Load project details for role checking
      const projectData = await getProject(projectId);
      setProject(projectData);

      // Load full milestone details
      const currentMilestone = await getMilestone(milestoneId);

      if (currentMilestone) {
        setMilestone({
          id: currentMilestone.id,
          title: currentMilestone.name || currentMilestone.title || '',
          description: currentMilestone.description || '',
          status: currentMilestone.status,
        });
      }

      // Load tasks for this milestone
      const tasksData = await taskService.getMilestoneTasks(projectId, milestoneId);
      setTasks(tasksData as any);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load milestone data', {
        description: error.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, milestoneId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // WEBSOCKET REAL-TIME UPDATES
  // ============================================

  useEffect(() => {
    if (!projectId || !user?.id) return;

    // Connect to WebSocket and join project room
    socketClient.connect(user.id, projectId);
    socketClient.joinRoom(`project-${projectId}`);

    // Handle task created
    socketClient.onTaskCreated((data) => {
      // Only handle tasks for this milestone
      if (data.task?.milestoneId === milestoneId || data.task?.milestone_id === milestoneId) {
        setTasks((prev) => {
          // Check if task already exists
          const exists = prev.some((t) => t.id === data.task.id);
          if (exists) return prev;
          return [...prev, data.task];
        });

        // Show toast if created by someone else
        if (data.userId !== user.id) {
          toast.info('New task created', {
            description: `"${data.task.title}" was added`,
          });
        }
      }
    });

    // Handle task updated
    socketClient.onTaskUpdated((data) => {
      // Handle tasks for this milestone
      if (data.task?.milestoneId === milestoneId || data.task?.milestone_id === milestoneId) {
        setTasks((prev) =>
          prev.map((t) => (t.id === data.task.id ? { ...t, ...data.task } : t))
        );

        if (data.userId !== user.id) {
          toast.info('Task updated', {
            description: `"${data.task.title}" was modified`,
          });
        }
      }
    });

    // Handle task deleted
    socketClient.onTaskDeleted((data) => {
      // Only handle tasks for this milestone
      if (data.milestoneId === milestoneId || data.milestone_id === milestoneId) {
        setTasks((prev) => prev.filter((t) => t.id !== data.taskId));

        if (data.userId !== user.id) {
          toast.info('Task deleted', {
            description: 'A task was removed',
          });
        }
      }
    });

    // Handle task assigned
    socketClient.onTaskAssigned((data) => {
      // Handle tasks for this milestone
      if (data.task?.milestoneId === milestoneId || data.task?.milestone_id === milestoneId) {
        setTasks((prev) =>
          prev.map((t) => (t.id === data.task.id ? { ...t, ...data.task } : t))
        );

        if (data.assignedBy !== user.id) {
          const isAssignedToMe = data.assignedTo === user.id;
          toast.info(isAssignedToMe ? 'Task assigned to you' : 'Task assignment changed', {
            description: `"${data.task.title}" was ${isAssignedToMe ? 'assigned to you' : 'reassigned'}`,
          });
        }
      }
    });

    // Cleanup on unmount
    return () => {
      socketClient.offTaskEvents();
    };
  }, [projectId, milestoneId, user?.id]);

  // Drag Start Handler
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Drag and Drop Handler
  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId as ColumnId;
    const taskId = draggableId;

    if (!projectId) return;

    // Optimistic update
    const originalTasks = [...tasks];
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    setTasks(updatedTasks);

    try {
      // Call API to update task status
      await taskService.updateTaskStatus(projectId, taskId, newStatus);
      toast.success('Task moved successfully');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to move task');
      // Revert the change
      setTasks(originalTasks);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    if (!projectId) return;

    // Check if task has subtasks
    const hasSubtasks = tasks.some((t) => t.parent_task_id === taskId);
    if (hasSubtasks) {
      toast.error('Cannot delete task with subtasks', {
        description: 'Please delete the subtasks first',
      });
      return;
    }

    // Optimistic update
    const originalTasks = [...tasks];
    setTasks(tasks.filter((t) => t.id !== taskId));

    try {
      await taskService.deleteTask(projectId, taskId);
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
      // Revert the change
      setTasks(originalTasks);
    }
  };

  const handleSubmitTask = async (formData: any) => {
    if (!projectId || !milestoneId) return;

    try {
      if (editingTask) {
        // Update existing task
        const updatedTask = await taskService.updateTask(projectId, editingTask.id, {
          title: formData.title,
          description: formData.description,
          taskType: formData.taskType,
          priority: formData.priority,
          status: formData.status,
          assignedTo: formData.assignedTo,
          estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
          dueDate: formData.dueDate,
          tags: formData.tags,
        });

        setTasks(tasks.map((task) => (task.id === editingTask.id ? (updatedTask as any) : task)));
        toast.success('Task updated successfully');
      } else {
        // Create new task (or subtask)
        const taskData: taskService.CreateTaskDto = {
          title: formData.title,
          description: formData.description,
          taskType: formData.taskType,
          priority: formData.priority,
          assignedTo: formData.assignedTo,
          estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
          dueDate: formData.dueDate,
          tags: formData.tags,
        };

        // Add parentTaskId if creating a subtask
        if (formData.parentTaskId) {
          taskData.parentTaskId = formData.parentTaskId;
        }

        const newTask = await taskService.createTask(projectId, milestoneId, taskData);

        setTasks([...tasks, newTask as any]);
        toast.success(formData.parentTaskId ? 'Subtask created successfully' : 'Task created successfully');
      }
    } catch (error: any) {
      console.error('Failed to submit task:', error);
      toast.error('Failed to save task', {
        description: error.message || 'Please try again',
      });
      throw error;
    } finally {
      setPreselectedParentTaskId(undefined);
    }
  };

  const handleCreateSubtask = (parentTask: Task) => {
    // Check if task is already a subtask - can't create nested subtasks
    if (parentTask.parent_task_id) {
      toast.error('Cannot create nested subtasks', {
        description: 'This task is already a subtask',
      });
      return;
    }
    setPreselectedParentTaskId(parentTask.id);
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get parent task title for a subtask
  const getParentTaskTitle = (parentTaskId: string) => {
    const parentTask = tasks.find((t) => t.id === parentTaskId);
    return parentTask?.title || 'Unknown';
  };

  // Check if task can be a parent (doesn't have a parent itself)
  const canBeParent = (task: Task) => !task.parent_task_id;

  // Get subtask count for a task
  const getSubtaskCount = (taskId: string) => {
    return tasks.filter((t) => t.parent_task_id === taskId).length;
  };

  // Check if there are any subtask relationships
  const hasSubtaskRelationships = tasks.some((t) => t.parent_task_id);

  // Set card ref
  const setCardRef = (taskId: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(taskId, element);
    } else {
      cardRefs.current.delete(taskId);
    }
  };

  if (loading) {
    return (
      <ProjectPageLayout title="Loading..." subtitle="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Loading tasks...</p>
          </div>
        </div>
      </ProjectPageLayout>
    );
  }

  // Task Card Component
  const TaskCard = ({ task, index, provided, snapshot }: { task: Task; index: number; provided?: any; snapshot?: any }) => {
    const isSubtask = !!task.parent_task_id;
    const subtaskCount = getSubtaskCount(task.id);

    return (
      <div
        ref={(el) => {
          if (provided?.innerRef) provided.innerRef(el);
          setCardRef(task.id, el);
        }}
        {...provided?.draggableProps}
        {...provided?.dragHandleProps}
        className={`bg-white rounded-xl p-4 border ${
          snapshot?.isDragging ? 'border-blue-400 shadow-lg' : 'border-gray-200'
        } ${isSubtask ? 'border-l-4 border-l-indigo-500' : ''} shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group`}
      >
        {/* Badges Row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {/* Subtask Badge */}
          {isSubtask && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700">
              <GitBranch className="w-3 h-3" />
              Subtask
            </span>
          )}
          {/* Priority Badge */}
          {task.priority && (
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority}
            </span>
          )}
          {/* Subtask Count Badge */}
          {subtaskCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">
              <Link2 className="w-3 h-3" />
              {subtaskCount} subtask{subtaskCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Parent Task Reference */}
        {isSubtask && task.parent_task_id && (
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <span>Parent:</span>
            <span className="font-medium text-gray-700 truncate">{getParentTaskTitle(task.parent_task_id)}</span>
          </div>
        )}

        {/* Task Title */}
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-gray-900 flex-1">{task.title}</h4>
          {/* Developer-only task actions */}
          {isDeveloper && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Add Subtask Button - only show if task can be a parent */}
              {canBeParent(task) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateSubtask(task);
                  }}
                  className="p-1 hover:bg-indigo-100 rounded transition-colors"
                  title="Add subtask"
                >
                  <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTask(task);
                  setPreselectedParentTaskId(undefined);
                  setShowTaskModal(true);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.id);
                }}
                className="p-1 hover:bg-red-100 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* Status with Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <div className="flex items-center space-x-1.5 text-gray-500">
              <div className={`w-2 h-2 rounded-full ${
                task.status === 'done' ? 'bg-green-500' :
                task.status === 'inprogress' ? 'bg-yellow-500' : 'bg-blue-500'
              }`} />
              <span>
                {task.status === 'done' ? 'Completed' :
                 task.status === 'inprogress' ? 'In Progress' : 'To Do'}
              </span>
            </div>
            <span className="text-gray-600 font-medium">
              {task.status === 'done' ? '100' :
               task.status === 'inprogress' ? '67' : '0'}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                task.status === 'done' ? 'bg-green-500 w-full' :
                task.status === 'inprogress' ? 'bg-blue-500 w-2/3' : 'bg-gray-300 w-0'
              }`}
            />
          </div>
        </div>

        {/* Assigned To & Updated By */}
        <div className="flex flex-col gap-1 text-xs text-gray-400">
          {task.assigned_to_name && (
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              <span>Assigned to <span className="text-gray-600 font-medium">{task.assigned_to_name}</span></span>
            </div>
          )}
          <div className="flex items-center">
            <User className="w-3 h-3 mr-1" />
            <span>Updated by <span className="text-gray-600 font-medium">{task.updated_by_name || task.assigned_to_name || 'Unknown'}</span></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProjectPageLayout
      title={milestone?.title || 'Milestone Tasks'}
      subtitle={milestone?.description || 'Manage and track tasks for this milestone'}
      headerActions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/company/${companyId}/project/${projectId}/milestone-approval`)}
            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="w-px h-6 bg-gray-300" />

          {hasSubtaskRelationships && (
            <button
              onClick={() => setShowConnections(!showConnections)}
              className={`px-3 py-1.5 border rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                showConnections
                  ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>{showConnections ? 'Hide' : 'Show'}</span>
            </button>
          )}

          {/* Developer-only actions */}
          {isDeveloper && (
            <>
              <button
                onClick={() => setShowAdjustmentModal(true)}
                className="px-3 py-1.5 bg-white border border-gray-300 text-orange-600 rounded-md text-sm font-medium hover:bg-orange-50 transition-colors flex items-center gap-1.5"
                title="Request changes to budget, timeline, or deliverables"
              >
                <Settings className="w-4 h-4" />
                <span>Request Changes</span>
              </button>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setPreselectedParentTaskId(undefined);
                  setShowTaskModal(true);
                }}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </>
          )}
        </div>
      }
    >
      {/* Kanban Board with Connection Lines */}
      <div ref={containerRef} className="relative">
        {/* SVG Connection Lines */}
        {showConnections && hasSubtaskRelationships && (
          <ConnectionLines
            tasks={tasks}
            cardRefs={cardRefs}
            containerRef={containerRef}
            isDragging={isDragging}
          />
        )}

        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((column) => {
              const columnTasks = tasks.filter((task) => task.status === column.id);

              return (
                <div key={column.id} className="flex flex-col">
                  {/* Column Header */}
                  <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getColumnDotColor(column.id)}`} />
                        <h3 className="font-semibold text-gray-900">{column.title}</h3>
                        <span className={`text-sm px-2.5 py-0.5 rounded-full ${getColumnCountBgColor(column.id)}`}>
                          {columnTasks.length}
                        </span>
                      </div>
                      {/* Developer-only column actions */}
                      {isDeveloper && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingTask(null);
                              setPreselectedParentTaskId(undefined);
                              setShowTaskModal(true);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Add task"
                          >
                            <Plus className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column Body */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 bg-gray-50 rounded-xl border border-gray-200 p-3 min-h-[500px] space-y-3 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : ''
                        }`}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                            isDragDisabled={isClient}
                          >
                            {(provided, snapshot) => (
                              <TaskCard
                                task={task}
                                index={index}
                                provided={provided}
                                snapshot={snapshot}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Empty State */}
                        {columnTasks.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
                            <FileText className="w-12 h-12 mb-3 text-gray-300" />
                            <p className="text-sm text-gray-400">No tasks</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
          setPreselectedParentTaskId(undefined);
        }}
        onSubmit={handleSubmitTask}
        editingTask={editingTask}
        projectId={projectId}
        availableTasks={tasks}
        preselectedParentTaskId={preselectedParentTaskId}
      />

      {/* Milestone Adjustment Request Modal */}
      {milestone && milestoneId && (
        <MilestoneAdjustmentRequestModal
          isOpen={showAdjustmentModal}
          onClose={() => setShowAdjustmentModal(false)}
          milestone={{
            id: milestoneId,
            name: milestone.title,
            description: milestone.description || '',
            estimatedHours: (milestone as any).estimatedHours || 0,
            milestoneAmount: (milestone as any).amount || 0,
            dueDate: (milestone as any).dueDate,
            deliverables: Array.isArray((milestone as any).deliverables) ? (milestone as any).deliverables.map((d: any) => typeof d === 'string' ? d : d.title) : [],
            acceptanceCriteria: Array.isArray((milestone as any).acceptanceCriteria) ? (milestone as any).acceptanceCriteria : [],
          }}
          onSuccess={() => {
            toast.success('Adjustment request submitted successfully!');
            loadData(); // Reload data
          }}
        />
      )}
    </ProjectPageLayout>
  );
};

export default MilestoneKanban;
