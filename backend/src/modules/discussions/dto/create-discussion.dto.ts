import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, IsEnum, IsArray, IsUUID } from 'class-validator';

export enum DiscussionType {
  QUESTION = 'question',
  ANNOUNCEMENT = 'announcement',
  GENERAL = 'general',
  STUDY_HELP = 'study_help',
  PROJECT = 'project',
  CAREER = 'career',
}

export enum DiscussionCategory {
  PROGRAMMING = 'programming',
  MATHEMATICS = 'mathematics',
  SCIENCE = 'science',
  LANGUAGE = 'language',
  BUSINESS = 'business',
  DESIGN = 'design',
  OTHER = 'other',
}

export class CreateDiscussionDto {
  @ApiProperty({
    description: 'Title of the discussion',
    example: 'How to optimize React component re-renders?',
    minLength: 10,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Content/body of the discussion',
    example: 'I am struggling with React component re-renders in my application. Every time the parent state updates, all child components re-render unnecessarily. What are the best practices to prevent this?',
    minLength: 20,
    maxLength: 10000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(10000)
  content: string;

  @ApiProperty({
    description: 'Type of discussion',
    enum: DiscussionType,
    example: DiscussionType.QUESTION,
  })
  @IsEnum(DiscussionType)
  type: DiscussionType;

  @ApiProperty({
    description: 'Category of discussion',
    enum: DiscussionCategory,
    example: DiscussionCategory.PROGRAMMING,
  })
  @IsEnum(DiscussionCategory)
  category: DiscussionCategory;

  @ApiPropertyOptional({
    description: 'Tags for better categorization',
    example: ['react', 'performance', 'optimization', 'components'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Related course ID if discussion is course-specific',
    example: 'course_react_advanced',
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Related study group ID if discussion is group-specific',
    example: 'sg_123',
  })
  @IsOptional()
  @IsString()
  studyGroupId?: string;

  @ApiPropertyOptional({
    description: 'Related lesson ID if discussion is lesson-specific',
    example: 'lesson_456',
  })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({
    description: 'Priority level for announcements',
    enum: ['low', 'normal', 'high', 'urgent'],
    example: 'normal',
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: string;

  @ApiPropertyOptional({
    description: 'Whether discussion should be pinned (moderators only)',
    example: false,
  })
  @IsOptional()
  isPinned?: boolean;

  @ApiPropertyOptional({
    description: 'Attached media/files metadata',
    example: [
      {
        type: 'image',
        url: 'https://example.com/screenshot.png',
        name: 'Component Screenshot',
      },
    ],
  })
  @IsOptional()
  attachments?: Array<{
    type: 'image' | 'document' | 'code' | 'link';
    url: string;
    name: string;
    size?: number;
  }>;
}