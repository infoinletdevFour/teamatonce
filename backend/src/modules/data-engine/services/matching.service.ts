import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EnrichmentService } from './enrichment.service';
import { EmbeddingService } from '../../ai/embedding.service';
import { QdrantService } from '../../qdrant/qdrant.service';
import { EntityScoringService } from './entity-scoring.service';

const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'lead', 'principal'];

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly enrichmentService: EnrichmentService,
    private readonly embeddingService: EmbeddingService,
    private readonly qdrantService: QdrantService,
    private readonly entityScoringService: EntityScoringService,
  ) {}

  /**
   * Find developers matching a job post
   */
  async matchDevelopersForJob(
    jobEnrichedProfileId: string,
    options: { limit?: number; minScore?: number } = {},
  ): Promise<any[]> {
    const limit = options.limit || 20;
    const minScore = options.minScore || 0;

    // 1. Fetch job enriched profile
    const jobProfile = await this.enrichmentService.getEnrichedProfileById(jobEnrichedProfileId);
    if (!jobProfile) {
      throw new Error(`Job enriched profile not found: ${jobEnrichedProfileId}`);
    }

    const jobData = jobProfile.structuredData || {};

    // 2. Get job's vector from Qdrant
    const jobVector = await this.qdrantService.getVector(
      EnrichmentService.JOBS_COLLECTION,
      `temp-${jobProfile.crawledDataId}`,
    );

    if (!jobVector || !jobVector.vector) {
      throw new Error('Job vector not found in Qdrant');
    }

    // 3. Search profiles collection with job vector (over-fetch)
    const searchLimit = limit * 3;
    const searchResults = await this.qdrantService.searchVectors(
      EnrichmentService.PROFILES_COLLECTION,
      jobVector.vector,
      searchLimit,
    );

    if (searchResults.length === 0) {
      return [];
    }

    // 4. For each result, compute composite score
    const matches: any[] = [];

    for (const result of searchResults) {
      try {
        const enrichedProfileId = result.payload?.enrichedProfileId as string;
        const crawledDataId = enrichedProfileId?.startsWith('temp-')
          ? enrichedProfileId.substring(5)
          : enrichedProfileId;

        if (!crawledDataId) continue;

        const devProfile = await this.enrichmentService.getEnrichedProfileByCrawledDataId(crawledDataId);
        if (!devProfile || !devProfile.structuredData) continue;

        // Find unified entity
        const entityLinks = await this.db.select('entity_source_links', {
          where: { enriched_profile_id: devProfile.id },
          limit: 1,
        });

        if (!entityLinks || entityLinks.length === 0) continue;

        const entityId = entityLinks[0].unified_entity_id;
        const entities = await this.db.select('unified_entities', {
          where: { id: entityId },
          limit: 1,
        });

        if (!entities || entities.length === 0) continue;
        const entity = entities[0];

        // Get entity score
        let entityScore = await this.entityScoringService.getEntityScore(entityId);
        const qualityScore = entityScore?.qualityScore || 0;

        // 5. Rule-based scoring
        const ruleScore = this.calculateRuleScore(
          jobData,
          devProfile.structuredData,
          entity.merged_data || {},
        );

        // 6. Composite score
        const vectorSimilarity = result.score || 0;
        const qualityBonus = qualityScore / 100;
        const compositeScore = vectorSimilarity * 0.5 + ruleScore * 0.3 + qualityBonus * 0.2;

        if (compositeScore < minScore) continue;

        matches.push({
          entityId,
          entity: {
            id: entity.id,
            canonicalName: entity.canonical_name,
            normalizedEmail: entity.normalized_email,
            location: entity.location,
            company: entity.company,
          },
          developerProfile: devProfile,
          vectorSimilarity,
          ruleScore,
          qualityBonus,
          compositeScore,
          matchBreakdown: this.buildMatchBreakdown(jobData, devProfile.structuredData, entity.merged_data || {}),
        });
      } catch (error) {
        this.logger.debug(`Skipping match candidate: ${error.message}`);
      }
    }

    // 7. Sort by composite score desc, take top limit
    matches.sort((a, b) => b.compositeScore - a.compositeScore);
    const topMatches = matches.slice(0, limit);

    // 8. Store results in match_results
    for (const match of topMatches) {
      try {
        // Check if match already exists
        let existing: any[] = [];
        try {
          existing = await this.db.select('match_results', {
            where: {
              job_enriched_profile_id: jobEnrichedProfileId,
              developer_entity_id: match.entityId,
            },
            limit: 1,
          });
        } catch {
          // Table may not exist yet
        }

        if (existing && existing.length > 0) {
          await this.db.update(
            'match_results',
            { id: existing[0].id },
            {
              vector_similarity: match.vectorSimilarity,
              rule_score: match.ruleScore,
              composite_score: match.compositeScore,
              match_breakdown: match.matchBreakdown,
              matched_at: new Date().toISOString(),
            },
          );
        } else {
          await this.db.insert('match_results', {
            job_enriched_profile_id: jobEnrichedProfileId,
            developer_entity_id: match.entityId,
            vector_similarity: match.vectorSimilarity,
            rule_score: match.ruleScore,
            composite_score: match.compositeScore,
            match_breakdown: match.matchBreakdown,
            status: 'active',
            matched_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to store match result: ${error.message}`);
      }
    }

    return topMatches.map((m) => ({
      entityId: m.entityId,
      entity: m.entity,
      vectorSimilarity: m.vectorSimilarity,
      ruleScore: m.ruleScore,
      compositeScore: m.compositeScore,
      matchBreakdown: m.matchBreakdown,
    }));
  }

  /**
   * Find jobs matching a developer entity
   */
  async matchJobsForDeveloper(
    entityId: string,
    options: { limit?: number; minScore?: number } = {},
  ): Promise<any[]> {
    const limit = options.limit || 20;
    const minScore = options.minScore || 0;

    // 1. Fetch unified entity
    const entities = await this.db.select('unified_entities', {
      where: { id: entityId },
      limit: 1,
    });

    if (!entities || entities.length === 0) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    const entity = entities[0];
    const mergedData = entity.merged_data || {};

    // 2. Build text from entity data for embedding
    const textParts: string[] = [];
    if (mergedData.skills) textParts.push(`Skills: ${mergedData.skills.join(', ')}`);
    if (mergedData.topSkills) textParts.push(`Skills: ${mergedData.topSkills.join(', ')}`);
    if (mergedData.primaryRole) textParts.push(`Role: ${mergedData.primaryRole}`);
    if (mergedData.specializations) textParts.push(`Specializations: ${mergedData.specializations.join(', ')}`);
    if (mergedData.summary) textParts.push(`Summary: ${mergedData.summary}`);

    if (textParts.length === 0) {
      textParts.push(entity.canonical_name || 'developer');
    }

    const text = textParts.join('. ');

    // 3. Generate embedding
    const embedding = await this.embeddingService.generateEmbedding(text);
    if (embedding.length === 0) {
      throw new Error('Failed to generate embedding for entity');
    }

    // 4. Search job_posts collection
    const searchLimit = limit * 3;
    const searchResults = await this.qdrantService.searchVectors(
      EnrichmentService.JOBS_COLLECTION,
      embedding,
      searchLimit,
    );

    if (searchResults.length === 0) {
      return [];
    }

    // 5. Apply inverse rule scoring and composite
    const matches: any[] = [];

    for (const result of searchResults) {
      try {
        const enrichedProfileId = result.payload?.enrichedProfileId as string;
        const crawledDataId = enrichedProfileId?.startsWith('temp-')
          ? enrichedProfileId.substring(5)
          : enrichedProfileId;

        if (!crawledDataId) continue;

        const jobProfile = await this.enrichmentService.getEnrichedProfileByCrawledDataId(crawledDataId);
        if (!jobProfile || !jobProfile.structuredData) continue;

        const jobData = jobProfile.structuredData;

        // Inverse rule scoring (how well does the developer fit the job?)
        const ruleScore = this.calculateRuleScore(jobData, mergedData, mergedData);
        const vectorSimilarity = result.score || 0;

        // Get entity quality score
        const entityScore = await this.entityScoringService.getEntityScore(entityId);
        const qualityBonus = (entityScore?.qualityScore || 0) / 100;

        const compositeScore = vectorSimilarity * 0.5 + ruleScore * 0.3 + qualityBonus * 0.2;

        if (compositeScore < minScore) continue;

        matches.push({
          jobEnrichedProfileId: jobProfile.id,
          jobProfile: {
            id: jobProfile.id,
            source: jobProfile.source,
            summary: jobProfile.summary,
            structuredData: jobData,
          },
          vectorSimilarity,
          ruleScore,
          compositeScore,
          matchBreakdown: this.buildMatchBreakdown(jobData, mergedData, mergedData),
        });
      } catch (error) {
        this.logger.debug(`Skipping job match candidate: ${error.message}`);
      }
    }

    matches.sort((a, b) => b.compositeScore - a.compositeScore);
    const topMatches = matches.slice(0, limit);

    // Store results
    for (const match of topMatches) {
      try {
        let existing: any[] = [];
        try {
          existing = await this.db.select('match_results', {
            where: {
              job_enriched_profile_id: match.jobEnrichedProfileId,
              developer_entity_id: entityId,
            },
            limit: 1,
          });
        } catch {
          // Table may not exist yet
        }

        if (existing && existing.length > 0) {
          await this.db.update(
            'match_results',
            { id: existing[0].id },
            {
              vector_similarity: match.vectorSimilarity,
              rule_score: match.ruleScore,
              composite_score: match.compositeScore,
              match_breakdown: match.matchBreakdown,
              matched_at: new Date().toISOString(),
            },
          );
        } else {
          await this.db.insert('match_results', {
            job_enriched_profile_id: match.jobEnrichedProfileId,
            developer_entity_id: entityId,
            vector_similarity: match.vectorSimilarity,
            rule_score: match.ruleScore,
            composite_score: match.compositeScore,
            match_breakdown: match.matchBreakdown,
            status: 'active',
            matched_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to store match result: ${error.message}`);
      }
    }

    return topMatches;
  }

  /**
   * Get stored matches for a job
   */
  async getMatchesForJob(
    jobId: string,
    options: { status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: any[]; total: number }> {
    const where: Record<string, any> = { job_enriched_profile_id: jobId };
    if (options.status) where.status = options.status;

    let allMatches: any[] = [];
    try {
      allMatches = await this.db.select('match_results', {
        where,
        orderBy: 'composite_score',
        order: 'desc',
      });
    } catch {
      // Table may not exist yet
    }

    const total = allMatches.length;
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const paginated = allMatches.slice(offset, offset + limit);

    return {
      data: paginated.map(this.transformMatch),
      total,
    };
  }

  /**
   * Get stored matches for an entity
   */
  async getMatchesForEntity(
    entityId: string,
    options: { status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: any[]; total: number }> {
    const where: Record<string, any> = { developer_entity_id: entityId };
    if (options.status) where.status = options.status;

    let allMatches: any[] = [];
    try {
      allMatches = await this.db.select('match_results', {
        where,
        orderBy: 'composite_score',
        order: 'desc',
      });
    } catch {
      // Table may not exist yet
    }

    const total = allMatches.length;
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const paginated = allMatches.slice(offset, offset + limit);

    return {
      data: paginated.map(this.transformMatch),
      total,
    };
  }

  /**
   * Update match status
   */
  async updateMatchStatus(matchId: string, status: string): Promise<any> {
    const existing = await this.db.select('match_results', {
      where: { id: matchId },
      limit: 1,
    });

    if (!existing || existing.length === 0) {
      throw new Error(`Match not found: ${matchId}`);
    }

    await this.db.update(
      'match_results',
      { id: matchId },
      { status },
    );

    const refreshed = await this.db.select('match_results', {
      where: { id: matchId },
      limit: 1,
    });

    return this.transformMatch(refreshed[0]);
  }

  // ==========================================
  // RULE-BASED SCORING
  // ==========================================

  private calculateRuleScore(
    jobData: any,
    devProfileData: any,
    entityMergedData: any,
  ): number {
    let totalWeight = 0;
    let weightedScore = 0;

    // Skills overlap (weight: 0.5)
    const skillOverlap = this.calculateSkillOverlap(jobData, devProfileData, entityMergedData);
    weightedScore += skillOverlap * 0.5;
    totalWeight += 0.5;

    // Seniority match (weight: 0.3)
    const seniorityMatch = this.calculateSeniorityMatch(jobData, devProfileData);
    weightedScore += seniorityMatch * 0.3;
    totalWeight += 0.3;

    // Remote policy match (weight: 0.2)
    const remoteMatch = this.calculateRemoteMatch(jobData);
    weightedScore += remoteMatch * 0.2;
    totalWeight += 0.2;

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  private calculateSkillOverlap(jobData: any, devData: any, mergedData: any): number {
    const jobTechs = (jobData.technologies || []).map((t: string) => t.toLowerCase());
    if (jobTechs.length === 0) return 0.5; // Neutral if no job techs

    const devSkills = [
      ...(devData.topSkills || []),
      ...(mergedData.skills || []),
      ...(mergedData.topSkills || []),
    ].map((s: string) => s.toLowerCase());

    if (devSkills.length === 0) return 0;

    const uniqueDevSkills = [...new Set(devSkills)];
    let overlapCount = 0;
    for (const tech of jobTechs) {
      if (uniqueDevSkills.some((s) => s.includes(tech) || tech.includes(s))) {
        overlapCount++;
      }
    }

    return jobTechs.length > 0 ? overlapCount / jobTechs.length : 0;
  }

  private calculateSeniorityMatch(jobData: any, devData: any): number {
    const jobComplexity = jobData.complexity || 'unknown';
    const devSeniority = devData.seniorityLevel || devData.seniority || 'unknown';

    if (jobComplexity === 'unknown' || devSeniority === 'unknown') return 0.5;

    const jobIdx = SENIORITY_LEVELS.indexOf(jobComplexity);
    const devIdx = SENIORITY_LEVELS.indexOf(devSeniority);

    if (jobIdx === -1 || devIdx === -1) return 0.5;

    const diff = Math.abs(jobIdx - devIdx);
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.7;
    if (diff === 2) return 0.3;
    return 0.1;
  }

  private calculateRemoteMatch(jobData: any): number {
    const policy = jobData.remotePolicy || 'unknown';
    if (policy === 'remote' || policy === 'unknown') return 1.0;
    if (policy === 'hybrid') return 0.7;
    return 0.5;
  }

  private buildMatchBreakdown(jobData: any, devData: any, mergedData: any): Record<string, any> {
    const jobTechs = (jobData.technologies || []).map((t: string) => t.toLowerCase());
    const devSkills = [
      ...(devData.topSkills || []),
      ...(mergedData.skills || []),
      ...(mergedData.topSkills || []),
    ].map((s: string) => s.toLowerCase());

    const uniqueDevSkills = [...new Set(devSkills)];
    const overlapping = jobTechs.filter((t: string) =>
      uniqueDevSkills.some((s) => s.includes(t) || t.includes(s)),
    );

    return {
      skillOverlap: {
        jobTechnologies: jobData.technologies || [],
        developerSkills: [...new Set([...(devData.topSkills || []), ...(mergedData.topSkills || [])])],
        overlapping,
        overlapRatio: jobTechs.length > 0 ? overlapping.length / jobTechs.length : 0,
      },
      seniorityMatch: {
        jobComplexity: jobData.complexity || 'unknown',
        developerSeniority: devData.seniorityLevel || devData.seniority || 'unknown',
      },
      remotePolicy: jobData.remotePolicy || 'unknown',
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private transformMatch(record: any): any {
    if (!record) return null;
    return {
      id: record.id,
      jobEnrichedProfileId: record.job_enriched_profile_id,
      developerEntityId: record.developer_entity_id,
      vectorSimilarity: parseFloat(record.vector_similarity) || 0,
      ruleScore: parseFloat(record.rule_score) || 0,
      compositeScore: parseFloat(record.composite_score) || 0,
      matchBreakdown: record.match_breakdown || {},
      status: record.status,
      matchedAt: record.matched_at,
      createdAt: record.created_at,
    };
  }
}
