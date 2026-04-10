import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { AIModule } from '../ai/ai.module';
import { DataEngineController } from './data-engine.controller';
import { OutreachTrackingController } from './outreach-tracking.controller';
import { CrawledDataService } from './services/crawled-data.service';
import { EnrichmentService } from './services/enrichment.service';
import { EntityResolutionService } from './services/entity-resolution.service';
import { SesEmailService } from './services/ses-email.service';
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
import { OutreachService } from './services/outreach.service';
import { OutreachProcessor } from './processors/outreach.processor';
import { PipelineService } from './services/pipeline.service';
import { PipelineProcessor } from './processors/pipeline.processor';
import { OperationsProcessor } from './processors/operations.processor';
import { CrawlerDispatcher } from './services/crawler-dispatcher.service';
import { AutomationPipelineProcessor } from './processors/automation-pipeline.processor';

@Module({
  imports: [AuthModule, ConfigModule, AIModule],
  controllers: [DataEngineController, OutreachTrackingController],
  providers: [
    CrawledDataService,
    EnrichmentService,
    EntityResolutionService,
    SesEmailService,
    OutreachService,
    EntityScoringService,
    MatchingService,
    DataEngineDashboardService,
    GithubCrawler,
    HackerNewsCrawler,
    RemoteOKCrawler,
    TokyoDevCrawler,
    ArbeitnowCrawler,
    WeWorkRemotelyCrawler,
    StackOverflowCrawler,
    WantedlyCrawler,
    GenericCrawler,
    GreenJapanCrawler,
    JapanDevCrawler,
    EnrichmentProcessor,
    OutreachProcessor,
    PipelineService,
    PipelineProcessor,
    OperationsProcessor,
    CrawlerDispatcher,
    AutomationPipelineProcessor,
  ],
  exports: [CrawledDataService, EnrichmentService, EntityResolutionService, SesEmailService, OutreachService, EntityScoringService, MatchingService, DataEngineDashboardService],
})
export class DataEngineModule implements OnModuleInit {
  private readonly logger = new Logger(DataEngineModule.name);

  constructor(private readonly enrichmentService: EnrichmentService) {}

  async onModuleInit() {
    // Initialize Qdrant collections for enrichment
    try {
      await this.enrichmentService.initializeCollections();
      this.logger.log('Data Engine module initialized with Qdrant collections');
    } catch (error) {
      this.logger.warn(`Failed to initialize Qdrant collections: ${error.message}`);
      // Don't throw - allow the module to start even if Qdrant is unavailable
    }
  }
}
