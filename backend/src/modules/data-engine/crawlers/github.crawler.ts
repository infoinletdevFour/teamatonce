import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import Bottleneck from 'bottleneck';
import { CrawledDataService } from '../services/crawled-data.service';

export interface GithubCrawlOptions {
  query: string;
  limit?: number;
  page?: number;
  autoPaginate?: boolean;
  maxPages?: number;
}

export interface GithubCrawlResult {
  jobId: string;
  status: string;
  itemsFound: number;
  itemsNew: number;
  itemsSkipped: number;
  pagesScanned: number;
  lastPage: number;
  totalAvailable: number;
  errorMessage?: string;
}

@Injectable()
export class GithubCrawler {
  private readonly logger = new Logger(GithubCrawler.name);
  private readonly octokit: Octokit;
  private readonly limiter: Bottleneck;

  constructor(
    private readonly configService: ConfigService,
    private readonly crawledDataService: CrawledDataService,
  ) {
    const token = this.configService.get<string>('GITHUB_TOKEN');

    if (!token) {
      this.logger.warn('GITHUB_TOKEN not configured. GitHub crawler will not work.');
    }

    this.octokit = new Octokit({
      auth: token,
    });

    // Rate limiting: 5000 requests/hour with token = ~1.4 requests/second
    // Being conservative with 1 request per second
    const delayMs = this.configService.get<number>('CRAWLER_DEFAULT_DELAY_MS') || 1000;
    this.limiter = new Bottleneck({
      minTime: delayMs,
      maxConcurrent: 1,
    });
  }

  /**
   * Crawl GitHub users based on a search query.
   *
   * When autoPaginate is true (default), the crawler keeps fetching subsequent
   * pages of GitHub search results until `limit` NEW (not-yet-crawled) profiles
   * have been stored, or `maxPages` pages have been scanned, or GitHub results
   * are exhausted — whichever comes first.
   *
   * When autoPaginate is false, only the single specified `page` is fetched.
   */
  async crawlByQuery(options: GithubCrawlOptions): Promise<GithubCrawlResult> {
    const {
      query,
      limit = 10,
      page = 1,
      autoPaginate = true,
      maxPages = 5,
    } = options;

    // Create a crawl job
    const job = await this.crawledDataService.createJob('github', {
      query,
      limit,
      page,
      autoPaginate,
      maxPages,
    });

    try {
      await this.crawledDataService.updateJob(job.id, {
        status: 'running',
        startedAt: new Date(),
      });

      this.logger.log(
        `Starting GitHub crawl: query="${query}", limit=${limit}, ` +
        `page=${page}, autoPaginate=${autoPaginate}, maxPages=${maxPages}`,
      );

      let totalFound = 0;
      let totalNew = 0;
      let totalSkipped = 0;
      let currentPage = page;
      let pagesScanned = 0;
      let totalAvailable = 0;

      // GitHub search API returns max 100 per page, max 1000 results total (10 pages)
      const perPage = Math.min(100, autoPaginate ? 100 : limit);
      const pageLimit = autoPaginate ? maxPages : 1;

      while (pagesScanned < pageLimit) {
        // Stop if we already have enough new profiles
        if (totalNew >= limit) break;

        this.logger.log(`Fetching page ${currentPage} (scanned ${pagesScanned + 1}/${pageLimit})...`);

        const searchResult = await this.limiter.schedule(() =>
          this.octokit.search.users({
            q: query,
            per_page: perPage,
            page: currentPage,
            sort: 'followers',
            order: 'desc',
          }),
        );

        if (pagesScanned === 0) {
          totalAvailable = searchResult.data.total_count;
        }

        const users = searchResult.data.items;

        if (users.length === 0) {
          this.logger.log(`Page ${currentPage} returned 0 results — no more data.`);
          break;
        }

        totalFound += users.length;

        // Process each user on this page
        for (const user of users) {
          // Stop if we've reached our limit of new profiles
          if (totalNew >= limit) break;

          const sourceUrl = `https://github.com/${user.login}`;

          const exists = await this.crawledDataService.existsBySourceUrl(sourceUrl)
            || await this.crawledDataService.existsBySourceId('github', user.login);
          if (exists) {
            totalSkipped++;
            this.logger.debug(`Skipping ${user.login} — already crawled`);
            continue;
          }

          try {
            // Fetch detailed user profile
            const profileData = await this.limiter.schedule(() =>
              this.octokit.users.getByUsername({ username: user.login }),
            );

            // Fetch user's top repositories
            const reposData = await this.limiter.schedule(() =>
              this.octokit.repos.listForUser({
                username: user.login,
                sort: 'pushed',
                per_page: 10,
              }),
            );

            // Extract languages from repos
            const languages = new Set<string>();
            for (const repo of reposData.data) {
              if (repo.language) {
                languages.add(repo.language);
              }
            }

            const rawData = {
              login: profileData.data.login,
              name: profileData.data.name,
              email: profileData.data.email,
              bio: profileData.data.bio,
              location: profileData.data.location,
              company: profileData.data.company,
              blog: profileData.data.blog,
              twitterUsername: profileData.data.twitter_username,
              avatarUrl: profileData.data.avatar_url,
              htmlUrl: profileData.data.html_url,
              followers: profileData.data.followers,
              following: profileData.data.following,
              publicRepos: profileData.data.public_repos,
              publicGists: profileData.data.public_gists,
              createdAt: profileData.data.created_at,
              updatedAt: profileData.data.updated_at,
              hireable: profileData.data.hireable,
              languages: Array.from(languages),
              topRepos: reposData.data.slice(0, 5).map(repo => ({
                name: repo.name,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                url: repo.html_url,
              })),
            };

            await this.crawledDataService.create({
              source: 'github',
              type: 'profile',
              sourceUrl,
              sourceId: user.login,
              rawData,
              crawledAt: new Date(),
            });

            totalNew++;
            this.logger.debug(`Crawled ${user.login} (${totalNew}/${limit} new)`);
          } catch (error) {
            this.logger.error(`Failed to crawl user ${user.login}: ${error.message}`);
          }
        }

        pagesScanned++;
        currentPage++;

        // GitHub search API caps at 1000 results (page 10 with per_page 100)
        if (currentPage > 10) {
          this.logger.log('Reached GitHub search API maximum of 1000 results (page 10).');
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
        `GitHub crawl completed. Pages: ${pagesScanned}, Found: ${totalFound}, ` +
        `New: ${totalNew}, Skipped: ${totalSkipped}, Total available: ${totalAvailable}`,
      );

      return {
        jobId: job.id,
        status: 'completed',
        itemsFound: totalFound,
        itemsNew: totalNew,
        itemsSkipped: totalSkipped,
        pagesScanned,
        lastPage: currentPage - 1,
        totalAvailable,
      };
    } catch (error) {
      this.logger.error(`GitHub crawl failed: ${error.message}`);

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
        totalAvailable: 0,
        errorMessage: error.message,
      };
    }
  }
}
