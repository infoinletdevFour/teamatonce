import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../modules/database/database.service';

/**
 * Role-based access control guard
 * Checks if the authenticated user has one of the required roles
 * Fetches user metadata from database to get the actual role
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('admin', 'super_admin')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user in request, deny access
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    try {
      // Fetch user from database to get metadata with role
      const userId = user.sub || user.userId || user.id;
      const userProfile = await this.db.getUserById(userId);

      // Handle the response structure - it might be { user: {...} } or just {...}
      const fullUser = userProfile?.user || userProfile;

      // Extract role from metadata (this is where the special role is stored)
      const userRole = fullUser?.metadata?.role || fullUser?.app_metadata?.role || 'user';

      console.log(`[RolesGuard] User ${userId} has role: ${userRole}, Required: [${requiredRoles.join(', ')}]`);

      // Check if user has one of the required roles
      const hasRole = requiredRoles.includes(userRole);

      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied. Required roles: [${requiredRoles.join(', ')}]. Your role: ${userRole}`
        );
      }

      // Store role and full user in request for easy access in controllers
      request.user.role = userRole;
      request.user.metadata = fullUser?.metadata;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      console.error('[RolesGuard] Error checking user role:', error);
      throw new ForbiddenException('Failed to verify user role');
    }
  }
}
