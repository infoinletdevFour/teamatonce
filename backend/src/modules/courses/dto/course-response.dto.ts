import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificateSettingsDto, PublishSettingsDto, SeoSettingsDto, ModuleDto } from './create-course.dto';

// Analytics DTO
export class AnalyticsDto {
  @ApiProperty()
  views: number;

  @ApiProperty()
  enrollments: number;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  reviews: number;
}

// Lesson Response DTO
export class CourseLessonResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  duration?: string;

  @ApiProperty()
  isFree: boolean;

  @ApiPropertyOptional()
  resourceUrl?: string;

  @ApiPropertyOptional()
  uploadedFile?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

// Module Response DTO
export class ModuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ type: [CourseLessonResponseDto] })
  lessons: CourseLessonResponseDto[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class CourseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  instructorId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  subtitle?: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional()
  subcategory?: string;

  @ApiProperty()
  level: string;

  @ApiPropertyOptional()
  language?: string;

  // Pricing
  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  originalPrice?: number;

  @ApiPropertyOptional()
  currency?: string;

  @ApiPropertyOptional()
  refundPolicy?: number;

  // Media
  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  promoVideoUrl?: string;

  @ApiPropertyOptional()
  promoVideoType?: string;

  // Curriculum
  @ApiPropertyOptional({ type: [ModuleResponseDto] })
  modules?: ModuleResponseDto[];

  // Arrays
  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  prerequisites?: string[];

  @ApiPropertyOptional({ type: [String] })
  learningOutcomes?: string[];

  @ApiPropertyOptional({ type: [String] })
  targetAudience?: string[];

  // Features
  @ApiPropertyOptional()
  certificateEnabled?: boolean;

  @ApiPropertyOptional()
  discussionEnabled?: boolean;

  @ApiPropertyOptional()
  qnaEnabled?: boolean;

  @ApiPropertyOptional()
  downloadableResources?: boolean;

  @ApiPropertyOptional()
  mobileAccess?: boolean;

  @ApiPropertyOptional()
  lifetimeAccess?: boolean;

  // Settings
  @ApiPropertyOptional({ type: CertificateSettingsDto })
  certificateSettings?: CertificateSettingsDto;

  @ApiPropertyOptional({ type: PublishSettingsDto })
  publishSettings?: PublishSettingsDto;

  @ApiPropertyOptional({ type: SeoSettingsDto })
  seoSettings?: SeoSettingsDto;

  // Status
  @ApiPropertyOptional()
  status?: string;

  // Analytics
  @ApiPropertyOptional({ type: AnalyticsDto })
  analytics?: AnalyticsDto;

  // Timestamps
  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class CourseEnrollmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  course_id: string;

  @ApiProperty()
  enrollment_date: string;

  @ApiPropertyOptional()
  completion_date?: string;

  @ApiProperty()
  progress_percentage: number;

  @ApiProperty()
  total_study_time: number;

  @ApiPropertyOptional()
  current_lesson_id?: string;

  @ApiPropertyOptional()
  current_chapter_id?: string;

  @ApiPropertyOptional({ type: [String] })
  completed_lessons?: string[];

  @ApiPropertyOptional({ type: [String] })
  bookmarked_lessons?: string[];

  @ApiProperty()
  last_accessed_at: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  certificate_issued: boolean;

  @ApiPropertyOptional()
  certificate_issued_at?: string;

  @ApiPropertyOptional()
  rating?: number;

  @ApiPropertyOptional()
  review?: string;

  @ApiPropertyOptional()
  reviewed_at?: string;
}

export class PaginatedCoursesDto {
  @ApiProperty({ type: [CourseResponseDto] })
  data: CourseResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total_pages: number;
}
