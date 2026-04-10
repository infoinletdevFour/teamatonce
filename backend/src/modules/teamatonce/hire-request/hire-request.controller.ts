import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HireRequestService } from './hire-request.service';
import {
  CreateHireRequestDto,
  UpdateHireRequestDto,
  ReviewHireRequestDto,
} from './dto/hire-request.dto';

@Controller('hire-requests')
@UseGuards(JwtAuthGuard)
export class HireRequestController {
  constructor(private readonly hireRequestService: HireRequestService) {}

  /**
   * Create a new hire request (Client -> Seller)
   * POST /hire-requests
   */
  @Post()
  async createHireRequest(@Req() req: any, @Body() dto: CreateHireRequestDto) {
    const userId = req.user.sub || req.user.userId;
    return this.hireRequestService.createHireRequest(userId, dto);
  }

  /**
   * Get all hire requests sent by the current client
   * GET /hire-requests/client
   */
  @Get('client')
  async getClientHireRequests(@Req() req: any) {
    const userId = req.user.sub || req.user.userId;
    return this.hireRequestService.getClientHireRequests(userId);
  }

  /**
   * Get all hire requests for a company (Seller view)
   * GET /hire-requests/company/:companyId
   */
  @Get('company/:companyId')
  async getCompanyHireRequests(
    @Req() req: any,
    @Param('companyId') companyId: string,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.hireRequestService.getCompanyHireRequests(companyId, userId);
  }

  /**
   * Get a single hire request
   * GET /hire-requests/:id
   */
  @Get(':id')
  async getHireRequest(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub || req.user.userId;
    return this.hireRequestService.getHireRequest(id, userId);
  }

  /**
   * Update a hire request (Client only, before response)
   * PUT /hire-requests/:id
   */
  @Put(':id')
  async updateHireRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateHireRequestDto,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.hireRequestService.updateHireRequest(id, userId, dto);
  }

  /**
   * Review hire request (Seller accepts or rejects)
   * PUT /hire-requests/:id/review
   */
  @Put(':id/review')
  async reviewHireRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReviewHireRequestDto,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.hireRequestService.reviewHireRequest(id, userId, dto);
  }

  /**
   * Withdraw hire request (Client only)
   * DELETE /hire-requests/:id
   */
  @Delete(':id')
  async withdrawHireRequest(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub || req.user.userId;
    return this.hireRequestService.withdrawHireRequest(id, userId);
  }
}
