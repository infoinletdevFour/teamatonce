import { IsString, IsNumber, IsOptional, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamAssignmentDto {
  @ApiProperty({ description: 'Project UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  project_id: string;

  @ApiProperty({ description: 'Team member UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  team_member_id: string;

  @ApiProperty({
    description: 'Role in the project',
    example: 'lead',
    enum: ['lead', 'developer', 'designer', 'qa', 'devops', 'pm']
  })
  @IsString()
  project_role: string;

  @ApiPropertyOptional({
    description: 'Assignment start date',
    example: '2024-01-15T00:00:00.000Z',
    default: 'now()'
  })
  @IsOptional()
  @IsDateString()
  assigned_at?: string;

  @ApiPropertyOptional({
    description: 'Percentage of time allocated to this project (0-100)',
    example: 100,
    default: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  allocation_percentage?: number;
}

export class UpdateTeamAssignmentDto {
  @ApiPropertyOptional({
    description: 'Role in the project',
    example: 'developer',
    enum: ['lead', 'developer', 'designer', 'qa', 'devops', 'pm']
  })
  @IsOptional()
  @IsString()
  project_role?: string;

  @ApiPropertyOptional({
    description: 'Percentage of time allocated to this project (0-100)',
    example: 50
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  allocation_percentage?: number;

  @ApiPropertyOptional({
    description: 'Removal date (marks assignment as inactive)',
    example: '2024-12-31T23:59:59.000Z'
  })
  @IsOptional()
  @IsDateString()
  removed_at?: string;
}

export class AssignTeamMemberDto {
  @ApiProperty({ description: 'Team member UUID to assign', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  team_member_id: string;

  @ApiProperty({
    description: 'Role for this team member',
    example: 'developer',
    enum: ['lead', 'developer', 'designer', 'qa', 'devops', 'pm']
  })
  @IsString()
  project_role: string;

  @ApiPropertyOptional({
    description: 'Allocation percentage (0-100)',
    example: 100,
    default: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  allocation_percentage?: number;
}

export class TeamAssignmentResponseDto {
  @ApiProperty({ description: 'Assignment UUID' })
  id: string;

  @ApiProperty({ description: 'Project UUID' })
  project_id: string;

  @ApiProperty({ description: 'Team member UUID' })
  team_member_id: string;

  @ApiProperty({ description: 'Role in the project' })
  project_role: string;

  @ApiProperty({ description: 'Assignment date' })
  assigned_at: Date;

  @ApiPropertyOptional({ description: 'Removal date (if removed)' })
  removed_at?: Date;

  @ApiProperty({ description: 'Allocation percentage' })
  allocation_percentage: number;

  @ApiProperty({ description: 'Is assignment active' })
  is_active: boolean;

  @ApiPropertyOptional({ description: 'Team member details' })
  team_member?: any;
}
