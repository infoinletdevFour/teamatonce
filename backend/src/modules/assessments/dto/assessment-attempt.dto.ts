import { ApiProperty } from '@nestjs/swagger';

export enum AttemptStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  EXPIRED = 'expired',
  ABANDONED = 'abandoned'
}

export class QuestionFeedbackDto {
  @ApiProperty({ description: 'Question ID' })
  questionId: string;

  @ApiProperty({ description: 'User answer' })
  userAnswer: any;

  @ApiProperty({ description: 'Correct answer' })
  correctAnswer: any;

  @ApiProperty({ description: 'Is the answer correct' })
  isCorrect: boolean;

  @ApiProperty({ description: 'Points earned' })
  pointsEarned: number;

  @ApiProperty({ description: 'Maximum points possible' })
  maxPoints: number;

  @ApiProperty({ description: 'Explanation for the answer', required: false })
  explanation?: string;
}

export class AssessmentAttemptResponseDto {
  @ApiProperty({ description: 'Attempt ID' })
  id: string;

  @ApiProperty({ description: 'Assessment ID' })
  assessmentId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Attempt number' })
  attemptNumber: number;

  @ApiProperty({ description: 'Started at timestamp' })
  startedAt: Date;

  @ApiProperty({ description: 'Submitted at timestamp', required: false })
  submittedAt?: Date;

  @ApiProperty({ description: 'Time spent in minutes', required: false })
  timeSpentMinutes?: number;

  @ApiProperty({ description: 'User answers' })
  answers: any;

  @ApiProperty({ description: 'Score achieved', required: false })
  score?: number;

  @ApiProperty({ description: 'Maximum possible score' })
  maxScore: number;

  @ApiProperty({ description: 'Percentage score', required: false })
  percentage?: number;

  @ApiProperty({ description: 'Did the user pass', required: false })
  passed?: boolean;

  @ApiProperty({ type: [QuestionFeedbackDto], description: 'Detailed feedback', required: false })
  feedback?: QuestionFeedbackDto[];

  @ApiProperty({ enum: AttemptStatus, description: 'Attempt status' })
  status: AttemptStatus;

  @ApiProperty({ description: 'Additional metadata' })
  metadata: any;
}