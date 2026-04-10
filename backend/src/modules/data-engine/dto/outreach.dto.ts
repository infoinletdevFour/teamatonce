import { IsString, IsOptional, IsInt, Min, Max, IsIn, IsUUID, IsArray, IsObject, IsEmail, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ==========================================
// CAMPAIGN DTOs
// ==========================================

export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign name', example: 'Dev Outreach - React Q1' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Email subject with {{vars}}', example: 'Hi {{firstName}}, opportunity for {{primaryRole}}' })
  @IsString()
  template_subject: string;

  @ApiProperty({ description: 'Email body HTML with {{vars}}' })
  @IsString()
  template_html: string;

  @ApiPropertyOptional({ description: 'Plain text fallback' })
  @IsOptional()
  @IsString()
  template_text?: string;

  @ApiPropertyOptional({ description: 'Override SES default from address' })
  @IsOptional()
  @IsString()
  from_address?: string;

  @ApiPropertyOptional({ description: 'Override SES default from name' })
  @IsOptional()
  @IsString()
  from_name?: string;

  @ApiPropertyOptional({ description: 'Reply-to address' })
  @IsOptional()
  @IsString()
  reply_to?: string;

  @ApiPropertyOptional({ description: 'Entity filters for targeting', example: { skills: ['react', 'typescript'], entity_type: 'person' } })
  @IsOptional()
  @IsObject()
  target_filters?: Record<string, any>;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional({ description: 'Campaign name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Email subject with {{vars}}' })
  @IsOptional()
  @IsString()
  template_subject?: string;

  @ApiPropertyOptional({ description: 'Email body HTML with {{vars}}' })
  @IsOptional()
  @IsString()
  template_html?: string;

  @ApiPropertyOptional({ description: 'Plain text fallback' })
  @IsOptional()
  @IsString()
  template_text?: string;

  @ApiPropertyOptional({ description: 'Override SES default from address' })
  @IsOptional()
  @IsString()
  from_address?: string;

  @ApiPropertyOptional({ description: 'Override SES default from name' })
  @IsOptional()
  @IsString()
  from_name?: string;

  @ApiPropertyOptional({ description: 'Reply-to address' })
  @IsOptional()
  @IsString()
  reply_to?: string;

  @ApiPropertyOptional({ description: 'Entity filters for targeting' })
  @IsOptional()
  @IsObject()
  target_filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Campaign status', enum: ['draft', 'active', 'paused', 'completed'] })
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'active', 'paused', 'completed'])
  status?: string;
}

export class CampaignQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['draft', 'active', 'paused', 'completed'] })
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'active', 'paused', 'completed'])
  status?: string;

  @ApiPropertyOptional({ description: 'Number of items to return', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Number of items to skip', default: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

// ==========================================
// RECIPIENT DTOs
// ==========================================

export class ManualRecipientDto {
  @ApiProperty({ description: 'Recipient email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Recipient name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Personalization data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class AddRecipientsDto {
  @ApiProperty({ description: 'Source of recipients', enum: ['entities', 'manual'] })
  @IsString()
  @IsIn(['entities', 'manual'])
  source: 'entities' | 'manual';

  @ApiPropertyOptional({ description: 'Filters for entity-sourced recipients', example: { entity_type: 'person', skills: ['react'] } })
  @IsOptional()
  @IsObject()
  entity_filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Manual recipients list', type: [ManualRecipientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualRecipientDto)
  manual_recipients?: ManualRecipientDto[];
}

export class RecipientQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'] })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'])
  status?: string;

  @ApiPropertyOptional({ description: 'Number of items to return', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Number of items to skip', default: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

// ==========================================
// SEND / ACTION DTOs
// ==========================================

export class SendCampaignDto {
  @ApiPropertyOptional({ description: 'Maximum recipients to send per batch', default: 100, minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  limit?: number = 100;
}

export class AddToBlocklistDto {
  @ApiProperty({ description: 'Email to block' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Reason for blocking', enum: ['unsubscribed', 'bounced', 'manual', 'complaint'], default: 'manual' })
  @IsOptional()
  @IsString()
  @IsIn(['unsubscribed', 'bounced', 'manual', 'complaint'])
  reason?: string = 'manual';
}

export class BlocklistQueryDto {
  @ApiPropertyOptional({ description: 'Filter by reason', enum: ['unsubscribed', 'bounced', 'manual', 'complaint'] })
  @IsOptional()
  @IsString()
  @IsIn(['unsubscribed', 'bounced', 'manual', 'complaint'])
  reason?: string;

  @ApiPropertyOptional({ description: 'Number of items to return', default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Number of items to skip', default: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

// ==========================================
// RESPONSE INTERFACES
// ==========================================

export interface CampaignResponse {
  id: string;
  name: string;
  description: string | null;
  templateSubject: string;
  templateHtml: string;
  templateText: string | null;
  fromAddress: string | null;
  fromName: string | null;
  replyTo: string | null;
  targetFilters: Record<string, any>;
  status: string;
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  unsubscribedCount: number;
  bouncedCount: number;
  createdBy: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientResponse {
  id: string;
  campaignId: string;
  unifiedEntityId: string | null;
  email: string;
  name: string | null;
  personalizationData: Record<string, any>;
  trackingToken: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  unsubscribedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface OutreachEventResponse {
  id: string;
  recipientId: string;
  campaignId: string;
  eventType: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface BlocklistEntry {
  id: string;
  email: string;
  reason: string;
  sourceCampaignId: string | null;
  blockedAt: string;
}
