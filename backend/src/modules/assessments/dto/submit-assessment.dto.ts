import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @ApiProperty({ description: 'Question ID or index' })
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'Answer provided by the user' })
  answer: any;

  @ApiProperty({ description: 'Time spent on this question in seconds', required: false })
  @IsOptional()
  timeSpent?: number;
}

export class SubmitAssessmentDto {
  @ApiProperty({ type: [AnswerDto], description: 'User answers to the assessment questions' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiProperty({ description: 'Total time spent on assessment in minutes', required: false })
  @IsOptional()
  timeSpentMinutes?: number;
}