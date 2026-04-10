import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, IsEnum, IsArray, IsDateString } from 'class-validator';

export enum StudyGroupVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITE_ONLY = 'invite_only',
}

export enum StudyGroupCategory {
  PROGRAMMING = 'programming',
  MATHEMATICS = 'mathematics',
  SCIENCE = 'science',
  LANGUAGE = 'language',
  BUSINESS = 'business',
  DESIGN = 'design',
  OTHER = 'other',
}

export class CreateStudyGroupDto {
  @ApiProperty({
    description: 'Name of the study group',
    example: 'Advanced React Study Group',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the study group',
    example: 'A group focused on learning advanced React concepts including hooks, context, and performance optimization',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Category of the study group',
    enum: StudyGroupCategory,
    example: StudyGroupCategory.PROGRAMMING,
  })
  @IsEnum(StudyGroupCategory)
  category: StudyGroupCategory;

  @ApiProperty({
    description: 'Visibility of the study group',
    enum: StudyGroupVisibility,
    example: StudyGroupVisibility.PUBLIC,
  })
  @IsEnum(StudyGroupVisibility)
  visibility: StudyGroupVisibility;

  @ApiPropertyOptional({
    description: 'Maximum number of members allowed',
    example: 20,
    minimum: 2,
    maximum: 100,
  })
  @IsOptional()
  maxMembers?: number;

  @ApiPropertyOptional({
    description: 'Tags for the study group',
    example: ['react', 'javascript', 'frontend'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Related course ID',
    example: 'course_123',
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Schedule information in JSON format',
    example: {
      timezone: 'UTC',
      meetings: [
        {
          day: 'monday',
          time: '19:00',
          duration: 120,
        },
      ],
    },
  })
  @IsOptional()
  schedule?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Group goals and objectives',
    example: 'Complete the React course together and build a collaborative project',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  goals?: string;
}