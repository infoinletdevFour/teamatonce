import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { QdrantService } from '../../qdrant/qdrant.service';
import { EnrichmentService } from './enrichment.service';

@Injectable()
export class DataEngineDashboardService {
  private readonly logger = new Logger(DataEngineDashboardService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly qdrantService: QdrantService,
  ) {}

  /**
   * Get comprehensive pipeline health stats
   */
  async getComprehensiveStats(): Promise<any> {
    const safeCall = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        this.logger.warn(`Dashboard sub-query failed: ${error.message}`);
        return fallback;
      }
    };

    const [crawl, enrichment, entity, outreach, scores] = await Promise.all([
      safeCall(() => this.getCrawlHealth(), { bySource: {}, jobSuccessRate: 0, lastCrawlTimestamps: {} }),
      safeCall(() => this.getEnrichmentHealth(), { totalCrawled: 0, totalEnriched: 0, enrichmentRate: 0, qdrantCollections: {} }),
      safeCall(() => this.getEntityHealth(), { byType: {}, withEmail: 0, avgSourceCount: 0, newThisWeek: 0 }),
      safeCall(() => this.getOutreachHealth(), { campaignsByStatus: {}, aggregateSent: 0, aggregateOpened: 0, aggregateClicked: 0, aggregateBounced: 0, openRate: 0, clickRate: 0, blocklistSize: 0 }),
      safeCall(() => this.getScoreDistribution(), {}),
    ]);

    return { crawl, enrichment, entity, outreach, scores };
  }

  /**
   * Crawl health: items per source, job success rate, last crawl timestamps
   */
  private async getCrawlHealth(): Promise<any> {
    const allCrawled = await this.db.select('crawled_data', {});
    const allJobs = await this.db.select('crawl_jobs', {});

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Items per source
    const bySource: Record<string, { today: number; week: number; total: number }> = {};
    for (const item of allCrawled) {
      const source = item.source;
      if (!bySource[source]) {
        bySource[source] = { today: 0, week: 0, total: 0 };
      }
      bySource[source].total++;

      const crawledAt = item.crawled_at;
      if (crawledAt >= todayStart) bySource[source].today++;
      if (crawledAt >= weekAgo) bySource[source].week++;
    }

    // Job success rate
    const totalJobs = allJobs.length;
    const completedJobs = allJobs.filter((j: any) => j.status === 'completed').length;
    const jobSuccessRate = totalJobs > 0 ? completedJobs / totalJobs : 0;

    // Last crawl timestamps per source
    const lastCrawlTimestamps: Record<string, string> = {};
    for (const job of allJobs) {
      const source = job.source;
      const completedAt = job.completed_at;
      if (completedAt && (!lastCrawlTimestamps[source] || completedAt > lastCrawlTimestamps[source])) {
        lastCrawlTimestamps[source] = completedAt;
      }
    }

    return { bySource, jobSuccessRate, lastCrawlTimestamps };
  }

  /**
   * Enrichment health: total crawled vs enriched, enrichment rate, Qdrant counts
   */
  private async getEnrichmentHealth(): Promise<any> {
    const allCrawled = await this.db.select('crawled_data', {});
    const allEnriched = await this.db.select('enriched_profiles', {});

    const totalCrawled = allCrawled.length;
    const totalEnriched = allEnriched.length;
    const enrichmentRate = totalCrawled > 0 ? totalEnriched / totalCrawled : 0;

    // Qdrant collection point counts
    const qdrantCollections: Record<string, number> = {};
    try {
      const profilesStats = await this.qdrantService.getCollectionStats(
        EnrichmentService.PROFILES_COLLECTION,
      );
      qdrantCollections.profiles = profilesStats?.pointsCount || 0;
    } catch {
      qdrantCollections.profiles = 0;
    }

    try {
      const jobsStats = await this.qdrantService.getCollectionStats(
        EnrichmentService.JOBS_COLLECTION,
      );
      qdrantCollections.job_posts = jobsStats?.pointsCount || 0;
    } catch {
      qdrantCollections.job_posts = 0;
    }

    return { totalCrawled, totalEnriched, enrichmentRate, qdrantCollections };
  }

  /**
   * Entity health: entities by type, with email, avg source count, new this week
   */
  private async getEntityHealth(): Promise<any> {
    const allEntities = await this.db.select('unified_entities', {});

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const byType: Record<string, number> = {};
    let withEmail = 0;
    let totalSourceCount = 0;
    let newThisWeek = 0;

    for (const entity of allEntities) {
      const type = entity.entity_type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;

      if (entity.normalized_email) withEmail++;
      totalSourceCount += parseInt(entity.source_count) || 1;
      if (entity.created_at >= weekAgo) newThisWeek++;
    }

    const avgSourceCount = allEntities.length > 0
      ? Math.round((totalSourceCount / allEntities.length) * 100) / 100
      : 0;

    return { byType, withEmail, avgSourceCount, newThisWeek };
  }

  /**
   * Outreach health: campaigns by status, aggregate metrics, blocklist size
   */
  private async getOutreachHealth(): Promise<any> {
    const allCampaigns = await this.db.select('outreach_campaigns', {});
    const blocklist = await this.db.select('email_blocklist', {});

    const campaignsByStatus: Record<string, number> = {};
    let aggregateSent = 0;
    let aggregateOpened = 0;
    let aggregateClicked = 0;
    let aggregateBounced = 0;

    for (const campaign of allCampaigns) {
      const status = campaign.status || 'draft';
      campaignsByStatus[status] = (campaignsByStatus[status] || 0) + 1;

      aggregateSent += parseInt(campaign.sent_count) || 0;
      aggregateOpened += parseInt(campaign.opened_count) || 0;
      aggregateClicked += parseInt(campaign.clicked_count) || 0;
      aggregateBounced += parseInt(campaign.bounced_count) || 0;
    }

    const openRate = aggregateSent > 0 ? aggregateOpened / aggregateSent : 0;
    const clickRate = aggregateSent > 0 ? aggregateClicked / aggregateSent : 0;

    return {
      campaignsByStatus,
      aggregateSent,
      aggregateOpened,
      aggregateClicked,
      aggregateBounced,
      openRate,
      clickRate,
      blocklistSize: blocklist.length,
    };
  }

  /**
   * Score distribution: histogram of quality/activity/completeness/availability scores
   */
  private async getScoreDistribution(): Promise<Record<string, Record<string, number>>> {
    const allScores = await this.db.select('entity_scores', {});

    const dimensions = ['quality_score', 'activity_score', 'completeness_score', 'availability_score'];
    const buckets = ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70', '70-80', '80-90', '90-100'];

    const distribution: Record<string, Record<string, number>> = {};

    for (const dim of dimensions) {
      const key = dim.replace('_score', '');
      distribution[key] = {};
      for (const bucket of buckets) {
        distribution[key][bucket] = 0;
      }

      for (const score of allScores) {
        const val = parseFloat(score[dim]) || 0;
        const bucketIdx = Math.min(Math.floor(val / 10), 9);
        const bucketKey = buckets[bucketIdx];
        distribution[key][bucketKey]++;
      }
    }

    return distribution;
  }
}
