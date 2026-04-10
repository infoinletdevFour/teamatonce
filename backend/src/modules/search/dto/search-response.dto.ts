import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchResultDto {
  @ApiProperty({ description: 'Result ID', example: 'project_123' })
  id: string;

  @ApiProperty({
    description: 'Result type',
    example: 'projects',
    enum: ['projects', 'milestones', 'tasks', 'discussions', 'files']
  })
  type: 'projects' | 'milestones' | 'tasks' | 'discussions' | 'files';

  @ApiProperty({ description: 'Title or name', example: 'Mobile App Development Project' })
  title: string;

  @ApiPropertyOptional({ description: 'Description or excerpt', example: 'Building a cross-platform mobile application...' })
  description?: string;

  @ApiPropertyOptional({ description: 'URL path to the resource', example: '/projects/project_123' })
  url?: string;

  @ApiPropertyOptional({ description: 'Thumbnail or image URL' })
  imageUrl?: string;

  @ApiProperty({ description: 'Relevance score', example: 0.85 })
  relevanceScore: number;

  @ApiPropertyOptional({ description: 'Tags associated with result', isArray: true, type: String })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Category or status', example: 'in_progress' })
  category?: string;

  @ApiPropertyOptional({ description: 'Author or creator info' })
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    status?: string;
    projectId?: string;
    milestoneId?: string;
  };

  @ApiPropertyOptional({ description: 'Highlighted text snippets', isArray: true, type: String })
  highlights?: string[];
}

export class SearchFacetDto {
  @ApiProperty({ description: 'Facet name', example: 'type' })
  name: string;

  @ApiProperty({ description: 'Facet values with counts', example: [{ value: 'projects', count: 15 }] })
  values: Array<{
    value: string;
    count: number;
    selected?: boolean;
  }>;
}

export class SearchResponseDto {
  @ApiProperty({ description: 'Search results', isArray: true, type: SearchResultDto })
  results: SearchResultDto[];

  @ApiProperty({ description: 'Total number of results', example: 150 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 8 })
  totalPages: number;

  @ApiProperty({ description: 'Search query that was executed', example: 'mobile app' })
  query: string;

  @ApiProperty({ description: 'Search execution time in milliseconds', example: 45 })
  executionTime: number;

  @ApiPropertyOptional({ description: 'Search suggestions', isArray: true, type: String })
  suggestions?: string[];

  @ApiPropertyOptional({ description: 'Search facets for filtering', isArray: true, type: SearchFacetDto })
  facets?: SearchFacetDto[];
}

export class SearchSuggestionDto {
  @ApiProperty({ description: 'Suggested query', example: 'mobile app development' })
  query: string;

  @ApiProperty({ description: 'Number of results', example: 25 })
  resultCount: number;

  @ApiProperty({ description: 'Suggestion type', example: 'completion' })
  type: 'completion' | 'correction' | 'popular';
}

export class GlobalSearchResponseDto {
  @ApiProperty({ description: 'Projects matching the search', isArray: true, type: SearchResultDto })
  projects: SearchResultDto[];

  @ApiProperty({ description: 'Milestones matching the search', isArray: true, type: SearchResultDto })
  milestones: SearchResultDto[];

  @ApiProperty({ description: 'Tasks matching the search', isArray: true, type: SearchResultDto })
  tasks: SearchResultDto[];

  @ApiProperty({ description: 'Files matching the search', isArray: true, type: SearchResultDto })
  files: SearchResultDto[];
}
