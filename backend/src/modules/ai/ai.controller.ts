import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Request, 
  Query,
  Param,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiResponse,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';

// Import DTOs
import {
  GenerateTextDto,
  GenerateImageDto,
  GenerateCodeDto,
  TranslateTextDto,
  BatchTranslateDto,
  SummarizeContentDto,
  SummarizeUrlDto,
  CreateChatDto,
  ChatHistoryDto,
  GenerateRecipeDto,
  GenerateWorkoutPlanDto,
  GenerateMealPlanDto,
  UpdateChatSessionDto,
  AIQueryDto,
  AIUsageQueryDto,
  ChatSessionQueryDto,
  UsagePeriod,
  // Response DTOs
  AITextResponse,
  AIImageResponse,
  AICodeResponse,
  AITranslationResponse,
  AISummaryResponse,
  AIChatResponse,
  AIRecipeResponse,
  AIWorkoutResponse,
  AIMealPlanResponse,
  AIHistoryResponse,
  AIUsageStats
} from './dto';

// Travel DTO removed - travel module not needed in Learning OS

@ApiTags('AI Services')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  /**
   * Text Generation Endpoints
   */
  @Post('generate-text')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate text content',
    description: 'Generate various types of text content including blog posts, social media, emails, articles, and more'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Text generated successfully', 
    type: AITextResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Authentication required' 
  })
  @ApiResponse({ 
    status: HttpStatus.TOO_MANY_REQUESTS, 
    description: 'Rate limit exceeded' 
  })
  async generateText(@Request() req, @Body() dto: GenerateTextDto): Promise<AITextResponse> {
    return await this.aiService.generateText(req.user.sub, dto);
  }

  /**
   * Image Generation Endpoints
   */
  @Post('generate-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate images',
    description: 'Generate AI images including artwork, logos, illustrations, and more with customizable styles and parameters'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Image generated successfully', 
    type: AIImageResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Authentication required' 
  })
  @ApiResponse({ 
    status: HttpStatus.TOO_MANY_REQUESTS, 
    description: 'Rate limit exceeded' 
  })
  async generateImage(@Request() req, @Body() dto: GenerateImageDto): Promise<AIImageResponse> {
    return await this.aiService.generateImage(req.user.sub, dto);
  }

  /**
   * Code Generation Endpoints
   */
  @Post('generate-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate code',
    description: 'Generate code in various programming languages with support for different frameworks, patterns, and complexity levels'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Code generated successfully', 
    type: AICodeResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Authentication required' 
  })
  async generateCode(@Request() req, @Body() dto: GenerateCodeDto): Promise<AICodeResponse> {
    return await this.aiService.generateCode(req.user.sub, dto);
  }

  /**
   * Translation Endpoints
   */
  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Translate text',
    description: 'Translate text between different languages with context-aware translation and style options'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Text translated successfully', 
    type: AITranslationResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Authentication required' 
  })
  async translateText(@Request() req, @Body() dto: TranslateTextDto): Promise<AITranslationResponse> {
    return await this.aiService.translateText(req.user.sub, dto);
  }

  @Post('translate-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Batch translate multiple texts',
    description: 'Translate multiple text items in a single request for efficiency'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Batch translation completed successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  async batchTranslate(@Request() req, @Body() dto: BatchTranslateDto) {
    const results = [];
    for (const text of dto.texts) {
      const translationDto: TranslateTextDto = {
        text,
        target_language: dto.target_language,
        source_language: dto.source_language,
        style: dto.style,
        context: dto.context,
        preserve_formatting: dto.preserve_formatting,
        glossary: dto.glossary,
      };
      
      const result = await this.aiService.translateText(req.user.sub, translationDto);
      results.push(result);
    }
    
    return {
      translations: results,
      total_items: dto.texts.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Summarization Endpoints
   */
  @Post('summarize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Summarize content',
    description: 'Generate summaries of various content types with customizable length and focus areas'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Content summarized successfully', 
    type: AISummaryResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Authentication required' 
  })
  async summarizeContent(@Request() req, @Body() dto: SummarizeContentDto): Promise<AISummaryResponse> {
    return await this.aiService.summarizeContent(req.user.sub, dto);
  }

  @Post('summarize-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Summarize content from URL',
    description: 'Fetch and summarize content from a given URL'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'URL content summarized successfully', 
    type: AISummaryResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid URL or content could not be fetched' 
  })
  async summarizeUrl(@Request() req, @Body() dto: SummarizeUrlDto) {
    // This would need URL content fetching logic
    // For now, return an error indicating it's not implemented
    throw new Error('URL summarization not yet implemented');
  }

  /**
   * AI Chat Endpoints
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'AI chat conversation',
    description: 'Engage in AI-powered conversations with customizable personality and context'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Chat response generated successfully', 
    type: AIChatResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Authentication required' 
  })
  async createChat(@Request() req, @Body() dto: CreateChatDto): Promise<AIChatResponse> {
    return await this.aiService.createChat(req.user.sub, dto);
  }

  @Post('chat-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Continue chat with history',
    description: 'Continue a conversation by providing the full message history'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Chat response with history generated successfully', 
    type: AIChatResponse 
  })
  async chatWithHistory(@Request() req, @Body() dto: ChatHistoryDto) {
    // Convert ChatHistoryDto to CreateChatDto format
    const createChatDto: CreateChatDto = {
      message: dto.message,
      personality: dto.personality,
      context: dto.context,
      response_format: dto.response_format,
      max_tokens: dto.max_tokens,
      temperature: dto.temperature,
      include_history: true,
    };

    return await this.aiService.createChat(req.user.sub, createChatDto);
  }

  @Get('chat-sessions')
  @ApiOperation({ 
    summary: 'Get chat sessions',
    description: 'Retrieve user\'s chat sessions with pagination and filtering'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  async getChatSessions(@Request() req, @Query() query: ChatSessionQueryDto) {
    // This would need implementation in the service
    return { message: 'Chat sessions endpoint not yet implemented' };
  }

  @Get('chat-sessions/:sessionId')
  @ApiOperation({ 
    summary: 'Get specific chat session',
    description: 'Retrieve a specific chat session with its message history'
  })
  async getChatSession(@Request() req, @Param('sessionId') sessionId: string) {
    // This would need implementation in the service
    return { message: 'Get chat session endpoint not yet implemented' };
  }

  /**
   * Specialized Generation Endpoints
   */
  @Post('recipe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate recipes',
    description: 'Generate detailed recipes with ingredients, instructions, and nutritional information'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Recipe generated successfully', 
    type: AIRecipeResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  async generateRecipe(@Request() req, @Body() dto: GenerateRecipeDto): Promise<AIRecipeResponse> {
    return await this.aiService.generateRecipe(req.user.sub, dto);
  }

  @Post('travel-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate travel plans',
    description: 'Create comprehensive travel itineraries with accommodations, activities, and recommendations'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Travel plan generated successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  async generateTravelPlan(@Request() req, @Body() dto: any) {
    return await this.aiService.generateTravelPlan(req.user.sub, dto);
  }

  @Post('workout-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate workout plans',
    description: 'Create personalized workout routines based on fitness goals and preferences'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Workout plan generated successfully', 
    type: AIWorkoutResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  async generateWorkoutPlan(@Request() req, @Body() dto: GenerateWorkoutPlanDto): Promise<AIWorkoutResponse> {
    return await this.aiService.generateWorkoutPlan(req.user.sub, dto);
  }

  @Post('meal-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate meal plans',
    description: 'Create detailed meal plans with recipes and grocery lists based on dietary preferences'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Meal plan generated successfully', 
    type: AIMealPlanResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  async generateMealPlan(@Request() req, @Body() dto: GenerateMealPlanDto): Promise<AIMealPlanResponse> {
    return await this.aiService.generateMealPlan(req.user.sub, dto);
  }

  /**
   * History and Analytics Endpoints
   */
  @Get('history')
  @ApiOperation({ 
    summary: 'Get AI generation history',
    description: 'Retrieve user\'s AI generation history with filtering and pagination'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'service_type', required: false, enum: ['text_generation', 'image_generation', 'code_generation', 'translation', 'summarization', 'chat', 'recipe', 'travel_plan', 'workout_plan', 'meal_plan'], description: 'Filter by AI service type' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in prompts' })
  @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'date_to', required: false, type: String, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: desc)' })
  @ApiQuery({ name: 'include_preview', required: false, type: Boolean, description: 'Include content preview (default: true)' })
  @ApiQuery({ name: 'include_usage', required: false, type: Boolean, description: 'Include usage stats (default: false)' })
  @ApiQuery({ name: 'include_metadata', required: false, type: Boolean, description: 'Include metadata (default: false)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'AI generation history retrieved successfully', 
    type: AIHistoryResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Authentication required' 
  })
  async getHistory(@Request() req, @Query() query: AIQueryDto): Promise<AIHistoryResponse> {
    return await this.aiService.getHistory(req.user.sub, query);
  }

  @Get('usage')
  @ApiOperation({ 
    summary: 'Get usage statistics',
    description: 'Retrieve user\'s AI service usage statistics and limits'
  })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly', 'yearly', 'all_time'], description: 'Usage period (default: monthly)' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Custom start date (ISO 8601)' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'Custom end date (ISO 8601)' })
  @ApiQuery({ name: 'detailed', required: false, type: Boolean, description: 'Include detailed breakdown (default: false)' })
  @ApiQuery({ name: 'include_costs', required: false, type: Boolean, description: 'Include cost information (default: false)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Usage statistics retrieved successfully', 
    type: AIUsageStats 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Authentication required' 
  })
  async getUsageStats(@Request() req, @Query() query: AIUsageQueryDto): Promise<AIUsageStats> {
    return await this.aiService.getUsageStats(req.user.sub, query);
  }

  /**
   * Health Check and Info Endpoints
   */
  @Get('health')
  @ApiOperation({ 
    summary: 'AI service health check',
    description: 'Check the health and availability of AI services'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'AI services are healthy'
  })
  async healthCheck() {
    return {
      status: 'healthy',
      services: {
        text_generation: 'available',
        image_generation: 'available',
        code_generation: 'available',
        translation: 'available',
        summarization: 'available',
        chat: 'available',
        specialized_generation: 'available',
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Get('models')
  @ApiOperation({ 
    summary: 'Get available AI models',
    description: 'List all available AI models and their capabilities'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Available models retrieved successfully'
  })
  async getAvailableModels() {
    return {
      text_models: [
        {
          name: 'gpt-4-turbo',
          description: 'Most capable model for text generation',
          max_tokens: 4096,
          supports: ['text_generation', 'code_generation', 'translation', 'summarization', 'chat'],
        },
        {
          name: 'gpt-3.5-turbo',
          description: 'Fast and efficient model for general text tasks',
          max_tokens: 2048,
          supports: ['text_generation', 'translation', 'summarization', 'chat'],
        },
      ],
      image_models: [
        {
          name: 'dall-e-3',
          description: 'High-quality image generation',
          max_resolution: '1024x1024',
          supports: ['image_generation'],
        },
        {
          name: 'stable-diffusion',
          description: 'Versatile image generation with style control',
          max_resolution: '1024x1024',
          supports: ['image_generation'],
        },
      ],
      specialized_models: [
        {
          name: 'recipe-assistant',
          description: 'Specialized in recipe generation',
          supports: ['recipe_generation'],
        },
        {
          name: 'fitness-coach',
          description: 'Specialized in workout planning',
          supports: ['workout_plan_generation'],
        },
        {
          name: 'travel-planner',
          description: 'Specialized in travel itinerary creation',
          supports: ['travel_plan_generation'],
        },
      ],
    };
  }

  @Get('limits')
  @ApiOperation({ 
    summary: 'Get user limits and quotas',
    description: 'Get current user\'s AI service limits and remaining quotas'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User limits retrieved successfully'
  })
  async getUserLimits(@Request() req) {
    const usage = await this.aiService.getUsageStats(req.user.sub, { period: UsagePeriod.MONTHLY });
    
    return {
      user_id: req.user.sub,
      plan: 'premium', // This would come from user's subscription
      current_usage: usage,
      limits: {
        requests_per_month: 10000,
        tokens_per_month: 100000,
        images_per_month: 500,
        translations_per_month: 50000, // characters
      },
      remaining: {
        requests: Math.max(0, 10000 - (usage.total_requests || 0)),
        tokens: Math.max(0, 100000 - (usage.tokens_used || 0)),
        images: Math.max(0, 500 - (usage.images_generated || 0)),
        translations: Math.max(0, 50000 - (usage.characters_translated || 0)),
      },
      reset_date: '2024-02-01T00:00:00Z', // Next billing cycle
      timestamp: new Date().toISOString(),
    };
  }
}