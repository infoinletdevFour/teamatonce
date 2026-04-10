import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator for role-based access control
 *
 * Usage:
 * @Roles('admin', 'super_admin')
 *
 * This sets metadata that the RolesGuard reads to determine
 * which roles are allowed to access the route
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
