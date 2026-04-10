import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchResponseDto, SearchSuggestionDto, GlobalSearchResponseDto } from './dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // =============================================
  // PUBLIC SEARCH ENDPOINTS
  // =============================================

  @Get()
  @ApiOperation({ summary: 'Search across all content types' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully', type: SearchResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid search query' })
  async search(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) searchQuery: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    return this.searchService.search('guest', searchQuery);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions for autocomplete' })
  @ApiQuery({ name: 'q', description: 'Partial search query', example: 'mobile app' })
  @ApiResponse({ status: 200, description: 'Search suggestions retrieved successfully', type: [SearchSuggestionDto] })
  async getSuggestions(@Query('q') query: string): Promise<SearchSuggestionDto[]> {
    return this.searchService.getSuggestions(query);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular search queries' })
  @ApiResponse({
    status: 200,
    description: 'Popular queries retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['project status', 'milestone deadline', 'pending tasks']
    }
  })
  async getPopularQueries(): Promise<string[]> {
    return this.searchService.getPopularQueries();
  }

  @Get('global')
  @ApiOperation({ summary: 'Global search across all content types (limited results per type)' })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'mobile app' })
  @ApiResponse({
    status: 200,
    description: 'Global search results retrieved successfully',
    type: GlobalSearchResponseDto,
  })
  async searchGlobal(@Query('q') query: string): Promise<GlobalSearchResponseDto> {
    return this.searchService.searchGlobal('guest', query);
  }

  // =============================================
  // AUTHENTICATED SEARCH ENDPOINTS
  // =============================================

  @Get('authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search with user context (personalized results)' })
  @ApiResponse({ status: 200, description: 'Personalized search results retrieved successfully', type: SearchResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchAuthenticated(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) searchQuery: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    return this.searchService.search(req.user.sub || req.user.userId, searchQuery);
  }

  @Get('global/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Global search with user context (personalized results)' })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'mobile app' })
  @ApiResponse({
    status: 200,
    description: 'Personalized global search results retrieved successfully',
    type: GlobalSearchResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchGlobalAuthenticated(
    @Request() req: any,
    @Query('q') query: string,
  ): Promise<GlobalSearchResponseDto> {
    return this.searchService.searchGlobal(req.user.sub || req.user.userId, query);
  }

  // =============================================
  // SCOPED SEARCH ENDPOINTS
  // =============================================

  @Get('projects')
  @ApiOperation({ summary: 'Search only in projects' })
  @ApiResponse({ status: 200, description: 'Project search results retrieved successfully', type: SearchResponseDto })
  async searchProjects(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) searchQuery: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    const projectsQuery = { ...searchQuery, types: ['projects'] };
    return this.searchService.search('guest', projectsQuery);
  }

  @Get('milestones')
  @ApiOperation({ summary: 'Search only in milestones' })
  @ApiResponse({ status: 200, description: 'Milestone search results retrieved successfully', type: SearchResponseDto })
  async searchMilestones(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) searchQuery: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    const milestonesQuery = { ...searchQuery, types: ['milestones'] };
    return this.searchService.search('guest', milestonesQuery);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Search only in tasks' })
  @ApiResponse({ status: 200, description: 'Task search results retrieved successfully', type: SearchResponseDto })
  async searchTasks(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) searchQuery: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    const tasksQuery = { ...searchQuery, types: ['tasks'] };
    return this.searchService.search('guest', tasksQuery);
  }

  @Get('files')
  @ApiOperation({ summary: 'Search only in files' })
  @ApiResponse({ status: 200, description: 'File search results retrieved successfully', type: SearchResponseDto })
  async searchFiles(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) searchQuery: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    const filesQuery = { ...searchQuery, types: ['files'] };
    return this.searchService.search('guest', filesQuery);
  }

  @Get('discussions')
  @ApiOperation({ summary: 'Search only in discussions/messages' })
  @ApiResponse({ status: 200, description: 'Discussion search results retrieved successfully', type: SearchResponseDto })
  async searchDiscussions(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) searchQuery: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    const discussionsQuery = { ...searchQuery, types: ['discussions'] };
    return this.searchService.search('guest', discussionsQuery);
  }
}
