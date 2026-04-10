import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRequirementDto } from './requirement.dto';
import { CreateStakeholderDto } from './stakeholder.dto';
import { CreateConstraintDto } from './constraint.dto';

export class ProjectScopeDto {
  @ApiProperty({ description: 'Primary objective of the project', example: 'Build a scalable e-commerce platform' })
  @IsString()
  primaryObjective: string;

  @ApiPropertyOptional({ description: 'Key performance indicators', type: [String], example: ['Increase sales by 40%', 'Handle 10,000 concurrent users'] })
  @IsOptional()
  @IsArray()
  keyPerformanceIndicators?: string[];

  @ApiPropertyOptional({ description: 'Success criteria', type: [String], example: ['All tests passing', 'Performance benchmarks met'] })
  @IsOptional()
  @IsArray()
  successCriteria?: string[];
}

export class DefineProjectScopeDto {
  @ApiProperty({ description: 'Primary objective of the project', example: 'Build a scalable e-commerce platform' })
  @IsString()
  primaryObjective: string;

  @ApiPropertyOptional({ description: 'Key performance indicators', type: [String], example: ['Increase sales by 40%', 'Handle 10,000 concurrent users'] })
  @IsOptional()
  @IsArray()
  keyPerformanceIndicators?: string[];

  @ApiPropertyOptional({ description: 'Success criteria', type: [String], example: ['All tests passing', 'Performance benchmarks met'] })
  @IsOptional()
  @IsArray()
  successCriteria?: string[];
}

export class BulkConstraintsDto {
  @ApiPropertyOptional({ description: 'Technical constraints', type: [String], example: ['Must use AWS', 'PostgreSQL database required'] })
  @IsOptional()
  @IsArray()
  technicalConstraints?: string[];

  @ApiPropertyOptional({ description: 'Business constraints', type: [String], example: ['Budget limited to $50,000', 'Must launch by Q2'] })
  @IsOptional()
  @IsArray()
  businessConstraints?: string[];

  @ApiPropertyOptional({ description: 'Assumptions', type: [String], example: ['Client will provide content', 'Third-party APIs will be available'] })
  @IsOptional()
  @IsArray()
  assumptions?: string[];
}

export class SubmitProjectDefinitionDto {
  @ApiProperty({ description: 'Project ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Project scope', type: ProjectScopeDto })
  @ValidateNested()
  @Type(() => ProjectScopeDto)
  scope: ProjectScopeDto;

  @ApiPropertyOptional({ description: 'Project requirements', type: [CreateRequirementDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRequirementDto)
  requirements?: CreateRequirementDto[];

  @ApiPropertyOptional({ description: 'Project stakeholders', type: [CreateStakeholderDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStakeholderDto)
  stakeholders?: CreateStakeholderDto[];

  @ApiPropertyOptional({ description: 'Project constraints', type: BulkConstraintsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BulkConstraintsDto)
  constraints?: BulkConstraintsDto;
}
