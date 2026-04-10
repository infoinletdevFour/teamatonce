import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProposalService } from './proposal.service';
import { ProjectService } from './project.service';
import {
  CreateProposalDto,
  UpdateProposalDto,
  ReviewProposalDto,
  ProposalResponseDto,
  ProposalsListResponseDto,
  BrowseableProjectsResponseDto,
} from './dto/proposal.dto';

@ApiTags('proposals')
@ApiBearerAuth()
@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalController {
  constructor(
    private readonly proposalService: ProposalService,
    private readonly projectService: ProjectService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit a proposal for a project (Developer)' })
  @ApiResponse({ status: 201, description: 'Proposal submitted successfully', type: ProposalResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - project already assigned or proposal already exists' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async submitProposal(
    @Req() req,
    @Headers('x-company-id') headerCompanyId: string,
    @Body() dto: CreateProposalDto,
  ): Promise<ProposalResponseDto> {
    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(dto.projectId);

    const userId = req.user.sub || req.user.userId;
    // Try to get company ID from header first, then from JWT
    const companyId = headerCompanyId || req.user.companyId;

    if (!companyId) {
      throw new Error('Company ID is required to submit proposals');
    }

    return this.proposalService.submitProposal(userId, companyId, dto);
  }

  @Get('browse/projects')
  @ApiOperation({ summary: 'Get projects open for bidding (Developer view) - sorted by date then AI match score' })
  @ApiResponse({ status: 200, description: 'Paginated list of browseable projects sorted by AI match score', type: BrowseableProjectsResponseDto })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-indexed, default: 1)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20, max: 50)', type: Number })
  @ApiQuery({ name: 'projectType', required: false, description: 'Filter by project type' })
  @ApiQuery({ name: 'techStack', required: false, description: 'Filter by tech stack (comma-separated)' })
  @ApiQuery({ name: 'minBudget', required: false, description: 'Minimum budget', type: Number })
  @ApiQuery({ name: 'maxBudget', required: false, description: 'Maximum budget', type: Number })
  async getBrowseableProjects(
    @Req() req,
    @Headers('x-company-id') headerCompanyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('projectType') projectType?: string,
    @Query('techStack') techStack?: string,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string,
  ): Promise<BrowseableProjectsResponseDto> {
    const userId = req.user.sub || req.user.userId;
    // Try to get company ID from header first, then from JWT
    const companyId = headerCompanyId || req.user.companyId;

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    // Parse pagination params with defaults
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20)); // Default 20, max 50

    const filters: any = {};

    if (projectType) filters.projectType = projectType;
    if (techStack) filters.techStack = techStack.split(',');
    if (minBudget) filters.minBudget = parseFloat(minBudget);
    if (maxBudget) filters.maxBudget = parseFloat(maxBudget);

    return this.proposalService.getBrowseableProjects(companyId, userId, filters, pageNum, limitNum);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get all proposals submitted by a company (Developer view)' })
  @ApiResponse({ status: 200, description: 'List of company proposals', type: ProposalsListResponseDto })
  async getCompanyProposals(
    @Param('companyId') companyId: string,
  ): Promise<ProposalsListResponseDto> {
    return this.proposalService.getCompanyProposals(companyId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all proposals for a project (Client only)' })
  @ApiResponse({ status: 200, description: 'List of project proposals', type: ProposalsListResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - not project owner' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectProposals(
    @Req() req,
    @Param('projectId') projectId: string,
  ): Promise<ProposalsListResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.proposalService.getProjectProposals(userId, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single proposal by ID' })
  @ApiResponse({ status: 200, description: 'Proposal details', type: ProposalResponseDto })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async getProposal(
    @Param('id') id: string,
  ): Promise<ProposalResponseDto> {
    return this.proposalService.getProposal(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update proposal before review (Developer only)' })
  @ApiResponse({ status: 200, description: 'Proposal updated successfully', type: ProposalResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot update reviewed proposal' })
  @ApiResponse({ status: 403, description: 'Forbidden - not proposal owner' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async updateProposal(
    @Req() req,
    @Headers('x-company-id') headerCompanyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
  ): Promise<ProposalResponseDto> {
    // Get proposal to find project ID and check if project is rejected
    const proposal = await this.proposalService.getProposal(id);
    await this.projectService.validateProjectNotRejected(proposal.projectId);

    const userId = req.user.sub || req.user.userId;
    // Try to get company ID from header first, then from JWT
    const companyId = headerCompanyId || req.user.companyId;

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    return this.proposalService.updateProposal(userId, companyId, id, dto);
  }

  @Put(':id/review')
  @ApiOperation({ summary: 'Review proposal - accept or reject (Client only)' })
  @ApiResponse({ status: 200, description: 'Proposal reviewed successfully', type: ProposalResponseDto })
  @ApiResponse({ status: 400, description: 'Proposal already reviewed' })
  @ApiResponse({ status: 403, description: 'Forbidden - not project owner' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async reviewProposal(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: ReviewProposalDto,
  ): Promise<ProposalResponseDto> {
    // Get proposal to find project ID and check if project is rejected
    const proposal = await this.proposalService.getProposal(id);
    await this.projectService.validateProjectNotRejected(proposal.projectId);

    const userId = req.user.sub || req.user.userId;
    return this.proposalService.reviewProposal(userId, id, dto);
  }

  @Put(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw proposal (Developer only)' })
  @ApiResponse({ status: 200, description: 'Proposal withdrawn successfully', type: ProposalResponseDto })
  @ApiResponse({ status: 400, description: 'Can only withdraw pending proposals' })
  @ApiResponse({ status: 403, description: 'Forbidden - not proposal owner' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async withdrawProposal(
    @Req() req,
    @Headers('x-company-id') headerCompanyId: string,
    @Param('id') id: string,
  ): Promise<ProposalResponseDto> {
    const userId = req.user.sub || req.user.userId;
    // Try to get company ID from header first, then from JWT
    const companyId = headerCompanyId || req.user.companyId;

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    return this.proposalService.withdrawProposal(userId, companyId, id);
  }
}
