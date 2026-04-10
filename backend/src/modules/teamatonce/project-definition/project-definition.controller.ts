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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProjectDefinitionService } from './project-definition.service';
import {
  SubmitProjectDefinitionDto,
  DefineProjectScopeDto,
} from './dto/project-definition.dto';
import {
  CreateRequirementDto,
  UpdateRequirementDto,
} from './dto/requirement.dto';
import {
  CreateStakeholderDto,
  UpdateStakeholderDto,
} from './dto/stakeholder.dto';
import {
  CreateConstraintDto,
  UpdateConstraintDto,
} from './dto/constraint.dto';

@ApiTags('project-definition')
@ApiBearerAuth()
@Controller('project-definition')
@UseGuards(JwtAuthGuard)
export class ProjectDefinitionController {
  constructor(private readonly projectDefinitionService: ProjectDefinitionService) {}

  // ============================================
  // PROJECT DEFINITION SUBMISSION
  // ============================================

  @Post('submit')
  @ApiOperation({ summary: 'Submit complete project definition (bulk operation)' })
  @ApiResponse({ status: 201, description: 'Project definition submitted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found or access denied' })
  async submitProjectDefinition(@Req() req, @Body() dto: SubmitProjectDefinitionDto) {
    const userId = req.user.sub || req.user.userId;
    return this.projectDefinitionService.submitProjectDefinition(userId, dto);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get complete project definition' })
  @ApiResponse({ status: 200, description: 'Returns project definition with scope, requirements, stakeholders, and constraints' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectDefinition(@Param('projectId') projectId: string) {
    return this.projectDefinitionService.getProjectDefinition(projectId);
  }

  @Put(':projectId/scope')
  @ApiOperation({ summary: 'Define or update project scope' })
  @ApiResponse({ status: 200, description: 'Project scope updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async defineProjectScope(
    @Param('projectId') projectId: string,
    @Body() dto: DefineProjectScopeDto
  ) {
    return this.projectDefinitionService.defineProjectScope(projectId, dto);
  }

  // ============================================
  // REQUIREMENTS MANAGEMENT
  // ============================================

  @Post(':projectId/requirements')
  @ApiOperation({ summary: 'Add project requirement' })
  @ApiResponse({ status: 201, description: 'Requirement added successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async addRequirement(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRequirementDto
  ) {
    return this.projectDefinitionService.addProjectRequirement(projectId, dto);
  }

  @Get(':projectId/requirements')
  @ApiOperation({ summary: 'Get all project requirements' })
  @ApiResponse({ status: 200, description: 'Returns list of requirements' })
  async getRequirements(@Param('projectId') projectId: string) {
    return this.projectDefinitionService.getProjectRequirements(projectId);
  }

  @Get('requirements/:requirementId')
  @ApiOperation({ summary: 'Get requirement by ID' })
  @ApiResponse({ status: 200, description: 'Returns requirement details' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  async getRequirement(@Param('requirementId') requirementId: string) {
    return this.projectDefinitionService.getRequirement(requirementId);
  }

  @Put('requirements/:requirementId')
  @ApiOperation({ summary: 'Update requirement' })
  @ApiResponse({ status: 200, description: 'Requirement updated successfully' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  async updateRequirement(
    @Param('requirementId') requirementId: string,
    @Body() dto: UpdateRequirementDto
  ) {
    return this.projectDefinitionService.updateProjectRequirement(requirementId, dto);
  }

  @Delete('requirements/:requirementId')
  @ApiOperation({ summary: 'Remove requirement (soft delete)' })
  @ApiResponse({ status: 200, description: 'Requirement removed successfully' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  async removeRequirement(@Param('requirementId') requirementId: string) {
    return this.projectDefinitionService.removeProjectRequirement(requirementId);
  }

  // ============================================
  // STAKEHOLDERS MANAGEMENT
  // ============================================

  @Post(':projectId/stakeholders')
  @ApiOperation({ summary: 'Add project stakeholder' })
  @ApiResponse({ status: 201, description: 'Stakeholder added successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async addStakeholder(
    @Param('projectId') projectId: string,
    @Body() dto: CreateStakeholderDto
  ) {
    return this.projectDefinitionService.addProjectStakeholder(projectId, dto);
  }

  @Get(':projectId/stakeholders')
  @ApiOperation({ summary: 'Get all project stakeholders' })
  @ApiResponse({ status: 200, description: 'Returns list of stakeholders' })
  async getStakeholders(@Param('projectId') projectId: string) {
    return this.projectDefinitionService.getProjectStakeholders(projectId);
  }

  @Get('stakeholders/:stakeholderId')
  @ApiOperation({ summary: 'Get stakeholder by ID' })
  @ApiResponse({ status: 200, description: 'Returns stakeholder details' })
  @ApiResponse({ status: 404, description: 'Stakeholder not found' })
  async getStakeholder(@Param('stakeholderId') stakeholderId: string) {
    return this.projectDefinitionService.getStakeholder(stakeholderId);
  }

  @Put('stakeholders/:stakeholderId')
  @ApiOperation({ summary: 'Update stakeholder' })
  @ApiResponse({ status: 200, description: 'Stakeholder updated successfully' })
  @ApiResponse({ status: 404, description: 'Stakeholder not found' })
  async updateStakeholder(
    @Param('stakeholderId') stakeholderId: string,
    @Body() dto: UpdateStakeholderDto
  ) {
    return this.projectDefinitionService.updateProjectStakeholder(stakeholderId, dto);
  }

  @Delete('stakeholders/:stakeholderId')
  @ApiOperation({ summary: 'Remove stakeholder (soft delete)' })
  @ApiResponse({ status: 200, description: 'Stakeholder removed successfully' })
  @ApiResponse({ status: 404, description: 'Stakeholder not found' })
  async removeStakeholder(@Param('stakeholderId') stakeholderId: string) {
    return this.projectDefinitionService.removeProjectStakeholder(stakeholderId);
  }

  // ============================================
  // CONSTRAINTS MANAGEMENT
  // ============================================

  @Post(':projectId/constraints')
  @ApiOperation({ summary: 'Add project constraint' })
  @ApiResponse({ status: 201, description: 'Constraint added successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async addConstraint(
    @Param('projectId') projectId: string,
    @Body() dto: CreateConstraintDto
  ) {
    return this.projectDefinitionService.addProjectConstraint(projectId, dto);
  }

  @Get(':projectId/constraints')
  @ApiOperation({ summary: 'Get all project constraints' })
  @ApiResponse({ status: 200, description: 'Returns list of constraints' })
  async getConstraints(@Param('projectId') projectId: string) {
    return this.projectDefinitionService.getProjectConstraints(projectId);
  }

  @Get('constraints/:constraintId')
  @ApiOperation({ summary: 'Get constraint by ID' })
  @ApiResponse({ status: 200, description: 'Returns constraint details' })
  @ApiResponse({ status: 404, description: 'Constraint not found' })
  async getConstraint(@Param('constraintId') constraintId: string) {
    return this.projectDefinitionService.getConstraint(constraintId);
  }

  @Put('constraints/:constraintId')
  @ApiOperation({ summary: 'Update constraint' })
  @ApiResponse({ status: 200, description: 'Constraint updated successfully' })
  @ApiResponse({ status: 404, description: 'Constraint not found' })
  async updateConstraint(
    @Param('constraintId') constraintId: string,
    @Body() dto: UpdateConstraintDto
  ) {
    return this.projectDefinitionService.updateProjectConstraint(constraintId, dto);
  }

  @Delete('constraints/:constraintId')
  @ApiOperation({ summary: 'Remove constraint (soft delete)' })
  @ApiResponse({ status: 200, description: 'Constraint removed successfully' })
  @ApiResponse({ status: 404, description: 'Constraint not found' })
  async removeConstraint(@Param('constraintId') constraintId: string) {
    return this.projectDefinitionService.removeProjectConstraint(constraintId);
  }
}
