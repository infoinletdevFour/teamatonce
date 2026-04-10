import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class EntityScoringService {
  private readonly logger = new Logger(EntityScoringService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Score a single entity on completeness, activity, availability, and quality
   */
  async scoreEntity(entityId: string): Promise<any> {
    const entities = await this.db.select('unified_entities', {
      where: { id: entityId },
      limit: 1,
    });

    if (!entities || entities.length === 0) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    const entity = entities[0];
    const mergedData = entity.merged_data || {};

    // Fetch linked enriched profiles for richer data
    const sourceLinks = await this.db.select('entity_source_links', {
      where: { unified_entity_id: entityId },
    });

    let enrichedProfiles: any[] = [];
    if (sourceLinks && sourceLinks.length > 0) {
      const profileIds = sourceLinks.map((l: any) => l.enriched_profile_id);
      const allEnriched = await this.db.select('enriched_profiles', {});
      enrichedProfiles = allEnriched.filter((p: any) => profileIds.includes(p.id));
    }

    const completeness = this.calculateCompleteness(entity, mergedData);
    const activity = this.calculateActivity(entity, mergedData, enrichedProfiles);
    const availability = this.calculateAvailability(entity, mergedData, enrichedProfiles);
    const quality = this.calculateQuality(completeness, activity, availability, entity, mergedData);

    const scoreBreakdown = {
      completeness: completeness.breakdown,
      activity: activity.breakdown,
      availability: availability.breakdown,
      quality: quality.breakdown,
    };

    // Upsert score record
    let existing: any[] = [];
    try {
      existing = await this.db.select('entity_scores', {
        where: { unified_entity_id: entityId },
        limit: 1,
      });
    } catch {
      // Table may not exist yet
    }

    let scoreRecord: any;
    if (existing && existing.length > 0) {
      scoreRecord = await this.db.update(
        'entity_scores',
        { id: existing[0].id },
        {
          completeness_score: completeness.score,
          activity_score: activity.score,
          availability_score: availability.score,
          quality_score: quality.score,
          score_breakdown: scoreBreakdown,
          scored_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      );
    } else {
      scoreRecord = await this.db.insert('entity_scores', {
        unified_entity_id: entityId,
        completeness_score: completeness.score,
        activity_score: activity.score,
        availability_score: availability.score,
        quality_score: quality.score,
        score_breakdown: scoreBreakdown,
        scored_at: new Date().toISOString(),
      });
    }

    return this.transformScore(scoreRecord);
  }

  /**
   * Batch score entities that are unscored or stale
   */
  async batchScoreEntities(options: {
    limit?: number;
    rescoreOlderThanHours?: number;
    onProgress?: (p: { percent: number; processed: number; total: number }) => void;
  } = {}): Promise<{ scored: number; errors: number }> {
    const limit = options.limit || 50;
    const rescoreHours = options.rescoreOlderThanHours || 24;

    // Get all entities
    const allEntities = await this.db.select('unified_entities', {
      orderBy: 'created_at',
      order: 'desc',
    });

    // Get existing scores
    let allScores: any[] = [];
    try {
      allScores = await this.db.select('entity_scores', {});
    } catch {
      // Table may not exist yet
    }
    const scoreMap = new Map<string, any>();
    for (const s of allScores) {
      scoreMap.set(s.unified_entity_id, s);
    }

    const cutoff = new Date(Date.now() - rescoreHours * 60 * 60 * 1000).toISOString();

    // Find entities needing scoring
    const toScore = allEntities.filter((e: any) => {
      const existing = scoreMap.get(e.id);
      if (!existing) return true;
      return existing.scored_at < cutoff;
    }).slice(0, limit);

    const total = toScore.length;
    let scored = 0;
    let errors = 0;

    for (const entity of toScore) {
      try {
        await this.scoreEntity(entity.id);
        scored++;
      } catch (error) {
        this.logger.error(`Failed to score entity ${entity.id}: ${error.message}`);
        errors++;
      }
      if (options.onProgress) {
        const done = scored + errors;
        options.onProgress({ percent: total > 0 ? Math.round((done / total) * 100) : 100, processed: done, total });
      }
    }

    this.logger.log(`Batch scoring completed: ${scored} scored, ${errors} errors`);
    return { scored, errors };
  }

  /**
   * Get score for a specific entity
   */
  async getEntityScore(entityId: string): Promise<any | null> {
    try {
      const results = await this.db.select('entity_scores', {
        where: { unified_entity_id: entityId },
        limit: 1,
      });

      if (!results || results.length === 0) {
        return null;
      }

      return this.transformScore(results[0]);
    } catch {
      return null;
    }
  }

  /**
   * Get top-scored entities with sorting and filtering
   */
  async getTopEntities(options: {
    sortBy?: string;
    minScore?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: any[]; total: number }> {
    const sortBy = options.sortBy || 'quality_score';
    const minScore = options.minScore || 0;
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get all scores sorted by the specified field
    let allScores: any[] = [];
    try {
      allScores = await this.db.select('entity_scores', {
        orderBy: sortBy,
        order: 'desc',
      });
    } catch {
      // Table may not exist yet
    }

    // Filter by minimum score
    const filtered = allScores.filter((s: any) => {
      const scoreVal = parseFloat(s[sortBy]) || 0;
      return scoreVal >= minScore;
    });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Fetch entity data for each score
    const results = await Promise.all(
      paginated.map(async (score: any) => {
        const entities = await this.db.select('unified_entities', {
          where: { id: score.unified_entity_id },
          limit: 1,
        });

        return {
          score: this.transformScore(score),
          entity: entities && entities.length > 0 ? {
            id: entities[0].id,
            entityType: entities[0].entity_type,
            canonicalName: entities[0].canonical_name,
            normalizedEmail: entities[0].normalized_email,
            location: entities[0].location,
            company: entities[0].company,
            sourceCount: entities[0].source_count,
          } : null,
        };
      }),
    );

    return { data: results, total };
  }

  /**
   * Get score distribution histograms
   */
  async getScoreDistribution(): Promise<Record<string, Record<string, number>>> {
    let allScores: any[] = [];
    try {
      allScores = await this.db.select('entity_scores', {});
    } catch {
      // Table may not exist yet
    }

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

  // ==========================================
  // SCORING FORMULAS
  // ==========================================

  private calculateCompleteness(entity: any, mergedData: any): { score: number; breakdown: Record<string, any> } {
    const breakdown: Record<string, number> = {};
    let score = 0;

    const hasEmail = !!entity.normalized_email;
    const hasLocation = !!entity.location;
    const hasGithub = !!entity.normalized_github;
    const hasTwitter = !!entity.normalized_twitter;
    const hasLinkedin = !!entity.normalized_linkedin;
    const skills = mergedData.skills || mergedData.topSkills || [];
    const hasSkills = Array.isArray(skills) && skills.length >= 3;
    const summary = mergedData.summary || '';
    const hasSummary = typeof summary === 'string' && summary.length > 20;
    const sourceCount = parseInt(entity.source_count) || 1;

    if (hasEmail) { score += 15; breakdown.hasEmail = 15; }
    if (hasLocation) { score += 10; breakdown.hasLocation = 10; }
    if (hasGithub) { score += 15; breakdown.hasGithub = 15; }
    if (hasTwitter) { score += 10; breakdown.hasTwitter = 10; }
    if (hasLinkedin) { score += 10; breakdown.hasLinkedin = 10; }
    if (hasSkills) { score += 15; breakdown.hasSkills = 15; }
    if (hasSummary) { score += 10; breakdown.hasSummary = 10; }

    const sourceBonus = Math.min(sourceCount * 5, 15);
    score += sourceBonus;
    breakdown.sourceCountBonus = sourceBonus;

    return { score: Math.min(score, 100), breakdown };
  }

  private calculateActivity(entity: any, mergedData: any, enrichedProfiles: any[]): { score: number; breakdown: Record<string, any> } {
    const breakdown: Record<string, number> = {};
    let score = 0;

    // Aggregate raw data from enriched profiles
    let publicRepos = 0;
    let followers = 0;
    let influence: string | undefined;

    for (const profile of enrichedProfiles) {
      const sd = profile.structured_data || {};
      if (sd.influenceScore) {
        influence = sd.influenceScore;
      }
    }

    // Check merged_data for GitHub stats
    publicRepos = mergedData.publicRepos || mergedData.public_repos || 0;
    followers = mergedData.followers || 0;
    if (!influence) {
      influence = mergedData.influenceScore;
    }

    // Public repos scoring
    if (publicRepos > 100) { breakdown.publicRepos = 40; }
    else if (publicRepos > 30) { breakdown.publicRepos = 30; }
    else if (publicRepos > 10) { breakdown.publicRepos = 20; }
    else if (publicRepos > 0) { breakdown.publicRepos = 10; }
    else { breakdown.publicRepos = 0; }
    score += breakdown.publicRepos;

    // Followers scoring
    if (followers > 1000) { breakdown.followers = 30; }
    else if (followers > 200) { breakdown.followers = 20; }
    else if (followers > 50) { breakdown.followers = 10; }
    else if (followers > 0) { breakdown.followers = 5; }
    else { breakdown.followers = 0; }
    score += breakdown.followers;

    // Influence scoring
    if (influence === 'very_high') { breakdown.influence = 30; }
    else if (influence === 'high') { breakdown.influence = 20; }
    else if (influence === 'medium') { breakdown.influence = 10; }
    else if (influence === 'low') { breakdown.influence = 5; }
    else { breakdown.influence = 0; }
    score += breakdown.influence;

    return { score: Math.min(score, 100), breakdown };
  }

  private calculateAvailability(entity: any, mergedData: any, enrichedProfiles: any[]): { score: number; breakdown: Record<string, any> } {
    const breakdown: Record<string, number> = {};
    let score = 0;

    // Check hireable flag from any source
    let isHireable = false;
    for (const profile of enrichedProfiles) {
      const sd = profile.structured_data || {};
      if (sd.hireable === true) {
        isHireable = true;
        break;
      }
    }
    if (mergedData.hireable === true) {
      isHireable = true;
    }

    if (isHireable) {
      score += 40;
      breakdown.hireable = 40;
    }

    // Keywords in summary
    const summary = (mergedData.summary || '').toLowerCase();
    const availabilityKeywords = ['open to work', 'freelance', 'contractor', 'available for hire', 'looking for', 'seeking', 'for hire', 'open to opportunities'];
    let keywordScore = 0;
    for (const kw of availabilityKeywords) {
      if (summary.includes(kw)) {
        keywordScore += 20;
      }
    }
    keywordScore = Math.min(keywordScore, 40);
    if (keywordScore > 0) {
      score += keywordScore;
      breakdown.keywords = keywordScore;
    }

    // Freelance platform presence
    const sources = enrichedProfiles.map((p: any) => p.source);
    const freelanceSources = ['upwork', 'freelancer', 'toptal', 'fiverr'];
    const hasFreelancePlatform = sources.some((s: string) => freelanceSources.includes(s));
    if (hasFreelancePlatform) {
      score += 20;
      breakdown.freelancePlatform = 20;
    }

    return { score: Math.min(score, 100), breakdown };
  }

  private calculateQuality(
    completeness: { score: number },
    activity: { score: number },
    availability: { score: number },
    entity: any,
    mergedData: any,
  ): { score: number; breakdown: Record<string, any> } {
    const breakdown: Record<string, any> = {};

    // Bonus calculations (normalized to 100)
    let bonusRaw = 0;
    const bonusDetails: Record<string, number> = {};

    // Seniority bonus
    const seniority = mergedData.seniorityLevel || mergedData.seniority;
    if (seniority === 'principal') { bonusRaw += 60; bonusDetails.seniority = 60; }
    else if (seniority === 'lead') { bonusRaw += 40; bonusDetails.seniority = 40; }
    else if (seniority === 'senior') { bonusRaw += 25; bonusDetails.seniority = 25; }

    // Influence bonus
    const influence = mergedData.influenceScore;
    if (influence === 'very_high') { bonusRaw += 40; bonusDetails.influence = 40; }
    else if (influence === 'high') { bonusRaw += 20; bonusDetails.influence = 20; }

    // Multi-source bonus
    const sourceCount = parseInt(entity.source_count) || 1;
    if (sourceCount > 2) { bonusRaw += 20; bonusDetails.multiSource = 20; }

    const bonusNormalized = Math.min(bonusRaw, 100);

    breakdown.completenessWeight = 0.30;
    breakdown.activityWeight = 0.30;
    breakdown.availabilityWeight = 0.20;
    breakdown.bonusWeight = 0.20;
    breakdown.bonusDetails = bonusDetails;

    const score = Math.round(
      completeness.score * 0.30 +
      activity.score * 0.30 +
      availability.score * 0.20 +
      bonusNormalized * 0.20,
    );

    return { score: Math.min(score, 100), breakdown };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private transformScore(record: any): any {
    if (!record) return null;
    return {
      id: record.id,
      unifiedEntityId: record.unified_entity_id,
      completenessScore: parseFloat(record.completeness_score) || 0,
      activityScore: parseFloat(record.activity_score) || 0,
      availabilityScore: parseFloat(record.availability_score) || 0,
      qualityScore: parseFloat(record.quality_score) || 0,
      scoreBreakdown: record.score_breakdown || {},
      scoredAt: record.scored_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}
