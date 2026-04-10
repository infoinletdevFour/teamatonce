import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { CertificateType } from './certificate-generation.dto';

export enum CertificateSortBy {
  ISSUED_DATE = 'issued_date',
  TITLE = 'title',
  TYPE = 'type',
  EXPIRY_DATE = 'expiry_date',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class CertificateQueryDto {
  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of certificates per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ 
    description: 'Filter by certificate type',
    enum: CertificateType
  })
  @IsOptional()
  @IsEnum(CertificateType)
  type?: CertificateType;

  @ApiPropertyOptional({ description: 'Filter by certificate status' })
  @IsOptional()
  @IsString()
  status?: 'active' | 'expired' | 'revoked';

  @ApiPropertyOptional({ description: 'Search in certificate title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by skills' })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ description: 'Filter certificates issued after this date' })
  @IsOptional()
  @IsDateString()
  issuedAfter?: string;

  @ApiPropertyOptional({ description: 'Filter certificates issued before this date' })
  @IsOptional()
  @IsDateString()
  issuedBefore?: string;

  @ApiPropertyOptional({ 
    description: 'Sort by field',
    enum: CertificateSortBy,
    default: CertificateSortBy.ISSUED_DATE
  })
  @IsOptional()
  @IsEnum(CertificateSortBy)
  sortBy?: CertificateSortBy = CertificateSortBy.ISSUED_DATE;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ description: 'Filter by course ID' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter by learning path ID' })
  @IsOptional()
  @IsString()
  learningPathId?: string;

  @ApiPropertyOptional({ description: 'Include expired certificates' })
  @IsOptional()
  includeExpired?: boolean = true;

  @ApiPropertyOptional({ description: 'Only show public certificates' })
  @IsOptional()
  publicOnly?: boolean = false;
}

export class VerifyCertificateDto {
  @ApiPropertyOptional({ description: 'Certificate ID to verify' })
  @IsOptional()
  @IsString()
  certificateId?: string;

  @ApiPropertyOptional({ description: 'Verification code from certificate' })
  @IsOptional()
  @IsString()
  verificationCode?: string;

  @ApiPropertyOptional({ description: 'Certificate URL to verify' })
  @IsOptional()
  @IsString()
  verificationUrl?: string;
}

export class BulkCertificateActionDto {
  @ApiPropertyOptional({ description: 'List of certificate IDs' })
  certificateIds: string[];

  @ApiPropertyOptional({ description: 'Action to perform' })
  action: 'revoke' | 'make_public' | 'make_private' | 'download' | 'delete';

  @ApiPropertyOptional({ description: 'Reason for bulk action' })
  @IsOptional()
  @IsString()
  reason?: string;
}