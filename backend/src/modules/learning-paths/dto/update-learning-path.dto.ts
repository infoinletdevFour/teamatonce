import { PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsBoolean, IsArray, IsString, Min } from 'class-validator';
import { CreateLearningPathDto } from './create-learning-path.dto';

export class UpdateLearningPathDto extends PartialType(CreateLearningPathDto) {}

export class UpdateCourseOrderDto {
  @IsNumber()
  @Min(0)
  order_index: number;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unlock_after?: string[];
}