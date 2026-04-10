import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface CrawledDataInput {
  source: string;
  type: string;
  sourceUrl: string;
  sourceId?: string;
  rawData: Record<string, any>;
  crawledAt: Date;
}

export interface CrawlJobInput {
  source: string;
  params?: Record<string, any>;
}

export interface CrawlJobUpdate {
  status?: 'pending' | 'running' | 'completed' | 'failed';
  itemsFound?: number;
  itemsNew?: number;
  itemsSkipped?: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}

@Injectable()
export class CrawledDataService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Store a new crawled item
   */
  async create(data: CrawledDataInput): Promise<any> {
    const record = await this.db.insert('crawled_data', {
      source: data.source,
      type: data.type,
      source_url: data.sourceUrl,
      source_id: data.sourceId || null,
      raw_data: data.rawData,
      crawled_at: data.crawledAt.toISOString(),
    });
    return this.transformCrawledData(record);
  }

  /**
   * Find a crawled item by source URL
   */
  async findBySourceUrl(sourceUrl: string): Promise<any | null> {
    try {
      const results = await this.db.select('crawled_data', {
        where: { source_url: sourceUrl },
        limit: 1,
      });
      return results && results.length > 0 ? this.transformCrawledData(results[0]) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if a URL has already been crawled
   */
  async existsBySourceUrl(sourceUrl: string): Promise<boolean> {
    try {
      const results = await this.db.select('crawled_data', {
        where: { source_url: sourceUrl },
        limit: 1,
      });
      return results && results.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if a (source, source_id) pair already exists.
   * Catches duplicates even when the URL format varies between crawls.
   */
  async existsBySourceId(source: string, sourceId: string): Promise<boolean> {
    if (!sourceId) return false;
    try {
      const results = await this.db.select('crawled_data', {
        where: { source, source_id: sourceId },
        limit: 1,
      });
      return results && results.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Query crawled data with filters
   */
  async findAll(filters: {
    source?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: Record<string, any> = {};
    if (filters.source) where.source = filters.source;
    if (filters.type) where.type = filters.type;

    // Get all matching records to count
    const allRecords = await this.db.select('crawled_data', {
      where,
      orderBy: 'crawled_at',
      order: 'desc',
    });

    const total = allRecords.length;

    // Apply pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const paginatedRecords = allRecords.slice(offset, offset + limit);

    return {
      data: paginatedRecords.map(this.transformCrawledData),
      total,
    };
  }

  /**
   * Get a single crawled item by ID
   */
  async findById(id: string): Promise<any | null> {
    const results = await this.db.select('crawled_data', {
      where: { id },
      limit: 1,
    });
    return results && results.length > 0 ? this.transformCrawledData(results[0]) : null;
  }

  /**
   * Update a crawled item's raw_data and optionally its type.
   * Used by the enrichment processor to backfill extracted fields into
   * raw-content records after single-pass AI extraction.
   */
  async updateRawData(
    id: string,
    rawData: Record<string, any>,
    type?: string,
  ): Promise<void> {
    const updateData: Record<string, any> = { raw_data: rawData };
    if (type) updateData.type = type;
    await this.db.update('crawled_data', id, updateData);
  }

  /**
   * Get statistics about crawled data
   */
  async getStats(): Promise<Record<string, any>> {
    const allRecords = await this.db.select('crawled_data', {});

    const stats: Record<string, Record<string, number>> = {};
    let totalCount = 0;

    for (const record of allRecords) {
      const source = record.source;
      const type = record.type;

      if (!stats[source]) {
        stats[source] = {};
      }
      if (!stats[source][type]) {
        stats[source][type] = 0;
      }
      stats[source][type]++;
      totalCount++;
    }

    return {
      ...stats,
      total: totalCount,
    };
  }

  /**
   * Create a new crawl job
   */
  async createJob(source: string, params?: Record<string, any>): Promise<any> {
    const record = await this.db.insert('crawl_jobs', {
      source,
      params: params || null,
      status: 'pending',
    });
    return this.transformCrawlJob(record);
  }

  /**
   * Update a crawl job
   */
  async updateJob(id: string, updates: CrawlJobUpdate): Promise<any> {
    const updateData: Record<string, any> = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.itemsFound !== undefined) updateData.items_found = updates.itemsFound;
    if (updates.itemsNew !== undefined) updateData.items_new = updates.itemsNew;
    if (updates.itemsSkipped !== undefined) updateData.items_skipped = updates.itemsSkipped;
    if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
    if (updates.startedAt !== undefined) updateData.started_at = updates.startedAt.toISOString();
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt.toISOString();

    await this.db.update('crawl_jobs', id, updateData);

    // Fetch and return the updated record
    const results = await this.db.select('crawl_jobs', {
      where: { id },
      limit: 1,
    });
    return results && results.length > 0 ? this.transformCrawlJob(results[0]) : null;
  }

  /**
   * Get a crawl job by ID
   */
  async getJobById(id: string): Promise<any | null> {
    const results = await this.db.select('crawl_jobs', {
      where: { id },
      limit: 1,
    });
    return results && results.length > 0 ? this.transformCrawlJob(results[0]) : null;
  }

  /**
   * Query crawl jobs with filters
   */
  async findJobs(filters: {
    source?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: Record<string, any> = {};
    if (filters.source) where.source = filters.source;
    if (filters.status) where.status = filters.status;

    const allRecords = await this.db.select('crawl_jobs', {
      where,
      orderBy: 'created_at',
      order: 'desc',
    });

    const total = allRecords.length;
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const paginatedRecords = allRecords.slice(offset, offset + limit);

    return {
      data: paginatedRecords.map(this.transformCrawlJob),
      total,
    };
  }

  /**
   * Transform database record to camelCase API response
   */
  private transformCrawledData(record: any): any {
    return {
      id: record.id,
      source: record.source,
      type: record.type,
      sourceUrl: record.source_url,
      sourceId: record.source_id,
      rawData: record.raw_data,
      crawledAt: record.crawled_at,
      createdAt: record.created_at,
    };
  }

  /**
   * Transform crawl job record to camelCase API response
   */
  private transformCrawlJob(record: any): any {
    return {
      id: record.id,
      source: record.source,
      status: record.status,
      params: record.params,
      itemsFound: record.items_found,
      itemsNew: record.items_new,
      itemsSkipped: record.items_skipped,
      errorMessage: record.error_message,
      startedAt: record.started_at,
      completedAt: record.completed_at,
      createdAt: record.created_at,
    };
  }
}
