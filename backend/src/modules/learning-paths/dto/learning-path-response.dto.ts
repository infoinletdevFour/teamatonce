import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseResponseDto } from '../../courses/dto';

export class LearningPathResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  thumbnail_url?: string;

  @ApiProperty()
  creator_id: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  level: string;

  @ApiProperty()
  estimated_duration_weeks: number;

  @ApiProperty()
  course_count: number;

  @ApiProperty()
  enrollment_count: number;

  @ApiProperty()
  completion_rate: number;

  @ApiProperty()
  rating_average: number;

  @ApiProperty()
  rating_count: number;

  @ApiPropertyOptional({ type: [String] })
  skills?: string[];

  @ApiPropertyOptional({ type: [String] })
  prerequisites?: string[];

  @ApiPropertyOptional({ type: [String] })
  learning_objectives?: string[];

  @ApiProperty()
  is_public: boolean;

  @ApiProperty()
  is_featured: boolean;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  published_at?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}

export class LearningPathCourseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  learning_path_id: string;

  @ApiProperty()
  course_id: string;

  @ApiProperty()
  order_index: number;

  @ApiProperty()
  is_required: boolean;

  @ApiPropertyOptional({ type: [String] })
  unlock_after?: string[];

  @ApiProperty()
  created_at: string;

  @ApiPropertyOptional()
  course?: CourseResponseDto;
}

export class LearningPathWithCoursesDto extends LearningPathResponseDto {
  @ApiProperty({ type: [LearningPathCourseDto] })
  courses: (LearningPathCourseDto & { course?: Partial<CourseResponseDto> })[];
}

export class LearningPathEnrollmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  learning_path_id: string;

  @ApiProperty()
  enrollment_date: string;

  @ApiPropertyOptional()
  completion_date?: string;

  @ApiProperty()
  progress_percentage: number;

  @ApiProperty()
  completed_courses: string[];

  @ApiPropertyOptional()
  current_course_id?: string;

  @ApiProperty()
  last_accessed_at: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  certificate_issued?: boolean;

  @ApiPropertyOptional()
  certificate_issued_at?: string;
}

export class PaginatedLearningPathsDto {
  @ApiProperty({ type: [LearningPathResponseDto] })
  data: LearningPathResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total_pages: number;
}