import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';

export class StartAssessmentDto {
  @ApiProperty({ description: 'Additional metadata for the attempt', required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;
}