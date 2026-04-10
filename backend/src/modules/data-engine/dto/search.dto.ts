import { IsString, IsOptional, IsInt, Min, Max, IsIn, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchDto {
  @ApiProperty({
    description: 'Search query for semantic matching',
    example: 'senior react developer with typescript experience',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Type of data to search',
    enum: ['profile', 'job_post'],
    example: 'profile',
  })
  @IsString()
  @IsIn(['profile', 'job_post'])
  type: 'profile' | 'job_post';

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by source',
    enum: ['github', 'hackernews', 'remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely', 'stackoverflow', 'wantedly', 'generic', 'greenjapan', 'japandev'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['github', 'hackernews', 'remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely', 'stackoverflow', 'wantedly', 'generic', 'greenjapan', 'japandev'])
  source?: string;

  @ApiPropertyOptional({
    description: 'Minimum similarity score threshold (0-1)',
    minimum: 0,
    maximum: 1,
    default: 0.5,
  })
  @IsOptional()
  @Type(() => Number)
  threshold?: number = 0.5;
}

export class EnrichDto {
  @ApiPropertyOptional({
    description: 'Specific crawled data ID to enrich',
  })
  @IsOptional()
  @IsUUID()
  crawledDataId?: string;

  @ApiPropertyOptional({
    description: 'Filter by source to enrich',
    enum: ['github', 'hackernews', 'remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely', 'stackoverflow', 'wantedly', 'generic', 'greenjapan', 'japandev'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['github', 'hackernews', 'remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely', 'stackoverflow', 'wantedly', 'generic', 'greenjapan', 'japandev'])
  source?: string;

  @ApiPropertyOptional({
    description: 'Filter by type to enrich',
    enum: ['profile', 'job_post', 'company'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['profile', 'job_post', 'company'])
  type?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of items to enrich',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

export class EnrichedProfileQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by source',
    enum: ['github', 'hackernews', 'remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely', 'stackoverflow', 'wantedly', 'generic', 'greenjapan', 'japandev'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['github', 'hackernews', 'remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely', 'stackoverflow', 'wantedly', 'generic', 'greenjapan', 'japandev'])
  source?: string;

  @ApiPropertyOptional({
    description: 'Filter by type',
    enum: ['profile', 'job_post', 'company'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['profile', 'job_post', 'company'])
  type?: string;

  @ApiPropertyOptional({
    description: 'Number of items to return',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of items to skip',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

// Response interfaces for documentation
export interface SearchResult {
  id: string;
  score: number;
  source: string;
  type: string;
  structuredData: Record<string, any>;
  summary: string;
  rawData: Record<string, any>;
  enrichedAt: string;
}

export interface EnrichResponse {
  jobsQueued: number;
  message: string;
}

export interface EnrichedProfile {
  id: string;
  crawledDataId: string;
  source: string;
  type: string;
  structuredData: Record<string, any>;
  summary: string;
  embeddingId: string;
  enrichedAt: string;
  createdAt: string;
}

// ==========================================
// ENTITY RESOLUTION DTOs
// ==========================================

export class EntityQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by entity type',
    enum: ['person', 'company'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['person', 'company'])
  entityType?: 'person' | 'company';

  @ApiPropertyOptional({
    description: 'Number of items to return',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of items to skip',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class BatchResolveDto {
  @ApiPropertyOptional({
    description: 'Maximum number of profiles to resolve in this batch',
    default: 100,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 100;
}

// Entity resolution response interfaces
export interface UnifiedEntityResponse {
  id: string;
  entityType: 'person' | 'company';
  canonicalName: string;
  normalizedEmail: string | null;
  normalizedGithub: string | null;
  normalizedTwitter: string | null;
  normalizedLinkedin: string | null;
  location: string | null;
  company: string | null;
  mergedData: Record<string, any>;
  sourceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EntityResolutionStats {
  totalEntities: number;
  totalLinks: number;
  entitiesByType: Record<string, number>;
  linksByMatchType: Record<string, number>;
  averageSourcesPerEntity: number;
  entitiesWithMultipleSources: number;
}
