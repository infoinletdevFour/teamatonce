import { IsOptional, IsString, IsIn, IsArray, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const VALID_SOURCES = [
  'github', 'hackernews', 'remoteok', 'tokyodev', 'arbeitnow',
  'weworkremotely', 'stackoverflow', 'wantedly', 'generic',
  'greenjapan', 'japandev',
];

const VALID_URL_TYPES = ['github', 'linkedin', 'website', 'blog'];

export class ScanPipelineDto {
  @ApiPropertyOptional({ description: 'Filter enriched profiles by source' })
  @IsOptional()
  @IsString()
  @IsIn(VALID_SOURCES)
  source?: string;

  @ApiPropertyOptional({ description: 'Filter by enriched profile type' })
  @IsOptional()
  @IsString()
  @IsIn(['profile', 'job_post', 'company'])
  type?: string;

  @ApiPropertyOptional({ description: 'Which URL types to extract (default: all)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(VALID_URL_TYPES, { each: true })
  urlTypes?: string[];

  @ApiPropertyOptional({ description: 'Max enriched profiles to scan', default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 100;
}

export class RunPipelineDto extends ScanPipelineDto {
  @ApiPropertyOptional({ description: 'Auto-enrich newly crawled data', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  autoEnrich?: boolean = true;
}

// ============================================
// AUTOMATION PIPELINE DTOs
// ============================================

const VALID_JOB_SOURCES = [
  'remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely',
  'greenjapan', 'japandev', 'hackernews', 'wantedly', 'generic',
];

const VALID_PROFILE_SOURCES = [
  'github', 'hackernews', 'stackoverflow', 'wantedly', 'generic',
];

export class CreateJobsPipelineDto {
  @ApiPropertyOptional({ description: 'Job crawler source' })
  @IsString()
  @IsIn(VALID_JOB_SOURCES)
  source: string;

  @ApiPropertyOptional({ description: 'Max items to crawl', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Enable chain crawl of company websites', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  crawlCompanyWebsites?: boolean = true;

  @ApiPropertyOptional({ description: 'URLs for generic source' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  urls?: string[];

  // --- Generic crawler options ---
  @ApiPropertyOptional({ description: 'Generic crawl mode' })
  @IsOptional()
  @IsString()
  @IsIn(['single', 'listing', 'batch'])
  mode?: string;

  @ApiPropertyOptional({ description: 'Content type hint' })
  @IsOptional()
  @IsString()
  @IsIn(['auto', 'job_post', 'profile', 'company'])
  contentType?: string;

  @ApiPropertyOptional({ description: 'Fetch method' })
  @IsOptional()
  @IsString()
  @IsIn(['cheerio', 'puppeteer'])
  fetchMethod?: string;

  @ApiPropertyOptional({ description: 'Custom extraction prompt' })
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiPropertyOptional({ description: 'Auto-paginate listing pages', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  autoPaginate?: boolean;

  @ApiPropertyOptional({ description: 'Max pages for listing mode', default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  maxPages?: number;

  @ApiPropertyOptional({ description: 'Start page', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  // --- Source-specific options ---
  @ApiPropertyOptional({ description: 'RemoteOK tag filter' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'WeWorkRemotely category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Wantedly/GreenJapan location filter' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'HackerNews target month' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({ description: 'HackerNews target year' })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({ description: 'GreenJapan max URLs per listing page' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  maxUrls?: number;
}

export class CreateProfilesPipelineDto {
  @ApiPropertyOptional({ description: 'Profile crawler source' })
  @IsString()
  @IsIn(VALID_PROFILE_SOURCES)
  source: string;

  @ApiPropertyOptional({ description: 'Max items to crawl', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'URL types to follow in chain stage', default: ['github', 'linkedin', 'website'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(VALID_URL_TYPES, { each: true })
  chainUrlTypes?: string[];

  @ApiPropertyOptional({ description: 'URLs for generic source' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  urls?: string[];

  // --- Generic crawler options ---
  @ApiPropertyOptional({ description: 'Generic crawl mode' })
  @IsOptional()
  @IsString()
  @IsIn(['single', 'listing', 'batch'])
  mode?: string;

  @ApiPropertyOptional({ description: 'Content type hint' })
  @IsOptional()
  @IsString()
  @IsIn(['auto', 'job_post', 'profile', 'company'])
  contentType?: string;

  @ApiPropertyOptional({ description: 'Fetch method' })
  @IsOptional()
  @IsString()
  @IsIn(['cheerio', 'puppeteer'])
  fetchMethod?: string;

  @ApiPropertyOptional({ description: 'Custom extraction prompt' })
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiPropertyOptional({ description: 'Auto-paginate listing pages', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  autoPaginate?: boolean;

  @ApiPropertyOptional({ description: 'Max pages for listing mode', default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  maxPages?: number;

  @ApiPropertyOptional({ description: 'Start page', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  // --- Source-specific options ---
  @ApiPropertyOptional({ description: 'GitHub search query (e.g. "location:Japan language:TypeScript")' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'StackOverflow min reputation' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minReputation?: number;

  @ApiPropertyOptional({ description: 'StackOverflow sort order' })
  @IsOptional()
  @IsString()
  @IsIn(['reputation', 'creation', 'name'])
  sort?: string;

  @ApiPropertyOptional({ description: 'Wantedly location filter' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'HackerNews target month' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({ description: 'HackerNews target year' })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Type(() => Number)
  year?: number;
}

export class PipelineRunQueryDto {
  @ApiPropertyOptional({ description: 'Filter by run status' })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'running', 'completed', 'failed'])
  status?: string;

  @ApiPropertyOptional({ description: 'Limit', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Offset', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}
