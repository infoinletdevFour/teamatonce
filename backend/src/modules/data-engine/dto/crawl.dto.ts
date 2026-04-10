import { IsString, IsOptional, IsInt, Min, Max, IsIn, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CrawlGithubDto {
  @ApiProperty({
    description: 'GitHub search query (e.g., "language:typescript followers:>100")',
    example: 'language:typescript location:japan followers:>50',
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Maximum number of NEW profiles to crawl (already-crawled profiles are skipped automatically)',
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
    description: 'Starting page number for GitHub search results. Use to manually control pagination. Ignored when autoPaginate is true.',
    default: 1,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'When true, automatically fetches subsequent pages until the desired number of NEW profiles is reached (up to maxPages). When false, fetches only the specified page.',
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  autoPaginate?: boolean = true;

  @ApiPropertyOptional({
    description: 'Maximum number of pages to fetch when autoPaginate is true',
    default: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  maxPages?: number = 5;
}

export class CrawlHackerNewsDto {
  @ApiPropertyOptional({
    description: 'Month (1-12) for "Who\'s Hiring" thread. Defaults to current month.',
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({
    description: 'Year for "Who\'s Hiring" thread. Defaults to current year.',
    minimum: 2020,
  })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of job posts to crawl',
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
}

export class CrawlGenericDto {
  @ApiProperty({
    description: 'One or more URLs to crawl',
    example: ['https://example.com/jobs/123'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  urls: string[];

  @ApiPropertyOptional({
    description: 'Crawl mode: single URL, listing page (auto-discover links), or batch URLs',
    enum: ['single', 'listing', 'batch'],
    default: 'single',
  })
  @IsOptional()
  @IsString()
  @IsIn(['single', 'listing', 'batch'])
  mode?: string = 'single';

  @ApiPropertyOptional({
    description: 'What type of content to extract',
    enum: ['job_post', 'profile', 'company', 'auto'],
    default: 'auto',
  })
  @IsOptional()
  @IsString()
  @IsIn(['job_post', 'profile', 'company', 'auto'])
  contentType?: string = 'auto';

  @ApiPropertyOptional({
    description: 'How to fetch page HTML',
    enum: ['cheerio', 'puppeteer'],
    default: 'cheerio',
  })
  @IsOptional()
  @IsString()
  @IsIn(['cheerio', 'puppeteer'])
  fetchMethod?: string = 'cheerio';

  @ApiPropertyOptional({
    description: 'Max items to extract (listing mode)',
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
    description: 'Custom prompt hint for AI extraction',
  })
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiPropertyOptional({ description: 'Starting page for listing mode pagination', default: 1, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Auto-paginate listing pages to find enough new items', default: true })
  @IsOptional()
  @Type(() => Boolean)
  autoPaginate?: boolean = true;

  @ApiPropertyOptional({ description: 'Max listing pages to scan when auto-paginating', default: 3, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  maxPages?: number = 3;
}

export class CrawledDataQueryDto {
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

export class CrawlRemoteOKDto {
  @ApiPropertyOptional({
    description: 'Filter by tag (e.g., "javascript", "python", "devops", "react")',
    example: 'javascript',
  })
  @IsOptional()
  @IsString()
  tag?: string;

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

export class CrawlTokyoDevDto {
  @ApiPropertyOptional({
    description: 'Maximum number of NEW jobs to crawl',
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

  @ApiPropertyOptional({ description: 'Starting page number', default: 1, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Auto-paginate to find enough new jobs', default: true })
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

export class CrawlArbeitnowDto {
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

export class CrawlWantedlyDto {
  @ApiPropertyOptional({
    description: 'Location filter (e.g. "Tokyo")',
    example: 'Tokyo',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of NEW jobs to crawl',
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

  @ApiPropertyOptional({ description: 'Starting page number', default: 1, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Auto-paginate to find enough new jobs', default: true })
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

export class CrawlGreenJapanDto {
  @ApiPropertyOptional({
    description: 'Maximum number of NEW jobs to save',
    default: 30,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 30;

  @ApiPropertyOptional({
    description: 'Maximum sitemap URLs to process',
    default: 100,
    minimum: 1,
    maximum: 1100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1100)
  @Type(() => Number)
  maxUrls?: number = 100;

  @ApiPropertyOptional({ description: 'Auto-paginate through sitemap', default: true })
  @IsOptional()
  @Type(() => Boolean)
  autoPaginate?: boolean = true;
}

export class CrawlJapanDevDto {
  @ApiPropertyOptional({
    description: 'Maximum number of jobs to crawl',
    default: 300,
    minimum: 1,
    maximum: 600,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  @Type(() => Number)
  limit?: number = 300;
}

export class CrawlJobsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by source',
    enum: ['github', 'hackernews', 'remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely', 'stackoverflow', 'wantedly', 'generic', 'greenjapan', 'japandev'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['github', 'hackernews', 'remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely', 'stackoverflow', 'wantedly', 'generic', 'greenjapan', 'japandev'])
  source?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['pending', 'running', 'completed', 'failed'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'running', 'completed', 'failed'])
  status?: string;

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
