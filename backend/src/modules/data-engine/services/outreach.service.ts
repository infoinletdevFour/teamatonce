import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import {
  CampaignResponse,
  RecipientResponse,
  OutreachEventResponse,
  BlocklistEntry,
} from '../dto/outreach.dto';

@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('API_BASE_URL') || 'https://api.teamatonce.com';
  }

  // ==========================================
  // CAMPAIGN CRUD
  // ==========================================

  async createCampaign(data: {
    name: string;
    description?: string;
    template_subject: string;
    template_html: string;
    template_text?: string;
    from_address?: string;
    from_name?: string;
    reply_to?: string;
    target_filters?: Record<string, any>;
    created_by?: string;
  }): Promise<CampaignResponse> {
    const record = await this.db.insert('outreach_campaigns', {
      name: data.name,
      description: data.description || null,
      template_subject: data.template_subject,
      template_html: data.template_html,
      template_text: data.template_text || null,
      from_address: data.from_address || null,
      from_name: data.from_name || null,
      reply_to: data.reply_to || null,
      target_filters: data.target_filters || {},
      created_by: data.created_by || null,
      status: 'draft',
    });

    this.logger.log(`Created campaign: ${record.id} (${data.name})`);
    return this.transformCampaign(record);
  }

  async updateCampaign(id: string, data: Record<string, any>): Promise<CampaignResponse | null> {
    const campaign = await this.getCampaignRaw(id);
    if (!campaign) return null;

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    const allowedFields = [
      'name', 'description', 'template_subject', 'template_html', 'template_text',
      'from_address', 'from_name', 'reply_to', 'target_filters', 'status',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    await this.db.update('outreach_campaigns', { id }, updateData);
    const updated = await this.getCampaignRaw(id);
    return updated ? this.transformCampaign(updated) : null;
  }

  async getCampaign(id: string): Promise<CampaignResponse | null> {
    const record = await this.getCampaignRaw(id);
    return record ? this.transformCampaign(record) : null;
  }

  async listCampaigns(options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: CampaignResponse[]; total: number }> {
    const where: Record<string, any> = {};
    if (options.status) where.status = options.status;

    const allRecords = await this.db.select('outreach_campaigns', {
      where,
      orderBy: 'created_at',
      order: 'desc',
    });

    const total = allRecords.length;
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const paginatedRecords = allRecords.slice(offset, offset + limit);

    return {
      data: paginatedRecords.map((r: any) => this.transformCampaign(r)),
      total,
    };
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const campaign = await this.getCampaignRaw(id);
    if (!campaign) return false;

    if (campaign.status !== 'draft') {
      throw new Error('Only draft campaigns can be deleted');
    }

    // Delete recipients and events first
    const recipients = await this.db.select('outreach_recipients', {
      where: { campaign_id: id },
    });

    for (const recipient of recipients) {
      await this.db.delete('outreach_events', recipient.id);
      await this.db.delete('outreach_recipients', recipient.id);
    }

    // Delete events for campaign
    const events = await this.db.select('outreach_events', {
      where: { campaign_id: id },
    });
    for (const event of events) {
      await this.db.delete('outreach_events', event.id);
    }

    await this.db.delete('outreach_campaigns', id);
    this.logger.log(`Deleted campaign: ${id}`);
    return true;
  }

  // ==========================================
  // RECIPIENTS
  // ==========================================

  async addRecipientsFromEntities(
    campaignId: string,
    filters: Record<string, any> = {},
  ): Promise<{ added: number; skipped: number; blocked: number }> {
    const campaign = await this.getCampaignRaw(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    // Build query filters
    const where: Record<string, any> = {};
    if (filters.entity_type) where.entity_type = filters.entity_type;

    // Get entities matching filters
    const entities = await this.db.select('unified_entities', {
      where,
      orderBy: 'created_at',
      order: 'desc',
    });

    let added = 0;
    let skipped = 0;
    let blocked = 0;

    for (const entity of entities) {
      const email = entity.normalized_email;
      if (!email) {
        skipped++;
        continue;
      }

      // Check if already a recipient for this campaign
      const existing = await this.db.findOne('outreach_recipients', {
        campaign_id: campaignId,
        email,
      });
      if (existing) {
        skipped++;
        continue;
      }

      // Check blocklist
      if (await this.isBlocked(email)) {
        blocked++;
        continue;
      }

      // Apply skill filters if provided
      if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
        const mergedData = entity.merged_data || {};
        const entitySkills = (mergedData.skills || []).map((s: string) => s.toLowerCase());
        const hasMatchingSkill = filters.skills.some((s: string) =>
          entitySkills.some((es: string) => es.includes(s.toLowerCase())),
        );
        if (!hasMatchingSkill) {
          skipped++;
          continue;
        }
      }

      // Build personalization data from merged_data
      const mergedData = entity.merged_data || {};
      const personalizationData = this.buildPersonalizationData(entity, mergedData);

      // Generate unique tracking token
      const trackingToken = randomBytes(32).toString('hex');

      await this.db.insert('outreach_recipients', {
        campaign_id: campaignId,
        unified_entity_id: entity.id,
        email,
        name: entity.canonical_name || null,
        personalization_data: personalizationData,
        tracking_token: trackingToken,
        status: 'pending',
      });

      added++;
    }

    // Update total recipients count
    const allRecipients = await this.db.select('outreach_recipients', {
      where: { campaign_id: campaignId },
    });
    await this.db.update('outreach_campaigns', { id: campaignId }, {
      total_recipients: allRecipients.length,
      updated_at: new Date().toISOString(),
    });

    this.logger.log(`Added ${added} recipients to campaign ${campaignId} (skipped: ${skipped}, blocked: ${blocked})`);
    return { added, skipped, blocked };
  }

  async addManualRecipients(
    campaignId: string,
    recipients: Array<{ email: string; name?: string; data?: Record<string, any> }>,
  ): Promise<{ added: number; skipped: number; blocked: number }> {
    const campaign = await this.getCampaignRaw(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    let added = 0;
    let skipped = 0;
    let blocked = 0;

    for (const recipient of recipients) {
      const email = recipient.email.toLowerCase().trim();

      // Check duplicate
      const existing = await this.db.findOne('outreach_recipients', {
        campaign_id: campaignId,
        email,
      });
      if (existing) {
        skipped++;
        continue;
      }

      // Check blocklist
      if (await this.isBlocked(email)) {
        blocked++;
        continue;
      }

      const trackingToken = randomBytes(32).toString('hex');
      const name = recipient.name || email.split('@')[0];

      await this.db.insert('outreach_recipients', {
        campaign_id: campaignId,
        email,
        name,
        personalization_data: {
          name,
          firstName: name.split(' ')[0],
          email,
          ...(recipient.data || {}),
        },
        tracking_token: trackingToken,
        status: 'pending',
      });

      added++;
    }

    // Update total recipients count
    const allRecipients = await this.db.select('outreach_recipients', {
      where: { campaign_id: campaignId },
    });
    await this.db.update('outreach_campaigns', { id: campaignId }, {
      total_recipients: allRecipients.length,
      updated_at: new Date().toISOString(),
    });

    this.logger.log(`Added ${added} manual recipients to campaign ${campaignId} (skipped: ${skipped}, blocked: ${blocked})`);
    return { added, skipped, blocked };
  }

  async listRecipients(
    campaignId: string,
    options: { status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: RecipientResponse[]; total: number }> {
    const where: Record<string, any> = { campaign_id: campaignId };
    if (options.status) where.status = options.status;

    const allRecords = await this.db.select('outreach_recipients', {
      where,
      orderBy: 'created_at',
      order: 'desc',
    });

    const total = allRecords.length;
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const paginatedRecords = allRecords.slice(offset, offset + limit);

    return {
      data: paginatedRecords.map((r: any) => this.transformRecipient(r)),
      total,
    };
  }

  async getRecipientByToken(token: string): Promise<any | null> {
    return this.db.findOne('outreach_recipients', { tracking_token: token });
  }

  async getPendingRecipients(campaignId: string, limit: number): Promise<any[]> {
    const allPending = await this.db.select('outreach_recipients', {
      where: { campaign_id: campaignId, status: 'pending' },
      orderBy: 'created_at',
      order: 'asc',
    });

    return allPending.slice(0, limit);
  }

  // ==========================================
  // EMAIL RENDERING
  // ==========================================

  renderEmailForRecipient(
    campaign: any,
    recipient: any,
  ): { subject: string; html: string; text: string | null } {
    const data = recipient.personalization_data || {};
    const trackingBaseUrl = `${this.baseUrl}/api/v1/data-engine/track`;
    const unsubscribeUrl = `${this.baseUrl}/api/v1/data-engine/unsubscribe/${recipient.tracking_token}`;

    // Add standard variables
    data.platformUrl = this.configService.get<string>('FRONTEND_URL') || 'https://teamatonce.com';
    data.unsubscribeUrl = unsubscribeUrl;
    data.trackingPixel = `<img src="${trackingBaseUrl}/open/${recipient.tracking_token}" width="1" height="1" style="display:none;" alt="" />`;

    // Render subject
    let subject = this.replaceTemplateVars(campaign.template_subject, data);

    // Render HTML body
    let html = this.replaceTemplateVars(campaign.template_html, data);

    // Wrap links with click tracker
    html = this.wrapLinksWithTracker(html, recipient.tracking_token);

    // Inject tracking pixel at end of body (before closing </body> or at end)
    if (html.includes('{{trackingPixel}}')) {
      html = html.replace('{{trackingPixel}}', data.trackingPixel);
    } else if (html.includes('</body>')) {
      html = html.replace('</body>', `${data.trackingPixel}</body>`);
    } else {
      html += data.trackingPixel;
    }

    // Render text fallback
    let text: string | null = null;
    if (campaign.template_text) {
      text = this.replaceTemplateVars(campaign.template_text, data);
    }

    return { subject, html, text };
  }

  private replaceTemplateVars(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (data[key] !== undefined && data[key] !== null) {
        return String(data[key]);
      }
      return '';
    });
  }

  private wrapLinksWithTracker(html: string, trackingToken: string): string {
    const trackingBaseUrl = `${this.baseUrl}/api/v1/data-engine/track`;

    // Match href attributes in anchor tags, excluding unsubscribe and tracking URLs
    return html.replace(
      /<a\s([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
      (match, before, url, after) => {
        // Don't wrap tracking/unsubscribe URLs or mailto links
        if (
          url.includes('/track/') ||
          url.includes('/unsubscribe/') ||
          url.startsWith('mailto:') ||
          url.startsWith('#') ||
          url === ''
        ) {
          return match;
        }

        const encodedUrl = encodeURIComponent(url);
        const trackedUrl = `${trackingBaseUrl}/click/${trackingToken}?url=${encodedUrl}`;
        return `<a ${before}href="${trackedUrl}"${after}>`;
      },
    );
  }

  // ==========================================
  // BLOCKLIST
  // ==========================================

  async addToBlocklist(
    email: string,
    reason: string,
    sourceCampaignId?: string,
  ): Promise<BlocklistEntry> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if already blocked
    const existing = await this.db.findOne('email_blocklist', { email: normalizedEmail });
    if (existing) {
      return this.transformBlocklistEntry(existing);
    }

    const record = await this.db.insert('email_blocklist', {
      email: normalizedEmail,
      reason,
      source_campaign_id: sourceCampaignId || null,
    });

    this.logger.log(`Added to blocklist: ${normalizedEmail} (${reason})`);
    return this.transformBlocklistEntry(record);
  }

  async removeFromBlocklist(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.db.findOne('email_blocklist', { email: normalizedEmail });
    if (!existing) return false;

    await this.db.delete('email_blocklist', existing.id);
    this.logger.log(`Removed from blocklist: ${normalizedEmail}`);
    return true;
  }

  async isBlocked(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.db.findOne('email_blocklist', { email: normalizedEmail });
    return !!existing;
  }

  async getBlocklist(options: {
    reason?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: BlocklistEntry[]; total: number }> {
    const where: Record<string, any> = {};
    if (options.reason) where.reason = options.reason;

    const allRecords = await this.db.select('email_blocklist', {
      where,
      orderBy: 'blocked_at',
      order: 'desc',
    });

    const total = allRecords.length;
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const paginatedRecords = allRecords.slice(offset, offset + limit);

    return {
      data: paginatedRecords.map((r: any) => this.transformBlocklistEntry(r)),
      total,
    };
  }

  // ==========================================
  // TRACKING & EVENTS
  // ==========================================

  async recordEvent(
    token: string,
    eventType: string,
    metadata: Record<string, any> = {},
  ): Promise<{ recipient: any; campaign: any } | null> {
    const recipient = await this.getRecipientByToken(token);
    if (!recipient) return null;

    const campaign = await this.getCampaignRaw(recipient.campaign_id);
    if (!campaign) return null;

    // Insert event
    await this.db.insert('outreach_events', {
      recipient_id: recipient.id,
      campaign_id: recipient.campaign_id,
      event_type: eventType,
      metadata,
    });

    // Update recipient status and timestamp
    const now = new Date().toISOString();
    const recipientUpdate: Record<string, any> = {};

    switch (eventType) {
      case 'sent':
        recipientUpdate.status = 'sent';
        recipientUpdate.sent_at = now;
        break;
      case 'delivered':
        recipientUpdate.status = 'delivered';
        break;
      case 'opened':
        if (!recipient.opened_at) {
          recipientUpdate.status = 'opened';
          recipientUpdate.opened_at = now;
          // Increment campaign counter only on first open
          await this.incrementCampaignCounter(recipient.campaign_id, 'opened_count');
        }
        break;
      case 'clicked':
        if (!recipient.clicked_at) {
          recipientUpdate.status = 'clicked';
          recipientUpdate.clicked_at = now;
          // Increment campaign counter only on first click
          await this.incrementCampaignCounter(recipient.campaign_id, 'clicked_count');
        }
        break;
      case 'bounced':
        recipientUpdate.status = 'bounced';
        recipientUpdate.bounced_at = now;
        await this.incrementCampaignCounter(recipient.campaign_id, 'bounced_count');
        // Auto-add to blocklist
        await this.addToBlocklist(recipient.email, 'bounced', recipient.campaign_id);
        break;
      case 'unsubscribed':
        recipientUpdate.status = 'unsubscribed';
        recipientUpdate.unsubscribed_at = now;
        await this.incrementCampaignCounter(recipient.campaign_id, 'unsubscribed_count');
        // Add to blocklist
        await this.addToBlocklist(recipient.email, 'unsubscribed', recipient.campaign_id);
        break;
    }

    if (Object.keys(recipientUpdate).length > 0) {
      await this.db.update('outreach_recipients', { id: recipient.id }, recipientUpdate);
    }

    return { recipient, campaign };
  }

  // ==========================================
  // STATS
  // ==========================================

  async getCampaignStats(campaignId: string): Promise<Record<string, any> | null> {
    const campaign = await this.getCampaignRaw(campaignId);
    if (!campaign) return null;

    const recipients = await this.db.select('outreach_recipients', {
      where: { campaign_id: campaignId },
    });

    // Count by status
    const statusCounts: Record<string, number> = {};
    for (const r of recipients) {
      const status = r.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    const total = recipients.length;
    const sent = campaign.sent_count || 0;
    const opened = campaign.opened_count || 0;
    const clicked = campaign.clicked_count || 0;

    return {
      campaignId,
      name: campaign.name,
      status: campaign.status,
      totalRecipients: total,
      sentCount: sent,
      openedCount: opened,
      clickedCount: clicked,
      unsubscribedCount: campaign.unsubscribed_count || 0,
      bouncedCount: campaign.bounced_count || 0,
      openRate: sent > 0 ? ((opened / sent) * 100).toFixed(2) + '%' : '0%',
      clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(2) + '%' : '0%',
      clickToOpenRate: opened > 0 ? ((clicked / opened) * 100).toFixed(2) + '%' : '0%',
      recipientsByStatus: statusCounts,
      startedAt: campaign.started_at,
      completedAt: campaign.completed_at,
    };
  }

  async getOverallStats(): Promise<Record<string, any>> {
    const campaigns = await this.db.select('outreach_campaigns', {});
    const blocklist = await this.db.select('email_blocklist', {});

    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalBounced = 0;
    let totalUnsubscribed = 0;
    const campaignsByStatus: Record<string, number> = {};

    for (const c of campaigns) {
      totalSent += c.sent_count || 0;
      totalOpened += c.opened_count || 0;
      totalClicked += c.clicked_count || 0;
      totalBounced += c.bounced_count || 0;
      totalUnsubscribed += c.unsubscribed_count || 0;

      const status = c.status || 'unknown';
      campaignsByStatus[status] = (campaignsByStatus[status] || 0) + 1;
    }

    return {
      totalCampaigns: campaigns.length,
      campaignsByStatus,
      totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
      totalUnsubscribed,
      overallOpenRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) + '%' : '0%',
      overallClickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) + '%' : '0%',
      blocklistSize: blocklist.length,
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private async getCampaignRaw(id: string): Promise<any | null> {
    return this.db.findOne('outreach_campaigns', { id });
  }

  async markRecipientSent(recipientId: string): Promise<void> {
    await this.db.update('outreach_recipients', { id: recipientId }, {
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
  }

  async markRecipientError(recipientId: string, error: string): Promise<void> {
    await this.db.update('outreach_recipients', { id: recipientId }, {
      error_message: error,
    });
  }

  async markRecipientsQueued(recipientIds: string[]): Promise<void> {
    for (const id of recipientIds) {
      await this.db.update('outreach_recipients', { id }, { status: 'queued' });
    }
  }

  async incrementCampaignCounter(campaignId: string, field: string): Promise<void> {
    const campaign = await this.getCampaignRaw(campaignId);
    if (!campaign) return;

    const currentValue = campaign[field] || 0;
    await this.db.update('outreach_campaigns', { id: campaignId }, {
      [field]: currentValue + 1,
      updated_at: new Date().toISOString(),
    });
  }

  async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'active') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    await this.db.update('outreach_campaigns', { id: campaignId }, updateData);
  }

  private buildPersonalizationData(entity: any, mergedData: any): Record<string, any> {
    const skills = mergedData.skills || [];
    const sources = (mergedData.sources || []).map((s: any) => s.source);
    const uniqueSources = [...new Set(sources)];

    return {
      name: entity.canonical_name || 'there',
      firstName: (entity.canonical_name || '').split(' ')[0] || 'there',
      email: entity.normalized_email,
      skills: skills.slice(0, 5).join(', ') || 'your technical skills',
      location: entity.location || '',
      company: entity.company || '',
      primaryRole: mergedData.roles?.[0] || '',
      seniorityLevel: mergedData.seniorityLevel || '',
      sources: uniqueSources.join(', ') || 'public sources',
      github: entity.normalized_github || '',
    };
  }

  // ==========================================
  // TRANSFORMERS
  // ==========================================

  private transformCampaign(record: any): CampaignResponse {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      templateSubject: record.template_subject,
      templateHtml: record.template_html,
      templateText: record.template_text,
      fromAddress: record.from_address,
      fromName: record.from_name,
      replyTo: record.reply_to,
      targetFilters: record.target_filters || {},
      status: record.status,
      totalRecipients: record.total_recipients || 0,
      sentCount: record.sent_count || 0,
      openedCount: record.opened_count || 0,
      clickedCount: record.clicked_count || 0,
      unsubscribedCount: record.unsubscribed_count || 0,
      bouncedCount: record.bounced_count || 0,
      createdBy: record.created_by,
      scheduledAt: record.scheduled_at,
      startedAt: record.started_at,
      completedAt: record.completed_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  private transformRecipient(record: any): RecipientResponse {
    return {
      id: record.id,
      campaignId: record.campaign_id,
      unifiedEntityId: record.unified_entity_id,
      email: record.email,
      name: record.name,
      personalizationData: record.personalization_data || {},
      trackingToken: record.tracking_token,
      status: record.status,
      sentAt: record.sent_at,
      openedAt: record.opened_at,
      clickedAt: record.clicked_at,
      bouncedAt: record.bounced_at,
      unsubscribedAt: record.unsubscribed_at,
      errorMessage: record.error_message,
      createdAt: record.created_at,
    };
  }

  private transformBlocklistEntry(record: any): BlocklistEntry {
    return {
      id: record.id,
      email: record.email,
      reason: record.reason,
      sourceCampaignId: record.source_campaign_id,
      blockedAt: record.blocked_at,
    };
  }
}
