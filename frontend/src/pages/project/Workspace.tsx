import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Users,
  Clock,
  TrendingUp,
  Calendar,
  X,
  Flag,
  User,
  AlignLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { TaskCard, UserAvatar } from '@/components/project';
import { Task as UITask, KanbanColumn, TeamMember, TaskStatus, TaskPriority } from '@/lib/types/project';
import { useAuth } from '@/contexts/AuthContext';
import { getProjectTeam } from '@/services/teamMemberService';
import {
  getProjectTasks,
  updateTaskStatus,
  createTask,
  Task as APITask,
  CreateTaskDto,
} from '@/services/taskService';
import { getProjectStats } from '@/services/projectService';
import { toast } from 'sonner';

/**
 * Project Workspace Page
 * Kanban board with drag-and-drop task management
 * Features real-time updates, filters, and task details
 */

export const Workspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();

  // State
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 'initialized', title: 'To Do', tasks: [], color: 'gray' },
    { id: 'inprogress', title: 'In Progress', tasks: [], color: 'blue' },
    { id: 'done', title: 'Done', tasks: [], color: 'green' },
  ]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allTasks, setAllTasks] = useState<UITask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UITask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<string>('active');

  // Check if project is completed/ended
  const isProjectCompleted = projectStatus === 'completed' || projectStatus === 'ended';

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // Transform API task to UI task format
  const transformTask = useCallback((apiTask: APITask, members: TeamMember[]): UITask => {
    const assignee = members.find(m => m.id === apiTask.assignedTo);
    return {
      id: apiTask.id,
      title: apiTask.title,
      description: apiTask.description,
      status: apiTask.status as TaskStatus,
      priority: (apiTask.priority || 'medium') as TaskPriority,
      assignee,
      dueDate: apiTask.dueDate ? new Date(apiTask.dueDate) : undefined,
      tags: apiTask.tags || [],
      comments: [],
      createdAt: new Date(apiTask.createdAt),
      updatedAt: new Date(apiTask.updatedAt),
    };
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      // Load team members, tasks, and project status in parallel
      const [membersData, tasksData, projectData] = await Promise.all([
        getProjectTeam(projectId).catch(() => []),
        getProjectTasks(projectId).catch(() => []),
        getProjectStats(projectId).catch(() => ({ project: { status: 'active' } })),
      ]);

      // Set project status
      setProjectStatus(projectData.project?.status || 'active');

      // Transform team members
      const members: TeamMember[] = membersData.map((m: any) => ({
        id: m.id || m.user_id,
        name: m.name || 'Unknown',
        email: m.email || '',
        avatar: m.avatar,
        role: (m.role as any) || 'developer',
        status: m.online_status ? 'online' : 'offline',
      }));

      // Add current user if not in list
      if (user && !members.find(m => m.id === user.id)) {
        members.unshift({
          id: user.id,
          name: user.name || 'You',
          email: user.email || '',
          avatar: user.avatar,
          role: (user.role as any) || 'developer',
          status: 'online',
        });
      }

      setTeamMembers(members);

      // Transform tasks
      const tasks = (Array.isArray(tasksData) ? tasksData : []).map(t => transformTask(t, members));
      setAllTasks(tasks);

      // Organize tasks into columns
      setColumns([
        {
          id: 'initialized',
          title: 'To Do',
          tasks: tasks.filter(t => t.status === 'initialized'),
          color: 'gray',
        },
        {
          id: 'inprogress',
          title: 'In Progress',
          tasks: tasks.filter(t => t.status === 'inprogress'),
          color: 'blue',
        },
        {
          id: 'done',
          title: 'Done',
          tasks: tasks.filter(t => t.status === 'done'),
          color: 'green',
        },
      ]);
    } catch (err: any) {
      console.error('Error loading workspace data:', err);
      setError('Failed to load workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectId, user, transformTask]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Drag and drop handler
  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const sourceTasks = Array.from(sourceColumn.tasks);
    const [removed] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      // Same column - just reorder
      sourceTasks.splice(destination.index, 0, removed);
      setColumns(
        columns.map((col) =>
          col.id === source.droppableId ? { ...col, tasks: sourceTasks } : col
        )
      );
    } else {
      // Different column - update status
      const destTasks = Array.from(destColumn.tasks);
      const newStatus = destination.droppableId as TaskStatus;
      removed.status = newStatus;
      destTasks.splice(destination.index, 0, removed);

      // Optimistically update UI
      setColumns(
        columns.map((col) => {
          if (col.id === source.droppableId) return { ...col, tasks: sourceTasks };
          if (col.id === destination.droppableId) return { ...col, tasks: destTasks };
          return col;
        })
      );

      // Update on server
      if (projectId) {
        try {
          await updateTaskStatus(projectId, draggableId, newStatus);
          toast.success(`Task moved to ${destColumn.title}`);
        } catch (err) {
          console.error('Failed to update task status:', err);
          toast.error('Failed to update task status');
          // Revert on error
          loadData();
        }
      }
    }
  };

  // Create new task
  const handleCreateTask = async () => {
    if (!projectId || !newTaskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setCreatingTask(true);

    try {
      const taskData: CreateTaskDto = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        taskType: 'task',
        priority: newTaskPriority,
        assignedTo: newTaskAssignee || undefined,
      };

      // Note: The API requires a milestoneId. For now, we'll need to have one.
      // In a real implementation, you'd either have a default milestone or let user select one.
      const newTask = await createTask(projectId, 'default', taskData);

      // Transform and add to tasks
      const uiTask = transformTask(newTask, teamMembers);
      setAllTasks(prev => [...prev, uiTask]);

      // Add to appropriate column
      setColumns(prev => prev.map(col => {
        if (col.id === 'initialized') {
          return { ...col, tasks: [...col.tasks, uiTask] };
        }
        return col;
      }));

      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskAssignee('');
      setShowAddTask(false);

      toast.success('Task created successfully');
    } catch (err: any) {
      console.error('Failed to create task:', err);
      toast.error('Failed to create task. Please try again.');
    } finally {
      setCreatingTask(false);
    }
  };

  const columnColors = {
    gray: 'from-gray-50 to-gray-100 border-gray-300',
    blue: 'from-blue-50 to-blue-100 border-blue-300',
    green: 'from-green-50 to-green-100 border-green-300',
  };

  const activeMembers = teamMembers.filter((m) => m.status === 'online');

  // Filter tasks by search query
  const filterTasks = (tasks: UITask[]) => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(
      t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold mb-2">Error Loading Workspace</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Project Workspace
              </h1>
              <p className="text-gray-600 mt-1">Manage tasks and track progress</p>
            </div>

            {/* Team Members Online */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">
                  {activeMembers.length} online
                </span>
              </div>
              <div className="flex -space-x-2">
                {activeMembers.slice(0, 5).map((member) => (
                  <UserAvatar key={member.id} user={member} size="md" showStatus />
                ))}
                {activeMembers.length > 5 && (
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">
                      +{activeMembers.length - 5}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl border-2 font-semibold transition-all flex items-center space-x-2 ${
                showFilters
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </motion.button>

            {!isProjectCompleted && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddTask(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Task</span>
              </motion.button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            {[
              { label: 'Total Tasks', value: allTasks.length, icon: TrendingUp, color: 'blue' },
              { label: 'In Progress', value: columns[1].tasks.length, icon: Clock, color: 'orange' },
              { label: 'Completed', value: columns[2].tasks.length, icon: Calendar, color: 'green' },
              { label: 'Team Members', value: teamMembers.length, icon: Users, color: 'purple' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-3 gap-6">
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col h-full">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-gray-900">{column.title}</h3>
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-bold">
                      {filterTasks(column.tasks).length}
                    </span>
                  </div>
                  <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 bg-gradient-to-br ${
                        columnColors[column.color as keyof typeof columnColors]
                      } rounded-2xl p-4 border-2 min-h-[600px] transition-all ${
                        snapshot.isDraggingOver ? 'ring-4 ring-blue-300 scale-[1.02]' : ''
                      }`}
                    >
                      <div className="space-y-3">
                        {filterTasks(column.tasks).length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No tasks</p>
                          </div>
                        ) : (
                          filterTasks(column.tasks).map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    onClick={() => setSelectedTask(task)}
                                    isDragging={snapshot.isDragging}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>

                      {/* Add Task to Column - Only show if project is not completed */}
                      {!isProjectCompleted && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setShowAddTask(true)}
                          className="w-full mt-3 p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-white/50 transition-all flex items-center justify-center space-x-2"
                        >
                          <Plus className="w-5 h-5" />
                          <span className="font-semibold">Add Task</span>
                        </motion.button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddTask(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title *</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title..."
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Describe the task..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assignee</label>
                    <select
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTask}
                    disabled={creatingTask || !newTaskTitle.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingTask ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span>Create Task</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTask(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
                    {selectedTask.description && (
                      <p className="text-gray-600">{selectedTask.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* Tags */}
                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedTask.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700 rounded-full text-sm font-semibold border border-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 flex items-center space-x-2">
                      <Flag className="w-4 h-4" />
                      <span>Priority</span>
                    </label>
                    <div className="text-gray-900 font-semibold capitalize">{selectedTask.priority}</div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Assignee</span>
                    </label>
                    {selectedTask.assignee ? (
                      <div className="flex items-center space-x-2">
                        <UserAvatar user={selectedTask.assignee} size="sm" showStatus />
                        <span className="text-gray-900 font-semibold">{selectedTask.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </div>

                  {selectedTask.dueDate && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-600 flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Due Date</span>
                      </label>
                      <div className="text-gray-900 font-semibold">
                        {selectedTask.dueDate.toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                    <AlignLeft className="w-5 h-5" />
                    <span>Comments ({selectedTask.comments?.length || 0})</span>
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                    {selectedTask.comments && selectedTask.comments.length > 0 ? (
                      <div className="space-y-3">
                        {selectedTask.comments.map((comment) => (
                          <div key={comment.id} className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex items-center space-x-2 mb-2">
                              <UserAvatar user={comment.author} size="sm" />
                              <span className="font-semibold text-gray-900">{comment.author.name}</span>
                              <span className="text-xs text-gray-500">
                                {comment.createdAt.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No comments yet</p>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workspace;
