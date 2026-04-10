/**
 * Project Definition Service for Team@Once
 *
 * Handles API calls for project requirements, scope, stakeholders, and constraints
 */

import { apiClient } from '@/lib/api-client';

// ============================================
// TYPES
// ============================================

export type RequirementType = 'functional' | 'non-functional' | 'business' | 'technical';
export type RequirementPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Requirement {
  id: string;
  project_id: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  created_at: string;
  updated_at: string;
}

export interface CreateRequirementData {
  title: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
}

export interface UpdateRequirementData {
  title?: string;
  description?: string;
  type?: RequirementType;
  priority?: RequirementPriority;
}

export interface ProjectDefinition {
  project: any;
  scope: {
    included: string[];
    excluded: string[];
  };
  requirements: Requirement[];
  stakeholders: any[];
  constraints: any[];
}

// ============================================
// PROJECT DEFINITION
// ============================================

/**
 * Get complete project definition
 */
export const getProjectDefinition = async (projectId: string): Promise<ProjectDefinition> => {
  const response = await apiClient.get(`/project-definition/${projectId}`);
  return response.data;
};

// ============================================
// REQUIREMENTS CRUD
// ============================================

/**
 * Get all requirements for a project
 */
export const getProjectRequirements = async (projectId: string): Promise<Requirement[]> => {
  const response = await apiClient.get(`/project-definition/${projectId}/requirements`);
  return response.data;
};

/**
 * Add a new requirement to a project
 */
export const addRequirement = async (
  projectId: string,
  data: CreateRequirementData
): Promise<Requirement> => {
  const response = await apiClient.post(`/project-definition/${projectId}/requirements`, data);
  return response.data;
};

/**
 * Get a specific requirement by ID
 */
export const getRequirement = async (requirementId: string): Promise<Requirement> => {
  const response = await apiClient.get(`/project-definition/requirements/${requirementId}`);
  return response.data;
};

/**
 * Update a requirement
 */
export const updateRequirement = async (
  requirementId: string,
  data: UpdateRequirementData
): Promise<Requirement> => {
  const response = await apiClient.put(`/project-definition/requirements/${requirementId}`, data);
  return response.data;
};

/**
 * Delete a requirement (soft delete)
 */
export const deleteRequirement = async (requirementId: string): Promise<void> => {
  await apiClient.delete(`/project-definition/requirements/${requirementId}`);
};

// ============================================
// SCOPE MANAGEMENT
// ============================================

export interface UpdateScopeData {
  included?: string[];
  excluded?: string[];
  objectives?: string;
  deliverables?: string[];
}

/**
 * Update project scope
 */
export const updateProjectScope = async (
  projectId: string,
  data: UpdateScopeData
): Promise<any> => {
  const response = await apiClient.put(`/project-definition/${projectId}/scope`, data);
  return response.data;
};
