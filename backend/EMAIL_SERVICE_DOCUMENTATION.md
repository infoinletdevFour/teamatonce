# Email Service Documentation

## Overview

The Email Service provides a centralized, professional email system for the Team@Once platform, featuring:

- **Beautiful HTML Templates**: Responsive, professionally designed email templates
- **Template Engine**: Simple but powerful variable substitution and conditional rendering
- **Email Service Integration**: Seamless integration with Fluxez email API
- **Error Handling**: Graceful failure handling that won't block operations
- **Development Mode**: Console logging in development for debugging

## Architecture

```
backend/
├── src/
│   ├── templates/
│   │   └── emails/
│   │       └── workspace-invitation.html    # Professional invitation template
│   ├── services/
│   │   └── email.service.ts                 # Email sending service
│   └── utils/
│       └── email-template.util.ts           # Template rendering utilities
```

## Email Templates

### Template Location

All email templates are stored in:
```
backend/src/templates/emails/
```

### Current Templates

#### 1. Workspace Invitation (`workspace-invitation.html`)

A beautifully designed, responsive email template for team invitations featuring:

- **Gradient Header**: Eye-catching purple gradient design
- **Company Branding**: Displays company logo or initial
- **Role Badge**: Highlighted role information
- **Personal Message Section**: Optional custom message from inviter
- **Clear CTA Button**: Prominent "Accept Invitation" button
- **Information Cards**: Clean display of invitation details
- **Expiry Notice**: Time-sensitive alert with countdown
- **Responsive Design**: Mobile-optimized layout
- **Professional Footer**: Links and branding

### Template Variables

The invitation template supports the following variables:

```typescript
{
  frontendUrl: string;          // Base URL for the frontend
  inviteUrl: string;            // Full invitation acceptance URL
  inviteeName: string;          // Name of person being invited
  inviteeEmail: string;         // Email of invitee
  inviterName: string;          // Name of person sending invite
  inviterEmail: string;         // Email of inviter
  companyName: string;          // Company/workspace name
  companyLogo?: string;         // Company logo URL (optional)
  companyInitial: string;       // First letter of company name
  accountType: string;          // Account type (Freelancer, Agency, etc.)
  role: string;                 // Role being offered
  message?: string;             // Personal message (optional)
  expiryDays: string;           // Days until expiration
  expiryDate: string;           // Formatted expiry date
  year: string;                 // Current year
}
```

### Template Syntax

The template engine supports:

#### Variable Substitution
```html
<h1>Welcome to {{companyName}}</h1>
```

#### Conditional Blocks
```html
{{#if message}}
  <p>Message: {{message}}</p>
{{/if}}
```

## Email Service

### Location
```
backend/src/services/email.service.ts
```

### Key Features

1. **Template Rendering**: Automatically loads and renders HTML templates
2. **Plain Text Generation**: Creates text versions for better deliverability
3. **Email Validation**: Validates email addresses before sending
4. **Error Handling**: Logs errors without blocking operations
5. **Development Mode**: Debug logging in development environment

### Usage

#### In a Service

```typescript
import { EmailService } from '../../services/email.service';

@Injectable()
export class YourService {
  constructor(private readonly emailService: EmailService) {}

  async sendInvitation(invitationData: any) {
    const success = await this.emailService.sendWorkspaceInvitation({
      to: 'user@example.com',
      inviteeName: 'John Doe',
      inviteeEmail: 'user@example.com',
      inviterName: 'Jane Smith',
      inviterEmail: 'jane@example.com',
      companyName: 'Acme Corp',
      companyLogo: 'https://example.com/logo.png',
      accountType: 'Agency',
      role: 'developer',
      message: 'We would love to have you on our team!',
      inviteToken: 'abc123def456',
      expiresAt: '2025-11-03T12:00:00Z',
    });

    return success;
  }
}
```

#### Module Registration

Add EmailService to your module's providers:

```typescript
@Module({
  imports: [FluxezModule, ConfigModule],
  providers: [YourService, EmailService],
  exports: [YourService],
})
export class YourModule {}
```

## Template Utilities

### Location
```
backend/src/utils/email-template.util.ts
```

### Available Functions

#### `renderEmailTemplate(templateName, variables)`
Loads and renders an email template with variables.

```typescript
import { renderEmailTemplate } from '../utils/email-template.util';

const html = renderEmailTemplate('workspace-invitation', {
  companyName: 'Acme Corp',
  inviteeName: 'John Doe',
  // ... other variables
});
```

#### `htmlToPlainText(html)`
Converts HTML to plain text for email clients that don't support HTML.

```typescript
import { htmlToPlainText } from '../utils/email-template.util';

const text = htmlToPlainText('<h1>Hello</h1><p>World</p>');
// Result: "Hello World"
```

#### `isValidEmail(email)`
Validates email address format.

```typescript
import { isValidEmail } from '../utils/email-template.util';

if (isValidEmail('user@example.com')) {
  // Email is valid
}
```

#### `formatEmailDate(date, locale)`
Formats dates for display in emails.

```typescript
import { formatEmailDate } from '../utils/email-template.util';

const formatted = formatEmailDate(new Date(), 'en-US');
// Result: "October 27, 2025"
```

#### `getCompanyInitial(companyName)`
Gets the first letter of company name for logo placeholders.

```typescript
import { getCompanyInitial } from '../utils/email-template.util';

const initial = getCompanyInitial('Acme Corp');
// Result: "A"
```

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Frontend URL for email links
FRONTEND_URL=http://localhost:5173

# Node environment (affects debug logging)
NODE_ENV=development

# Fluxez API keys (for email sending)
FLUXEZ_API_KEY=service_xxxxx
FLUXEZ_ANON_KEY=anon_xxxxx
```

### Email Provider (Fluxez)

The email service uses Fluxez's built-in email functionality. No additional SMTP configuration is needed.

## Creating New Email Templates

### Step 1: Create HTML Template

Create a new file in `backend/src/templates/emails/`:

```bash
touch backend/src/templates/emails/your-template.html
```

### Step 2: Design Template

Use the workspace invitation template as a reference. Key guidelines:

- Use inline CSS for maximum compatibility
- Keep max-width at 600px for email clients
- Use tables for complex layouts (optional but recommended)
- Include both HTML and plain text versions
- Test on multiple email clients

### Step 3: Add Service Method

Add a new method to `EmailService`:

```typescript
async sendYourEmail(options: {
  to: string;
  // ... your options
}): Promise<boolean> {
  try {
    // Prepare variables
    const variables = {
      // ... map options to template variables
    };

    // Render template
    const html = renderEmailTemplate('your-template', variables);
    const text = this.generateYourPlainText(variables);

    // Send email
    await this.sendEmail(options.to, 'Subject', html, text);

    return true;
  } catch (error) {
    this.logger.error('Send email failed:', error);
    return false;
  }
}
```

## Testing

### Test Email Endpoint

The EmailService includes a test method:

```typescript
// In a controller or service
await this.emailService.sendTestEmail('test@example.com');
```

### Development Mode

In development, emails are logged to console instead of being sent:

```
================================================================================
[EMAIL] To: user@example.com
[EMAIL] Subject: You've been invited to join Acme Corp on Team@Once
[EMAIL] Text: You've been invited to join Acme Corp!...
================================================================================
```

### Manual Testing

1. Start the backend server
2. Create an invitation through the API
3. Check console logs for email content
4. Verify HTML rendering by copying to an HTML file

## Best Practices

### 1. Error Handling

Always handle email failures gracefully:

```typescript
const success = await emailService.sendWorkspaceInvitation(data);

if (!success) {
  // Log warning but don't block the operation
  console.warn('Failed to send invitation email');
}
```

### 2. Email Validation

Always validate emails before sending:

```typescript
import { isValidEmail } from '../utils/email-template.util';

if (!isValidEmail(email)) {
  throw new BadRequestException('Invalid email address');
}
```

### 3. Template Variables

Provide fallback values for optional variables:

```typescript
const variables = {
  inviteeName: invitation.name || 'there',
  message: invitation.message || '',
  companyLogo: company.logo_url || '',
};
```

### 4. Plain Text Versions

Always include plain text versions for better deliverability:

```typescript
const text = this.generatePlainTextVersion(variables);
await this.sendEmail(to, subject, html, text);
```

### 5. URL Building

Use environment variables for URLs:

```typescript
const inviteUrl = `${this.frontendUrl}/invite/${token}`;
```

## Troubleshooting

### Email Not Sending

1. **Check Fluxez API Keys**:
   ```bash
   echo $FLUXEZ_API_KEY
   echo $FLUXEZ_ANON_KEY
   ```

2. **Verify Service Configuration**:
   ```typescript
   // Check if EmailService is registered in module providers
   ```

3. **Check Console Logs**:
   ```bash
   # Look for email-related errors
   [EmailService] Failed to send...
   ```

### Template Not Found

1. **Verify Template Path**:
   ```bash
   ls -la backend/src/templates/emails/
   ```

2. **Check Template Name**:
   ```typescript
   // Ensure name matches file name (without .html)
   renderEmailTemplate('workspace-invitation', variables);
   ```

### Template Not Rendering

1. **Check Variable Names**: Ensure template variables match the data object
2. **Test Syntax**: Verify `{{variable}}` and `{{#if}}` syntax
3. **Debug Output**: Log the rendered HTML to console

### Styling Issues

1. **Use Inline CSS**: Email clients strip `<style>` tags
2. **Avoid Complex CSS**: Use simple, well-supported properties
3. **Test Multiple Clients**: Test in Gmail, Outlook, Apple Mail, etc.

## Email Template Design Guidelines

### Colors

Use the Team@Once brand colors:
- Primary: `#667eea` (Purple)
- Secondary: `#764ba2` (Dark Purple)
- Gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Background: `#f4f7f9`
- Text: `#333333`
- Muted: `#6c757d`

### Typography

- Font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`
- Line Height: `1.6` for body text
- Sizes:
  - Heading: `24-32px`
  - Body: `16px`
  - Small: `14px`
  - Tiny: `12px`

### Layout

- Max Width: `600px`
- Padding: `30-40px` on desktop, `20px` on mobile
- Border Radius: `12-16px` for cards
- Spacing: `20-30px` between sections

### Buttons

- Padding: `16px 40px`
- Border Radius: `12px`
- Font Weight: `600`
- Font Size: `16px`
- Background: Gradient or solid brand color
- Shadow: `0 4px 15px rgba(102, 126, 234, 0.4)`

## Integration Example

Here's how the invitation service integrates with the email service:

```typescript
// invitation.service.ts
private async sendInvitationEmail(invitation: any): Promise<void> {
  try {
    // Fetch related data
    const company = await this.fluxez.findOne('developer_companies', {
      id: invitation.company_id
    });
    const inviter = await this.fluxez.getUserById(invitation.invited_by);

    // Send email
    await this.emailService.sendWorkspaceInvitation({
      to: invitation.email,
      inviteeName: invitation.name || invitation.email.split('@')[0],
      inviteeEmail: invitation.email,
      inviterName: inviter?.name || 'A team member',
      inviterEmail: inviter?.email || '',
      companyName: company.company_name || 'the team',
      companyLogo: company.logo_url,
      accountType: this.formatAccountType(company.account_type),
      role: invitation.role,
      message: invitation.message,
      inviteToken: invitation.token,
      expiresAt: invitation.expires_at,
    });
  } catch (error) {
    // Log error but don't fail invitation creation
    console.error('Failed to send invitation email:', error);
  }
}
```

## Future Enhancements

Potential improvements to consider:

1. **Email Templates**:
   - Welcome email
   - Password reset
   - Project notifications
   - Payment confirmations
   - Team member removed
   - Milestone completed

2. **Features**:
   - Email queuing for bulk sends
   - Email retry logic
   - Delivery tracking
   - Open/click tracking
   - A/B testing
   - Localization support

3. **Testing**:
   - Email preview API endpoint
   - Visual regression testing
   - Spam score checking
   - Multi-client testing automation

4. **Analytics**:
   - Email delivery rates
   - Open rates
   - Click-through rates
   - Conversion tracking

## Support

For questions or issues:

1. Check this documentation
2. Review the code comments in:
   - `services/email.service.ts`
   - `utils/email-template.util.ts`
   - `modules/company/invitation.service.ts`
3. Check console logs for error details
4. Test with the `sendTestEmail()` method

---

**Last Updated**: October 27, 2025
**Version**: 1.0.0
