import { IsString, IsOptional, IsNumber, IsArray, IsEnum, IsBoolean, Min, ValidateNested, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Certificate Settings DTO
export class CertificateSettingsDto {
  @ApiPropertyOptional({ description: 'Enable certificate' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Certificate template' })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({ description: 'Passing score percentage' })
  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @ApiPropertyOptional({ description: 'Include grade in certificate' })
  @IsOptional()
  @IsBoolean()
  includeGrade?: boolean;

  @ApiPropertyOptional({ description: 'Include completion date' })
  @IsOptional()
  @IsBoolean()
  includeCompletionDate?: boolean;

  @ApiPropertyOptional({ description: 'Include course duration' })
  @IsOptional()
  @IsBoolean()
  includeCourseDuration?: boolean;

  @ApiPropertyOptional({ description: 'Include instructor signature' })
  @IsOptional()
  @IsBoolean()
  includeInstructorSignature?: boolean;

  @ApiPropertyOptional({ description: 'Custom text for certificate' })
  @IsOptional()
  @IsString()
  customText?: string;

  @ApiPropertyOptional({ description: 'Validity period in days' })
  @IsOptional()
  @IsNumber()
  validityPeriod?: number;

  @ApiPropertyOptional({ description: 'Verification method' })
  @IsOptional()
  @IsString()
  verificationMethod?: string;

  @ApiPropertyOptional({ description: 'Enable badge' })
  @IsOptional()
  @IsBoolean()
  badgeEnabled?: boolean;

  @ApiPropertyOptional({ description: 'LinkedIn integration enabled' })
  @IsOptional()
  @IsBoolean()
  linkedinIntegration?: boolean;

  @ApiPropertyOptional({ description: 'Certificate ID prefix' })
  @IsOptional()
  @IsString()
  idPrefix?: string;
}

// Publish Settings DTO
export class PublishSettingsDto {
  @ApiPropertyOptional({
    description: 'Course status',
    enum: ['draft', 'published', 'archived']
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @ApiPropertyOptional({ description: 'Publish date' })
  @IsOptional()
  @IsDateString()
  publishDate?: Date;

  @ApiPropertyOptional({
    description: 'Visibility',
    enum: ['public', 'private', 'unlisted']
  })
  @IsOptional()
  @IsEnum(['public', 'private', 'unlisted'])
  visibility?: string;

  @ApiPropertyOptional({ description: 'Enrollment limit' })
  @IsOptional()
  @IsNumber()
  enrollmentLimit?: number;

  @ApiPropertyOptional({ description: 'Enrollment deadline' })
  @IsOptional()
  @IsDateString()
  enrollmentDeadline?: Date;
}

// SEO Settings DTO
export class SeoSettingsDto {
  @ApiPropertyOptional({ description: 'Meta title' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'Meta description' })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'URL slug' })
  @IsOptional()
  @IsString()
  urlSlug?: string;

  @ApiPropertyOptional({ description: 'Keywords', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}

// Lesson DTO
export class LessonDto {
  @ApiProperty({ description: 'Lesson title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Lesson description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Lesson type',
    enum: ['video', 'audio', 'pdf', 'quiz', 'assignment']
  })
  @IsEnum(['video', 'audio', 'pdf', 'quiz', 'assignment'])
  type: string;

  @ApiPropertyOptional({ description: 'Lesson duration (e.g., "10:30")' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ description: 'Is lesson free preview' })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ description: 'Resource URL (for existing resources)' })
  @IsOptional()
  @IsString()
  resourceUrl?: string;

  @ApiPropertyOptional({ description: 'Uploaded file URL (after upload)' })
  @IsOptional()
  @IsString()
  uploadedFile?: string;
}

// Module DTO
export class ModuleDto {
  @ApiProperty({ description: 'Module title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Module description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Module order' })
  @IsNumber()
  order: number;

  @ApiProperty({ description: 'Module lessons', type: [LessonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonDto)
  lessons: LessonDto[];
}

// Main Create Course DTO
export class CreateCourseDto {
  // Basic Info
  @ApiProperty({ description: 'Course title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Course subtitle' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ description: 'Course description (HTML content)' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Course category' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Course subcategory' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({
    description: 'Course difficulty level',
    enum: ['beginner', 'intermediate', 'advanced']
  })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  level: string;

  @ApiPropertyOptional({ description: 'Course language', default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  // Pricing
  @ApiPropertyOptional({ description: 'Course price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Original price (before discount)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Refund policy in days' })
  @IsOptional()
  @IsNumber()
  refundPolicy?: number;

  // Media URLs (files should be uploaded separately and URLs provided)
  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Promo video URL' })
  @IsOptional()
  @IsString()
  promoVideoUrl?: string;

  @ApiPropertyOptional({
    description: 'Promo video type',
    enum: ['file', 'youtube', 'url']
  })
  @IsOptional()
  @IsEnum(['file', 'youtube', 'url'])
  promoVideoType?: string;

  // Curriculum
  @ApiPropertyOptional({ description: 'Course modules', type: [ModuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleDto)
  modules?: ModuleDto[];

  // Learning Details
  @ApiPropertyOptional({ description: 'Course tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Prerequisites', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({ description: 'Learning outcomes', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningOutcomes?: string[];

  @ApiPropertyOptional({ description: 'Target audience', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAudience?: string[];

  // Features
  @ApiPropertyOptional({ description: 'Enable certificate on completion' })
  @IsOptional()
  @IsBoolean()
  certificateEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable discussion forum' })
  @IsOptional()
  @IsBoolean()
  discussionEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable Q&A' })
  @IsOptional()
  @IsBoolean()
  qnaEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Downloadable resources available' })
  @IsOptional()
  @IsBoolean()
  downloadableResources?: boolean;

  @ApiPropertyOptional({ description: 'Mobile access enabled' })
  @IsOptional()
  @IsBoolean()
  mobileAccess?: boolean;

  @ApiPropertyOptional({ description: 'Lifetime access enabled' })
  @IsOptional()
  @IsBoolean()
  lifetimeAccess?: boolean;

  // Certificate Settings
  @ApiPropertyOptional({ description: 'Certificate settings', type: CertificateSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CertificateSettingsDto)
  certificateSettings?: CertificateSettingsDto;

  // Publishing
  @ApiPropertyOptional({ description: 'Publish settings', type: PublishSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PublishSettingsDto)
  publishSettings?: PublishSettingsDto;

  // SEO
  @ApiPropertyOptional({ description: 'SEO settings', type: SeoSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeoSettingsDto)
  seoSettings?: SeoSettingsDto;
}
