import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamMemberDto {
  @ApiProperty({ description: 'database user ID', example: 'usr_123abc' })
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Display name of team member', example: 'John Doe' })
  @IsString()
  display_name: string;

  @ApiProperty({
    description: 'Primary role of team member',
    example: 'developer',
    enum: ['developer', 'designer', 'qa', 'pm', 'devops']
  })
  @IsString()
  role: string;

  @ApiPropertyOptional({
    description: 'Array of specializations',
    example: ['full-stack', 'backend', 'frontend'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  specialization?: string[];

  @ApiPropertyOptional({
    description: 'Array of skills',
    example: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Technologies they work with',
    example: ['Next.js', 'NestJS', 'PostgreSQL'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  technologies?: string[];

  @ApiPropertyOptional({ description: 'Years of experience', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  experience_years?: number;

  @ApiPropertyOptional({ description: 'Hourly rate', example: 75.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Availability status',
    example: 'available',
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  })
  @IsOptional()
  @IsString()
  availability_status?: string;

  @ApiPropertyOptional({
    description: 'Current project IDs',
    example: ['proj_123', 'proj_456'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  current_projects?: string[];

  @ApiPropertyOptional({ description: 'Capacity hours per week', example: 40, default: 40 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  capacity_hours_per_week?: number;

  @ApiPropertyOptional({ description: 'Profile image URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  profile_image?: string;

  @ApiPropertyOptional({ description: 'Biography text', example: 'Experienced full-stack developer...' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Portfolio URL', example: 'https://portfolio.example.com' })
  @IsOptional()
  @IsString()
  portfolio_url?: string;

  @ApiPropertyOptional({ description: 'Is team member active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ description: 'Display name of team member', example: 'John Doe' })
  @IsOptional()
  @IsString()
  display_name?: string;

  @ApiPropertyOptional({
    description: 'Primary role of team member',
    example: 'developer',
    enum: ['developer', 'designer', 'qa', 'pm', 'devops']
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Array of specializations',
    example: ['full-stack', 'backend'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  specialization?: string[];

  @ApiPropertyOptional({
    description: 'Array of skills',
    example: ['JavaScript', 'TypeScript'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Technologies they work with',
    example: ['Next.js', 'NestJS'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  technologies?: string[];

  @ApiPropertyOptional({ description: 'Years of experience', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  experience_years?: number;

  @ApiPropertyOptional({ description: 'Hourly rate', example: 75.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Availability status',
    example: 'available',
    enum: ['available', 'busy', 'unavailable']
  })
  @IsOptional()
  @IsString()
  availability_status?: string;

  @ApiPropertyOptional({
    description: 'Current project IDs',
    example: ['proj_123'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  current_projects?: string[];

  @ApiPropertyOptional({ description: 'Capacity hours per week', example: 40 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  capacity_hours_per_week?: number;

  @ApiPropertyOptional({ description: 'Profile image URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  profile_image?: string;

  @ApiPropertyOptional({ description: 'Biography text', example: 'Experienced developer...' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Portfolio URL', example: 'https://portfolio.example.com' })
  @IsOptional()
  @IsString()
  portfolio_url?: string;

  @ApiPropertyOptional({ description: 'Is team member active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class TeamMemberFilterDto {
  @ApiPropertyOptional({ description: 'Filter by role', example: 'developer' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Filter by skill', example: 'React' })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiPropertyOptional({ description: 'Filter by technology', example: 'Next.js' })
  @IsOptional()
  @IsString()
  technology?: string;

  @ApiPropertyOptional({
    description: 'Filter by availability status',
    example: 'available',
    enum: ['available', 'busy', 'unavailable']
  })
  @IsOptional()
  @IsString()
  availability_status?: string;

  @ApiPropertyOptional({ description: 'Minimum years of experience', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_experience?: number;

  @ApiPropertyOptional({ description: 'Maximum hourly rate', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_hourly_rate?: number;

  @ApiPropertyOptional({ description: 'Search term for name/bio', example: 'John' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Is active filter', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
