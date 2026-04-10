import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DatabaseService } from '../../database/database.service';
import { EmbeddingService } from '../../ai/embedding.service';
import { QdrantService } from '../../qdrant/qdrant.service';
import { v4 as uuidv4 } from 'uuid';

// AI extraction schemas
export interface ProfileStructuredData {
  primaryRole: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'devops' | 'data' | 'ai_ml' | 'other';
  seniorityLevel: 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'unknown';
  topSkills: string[];
  specializations: string[];
  summary: string;
  // Social & Contact Information
  socialAccounts: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
    blog?: string;
    email?: string;
  };
  // Profile metadata
  location?: string;
  company?: string;
  hireable?: boolean;
  influenceScore?: 'low' | 'medium' | 'high' | 'very_high'; // Based on followers, stars, etc.
}

export interface JobCompanyInfo {
  name: string;
  website?: string;
  contactEmail?: string;
  location?: string;
  industry?: string;
  size?: string;
  logoUrl?: string;
}

export interface JobStructuredData {
  projectType: 'web_app' | 'mobile' | 'api' | 'data' | 'ai_ml' | 'devops' | 'other';
  technologies: string[];
  budgetRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  urgency: 'immediate' | 'flexible' | 'ongoing' | 'unknown';
  complexity: 'junior' | 'mid' | 'senior' | 'expert' | 'unknown';
  remotePolicy: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  summary: string;
  companyInfo?: JobCompanyInfo;
}

export interface CompanyStructuredData {
  name: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | 'unknown';
  technologies: string[];
  summary: string;
  location?: string;
  website?: string;
  careersUrl?: string;
  description?: string;
  contactEmail?: string;
  hiringActive?: boolean;
}

export interface EnrichedProfileInput {
  crawledDataId: string;
  source: string;
  type: string;
  structuredData: ProfileStructuredData | JobStructuredData | CompanyStructuredData;
  summary: string;
  embeddingId: string;
}

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);
  private openai: OpenAI;
  private readonly model: string;

  // Qdrant collection names
  static readonly PROFILES_COLLECTION = 'profiles';
  static readonly JOBS_COLLECTION = 'job_posts';

  constructor(
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
    private readonly embeddingService: EmbeddingService,
    private readonly qdrantService: QdrantService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured. Enrichment service will be disabled.');
      return;
    }

    this.openai = new OpenAI({ apiKey });
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

    this.logger.log(`Enrichment service initialized with model: ${this.model}`);
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.openai;
  }

  /**
   * Initialize Qdrant collections for profiles and job posts
   */
  async initializeCollections(): Promise<void> {
    const vectorSize = this.embeddingService.getDimensions();

    this.logger.log('Initializing Qdrant collections...');

    await this.qdrantService.createCollection(
      EnrichmentService.PROFILES_COLLECTION,
      vectorSize,
      'cosine',
    );

    await this.qdrantService.createCollection(
      EnrichmentService.JOBS_COLLECTION,
      vectorSize,
      'cosine',
    );

    this.logger.log('Qdrant collections initialized');
  }

  /**
   * Enrich a GitHub profile with AI-extracted structured data
   * @deprecated Use enrichProfile() instead
   */
  async enrichGithubProfile(rawData: Record<string, any>): Promise<ProfileStructuredData> {
    return this.enrichProfile(rawData, 'github');
  }

  /**
   * Enrich a developer profile with AI-extracted structured data
   * Supports multiple sources: github, stackoverflow, etc.
   */
  async enrichProfile(rawData: Record<string, any>, source: string = 'github'): Promise<ProfileStructuredData> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const profileContext = source === 'github'
      ? this.buildGithubProfileContext(rawData)
      : this.buildGenericProfileContext(rawData, source);

    const sourceLabel = source === 'github' ? 'GitHub' : source.charAt(0).toUpperCase() + source.slice(1);

    const systemPrompt = `You are a technical recruiter AI that analyzes developer profiles.
Extract structured information from the ${sourceLabel} profile data provided.
Always respond with valid JSON matching the exact schema specified.`;

    const userPrompt = `Analyze this developer profile (source: ${sourceLabel}) and extract structured information:

${profileContext}

Respond with JSON matching this exact schema:
{
  "primaryRole": "frontend|backend|fullstack|mobile|devops|data|ai_ml|other",
  "seniorityLevel": "junior|mid|senior|lead|principal|unknown",
  "topSkills": ["skill1", "skill2", "skill3"],
  "specializations": ["area1", "area2"],
  "summary": "A 2-3 sentence summary of this developer's profile and expertise",
  "socialAccounts": {
    "github": "GitHub profile URL or null",
    "twitter": "Twitter handle (without @) or null",
    "linkedin": "LinkedIn URL or null (if inferable)",
    "website": "Personal website URL or null",
    "blog": "Blog URL or null",
    "email": "Public email or null"
  },
  "location": "City, Country or null",
  "company": "Current company or null",
  "hireable": true/false or null,
  "influenceScore": "low|medium|high|very_high (based on followers: <100=low, 100-1000=medium, 1000-10000=high, >10000=very_high)"
}

Base your analysis on:
- Languages and technologies mentioned or used
- Activity level and contributions
- Bio and profile information
- Areas of expertise and topics
- Social presence and influence`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content) as ProfileStructuredData;
      this.logger.debug(`Enriched ${source} profile: ${rawData.login || rawData.displayName || 'unknown'}`);

      return this.validateProfileData(parsed);
    } catch (error) {
      this.logger.error(`Failed to enrich ${source} profile: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Enrich a job post with AI-extracted structured data
   * Supports multiple sources: hackernews, remoteok, weworkremotely, tokyodev, arbeitnow
   */
  async enrichJobPost(rawData: Record<string, any>, source: string = 'hackernews'): Promise<JobStructuredData> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const jobContext = this.buildJobPostContext(rawData);

    const sourceLabelMap: Record<string, string> = {
      hackernews: 'Hacker News "Who\'s Hiring"',
      greenjapan: 'Green Japan',
      japandev: 'Japan Dev',
    };
    const sourceLabel = sourceLabelMap[source]
      || source.charAt(0).toUpperCase() + source.slice(1);

    const systemPrompt = `You are a technical recruiter AI that analyzes job postings.
Extract structured information from the ${sourceLabel} job post provided.
Always respond with valid JSON matching the exact schema specified.`;

    const userPrompt = `Analyze this job posting (source: ${sourceLabel}) and extract structured information:

${jobContext}

Respond with JSON matching this exact schema:
{
  "projectType": "web_app|mobile|api|data|ai_ml|devops|other",
  "technologies": ["tech1", "tech2", "tech3"],
  "budgetRange": { "min": null, "max": null, "currency": "USD" },
  "urgency": "immediate|flexible|ongoing|unknown",
  "complexity": "junior|mid|senior|expert|unknown",
  "remotePolicy": "remote|hybrid|onsite|unknown",
  "summary": "A 2-4 sentence summary highlighting what makes THIS role unique: company name, specific responsibilities, team context, salary if mentioned, and anything distinctive vs a generic posting",
  "companyInfo": {
    "name": "Company name or null if unknown",
    "website": "Company website URL or null",
    "contactEmail": "Hiring/contact email or null",
    "location": "Company HQ location or null",
    "industry": "Primary industry/sector or null",
    "size": "startup|small|medium|large|enterprise|unknown"
  }
}

Notes:
- budgetRange: Parse salary/compensation if mentioned. Use the ORIGINAL currency (JPY for ¥, EUR for €, GBP for £, USD for $). Convert "¥5M ~ ¥9.6M" to {"min":5000000,"max":9600000,"currency":"JPY"}. Leave null only if truly not mentioned.
- technologies: List actual technologies, frameworks, and tools (e.g. React, Python, Figma). Do NOT include industries/domains as technologies (e.g. "HR Tech" is an industry, not a technology).
- remotePolicy: Use "hybrid" for partial/flexible remote. Only use "remote" for fully remote roles.
- complexity: Infer seniority from requirements, years of experience, and role level mentioned.
- companyInfo: Extract when available. Try to infer company website from context if not explicit. companyInfo can be null if no company info found.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content) as JobStructuredData;
      this.logger.debug(`Enriched job post: ${rawData.id || 'unknown'}`);

      return this.validateJobData(parsed);
    } catch (error) {
      this.logger.error(`Failed to enrich job post: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate and store embedding for enriched profile
   */
  async storeProfileEmbedding(
    enrichedProfileId: string,
    structuredData: ProfileStructuredData,
    rawData: Record<string, any>,
    source?: string,
  ): Promise<string> {
    const embedding = await this.embeddingService.generateProfileEmbedding({
      summary: structuredData.summary,
      skills: structuredData.topSkills,
      role: structuredData.primaryRole,
      specializations: structuredData.specializations,
      rawData,
    });

    if (embedding.length === 0) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingId = enrichedProfileId;

    await this.qdrantService.insertVector(EnrichmentService.PROFILES_COLLECTION, {
      id: embeddingId,
      vector: embedding,
      payload: {
        enrichedProfileId,
        primaryRole: structuredData.primaryRole,
        seniorityLevel: structuredData.seniorityLevel,
        topSkills: structuredData.topSkills,
        summary: structuredData.summary,
        source: source || (rawData.login ? 'github' : 'unknown'),
      },
    });

    this.logger.debug(`Stored profile embedding: ${embeddingId}`);
    return embeddingId;
  }

  /**
   * Generate and store embedding for enriched job post
   */
  async storeJobEmbedding(
    enrichedProfileId: string,
    structuredData: JobStructuredData,
    rawData: Record<string, any>,
    source?: string,
  ): Promise<string> {
    const embedding = await this.embeddingService.generateJobEmbedding({
      summary: structuredData.summary,
      technologies: structuredData.technologies,
      projectType: structuredData.projectType,
      complexity: structuredData.complexity,
      rawData,
    });

    if (embedding.length === 0) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingId = enrichedProfileId;

    await this.qdrantService.insertVector(EnrichmentService.JOBS_COLLECTION, {
      id: embeddingId,
      vector: embedding,
      payload: {
        enrichedProfileId,
        projectType: structuredData.projectType,
        technologies: structuredData.technologies,
        complexity: structuredData.complexity,
        remotePolicy: structuredData.remotePolicy,
        summary: structuredData.summary,
        source: source || 'hackernews',
      },
    });

    this.logger.debug(`Stored job embedding: ${embeddingId}`);
    return embeddingId;
  }

  /**
   * Enrich a company record with AI-extracted structured data
   */
  async enrichCompany(rawData: Record<string, any>, source: string = 'generic'): Promise<CompanyStructuredData> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const parts: string[] = [];
    parts.push(`Source: ${source}`);
    if (rawData.name) parts.push(`Name: ${rawData.name}`);
    if (rawData.description) parts.push(`Description: ${rawData.description}`);
    if (rawData.industry) parts.push(`Industry: ${rawData.industry}`);
    if (rawData.location) parts.push(`Location: ${rawData.location}`);
    if (rawData.size) parts.push(`Size: ${rawData.size}`);
    if (rawData.website) parts.push(`Website: ${rawData.website}`);
    if (rawData.careersUrl) parts.push(`Careers URL: ${rawData.careersUrl}`);
    if (rawData.technologies) parts.push(`Technologies: ${Array.isArray(rawData.technologies) ? rawData.technologies.join(', ') : rawData.technologies}`);

    const companyContext = parts.join('\n');

    const systemPrompt = `You are a business intelligence AI that analyzes company data.
Extract structured information from the company data provided.
Always respond with valid JSON matching the exact schema specified.`;

    const userPrompt = `Analyze this company data and extract structured information:

${companyContext}

Respond with JSON matching this exact schema:
{
  "name": "Company name",
  "industry": "Primary industry or sector",
  "size": "startup|small|medium|large|enterprise|unknown (startup: <50, small: 50-200, medium: 200-1000, large: 1000-10000, enterprise: >10000)",
  "technologies": ["tech1", "tech2"],
  "summary": "A 2-3 sentence summary of this company",
  "location": "HQ location or null",
  "website": "Company website URL or null",
  "careersUrl": "Careers page URL or null",
  "description": "Detailed company description or null",
  "contactEmail": "General or hiring contact email or null",
  "hiringActive": true/false or null
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content) as CompanyStructuredData;
      this.logger.debug(`Enriched ${source} company: ${rawData.name || 'unknown'}`);

      // Basic validation
      const validSizes = ['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'];
      return {
        ...parsed,
        size: validSizes.includes(parsed.size) ? parsed.size : 'unknown',
        technologies: Array.isArray(parsed.technologies) ? parsed.technologies.slice(0, 20) : [],
      };
    } catch (error) {
      this.logger.error(`Failed to enrich ${source} company: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate and store embedding for enriched company
   * Stores in the profiles collection so companies appear in search alongside profiles
   */
  async storeCompanyEmbedding(
    enrichedProfileId: string,
    structuredData: CompanyStructuredData,
    rawData: Record<string, any>,
    source?: string,
  ): Promise<string> {
    const embedding = await this.embeddingService.generateProfileEmbedding({
      summary: structuredData.summary,
      skills: structuredData.technologies,
      role: 'company',
      specializations: [structuredData.industry].filter(Boolean),
      rawData,
    });

    if (embedding.length === 0) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingId = enrichedProfileId;

    await this.qdrantService.insertVector(EnrichmentService.PROFILES_COLLECTION, {
      id: embeddingId,
      vector: embedding,
      payload: {
        enrichedProfileId,
        primaryRole: 'company',
        seniorityLevel: 'unknown',
        topSkills: structuredData.technologies,
        summary: structuredData.summary,
        source: source || 'generic',
      },
    });

    this.logger.debug(`Stored company embedding: ${embeddingId}`);
    return embeddingId;
  }

  /**
   * Save enriched profile to database
   */
  async saveEnrichedProfile(input: EnrichedProfileInput): Promise<any> {
    const record = await this.db.insert('enriched_profiles', {
      crawled_data_id: input.crawledDataId,
      source: input.source,
      type: input.type,
      structured_data: input.structuredData,
      summary: input.summary,
      embedding_id: input.embeddingId,
      enriched_at: new Date().toISOString(),
    });

    return this.transformEnrichedProfile(record);
  }

  /**
   * Check if crawled data has already been enriched
   */
  async isAlreadyEnriched(crawledDataId: string): Promise<boolean> {
    try {
      const results = await this.db.select('enriched_profiles', {
        where: { crawled_data_id: crawledDataId },
        limit: 1,
      });
      return results && results.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get unenriched crawled data
   */
  async getUnenrichedData(filters: {
    source?: string;
    type?: string;
    limit?: number;
  }): Promise<any[]> {
    // Get all crawled data
    const where: Record<string, any> = {};
    if (filters.source) where.source = filters.source;
    if (filters.type) where.type = filters.type;

    const crawledData = await this.db.select('crawled_data', {
      where,
      orderBy: 'crawled_at',
      order: 'desc',
    });

    // Get all enriched crawled_data_ids
    const enrichedRecords = await this.db.select('enriched_profiles', {});
    const enrichedIds = new Set(enrichedRecords.map((r: any) => r.crawled_data_id));

    // Filter out already enriched
    const unenriched = crawledData.filter((d: any) => !enrichedIds.has(d.id));

    // Apply limit
    const limit = filters.limit || 10;
    return unenriched.slice(0, limit);
  }

  /**
   * Search profiles using semantic similarity
   */
  async searchProfiles(
    query: string,
    limit: number = 10,
    filter?: Record<string, any>,
  ): Promise<any[]> {
    // Generate query embedding
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    if (queryEmbedding.length === 0) {
      return [];
    }

    // Build Qdrant filter if provided
    let qdrantFilter: any = undefined;
    if (filter) {
      qdrantFilter = { must: [] };
      if (filter.source) {
        qdrantFilter.must.push({
          key: 'source',
          match: { value: filter.source },
        });
      }
      if (filter.primaryRole) {
        qdrantFilter.must.push({
          key: 'primaryRole',
          match: { value: filter.primaryRole },
        });
      }
    }

    // Search in Qdrant
    const results = await this.qdrantService.searchVectors(
      EnrichmentService.PROFILES_COLLECTION,
      queryEmbedding,
      limit,
      qdrantFilter,
    );

    // Fetch full enriched profile data for each result
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        // Extract crawledDataId from the payload's enrichedProfileId (format: "temp-{crawledDataId}")
        const embeddingId = result.payload?.enrichedProfileId as string;
        const crawledDataId = embeddingId?.startsWith('temp-')
          ? embeddingId.substring(5)
          : embeddingId;

        if (!crawledDataId) {
          return null;
        }

        const enrichedProfile = await this.getEnrichedProfileByCrawledDataId(crawledDataId);
        if (!enrichedProfile) {
          return null;
        }

        // Fetch associated raw data
        const rawData = await this.getCrawledDataById(enrichedProfile.crawledDataId);

        return {
          id: enrichedProfile.id,
          score: result.score,
          source: enrichedProfile.source,
          type: enrichedProfile.type,
          structuredData: enrichedProfile.structuredData,
          summary: enrichedProfile.summary,
          rawData: rawData?.rawData || {},
          enrichedAt: enrichedProfile.enrichedAt,
        };
      }),
    );

    return enrichedResults.filter((r) => r !== null);
  }

  /**
   * Search job posts using semantic similarity
   */
  async searchJobs(
    query: string,
    limit: number = 10,
    filter?: Record<string, any>,
  ): Promise<any[]> {
    // Generate query embedding
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    if (queryEmbedding.length === 0) {
      return [];
    }

    // Build Qdrant filter if provided
    let qdrantFilter: any = undefined;
    if (filter) {
      qdrantFilter = { must: [] };
      if (filter.source) {
        qdrantFilter.must.push({
          key: 'source',
          match: { value: filter.source },
        });
      }
      if (filter.projectType) {
        qdrantFilter.must.push({
          key: 'projectType',
          match: { value: filter.projectType },
        });
      }
    }

    // Search in Qdrant
    const results = await this.qdrantService.searchVectors(
      EnrichmentService.JOBS_COLLECTION,
      queryEmbedding,
      limit,
      qdrantFilter,
    );

    // Fetch full enriched profile data for each result
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        // Extract crawledDataId from the payload's enrichedProfileId (format: "temp-{crawledDataId}")
        const embeddingId = result.payload?.enrichedProfileId as string;
        const crawledDataId = embeddingId?.startsWith('temp-')
          ? embeddingId.substring(5)
          : embeddingId;

        if (!crawledDataId) {
          return null;
        }

        const enrichedProfile = await this.getEnrichedProfileByCrawledDataId(crawledDataId);
        if (!enrichedProfile) {
          return null;
        }

        // Fetch associated raw data
        const rawData = await this.getCrawledDataById(enrichedProfile.crawledDataId);

        return {
          id: enrichedProfile.id,
          score: result.score,
          source: enrichedProfile.source,
          type: enrichedProfile.type,
          structuredData: enrichedProfile.structuredData,
          summary: enrichedProfile.summary,
          rawData: rawData?.rawData || {},
          enrichedAt: enrichedProfile.enrichedAt,
        };
      }),
    );

    return enrichedResults.filter((r) => r !== null);
  }

  /**
   * Get enriched profile by ID
   */
  async getEnrichedProfileById(id: string): Promise<any | null> {
    const results = await this.db.select('enriched_profiles', {
      where: { id },
      limit: 1,
    });
    return results && results.length > 0 ? this.transformEnrichedProfile(results[0]) : null;
  }

  /**
   * Get enriched profile by crawled data ID
   */
  async getEnrichedProfileByCrawledDataId(crawledDataId: string): Promise<any | null> {
    const results = await this.db.select('enriched_profiles', {
      where: { crawled_data_id: crawledDataId },
      limit: 1,
    });
    return results && results.length > 0 ? this.transformEnrichedProfile(results[0]) : null;
  }

  /**
   * Get crawled data by ID
   */
  async getCrawledDataById(id: string): Promise<any | null> {
    const results = await this.db.select('crawled_data', {
      where: { id },
      limit: 1,
    });

    if (!results || results.length === 0) {
      return null;
    }

    const record = results[0];
    return {
      id: record.id,
      source: record.source,
      type: record.type,
      sourceUrl: record.source_url,
      sourceId: record.source_id,
      rawData: record.raw_data,
      crawledAt: record.crawled_at,
    };
  }

  /**
   * Query enriched profiles with filters
   */
  async findAllEnriched(filters: {
    source?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: Record<string, any> = {};
    if (filters.source) where.source = filters.source;
    if (filters.type) where.type = filters.type;

    const allRecords = await this.db.select('enriched_profiles', {
      where,
      orderBy: 'enriched_at',
      order: 'desc',
    });

    const total = allRecords.length;
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const paginatedRecords = allRecords.slice(offset, offset + limit);

    return {
      data: paginatedRecords.map(this.transformEnrichedProfile),
      total,
    };
  }

  /**
   * Get enrichment statistics
   */
  async getEnrichmentStats(): Promise<Record<string, any>> {
    const allRecords = await this.db.select('enriched_profiles', {});

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

    // Get Qdrant stats
    const profilesStats = await this.qdrantService.getCollectionStats(
      EnrichmentService.PROFILES_COLLECTION,
    );
    const jobsStats = await this.qdrantService.getCollectionStats(
      EnrichmentService.JOBS_COLLECTION,
    );

    // Count total crawled data for progress calculation
    let totalCrawled = 0;
    try {
      const crawledRecords = await this.db.select('crawled_data', {});
      totalCrawled = crawledRecords?.length || 0;
    } catch {
      totalCrawled = totalCount; // fallback to enriched count
    }

    return {
      enriched: stats,
      total: totalCount,
      totalCrawled,
      vectors: {
        profiles: profilesStats?.pointsCount || 0,
        jobs: jobsStats?.pointsCount || 0,
      },
    };
  }

  /**
   * Deterministically extract company info from job post raw data.
   * No AI calls — purely from structured fields per crawler source.
   */
  extractCompanyFromJobRawData(rawData: Record<string, any>, source: string): JobCompanyInfo | null {
    let name: string | null = null;
    let website: string | null = null;
    let location: string | null = null;

    switch (source) {
      case 'hackernews': {
        // HN: company is in textParsed.company or parse from first line of text
        name = rawData.textParsed?.company || null;
        if (!name && rawData.text) {
          // First line of HN "Who's Hiring" posts often contains "Company | Location | ..."
          const firstLine = rawData.text.split('\n')[0];
          if (firstLine && firstLine.includes('|')) {
            name = firstLine.split('|')[0].trim();
          }
        }
        break;
      }
      case 'remoteok': {
        name = rawData.company || null;
        website = rawData.url || null;
        location = rawData.location || null;
        break;
      }
      case 'tokyodev':
      case 'wantedly':
      case 'arbeitnow':
      case 'weworkremotely':
      case 'greenjapan': {
        name = rawData.company || null;
        location = rawData.location || null;
        break;
      }
      case 'japandev': {
        name = rawData.company || null;
        website = rawData.companyWebsite || null;
        location = rawData.location || null;
        break;
      }
      case 'generic':
      default: {
        name = rawData.company || null;
        // Do NOT use rawData.url — for generic crawls it's the source page URL, not the company website.
        // Company website comes from AI extraction (companyInfo.website) instead.
        website = rawData.companyWebsite || null;
        location = rawData.location || null;
        break;
      }
    }

    if (!name) return null;

    const result: JobCompanyInfo = { name };
    if (website) result.website = website;
    if (location) result.location = location;

    return result;
  }

  /**
   * Check if rawData represents raw page content from the generic crawler
   * (single-pass enrichment path) vs. pre-structured data from dedicated crawlers.
   */
  static isRawContent(rawData: Record<string, any>): boolean {
    return rawData?._rawContent === true;
  }

  /**
   * Single-pass enrichment for raw page content from the generic crawler.
   * Performs both extraction (title, company, salary, etc.) AND classification
   * (projectType, technologies, complexity, etc.) in one AI call.
   */
  async enrichFromRawContent(
    rawData: Record<string, any>,
    source: string = 'generic',
  ): Promise<{
    detectedType: string;
    rawFields: Record<string, any>;
    structuredData: JobStructuredData | ProfileStructuredData | CompanyStructuredData;
  }> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const contentType = rawData._contentType || 'auto';
    const pageText = rawData.text || '';
    const sourceUrl = rawData._sourceUrl || '';
    const customPrompt = rawData._customPrompt || '';

    const systemPrompt = `You are a web data extraction and classification AI.
You receive the full text content of a web page and must:
1. Detect the content type (job_post, profile, or company)${contentType !== 'auto' ? ` — the user expects "${contentType}"` : ''}
2. Extract raw structured fields from the page
3. Classify/enrich the content with analytical fields

Always respond with valid JSON matching the exact schema below.`;

    const userPrompt = `Analyze this web page and extract + classify all information:

URL: ${sourceUrl}
${rawData._title ? `Page Title: ${rawData._title}` : ''}
${rawData._metaDescription ? `Meta Description: ${rawData._metaDescription}` : ''}

Page Content:
${pageText}
${customPrompt ? `\nAdditional instructions: ${customPrompt}` : ''}

Respond with JSON matching this schema:
{
  "detectedType": "job_post|profile|company",
  "confidence": 0.0-1.0,
  "extracted": {
    "title": "Page/post title or null",
    "company": "Company name or null",
    "location": "Location or null",
    "description": "Main content description (2-4 sentences)",
    "tags": ["tag1", "tag2"],
    "salary": "Original salary string as written on page, or null",
    "remotePolicy": "remote|hybrid|onsite|unknown",
    "jobType": "full-time|part-time|contract|freelance or null",
    "applicationUrl": "Application URL or null",
    "name": "Person name (for profiles) or null",
    "skills": ["skill1", "skill2"],
    "bio": "Person bio (for profiles) or null"
  },
  "enrichment": {
    "projectType": "web_app|mobile|api|data|ai_ml|devops|other",
    "technologies": ["tech1", "tech2", "tech3"],
    "budgetRange": { "min": null, "max": null, "currency": "USD" },
    "urgency": "immediate|flexible|ongoing|unknown",
    "complexity": "junior|mid|senior|expert|unknown",
    "remotePolicy": "remote|hybrid|onsite|unknown",
    "summary": "A 2-4 sentence summary highlighting what makes this unique: company name, specific responsibilities, team context, salary if mentioned, and anything distinctive",
    "companyInfo": {
      "name": "Company name or null",
      "website": "Company website URL or null",
      "contactEmail": "Hiring/contact email or null",
      "location": "Company HQ location or null",
      "industry": "Primary industry/sector or null",
      "size": "startup|small|medium|large|enterprise|unknown"
    }
  }
}

Notes:
- budgetRange: Parse salary/compensation if mentioned. Use ORIGINAL currency (JPY for ¥, EUR for €, GBP for £, USD for $). Convert "¥5M ~ ¥9.6M" to {"min":5000000,"max":9600000,"currency":"JPY"}. Leave null only if truly not mentioned.
- technologies: List actual technologies, frameworks, tools. Do NOT include industries/domains.
- For profiles: fill primaryRole, seniorityLevel, topSkills, specializations, summary, socialAccounts in the enrichment block instead of the job-specific fields.
- companyInfo: Extract when available. Can be null if no company info found.
- companyInfo.website: Must be the company's OWN domain (e.g. moneyforward.com), NOT the job board or source URL. If you only see the job board URL, set website to null.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content);
      const detectedType = parsed.detectedType || contentType === 'auto' ? (parsed.detectedType || 'job_post') : contentType;
      const extracted = parsed.extracted || {};
      const enrichment = parsed.enrichment || {};

      // Build rawFields — these get written back to crawled_data.raw_data
      const rawFields: Record<string, any> = {
        ...extracted,
        _sourceUrl: sourceUrl,
        _originalText: pageText,
        _rawContent: false, // Mark as processed
      };

      // Build structuredData based on detected type
      let structuredData: any;

      if (detectedType === 'profile') {
        structuredData = this.validateProfileData({
          primaryRole: enrichment.primaryRole || 'other',
          seniorityLevel: enrichment.seniorityLevel || 'unknown',
          topSkills: enrichment.topSkills || extracted.skills || [],
          specializations: enrichment.specializations || [],
          summary: enrichment.summary || '',
          socialAccounts: enrichment.socialAccounts || {},
          location: extracted.location || undefined,
          company: extracted.company || undefined,
        });
      } else if (detectedType === 'company') {
        const validSizes = ['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'];
        structuredData = {
          name: extracted.company || extracted.title || '',
          industry: enrichment.companyInfo?.industry || '',
          size: validSizes.includes(enrichment.companyInfo?.size) ? enrichment.companyInfo.size : 'unknown',
          technologies: Array.isArray(enrichment.technologies) ? enrichment.technologies.slice(0, 20) : [],
          summary: enrichment.summary || '',
          location: extracted.location || undefined,
          website: enrichment.companyInfo?.website || undefined,
          careersUrl: undefined,
          description: extracted.description || undefined,
        } as CompanyStructuredData;
      } else {
        // job_post (default)
        structuredData = this.validateJobData({
          projectType: enrichment.projectType || 'other',
          technologies: enrichment.technologies || [],
          budgetRange: enrichment.budgetRange || { min: null, max: null, currency: 'USD' },
          urgency: enrichment.urgency || 'unknown',
          complexity: enrichment.complexity || 'unknown',
          remotePolicy: enrichment.remotePolicy || extracted.remotePolicy || 'unknown',
          summary: enrichment.summary || '',
          companyInfo: enrichment.companyInfo || undefined,
        });
      }

      this.logger.debug(`Single-pass enriched ${sourceUrl} as ${detectedType}`);

      return { detectedType, rawFields, structuredData };
    } catch (error) {
      this.logger.error(`Failed to enrich raw content from ${sourceUrl}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private buildGithubProfileContext(rawData: Record<string, any>): string {
    const parts: string[] = [];

    // Basic info
    if (rawData.login) parts.push(`Username: ${rawData.login}`);
    if (rawData.name) parts.push(`Name: ${rawData.name}`);
    if (rawData.bio) parts.push(`Bio: ${rawData.bio}`);
    if (rawData.company) parts.push(`Company: ${rawData.company}`);
    if (rawData.location) parts.push(`Location: ${rawData.location}`);
    if (rawData.publicRepos) parts.push(`Public Repos: ${rawData.publicRepos}`);
    if (rawData.followers) parts.push(`Followers: ${rawData.followers}`);
    if (rawData.hireable !== undefined) parts.push(`Open to Work: ${rawData.hireable ? 'Yes' : 'No'}`);

    // Social accounts
    if (rawData.htmlUrl) parts.push(`GitHub URL: ${rawData.htmlUrl}`);
    if (rawData.blog) parts.push(`Website/Blog: ${rawData.blog}`);
    if (rawData.twitterUsername) parts.push(`Twitter: @${rawData.twitterUsername}`);
    if (rawData.email) parts.push(`Email: ${rawData.email}`);

    // Languages - handle both array and object formats
    if (rawData.languages) {
      if (Array.isArray(rawData.languages)) {
        parts.push(`Top Languages: ${rawData.languages.join(', ')}`);
      } else if (typeof rawData.languages === 'object' && Object.keys(rawData.languages).length > 0) {
        const langs = Object.entries(rawData.languages)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 10)
          .map(([lang, bytes]) => `${lang} (${bytes} bytes)`);
        parts.push(`Top Languages: ${langs.join(', ')}`);
      }
    }

    // Repositories
    if (rawData.topRepos && rawData.topRepos.length > 0) {
      const repoInfo = rawData.topRepos.slice(0, 5).map((r: any) => {
        const stars = r.stars ? ` (${r.stars} stars)` : '';
        return `${r.name}${stars}`;
      });
      parts.push(`Notable Repos: ${repoInfo.join(', ')}`);
    } else if (rawData.repos && rawData.repos.length > 0) {
      const repoNames = rawData.repos.slice(0, 5).map((r: any) => r.name || r);
      parts.push(`Notable Repos: ${repoNames.join(', ')}`);
    }

    if (rawData.topics && rawData.topics.length > 0) {
      parts.push(`Topics: ${rawData.topics.join(', ')}`);
    }

    return parts.join('\n');
  }

  private buildJobPostContext(rawData: Record<string, any>): string {
    const parts: string[] = [];

    if (rawData.text) {
      parts.push(`Job Post Content:\n${rawData.text}`);
    }

    // Support various job post formats from different sources
    if (rawData.title) parts.push(`Title: ${rawData.title}`);
    if (rawData.company) parts.push(`Company: ${rawData.company}`);
    if (rawData.description) parts.push(`Description:\n${rawData.description}`);
    if (rawData.location) parts.push(`Location: ${rawData.location}`);
    if (rawData.tags && rawData.tags.length > 0) parts.push(`Tags: ${rawData.tags.join(', ')}`);
    if (rawData.category) parts.push(`Category: ${rawData.category}`);
    if (rawData.jobType) parts.push(`Job Type: ${rawData.jobType}`);
    if (rawData.jobTypes && rawData.jobTypes.length > 0) parts.push(`Job Types: ${rawData.jobTypes.join(', ')}`);

    // Salary — support various field names across crawlers
    if (rawData.salary) parts.push(`Salary: ${rawData.salary}`);
    else if (rawData.salaryMin || rawData.salaryMax) parts.push(`Salary: ${rawData.salaryMin || '?'} - ${rawData.salaryMax || '?'}`);
    else if (rawData.compensation) parts.push(`Compensation: ${rawData.compensation}`);

    // Remote policy — support string and boolean formats
    if (rawData.remotePolicy) parts.push(`Remote Policy: ${rawData.remotePolicy}`);
    else if (rawData.remote !== undefined) parts.push(`Remote: ${rawData.remote}`);

    if (rawData.region) parts.push(`Region: ${rawData.region}`);
    if (rawData.applicationUrl) parts.push(`Application URL: ${rawData.applicationUrl}`);
    if (rawData.companyUrl || rawData.companyWebsite) parts.push(`Company Website: ${rawData.companyUrl || rawData.companyWebsite}`);

    if (rawData.by) parts.push(`Posted by: ${rawData.by}`);
    if (rawData.time) {
      const date = new Date(rawData.time * 1000);
      parts.push(`Posted: ${date.toISOString()}`);
    }
    if (rawData.postedAt) parts.push(`Posted: ${rawData.postedAt}`);

    return parts.join('\n');
  }

  private buildGenericProfileContext(rawData: Record<string, any>, source: string): string {
    const parts: string[] = [];

    parts.push(`Source: ${source}`);

    if (rawData.displayName) parts.push(`Name: ${rawData.displayName}`);
    if (rawData.name) parts.push(`Name: ${rawData.name}`);
    if (rawData.reputation) parts.push(`Reputation: ${rawData.reputation}`);
    if (rawData.location) parts.push(`Location: ${rawData.location}`);
    if (rawData.website) parts.push(`Website: ${rawData.website}`);
    if (rawData.aboutMe) parts.push(`About: ${rawData.aboutMe}`);
    if (rawData.link) parts.push(`Profile URL: ${rawData.link}`);

    if (rawData.badges) {
      const b = rawData.badges;
      parts.push(`Badges: ${b.gold || 0} gold, ${b.silver || 0} silver, ${b.bronze || 0} bronze`);
    }

    if (rawData.topTags && rawData.topTags.length > 0) {
      parts.push(`Top Tags: ${rawData.topTags.join(', ')}`);
    }

    if (rawData.answerCount) parts.push(`Answers: ${rawData.answerCount}`);
    if (rawData.questionCount) parts.push(`Questions: ${rawData.questionCount}`);

    // Generic fields
    if (rawData.bio) parts.push(`Bio: ${rawData.bio}`);
    if (rawData.email) parts.push(`Email: ${rawData.email}`);
    if (rawData.company) parts.push(`Company: ${rawData.company}`);

    return parts.join('\n');
  }

  private validateProfileData(data: ProfileStructuredData): ProfileStructuredData {
    const validRoles = ['frontend', 'backend', 'fullstack', 'mobile', 'devops', 'data', 'ai_ml', 'other'];
    const validSeniority = ['junior', 'mid', 'senior', 'lead', 'principal', 'unknown'];
    const validInfluence = ['low', 'medium', 'high', 'very_high'];

    // Validate social accounts
    const socialAccounts = data.socialAccounts || {};
    const validatedSocialAccounts = {
      github: typeof socialAccounts.github === 'string' ? socialAccounts.github : undefined,
      twitter: typeof socialAccounts.twitter === 'string' ? socialAccounts.twitter : undefined,
      linkedin: typeof socialAccounts.linkedin === 'string' ? socialAccounts.linkedin : undefined,
      website: typeof socialAccounts.website === 'string' ? socialAccounts.website : undefined,
      blog: typeof socialAccounts.blog === 'string' ? socialAccounts.blog : undefined,
      email: typeof socialAccounts.email === 'string' ? socialAccounts.email : undefined,
    };

    return {
      primaryRole: validRoles.includes(data.primaryRole) ? data.primaryRole : 'other',
      seniorityLevel: validSeniority.includes(data.seniorityLevel) ? data.seniorityLevel : 'unknown',
      topSkills: Array.isArray(data.topSkills) ? data.topSkills.slice(0, 10) : [],
      specializations: Array.isArray(data.specializations) ? data.specializations.slice(0, 5) : [],
      summary: typeof data.summary === 'string' ? data.summary : '',
      socialAccounts: validatedSocialAccounts,
      location: typeof data.location === 'string' ? data.location : undefined,
      company: typeof data.company === 'string' ? data.company : undefined,
      hireable: typeof data.hireable === 'boolean' ? data.hireable : undefined,
      influenceScore: validInfluence.includes(data.influenceScore as string) ? data.influenceScore : undefined,
    };
  }

  private validateJobData(data: JobStructuredData): JobStructuredData {
    const validTypes = ['web_app', 'mobile', 'api', 'data', 'ai_ml', 'devops', 'other'];
    const validUrgency = ['immediate', 'flexible', 'ongoing', 'unknown'];
    const validComplexity = ['junior', 'mid', 'senior', 'expert', 'unknown'];
    const validRemote = ['remote', 'hybrid', 'onsite', 'unknown'];

    const result: JobStructuredData = {
      projectType: validTypes.includes(data.projectType) ? data.projectType : 'other',
      technologies: Array.isArray(data.technologies) ? data.technologies.slice(0, 15) : [],
      budgetRange: data.budgetRange || { min: null, max: null, currency: 'USD' },
      urgency: validUrgency.includes(data.urgency) ? data.urgency : 'unknown',
      complexity: validComplexity.includes(data.complexity) ? data.complexity : 'unknown',
      remotePolicy: validRemote.includes(data.remotePolicy) ? data.remotePolicy : 'unknown',
      summary: typeof data.summary === 'string' ? data.summary : '',
    };

    // Validate companyInfo if present
    if (data.companyInfo && typeof data.companyInfo === 'object' && data.companyInfo.name) {
      result.companyInfo = {
        name: String(data.companyInfo.name),
        website: typeof data.companyInfo.website === 'string' ? data.companyInfo.website : undefined,
        contactEmail: typeof data.companyInfo.contactEmail === 'string' ? data.companyInfo.contactEmail : undefined,
        location: typeof data.companyInfo.location === 'string' ? data.companyInfo.location : undefined,
        industry: typeof data.companyInfo.industry === 'string' ? data.companyInfo.industry : undefined,
        size: typeof data.companyInfo.size === 'string' ? data.companyInfo.size : undefined,
      };
    }

    return result;
  }

  private transformEnrichedProfile(record: any): any {
    return {
      id: record.id,
      crawledDataId: record.crawled_data_id,
      source: record.source,
      type: record.type,
      structuredData: record.structured_data,
      summary: record.summary,
      embeddingId: record.embedding_id,
      enrichedAt: record.enriched_at,
      createdAt: record.created_at,
    };
  }
}
