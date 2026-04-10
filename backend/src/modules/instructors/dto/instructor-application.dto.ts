import { IsString, IsNotEmpty, IsOptional, IsArray, IsInt, Min, IsEmail, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInstructorApplicationDto {
  @ApiProperty({ description: 'Display name for instructor profile' })
  @IsString()
  @IsNotEmpty()
  display_name: string;

  @ApiProperty({ description: 'Contact email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Professional title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Professional bio (minimum 100 characters)' })
  @IsString()
  @IsNotEmpty()
  bio: string;

  @ApiProperty({ description: 'Areas of expertise', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  expertise: string[];

  @ApiProperty({ description: 'Years of professional experience', minimum: 0 })
  @IsInt()
  @Min(0)
  years_experience: number;

  @ApiPropertyOptional({ description: 'Education background', type: [Object] })
  @IsArray()
  @IsOptional()
  education?: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;

  @ApiPropertyOptional({ description: 'Professional certifications', type: [String] })
  @IsArray()
  @IsOptional()
  certifications?: string[];

  @ApiPropertyOptional({ description: 'Previous teaching experience' })
  @IsString()
  @IsOptional()
  previous_teaching_experience?: string;

  @ApiProperty({ description: 'Why do you want to teach on this platform?' })
  @IsString()
  @IsNotEmpty()
  why_teach: string;

  @ApiProperty({ description: 'Sample course topics you plan to create', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  sample_course_topics: string[];

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Languages you can teach in', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @ApiPropertyOptional({ description: 'Personal or professional website' })
  @IsString()
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Social media links' })
  @IsOptional()
  social_links?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Resume/CV URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  resume_url?: string;

  @ApiPropertyOptional({ description: 'Portfolio URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  portfolio_url?: string;

  @ApiPropertyOptional({ description: 'Video introduction URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  video_intro_url?: string;
}

export class InstructorApplicationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  display_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  submitted_at: string;

  @ApiPropertyOptional()
  reviewed_at?: string;

  @ApiPropertyOptional()
  reviewed_by?: string;

  @ApiPropertyOptional()
  admin_notes?: string;

  @ApiPropertyOptional()
  rejection_reason?: string;
}

export class ReviewInstructorApplicationDto {
  @ApiProperty({ enum: ['approved', 'rejected'], description: 'Review decision' })
  @IsString()
  @IsNotEmpty()
  decision: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: 'Admin notes (internal)' })
  @IsString()
  @IsOptional()
  admin_notes?: string;

  @ApiPropertyOptional({ description: 'Rejection reason (shown to applicant)' })
  @IsString()
  @IsOptional()
  rejection_reason?: string;
}
