import { IsString, IsOptional, IsInt, IsNumber, IsUUID, IsIn, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ==========================================
// SCORING DTOs
// ==========================================

export class ScoreEntityDto {
  @ApiPropertyOptional({
    description: 'Maximum number of entities to score',
    default: 50,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Re-score entities older than this many hours',
    default: 24,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  rescoreOlderThanHours?: number = 24;
}

export class TopEntitiesQueryDto {
  @ApiPropertyOptional({
    description: 'Sort by score dimension',
    enum: ['quality_score', 'activity_score', 'completeness_score', 'availability_score'],
    default: 'quality_score',
  })
  @IsOptional()
  @IsString()
  @IsIn(['quality_score', 'activity_score', 'completeness_score', 'availability_score'])
  sortBy?: string = 'quality_score';

  @ApiPropertyOptional({
    description: 'Minimum score threshold (0-100)',
    default: 0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minScore?: number = 0;

  @ApiPropertyOptional({
    description: 'Number of entities to return',
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
    description: 'Number of entities to skip',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

// ==========================================
// MATCHING DTOs
// ==========================================

export class MatchDevelopersDto {
  @ApiProperty({
    description: 'Enriched profile ID of the job post to match against',
  })
  @IsUUID()
  jobEnrichedProfileId: string;

  @ApiPropertyOptional({
    description: 'Maximum number of matches to return',
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
    description: 'Minimum composite score threshold (0-1)',
    default: 0,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  minScore?: number = 0;
}

export class MatchJobsDto {
  @ApiProperty({
    description: 'Unified entity ID of the developer to find jobs for',
  })
  @IsUUID()
  entityId: string;

  @ApiPropertyOptional({
    description: 'Maximum number of matches to return',
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
    description: 'Minimum composite score threshold (0-1)',
    default: 0,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  minScore?: number = 0;
}

export class MatchQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by match status',
    enum: ['active', 'dismissed', 'contacted'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'dismissed', 'contacted'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Number of matches to return',
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
    description: 'Number of matches to skip',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class UpdateMatchStatusDto {
  @ApiProperty({
    description: 'New match status',
    enum: ['active', 'dismissed', 'contacted'],
  })
  @IsString()
  @IsIn(['active', 'dismissed', 'contacted'])
  status: string;
}

// ==========================================
// COMPANY DTOs
// ==========================================

export class CompanyQueryDto {
  @ApiPropertyOptional({
    description: 'Search company name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by industry',
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({
    description: 'Filter by hiring status',
  })
  @IsOptional()
  @Type(() => Boolean)
  hiringActive?: boolean;

  @ApiPropertyOptional({
    description: 'Number of companies to return',
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
    description: 'Number of companies to skip',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class BackfillCompaniesDto {
  @ApiPropertyOptional({
    description: 'Maximum number of job posts to process',
    default: 100,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  limit?: number = 100;

  @ApiPropertyOptional({
    description: 'Filter by source (hackernews, remoteok, etc.)',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Force re-process already-linked job posts',
    default: false,
  })
  @IsOptional()
  force?: boolean;
}

// ==========================================
// CRAWLER DTOs
// ==========================================

export class CrawlWeWorkRemotelyDto {
  @ApiPropertyOptional({
    description: 'RSS category to crawl (e.g., "remote-programming-jobs")',
    default: 'remote-programming-jobs',
  })
  @IsOptional()
  @IsString()
  category?: string = 'remote-programming-jobs';

  @ApiPropertyOptional({
    description: 'Maximum number of jobs to crawl',
    default: 50,
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  limit?: number = 50;
}

export class CrawlStackOverflowDto {
  @ApiPropertyOptional({
    description: 'Minimum reputation score for users',
    default: 1000,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minReputation?: number = 1000;

  @ApiPropertyOptional({
    description: 'Sort order (reputation, creation, name, modified)',
    enum: ['reputation', 'creation', 'name', 'modified'],
    default: 'reputation',
  })
  @IsOptional()
  @IsString()
  @IsIn(['reputation', 'creation', 'name', 'modified'])
  sort?: string = 'reputation';

  @ApiPropertyOptional({
    description: 'Maximum number of NEW users to crawl',
    default: 30,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 30;

  @ApiPropertyOptional({ description: 'Starting page number', default: 1, minimum: 1, maximum: 25 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(25)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Auto-paginate to find enough new profiles', default: true })
  @IsOptional()
  @Type(() => Boolean)
  autoPaginate?: boolean = true;

  @ApiPropertyOptional({ description: 'Max pages to scan when auto-paginating', default: 5, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  maxPages?: number = 5;
}

// ==========================================
// RESPONSE INTERFACES
// ==========================================

export interface EntityScore {
  id: string;
  unifiedEntityId: string;
  completenessScore: number;
  activityScore: number;
  availabilityScore: number;
  qualityScore: number;
  scoreBreakdown: Record<string, any>;
  scoredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchResultResponse {
  id: string;
  jobEnrichedProfileId: string;
  developerEntityId: string;
  vectorSimilarity: number;
  ruleScore: number;
  compositeScore: number;
  matchBreakdown: Record<string, any>;
  status: string;
  matchedAt: string;
  createdAt: string;
}

export interface DashboardStats {
  crawl: CrawlHealth;
  enrichment: EnrichmentHealth;
  entity: EntityHealth;
  outreach: OutreachHealth;
  scores: ScoreDistribution;
}

export interface CrawlHealth {
  bySource: Record<string, { today: number; week: number; total: number }>;
  jobSuccessRate: number;
  lastCrawlTimestamps: Record<string, string>;
}

export interface EnrichmentHealth {
  totalCrawled: number;
  totalEnriched: number;
  enrichmentRate: number;
  qdrantCollections: Record<string, number>;
}

export interface EntityHealth {
  byType: Record<string, number>;
  withEmail: number;
  avgSourceCount: number;
  newThisWeek: number;
}

export interface OutreachHealth {
  campaignsByStatus: Record<string, number>;
  aggregateSent: number;
  aggregateOpened: number;
  aggregateClicked: number;
  aggregateBounced: number;
  openRate: number;
  clickRate: number;
  blocklistSize: number;
}

export interface ScoreDistribution {
  quality: Record<string, number>;
  activity: Record<string, number>;
  completeness: Record<string, number>;
  availability: Record<string, number>;
}
