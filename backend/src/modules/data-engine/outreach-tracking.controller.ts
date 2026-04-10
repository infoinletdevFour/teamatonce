import { Controller, Get, Post, Param, Query, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { OutreachService } from './services/outreach.service';

// 1x1 transparent GIF pixel (43 bytes)
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

/**
 * Public Outreach Tracking Controller
 * NO auth guard - these endpoints are accessed by email clients and recipients
 */
@ApiTags('Outreach Tracking')
@Controller('data-engine')
export class OutreachTrackingController {
  constructor(private readonly outreachService: OutreachService) {}

  // ==========================================
  // OPEN TRACKING
  // ==========================================

  @Get('track/open/:token')
  @ApiOperation({ summary: 'Track email open (returns 1x1 pixel)' })
  @ApiResponse({ status: 200, description: 'Tracking pixel returned' })
  async trackOpen(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Record the open event asynchronously (don't block pixel response)
    this.outreachService
      .recordEvent(token, 'opened', {
        userAgent: req.headers['user-agent'] || '',
        ip: req.ip || req.headers['x-forwarded-for'] || '',
        timestamp: new Date().toISOString(),
      })
      .catch(() => {
        // Silently ignore tracking errors
      });

    // Return 1x1 transparent GIF
    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': TRACKING_PIXEL.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    res.status(200).send(TRACKING_PIXEL);
  }

  // ==========================================
  // CLICK TRACKING
  // ==========================================

  @Get('track/click/:token')
  @ApiOperation({ summary: 'Track email click (redirects to target URL)' })
  @ApiResponse({ status: 302, description: 'Redirect to target URL' })
  async trackClick(
    @Param('token') token: string,
    @Query('url') url: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const targetUrl = url ? decodeURIComponent(url) : null;

    // Record click event asynchronously
    this.outreachService
      .recordEvent(token, 'clicked', {
        url: targetUrl,
        userAgent: req.headers['user-agent'] || '',
        ip: req.ip || req.headers['x-forwarded-for'] || '',
        timestamp: new Date().toISOString(),
      })
      .catch(() => {
        // Silently ignore tracking errors
      });

    // Redirect to target URL or fallback
    if (targetUrl) {
      res.redirect(302, targetUrl);
    } else {
      res.redirect(302, 'https://teamatonce.com');
    }
  }

  // ==========================================
  // UNSUBSCRIBE
  // ==========================================

  @Get('unsubscribe/:token')
  @ApiOperation({ summary: 'Show unsubscribe confirmation page' })
  @ApiResponse({ status: 200, description: 'Unsubscribe page returned' })
  async showUnsubscribePage(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const recipient = await this.outreachService.getRecipientByToken(token);

    if (!recipient) {
      res.status(404).send(this.renderErrorPage('Invalid or expired unsubscribe link.'));
      return;
    }

    const email = recipient.email;
    const alreadyUnsubscribed = recipient.status === 'unsubscribed';

    res.status(200).send(this.renderUnsubscribePage(token, email, alreadyUnsubscribed));
  }

  @Post('unsubscribe/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process unsubscribe request' })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  async processUnsubscribe(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const result = await this.outreachService.recordEvent(token, 'unsubscribed', {
      timestamp: new Date().toISOString(),
    });

    if (!result) {
      res.status(404).send(this.renderErrorPage('Invalid or expired unsubscribe link.'));
      return;
    }

    res.status(200).send(this.renderConfirmationPage(result.recipient.email));
  }

  // ==========================================
  // HTML PAGE RENDERERS
  // ==========================================

  private renderUnsubscribePage(token: string, email: string, alreadyUnsubscribed: boolean): string {
    if (alreadyUnsubscribed) {
      return this.renderConfirmationPage(email);
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe - Team@Once</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .container { background: #fff; border-radius: 16px; padding: 40px; max-width: 500px; width: 90%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .logo { font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; }
    h2 { color: #333; margin-bottom: 12px; }
    p { color: #666; line-height: 1.6; margin-bottom: 24px; }
    .email { font-weight: 600; color: #333; }
    .btn { display: inline-block; padding: 14px 36px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; border: none; }
    .btn-unsubscribe { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
    .btn-cancel { background: #f0f0f0; color: #666; margin-left: 12px; }
    form { display: inline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Team@Once</div>
    <h2>Unsubscribe</h2>
    <p>Are you sure you want to unsubscribe <span class="email">${this.escapeHtml(email)}</span> from future outreach emails?</p>
    <form method="POST" action="/api/v1/data-engine/unsubscribe/${token}">
      <button type="submit" class="btn btn-unsubscribe">Unsubscribe</button>
    </form>
    <a href="https://teamatonce.com" class="btn btn-cancel">Cancel</a>
  </div>
</body>
</html>`;
  }

  private renderConfirmationPage(email: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed - Team@Once</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .container { background: #fff; border-radius: 16px; padding: 40px; max-width: 500px; width: 90%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .logo { font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; }
    .check { font-size: 48px; margin-bottom: 16px; }
    h2 { color: #333; margin-bottom: 12px; }
    p { color: #666; line-height: 1.6; }
    .email { font-weight: 600; color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Team@Once</div>
    <div class="check">&#10003;</div>
    <h2>You've been unsubscribed</h2>
    <p><span class="email">${this.escapeHtml(email)}</span> has been removed from our outreach list. You will no longer receive outreach emails from us.</p>
    <p style="margin-top: 24px; font-size: 14px; color: #999;">If this was a mistake, please contact us at support@teamatonce.com</p>
  </div>
</body>
</html>`;
  }

  private renderErrorPage(message: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Team@Once</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .container { background: #fff; border-radius: 16px; padding: 40px; max-width: 500px; width: 90%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .logo { font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; }
    h2 { color: #333; margin-bottom: 12px; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Team@Once</div>
    <h2>Something went wrong</h2>
    <p>${this.escapeHtml(message)}</p>
  </div>
</body>
</html>`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
