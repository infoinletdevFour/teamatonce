import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InstructorProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  display_name: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiProperty({ type: [String] })
  expertise: string[];

  @ApiProperty()
  years_experience: number;

  @ApiProperty()
  average_rating: number;

  @ApiProperty()
  total_reviews: number;

  @ApiProperty()
  total_students: number;

  @ApiProperty()
  courses_created: number;

  @ApiProperty()
  total_earnings: number;

  @ApiProperty()
  certificates: number;

  @ApiProperty()
  verified: boolean;

  @ApiPropertyOptional()
  timezone?: string;

  @ApiPropertyOptional({ type: [String] })
  languages?: string[];

  @ApiPropertyOptional()
  hourly_rate?: number;

  @ApiPropertyOptional()
  currency?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional()
  social_links?: Record<string, string>;

  @ApiPropertyOptional({ type: [String] })
  credentials?: string[];

  @ApiPropertyOptional()
  availability?: Record<string, string[]>;

  @ApiPropertyOptional()
  profile_image?: string;

  @ApiPropertyOptional()
  cover_image?: string;

  @ApiPropertyOptional()
  video_intro_url?: string;

  @ApiProperty()
  accept_students: boolean;

  @ApiPropertyOptional()
  max_students?: number;

  @ApiPropertyOptional()
  response_time?: string;

  @ApiPropertyOptional()
  completion_rate?: number;

  @ApiPropertyOptional()
  verification_status?: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;

  @ApiPropertyOptional()
  slug?: string;
}

export class PaginatedInstructorsDto {
  @ApiProperty({ type: [InstructorProfileDto] })
  instructors: InstructorProfileDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
