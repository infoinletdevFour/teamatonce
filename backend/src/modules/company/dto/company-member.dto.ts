import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsNumber,
  IsObject,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Team member role enum
 */
export enum TeamMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  DESIGNER = 'designer',
  QA = 'qa',
}

/**
 * Team member status enum
 */
export enum TeamMemberStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * Team member availability enum
 */
export enum TeamMemberAvailability {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ON_LEAVE = 'on_leave',
}

/**
 * DTO for inviting a team member
 */
export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address of the person to invite',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Full name of the team member',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Role in the team',
    enum: TeamMemberRole,
    example: TeamMemberRole.DEVELOPER,
  })
  @IsEnum(TeamMemberRole)
  role: TeamMemberRole;

  @ApiPropertyOptional({
    description: 'Job title',
    example: 'Senior Full-Stack Developer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({
    description: 'Initial skills for the member',
    example: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Specializations',
    example: ['full-stack', 'backend'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  specializations?: string[];

  @ApiPropertyOptional({
    description: 'Technologies the member works with',
    example: ['Next.js', 'NestJS', 'PostgreSQL'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  technologies?: string[];

  @ApiPropertyOptional({
    description: 'Hourly rate for the member',
    example: 75.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional({
    description: 'Currency for hourly rate',
    example: 'USD',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Permissions array for the member',
    example: ['project:read', 'project:write', 'team:read'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Custom message to include in the invitation email',
    example: 'We would love to have you join our team!',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

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
 * DTO for updating a team member
 */
export class UpdateMemberDto {
  @ApiPropertyOptional({
    description: 'Full name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Job title',
    example: 'Senior Developer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({
    description: 'Biography',
    example: 'Experienced full-stack developer with 8+ years in React and Node.js',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Role',
    enum: TeamMemberRole,
  })
  @IsOptional()
  @IsEnum(TeamMemberRole)
  role?: TeamMemberRole;

  @ApiPropertyOptional({
    description: 'Permissions array',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Skills array',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Specializations array',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  specializations?: string[];

  @ApiPropertyOptional({
    description: 'Technologies array',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  technologies?: string[];

  @ApiPropertyOptional({
    description: 'Expertise areas',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  expertise?: string[];

  @ApiPropertyOptional({
    description: 'Years of experience',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  experience_years?: number;

  @ApiPropertyOptional({
    description: 'Hourly rate',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional({
    description: 'Currency',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Availability status',
    enum: TeamMemberAvailability,
  })
  @IsOptional()
  @IsEnum(TeamMemberAvailability)
  availability?: TeamMemberAvailability;

  @ApiPropertyOptional({
    description: 'Member status',
    enum: TeamMemberStatus,
  })
  @IsOptional()
  @IsEnum(TeamMemberStatus)
  status?: TeamMemberStatus;

  @ApiPropertyOptional({
    description: 'Capacity hours per week',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  capacity_hours_per_week?: number;

  @ApiPropertyOptional({
    description: 'Avatar URL',
  })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
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
    description: 'Social media links',
    example: { github: 'https://github.com/johndoe', linkedin: 'https://linkedin.com/in/johndoe' },
  })
  @IsOptional()
  @IsObject()
  social_links?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Member rating (0-5)',
    example: 4.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'On-time delivery rate percentage',
    example: 95.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  on_time_delivery_rate?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Response DTO for team member details
 */
export class MemberResponseDto {
  @ApiProperty({ description: 'Member ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  company_id: string;

  @ApiPropertyOptional({ description: 'User ID (null if invitation pending)', example: 'usr_123abc' })
  user_id?: string;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatar_url?: string;

  @ApiPropertyOptional({ description: 'Job title', example: 'Senior Developer' })
  title?: string;

  @ApiPropertyOptional({ description: 'Biography' })
  bio?: string;

  @ApiProperty({ description: 'Role', enum: TeamMemberRole })
  role: TeamMemberRole;

  @ApiProperty({ description: 'Permissions array', type: [String] })
  permissions: string[];

  @ApiProperty({ description: 'Is owner of the company' })
  is_owner: boolean;

  @ApiProperty({ description: 'Skills', type: [String] })
  skills: string[];

  @ApiProperty({ description: 'Specializations', type: [String] })
  specializations: string[];

  @ApiProperty({ description: 'Technologies', type: [String] })
  technologies: string[];

  @ApiProperty({ description: 'Expertise areas', type: [String] })
  expertise: string[];

  @ApiProperty({ description: 'Years of experience', example: 8 })
  experience_years: number;

  @ApiPropertyOptional({ description: 'Hourly rate', example: 75.0 })
  hourly_rate?: number;

  @ApiProperty({ description: 'Currency', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Availability status', enum: TeamMemberAvailability })
  availability: TeamMemberAvailability;

  @ApiProperty({ description: 'Member status', enum: TeamMemberStatus })
  status: TeamMemberStatus;

  @ApiProperty({ description: 'Workload percentage (0-100+)', example: 75.5 })
  workload_percentage: number;

  @ApiProperty({ description: 'Capacity hours per week', example: 40 })
  capacity_hours_per_week: number;

  @ApiProperty({ description: 'Current number of projects', example: 3 })
  current_projects: number;

  @ApiProperty({ description: 'Current project IDs', type: [String] })
  current_project_ids: string[];

  @ApiProperty({ description: 'Hours worked this week', example: 32.5 })
  hours_this_week: number;

  @ApiProperty({ description: 'Hours worked this month', example: 125.0 })
  hours_this_month: number;

  @ApiPropertyOptional({ description: 'Phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Location', example: 'San Francisco, CA' })
  location?: string;

  @ApiPropertyOptional({ description: 'Timezone', example: 'America/Los_Angeles' })
  timezone?: string;

  @ApiProperty({ description: 'Social media links' })
  social_links: Record<string, string>;

  @ApiPropertyOptional({ description: 'Average rating', example: 4.8 })
  rating?: number;

  @ApiProperty({ description: 'Projects completed', example: 15 })
  projects_completed: number;

  @ApiProperty({ description: 'Total hours worked', example: 1250.5 })
  total_hours_worked: number;

  @ApiPropertyOptional({ description: 'On-time delivery rate', example: 95.5 })
  on_time_delivery_rate?: number;

  @ApiProperty({ description: 'Is currently online' })
  is_online: boolean;

  @ApiPropertyOptional({ description: 'Last seen timestamp' })
  last_seen_at?: string;

  @ApiProperty({ description: 'Join date' })
  joined_date: string;

  @ApiPropertyOptional({ description: 'Activation timestamp' })
  activated_at?: string;

  @ApiPropertyOptional({ description: 'Deactivation timestamp' })
  deactivated_at?: string;

  @ApiProperty({ description: 'Additional metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Created date' })
  created_at: string;

  @ApiProperty({ description: 'Updated date' })
  updated_at: string;

  @ApiPropertyOptional({ description: 'Deleted date (soft delete)' })
  deleted_at?: string;
}

/**
 * Response DTO for team member workload information
 */
export class MemberWorkloadDto {
  @ApiProperty({ description: 'Member ID' })
  member_id: string;

  @ApiProperty({ description: 'Member name' })
  member_name: string;

  @ApiProperty({ description: 'Current workload percentage', example: 75.5 })
  @IsNumber()
  workload_percentage: number;

  @ApiProperty({ description: 'Capacity hours per week', example: 40 })
  @IsNumber()
  capacity_hours_per_week: number;

  @ApiProperty({ description: 'Hours allocated this week', example: 30.0 })
  @IsNumber()
  allocated_hours_this_week: number;

  @ApiProperty({ description: 'Hours worked this week', example: 28.5 })
  @IsNumber()
  hours_worked_this_week: number;

  @ApiProperty({ description: 'Number of active projects', example: 3 })
  @IsNumber()
  active_projects_count: number;

  @ApiProperty({ description: 'Active project details', type: 'array' })
  active_projects: Array<{
    project_id: string;
    project_name: string;
    role: string;
    allocation_percentage: number;
    estimated_hours: number;
  }>;

  @ApiProperty({ description: 'Availability status', enum: TeamMemberAvailability })
  availability: TeamMemberAvailability;

  @ApiProperty({ description: 'Can take more work' })
  @IsBoolean()
  can_take_more_work: boolean;
}

/**
 * DTO for filtering team members
 */
export class FilterMembersDto {
  @ApiPropertyOptional({ description: 'Filter by role', enum: TeamMemberRole })
  @IsOptional()
  @IsEnum(TeamMemberRole)
  role?: TeamMemberRole;

  @ApiPropertyOptional({ description: 'Filter by status', enum: TeamMemberStatus })
  @IsOptional()
  @IsEnum(TeamMemberStatus)
  status?: TeamMemberStatus;

  @ApiPropertyOptional({ description: 'Filter by availability', enum: TeamMemberAvailability })
  @IsOptional()
  @IsEnum(TeamMemberAvailability)
  availability?: TeamMemberAvailability;

  @ApiPropertyOptional({ description: 'Filter by skill', example: 'React' })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiPropertyOptional({ description: 'Filter by technology', example: 'Next.js' })
  @IsOptional()
  @IsString()
  technology?: string;

  @ApiPropertyOptional({ description: 'Search by name or email', example: 'John' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Minimum years of experience', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_experience?: number;

  @ApiPropertyOptional({ description: 'Maximum hourly rate', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_hourly_rate?: number;

  @ApiPropertyOptional({ description: 'Filter by online status' })
  @IsOptional()
  @IsBoolean()
  is_online?: boolean;
}

/**
 * DTO for updating member workload
 */
export class WorkloadUpdateDto {
  @ApiPropertyOptional({ description: 'Current workload percentage (0-100)', example: 75 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  current_workload_percentage?: number;

  @ApiPropertyOptional({ description: 'Workload percentage (0-100)', example: 75 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  workload_percentage?: number;

  @ApiPropertyOptional({ description: 'Assigned hours this week', example: 35 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  assigned_hours_this_week?: number;

  @ApiPropertyOptional({ description: 'Hours this week', example: 35 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hours_this_week?: number;

  @ApiPropertyOptional({ description: 'Assigned hours this month', example: 140 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  assigned_hours_this_month?: number;

  @ApiPropertyOptional({ description: 'Hours this month', example: 140 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hours_this_month?: number;

  @ApiPropertyOptional({ description: 'Number of current projects', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  current_projects?: number;

  @ApiPropertyOptional({ description: 'Array of current project IDs', type: [String] })
  @IsOptional()
  @IsArray()
  current_project_ids?: string[];
}

/**
 * Alias for FilterMembersDto for backward compatibility
 */
export class MemberFilterDto extends FilterMembersDto {}

/**
 * Alias for MemberResponseDto for backward compatibility
 */
export class CompanyMemberResponseDto extends MemberResponseDto {}

/**
 * Alias for MemberWorkloadDto for backward compatibility
 */
export class TeamWorkloadDto extends MemberWorkloadDto {}
