import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EmailService } from '../../services/email.service';
import { isValidEmail } from '../../utils/email-template.util';

/**
 * Email Test Controller
 * Provides endpoints for testing email templates (development only)
 *
 * IMPORTANT: This controller should only be enabled in development/staging environments
 * Remove or disable in production
 */
@ApiTags('Email Testing (Dev Only)')
@Controller('api/v1/test/email')
export class EmailTestController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Send test workspace invitation email
   * @param body - Test email data
   * @returns Success response
   */
  @Post('invitation')
  @ApiOperation({
    summary: 'Send test invitation email',
    description: 'Send a test workspace invitation email (development only)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          example: 'test@example.com',
          description: 'Recipient email address',
        },
        inviteeName: {
          type: 'string',
          example: 'John Doe',
          description: 'Name of person being invited',
        },
        inviterName: {
          type: 'string',
          example: 'Jane Smith',
          description: 'Name of person sending invite',
        },
        companyName: {
          type: 'string',
          example: 'Acme Corporation',
          description: 'Company name',
        },
        role: {
          type: 'string',
          example: 'developer',
          description: 'Role being offered',
        },
        message: {
          type: 'string',
          example: 'We would love to have you on our team!',
          description: 'Personal message (optional)',
        },
      },
      required: ['to'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Test email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email address or request',
  })
  async sendTestInvitation(
    @Body()
    body: {
      to: string;
      inviteeName?: string;
      inviterName?: string;
      companyName?: string;
      role?: string;
      message?: string;
    },
  ) {
    // Validate email
    if (!isValidEmail(body.to)) {
      throw new BadRequestException('Invalid email address');
    }

    // Send test email with provided or default data
    const success = await this.emailService.sendWorkspaceInvitation({
      to: body.to,
      inviteeName: body.inviteeName || 'John Doe',
      inviteeEmail: body.to,
      inviterName: body.inviterName || 'Jane Smith',
      inviterEmail: 'jane@example.com',
      companyName: body.companyName || 'Acme Corporation',
      companyLogo: 'https://via.placeholder.com/60/667eea/ffffff?text=AC',
      accountType: 'Agency',
      role: body.role || 'developer',
      message: body.message || 'We would love to have you on our team! Looking forward to working together on exciting projects.',
      inviteToken: 'test-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (success) {
      return {
        success: true,
        message: `Test invitation email sent to ${body.to}`,
      };
    } else {
      throw new BadRequestException('Failed to send test email');
    }
  }

  /**
   * Send quick test email with default values
   * @param body - Email recipient
   * @returns Success response
   */
  @Post('quick')
  @ApiOperation({
    summary: 'Send quick test email',
    description: 'Send a test email with all default values',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          example: 'test@example.com',
          description: 'Recipient email address',
        },
      },
      required: ['to'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Test email sent successfully',
  })
  async sendQuickTest(@Body('to') to: string) {
    if (!isValidEmail(to)) {
      throw new BadRequestException('Invalid email address');
    }

    const success = await this.emailService.sendTestEmail(to);

    if (success) {
      return {
        success: true,
        message: `Test email sent to ${to}`,
      };
    } else {
      throw new BadRequestException('Failed to send test email');
    }
  }
}
