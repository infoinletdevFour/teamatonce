import { Injectable, Logger } from '@nestjs/common';
import { GithubCrawler } from '../crawlers/github.crawler';
import { HackerNewsCrawler } from '../crawlers/hackernews.crawler';
import { RemoteOKCrawler } from '../crawlers/remoteok.crawler';
import { TokyoDevCrawler } from '../crawlers/tokyodev.crawler';
import { ArbeitnowCrawler } from '../crawlers/arbeitnow.crawler';
import { WeWorkRemotelyCrawler } from '../crawlers/weworkremotely.crawler';
import { StackOverflowCrawler } from '../crawlers/stackoverflow.crawler';
import { WantedlyCrawler } from '../crawlers/wantedly.crawler';
import { GreenJapanCrawler } from '../crawlers/greenjapan.crawler';
import { JapanDevCrawler } from '../crawlers/japandev.crawler';
import { GenericCrawler } from '../crawlers/generic.crawler';

export interface CrawlDispatchResult {
  itemsFound: number;
  itemsNew: number;
  itemsSkipped: number;
}

export interface CrawlDispatchOptions {
  limit?: number;
  urls?: string[];
  // Generic crawler options
  mode?: string;
  contentType?: string;
  fetchMethod?: string;
  customPrompt?: string;
  autoPaginate?: boolean;
  maxPages?: number;
  page?: number;
  // Source-specific options
  query?: string;         // GitHub search query
  tag?: string;           // RemoteOK tag
  category?: string;      // WeWorkRemotely category
  location?: string;      // Wantedly location
  month?: number;         // HackerNews month
  year?: number;          // HackerNews year
  maxUrls?: number;       // GreenJapan max URLs
  minReputation?: number; // StackOverflow min reputation
  sort?: string;          // StackOverflow sort
}

@Injectable()
export class CrawlerDispatcher {
  private readonly logger = new Logger(CrawlerDispatcher.name);

  constructor(
    private readonly githubCrawler: GithubCrawler,
    private readonly hackerNewsCrawler: HackerNewsCrawler,
    private readonly remoteOKCrawler: RemoteOKCrawler,
    private readonly tokyoDevCrawler: TokyoDevCrawler,
    private readonly arbeitnowCrawler: ArbeitnowCrawler,
    private readonly weWorkRemotelyCrawler: WeWorkRemotelyCrawler,
    private readonly stackOverflowCrawler: StackOverflowCrawler,
    private readonly wantedlyCrawler: WantedlyCrawler,
    private readonly greenJapanCrawler: GreenJapanCrawler,
    private readonly japanDevCrawler: JapanDevCrawler,
    private readonly genericCrawler: GenericCrawler,
  ) {}

  /**
   * Dispatch a crawl to the appropriate crawler based on source name.
   * Returns a normalized result with itemsFound/itemsNew/itemsSkipped.
   */
  async dispatch(
    source: string,
    options: CrawlDispatchOptions,
  ): Promise<CrawlDispatchResult> {
    const limit = options.limit || 50;

    this.logger.log(`Dispatching crawl: source=${source}, limit=${limit}, options=${JSON.stringify(options)}`);

    let result: any;

    switch (source) {
      case 'github':
        result = await this.githubCrawler.crawlByQuery({
          query: options.query || 'location:Japan language:TypeScript',
          limit,
          page: options.page,
          autoPaginate: options.autoPaginate,
          maxPages: options.maxPages,
        });
        break;
      case 'hackernews':
        result = await this.hackerNewsCrawler.crawlWhoIsHiring({
          limit,
          month: options.month,
          year: options.year,
        });
        break;
      case 'remoteok':
        result = await this.remoteOKCrawler.crawlJobs({
          limit,
          tag: options.tag,
        });
        break;
      case 'tokyodev':
        result = await this.tokyoDevCrawler.crawlJobs({
          limit,
          page: options.page,
          autoPaginate: options.autoPaginate,
          maxPages: options.maxPages,
        });
        break;
      case 'arbeitnow':
        result = await this.arbeitnowCrawler.crawlJobs({ limit });
        break;
      case 'weworkremotely':
        result = await this.weWorkRemotelyCrawler.crawlJobs({
          limit,
          category: options.category,
        });
        break;
      case 'stackoverflow':
        result = await this.stackOverflowCrawler.crawlUsers({
          limit,
          minReputation: options.minReputation,
          sort: options.sort,
          page: options.page,
          autoPaginate: options.autoPaginate,
          maxPages: options.maxPages,
        });
        break;
      case 'wantedly':
        result = await this.wantedlyCrawler.crawlJobs({
          limit,
          location: options.location,
          page: options.page,
          autoPaginate: options.autoPaginate,
          maxPages: options.maxPages,
        });
        break;
      case 'greenjapan':
        result = await this.greenJapanCrawler.crawlJobs({
          limit,
          maxUrls: options.maxUrls,
          autoPaginate: options.autoPaginate,
        });
        break;
      case 'japandev':
        result = await this.japanDevCrawler.crawlJobs({ limit });
        break;
      case 'generic':
        if (!options.urls || options.urls.length === 0) {
          throw new Error('Generic source requires urls parameter');
        }
        result = await this.genericCrawler.crawl({
          urls: options.urls,
          mode: (options.mode as any) || 'single',
          contentType: (options.contentType as any) || 'auto',
          fetchMethod: (options.fetchMethod as any) || 'cheerio',
          customPrompt: options.customPrompt,
          autoPaginate: options.autoPaginate,
          maxPages: options.maxPages,
          page: options.page,
          limit,
        });
        break;
      default:
        throw new Error(`Unknown crawler source: ${source}`);
    }

    this.logger.log(
      `Crawl dispatch complete: source=${source}, found=${result.itemsFound}, new=${result.itemsNew}, skipped=${result.itemsSkipped}`,
    );

    return {
      itemsFound: result.itemsFound || 0,
      itemsNew: result.itemsNew || 0,
      itemsSkipped: result.itemsSkipped || 0,
    };
  }
}
