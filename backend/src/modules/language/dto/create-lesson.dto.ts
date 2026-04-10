import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsArray, ValidateNested, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LanguageSkill {
  SPEAKING = 'speaking',
  LISTENING = 'listening',
  READING = 'reading',
  WRITING = 'writing'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export class LessonContentDto {
  @ApiProperty({ 
    description: 'Content type',
    example: 'text',
    enum: ['text', 'audio', 'image', 'exercise']
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ 
    description: 'Content-specific data object',
    example: { text: 'Hello, how are you?', translation: 'Hola, ¿cómo estás?' }
  })
  @IsNotEmpty()
  data: any;

  @ApiProperty({ 
    description: 'Content sequence order', 
    example: 1 
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  order: number;
}

export class CreateLessonDto {
  @ApiProperty({ 
    description: 'Lesson title', 
    example: 'Introduction to Spanish Greetings' 
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Lesson description', 
    example: 'Learn basic greeting phrases in Spanish' 
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ 
    description: 'Target language code',
    example: 'es'
  })
  @IsNotEmpty()
  @IsString()
  language_code: string;

  @ApiProperty({ 
    description: 'Source language code',
    example: 'en'
  })
  @IsNotEmpty()
  @IsString()
  source_language: string;

  @ApiProperty({ 
    description: 'Primary skill being taught',
    enum: LanguageSkill,
    example: LanguageSkill.SPEAKING
  })
  @IsNotEmpty()
  @IsEnum(LanguageSkill)
  skill: LanguageSkill;

  @ApiProperty({ 
    description: 'Lesson difficulty level',
    enum: DifficultyLevel,
    example: DifficultyLevel.BEGINNER
  })
  @IsNotEmpty()
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiProperty({ 
    description: 'Lesson duration in minutes', 
    example: 15,
    enum: [5, 10, 15, 20]
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(120)
  duration_minutes: number;

  @ApiProperty({ 
    description: 'Array of lesson content',
    type: [LessonContentDto]
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonContentDto)
  content: LessonContentDto[];

  @ApiProperty({ 
    description: 'Array of tags',
    type: [String], 
    example: ['greetings', 'basics', 'speaking']
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ 
    description: 'Publication status', 
    example: true 
  })
  @IsNotEmpty()
  @IsBoolean()
  is_published: boolean;

  @ApiProperty({ 
    description: 'Additional metadata object',
    example: { level: 'A1', category: 'conversation' }
  })
  @IsNotEmpty()
  metadata: Record<string, any>;
}