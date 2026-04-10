import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bottleneck from 'bottleneck';
import { CrawledDataService } from '../services/crawled-data.service';

const STACK_EXCHANGE_API = 'https://api.stackexchange.com/2.3';

export interface StackOverflowCrawlOptions {
  minReputation?: number;
  sort?: string;
  limit?: number;
  page?: number;
  autoPaginate?: boolean;
  maxPages?: number;
}

export interface StackOverflowCrawlResult {
  jobId: string;
  status: string;
  itemsFound: number;
  itemsNew: number;
  itemsSkipped: number;
  pagesScanned: number;
  lastPage: number;
  hasMore: boolean;
  errorMessage?: string;
}

interface StackOverflowUser {
  user_id: number;
  display_name: string;
  reputation: number;
  badge_counts: {
    gold: number;
    silver: number;
    bronze: number;
  };
  location?: string;
  website_url?: string;
  about_me?: string;
  profile_image?: string;
  link: string;
  answer_count: number;
  question_count: number;
  top_tags?: Array<{
    tag_name: string;
    answer_count: number;
    answer_score: number;
    question_count: number;
    question_score: number;
  }>;
}

@Injectable()
export class StackOverflowCrawler {
  private readonly logger = new Logger(StackOverflowCrawler.name);
  private readonly limiter: Bottleneck;
  private readonly apiKey: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly crawledDataService: CrawledDataService,
  ) {
    const delayMs = this.configService.get<number>('CRAWLER_STACKOVERFLOW_DELAY_MS') || 1000;
    this.limiter = new Bottleneck({
      minTime: delayMs,
      maxConcurrent: 1,
    });

    this.apiKey = this.configService.get<string>('STACKOVERFLOW_API_KEY');
  }

  /**
   * Crawl StackOverflow user profiles via Stack Exchange API.
   *
   * With autoPaginate (default), keeps fetching pages until `limit` NEW
   * profiles are stored, or `maxPages` are scanned, or no more results.
   */
  async crawlUsers(options: StackOverflowCrawlOptions = {}): Promise<StackOverflowCrawlResult> {
    const minReputation = options.minReputation || 1000;
    const sort = options.sort || 'reputation';
    const limit = options.limit || 30;
    const startPage = options.page || 1;
    const autoPaginate = options.autoPaginate ?? true;
    const maxPages = options.maxPages || 5;

    const job = await this.crawledDataService.createJob('stackoverflow', {
      minReputation, sort, limit, page: startPage, autoPaginate, maxPages,
    });

    try {
      await this.crawledDataService.updateJob(job.id, {
        status: 'running',
        startedAt: new Date(),
      });

      this.logger.log(
        `Starting StackOverflow crawl — Min Rep: ${minReputation}, Sort: ${sort}, ` +
        `Limit: ${limit}, Page: ${startPage}, AutoPaginate: ${autoPaginate}, MaxPages: ${maxPages}`,
      );

      let totalFound = 0;
      let totalNew = 0;
      let totalSkipped = 0;
      let currentPage = startPage;
      let pagesScanned = 0;
      let hasMore = false;

      const pageSize = Math.min(100, autoPaginate ? 100 : limit);
      const pageLimit = autoPaginate ? maxPages : 1;

      while (pagesScanned < pageLimit) {
        if (totalNew >= limit) break;

        this.logger.log(`Fetching StackOverflow page ${currentPage} (${pagesScanned + 1}/${pageLimit})...`);

        let apiUrl = `${STACK_EXCHANGE_API}/users?site=stackoverflow&order=desc&sort=${sort}&min=${minReputation}&pagesize=${pageSize}&page=${currentPage}&filter=default`;
        if (this.apiKey) {
          apiUrl += `&key=${this.apiKey}`;
        }

        const response = await this.limiter.schedule(() =>
          fetch(apiUrl, {
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip',
            },
          }),
        );

        if (!response.ok) {
          throw new Error(`Stack Exchange API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as { items?: StackOverflowUser[]; has_more?: boolean };
        const users = data.items || [];
        hasMore = data.has_more ?? false;

        if (users.length === 0) {
          this.logger.log(`Page ${currentPage} returned 0 results — no more data.`);
          break;
        }

        totalFound += users.length;

        for (const user of users) {
          if (totalNew >= limit) break;

          const sourceUrl = user.link;

          const exists = await this.crawledDataService.existsBySourceUrl(sourceUrl)
            || await this.crawledDataService.existsBySourceId('stackoverflow', String(user.user_id));
          if (exists) {
            totalSkipped++;
            continue;
          }

          try {
            let topTags: any[] = [];
            try {
              topTags = await this.fetchTopTags(user.user_id);
            } catch (error) {
              this.logger.debug(`Failed to fetch top tags for user ${user.user_id}: ${error.message}`);
            }

            const rawData = {
              displayName: user.display_name,
              reputation: user.reputation,
              badges: user.badge_counts || { gold: 0, silver: 0, bronze: 0 },
              topTags: topTags.map((t) => t.tag_name || t),
              location: user.location || null,
              website: user.website_url || null,
              aboutMe: user.about_me || null,
              profileImage: user.profile_image || null,
              link: user.link,
              answerCount: user.answer_count || 0,
              questionCount: user.question_count || 0,
            };

            await this.crawledDataService.create({
              source: 'stackoverflow',
              type: 'profile',
              sourceUrl,
              sourceId: String(user.user_id),
              rawData,
              crawledAt: new Date(),
            });

            totalNew++;
            this.logger.debug(`Crawled SO user ${user.display_name} (${totalNew}/${limit} new)`);
          } catch (error) {
            this.logger.error(`Failed to save StackOverflow user ${user.user_id}: ${error.message}`);
          }
        }

        pagesScanned++;
        currentPage++;

        if (!hasMore) {
          this.logger.log('No more pages available from Stack Exchange API.');
          break;
        }
      }

      await this.crawledDataService.updateJob(job.id, {
        status: 'completed',
        itemsFound: totalFound,
        itemsNew: totalNew,
        itemsSkipped: totalSkipped,
        completedAt: new Date(),
      });

      this.logger.log(
        `StackOverflow crawl completed. Pages: ${pagesScanned}, Found: ${totalFound}, ` +
        `New: ${totalNew}, Skipped: ${totalSkipped}`,
      );

      return {
        jobId: job.id,
        status: 'completed',
        itemsFound: totalFound,
        itemsNew: totalNew,
        itemsSkipped: totalSkipped,
        pagesScanned,
        lastPage: currentPage - 1,
        hasMore,
      };
    } catch (error) {
      this.logger.error(`StackOverflow crawl failed: ${error.message}`);

      await this.crawledDataService.updateJob(job.id, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
      });

      return {
        jobId: job.id,
        status: 'failed',
        itemsFound: 0,
        itemsNew: 0,
        itemsSkipped: 0,
        pagesScanned: 0,
        lastPage: 0,
        hasMore: false,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Fetch top tags for a specific user
   */
  private async fetchTopTags(userId: number): Promise<any[]> {
    let url = `${STACK_EXCHANGE_API}/users/${userId}/top-tags?site=stackoverflow&pagesize=10`;
    if (this.apiKey) {
      url += `&key=${this.apiKey}`;
    }

    const response = await this.limiter.schedule(() =>
      fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
        },
      }),
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as { items?: any[] };
    return data.items || [];
  }
}
