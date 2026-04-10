import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Workspace member role enum
 */
export enum WorkspaceMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

/**
 * Invitation status enum
 */
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * DTO for creating a workspace invitation
 */
export class CreateInvitationDto {
  @ApiProperty({
    description: 'Email address of the person to invite',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Name of the person to invite',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'Role to assign to the invited member',
    enum: WorkspaceMemberRole,
    example: WorkspaceMemberRole.MEMBER,
  })
  @IsEnum(WorkspaceMemberRole)
  role: WorkspaceMemberRole;

  @ApiPropertyOptional({
    description: 'Custom message to include in the invitation',
    example: 'We would love to have you join our workspace!',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiPropertyOptional({
    description: 'Initial permissions for the member',
    example: ['view_projects', 'edit_tasks'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  initialPermissions?: string[];
}

/**
 * DTO for accepting an invitation
 */
export class AcceptInvitationDto {
  @ApiPropertyOptional({
    description: 'Additional profile information - full name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Bio/introduction',
    example: 'Experienced project manager with 5+ years in agile teams',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1-555-123-4567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Location',
    example: 'San Francisco, CA',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'America/Los_Angeles',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

/**
 * DTO for declining an invitation
 */
export class DeclineInvitationDto {
  @ApiPropertyOptional({
    description: 'Reason for declining',
    example: 'Currently not available for new projects',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  declineReason?: string;
}

/**
 * Response DTO for invitation details
 */
export class InvitationResponseDto {
  @ApiProperty({
    description: 'Invitation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Workspace ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  workspaceId: string;

  @ApiProperty({
    description: 'User ID who sent the invitation',
    example: 'usr_123abc',
  })
  invitedBy: string;

  @ApiProperty({
    description: 'Email address invited',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Name of invited person',
    example: 'John Doe',
  })
  name?: string;

  @ApiProperty({
    description: 'Role to be assigned',
    enum: WorkspaceMemberRole,
  })
  role: WorkspaceMemberRole;

  @ApiPropertyOptional({
    description: 'Custom invitation message',
  })
  message?: string;

  @ApiProperty({
    description: 'Initial permissions',
    type: [String],
  })
  initialPermissions: string[];

  @ApiProperty({
    description: 'Invitation status',
    enum: InvitationStatus,
  })
  status: InvitationStatus;

  @ApiProperty({
    description: 'Invitation token',
    example: 'inv_abc123xyz789',
  })
  token: string;

  @ApiProperty({
    description: 'Expiration date',
  })
  expiresAt: string;

  @ApiPropertyOptional({
    description: 'Acceptance date',
  })
  acceptedAt?: string;

  @ApiPropertyOptional({
    description: 'Decline date',
  })
  declinedAt?: string;

  @ApiPropertyOptional({
    description: 'Cancellation date',
  })
  cancelledAt?: string;

  @ApiPropertyOptional({
    description: 'Reason for declining',
  })
  declineReason?: string;

  @ApiPropertyOptional({
    description: 'Member ID (after acceptance)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  memberId?: string;

  @ApiProperty({
    description: 'Number of times invitation was sent',
    example: 1,
  })
  sentCount: number;

  @ApiPropertyOptional({
    description: 'Last sent date',
  })
  lastSentAt?: string;

  @ApiProperty({
    description: 'Created date',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Updated date',
  })
  updatedAt: string;

  @ApiPropertyOptional({
    description: 'Inviter details',
  })
  inviter?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({
    description: 'Workspace details',
  })
  workspace?: {
    id: string;
    name: string;
    description?: string;
  };
}
