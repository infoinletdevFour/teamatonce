import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../modules/database/database.service';
import {
  renderEmailTemplate,
  htmlToPlainText,
  isValidEmail,
  formatEmailDate,
  getCompanyInitial,
} from '../utils/email-template.util';

/**
 * EmailService
 * Centralized email service for sending templated emails
 *
 * Features:
 * - Template-based email rendering
 * - HTML and plain text versions
 * - Error handling and logging
 * - Email validation
 * - Environment-aware sending
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;
  private readonly isDevelopment: boolean;

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    this.isDevelopment = this.config.get('NODE_ENV') === 'development';
  }

  /**
   * Send workspace invitation email
   * @param options - Invitation email options
   * @returns Success status
   */
  async sendWorkspaceInvitation(options: {
    to: string;
    inviteeName: string;
    inviteeEmail: string;
    inviterName: string;
    inviterEmail: string;
    companyName: string;
    companyLogo?: string;
    accountType: string;
    role: string;
    message?: string;
    inviteToken: string;
    expiresAt: string;
  }): Promise<boolean> {
    try {
      // Validate email
      if (!isValidEmail(options.to)) {
        this.logger.error(`Invalid email address: ${options.to}`);
        return false;
      }

      // Calculate expiry information
      const expiryDate = new Date(options.expiresAt);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Build invite URL
      const inviteUrl = `${this.frontendUrl}/invite/${options.inviteToken}`;

      // Prepare template variables
      const variables = {
        frontendUrl: this.frontendUrl,
        inviteUrl,
        inviteeName: options.inviteeName || 'there',
        inviteeEmail: options.inviteeEmail,
        inviterName: options.inviterName,
        inviterEmail: options.inviterEmail,
        companyName: options.companyName,
        companyLogo: options.companyLogo || '',
        companyInitial: getCompanyInitial(options.companyName),
        accountType: options.accountType,
        role: this.formatRole(options.role),
        message: options.message || '',
        expiryDays: daysUntilExpiry.toString(),
        expiryDate: formatEmailDate(expiryDate),
        year: new Date().getFullYear().toString(),
      };

      // Render HTML template
      const html = renderEmailTemplate('workspace-invitation', variables);

      // Generate plain text version
      const text = this.generateInvitationPlainText(variables);

      // Email subject
      const subject = `You've been invited to join ${options.companyName} on Team@Once`;

      // Send email via database
      await this.sendEmail(options.to, subject, html, text);

      this.logger.log(`Invitation email sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Send a generic email using database email service
   * @param to - Recipient email address(es)
   * @param subject - Email subject
   * @param html - HTML content
   * @param text - Plain text content (optional)
   * @returns Promise<void>
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    try {
      this.logger.log(`[EMAIL] Attempting to send email to: ${Array.isArray(to) ? to.join(', ') : to}`);
      this.logger.log(`[EMAIL] Subject: ${subject}`);

      // In development, log additional details
      if (this.isDevelopment) {
        this.logger.debug('='.repeat(80));
        this.logger.debug(`[EMAIL] To: ${Array.isArray(to) ? to.join(', ') : to}`);
        this.logger.debug(`[EMAIL] Subject: ${subject}`);
        this.logger.debug(`[EMAIL] Text preview: ${text?.substring(0, 200)}...`);
        this.logger.debug('='.repeat(80));
      }

      // Send via database
      const result = await /* TODO: use EmailService */ this.db.sendEmail(to, subject, html, text);
      this.logger.log(`[EMAIL] Email sent successfully via database:`, result);
    } catch (error) {
      this.logger.error(`[EMAIL] Failed to send email via database:`, error);
      this.logger.error(`[EMAIL] Error details:`, {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Format role name for display
   * @param role - Role identifier
   * @returns Formatted role name
   */
  private formatRole(role: string): string {
    const roleMap: Record<string, string> = {
      owner: 'Owner',
      admin: 'Administrator',
      developer: 'Developer',
      designer: 'Designer',
      qa: 'QA Engineer',
      'project-manager': 'Project Manager',
      'team-lead': 'Team Lead',
      member: 'Team Member',
    };

    return roleMap[role.toLowerCase()] || role;
  }

  /**
   * Generate plain text version of invitation email
   * @param variables - Template variables
   * @returns Plain text email content
   */
  private generateInvitationPlainText(variables: any): string {
    const lines = [
      `You've been invited to join ${variables.companyName}!`,
      '',
      `Hi ${variables.inviteeName},`,
      '',
      `${variables.inviterName} has invited you to join ${variables.companyName} on Team@Once as a ${variables.role}.`,
      '',
    ];

    if (variables.message) {
      lines.push(`Personal message from ${variables.inviterName}:`);
      lines.push(`"${variables.message}"`);
      lines.push('');
    }

    lines.push(
      'Accept your invitation:',
      variables.inviteUrl,
      '',
      'Your Details:',
      `- Role: ${variables.role}`,
      `- Email: ${variables.inviteeEmail}`,
      `- Invited by: ${variables.inviterName}`,
      '',
      `⏰ This invitation expires in ${variables.expiryDays} days (${variables.expiryDate})`,
      '',
      'What happens next?',
      '1. Click the link above to review and accept the invitation',
      '2. Create your account or sign in if you already have one',
      '3. Join the team and start collaborating immediately',
      '',
      'Why Team@Once?',
      '- Real-time collaboration - Chat, video calls, and whiteboard',
      '- Project transparency - Track progress and milestones',
      '- Secure payments - Milestone-based payment protection',
      '- AI-powered tools - Smart project estimation and matching',
      '',
      `Need help? Visit ${variables.frontendUrl}/contact`,
      '',
      "If you didn't expect this invitation, you can safely ignore this email.",
      '',
      '---',
      'Team@Once',
      'AI-Driven Development Outsourcing Platform',
      `© ${variables.year} Team@Once. All rights reserved.`,
    );

    return lines.join('\n');
  }

  /**
   * Send test email (for debugging)
   * @param to - Test recipient email
   * @returns Success status
   */
  async sendTestEmail(to: string): Promise<boolean> {
    try {
      await this.sendWorkspaceInvitation({
        to,
        inviteeName: 'John Doe',
        inviteeEmail: to,
        inviterName: 'Jane Smith',
        inviterEmail: 'jane@example.com',
        companyName: 'Acme Corporation',
        companyLogo: 'https://via.placeholder.com/60',
        accountType: 'Premium',
        role: 'developer',
        message: 'We would love to have you on our team! Looking forward to working together.',
        inviteToken: 'test-token-123456',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to send test email:`, error);
      return false;
    }
  }
}
