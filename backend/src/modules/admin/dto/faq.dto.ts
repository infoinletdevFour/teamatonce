import { IsString, IsBoolean, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFaqDto {
  @ApiProperty({ description: 'The FAQ question' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'The FAQ answer' })
  @IsString()
  answer: string;

  @ApiPropertyOptional({ description: 'FAQ category', example: 'General' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Whether the FAQ is published', default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class UpdateFaqDto {
  @ApiPropertyOptional({ description: 'The FAQ question' })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiPropertyOptional({ description: 'The FAQ answer' })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional({ description: 'FAQ category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Whether the FAQ is published' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Order index for sorting' })
  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}

export class ReorderFaqsDto {
  @ApiProperty({ description: 'Array of FAQ IDs in the desired order' })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
