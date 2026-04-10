import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import Bottleneck from 'bottleneck';
import { CrawledDataService } from '../services/crawled-data.service';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

export interface HackerNewsCrawlOptions {
  month?: number;
  year?: number;
  limit?: number;
}

export interface HackerNewsCrawlResult {
  jobId: string;
  status: string;
  itemsFound: number;
  itemsNew: number;
  itemsSkipped: number;
  errorMessage?: string;
}

interface HNItem {
  id: number;
  type: string;
  by?: string;
  text?: string;
  time?: number;
  kids?: number[];
  parent?: number;
  title?: string;
  url?: string;
}

@Injectable()
export class HackerNewsCrawler {
  private readonly logger = new Logger(HackerNewsCrawler.name);
  private readonly limiter: Bottleneck;

  constructor(
    private readonly configService: ConfigService,
    private readonly crawledDataService: CrawledDataService,
  ) {
    // HN API has no official rate limit, but be respectful
    const delayMs = this.configService.get<number>('CRAWLER_DEFAULT_DELAY_MS') || 200;
    this.limiter = new Bottleneck({
      minTime: delayMs,
      maxConcurrent: 2,
    });
  }

  /**
   * Crawl "Who's Hiring" thread from Hacker News
   */
  async crawlWhoIsHiring(options: HackerNewsCrawlOptions = {}): Promise<HackerNewsCrawlResult> {
    const now = new Date();
    const month = options.month || now.getMonth() + 1;
    const year = options.year || now.getFullYear();
    const limit = options.limit || 50;

    // Create a crawl job
    const job = await this.crawledDataService.createJob('hackernews', { month, year, limit });

    try {
      await this.crawledDataService.updateJob(job.id, {
        status: 'running',
        startedAt: new Date(),
      });

      this.logger.log(`Starting HN "Who's Hiring" crawl for ${month}/${year}, limit: ${limit}`);

      // Find the "Who's Hiring" thread
      const threadId = await this.findWhoIsHiringThread(month, year);

      if (!threadId) {
        throw new Error(`Could not find "Who's Hiring" thread for ${month}/${year}`);
      }

      this.logger.log(`Found "Who's Hiring" thread: ${threadId}`);

      // Get the thread details
      const thread = await this.fetchItem(threadId);
      if (!thread || !thread.kids) {
        throw new Error('Thread has no comments');
      }

      // Fetch top-level comments (job posts)
      const commentIds = thread.kids.slice(0, limit);
      const itemsFound = commentIds.length;
      let itemsNew = 0;
      let itemsSkipped = 0;

      this.logger.log(`Processing ${itemsFound} job posts...`);

      for (const commentId of commentIds) {
        const sourceUrl = `https://news.ycombinator.com/item?id=${commentId}`;

        // Check if already crawled (by URL or source_id)
        const exists = await this.crawledDataService.existsBySourceUrl(sourceUrl)
          || await this.crawledDataService.existsBySourceId('hackernews', String(commentId));
        if (exists) {
          itemsSkipped++;
          continue;
        }

        try {
          const comment = await this.fetchItem(commentId);
          if (!comment || !comment.text) {
            continue;
          }

          // Parse the job post
          const parsed = this.parseJobPost(comment.text);

          const rawData = {
            hnId: comment.id,
            author: comment.by,
            text: comment.text,
            textParsed: parsed,
            timestamp: comment.time,
            postedAt: comment.time ? new Date(comment.time * 1000).toISOString() : null,
            threadMonth: month,
            threadYear: year,
            parentThreadId: threadId,
          };

          await this.crawledDataService.create({
            source: 'hackernews',
            type: 'job_post',
            sourceUrl,
            sourceId: String(commentId),
            rawData,
            crawledAt: new Date(),
          });

          itemsNew++;
        } catch (error) {
          this.logger.error(`Failed to crawl comment ${commentId}: ${error.message}`);
        }
      }

      // Update job as completed
      await this.crawledDataService.updateJob(job.id, {
        status: 'completed',
        itemsFound,
        itemsNew,
        itemsSkipped,
        completedAt: new Date(),
      });

      this.logger.log(`HN crawl completed. Found: ${itemsFound}, New: ${itemsNew}, Skipped: ${itemsSkipped}`);

      return {
        jobId: job.id,
        status: 'completed',
        itemsFound,
        itemsNew,
        itemsSkipped,
      };
    } catch (error) {
      this.logger.error(`HN crawl failed: ${error.message}`);

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
        errorMessage: error.message,
      };
    }
  }

  /**
   * Find the "Who's Hiring" thread for a given month/year
   */
  private async findWhoIsHiringThread(month: number, year: number): Promise<number | null> {
    // whoishiring user posts these threads monthly
    const response = await this.limiter.schedule(() =>
      fetch(`${HN_API_BASE}/user/whoishiring.json`)
    );
    const user = await response.json() as { submitted?: number[] } | null;

    if (!user || !user.submitted) {
      return null;
    }

    // Check the user's recent submissions
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (const submissionId of user.submitted.slice(0, 50)) {
      const item = await this.fetchItem(submissionId);
      if (item && item.title && item.title.toLowerCase().includes('who is hiring')) {
        // Check if it matches our target month/year
        if (item.title.includes(monthNames[month - 1]) && item.title.includes(String(year))) {
          return item.id;
        }
      }
    }

    // Fallback: try to find any recent "Who is hiring" thread
    for (const submissionId of user.submitted.slice(0, 20)) {
      const item = await this.fetchItem(submissionId);
      if (item && item.title && item.title.toLowerCase().includes('who is hiring')) {
        return item.id;
      }
    }

    return null;
  }

  /**
   * Fetch an item from HN API
   */
  private async fetchItem(id: number): Promise<HNItem | null> {
    try {
      const response = await this.limiter.schedule(() =>
        fetch(`${HN_API_BASE}/item/${id}.json`)
      );
      const data = await response.json() as HNItem | null;
      if (!data || typeof data.id !== 'number') {
        return null;
      }
      return data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch item ${id}: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse a job post to extract structured data
   * HN job posts often follow format: Company | Location | Remote | Tech
   */
  private parseJobPost(html: string): Record<string, any> {
    // Convert HTML to plain text for parsing
    const $ = cheerio.load(`<div>${html}</div>`);
    const text = $.root().text();

    // Try to extract the header line (first line often has structured info)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const headerLine = lines[0] || '';

    // Parse common patterns from header
    const parts = headerLine.split('|').map(p => p.trim());

    const parsed: Record<string, any> = {
      headerLine,
      company: null,
      location: null,
      remote: false,
      roles: [],
      technologies: [],
    };

    // First part is usually company
    if (parts.length > 0) {
      parsed.company = parts[0];
    }

    // Look for remote indicators
    const fullText = text.toLowerCase();
    if (fullText.includes('remote') || fullText.includes('wfh') || fullText.includes('work from home')) {
      parsed.remote = true;
    }

    // Look for location (usually second part after company)
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].toLowerCase();
        if (part.includes('remote')) {
          parsed.remote = true;
        } else if (
          part.match(/\b(us|usa|uk|eu|canada|germany|japan|india|australia|singapore|nyc|sf|london|berlin|tokyo)\b/i) ||
          part.match(/\b(san francisco|new york|los angeles|seattle|boston|austin|denver|chicago)\b/i)
        ) {
          parsed.location = parts[i];
        }
      }
    }

    // Try to extract technologies mentioned
    const techPatterns = [
      'javascript', 'typescript', 'python', 'java', 'go', 'golang', 'rust', 'c++', 'c#',
      'ruby', 'php', 'swift', 'kotlin', 'scala', 'elixir', 'haskell', 'clojure',
      'react', 'vue', 'angular', 'node', 'nodejs', 'django', 'rails', 'spring',
      'aws', 'gcp', 'azure', 'kubernetes', 'docker', 'terraform',
      'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
      'machine learning', 'ml', 'ai', 'deep learning', 'nlp', 'data science',
    ];

    for (const tech of techPatterns) {
      if (fullText.includes(tech.toLowerCase())) {
        parsed.technologies.push(tech);
      }
    }

    // Try to extract roles/titles
    const rolePatterns = [
      'software engineer', 'senior engineer', 'staff engineer', 'principal engineer',
      'frontend', 'backend', 'fullstack', 'full-stack', 'full stack',
      'devops', 'sre', 'platform engineer', 'data engineer', 'ml engineer',
      'product manager', 'engineering manager', 'tech lead', 'architect',
    ];

    for (const role of rolePatterns) {
      if (fullText.includes(role.toLowerCase())) {
        parsed.roles.push(role);
      }
    }

    return parsed;
  }
}
