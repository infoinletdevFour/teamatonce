import { ApiProperty } from '@nestjs/swagger';
import { AssessmentType, DifficultyLevel, QuestionType } from './create-assessment.dto';

export class QuestionOptionResponseDto {
  @ApiProperty({ description: 'Option text' })
  text: string;

  @ApiProperty({ description: 'Option identifier' })
  id: string;
}

export class QuestionResponseDto {
  @ApiProperty({ description: 'Question ID' })
  id: string;

  @ApiProperty({ description: 'Question text' })
  question: string;

  @ApiProperty({ enum: QuestionType, description: 'Type of question' })
  type: QuestionType;

  @ApiProperty({ type: [QuestionOptionResponseDto], required: false, description: 'Question options' })
  options?: QuestionOptionResponseDto[];

  @ApiProperty({ description: 'Points for this question' })
  points: number;

  @ApiProperty({ description: 'Additional metadata for the question', required: false })
  metadata?: any;
}

export class AssessmentResponseDto {
  @ApiProperty({ description: 'Assessment ID' })
  id: string;

  @ApiProperty({ description: 'Assessment title' })
  title: string;

  @ApiProperty({ description: 'Assessment description', required: false })
  description?: string;

  @ApiProperty({ enum: AssessmentType, description: 'Type of assessment' })
  type: AssessmentType;

  @ApiProperty({ description: 'Course ID', required: false })
  courseId?: string;

  @ApiProperty({ description: 'Lesson ID', required: false })
  lessonId?: string;

  @ApiProperty({ description: 'Creator ID' })
  creatorId: string;

  @ApiProperty({ type: [QuestionResponseDto], description: 'Questions in the assessment' })
  questions: QuestionResponseDto[];

  @ApiProperty({ description: 'Time limit in minutes', required: false })
  timeLimitMinutes?: number;

  @ApiProperty({ description: 'Passing score percentage' })
  passingScore: number;

  @ApiProperty({ description: 'Maximum allowed attempts' })
  maxAttempts: number;

  @ApiProperty({ description: 'Should questions be randomized' })
  randomizeQuestions: boolean;

  @ApiProperty({ description: 'Show correct answers after completion' })
  showCorrectAnswers: boolean;

  @ApiProperty({ description: 'Allow review after completion' })
  allowReview: boolean;

  @ApiProperty({ enum: DifficultyLevel, description: 'Assessment difficulty' })
  difficulty: DifficultyLevel;

  @ApiProperty({ description: 'Total points for assessment' })
  points: number;

  @ApiProperty({ type: [String], description: 'Skills assessed' })
  skillsAssessed: string[];

  @ApiProperty({ description: 'Is this assessment required' })
  isRequired: boolean;

  @ApiProperty({ description: 'Assessment status' })
  status: string;

  @ApiProperty({ description: 'Published date', required: false })
  publishedAt?: Date;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  updatedAt: Date;
}