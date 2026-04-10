/**
 * Device Token Service
 *
 * Manages FCM device tokens for mobile push notifications.
 * Handles registration, unregistration, and token cleanup.
 */

import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FirebaseService } from './firebase.service';
import {
  RegisterDeviceTokenDto,
  UnregisterDeviceTokenDto,
  UpdateDeviceTokenDto,
  DeviceTokenResponseDto,
} from './dto/fcm-token.dto';

@Injectable()
export class DeviceTokenService {
  private readonly logger = new Logger(DeviceTokenService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Register a new device token for push notifications
   */
  async registerToken(
    userId: string,
    dto: RegisterDeviceTokenDto,
  ): Promise<DeviceTokenResponseDto> {
    try {
      // Check if token already exists
      const existingToken = await this.db.findOne('device_tokens', {
        token: dto.token,
      });

      if (existingToken) {
        // If token exists for same user, update it
        if (existingToken.user_id === userId) {
          return this.updateExistingToken(existingToken.id, dto);
        }
        // If token exists for different user, reassign it (device changed hands)
        this.logger.warn(`Token reassigned from user ${existingToken.user_id} to ${userId}`);
        await this.db.delete('device_tokens', existingToken.id);
      }

      // Create new token record
      const tokenData = {
        user_id: userId,
        token: dto.token,
        device_type: dto.device_type,
        device_name: dto.device_name || null,
        device_id: dto.device_id || null,
        app_version: dto.app_version || null,
        os_version: dto.os_version || null,
        is_active: true,
        last_used_at: new Date().toISOString(),
        metadata: dto.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newToken = await this.db.insert('device_tokens', tokenData);
      this.logger.log(`✅ Device token registered for user ${userId}`);

      return this.formatTokenResponse(newToken);
    } catch (error) {
      this.logger.error(`Failed to register device token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Unregister a device token
   */
  async unregisterToken(
    userId: string,
    dto: UnregisterDeviceTokenDto,
  ): Promise<{ success: boolean }> {
    try {
      const token = await this.db.findOne('device_tokens', {
        user_id: userId,
        token: dto.token,
      });

      if (!token) {
        throw new NotFoundException('Device token not found');
      }

      await this.db.delete('device_tokens', token.id);
      this.logger.log(`✅ Device token unregistered for user ${userId}`);

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to unregister device token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing device token
   */
  async updateToken(
    userId: string,
    tokenId: string,
    dto: UpdateDeviceTokenDto,
  ): Promise<DeviceTokenResponseDto> {
    try {
      const token = await this.db.findOne('device_tokens', {
        id: tokenId,
        user_id: userId,
      });

      if (!token) {
        throw new NotFoundException('Device token not found');
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (dto.new_token !== undefined) {
        updateData.token = dto.new_token;
      }
      if (dto.is_active !== undefined) {
        updateData.is_active = dto.is_active;
      }
      if (dto.app_version !== undefined) {
        updateData.app_version = dto.app_version;
      }
      if (dto.os_version !== undefined) {
        updateData.os_version = dto.os_version;
      }
      if (dto.metadata !== undefined) {
        updateData.metadata = { ...token.metadata, ...dto.metadata };
      }

      await this.db.update('device_tokens', tokenId, updateData);
      const updatedToken = await this.db.findOne('device_tokens', { id: tokenId });

      return this.formatTokenResponse(updatedToken);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update device token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all device tokens for a user
   */
  async getUserTokens(userId: string): Promise<DeviceTokenResponseDto[]> {
    try {
      const tokens = await this.db.findMany('device_tokens', {
        user_id: userId,
        is_active: true,
      });

      return tokens.map((t) => this.formatTokenResponse(t));
    } catch (error) {
      this.logger.error(`Failed to get user tokens: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all active FCM tokens for a user (for sending notifications)
   */
  async getActiveTokensForUser(userId: string): Promise<string[]> {
    try {
      const tokens = await this.db.findMany('device_tokens', {
        user_id: userId,
        is_active: true,
      });

      return tokens.map((t) => t.token);
    } catch (error) {
      this.logger.error(`Failed to get active tokens for user: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get all active FCM tokens for multiple users
   */
  async getActiveTokensForUsers(userIds: string[]): Promise<Map<string, string[]>> {
    try {
      const result = new Map<string, string[]>();

      // Initialize map with empty arrays for all users
      userIds.forEach((userId) => result.set(userId, []));

      // Get all tokens for all users in one query
      for (const userId of userIds) {
        const tokens = await this.db.findMany('device_tokens', {
          user_id: userId,
          is_active: true,
        });
        result.set(userId, tokens.map((t) => t.token));
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to get tokens for users: ${error.message}`, error.stack);
      return new Map();
    }
  }

  /**
   * Get all active FCM tokens for multiple users as a flat array
   */
  async getAllTokensForUsers(userIds: string[]): Promise<string[]> {
    try {
      const allTokens: string[] = [];

      for (const userId of userIds) {
        const tokens = await this.db.findMany('device_tokens', {
          user_id: userId,
          is_active: true,
        });
        allTokens.push(...tokens.map((t) => t.token));
      }

      return allTokens;
    } catch (error) {
      this.logger.error(`Failed to get all tokens for users: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Mark token as used (update last_used_at)
   */
  async markTokenAsUsed(token: string): Promise<void> {
    try {
      const tokenRecord = await this.db.findOne('device_tokens', { token });
      if (tokenRecord) {
        await this.db.update('device_tokens', tokenRecord.id, {
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Failed to mark token as used: ${error.message}`);
    }
  }

  /**
   * Deactivate invalid tokens (called after FCM send failures)
   */
  async deactivateInvalidTokens(invalidTokens: string[]): Promise<number> {
    if (invalidTokens.length === 0) return 0;

    let deactivatedCount = 0;

    try {
      for (const token of invalidTokens) {
        const tokenRecord = await this.db.findOne('device_tokens', { token });
        if (tokenRecord) {
          await this.db.update('device_tokens', tokenRecord.id, {
            is_active: false,
            updated_at: new Date().toISOString(),
            metadata: {
              ...tokenRecord.metadata,
              deactivated_reason: 'invalid_token',
              deactivated_at: new Date().toISOString(),
            },
          });
          deactivatedCount++;
        }
      }

      if (deactivatedCount > 0) {
        this.logger.log(`✅ Deactivated ${deactivatedCount} invalid tokens`);
      }

      return deactivatedCount;
    } catch (error) {
      this.logger.error(`Failed to deactivate invalid tokens: ${error.message}`, error.stack);
      return deactivatedCount;
    }
  }

  /**
   * Clean up old inactive tokens (maintenance task)
   */
  async cleanupInactiveTokens(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const inactiveTokens = await this.db.findMany('device_tokens', {
        is_active: false,
      });

      let deletedCount = 0;
      for (const token of inactiveTokens) {
        const updatedAt = new Date(token.updated_at);
        if (updatedAt < cutoffDate) {
          await this.db.delete('device_tokens', token.id);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        this.logger.log(`✅ Cleaned up ${deletedCount} old inactive tokens`);
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup inactive tokens: ${error.message}`, error.stack);
      return 0;
    }
  }

  /**
   * Send test notification to user's devices
   */
  async sendTestNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ success: boolean; sentTo: number; failed: number }> {
    const tokens = await this.getActiveTokensForUser(userId);

    if (tokens.length === 0) {
      return { success: false, sentTo: 0, failed: 0 };
    }

    const result = await this.firebaseService.sendToMultipleTokens(
      tokens,
      { title, body },
      data,
    );

    // Cleanup invalid tokens
    if (result.invalidTokens.length > 0) {
      await this.deactivateInvalidTokens(result.invalidTokens);
    }

    return {
      success: result.successCount > 0,
      sentTo: result.successCount,
      failed: result.failureCount,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async updateExistingToken(
    tokenId: string,
    dto: RegisterDeviceTokenDto,
  ): Promise<DeviceTokenResponseDto> {
    const updateData = {
      device_type: dto.device_type,
      device_name: dto.device_name || null,
      device_id: dto.device_id || null,
      app_version: dto.app_version || null,
      os_version: dto.os_version || null,
      is_active: true,
      last_used_at: new Date().toISOString(),
      metadata: dto.metadata || {},
      updated_at: new Date().toISOString(),
    };

    await this.db.update('device_tokens', tokenId, updateData);
    const updatedToken = await this.db.findOne('device_tokens', { id: tokenId });

    return this.formatTokenResponse(updatedToken);
  }

  private formatTokenResponse(token: any): DeviceTokenResponseDto {
    return {
      id: token.id,
      user_id: token.user_id,
      device_type: token.device_type,
      device_name: token.device_name,
      device_id: token.device_id,
      app_version: token.app_version,
      os_version: token.os_version,
      is_active: token.is_active,
      last_used_at: token.last_used_at,
      created_at: token.created_at,
      updated_at: token.updated_at,
    };
  }
}
