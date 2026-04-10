import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';

export enum RequirementType {
  FUNCTIONAL = 'functional',
  NON_FUNCTIONAL = 'non-functional',
  BUSINESS = 'business',
  TECHNICAL = 'technical',
}

export enum RequirementPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class CreateRequirementDto {
  @ApiProperty({ description: 'Requirement title', example: 'User authentication system' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Requirement description', example: 'Implement OAuth 2.0 authentication with social login' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Requirement type', enum: RequirementType, example: RequirementType.FUNCTIONAL })
  @IsEnum(RequirementType)
  type: RequirementType;

  @ApiProperty({ description: 'Requirement priority', enum: RequirementPriority, example: RequirementPriority.HIGH })
  @IsEnum(RequirementPriority)
  priority: RequirementPriority;
}

export class UpdateRequirementDto {
  @ApiPropertyOptional({ description: 'Requirement title', example: 'Updated user authentication' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Requirement description', example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Requirement type', enum: RequirementType })
  @IsOptional()
  @IsEnum(RequirementType)
  type?: RequirementType;

  @ApiPropertyOptional({ description: 'Requirement priority', enum: RequirementPriority })
  @IsOptional()
  @IsEnum(RequirementPriority)
  priority?: RequirementPriority;
}
