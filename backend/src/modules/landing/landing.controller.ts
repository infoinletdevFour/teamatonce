import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LandingService } from './landing.service';

@ApiTags('landing')
@Controller('landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  @Get('data')
  @ApiOperation({ summary: 'Get all landing page data in a single call' })
  async getLandingPageData() {
    return this.landingService.getLandingPageData();
  }
}