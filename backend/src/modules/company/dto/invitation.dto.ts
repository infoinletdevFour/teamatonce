import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeamMemberRole } from './company-member.dto';

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
 * DTO for creating a team invitation
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
    enum: TeamMemberRole,
    example: TeamMemberRole.DEVELOPER,
  })
  @IsEnum(TeamMemberRole)
  role: TeamMemberRole;

  @ApiPropertyOptional({
    description: 'Custom message to include in the invitation',
    example: 'We would love to have you join our development team!',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiPropertyOptional({
    description: 'Initial skills for the member',
    example: ['JavaScript', 'TypeScript', 'React'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  initial_skills?: string[];

  @ApiPropertyOptional({
    description: 'Hourly rate for the member',
    example: 75.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional({
    description: 'Initial projects to assign',
    example: ['proj_123', 'proj_456'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  initial_projects?: string[];
}

/**
 * DTO for accepting an invitation
 */
export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Invitation token from the email',
    example: 'inv_abc123xyz789',
  })
  @IsString()
  token: string;

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
    example: 'Experienced full-stack developer with 8+ years in React and Node.js',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
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

  @ApiPropertyOptional({
    description: 'Skills',
    example: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Technologies',
    example: ['Next.js', 'NestJS', 'PostgreSQL'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  technologies?: string[];
}

/**
 * DTO for declining an invitation
 */
export class DeclineInvitationDto {
  @ApiProperty({
    description: 'Invitation token',
    example: 'inv_abc123xyz789',
  })
  @IsString()
  token: string;

  @ApiPropertyOptional({
    description: 'Reason for declining',
    example: 'Currently not available for new projects',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  decline_reason?: string;
}

/**
 * Response DTO for invitation details
 */
export class InvitationResponseDto {
  @ApiProperty({ description: 'Invitation ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  company_id: string;

  @ApiProperty({ description: 'User ID who sent the invitation', example: 'usr_123abc' })
  invited_by: string;

  @ApiProperty({ description: 'Name of the person who sent invitation', example: 'Jane Smith' })
  invited_by_name: string;

  @ApiProperty({ description: 'Email address invited', example: 'john.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Name of invited person', example: 'John Doe' })
  name?: string;

  @ApiProperty({ description: 'Role to be assigned', enum: TeamMemberRole })
  role: TeamMemberRole;

  @ApiPropertyOptional({ description: 'Custom invitation message' })
  message?: string;

  @ApiProperty({ description: 'Initial skills', type: [String] })
  initial_skills: string[];

  @ApiPropertyOptional({ description: 'Hourly rate', example: 75.0 })
  hourly_rate?: number;

  @ApiProperty({ description: 'Initial projects', type: [String] })
  initial_projects: string[];

  @ApiProperty({ description: 'Invitation status', enum: InvitationStatus })
  status: InvitationStatus;

  @ApiProperty({ description: 'Invitation token', example: 'inv_abc123xyz789' })
  token: string;

  @ApiProperty({ description: 'Expiration date' })
  expires_at: string;

  @ApiPropertyOptional({ description: 'Acceptance date' })
  accepted_at?: string;

  @ApiPropertyOptional({ description: 'Decline date' })
  declined_at?: string;

  @ApiPropertyOptional({ description: 'Cancellation date' })
  cancelled_at?: string;

  @ApiPropertyOptional({ description: 'Reason for declining' })
  decline_reason?: string;

  @ApiPropertyOptional({ description: 'Team member ID (after acceptance)', example: '123e4567-e89b-12d3-a456-426614174002' })
  team_member_id?: string;

  @ApiProperty({ description: 'Number of times invitation was sent', example: 1 })
  sent_count: number;

  @ApiPropertyOptional({ description: 'Last sent date' })
  last_sent_at?: string;

  @ApiPropertyOptional({ description: 'Date when invitation was opened' })
  opened_at?: string;

  @ApiProperty({ description: 'Company name', example: 'Acme Development LLC' })
  company_name: string;

  @ApiProperty({ description: 'Company display name', example: 'Acme Dev' })
  company_display_name: string;

  @ApiProperty({ description: 'Created date' })
  created_at: string;

  @ApiProperty({ description: 'Updated date' })
  updated_at: string;
}

/**
 * DTO for resending an invitation
 */
export class ResendInvitationDto {
  @ApiProperty({
    description: 'Invitation ID to resend',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  invitation_id: string;

  @ApiPropertyOptional({
    description: 'Updated custom message',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

/**
 * DTO for cancelling an invitation
 */
export class CancelInvitationDto {
  @ApiProperty({
    description: 'Invitation ID to cancel',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  invitation_id: string;

  @ApiPropertyOptional({
    description: 'Reason for cancelling',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellation_reason?: string;
}

/**
 * Response DTO for invitation list with pagination
 */
export class InvitationListResponseDto {
  @ApiProperty({ description: 'List of invitations', type: [InvitationResponseDto] })
  data: InvitationResponseDto[];

  @ApiProperty({ description: 'Total count', example: 25 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 3 })
  total_pages: number;
}

/**
 * DTO for filtering invitations
 */
export class FilterInvitationsDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: InvitationStatus })
  @IsOptional()
  @IsEnum(InvitationStatus)
  status?: InvitationStatus;

  @ApiPropertyOptional({ description: 'Filter by role', enum: TeamMemberRole })
  @IsOptional()
  @IsEnum(TeamMemberRole)
  role?: TeamMemberRole;

  @ApiPropertyOptional({ description: 'Search by email or name', example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by invited by user ID', example: 'usr_123abc' })
  @IsOptional()
  @IsString()
  invited_by?: string;
}

/**
 * Response DTO for invitation action (accept/decline/cancel)
 */
export class InvitationActionResponseDto {
  @ApiProperty({ description: 'Success message', example: 'Invitation accepted successfully' })
  message: string;

  @ApiProperty({ description: 'Invitation details', type: InvitationResponseDto })
  invitation: InvitationResponseDto;

  @ApiPropertyOptional({ description: 'Team member details (after acceptance)', type: 'object', additionalProperties: true })
  team_member?: any;
}
