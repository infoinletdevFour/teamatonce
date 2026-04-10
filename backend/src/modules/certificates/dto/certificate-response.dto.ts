import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificateType, CertificateDataDto } from './certificate-generation.dto';

export class CertificateDto {
  @ApiProperty({ description: 'Certificate ID' })
  id: string;

  @ApiProperty({ description: 'User ID who earned the certificate' })
  userId: string;

  @ApiProperty({ 
    description: 'Certificate type',
    enum: CertificateType
  })
  type: CertificateType;

  @ApiProperty({ description: 'Certificate title' })
  title: string;

  @ApiPropertyOptional({ description: 'Certificate description' })
  description?: string;

  @ApiProperty({ description: 'Issue date' })
  issuedAt: Date;

  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Public verification URL' })
  verificationUrl: string;

  @ApiProperty({ description: 'Certificate PDF download URL' })
  certificateUrl: string;

  @ApiPropertyOptional({ description: 'Certificate image/preview URL' })
  imageUrl?: string;

  @ApiProperty({ description: 'Certificate data', type: CertificateDataDto })
  certificateData: CertificateDataDto;

  @ApiPropertyOptional({ description: 'Skills demonstrated' })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Associated course ID' })
  courseId?: string;

  @ApiPropertyOptional({ description: 'Associated learning path ID' })
  learningPathId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Whether certificate is publicly viewable' })
  isPublic: boolean;

  @ApiProperty({ description: 'Certificate status' })
  status: 'active' | 'expired' | 'revoked';
}

export class CertificateCreationResponseDto {
  @ApiProperty({ description: 'Generated certificate', type: CertificateDto })
  certificate: CertificateDto;

  @ApiProperty({ description: 'Generation success status' })
  success: boolean;

  @ApiProperty({ description: 'Status message' })
  message: string;

  @ApiPropertyOptional({ description: 'Processing time in milliseconds' })
  processingTime?: number;

  @ApiPropertyOptional({ description: 'Generation details' })
  generationDetails?: {
    templateUsed: string;
    dataSource: string;
    verificationCodeGenerated: boolean;
    pdfGenerated: boolean;
  };
}

export class CertificateVerificationDto {
  @ApiProperty({ description: 'Verification status' })
  isValid: boolean;

  @ApiProperty({ description: 'Certificate details if valid', type: CertificateDto })
  certificate?: CertificateDto;

  @ApiProperty({ description: 'Verification message' })
  message: string;

  @ApiPropertyOptional({ description: 'Verification timestamp' })
  verifiedAt?: Date;

  @ApiPropertyOptional({ description: 'Additional verification info' })
  verificationInfo?: {
    recipientVerified: boolean;
    organizationVerified: boolean;
    integrityVerified: boolean;
    notExpired: boolean;
    notRevoked: boolean;
  };
}

export class CertificateListDto {
  @ApiProperty({ description: 'List of certificates', type: [CertificateDto] })
  certificates: CertificateDto[];

  @ApiProperty({ description: 'Total count of certificates' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of certificates per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiPropertyOptional({ description: 'Certificates by type breakdown' })
  breakdown?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Summary statistics' })
  statistics?: {
    totalEarned: number;
    expiredCount: number;
    activeCount: number;
    skillsCovered: string[];
    latestCertificate?: CertificateDto;
  };
}

export class CertificateStatsDto {
  @ApiProperty({ description: 'Total certificates earned' })
  totalCertificates: number;

  @ApiProperty({ description: 'Certificates by type', type: Object })
  byType: Record<string, number>;

  @ApiProperty({ description: 'Certificates earned this year' })
  thisYear: number;

  @ApiProperty({ description: 'Certificates earned this month' })
  thisMonth: number;

  @ApiProperty({ description: 'Most recent certificate', type: CertificateDto })
  mostRecent?: CertificateDto;

  @ApiProperty({ description: 'Skills covered by certificates' })
  skillsCovered: string[];

  @ApiProperty({ description: 'Completion rate statistics' })
  completionStats: {
    coursesCompleted: number;
    learningPathsCompleted: number;
    averageCompletionTime: number; // in days
  };

  @ApiProperty({ description: 'Achievement milestones' })
  milestones: Array<{
    title: string;
    description: string;
    achievedAt: Date;
    certificateId?: string;
  }>;
}