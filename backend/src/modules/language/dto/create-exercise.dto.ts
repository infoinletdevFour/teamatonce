import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExerciseType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_IN_BLANK = 'fill_in_blank',
  TRANSLATION = 'translation',
  LISTENING = 'listening',
  SPEAKING = 'speaking',
  MATCHING = 'matching',
  ORDERING = 'ordering',
  TRUE_FALSE = 'true_false'
}

export class AnswerOptionDto {
  @ApiProperty({ description: 'Answer option text', example: 'Hola' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Whether this is the correct answer', example: true })
  @IsBoolean()
  is_correct: boolean;

  @ApiPropertyOptional({ description: 'Audio URL for the option' })
  @IsOptional()
  @IsString()
  audio_url?: string;
}

export class CreateLanguageExerciseDto {
  @ApiProperty({ description: 'Exercise question or prompt', example: 'How do you say "Hello" in Spanish?' })
  @IsString()
  question: string;

  @ApiProperty({ 
    description: 'Type of exercise',
    enum: ExerciseType,
    example: ExerciseType.MULTIPLE_CHOICE
  })
  @IsEnum(ExerciseType)
  type: ExerciseType;

  @ApiProperty({ 
    description: 'Target language code',
    example: 'es'
  })
  @IsString()
  language_code: string;

  @ApiPropertyOptional({ description: 'Lesson ID this exercise belongs to' })
  @IsOptional()
  @IsString()
  lesson_id?: string;

  @ApiProperty({ description: 'Answer options', type: [AnswerOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerOptionDto)
  answers: AnswerOptionDto[];

  @ApiPropertyOptional({ description: 'Explanation for the correct answer' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ description: 'Hints for the exercise' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiPropertyOptional({ description: 'Points awarded for correct answer', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional({ description: 'Audio URL for the question' })
  @IsOptional()
  @IsString()
  audio_url?: string;

  @ApiPropertyOptional({ description: 'Image URL for visual context' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ description: 'Exercise tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional exercise metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}