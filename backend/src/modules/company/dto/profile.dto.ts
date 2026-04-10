import { IsString, IsNumber, IsBoolean, IsArray, IsObject, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Availability {
  AVAILABLE = 'available',
  BUSY = 'busy',
  AWAY = 'away'
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Company/Profile name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Business email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Business phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Professional title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Professional tagline' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ description: 'Biography/About' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Avatar/Logo URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Hourly rate', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ enum: Availability, description: 'Availability status' })
  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability;

  @ApiPropertyOptional({ description: 'Response time description' })
  @IsOptional()
  @IsString()
  responseTime?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Skills array', type: [Object] })
  @IsOptional()
  @IsArray()
  skills?: any[];

  @ApiPropertyOptional({ description: 'Languages array', type: [Object] })
  @IsOptional()
  @IsArray()
  languages?: any[];

  @ApiPropertyOptional({ description: 'Education array', type: [Object] })
  @IsOptional()
  @IsArray()
  education?: any[];

  @ApiPropertyOptional({ description: 'Certifications array', type: [Object] })
  @IsOptional()
  @IsArray()
  certifications?: any[];

  @ApiPropertyOptional({ description: 'Experience array', type: [Object] })
  @IsOptional()
  @IsArray()
  experience?: any[];

  @ApiPropertyOptional({ description: 'Portfolio items array', type: [Object] })
  @IsOptional()
  @IsArray()
  portfolioItems?: any[];

  @ApiPropertyOptional({ description: 'Social links object', type: Object })
  @IsOptional()
  @IsObject()
  socialLinks?: any;
}

export class UploadImageDto {
  @ApiProperty({ enum: ['cover', 'avatar', 'portfolio'], description: 'Image type' })
  @IsString()
  type: 'cover' | 'avatar' | 'portfolio';
}
