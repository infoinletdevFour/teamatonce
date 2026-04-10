import { IsString, IsNotEmpty, IsOptional, IsArray, IsInt, Min, IsNumber, IsBoolean, IsUrl, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInstructorDto {
  @ApiProperty({ description: 'Display name for instructor profile' })
  @IsString()
  @IsNotEmpty()
  display_name: string;

  @ApiPropertyOptional({ description: 'Professional title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Instructor bio' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Areas of expertise', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  expertise?: string[];

  @ApiPropertyOptional({ description: 'Years of experience', minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  years_experience?: number;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Languages spoken', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @ApiPropertyOptional({ description: 'Hourly rate for 1-on-1 sessions' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  hourly_rate?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Social media links' })
  @IsObject()
  @IsOptional()
  social_links?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Credentials and certifications', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  credentials?: string[];

  @ApiPropertyOptional({ description: 'Weekly availability schedule' })
  @IsObject()
  @IsOptional()
  availability?: Record<string, string[]>;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  profile_image?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  cover_image?: string;

  @ApiPropertyOptional({ description: 'Video introduction URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  video_intro_url?: string;

  @ApiPropertyOptional({ description: 'Accept new students', default: true })
  @IsBoolean()
  @IsOptional()
  accept_students?: boolean;

  @ApiPropertyOptional({ description: 'Maximum students limit' })
  @IsInt()
  @Min(1)
  @IsOptional()
  max_students?: number;
}
