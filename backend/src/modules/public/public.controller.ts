import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PublicService } from './public.service';

/**
 * Public Controller
 * Handles public-facing endpoints for the landing page
 * No authentication required
 */
@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // ============================================
  // Category Endpoints
  // ============================================

  @Get('categories/featured')
  @ApiOperation({ summary: 'Get featured categories for landing page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of categories to return' })
  async getFeaturedCategories(@Query('limit') limit?: number) {
    return this.publicService.getFeaturedCategories(limit || 8);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getAllCategories() {
    return this.publicService.getFeaturedCategories(20);
  }

  @Get('categories/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  async getCategoryBySlug(@Param('slug') slug: string) {
    const categories = await this.publicService.getFeaturedCategories(20);
    return categories.find(c => c.slug === slug) || null;
  }

  // ============================================
  // Seller/Developer Endpoints
  // ============================================

  @Get('developers/featured')
  @ApiOperation({ summary: 'Get featured/top-rated sellers for landing page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of sellers to return' })
  async getFeaturedDevelopers(@Query('limit') limit?: number) {
    return this.publicService.getFeaturedSellers(limit || 4);
  }

  @Get('developers/search')
  @ApiOperation({ summary: 'Search sellers with smart relevance scoring' })
  @ApiQuery({ name: 'query', required: false, type: String, description: 'Search query for name, title, skills, bio' })
  @ApiQuery({ name: 'skills', required: false, type: String, description: 'Comma-separated skills filter' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Category slug filter' })
  @ApiQuery({ name: 'minRate', required: false, type: Number, description: 'Minimum hourly rate' })
  @ApiQuery({ name: 'maxRate', required: false, type: Number, description: 'Maximum hourly rate' })
  @ApiQuery({ name: 'availability', required: false, type: String, description: 'Availability status' })
  @ApiQuery({ name: 'minRating', required: false, type: Number, description: 'Minimum rating' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchDevelopers(
    @Query('query') query?: string,
    @Query('skills') skills?: string,
    @Query('category') category?: string,
    @Query('minRate') minRate?: number,
    @Query('maxRate') maxRate?: number,
    @Query('availability') availability?: string,
    @Query('minRating') minRating?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Parse skills from comma-separated string
    const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    return this.publicService.searchDevelopers({
      query,
      skills: skillsArray,
      category,
      minRate: minRate ? Number(minRate) : undefined,
      maxRate: maxRate ? Number(maxRate) : undefined,
      availability,
      minRating: minRating ? Number(minRating) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('developers/category/:slug')
  @ApiOperation({ summary: 'Get sellers by category' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDevelopersByCategory(
    @Param('slug') slug: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const sellers = await this.publicService.getFeaturedSellers(limit || 20);
    return {
      data: sellers,
      total: sellers.length,
      page: page || 1,
      limit: limit || 20,
      totalPages: 1,
    };
  }

  @Get('developers/:id')
  @ApiOperation({ summary: 'Get seller by ID with full details including reviews' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  async getDeveloperById(@Param('id') id: string) {
    return this.publicService.getSellerById(id);
  }

  // ============================================
  // Job/Project Endpoints
  // ============================================

  @Get('jobs/featured')
  @ApiOperation({ summary: 'Get featured jobs/projects for landing page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of jobs to return' })
  async getFeaturedJobs(@Query('limit') limit?: number) {
    return this.publicService.getFeaturedJobs(limit || 6);
  }

  @Get('jobs/search')
  @ApiOperation({ summary: 'Search jobs' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'skills', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchJobs(
    @Query('query') query?: string,
    @Query('skills') skills?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const jobs = await this.publicService.getFeaturedJobs(limit || 20);
    return {
      data: jobs,
      total: jobs.length,
      page: page || 1,
      limit: limit || 20,
      totalPages: 1,
    };
  }

  @Get('jobs/category/:slug')
  @ApiOperation({ summary: 'Get jobs by category' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getJobsByCategory(
    @Param('slug') slug: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const jobs = await this.publicService.getFeaturedJobs(limit || 20);
    return {
      data: jobs,
      total: jobs.length,
      page: page || 1,
      limit: limit || 20,
      totalPages: 1,
    };
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  async getJobById(@Param('id') id: string) {
    const jobs = await this.publicService.getFeaturedJobs(100);
    return jobs.find(j => j.id === id) || null;
  }

  // ============================================
  // Testimonials Endpoint
  // ============================================

  @Get('testimonials')
  @ApiOperation({ summary: 'Get testimonials from clients and developers for landing page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of testimonials to return' })
  async getTestimonials(@Query('limit') limit?: number) {
    return this.publicService.getTestimonials(limit || 6);
  }

  // ============================================
  // Stats Endpoint
  // ============================================

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  async getPlatformStats() {
    return this.publicService.getPlatformStats();
  }

  // ============================================
  // FAQ Endpoint
  // ============================================

  @Get('faqs')
  @ApiOperation({ summary: 'Get published FAQs for landing page' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  async getPublicFaqs(@Query('category') category?: string) {
    return this.publicService.getPublicFaqs(category);
  }
}
