import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, Res, UseGuards, HttpCode, HttpStatus, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Observable, interval, map, takeWhile, switchMap, from, of } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrawledDataService } from './services/crawled-data.service';
import { EnrichmentService } from './services/enrichment.service';
import { EntityResolutionService } from './services/entity-resolution.service';
import { SesEmailService } from './services/ses-email.service';
import { OutreachService } from './services/outreach.service';
import { EntityScoringService } from './services/entity-scoring.service';
import { MatchingService } from './services/matching.service';
import { DataEngineDashboardService } from './services/data-engine-dashboard.service';
import { GithubCrawler } from './crawlers/github.crawler';
import { HackerNewsCrawler } from './crawlers/hackernews.crawler';
import { RemoteOKCrawler } from './crawlers/remoteok.crawler';
import { TokyoDevCrawler } from './crawlers/tokyodev.crawler';
import { ArbeitnowCrawler } from './crawlers/arbeitnow.crawler';
import { WeWorkRemotelyCrawler } from './crawlers/weworkremotely.crawler';
import { StackOverflowCrawler } from './crawlers/stackoverflow.crawler';
import { WantedlyCrawler } from './crawlers/wantedly.crawler';
import { GenericCrawler } from './crawlers/generic.crawler';
import { GreenJapanCrawler } from './crawlers/greenjapan.crawler';
import { JapanDevCrawler } from './crawlers/japandev.crawler';
import { EnrichmentProcessor } from './processors/enrichment.processor';
import { OutreachProcessor } from './processors/outreach.processor';
import { PipelineService } from './services/pipeline.service';
import { PipelineProcessor } from './processors/pipeline.processor';
import { OperationsProcessor } from './processors/operations.processor';
import { QueueService } from '../queue/queue.service';
import {
  CrawlGithubDto,
  CrawlHackerNewsDto,
  CrawlRemoteOKDto,
  CrawlTokyoDevDto,
  CrawlArbeitnowDto,
  CrawledDataQueryDto,
  CrawlJobsQueryDto,
  SearchDto,
  EnrichDto,
  EnrichedProfileQueryDto,
  EntityQueryDto,
  BatchResolveDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignQueryDto,
  AddRecipientsDto,
  RecipientQueryDto,
  SendCampaignDto,
  AddToBlocklistDto,
  BlocklistQueryDto,
  ScoreEntityDto,
  TopEntitiesQueryDto,
  MatchDevelopersDto,
  MatchJobsDto,
  MatchQueryDto,
  UpdateMatchStatusDto,
  CrawlWeWorkRemotelyDto,
  CrawlStackOverflowDto,
  CrawlWantedlyDto,
  CrawlGenericDto,
  CrawlGreenJapanDto,
  CrawlJapanDevDto,
  ScanPipelineDto,
  RunPipelineDto,
  PipelineRunQueryDto,
  CreateJobsPipelineDto,
  CreateProfilesPipelineDto,
  CompanyQueryDto,
  BackfillCompaniesDto,
} from './dto';

/**
 * Data Engine Controller
 * Admin endpoints for crawling and viewing raw data
 *
 * TODO: Re-enable auth guards after testing:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('admin', 'super_admin')
 * @ApiBearerAuth()
 */
@ApiTags('Data Engine')
@Controller('admin/data-engine')
// @UseGuards(JwtAuthGuard, RolesGuard)  // TEMPORARILY DISABLED FOR TESTING
// @Roles('admin', 'super_admin')         // TEMPORARILY DISABLED FOR TESTING
// @ApiBearerAuth()                       // TEMPORARILY DISABLED FOR TESTING
export class DataEngineController {
  constructor(
    private readonly crawledDataService: CrawledDataService,
    private readonly enrichmentService: EnrichmentService,
    private readonly entityResolutionService: EntityResolutionService,
    private readonly sesEmailService: SesEmailService,
    private readonly outreachService: OutreachService,
    private readonly entityScoringService: EntityScoringService,
    private readonly matchingService: MatchingService,
    private readonly dashboardService: DataEngineDashboardService,
    private readonly githubCrawler: GithubCrawler,
    private readonly hackerNewsCrawler: HackerNewsCrawler,
    private readonly remoteOKCrawler: RemoteOKCrawler,
    private readonly tokyoDevCrawler: TokyoDevCrawler,
    private readonly arbeitnowCrawler: ArbeitnowCrawler,
    private readonly weWorkRemotelyCrawler: WeWorkRemotelyCrawler,
    private readonly stackOverflowCrawler: StackOverflowCrawler,
    private readonly wantedlyCrawler: WantedlyCrawler,
    private readonly genericCrawler: GenericCrawler,
    private readonly greenJapanCrawler: GreenJapanCrawler,
    private readonly japanDevCrawler: JapanDevCrawler,
    private readonly enrichmentProcessor: EnrichmentProcessor,
    private readonly outreachProcessor: OutreachProcessor,
    private readonly pipelineService: PipelineService,
    private readonly pipelineProcessor: PipelineProcessor,
    private readonly operationsProcessor: OperationsProcessor,
    private readonly queueService: QueueService,
  ) {}

  // ==========================================
  // CRAWL TRIGGERS
  // ==========================================

  @Post('crawl/github')
  @ApiOperation({ summary: 'Trigger GitHub profile crawl' })
  @ApiResponse({ status: 200, description: 'Crawl completed' })
  @ApiResponse({ status: 403, description: 'Access denied - admin role required' })
  async crawlGithub(@Body() dto: CrawlGithubDto) {
    const result = await this.githubCrawler.crawlByQuery({
      query: dto.query,
      limit: dto.limit,
      page: dto.page,
      autoPaginate: dto.autoPaginate,
      maxPages: dto.maxPages,
    });

    return { data: result };
  }

  @Post('crawl/hackernews')
  @ApiOperation({ summary: 'Trigger Hacker News "Who\'s Hiring" crawl' })
  @ApiResponse({ status: 200, description: 'Crawl completed' })
  @ApiResponse({ status: 403, description: 'Access denied - admin role required' })
  async crawlHackerNews(@Body() dto: CrawlHackerNewsDto) {
    const result = await this.hackerNewsCrawler.crawlWhoIsHiring({
      month: dto.month,
      year: dto.year,
      limit: dto.limit,
    });

    return { data: result };
  }

  @Post('crawl/remoteok')
  @ApiOperation({ summary: 'Trigger RemoteOK job crawl (Global remote jobs)' })
  @ApiResponse({ status: 200, description: 'Crawl completed' })
  @ApiResponse({ status: 403, description: 'Access denied - admin role required' })
  async crawlRemoteOK(@Body() dto: CrawlRemoteOKDto) {
    const result = await this.remoteOKCrawler.crawlJobs({
      tag: dto.tag,
      limit: dto.limit,
    });

    return { data: result };
  }

  @Post('crawl/tokyodev')
  @ApiOperation({ summary: 'Trigger TokyoDev job crawl (Japan tech jobs)' })
  @ApiResponse({ status: 200, description: 'Crawl completed' })
  @ApiResponse({ status: 403, description: 'Access denied - admin role required' })
  async crawlTokyoDev(@Body() dto: CrawlTokyoDevDto) {
    const result = await this.tokyoDevCrawler.crawlJobs({
      limit: dto.limit,
      page: dto.page,
      autoPaginate: dto.autoPaginate,
      maxPages: dto.maxPages,
    });

    return { data: result };
  }

  @Post('crawl/arbeitnow')
  @ApiOperation({ summary: 'Trigger Arbeitnow crawl (European tech jobs)' })
  @ApiResponse({ status: 200, description: 'Crawl completed' })
  @ApiResponse({ status: 403, description: 'Access denied - admin role required' })
  async crawlArbeitnow(@Body() dto: CrawlArbeitnowDto) {
    const result = await this.arbeitnowCrawler.crawlJobs({
      limit: dto.limit,
    });

    return { data: result };
  }

  // ==========================================
  // CRAWLED DATA QUERIES
  // ==========================================

  @Get('crawled')
  @ApiOperation({ summary: 'List crawled data with filters' })
  @ApiResponse({ status: 200, description: 'Crawled data retrieved successfully' })
  async listCrawledData(@Query() query: CrawledDataQueryDto) {
    const result = await this.crawledDataService.findAll({
      source: query.source,
      type: query.type,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  @Get('crawled/:id')
  @ApiOperation({ summary: 'Get a single crawled item by ID' })
  @ApiResponse({ status: 200, description: 'Crawled item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getCrawledItem(@Param('id') id: string) {
    const item = await this.crawledDataService.findById(id);

    if (!item) {
      return { error: 'Item not found', statusCode: 404 };
    }

    return { data: item };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get crawled data statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    const stats = await this.crawledDataService.getStats();
    return { data: stats };
  }

  // ==========================================
  // CRAWL JOBS
  // ==========================================

  @Get('jobs')
  @ApiOperation({ summary: 'List crawl jobs with filters' })
  @ApiResponse({ status: 200, description: 'Crawl jobs retrieved successfully' })
  async listCrawlJobs(@Query() query: CrawlJobsQueryDto) {
    const result = await this.crawledDataService.findJobs({
      source: query.source,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get a crawl job by ID' })
  @ApiResponse({ status: 200, description: 'Crawl job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getCrawlJob(@Param('id') id: string) {
    const job = await this.crawledDataService.getJobById(id);

    if (!job) {
      return { error: 'Job not found', statusCode: 404 };
    }

    return { data: job };
  }

  // ==========================================
  // AI ENRICHMENT
  // ==========================================

  @Post('enrich')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger AI enrichment for crawled data' })
  @ApiResponse({ status: 200, description: 'Enrichment jobs queued' })
  async triggerEnrichment(@Body() dto: EnrichDto) {
    // If a specific crawledDataId is provided, enrich just that item
    if (dto.crawledDataId) {
      const crawledData = await this.crawledDataService.findById(dto.crawledDataId);

      if (!crawledData) {
        return { error: 'Crawled data not found', statusCode: 404 };
      }

      const job = await this.enrichmentProcessor.queueEnrichment(
        crawledData.id,
        crawledData.source,
        crawledData.type,
      );

      return {
        data: {
          jobsQueued: job ? 1 : 0,
          message: job ? 'Enrichment job queued' : 'Already enriched or failed to queue',
        },
      };
    }

    // Otherwise, get unenriched data based on filters
    const unenrichedData = await this.enrichmentService.getUnenrichedData({
      source: dto.source,
      type: dto.type,
      limit: dto.limit,
    });

    if (unenrichedData.length === 0) {
      return {
        data: {
          jobsQueued: 0,
          message: 'No unenriched data found',
        },
      };
    }

    // Queue enrichment jobs
    const items = unenrichedData.map((d: any) => ({
      id: d.id,
      source: d.source,
      type: d.type,
    }));

    const queuedCount = await this.enrichmentProcessor.queueBulkEnrichment(items);

    return {
      data: {
        jobsQueued: queuedCount,
        message: `Queued ${queuedCount} enrichment jobs`,
      },
    };
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Semantic search across enriched data' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async search(@Body() dto: SearchDto) {
    let results: any[];

    // Build filter for search
    const filter: Record<string, any> = {};
    if (dto.source) {
      filter.source = dto.source;
    }

    if (dto.type === 'profile') {
      results = await this.enrichmentService.searchProfiles(
        dto.query,
        dto.limit || 10,
        Object.keys(filter).length > 0 ? filter : undefined,
      );
    } else {
      results = await this.enrichmentService.searchJobs(
        dto.query,
        dto.limit || 10,
        Object.keys(filter).length > 0 ? filter : undefined,
      );
    }

    // Filter by threshold if specified
    if (dto.threshold && dto.threshold > 0) {
      results = results.filter((r) => r.score >= dto.threshold);
    }

    return {
      data: results,
      meta: {
        query: dto.query,
        type: dto.type,
        count: results.length,
        limit: dto.limit || 10,
      },
    };
  }

  // ==========================================
  // ENRICHED DATA QUERIES
  // ==========================================

  @Get('enriched')
  @ApiOperation({ summary: 'List enriched profiles with filters' })
  @ApiResponse({ status: 200, description: 'Enriched profiles retrieved successfully' })
  async listEnrichedProfiles(@Query() query: EnrichedProfileQueryDto) {
    const result = await this.enrichmentService.findAllEnriched({
      source: query.source,
      type: query.type,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  @Get('enriched/:id')
  @ApiOperation({ summary: 'Get a single enriched profile by ID' })
  @ApiResponse({ status: 200, description: 'Enriched profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getEnrichedProfile(@Param('id') id: string) {
    const profile = await this.enrichmentService.getEnrichedProfileById(id);

    if (!profile) {
      return { error: 'Enriched profile not found', statusCode: 404 };
    }

    // Also fetch the associated raw data
    const rawData = await this.enrichmentService.getCrawledDataById(profile.crawledDataId);

    return {
      data: {
        ...profile,
        rawData: rawData?.rawData || {},
      },
    };
  }

  @Get('enrichment-stats')
  @ApiOperation({ summary: 'Get enrichment statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getEnrichmentStats() {
    const stats = await this.enrichmentService.getEnrichmentStats();
    return { data: stats };
  }

  @Get('enrichment-queue')
  @ApiOperation({ summary: 'Get enrichment queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue stats retrieved successfully' })
  async getEnrichmentQueueStats() {
    const stats = await this.enrichmentProcessor.getQueueStats();
    return { data: stats };
  }

  // ==========================================
  // ENTITY RESOLUTION
  // ==========================================

  @Get('entities')
  @ApiOperation({ summary: 'List unified entities with filters' })
  @ApiResponse({ status: 200, description: 'Unified entities retrieved successfully' })
  async listEntities(@Query() query: EntityQueryDto) {
    const result = await this.entityResolutionService.listUnifiedEntities({
      entityType: query.entityType,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  @Get('entities/stats')
  @ApiOperation({ summary: 'Get entity resolution statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getEntityStats() {
    const stats = await this.entityResolutionService.getResolutionStats();
    return { data: stats };
  }

  @Get('entities/:id')
  @ApiOperation({ summary: 'Get a unified entity by ID with all linked sources' })
  @ApiResponse({ status: 200, description: 'Unified entity retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async getEntity(@Param('id') id: string) {
    const result = await this.entityResolutionService.getUnifiedEntityWithSources(id);

    if (!result) {
      return { error: 'Entity not found', statusCode: 404 };
    }

    return {
      data: {
        entity: result.entity,
        sources: result.sources.map((s) => ({
          matchType: s.link.matchType,
          confidenceScore: s.link.confidenceScore,
          linkedAt: s.link.linkedAt,
          profile: s.profile,
          rawData: s.rawData,
        })),
      },
    };
  }

  @Post('entities/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger batch entity resolution for unlinked profiles' })
  @ApiResponse({ status: 200, description: 'Batch resolution completed' })
  async triggerBatchResolution(@Body() dto: BatchResolveDto) {
    const result = await this.entityResolutionService.batchResolve({
      limit: dto.limit,
    });

    return {
      data: {
        processed: result.processed,
        newEntities: result.newEntities,
        linkedToExisting: result.linkedToExisting,
        errors: result.errors,
        message: `Processed ${result.processed} profiles: ${result.newEntities} new entities, ${result.linkedToExisting} linked to existing`,
      },
    };
  }

  @Post('entities/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a specific enriched profile to an entity' })
  @ApiResponse({ status: 200, description: 'Resolution completed' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async resolveProfile(@Param('id') enrichedProfileId: string) {
    const result = await this.entityResolutionService.resolveEntity(enrichedProfileId);

    if (!result) {
      return { error: 'Profile not found or is not a profile type', statusCode: 404 };
    }

    return {
      data: {
        unifiedEntity: result.unifiedEntity,
        isNew: result.isNew,
        matchType: result.matchType,
        confidenceScore: result.confidenceScore,
      },
    };
  }

  // ==========================================
  // OUTREACH EMAIL (AWS SES) - Direct
  // ==========================================

  @Get('ses/config')
  @ApiOperation({ summary: 'Get AWS SES configuration status' })
  @ApiResponse({ status: 200, description: 'SES config retrieved' })
  async getSesConfig() {
    return { data: this.sesEmailService.getConfigInfo() };
  }

  @Post('ses/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test email via AWS SES' })
  @ApiResponse({ status: 200, description: 'Test email sent' })
  async sendTestEmail(@Body() dto: { to: string }) {
    if (!dto.to) {
      return { error: 'Email address (to) is required', statusCode: 400 };
    }

    const result = await this.sesEmailService.sendTestEmail(dto.to);
    return { data: result };
  }

  @Post('ses/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send an email via AWS SES' })
  @ApiResponse({ status: 200, description: 'Email sent' })
  async sendSesEmail(
    @Body() dto: { to: string; subject: string; html: string; text?: string; from?: string; fromName?: string; replyTo?: string },
  ) {
    const result = await this.sesEmailService.sendEmail({
      to: dto.to,
      subject: dto.subject,
      html: dto.html,
      text: dto.text,
      from: dto.from,
      fromName: dto.fromName,
      replyTo: dto.replyTo,
    });
    return { data: result };
  }

  // ==========================================
  // OUTREACH CAMPAIGNS
  // ==========================================

  @Post('outreach/campaigns')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an outreach campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  async createCampaign(@Body() dto: CreateCampaignDto) {
    const campaign = await this.outreachService.createCampaign({
      name: dto.name,
      description: dto.description,
      template_subject: dto.template_subject,
      template_html: dto.template_html,
      template_text: dto.template_text,
      from_address: dto.from_address,
      from_name: dto.from_name,
      reply_to: dto.reply_to,
      target_filters: dto.target_filters,
    });

    return { data: campaign };
  }

  @Get('outreach/campaigns')
  @ApiOperation({ summary: 'List outreach campaigns' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved' })
  async listCampaigns(@Query() query: CampaignQueryDto) {
    const result = await this.outreachService.listCampaigns({
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  @Get('outreach/campaigns/:id')
  @ApiOperation({ summary: 'Get campaign detail' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaign(@Param('id') id: string) {
    const campaign = await this.outreachService.getCampaign(id);

    if (!campaign) {
      return { error: 'Campaign not found', statusCode: 404 };
    }

    return { data: campaign };
  }

  @Put('outreach/campaigns/:id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    const campaign = await this.outreachService.updateCampaign(id, dto);

    if (!campaign) {
      return { error: 'Campaign not found', statusCode: 404 };
    }

    return { data: campaign };
  }

  @Delete('outreach/campaigns/:id')
  @ApiOperation({ summary: 'Delete a draft campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted' })
  @ApiResponse({ status: 400, description: 'Only draft campaigns can be deleted' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async deleteCampaign(@Param('id') id: string) {
    try {
      const deleted = await this.outreachService.deleteCampaign(id);

      if (!deleted) {
        return { error: 'Campaign not found', statusCode: 404 };
      }

      return { data: { deleted: true, message: 'Campaign deleted' } };
    } catch (error) {
      return { error: error.message, statusCode: 400 };
    }
  }

  // ==========================================
  // OUTREACH RECIPIENTS
  // ==========================================

  @Post('outreach/campaigns/:id/recipients')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add recipients to campaign (from entities or manual)' })
  @ApiResponse({ status: 200, description: 'Recipients added' })
  async addRecipients(@Param('id') campaignId: string, @Body() dto: AddRecipientsDto) {
    try {
      let result: { added: number; skipped: number; blocked: number };

      if (dto.source === 'entities') {
        result = await this.outreachService.addRecipientsFromEntities(
          campaignId,
          dto.entity_filters || {},
        );
      } else {
        if (!dto.manual_recipients || dto.manual_recipients.length === 0) {
          return { error: 'manual_recipients is required when source is "manual"', statusCode: 400 };
        }
        result = await this.outreachService.addManualRecipients(
          campaignId,
          dto.manual_recipients,
        );
      }

      return {
        data: {
          ...result,
          message: `Added ${result.added} recipients (skipped: ${result.skipped}, blocked: ${result.blocked})`,
        },
      };
    } catch (error) {
      return { error: error.message, statusCode: 400 };
    }
  }

  @Get('outreach/campaigns/:id/recipients')
  @ApiOperation({ summary: 'List recipients for a campaign' })
  @ApiResponse({ status: 200, description: 'Recipients retrieved' })
  async listRecipients(@Param('id') campaignId: string, @Query() query: RecipientQueryDto) {
    const result = await this.outreachService.listRecipients(campaignId, {
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  // ==========================================
  // OUTREACH SEND / PAUSE / RESUME
  // ==========================================

  @Post('outreach/campaigns/:id/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start sending campaign (queues email jobs)' })
  @ApiResponse({ status: 200, description: 'Campaign sending started' })
  async sendCampaign(@Param('id') campaignId: string, @Body() dto: SendCampaignDto) {
    try {
      const queued = await this.outreachProcessor.queueCampaignSend(campaignId, dto.limit);

      return {
        data: {
          queued,
          message: queued > 0 ? `Queued ${queued} emails for sending` : 'No pending recipients to send',
        },
      };
    } catch (error) {
      return { error: error.message, statusCode: 400 };
    }
  }

  @Post('outreach/campaigns/:id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause campaign sending' })
  @ApiResponse({ status: 200, description: 'Campaign paused' })
  async pauseCampaign(@Param('id') campaignId: string) {
    await this.outreachProcessor.pauseQueue();
    await this.outreachService.updateCampaignStatus(campaignId, 'paused');

    return { data: { message: 'Campaign paused' } };
  }

  @Post('outreach/campaigns/:id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume campaign sending' })
  @ApiResponse({ status: 200, description: 'Campaign resumed' })
  async resumeCampaign(@Param('id') campaignId: string) {
    await this.outreachProcessor.resumeQueue();
    await this.outreachService.updateCampaignStatus(campaignId, 'active');

    return { data: { message: 'Campaign resumed' } };
  }

  // ==========================================
  // OUTREACH STATS
  // ==========================================

  @Get('outreach/campaigns/:id/stats')
  @ApiOperation({ summary: 'Get detailed campaign analytics' })
  @ApiResponse({ status: 200, description: 'Campaign stats retrieved' })
  async getCampaignStats(@Param('id') campaignId: string) {
    const stats = await this.outreachService.getCampaignStats(campaignId);

    if (!stats) {
      return { error: 'Campaign not found', statusCode: 404 };
    }

    return { data: stats };
  }

  @Get('outreach/stats')
  @ApiOperation({ summary: 'Get overall outreach statistics' })
  @ApiResponse({ status: 200, description: 'Overall stats retrieved' })
  async getOutreachStats() {
    const stats = await this.outreachService.getOverallStats();
    return { data: stats };
  }

  @Get('outreach/queue')
  @ApiOperation({ summary: 'Get outreach queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue stats retrieved' })
  async getOutreachQueueStats() {
    const stats = await this.outreachProcessor.getQueueStats();
    return { data: stats };
  }

  // ==========================================
  // BLOCKLIST
  // ==========================================

  @Get('outreach/blocklist')
  @ApiOperation({ summary: 'List blocked emails' })
  @ApiResponse({ status: 200, description: 'Blocklist retrieved' })
  async getBlocklist(@Query() query: BlocklistQueryDto) {
    const result = await this.outreachService.getBlocklist({
      reason: query.reason,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: query.limit || 50,
        offset: query.offset || 0,
      },
    };
  }

  @Post('outreach/blocklist')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add email to blocklist' })
  @ApiResponse({ status: 201, description: 'Email blocked' })
  async addToBlocklist(@Body() dto: AddToBlocklistDto) {
    const entry = await this.outreachService.addToBlocklist(dto.email, dto.reason || 'manual');
    return { data: entry };
  }

  @Delete('outreach/blocklist/:email')
  @ApiOperation({ summary: 'Remove email from blocklist' })
  @ApiResponse({ status: 200, description: 'Email unblocked' })
  @ApiResponse({ status: 404, description: 'Email not found in blocklist' })
  async removeFromBlocklist(@Param('email') email: string) {
    const removed = await this.outreachService.removeFromBlocklist(decodeURIComponent(email));

    if (!removed) {
      return { error: 'Email not found in blocklist', statusCode: 404 };
    }

    return { data: { removed: true, message: 'Email removed from blocklist' } };
  }

  // ==========================================
  // ENTITY SCORING
  // ==========================================

  @Post('scoring/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch score entities on completeness, activity, availability, quality' })
  @ApiResponse({ status: 200, description: 'Batch scoring completed' })
  async batchScoreEntities(@Body() dto: ScoreEntityDto) {
    const result = await this.entityScoringService.batchScoreEntities({
      limit: dto.limit,
      rescoreOlderThanHours: dto.rescoreOlderThanHours,
    });

    return {
      data: {
        ...result,
        message: `Scored ${result.scored} entities (${result.errors} errors)`,
      },
    };
  }

  @Get('scoring/top')
  @ApiOperation({ summary: 'Get top-scored entities' })
  @ApiResponse({ status: 200, description: 'Top entities retrieved' })
  async getTopEntities(@Query() query: TopEntitiesQueryDto) {
    const result = await this.entityScoringService.getTopEntities({
      sortBy: query.sortBy,
      minScore: query.minScore,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        sortBy: query.sortBy || 'quality_score',
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  @Get('scoring/distribution')
  @ApiOperation({ summary: 'Get score distribution histograms' })
  @ApiResponse({ status: 200, description: 'Score distribution retrieved' })
  async getScoreDistribution() {
    const distribution = await this.entityScoringService.getScoreDistribution();
    return { data: distribution };
  }

  @Get('scoring/:entityId')
  @ApiOperation({ summary: 'Get scores for a specific entity' })
  @ApiResponse({ status: 200, description: 'Entity score retrieved' })
  @ApiResponse({ status: 404, description: 'Score not found' })
  async getEntityScore(@Param('entityId') entityId: string) {
    const score = await this.entityScoringService.getEntityScore(entityId);

    if (!score) {
      return { error: 'Score not found for entity', statusCode: 404 };
    }

    return { data: score };
  }

  @Post('scoring/:entityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Score or re-score a specific entity' })
  @ApiResponse({ status: 200, description: 'Entity scored' })
  async scoreEntity(@Param('entityId') entityId: string) {
    try {
      const score = await this.entityScoringService.scoreEntity(entityId);
      return { data: score };
    } catch (error) {
      return { error: error.message, statusCode: 400 };
    }
  }

  // ==========================================
  // MATCHING
  // ==========================================

  @Post('matching/developers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find developers matching a job post' })
  @ApiResponse({ status: 200, description: 'Developer matches found' })
  async matchDevelopers(@Body() dto: MatchDevelopersDto) {
    try {
      const matches = await this.matchingService.matchDevelopersForJob(
        dto.jobEnrichedProfileId,
        { limit: dto.limit, minScore: dto.minScore },
      );

      return {
        data: matches,
        meta: { total: matches.length, limit: dto.limit || 20 },
      };
    } catch (error) {
      return { error: error.message, statusCode: 400 };
    }
  }

  @Post('matching/jobs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find jobs matching a developer entity' })
  @ApiResponse({ status: 200, description: 'Job matches found' })
  async matchJobs(@Body() dto: MatchJobsDto) {
    try {
      const matches = await this.matchingService.matchJobsForDeveloper(
        dto.entityId,
        { limit: dto.limit, minScore: dto.minScore },
      );

      return {
        data: matches,
        meta: { total: matches.length, limit: dto.limit || 20 },
      };
    } catch (error) {
      return { error: error.message, statusCode: 400 };
    }
  }

  @Get('matching/job/:id')
  @ApiOperation({ summary: 'Get stored matches for a job' })
  @ApiResponse({ status: 200, description: 'Job matches retrieved' })
  async getMatchesForJob(@Param('id') id: string, @Query() query: MatchQueryDto) {
    const result = await this.matchingService.getMatchesForJob(id, {
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  @Get('matching/entity/:id')
  @ApiOperation({ summary: 'Get stored matches for an entity' })
  @ApiResponse({ status: 200, description: 'Entity matches retrieved' })
  async getMatchesForEntity(@Param('id') id: string, @Query() query: MatchQueryDto) {
    const result = await this.matchingService.getMatchesForEntity(id, {
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  @Put('matching/:id/status')
  @ApiOperation({ summary: 'Update match status (active|dismissed|contacted)' })
  @ApiResponse({ status: 200, description: 'Match status updated' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async updateMatchStatus(@Param('id') id: string, @Body() dto: UpdateMatchStatusDto) {
    try {
      const match = await this.matchingService.updateMatchStatus(id, dto.status);
      return { data: match };
    } catch (error) {
      return { error: error.message, statusCode: 404 };
    }
  }

  // ==========================================
  // COMPANIES (extracted from job posts)
  // ==========================================

  @Get('companies')
  @ApiOperation({ summary: 'List company entities with aggregated data' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async listCompanies(@Query() query: CompanyQueryDto) {
    const result = await this.entityResolutionService.listUnifiedEntities({
      entityType: 'company',
      limit: query.limit,
      offset: query.offset,
    });

    let companies = result.data;

    // Apply search filter
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      companies = companies.filter(c =>
        c.canonicalName.toLowerCase().includes(searchLower),
      );
    }

    // Apply industry filter
    if (query.industry) {
      companies = companies.filter(c =>
        c.mergedData?.industry?.toLowerCase() === query.industry!.toLowerCase(),
      );
    }

    // Apply hiring status filter
    if (query.hiringActive !== undefined) {
      companies = companies.filter(c =>
        c.mergedData?.hiringActive === query.hiringActive,
      );
    }

    return {
      data: companies,
      meta: {
        total: (query.search || query.industry || query.hiringActive !== undefined) ? companies.length : result.total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Get company detail with linked jobs' })
  @ApiResponse({ status: 200, description: 'Company detail retrieved' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getCompanyDetail(@Param('id') id: string) {
    const result = await this.entityResolutionService.getUnifiedEntityWithSources(id);

    if (!result) {
      return { error: 'Company not found', statusCode: 404 };
    }

    return {
      data: {
        entity: result.entity,
        sources: result.sources.map((s) => ({
          matchType: s.link.matchType,
          confidenceScore: s.link.confidenceScore,
          linkedAt: s.link.linkedAt,
          profile: s.profile,
          rawData: s.rawData,
        })),
      },
    };
  }

  @Get('companies/:id/jobs')
  @ApiOperation({ summary: 'Get paginated job posts for a company' })
  @ApiResponse({ status: 200, description: 'Company jobs retrieved' })
  async getCompanyJobs(@Param('id') id: string, @Query() query: { limit?: number; offset?: number }) {
    const result = await this.entityResolutionService.getUnifiedEntityWithSources(id);

    if (!result) {
      return { error: 'Company not found', statusCode: 404 };
    }

    const limit = Number(query.limit) || 20;
    const offset = Number(query.offset) || 0;

    // Filter to job_post type sources only
    const jobSources = result.sources.filter(s => s.profile?.type === 'job_post');
    const paginatedJobs = jobSources.slice(offset, offset + limit);

    return {
      data: paginatedJobs.map(s => ({
        matchType: s.link.matchType,
        confidenceScore: s.link.confidenceScore,
        linkedAt: s.link.linkedAt,
        profile: s.profile,
        rawData: s.rawData,
      })),
      meta: {
        total: jobSources.length,
        limit,
        offset,
      },
    };
  }

  @Post('companies/backfill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract companies from existing enriched job posts' })
  @ApiResponse({ status: 200, description: 'Backfill completed' })
  async backfillCompanies(@Body() dto: BackfillCompaniesDto) {
    const result = await this.entityResolutionService.backfillCompanies({
      limit: dto.limit,
      source: dto.source,
      force: dto.force,
    });

    return {
      data: {
        ...result,
        message: `Processed ${result.processed} job posts: ${result.newCompanies} new companies, ${result.linkedToExisting} linked to existing, ${result.skipped} skipped, ${result.errors} errors (${result.totalMatchingJobs} total matching, ${result.alreadyLinked} already linked)`,
      },
    };
  }

  // ==========================================
  // ASYNC OPERATIONS (BullMQ + SSE progress)
  // ==========================================

  @Post('operations/backfill-companies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Queue company backfill as async job' })
  @ApiResponse({ status: 200, description: 'Job queued' })
  async triggerBackfillCompanies(@Body() dto: BackfillCompaniesDto) {
    const jobId = await this.operationsProcessor.queueOperation('backfill-companies', {
      limit: dto.limit,
      source: dto.source,
      force: dto.force,
    });
    if (!jobId) {
      return { error: 'Queue not available', statusCode: 503 };
    }
    return { data: { jobId } };
  }

  @Post('operations/batch-resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Queue batch entity resolution as async job' })
  @ApiResponse({ status: 200, description: 'Job queued' })
  async triggerBatchResolve(@Body() dto: BatchResolveDto) {
    const jobId = await this.operationsProcessor.queueOperation('batch-resolve', {
      limit: dto.limit,
    });
    if (!jobId) {
      return { error: 'Queue not available', statusCode: 503 };
    }
    return { data: { jobId } };
  }

  @Post('operations/batch-score')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Queue batch entity scoring as async job' })
  @ApiResponse({ status: 200, description: 'Job queued' })
  async triggerBatchScore(@Body() dto: ScoreEntityDto) {
    const jobId = await this.operationsProcessor.queueOperation('batch-score', {
      limit: dto.limit,
      rescoreOlderThanHours: dto.rescoreOlderThanHours,
    });
    if (!jobId) {
      return { error: 'Queue not available', statusCode: 503 };
    }
    return { data: { jobId } };
  }

  @Sse('operations/:jobId/progress')
  @ApiOperation({ summary: 'SSE stream for async operation progress' })
  sseOperationProgress(@Param('jobId') jobId: string): Observable<MessageEvent> {
    return interval(800).pipe(
      switchMap(() =>
        from(this.queueService.getJobStatus(OperationsProcessor.QUEUE_NAME, jobId)).pipe(
          map((status) => {
            if (!status) {
              return { data: { status: 'not_found', percent: 0, processed: 0, total: 0 } } as MessageEvent;
            }
            const progress = status.progress || {};
            const isTerminal = ['completed', 'failed', 'not_found'].includes(status.status);
            return {
              data: {
                status: status.status,
                percent: progress.percent ?? (isTerminal ? 100 : 0),
                processed: progress.processed ?? 0,
                total: progress.total ?? 0,
                result: status.result,
                error: status.failedReason,
              },
            } as MessageEvent;
          }),
        ),
      ),
      takeWhile((event: MessageEvent) => {
        const data = event.data as any;
        return !['completed', 'failed', 'not_found'].includes(data.status);
      }, true), // inclusive: emit the terminal event
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive pipeline health stats' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved' })
  async getDashboardStats() {
    const stats = await this.dashboardService.getComprehensiveStats();
    return { data: stats };
  }

  // ==========================================
  // NEW CRAWLERS
  // ==========================================

  @Post('crawl/weworkremotely')
  @ApiOperation({ summary: 'Trigger WeWorkRemotely remote job crawl' })
  @ApiResponse({ status: 200, description: 'Crawl completed' })
  async crawlWeWorkRemotely(@Body() dto: CrawlWeWorkRemotelyDto) {
    const result = await this.weWorkRemotelyCrawler.crawlJobs({
      category: dto.category,
      limit: dto.limit,
    });

    return { data: result };
  }

  @Post('crawl/wantedly')
  @ApiOperation({ summary: 'Trigger Wantedly crawl (Japanese job listings)' })
  @ApiResponse({ status: 200, description: 'Crawl completed' })
  async crawlWantedly(@Body() dto: CrawlWantedlyDto) {
    const result = await this.wantedlyCrawler.crawlJobs({
      location: dto.location,
      limit: dto.limit,
      page: dto.page,
      autoPaginate: dto.autoPaginate,
      maxPages: dto.maxPages,
    });

    return { data: result };
  }

  @Post('crawl/stackoverflow')
  @ApiOperation({ summary: 'Trigger StackOverflow user profile crawl' })
  @ApiResponse({ status: 200, description: 'Crawl completed' })
  async crawlStackOverflow(@Body() dto: CrawlStackOverflowDto) {
    const result = await this.stackOverflowCrawler.crawlUsers({
      minReputation: dto.minReputation,
      sort: dto.sort,
      limit: dto.limit,
      page: dto.page,
      autoPaginate: dto.autoPaginate,
      maxPages: dto.maxPages,
    });

    return { data: result };
  }

  @Post('crawl/generic')
  @ApiOperation({ summary: 'AI-powered generic web scraper - crawl any URL' })
  @ApiResponse({ status: 200, description: 'Crawl completed' })
  async crawlGeneric(@Body() dto: CrawlGenericDto) {
    const result = await this.genericCrawler.crawl({
      urls: dto.urls,
      mode: dto.mode as any,
      contentType: dto.contentType as any,
      fetchMethod: dto.fetchMethod as any,
      limit: dto.limit,
      customPrompt: dto.customPrompt,
      page: dto.page,
      autoPaginate: dto.autoPaginate,
      maxPages: dto.maxPages,
    });

    return { data: result };
  }

  @Post('crawl/greenjapan')
  @ApiOperation({ summary: 'Trigger Green Japan crawl (Japanese IT/startup jobs)' })
  @ApiResponse({ status: 200, description: 'Crawl completed' })
  async crawlGreenJapan(@Body() dto: CrawlGreenJapanDto) {
    const result = await this.greenJapanCrawler.crawlJobs({
      limit: dto.limit,
      maxUrls: dto.maxUrls,
      autoPaginate: dto.autoPaginate,
    });

    return { data: result };
  }

  @Post('crawl/japandev')
  @ApiOperation({ summary: 'Trigger Japan Dev crawl (English tech jobs in Japan)' })
  @ApiResponse({ status: 200, description: 'Crawl completed' })
  async crawlJapanDev(@Body() dto: CrawlJapanDevDto) {
    const result = await this.japanDevCrawler.crawlJobs({
      limit: dto.limit,
    });

    return { data: result };
  }

  // ==========================================
  // AUTOMATION PIPELINES
  // ==========================================

  @Post('pipeline/jobs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a Jobs + Company automation pipeline' })
  @ApiResponse({ status: 200, description: 'Pipeline started' })
  async runJobsPipeline(@Body() dto: CreateJobsPipelineDto) {
    const result = await this.pipelineService.createJobsPipelineRun(dto);
    return { data: result };
  }

  @Post('pipeline/profiles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a Profiles automation pipeline' })
  @ApiResponse({ status: 200, description: 'Pipeline started' })
  async runProfilesPipeline(@Body() dto: CreateProfilesPipelineDto) {
    const result = await this.pipelineService.createProfilesPipelineRun(dto);
    return { data: result };
  }

  // ==========================================
  // PIPELINE CHAINING (Legacy)
  // ==========================================

  @Post('pipeline/scan')
  @ApiOperation({ summary: 'Scan enriched data for chainable URLs (dry run)' })
  @ApiResponse({ status: 200, description: 'Scan results with discovered URLs' })
  async scanPipeline(@Body() dto: ScanPipelineDto) {
    const result = await this.pipelineService.scanForChainableUrls({
      source: dto.source,
      type: dto.type,
      urlTypes: dto.urlTypes,
      limit: dto.limit,
    });

    return { data: result };
  }

  @Post('pipeline/run')
  @ApiOperation({ summary: 'Scan + execute pipeline chain (crawl discovered URLs)' })
  @ApiResponse({ status: 200, description: 'Pipeline run created and queued' })
  async runPipeline(@Body() dto: RunPipelineDto) {
    const { run, scanResult } = await this.pipelineService.createRun({
      source: dto.source,
      type: dto.type,
      urlTypes: dto.urlTypes,
      limit: dto.limit,
      autoEnrich: dto.autoEnrich,
    });

    // Queue the chain jobs if there are new URLs
    let queued = 0;
    if (scanResult.newUrls.length > 0) {
      queued = await this.pipelineProcessor.queueChainRun(
        run.id,
        scanResult.newUrls,
        dto.autoEnrich !== false,
      );
    } else {
      // No URLs to crawl — mark as completed immediately
      await this.pipelineService.updateRunStatus(run.id, 'completed');
    }

    return {
      data: {
        run,
        scanResult,
        jobsQueued: queued,
      },
    };
  }

  @Get('pipeline/runs')
  @ApiOperation({ summary: 'List pipeline run history' })
  @ApiResponse({ status: 200, description: 'Pipeline runs list' })
  async getPipelineRuns(@Query() query: PipelineRunQueryDto) {
    const result = await this.pipelineService.getRuns({
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  @Get('pipeline/runs/:id')
  @ApiOperation({ summary: 'Get pipeline run detail with progress' })
  @ApiResponse({ status: 200, description: 'Pipeline run details' })
  async getPipelineRun(@Param('id') id: string) {
    const run = await this.pipelineService.getRunById(id);
    if (!run) {
      return { data: null, message: 'Pipeline run not found' };
    }
    return { data: run };
  }

  @Get('pipeline/stats')
  @ApiOperation({ summary: 'Aggregated pipeline statistics' })
  @ApiResponse({ status: 200, description: 'Pipeline statistics' })
  async getPipelineStats() {
    const stats = await this.pipelineService.getChainStats();
    return { data: stats };
  }

  @Get('pipeline/queue')
  @ApiOperation({ summary: 'Pipeline BullMQ queue stats' })
  @ApiResponse({ status: 200, description: 'Queue statistics' })
  async getPipelineQueue() {
    const stats = await this.pipelineProcessor.getQueueStats();
    return { data: stats || { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 } };
  }

  @Post('pipeline/runs/:id/cancel')
  @ApiOperation({ summary: 'Cancel a stuck or running pipeline run' })
  @ApiResponse({ status: 200, description: 'Pipeline run cancelled' })
  async cancelPipelineRun(@Param('id') id: string) {
    const result = await this.pipelineService.cancelRun(id);
    return { data: result };
  }
}
