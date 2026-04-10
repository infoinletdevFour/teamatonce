import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SearchQueryDto, SearchResponseDto, SearchResultDto, SearchFacetDto, SearchSuggestionDto, GlobalSearchResponseDto } from './dto';

interface SearchFilters {
  author?: string;
  date_from?: string;
  date_to?: string;
  project_id?: string;
  status?: string;
}

@Injectable()
export class SearchService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Universal search across all content types using database hybrid search
   * Hybrid search combines keyword (pg_trgm) and semantic (pgvector) search
   */
  async search(userId: string, searchQuery: SearchQueryDto): Promise<SearchResponseDto> {
    try {
      const startTime = Date.now();

      // Validate query
      if (!searchQuery.query || searchQuery.query.trim().length === 0) {
        return {
          results: [],
          total: 0,
          page: searchQuery.page || 1,
          limit: searchQuery.limit || 20,
          totalPages: 0,
          query: '',
          executionTime: 0,
          facets: [],
          suggestions: [],
        };
      }

      const page = searchQuery.page || 1;
      const limit = searchQuery.limit || 20;
      const offset = (page - 1) * limit;

      // Determine which content types to search
      const types = searchQuery.types || ['projects', 'milestones', 'tasks', 'discussions', 'files'];

      // Search in different content types in parallel
      const searchPromises = types.map(type =>
        this.searchInContentType(type, userId, searchQuery.query, {
          status: searchQuery.category, // Using category for status filter
          date_from: searchQuery.dateFrom,
          date_to: searchQuery.dateTo,
          project_id: searchQuery.projectId,
        })
      );

      const searchResults = await Promise.all(searchPromises);

      // Combine and flatten results
      const results: SearchResultDto[] = [];
      searchResults.forEach((typeResults, index) => {
        const contentType = types[index];
        typeResults.forEach((item: any) => {
          results.push({
            id: item.id,
            type: contentType as any,
            title: item.name || item.title || 'Untitled',
            description: item.description || '',
            url: this.generateUrl(contentType, item),
            imageUrl: item.image_url || undefined,
            relevanceScore: item.relevance_score || this.calculateRelevanceScore(item, searchQuery.query, contentType),
            tags: item.tags || [],
            category: item.status || item.category || undefined,
            author: item.created_by ? {
              id: item.created_by,
              name: item.creator_name || 'Unknown',
            } : undefined,
            metadata: {
              createdAt: item.created_at,
              updatedAt: item.updated_at,
              status: item.status,
            },
            highlights: this.generateHighlights(item, searchQuery.query),
          });
        });
      });

      // Filter results with zero relevance
      const filteredResults = results.filter(r => r.relevanceScore > 0);

      // Sort by relevance (highest first)
      filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Apply sorting preference
      if (searchQuery.sortBy === 'date') {
        filteredResults.sort((a, b) =>
          new Date(b.metadata?.createdAt || '').getTime() - new Date(a.metadata?.createdAt || '').getTime()
        );
      } else if (searchQuery.sortBy === 'popularity') {
        // Keep relevance sort for popularity since we don't have view counts
      }

      // Apply pagination
      const paginatedResults = filteredResults.slice(offset, offset + limit);
      const total = filteredResults.length;
      const totalPages = Math.ceil(total / limit);

      const executionTime = Date.now() - startTime;

      // Generate facets
      const facets = this.generateFacets(filteredResults, searchQuery);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(searchQuery.query);

      return {
        results: paginatedResults,
        total,
        page,
        limit,
        totalPages,
        query: searchQuery.query,
        executionTime,
        facets,
        suggestions,
      };
    } catch (error) {
      console.error('Search error:', error);
      throw new BadRequestException('Search failed: ' + error.message);
    }
  }

  /**
   * Search in specific content type using database hybrid search (default mode)
   */
  private async searchInContentType(
    type: string,
    userId: string,
    query: string,
    filters: SearchFilters
  ): Promise<any[]> {
    const searchTerm = query.toLowerCase();

    switch (type) {
      case 'projects':
        return this.searchProjects(userId, searchTerm, filters);
      case 'milestones':
        return this.searchMilestones(userId, searchTerm, filters);
      case 'tasks':
        return this.searchTasks(userId, searchTerm, filters);
      case 'discussions':
        return this.searchDiscussions(userId, searchTerm, filters);
      case 'files':
        return this.searchFiles(userId, searchTerm, filters);
      default:
        return [];
    }
  }

  /**
   * Search projects - user must be client or team member
   */
  private async searchProjects(userId: string, query: string, filters: SearchFilters): Promise<any[]> {
    try {
      // Try hybrid search first (recommended)
      try {
        const hybridResult = await this.db.hybridSearch('projects', query, {
          columns: ['name', 'description', 'primary_objective'],
          limit: 50,
          filters: {
            ...(filters.status && { status: filters.status }),
            ...(filters.date_from && { created_at_gte: filters.date_from }),
            ...(filters.date_to && { created_at_lte: filters.date_to }),
          },
        });

        if (hybridResult?.results?.length > 0) {
          // Filter by user access - user must be client or team member
          return hybridResult.results
            .filter((r: any) => {
              const project = r.data;
              const isClient = project.client_id === userId;
              const isTeamMember = project.assigned_team?.some((m: any) => m.user_id === userId || m.id === userId);
              const isTeamLead = project.team_lead_id === userId;
              return isClient || isTeamMember || isTeamLead;
            })
            .map((r: any) => ({
              ...r.data,
              relevance_score: r.score * 100,
            }));
        }
      } catch (hybridError) {
        console.log('Hybrid search not available, falling back to ILIKE search');
      }

      // Fallback to ILIKE search
      const searchPattern = `%${query}%`;

      // Search in name
      const nameResults = await this.db.table('projects')
        .select('*')
        .where('deleted_at', 'IS', null)
        .where('name', 'ILIKE', searchPattern)
        .execute();

      // Search in description
      const descResults = await this.db.table('projects')
        .select('*')
        .where('deleted_at', 'IS', null)
        .where('description', 'ILIKE', searchPattern)
        .execute();

      // Combine and deduplicate
      const nameData = nameResults?.data || (Array.isArray(nameResults) ? nameResults : []);
      const descData = descResults?.data || (Array.isArray(descResults) ? descResults : []);

      const resultsMap = new Map();
      [...nameData, ...descData].forEach(item => {
        if (!resultsMap.has(item.id)) {
          resultsMap.set(item.id, item);
        }
      });

      // Filter by user access
      return Array.from(resultsMap.values()).filter(project => {
        const isClient = project.client_id === userId;
        const isTeamMember = project.assigned_team?.some((m: any) => m.user_id === userId || m.id === userId);
        const isTeamLead = project.team_lead_id === userId;
        return isClient || isTeamMember || isTeamLead;
      });
    } catch (error) {
      console.error('Error searching projects:', error);
      return [];
    }
  }

  /**
   * Search milestones - user must have access to parent project
   */
  private async searchMilestones(userId: string, query: string, filters: SearchFilters): Promise<any[]> {
    try {
      // First get user's accessible project IDs
      const projectIds = await this.getUserProjectIds(userId);
      if (projectIds.length === 0) return [];

      // Try hybrid search first
      try {
        const hybridResult = await this.db.hybridSearch('milestones', query, {
          columns: ['name', 'description'],
          limit: 50,
          filters: {
            project_id_in: projectIds,
            ...(filters.status && { status: filters.status }),
            ...(filters.project_id && { project_id: filters.project_id }),
          },
        });

        if (hybridResult?.results?.length > 0) {
          return hybridResult.results.map((r: any) => ({
            ...r.data,
            relevance_score: r.score * 100,
          }));
        }
      } catch (hybridError) {
        console.log('Hybrid search not available for milestones');
      }

      // Fallback to ILIKE search
      const searchPattern = `%${query}%`;

      const nameResults = await this.db.table('milestones')
        .select('*')
        .whereIn('project_id', projectIds)
        .where('name', 'ILIKE', searchPattern)
        .execute();

      const descResults = await this.db.table('milestones')
        .select('*')
        .whereIn('project_id', projectIds)
        .where('description', 'ILIKE', searchPattern)
        .execute();

      const nameData = nameResults?.data || (Array.isArray(nameResults) ? nameResults : []);
      const descData = descResults?.data || (Array.isArray(descResults) ? descResults : []);

      const resultsMap = new Map();
      [...nameData, ...descData].forEach(item => {
        if (!resultsMap.has(item.id)) {
          resultsMap.set(item.id, item);
        }
      });

      return Array.from(resultsMap.values());
    } catch (error) {
      console.error('Error searching milestones:', error);
      return [];
    }
  }

  /**
   * Search tasks - user must have access to parent project
   */
  private async searchTasks(userId: string, query: string, filters: SearchFilters): Promise<any[]> {
    try {
      const projectIds = await this.getUserProjectIds(userId);
      if (projectIds.length === 0) return [];

      // Try hybrid search first
      try {
        const hybridResult = await this.db.hybridSearch('tasks', query, {
          columns: ['title', 'description'],
          limit: 50,
          filters: {
            project_id_in: projectIds,
            ...(filters.status && { status: filters.status }),
            ...(filters.project_id && { project_id: filters.project_id }),
          },
        });

        if (hybridResult?.results?.length > 0) {
          return hybridResult.results.map((r: any) => ({
            ...r.data,
            name: r.data.title, // Normalize to 'name' for consistency
            relevance_score: r.score * 100,
          }));
        }
      } catch (hybridError) {
        console.log('Hybrid search not available for tasks');
      }

      // Fallback to ILIKE search
      const searchPattern = `%${query}%`;

      const titleResults = await this.db.table('tasks')
        .select('*')
        .whereIn('project_id', projectIds)
        .where('title', 'ILIKE', searchPattern)
        .execute();

      const descResults = await this.db.table('tasks')
        .select('*')
        .whereIn('project_id', projectIds)
        .where('description', 'ILIKE', searchPattern)
        .execute();

      const titleData = titleResults?.data || (Array.isArray(titleResults) ? titleResults : []);
      const descData = descResults?.data || (Array.isArray(descResults) ? descResults : []);

      const resultsMap = new Map();
      [...titleData, ...descData].forEach(item => {
        if (!resultsMap.has(item.id)) {
          resultsMap.set(item.id, { ...item, name: item.title });
        }
      });

      return Array.from(resultsMap.values());
    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }

  /**
   * Search discussions/messages - user must be participant
   */
  private async searchDiscussions(userId: string, query: string, filters: SearchFilters): Promise<any[]> {
    try {
      // Get conversations where user is a participant
      const conversationsResult = await this.db.table('conversations')
        .select('id')
        .where('participants', '@>', JSON.stringify([userId]))
        .execute();

      const conversationsData = conversationsResult?.data || (Array.isArray(conversationsResult) ? conversationsResult : []);
      const conversationIds = conversationsData.map((c: any) => c.id);

      if (conversationIds.length === 0) return [];

      // Fallback to ILIKE search for messages
      const searchPattern = `%${query}%`;

      const contentResults = await this.db.table('messages')
        .select('*')
        .whereIn('conversation_id', conversationIds)
        .where('content', 'ILIKE', searchPattern)
        .execute();

      const contentData = contentResults?.data || (Array.isArray(contentResults) ? contentResults : []);

      return contentData.map((msg: any) => ({
        ...msg,
        name: msg.content?.substring(0, 50) + '...' || 'Message',
        title: msg.content?.substring(0, 50) + '...' || 'Message',
      }));
    } catch (error) {
      console.error('Error searching discussions:', error);
      return [];
    }
  }

  /**
   * Search files - user must have access to parent project
   */
  private async searchFiles(userId: string, query: string, filters: SearchFilters): Promise<any[]> {
    try {
      const projectIds = await this.getUserProjectIds(userId);
      if (projectIds.length === 0) return [];

      // Fallback to ILIKE search
      const searchPattern = `%${query}%`;

      const nameResults = await this.db.table('project_files')
        .select('*')
        .whereIn('project_id', projectIds)
        .where('file_name', 'ILIKE', searchPattern)
        .execute();

      const descResults = await this.db.table('project_files')
        .select('*')
        .whereIn('project_id', projectIds)
        .where('description', 'ILIKE', searchPattern)
        .execute();

      const nameData = nameResults?.data || (Array.isArray(nameResults) ? nameResults : []);
      const descData = descResults?.data || (Array.isArray(descResults) ? descResults : []);

      const resultsMap = new Map();
      [...nameData, ...descData].forEach(item => {
        if (!resultsMap.has(item.id)) {
          resultsMap.set(item.id, { ...item, name: item.file_name, title: item.file_name });
        }
      });

      return Array.from(resultsMap.values());
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }

  /**
   * Get project IDs user has access to (as client, team member, or team lead)
   */
  private async getUserProjectIds(userId: string): Promise<string[]> {
    try {
      // Get projects where user is client
      const clientProjects = await this.db.table('projects')
        .select('id')
        .where('client_id', '=', userId)
        .where('deleted_at', 'IS', null)
        .execute();

      const clientData = clientProjects?.data || (Array.isArray(clientProjects) ? clientProjects : []);
      const clientProjectIds = clientData.map((p: any) => p.id);

      // Get projects where user is team lead
      const leadProjects = await this.db.table('projects')
        .select('id')
        .where('team_lead_id', '=', userId)
        .where('deleted_at', 'IS', null)
        .execute();

      const leadData = leadProjects?.data || (Array.isArray(leadProjects) ? leadProjects : []);
      const leadProjectIds = leadData.map((p: any) => p.id);

      // Get all projects and filter by team membership
      const allProjects = await this.db.table('projects')
        .select('id', 'assigned_team')
        .where('deleted_at', 'IS', null)
        .execute();

      const allData = allProjects?.data || (Array.isArray(allProjects) ? allProjects : []);
      const teamProjectIds = allData
        .filter((p: any) => {
          const team = p.assigned_team || [];
          return team.some((m: any) => m.user_id === userId || m.id === userId);
        })
        .map((p: any) => p.id);

      // Combine all project IDs
      return [...new Set([...clientProjectIds, ...leadProjectIds, ...teamProjectIds])];
    } catch (error) {
      console.error('Error getting user project IDs:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score based on text matches
   */
  private calculateRelevanceScore(item: any, query: string, contentType: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;
    let hasTextMatch = false;

    // Exact title/name match gets highest score
    const title = item.title || item.name || '';
    if (title.toLowerCase() === queryLower) {
      score += 200;
      hasTextMatch = true;
    } else if (title.toLowerCase().startsWith(queryLower)) {
      score += 150;
      hasTextMatch = true;
    } else if (title.toLowerCase().includes(queryLower)) {
      score += 100;
      hasTextMatch = true;
    }

    // Description match gets medium score
    if (item.description && item.description.toLowerCase().includes(queryLower)) {
      score += 50;
      hasTextMatch = true;
    }

    // Content match (for messages)
    if (item.content && item.content.toLowerCase().includes(queryLower)) {
      score += 50;
      hasTextMatch = true;
    }

    if (!hasTextMatch) {
      return 0;
    }

    // Boost recent content
    const timestamp = item.updated_at || item.created_at;
    if (timestamp) {
      const daysSinceUpdate = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) score += 30;
      else if (daysSinceUpdate < 30) score += 15;
      else if (daysSinceUpdate < 90) score += 5;
    }

    // Content type priority
    const typePriority: Record<string, number> = {
      'projects': 15,
      'milestones': 12,
      'tasks': 10,
      'files': 8,
      'discussions': 6,
    };
    score += typePriority[contentType] || 0;

    return score;
  }

  /**
   * Generate URL for search result
   */
  private generateUrl(contentType: string, item: any): string {
    switch (contentType) {
      case 'projects':
        return `/projects/${item.id}`;
      case 'milestones':
        return `/projects/${item.project_id}/milestones/${item.id}`;
      case 'tasks':
        return `/projects/${item.project_id}/tasks/${item.id}`;
      case 'discussions':
        return `/messages/${item.conversation_id || item.id}`;
      case 'files':
        return `/projects/${item.project_id}/files/${item.id}`;
      default:
        return `/${contentType}/${item.id}`;
    }
  }

  /**
   * Generate highlighted text snippets
   */
  private generateHighlights(item: any, query: string): string[] {
    const highlights: string[] = [];
    const queryLower = query.toLowerCase();

    const addHighlight = (text: string | undefined, fieldName: string) => {
      if (!text) return;
      const textLower = text.toLowerCase();
      const index = textLower.indexOf(queryLower);
      if (index !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(text.length, index + query.length + 30);
        let snippet = text.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';
        // Wrap match in <em> tags
        const regex = new RegExp(`(${query})`, 'gi');
        snippet = snippet.replace(regex, '<em>$1</em>');
        highlights.push(snippet);
      }
    };

    addHighlight(item.name, 'name');
    addHighlight(item.title, 'title');
    addHighlight(item.description, 'description');
    addHighlight(item.content, 'content');

    return highlights.slice(0, 3);
  }

  /**
   * Generate search facets for filtering
   */
  private generateFacets(results: SearchResultDto[], query: SearchQueryDto): SearchFacetDto[] {
    const facets: SearchFacetDto[] = [];

    // Type facet
    const typeCounts: Record<string, number> = {};
    results.forEach(result => {
      typeCounts[result.type] = (typeCounts[result.type] || 0) + 1;
    });

    if (Object.keys(typeCounts).length > 1) {
      facets.push({
        name: 'type',
        values: Object.entries(typeCounts).map(([type, count]) => ({
          value: type,
          count,
          selected: query.types?.includes(type) || false,
        })),
      });
    }

    // Category/Status facet
    const statusCounts: Record<string, number> = {};
    results.forEach(result => {
      if (result.category) {
        statusCounts[result.category] = (statusCounts[result.category] || 0) + 1;
      }
    });

    if (Object.keys(statusCounts).length > 1) {
      facets.push({
        name: 'status',
        values: Object.entries(statusCounts).map(([status, count]) => ({
          value: status,
          count,
          selected: query.category === status,
        })),
      });
    }

    return facets;
  }

  /**
   * Generate search suggestions
   */
  async getSuggestions(query: string): Promise<SearchSuggestionDto[]> {
    try {
      if (!query || query.length < 2) return [];

      // Generate suggestions based on common patterns
      const suggestions: SearchSuggestionDto[] = [
        { query: `${query} project`, resultCount: 0, type: 'completion' },
        { query: `${query} milestone`, resultCount: 0, type: 'completion' },
        { query: `${query} task`, resultCount: 0, type: 'completion' },
      ];

      return suggestions.filter(s => s.query !== query);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Generate suggestions from query
   */
  private async generateSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    return [
      `${query} project`,
      `${query} milestone`,
      `${query} completed`,
    ].slice(0, 3);
  }

  /**
   * Get popular search queries
   */
  async getPopularQueries(): Promise<string[]> {
    return [
      'project status',
      'milestone deadline',
      'pending tasks',
      'completed milestones',
      'active projects',
    ];
  }

  /**
   * Global search across all categories
   */
  async searchGlobal(userId: string, query: string): Promise<GlobalSearchResponseDto> {
    try {
      const results = await this.search(userId, {
        query,
        scope: 'all' as any,
        limit: 20,
      });

      return {
        projects: results.results.filter(r => r.type === 'projects').slice(0, 5),
        milestones: results.results.filter(r => r.type === 'milestones').slice(0, 5),
        tasks: results.results.filter(r => r.type === 'tasks').slice(0, 5),
        files: results.results.filter(r => r.type === 'files').slice(0, 5),
      };
    } catch (error) {
      console.error('Global search error:', error);
      throw new BadRequestException('Global search failed: ' + error.message);
    }
  }
}
