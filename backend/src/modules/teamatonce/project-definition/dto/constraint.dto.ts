import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ConstraintType {
  TECHNICAL = 'technical',
  BUSINESS = 'business',
  ASSUMPTION = 'assumption',
}

export class CreateConstraintDto {
  @ApiProperty({ description: 'Constraint type', enum: ConstraintType, example: ConstraintType.TECHNICAL })
  @IsEnum(ConstraintType)
  type: ConstraintType;

  @ApiProperty({ description: 'Constraint description', example: 'Must use AWS infrastructure' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Impact of the constraint', example: 'May increase hosting costs by 20%' })
  @IsOptional()
  @IsString()
  impact?: string;

  @ApiPropertyOptional({ description: 'Mitigation strategy', example: 'Use reserved instances for cost savings' })
  @IsOptional()
  @IsString()
  mitigationStrategy?: string;
}

export class UpdateConstraintDto {
  @ApiPropertyOptional({ description: 'Constraint type', enum: ConstraintType })
  @IsOptional()
  @IsEnum(ConstraintType)
  type?: ConstraintType;

  @ApiPropertyOptional({ description: 'Constraint description', example: 'Updated constraint' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Impact of the constraint' })
  @IsOptional()
  @IsString()
  impact?: string;

  @ApiPropertyOptional({ description: 'Mitigation strategy' })
  @IsOptional()
  @IsString()
  mitigationStrategy?: string;
}
