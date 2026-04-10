import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsBoolean, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum AssessmentType {
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  PROJECT = 'project',
  EXAM = 'exam'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay',
  FILL_BLANK = 'fill_blank',
  MATCHING = 'matching',
  CODING = 'coding'
}

class QuestionOptionDto {
  @ApiProperty({ description: 'Option text' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: 'Is this option correct', required: false })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}

class QuestionDto {
  @ApiProperty({ description: 'Question text' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ enum: QuestionType, description: 'Type of question' })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ type: [QuestionOptionDto], required: false, description: 'Question options (for multiple choice, true/false, etc.)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @ApiProperty({ description: 'Correct answer(s) for the question', required: false })
  @IsOptional()
  correctAnswer?: any;

  @ApiProperty({ description: 'Points for this question', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  points?: number;

  @ApiProperty({ description: 'Explanation for the correct answer', required: false })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ description: 'Additional metadata for the question', required: false })
  @IsOptional()
  metadata?: any;
}

export class CreateAssessmentDto {
  @ApiProperty({ description: 'Assessment title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Assessment description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AssessmentType, description: 'Type of assessment' })
  @IsEnum(AssessmentType)
  type: AssessmentType;

  @ApiProperty({ description: 'Course ID this assessment belongs to', required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ description: 'Lesson ID this assessment belongs to', required: false })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({ type: [QuestionDto], description: 'Questions in the assessment' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];

  @ApiProperty({ description: 'Time limit in minutes', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimitMinutes?: number;

  @ApiProperty({ description: 'Passing score percentage', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiProperty({ description: 'Maximum allowed attempts', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAttempts?: number;

  @ApiProperty({ description: 'Should questions be randomized', required: false })
  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean;

  @ApiProperty({ description: 'Show correct answers after completion', required: false })
  @IsOptional()
  @IsBoolean()
  showCorrectAnswers?: boolean;

  @ApiProperty({ description: 'Allow review after completion', required: false })
  @IsOptional()
  @IsBoolean()
  allowReview?: boolean;

  @ApiProperty({ enum: DifficultyLevel, description: 'Assessment difficulty' })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiProperty({ description: 'Total points for assessment', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  points?: number;

  @ApiProperty({ type: [String], description: 'Skills assessed by this assessment', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillsAssessed?: string[];

  @ApiProperty({ description: 'Is this assessment required', required: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}