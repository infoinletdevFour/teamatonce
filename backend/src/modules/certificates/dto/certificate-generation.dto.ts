import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';

export enum CertificateType {
  COURSE_COMPLETION = 'course_completion',
  SKILL_MASTERY = 'skill_mastery',
  LEARNING_PATH = 'learning_path',
  ACHIEVEMENT = 'achievement',
}

export enum CertificateTemplate {
  MODERN = 'modern',
  CLASSIC = 'classic',
  PROFESSIONAL = 'professional',
  ACADEMIC = 'academic',
  MINIMAL = 'minimal',
}

export class GenerateCertificateDto {
  @ApiProperty({ 
    description: 'Type of certificate to generate',
    enum: CertificateType
  })
  @IsNotEmpty()
  @IsEnum(CertificateType)
  type: CertificateType;

  @ApiProperty({ description: 'Certificate title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Certificate description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Course ID (for course completion certificates)' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Learning path ID (for learning path certificates)' })
  @IsOptional()
  @IsUUID()
  learningPathId?: string;

  @ApiPropertyOptional({ description: 'Skills demonstrated' })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ 
    description: 'Certificate template style',
    enum: CertificateTemplate,
    default: CertificateTemplate.MODERN
  })
  @IsOptional()
  @IsEnum(CertificateTemplate)
  template?: CertificateTemplate = CertificateTemplate.MODERN;

  @ApiPropertyOptional({ description: 'Certificate expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether certificate should be public' })
  @IsOptional()
  isPublic?: boolean = true;
}

export class CertificateDataDto {
  @ApiProperty({ description: 'Recipient name' })
  recipientName: string;

  @ApiProperty({ description: 'Certificate title' })
  title: string;

  @ApiProperty({ description: 'Issuing organization' })
  organization: string;

  @ApiProperty({ description: 'Issue date' })
  issueDate: Date;

  @ApiPropertyOptional({ description: 'Completion date' })
  completionDate?: Date;

  @ApiPropertyOptional({ description: 'Course or program completed' })
  programName?: string;

  @ApiPropertyOptional({ description: 'Skills or competencies' })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Grade or performance level' })
  grade?: string;

  @ApiPropertyOptional({ description: 'Duration of study' })
  studyDuration?: string;

  @ApiPropertyOptional({ description: 'Instructor or supervisor name' })
  instructorName?: string;

  @ApiPropertyOptional({ description: 'Organization logo URL' })
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Background design URL' })
  backgroundUrl?: string;

  @ApiPropertyOptional({ description: 'Signature URLs' })
  signatures?: Array<{
    name: string;
    title: string;
    signatureUrl?: string;
  }>;

  @ApiPropertyOptional({ description: 'QR code for verification' })
  qrCodeUrl?: string;

  @ApiPropertyOptional({ description: 'Certificate number' })
  certificateNumber?: string;

  @ApiPropertyOptional({ description: 'Additional custom data' })
  customData?: Record<string, any>;
}