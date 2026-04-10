import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  normalizeEmail,
  normalizeGithubUrl,
  normalizeTwitterHandle,
  normalizeLinkedInUrl,
  normalizeWebsite,
  normalizeLocation,
  normalizeName,
  normalizeCompany,
  extractIdentifiers,
} from '../utils/normalization';
import { calculateProfileMatchScore, jaroWinkler } from '../utils/matching';

export type MatchType = 'email' | 'github' | 'twitter' | 'linkedin' | 'name_location' | 'semantic' | 'company_name' | 'website';
export type EntityType = 'person' | 'company';

export interface UnifiedEntity {
  id: string;
  entityType: EntityType;
  canonicalName: string;
  normalizedEmail: string | null;
  normalizedGithub: string | null;
  normalizedTwitter: string | null;
  normalizedLinkedin: string | null;
  normalizedWebsite: string | null;
  location: string | null;
  company: string | null;
  mergedData: Record<string, any>;
  sourceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EntitySourceLink {
  id: string;
  unifiedEntityId: string;
  enrichedProfileId: string;
  matchType: MatchType;
  confidenceScore: number;
  linkedAt: string;
}

export interface EntityResolutionResult {
  unifiedEntity: UnifiedEntity;
  isNew: boolean;
  matchType: MatchType;
  confidenceScore: number;
}

@Injectable()
export class EntityResolutionService {
  private readonly logger = new Logger(EntityResolutionService.name);

  // Confidence thresholds
  private readonly EXACT_MATCH_THRESHOLD = 0.95;
  private readonly FUZZY_MATCH_THRESHOLD = 0.75;

  constructor(private readonly db: DatabaseService) {}

  /**
   * Main entry point: Resolve an enriched profile to a unified entity
   * Finds an existing match or creates a new entity
   */
  async resolveEntity(enrichedProfileId: string): Promise<EntityResolutionResult | null> {
    this.logger.debug(`Resolving entity for enriched profile: ${enrichedProfileId}`);

    try {
      // Get the enriched profile
      const profile = await this.getEnrichedProfile(enrichedProfileId);
      if (!profile) {
        this.logger.warn(`Enriched profile not found: ${enrichedProfileId}`);
        return null;
      }

      // Skip job posts - only resolve profiles and companies
      if (profile.type !== 'profile' && profile.type !== 'company') {
        this.logger.debug(`Skipping entity resolution for non-resolvable type: ${profile.type}`);
        return null;
      }

      // Check if already linked
      const existingLink = await this.getExistingLink(enrichedProfileId);
      if (existingLink) {
        const entity = await this.getUnifiedEntityById(existingLink.unifiedEntityId);
        if (entity) {
          return {
            unifiedEntity: entity,
            isNew: false,
            matchType: existingLink.matchType as MatchType,
            confidenceScore: existingLink.confidenceScore,
          };
        }
      }

      // Get raw data for additional fields
      const rawData = await this.getCrawledData(profile.crawledDataId);

      // Extract normalized identifiers
      const identifiers = extractIdentifiers(profile.structuredData, rawData?.rawData || {});

      // Determine entity type from profile type
      const entityType: EntityType = profile.type === 'company' ? 'company' : 'person';

      // Try to find matching entity (priority order)
      let match = await this.findMatchingEntity(identifiers, profile.structuredData, rawData?.rawData, entityType);

      if (match) {
        // Link to existing entity
        await this.linkToEntity(enrichedProfileId, match.entityId, match.matchType, match.confidence);
        await this.updateEntityMergedData(match.entityId);

        const entity = await this.getUnifiedEntityById(match.entityId);
        return {
          unifiedEntity: entity!,
          isNew: false,
          matchType: match.matchType,
          confidenceScore: match.confidence,
        };
      }

      // No match found - create new entity
      const newEntity = await this.createUnifiedEntity(profile, identifiers, rawData?.rawData);
      await this.linkToEntity(enrichedProfileId, newEntity.id, 'email', 1.0);

      return {
        unifiedEntity: newEntity,
        isNew: true,
        matchType: 'email',
        confidenceScore: 1.0,
      };
    } catch (error) {
      this.logger.error(`Error resolving entity for ${enrichedProfileId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a matching unified entity for the given identifiers
   */
  private async findMatchingEntity(
    identifiers: ReturnType<typeof extractIdentifiers>,
    structuredData: any,
    rawData: any,
    entityType: EntityType = 'person',
  ): Promise<{ entityId: string; matchType: MatchType; confidence: number } | null> {
    // 1. Try exact email match (100% confidence)
    if (identifiers.email) {
      const match = await this.findByNormalizedField('normalized_email', identifiers.email);
      if (match) {
        this.logger.debug(`Found email match: ${identifiers.email}`);
        return { entityId: match.id, matchType: 'email', confidence: 1.0 };
      }
    }

    // 2. Try GitHub username match (95% confidence)
    if (identifiers.github) {
      const match = await this.findByNormalizedField('normalized_github', identifiers.github);
      if (match) {
        this.logger.debug(`Found GitHub match: ${identifiers.github}`);
        return { entityId: match.id, matchType: 'github', confidence: 0.95 };
      }
    }

    // 3. Try Twitter handle match (90% confidence)
    if (identifiers.twitter) {
      const match = await this.findByNormalizedField('normalized_twitter', identifiers.twitter);
      if (match) {
        this.logger.debug(`Found Twitter match: ${identifiers.twitter}`);
        return { entityId: match.id, matchType: 'twitter', confidence: 0.9 };
      }
    }

    // 4. Try LinkedIn match (90% confidence)
    if (identifiers.linkedin) {
      const match = await this.findByNormalizedField('normalized_linkedin', identifiers.linkedin);
      if (match) {
        this.logger.debug(`Found LinkedIn match: ${identifiers.linkedin}`);
        return { entityId: match.id, matchType: 'linkedin', confidence: 0.9 };
      }
    }

    // 5. Try fuzzy name + location + company match (70-85% confidence)
    if (identifiers.name) {
      const candidates = await this.findCandidatesByName(identifiers.name, entityType);

      for (const candidate of candidates) {
        const { score, breakdown } = calculateProfileMatchScore(
          {
            name: identifiers.name,
            location: identifiers.location,
            company: identifiers.company,
          },
          {
            name: candidate.canonical_name,
            location: candidate.location,
            company: candidate.company,
          },
        );

        if (score >= this.FUZZY_MATCH_THRESHOLD) {
          // Require at least name + one other field to match
          const hasSecondaryMatch = breakdown.location > 0.7 || breakdown.company > 0.7;
          if (breakdown.name > 0.85 && hasSecondaryMatch) {
            const confidence = Math.min(0.85, 0.7 + score * 0.15);
            this.logger.debug(`Found name+location match: ${identifiers.name} -> ${candidate.canonical_name} (score: ${score})`);
            return { entityId: candidate.id, matchType: 'name_location', confidence };
          }
        }
      }
    }

    return null;
  }

  /**
   * Find entity by a normalized field
   */
  private async findByNormalizedField(field: string, value: string): Promise<any | null> {
    if (!value) return null;

    try {
      const results = await this.db.select('unified_entities', {
        where: { [field]: value },
        limit: 1,
      });

      return results && results.length > 0 ? results[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Find a company entity by normalized website stored in merged_data
   */
  private async findCompanyByWebsite(normalizedWebsite: string): Promise<any | null> {
    if (!normalizedWebsite) return null;

    try {
      const companies = await this.db.select('unified_entities', {
        where: { entity_type: 'company' },
        limit: 1000,
      });

      return companies.find((c: any) => {
        const w = normalizeWebsite(c.merged_data?.website || null);
        return w && w === normalizedWebsite;
      }) || null;
    } catch {
      return null;
    }
  }

  /**
   * Find candidate entities by fuzzy name match
   */
  private async findCandidatesByName(name: string, entityType: EntityType = 'person'): Promise<any[]> {
    if (!name) return [];

    try {
      // Get all entities (for small datasets this is fine, for large scale would use trigram index)
      const allEntities = await this.db.select('unified_entities', {
        where: { entity_type: entityType },
        limit: 1000,
      });

      // Filter by name similarity
      const candidates = allEntities.filter((entity: any) => {
        if (!entity.canonical_name) return false;
        const similarity = jaroWinkler(name.toLowerCase(), entity.canonical_name.toLowerCase());
        return similarity > 0.7;
      });

      // Sort by similarity
      return candidates.sort((a: any, b: any) => {
        const simA = jaroWinkler(name.toLowerCase(), a.canonical_name.toLowerCase());
        const simB = jaroWinkler(name.toLowerCase(), b.canonical_name.toLowerCase());
        return simB - simA;
      });
    } catch {
      return [];
    }
  }

  /**
   * Create a new unified entity
   */
  async createUnifiedEntity(
    profile: any,
    identifiers: ReturnType<typeof extractIdentifiers>,
    rawData: any,
  ): Promise<UnifiedEntity> {
    const canonicalName = rawData?.name || identifiers.name || 'Unknown';
    const entityType: EntityType = profile.type === 'company' ? 'company' : 'person';

    const entityData = {
      entity_type: entityType,
      canonical_name: canonicalName,
      normalized_email: identifiers.email,
      normalized_github: identifiers.github,
      normalized_twitter: identifiers.twitter,
      normalized_linkedin: identifiers.linkedin,
      location: identifiers.location,
      company: identifiers.company,
      merged_data: this.buildMergedData([{ profile, rawData }]),
      source_count: 1,
    };

    const record = await this.db.insert('unified_entities', entityData);

    this.logger.log(`Created new unified entity: ${record.id} (${canonicalName})`);

    return this.transformEntity(record);
  }

  /**
   * Link an enriched profile to a unified entity
   */
  async linkToEntity(
    enrichedProfileId: string,
    unifiedEntityId: string,
    matchType: MatchType,
    confidenceScore: number,
  ): Promise<EntitySourceLink> {
    // Create link record
    const linkRecord = await this.db.insert('entity_source_links', {
      unified_entity_id: unifiedEntityId,
      enriched_profile_id: enrichedProfileId,
      match_type: matchType,
      confidence_score: confidenceScore,
    });

    // Update enriched profile with entity reference
    await this.db.update('enriched_profiles', { id: enrichedProfileId }, {
      unified_entity_id: unifiedEntityId,
    });

    this.logger.debug(`Linked profile ${enrichedProfileId} to entity ${unifiedEntityId} (${matchType}, ${confidenceScore})`);

    return this.transformLink(linkRecord);
  }

  /**
   * Update merged data for an entity after a new profile is linked
   */
  async updateEntityMergedData(entityId: string): Promise<void> {
    // Get all linked profiles
    const links = await this.db.select('entity_source_links', {
      where: { unified_entity_id: entityId },
    });

    const profilesWithData = await Promise.all(
      links.map(async (link: any) => {
        const profile = await this.getEnrichedProfile(link.enriched_profile_id);
        const rawData = profile ? await this.getCrawledData(profile.crawledDataId) : null;
        return { profile, rawData: rawData?.rawData };
      }),
    );

    const mergedData = this.buildMergedData(profilesWithData.filter(p => p.profile));

    // Update best canonical name and identifiers
    const bestProfile = profilesWithData.find(p => p.rawData?.name) || profilesWithData[0];
    const identifiers = bestProfile?.profile
      ? extractIdentifiers(bestProfile.profile.structuredData, bestProfile.rawData || {})
      : {
          email: null,
          github: null,
          twitter: null,
          linkedin: null,
          website: null,
          name: null,
          location: null,
          company: null,
        };

    await this.db.update('unified_entities', { id: entityId }, {
      merged_data: mergedData,
      source_count: links.length,
      canonical_name: bestProfile?.rawData?.name || identifiers.name || 'Unknown',
      normalized_email: identifiers.email,
      normalized_github: identifiers.github,
      normalized_twitter: identifiers.twitter,
      normalized_linkedin: identifiers.linkedin,
      location: identifiers.location,
      company: identifiers.company,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Build merged data from multiple profiles
   */
  private buildMergedData(profiles: Array<{ profile: any; rawData: any }>): Record<string, any> {
    const merged: Record<string, any> = {
      sources: [],
      skills: new Set<string>(),
      specializations: new Set<string>(),
      roles: new Set<string>(),
      socialAccounts: {},
    };

    for (const { profile, rawData } of profiles) {
      if (!profile) continue;

      // Add source
      merged.sources.push({
        source: profile.source,
        type: profile.type,
        crawledDataId: profile.crawledDataId,
        enrichedAt: profile.enrichedAt,
      });

      // Merge structured data
      const structuredData = profile.structuredData || {};

      // Skills
      if (structuredData.topSkills) {
        structuredData.topSkills.forEach((s: string) => merged.skills.add(s));
      }

      // Specializations
      if (structuredData.specializations) {
        structuredData.specializations.forEach((s: string) => merged.specializations.add(s));
      }

      // Role
      if (structuredData.primaryRole) {
        merged.roles.add(structuredData.primaryRole);
      }

      // Social accounts
      if (structuredData.socialAccounts) {
        merged.socialAccounts = {
          ...merged.socialAccounts,
          ...Object.fromEntries(
            Object.entries(structuredData.socialAccounts).filter(([_, v]) => v),
          ),
        };
      }

      // Seniority (keep highest)
      const seniorityOrder = ['junior', 'mid', 'senior', 'lead', 'principal'];
      const currentSeniority = structuredData.seniorityLevel;
      if (currentSeniority) {
        const currentIndex = seniorityOrder.indexOf(currentSeniority);
        const existingIndex = seniorityOrder.indexOf(merged.seniorityLevel || 'junior');
        if (currentIndex > existingIndex) {
          merged.seniorityLevel = currentSeniority;
        }
      }

      // Summary (prefer longer/more detailed)
      if (structuredData.summary && (!merged.summary || structuredData.summary.length > merged.summary.length)) {
        merged.summary = structuredData.summary;
      }

      // Raw data enrichment
      if (rawData) {
        if (rawData.publicRepos && (!merged.publicRepos || rawData.publicRepos > merged.publicRepos)) {
          merged.publicRepos = rawData.publicRepos;
        }
        if (rawData.followers && (!merged.followers || rawData.followers > merged.followers)) {
          merged.followers = rawData.followers;
        }
        if (rawData.languages) {
          merged.languages = { ...merged.languages, ...rawData.languages };
        }
        // Avatar URL: prefer GitHub, then StackOverflow
        if (!merged.avatarUrl) {
          const avatar = rawData.avatarUrl || rawData.profileImage;
          if (avatar) {
            merged.avatarUrl = avatar;
          }
        }
      }
    }

    // Convert sets to arrays
    merged.skills = Array.from(merged.skills);
    merged.specializations = Array.from(merged.specializations);
    merged.roles = Array.from(merged.roles);

    return merged;
  }

  /**
   * Get a unified entity by ID with all linked profiles
   */
  async getUnifiedEntityById(id: string): Promise<UnifiedEntity | null> {
    const results = await this.db.select('unified_entities', {
      where: { id },
      limit: 1,
    });

    if (!results || results.length === 0) {
      return null;
    }

    return this.transformEntity(results[0]);
  }

  /**
   * Get unified entity with all linked profiles
   */
  async getUnifiedEntityWithSources(id: string): Promise<{
    entity: UnifiedEntity;
    sources: Array<{
      link: EntitySourceLink;
      profile: any;
      rawData: any;
    }>;
  } | null> {
    const entity = await this.getUnifiedEntityById(id);
    if (!entity) return null;

    const links = await this.db.select('entity_source_links', {
      where: { unified_entity_id: id },
      orderBy: 'confidence_score',
      order: 'desc',
    });

    const sources = await Promise.all(
      links.map(async (link: any) => {
        const profile = await this.getEnrichedProfile(link.enriched_profile_id);
        const rawData = profile ? await this.getCrawledData(profile.crawledDataId) : null;
        return {
          link: this.transformLink(link),
          profile,
          rawData: rawData?.rawData || {},
        };
      }),
    );

    return { entity, sources };
  }

  /**
   * Get existing link for an enriched profile
   */
  private async getExistingLink(enrichedProfileId: string): Promise<any | null> {
    const results = await this.db.select('entity_source_links', {
      where: { enriched_profile_id: enrichedProfileId },
      limit: 1,
    });

    return results && results.length > 0 ? results[0] : null;
  }

  /**
   * Get enriched profile by ID
   */
  private async getEnrichedProfile(id: string): Promise<any | null> {
    const results = await this.db.select('enriched_profiles', {
      where: { id },
      limit: 1,
    });

    if (!results || results.length === 0) {
      return null;
    }

    const record = results[0];
    return {
      id: record.id,
      crawledDataId: record.crawled_data_id,
      source: record.source,
      type: record.type,
      structuredData: record.structured_data,
      summary: record.summary,
      embeddingId: record.embedding_id,
      unifiedEntityId: record.unified_entity_id,
      enrichedAt: record.enriched_at,
    };
  }

  /**
   * Get crawled data by ID
   */
  private async getCrawledData(id: string): Promise<any | null> {
    const results = await this.db.select('crawled_data', {
      where: { id },
      limit: 1,
    });

    if (!results || results.length === 0) {
      return null;
    }

    return {
      id: results[0].id,
      source: results[0].source,
      type: results[0].type,
      rawData: results[0].raw_data,
    };
  }

  /**
   * List all unified entities with pagination
   */
  async listUnifiedEntities(options: {
    entityType?: EntityType;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: UnifiedEntity[]; total: number }> {
    const where: Record<string, any> = {};
    if (options.entityType) {
      where.entity_type = options.entityType;
    }

    const allRecords = await this.db.select('unified_entities', {
      where,
      orderBy: 'source_count',
      order: 'desc',
    });

    const total = allRecords.length;
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const paginatedRecords = allRecords.slice(offset, offset + limit);

    return {
      data: paginatedRecords.map(this.transformEntity),
      total,
    };
  }

  /**
   * Get entity resolution statistics
   */
  async getResolutionStats(): Promise<{
    totalEntities: number;
    totalLinks: number;
    entitiesByType: Record<string, number>;
    linksByMatchType: Record<string, number>;
    averageSourcesPerEntity: number;
    entitiesWithMultipleSources: number;
    entitiesWithEmail: number;
  }> {
    const entities = await this.db.select('unified_entities', {});
    const links = await this.db.select('entity_source_links', {});

    const entitiesByType: Record<string, number> = {};
    const linksByMatchType: Record<string, number> = {};
    let totalSources = 0;
    let multiSourceCount = 0;
    let withEmailCount = 0;

    for (const entity of entities) {
      const type = entity.entity_type || 'unknown';
      entitiesByType[type] = (entitiesByType[type] || 0) + 1;
      totalSources += entity.source_count || 1;
      if (entity.source_count > 1) {
        multiSourceCount++;
      }
      if (entity.normalized_email) {
        withEmailCount++;
      }
    }

    for (const link of links) {
      const matchType = link.match_type || 'unknown';
      linksByMatchType[matchType] = (linksByMatchType[matchType] || 0) + 1;
    }

    return {
      totalEntities: entities.length,
      totalLinks: links.length,
      entitiesByType,
      linksByMatchType,
      averageSourcesPerEntity: entities.length > 0 ? totalSources / entities.length : 0,
      entitiesWithMultipleSources: multiSourceCount,
      entitiesWithEmail: withEmailCount,
    };
  }

  /**
   * Batch resolve all unlinked enriched profiles
   */
  async batchResolve(options: { limit?: number; onProgress?: (p: { percent: number; processed: number; total: number }) => void } = {}): Promise<{
    processed: number;
    newEntities: number;
    linkedToExisting: number;
    errors: number;
  }> {
    const limit = options.limit || 100;

    // Get unlinked profiles and companies (skip job_posts)
    const allProfiles = await this.db.select('enriched_profiles', {
      orderBy: 'created_at',
      order: 'asc',
    });
    // Filter to only profile and company types
    const resolvableProfiles = allProfiles.filter((p: any) => p.type === 'profile' || p.type === 'company');

    const unlinkedProfiles = resolvableProfiles.filter((p: any) => !p.unified_entity_id);
    const toProcess = unlinkedProfiles.slice(0, limit);
    const total = toProcess.length;

    let processed = 0;
    let newEntities = 0;
    let linkedToExisting = 0;
    let errors = 0;

    for (const profile of toProcess) {
      try {
        const result = await this.resolveEntity(profile.id);
        if (result) {
          processed++;
          if (result.isNew) {
            newEntities++;
          } else {
            linkedToExisting++;
          }
        }
      } catch (error) {
        errors++;
        this.logger.error(`Error resolving profile ${profile.id}: ${error.message}`);
      }
      if (options.onProgress) {
        const done = processed + errors;
        options.onProgress({ percent: total > 0 ? Math.round((done / total) * 100) : 100, processed: done, total });
      }
    }

    this.logger.log(`Batch resolution complete: ${processed} processed, ${newEntities} new, ${linkedToExisting} linked, ${errors} errors`);

    return { processed, newEntities, linkedToExisting, errors };
  }

  /**
   * Resolve a company entity from a job post's extracted company data.
   * Finds or creates a company entity and links the job post to it.
   */
  async resolveCompanyFromJobPost(
    jobEnrichedProfileId: string,
    companyData: {
      name: string;
      website?: string;
      contactEmail?: string;
      location?: string;
      industry?: string;
      size?: string;
    },
    jobStructuredData?: any,
  ): Promise<EntityResolutionResult | null> {
    const companyName = normalizeCompany(companyData.name);
    if (!companyName) {
      this.logger.debug('No company name to resolve');
      return null;
    }

    const website = normalizeWebsite(companyData.website || null);

    try {
      // 1. Try exact website match (100% confidence)
      if (website) {
        const websiteMatch = await this.findCompanyByWebsite(website);
        if (websiteMatch) {
          await this.linkToEntity(jobEnrichedProfileId, websiteMatch.id, 'website', 1.0);
          await this.updateCompanyMergedData(websiteMatch.id, companyData, jobStructuredData);
          const entity = await this.getUnifiedEntityById(websiteMatch.id);
          return {
            unifiedEntity: entity!,
            isNew: false,
            matchType: 'website',
            confidenceScore: 1.0,
          };
        }
      }

      // 2. Try fuzzy company name match (75-85% confidence)
      const candidates = await this.findCandidatesByName(companyName, 'company');
      for (const candidate of candidates) {
        const similarity = jaroWinkler(companyName.toLowerCase(), candidate.canonical_name.toLowerCase());
        if (similarity >= 0.85) {
          const confidence = Math.min(0.85, 0.75 + similarity * 0.1);
          this.logger.debug(`Found company name match: ${companyName} -> ${candidate.canonical_name} (similarity: ${similarity.toFixed(3)})`);
          await this.linkToEntity(jobEnrichedProfileId, candidate.id, 'company_name', confidence);
          await this.updateCompanyMergedData(candidate.id, companyData, jobStructuredData);
          const entity = await this.getUnifiedEntityById(candidate.id);
          return {
            unifiedEntity: entity!,
            isNew: false,
            matchType: 'company_name',
            confidenceScore: confidence,
          };
        }
      }

      // 3. No match — create new company entity
      const entityData = {
        entity_type: 'company' as EntityType,
        canonical_name: companyData.name,
        normalized_email: normalizeEmail(companyData.contactEmail || null),
        normalized_github: null,
        normalized_twitter: null,
        normalized_linkedin: null,
        location: companyData.location || null,
        company: null,
        merged_data: this.buildCompanyMergedData(companyData, jobStructuredData),
        source_count: 1,
      };

      const record = await this.db.insert('unified_entities', entityData);
      this.logger.log(`Created new company entity: ${record.id} (${companyData.name})`);

      await this.linkToEntity(jobEnrichedProfileId, record.id, 'company_name', 1.0);

      const newEntity = this.transformEntity(record);
      return {
        unifiedEntity: newEntity,
        isNew: true,
        matchType: 'company_name',
        confidenceScore: 1.0,
      };
    } catch (error) {
      this.logger.error(`Error resolving company from job post: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Update merged data for a company entity with new job post data
   */
  private async updateCompanyMergedData(
    entityId: string,
    companyData: { name: string; website?: string; contactEmail?: string; location?: string; industry?: string; size?: string },
    jobStructuredData?: any,
  ): Promise<void> {
    const entity = await this.getUnifiedEntityById(entityId);
    if (!entity) return;

    const existing = entity.mergedData || {};

    // Aggregate technologies from all linked job posts
    const technologies = new Set<string>(existing.technologies || []);
    if (jobStructuredData?.technologies) {
      jobStructuredData.technologies.forEach((t: string) => technologies.add(t));
    }

    // Aggregate locations
    const locations = new Set<string>(existing.locations || []);
    if (companyData.location) locations.add(companyData.location);

    // Count job posts linked
    const links = await this.db.select('entity_source_links', {
      where: { unified_entity_id: entityId },
    });
    const hiringVolume = links.length;

    const mergedData = {
      ...existing,
      technologies: Array.from(technologies),
      locations: Array.from(locations),
      hiringVolume,
      hiringActive: true,
      lastJobPostedAt: new Date().toISOString(),
      website: companyData.website || existing.website,
      industry: companyData.industry || existing.industry,
      size: companyData.size || existing.size,
      contactEmail: companyData.contactEmail || existing.contactEmail,
      logoUrl: (companyData as any).logoUrl || existing.logoUrl || null,
    };

    const updateData: Record<string, any> = {
      merged_data: mergedData,
      source_count: hiringVolume,
      updated_at: new Date().toISOString(),
    };

    // Update location if not already set
    if (companyData.location && !entity.location) {
      updateData.location = companyData.location;
    }

    await this.db.update('unified_entities', { id: entityId }, updateData);
  }

  /**
   * Build initial merged data for a company entity created from a job post
   */
  private buildCompanyMergedData(
    companyData: { name: string; website?: string; contactEmail?: string; location?: string; industry?: string; size?: string },
    jobStructuredData?: any,
  ): Record<string, any> {
    const technologies = jobStructuredData?.technologies || [];
    const locations = companyData.location ? [companyData.location] : [];

    return {
      sources: [],
      technologies,
      locations,
      hiringVolume: 1,
      hiringActive: true,
      lastJobPostedAt: new Date().toISOString(),
      website: companyData.website || null,
      industry: companyData.industry || null,
      size: companyData.size || null,
      contactEmail: companyData.contactEmail || null,
      logoUrl: (companyData as any).logoUrl || null,
    };
  }

  /**
   * Backfill company entities from existing enriched job posts
   */
  async backfillCompanies(options: { limit?: number; source?: string; force?: boolean; onProgress?: (p: { percent: number; processed: number; total: number }) => void } = {}): Promise<{
    processed: number;
    newCompanies: number;
    linkedToExisting: number;
    skipped: number;
    errors: number;
    totalMatchingJobs: number;
    alreadyLinked: number;
  }> {
    const limit = options.limit || 100;
    const force = options.force || false;

    // Get all enriched profiles
    const allJobPosts = await this.db.select('enriched_profiles', {
      orderBy: 'created_at',
      order: 'asc',
    });

    // Filter to job posts, optionally by source
    let matchingJobs = allJobPosts.filter((p: any) => p.type === 'job_post');
    if (options.source) {
      matchingJobs = matchingJobs.filter((p: any) => p.source === options.source);
    }

    const totalMatchingJobs = matchingJobs.length;
    const alreadyLinked = matchingJobs.filter((p: any) => !!p.unified_entity_id).length;

    // Filter to unlinked jobs only (unless force mode)
    let jobsToConsider = force
      ? matchingJobs
      : matchingJobs.filter((p: any) => !p.unified_entity_id);

    this.logger.log(
      `Backfill: ${totalMatchingJobs} matching jobs, ${alreadyLinked} already linked, ` +
      `${jobsToConsider.length} to consider (force=${force})`,
    );

    const toProcess = jobsToConsider.slice(0, limit);
    const total = toProcess.length;

    let processed = 0;
    let newCompanies = 0;
    let linkedToExisting = 0;
    let skipped = 0;
    let errors = 0;

    for (const jobPost of toProcess) {
      try {
        // Get raw data for company extraction
        const crawledData = await this.getCrawledData(jobPost.crawled_data_id);
        if (!crawledData) {
          skipped++;
          if (options.onProgress) {
            const done = processed + skipped + errors;
            options.onProgress({ percent: total > 0 ? Math.round((done / total) * 100) : 100, processed: done, total });
          }
          continue;
        }

        const rawData = crawledData.rawData || {};

        // Extract company name from raw data (deterministic, no AI)
        let companyName: string | null = null;
        let companyWebsite: string | null = null;

        // Try rawData.company first (most common)
        if (rawData.company) {
          companyName = rawData.company;
        } else if (rawData.textParsed?.company) {
          // HN format
          companyName = rawData.textParsed.company;
        }

        // Try to get website
        if (rawData.url) {
          companyWebsite = rawData.url;
        }

        // Also check AI-extracted companyInfo if available
        const structuredData = jobPost.structured_data || {};
        if (structuredData.companyInfo?.name) {
          companyName = companyName || structuredData.companyInfo.name;
          companyWebsite = companyWebsite || structuredData.companyInfo.website;
        }

        if (!companyName) {
          skipped++;
          if (options.onProgress) {
            const done = processed + skipped + errors;
            options.onProgress({ percent: total > 0 ? Math.round((done / total) * 100) : 100, processed: done, total });
          }
          continue;
        }

        const result = await this.resolveCompanyFromJobPost(
          jobPost.id,
          {
            name: companyName,
            website: companyWebsite || undefined,
            location: rawData.location || structuredData.companyInfo?.location,
            industry: structuredData.companyInfo?.industry,
            size: structuredData.companyInfo?.size,
            contactEmail: structuredData.companyInfo?.contactEmail,
          },
          structuredData,
        );

        if (result) {
          processed++;
          if (result.isNew) {
            newCompanies++;
          } else {
            linkedToExisting++;
          }
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        this.logger.error(`Error backfilling company from job ${jobPost.id}: ${error.message}`);
      }
      if (options.onProgress) {
        const done = processed + skipped + errors;
        options.onProgress({ percent: total > 0 ? Math.round((done / total) * 100) : 100, processed: done, total });
      }
    }

    this.logger.log(`Company backfill complete: ${processed} processed, ${newCompanies} new, ${linkedToExisting} linked, ${skipped} skipped, ${errors} errors (${totalMatchingJobs} total matching, ${alreadyLinked} already linked)`);

    return { processed, newCompanies, linkedToExisting, skipped, errors, totalMatchingJobs, alreadyLinked };
  }

  // Transform database record to API format
  private transformEntity(record: any): UnifiedEntity {
    return {
      id: record.id,
      entityType: record.entity_type,
      canonicalName: record.canonical_name,
      normalizedEmail: record.normalized_email,
      normalizedGithub: record.normalized_github,
      normalizedTwitter: record.normalized_twitter,
      normalizedLinkedin: record.normalized_linkedin,
      normalizedWebsite: normalizeWebsite(record.merged_data?.website || null),
      location: record.location,
      company: record.company,
      mergedData: record.merged_data || {},
      sourceCount: record.source_count || 1,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  private transformLink(record: any): EntitySourceLink {
    return {
      id: record.id,
      unifiedEntityId: record.unified_entity_id,
      enrichedProfileId: record.enriched_profile_id,
      matchType: record.match_type,
      confidenceScore: parseFloat(record.confidence_score) || 0,
      linkedAt: record.linked_at,
    };
  }
}
