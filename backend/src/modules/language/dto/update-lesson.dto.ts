import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LanguageSkill, DifficultyLevel, LessonContentDto } from './create-lesson.dto';

export class UpdateLessonDto {
  @ApiPropertyOptional({ 
    description: 'Lesson title', 
    example: 'Updated Spanish Greetings' 
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ 
    description: 'Lesson description', 
    example: 'Updated lesson description for basic greeting phrases in Spanish' 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Target language code',
    example: 'es'
  })
  @IsOptional()
  @IsString()
  language_code?: string;

  @ApiPropertyOptional({ 
    description: 'Source language code',
    example: 'en'
  })
  @IsOptional()
  @IsString()
  source_language?: string;

  @ApiPropertyOptional({ 
    description: 'Primary skill being taught',
    enum: LanguageSkill,
    example: LanguageSkill.SPEAKING
  })
  @IsOptional()
  @IsEnum(LanguageSkill)
  skill?: LanguageSkill;

  @ApiPropertyOptional({ 
    description: 'Lesson difficulty level',
    enum: DifficultyLevel,
    example: DifficultyLevel.INTERMEDIATE
  })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({ 
    description: 'Lesson duration in minutes', 
    example: 20,
    enum: [5, 10, 15, 20]
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  duration_minutes?: number;

  @ApiPropertyOptional({ 
    description: 'Array of lesson content',
    type: [LessonContentDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonContentDto)
  content?: LessonContentDto[];

  @ApiPropertyOptional({ 
    description: 'Array of tags',
    type: [String], 
    example: ['greetings', 'intermediate', 'speaking']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ 
    description: 'Publication status', 
    example: false
  })
  @IsOptional()
  @IsBoolean()
  is_published?: boolean;

  @ApiPropertyOptional({ 
    description: 'Additional metadata object',
    example: { level: 'A2', category: 'conversation', updated: true }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}