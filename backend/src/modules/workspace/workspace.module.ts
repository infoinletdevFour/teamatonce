import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { WorkspaceController } from './workspace.controller';
import { InvitationPublicController } from './invitation-public.controller';
import { InvitationService } from './invitation.service';
import { AuthModule } from '../auth/auth.module';

/**
 * Workspace Module
 *
 * Manages workspace operations for Deskive including:
 * - Workspace invitation system
 * - Member management
 * - Workspace settings and configuration
 *
 * This module provides a complete workspace management system for the Deskive platform,
 * allowing workspace owners to invite team members and manage their workspace.
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [WorkspaceController, InvitationPublicController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class WorkspaceModule {}
