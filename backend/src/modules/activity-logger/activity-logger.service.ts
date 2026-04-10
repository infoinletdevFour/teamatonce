import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface LogActivityParams {
  userId: string; // database user ID
  projectId?: string;
  entityType: string; // 'project', 'milestone', 'task', 'payment', 'file', etc.
  entityId: string;
  activityType: string; // 'project_created', 'milestone_completed', etc.
  action: string; // 'created', 'updated', 'deleted', 'completed', etc.
  changes?: { old: any; new: any };
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface Activity {
  id: string;
  user_id: string;
  project_id?: string;
  activity_type: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes?: any;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

@Injectable()
export class ActivityLoggerService {
  private readonly logger = new Logger(ActivityLoggerService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Log a project activity
   */
  async logActivity(params: LogActivityParams): Promise<void> {
    try {
      await this.db.insert('activity_logs', {
        user_id: params.userId,
        project_id: params.projectId || null,
        activity_type: params.activityType,
        entity_type: params.entityType,
        entity_id: params.entityId,
        action: params.action,
        changes: params.changes ? JSON.stringify(params.changes) : null,
        metadata: JSON.stringify(params.metadata || {}),
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Don't throw - activity logging shouldn't break the main operation
      this.logger.error(`Failed to log activity: ${error.message}`, error.stack);
    }
  }

  /**
   * Get project activity timeline
   */
  async getProjectActivityTimeline(
    projectId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Activity[]> {
    try {
      const results = await /* TODO: replace client call */ this.db.client.query
        .from('activity_logs')
        .select('*')
        .where('project_id', '=', projectId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();

      return this.parseActivities(results.data || []);
    } catch (error) {
      this.logger.error(`Failed to get project activities: ${error.message}`);
      return [];
    }
  }

  /**
   * Get user's recent activities
   */
  async getUserActivities(userId: string, limit: number = 20): Promise<Activity[]> {
    try {
      const results = await /* TODO: replace client call */ this.db.client.query
        .from('activity_logs')
        .select('*')
        .where('user_id', '=', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .execute();

      return this.parseActivities(results.data || []);
    } catch (error) {
      this.logger.error(`Failed to get user activities: ${error.message}`);
      return [];
    }
  }

  /**
   * Get activities for a specific entity
   */
  async getEntityActivities(entityType: string, entityId: string): Promise<Activity[]> {
    try {
      const results = await /* TODO: replace client call */ this.db.client.query
        .from('activity_logs')
        .select('*')
        .where('entity_type', '=', entityType)
        .where('entity_id', '=', entityId)
        .orderBy('created_at', 'asc')
        .execute();

      return this.parseActivities(results.data || []);
    } catch (error) {
      this.logger.error(`Failed to get entity activities: ${error.message}`);
      return [];
    }
  }

  /**
   * Get activities for multiple projects (for company dashboard)
   */
  async getProjectsActivities(projectIds: string[], limit: number = 20): Promise<Activity[]> {
    try {
      if (!projectIds || projectIds.length === 0) {
        return [];
      }

      const results = await /* TODO: replace client call */ this.db.client.query
        .from('activity_logs')
        .select('*')
        .whereIn('project_id', projectIds)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .execute();

      return this.parseActivities(results.data || []);
    } catch (error) {
      this.logger.error(`Failed to get projects activities: ${error.message}`);
      return [];
    }
  }

  /**
   * Parse activities and handle JSON fields
   */
  private parseActivities(activities: any[]): Activity[] {
    return activities.map((activity) => ({
      ...activity,
      changes: this.tryParseJson(activity.changes),
      metadata: this.tryParseJson(activity.metadata),
    }));
  }

  /**
   * Safely parse JSON
   */
  private tryParseJson(value: any): any {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
