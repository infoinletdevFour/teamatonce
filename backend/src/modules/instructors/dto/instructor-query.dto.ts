import { IsOptional, IsString, IsInt, Min, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum InstructorSortBy {
  RATING = 'rating',
  STUDENTS = 'students',
  EARNINGS = 'earnings',
  CREATED_AT = 'created_at',
  COURSES = 'courses',
}

export class InstructorQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search by name or expertise' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by expertise (comma-separated)' })
  @IsString()
  @IsOptional()
  expertise?: string;

  @ApiPropertyOptional({ description: 'Minimum rating', minimum: 0, maximum: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minRating?: number;

  @ApiPropertyOptional({ description: 'Verified instructors only' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @ApiPropertyOptional({ enum: InstructorSortBy, default: InstructorSortBy.RATING })
  @IsEnum(InstructorSortBy)
  @IsOptional()
  sortBy?: InstructorSortBy = InstructorSortBy.RATING;

  @ApiPropertyOptional({ description: 'Sort order', default: 'desc' })
  @IsString()
  @IsOptional()
  order?: 'asc' | 'desc' = 'desc';
}
