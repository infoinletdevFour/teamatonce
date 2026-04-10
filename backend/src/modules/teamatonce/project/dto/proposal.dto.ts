import { IsString, IsOptional, IsNumber, IsArray, IsEnum, IsUUID, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProposalStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export class ProposedMilestoneDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  estimatedHours: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  deliverables?: string[];
}

export class CreateProposalDto {
  @ApiProperty({ description: 'Project ID to submit proposal for' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Cover letter explaining why your company is the best fit' })
  @IsString()
  @IsOptional()
  coverLetter?: string;

  @ApiProperty({ description: 'Proposed total cost for the project' })
  @IsNumber()
  proposedCost: number;

  @ApiPropertyOptional({ description: 'Currency (default: USD)' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Proposed project duration in days' })
  @IsNumber()
  proposedDurationDays: number;

  @ApiPropertyOptional({ description: 'Proposed start date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  proposedStartDate?: string;

  @ApiPropertyOptional({ description: 'Proposed milestones breakdown', type: [ProposedMilestoneDto] })
  @IsArray()
  @IsOptional()
  proposedMilestones?: ProposedMilestoneDto[];

  @ApiPropertyOptional({ description: 'Team members who will work on this project' })
  @IsArray()
  @IsOptional()
  teamComposition?: Array<{ name: string; role: string; }>;

  @ApiPropertyOptional({ description: 'References to similar completed projects' })
  @IsArray()
  @IsOptional()
  similarProjects?: Array<{ name: string; description: string; }>;
}

export class UpdateProposalDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coverLetter?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  proposedCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  proposedDurationDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  proposedStartDate?: string;

  @ApiPropertyOptional({ type: [ProposedMilestoneDto] })
  @IsArray()
  @IsOptional()
  proposedMilestones?: ProposedMilestoneDto[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  teamComposition?: Array<{ name: string; role: string; }>;
}

export class ReviewProposalDto {
  @ApiProperty({ enum: ProposalStatus })
  @IsEnum(ProposalStatus)
  status: ProposalStatus; // accepted or rejected

  @ApiPropertyOptional({ description: 'Notes from client about the decision' })
  @IsString()
  @IsOptional()
  reviewNotes?: string;
}

export class ProposalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  submittedBy: string;

  @ApiPropertyOptional()
  coverLetter?: string;

  @ApiProperty()
  proposedCost: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  proposedDurationDays: number;

  @ApiPropertyOptional()
  proposedStartDate?: string;

  @ApiProperty({ enum: ProposalStatus })
  status: ProposalStatus;

  @ApiPropertyOptional()
  reviewedBy?: string;

  @ApiPropertyOptional()
  reviewedAt?: string;

  @ApiPropertyOptional()
  reviewNotes?: string;

  @ApiPropertyOptional()
  proposedMilestones?: ProposedMilestoneDto[];

  @ApiPropertyOptional()
  teamComposition?: Array<{ name: string; role: string; }>;

  @ApiPropertyOptional()
  similarProjects?: Array<{ name: string; description: string; }>;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  // Populated fields
  @ApiPropertyOptional({ description: 'Company details (populated)' })
  company?: {
    id: string;
    name: string;
    logo?: string;
  };

  @ApiPropertyOptional({ description: 'Company name (populated for client view)' })
  company_name?: string;

  @ApiPropertyOptional({ description: 'AI-calculated match score based on seller skills vs required skills (0-100)' })
  matchScore?: number;

  @ApiPropertyOptional({ description: 'Matched skills between seller and project requirements' })
  matchedSkills?: string[];

  @ApiPropertyOptional({ description: 'Skills required by project that seller is missing' })
  missingSkills?: string[];

  @ApiPropertyOptional({ description: 'Seller skills' })
  sellerSkills?: string[];
}

export class ProposalsListResponseDto {
  @ApiProperty({ type: [ProposalResponseDto] })
  proposals: ProposalResponseDto[];

  @ApiProperty()
  total: number;
}

// DTO for browseable projects (projects open for bidding)
export class BrowseableProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  projectType: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  estimatedCost: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  estimatedDurationDays: number;

  @ApiPropertyOptional()
  startDate?: string;

  @ApiPropertyOptional()
  expectedCompletionDate?: string;

  @ApiProperty()
  techStack: string[];

  @ApiProperty()
  frameworks: string[];

  @ApiProperty()
  features: string[];

  @ApiProperty()
  requirements: Record<string, any>;

  @ApiProperty()
  clientId: string;

  @ApiProperty({ description: 'Number of proposals submitted for this project' })
  proposalsCount: number;

  @ApiProperty({ description: 'Whether current company has already submitted a proposal' })
  hasProposal: boolean;

  @ApiProperty({ description: 'AI-calculated match score based on seller skills vs required skills (0-100)' })
  matchScore: number;

  @ApiPropertyOptional({ description: 'Matched skills between seller and project requirements' })
  matchedSkills?: string[];

  @ApiPropertyOptional({ description: 'Skills required by project that seller is missing' })
  missingSkills?: string[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  // Populated client info
  @ApiPropertyOptional()
  client?: {
    id: string;
    name?: string;
    avatar?: string;
  };
}

export class BrowseableProjectsResponseDto {
  @ApiProperty({ type: [BrowseableProjectResponseDto] })
  projects: BrowseableProjectResponseDto[];

  @ApiProperty({ description: 'Total number of projects matching filters' })
  total: number;

  @ApiProperty({ description: 'Current page number (1-indexed)' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there are more pages available' })
  hasMore: boolean;
}
