import { apiClient } from '@/lib/api-client';

export interface CreateTaskDto {
  title: string;
  description?: string;
  taskType: string;
  priority?: string;
  assignedTo?: string;
  estimatedHours?: number;
  dueDate?: string;
  tags?: string[];
  dependencies?: string[];
  parentTaskId?: string; // For creating subtasks
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  taskType?: string;
  priority?: string;
  status?: string;
  assignedTo?: string;
  estimatedHours?: number;
  dueDate?: string;
  tags?: string[];
  dependencies?: string[];
  parentTaskId?: string; // For updating subtask relationship
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId: string;
  parent_task_id?: string; // Parent task ID for subtasks
  title: string;
  description?: string;
  taskType: string;
  priority: string;
  status: 'initialized' | 'inprogress' | 'done';
  assignedTo?: string;
  assigned_to_name?: string;
  assignedBy?: string;
  assignedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  completedDate?: string;
  tags: string[];
  dependencies: string[];
  attachments: any[];
  checklist: any[];
  createdAt: string;
  updatedAt: string;
  updated_by?: string;
  updated_by_name?: string;
}

/**
 * Create a new task
 */
export const createTask = async (
  projectId: string,
  milestoneId: string,
  data: CreateTaskDto
): Promise<Task> => {
  const response = await apiClient.post<Task>(
    `/projects/${projectId}/tasks?milestoneId=${milestoneId}`,
    data
  );
  return response.data;
};

/**
 * Get all tasks for a milestone
 */
export const getMilestoneTasks = async (
  projectId: string,
  milestoneId: string
): Promise<Task[]> => {
  const response = await apiClient.get<Task[]>(
    `/projects/${projectId}/milestones/${milestoneId}/tasks`
  );
  return response.data;
};

/**
 * Get all tasks for a project
 */
export const getProjectTasks = async (projectId: string): Promise<Task[]> => {
  const response = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`);
  return response.data;
};

/**
 * Get a single task
 */
export const getTaskById = async (projectId: string, taskId: string): Promise<Task> => {
  const response = await apiClient.get<Task>(`/projects/${projectId}/tasks/${taskId}`);
  return response.data;
};

/**
 * Update a task
 */
export const updateTask = async (
  projectId: string,
  taskId: string,
  data: UpdateTaskDto
): Promise<Task> => {
  const response = await apiClient.put<Task>(
    `/projects/${projectId}/tasks/${taskId}`,
    data
  );
  return response.data;
};

/**
 * Update task status (for drag and drop)
 */
export const updateTaskStatus = async (
  projectId: string,
  taskId: string,
  status: string
): Promise<Task> => {
  const response = await apiClient.put<Task>(
    `/projects/${projectId}/tasks/${taskId}/status`,
    { status }
  );
  return response.data;
};

/**
 * Delete a task
 */
export const deleteTask = async (
  projectId: string,
  taskId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/projects/${projectId}/tasks/${taskId}`
  );
  return response.data;
};
