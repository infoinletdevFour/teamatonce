/**
 * Project Access Guard
 *
 * Unified guard for protecting all project-related resources.
 * Validates that the authenticated user is an active member of the project.
 *
 * Usage:
 * 1. Add @UseGuards(AuthGuard, ProjectAccessGuard) to controller/route
 * 2. Project ID is extracted from route params (:projectId)
 * 3. User membership is verified via project_members table
 *
 * Features:
 * - Validates project membership for clients and developers
 * - Supports role-based access (owner, admin, developer, viewer)
 * - Attaches project membership info to request for downstream use
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../modules/database/database.service';

// Custom decorator to mark routes that require specific project roles
export const PROJECT_ROLES_KEY = 'projectRoles';
export const ProjectRoles = (...roles: string[]) =>
  Reflect.metadata(PROJECT_ROLES_KEY, roles);

// Custom decorator to skip project access check (for public project routes)
export const SKIP_PROJECT_ACCESS_KEY = 'skipProjectAccess';
export const SkipProjectAccess = () =>
  Reflect.metadata(SKIP_PROJECT_ACCESS_KEY, true);

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private readonly db: DatabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if project access check should be skipped
    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_PROJECT_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user ID from JWT payload (supports both sub and userId)
    const userId = user.sub || user.userId;
    if (!userId) {
      throw new ForbiddenException('User ID not found in token');
    }

    // Extract project ID from route params
    const projectId = request.params.projectId || request.params.project_id;

    if (!projectId) {
      // If no project ID in params, allow access (for non-project routes)
      return true;
    }

    // Verify project exists
    const project = await this.db.findOne('projects', {
      id: projectId,
      deleted_at: null,
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Check if user is a member of this project
    const membership = await this.db.findOne('project_members', {
      project_id: projectId,
      user_id: userId,
      is_active: true,
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Check for required roles if specified
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      PROJECT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(membership.role);
      if (!hasRole) {
        throw new ForbiddenException(
          `This action requires one of these roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Attach project and membership info to request for downstream use
    request.project = project;
    request.projectMembership = membership;
    request.projectId = projectId;

    return true;
  }
}
