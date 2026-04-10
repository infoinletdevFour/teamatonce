import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EdgeFunctionsService } from './edge-functions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Edge Functions')
@Controller('edge-functions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EdgeFunctionsController {
  constructor(private edgeFunctionsService: EdgeFunctionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all deployed edge functions' })
  async listFunctions() {
    return await this.edgeFunctionsService.listEdgeFunctions();
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get edge function templates' })
  getTemplates() {
    return {
      templates: [
        {
          name: 'health-check',
          description: 'Simple health check endpoint',
          code: this.edgeFunctionsService.getHealthCheckFunction(),
        },
        {
          name: 'user-profile',
          description: 'User profile API endpoint',
          code: this.edgeFunctionsService.getUserProfileFunction(),
        },
        {
          name: 'fitness-activity',
          description: 'Log fitness activities',
          code: this.edgeFunctionsService.getFitnessActivityFunction(),
        },
        {
          name: 'ai-service',
          description: 'AI service endpoint for various generations',
          code: this.edgeFunctionsService.getAIServiceFunction(),
        },
      ],
    };
  }

  @Post('deploy')
  @ApiOperation({ summary: 'Deploy a new edge function' })
  async deployFunction(
    @Body() body: { name: string; code: string; route: string },
  ) {
    return await this.edgeFunctionsService.deployEdgeFunction(
      body.name,
      body.code,
      body.route,
    );
  }
}