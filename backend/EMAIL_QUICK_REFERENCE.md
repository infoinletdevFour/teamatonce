# Email Service - Quick Reference

## Send Workspace Invitation

```typescript
import { EmailService } from '../../services/email.service';

@Injectable()
export class YourService {
  constructor(private readonly emailService: EmailService) {}

  async sendInvite() {
    await this.emailService.sendWorkspaceInvitation({
      to: 'user@example.com',
      inviteeName: 'John Doe',
      inviteeEmail: 'user@example.com',
      inviterName: 'Jane Smith',
      inviterEmail: 'jane@example.com',
      companyName: 'Acme Corp',
      companyLogo: 'https://example.com/logo.png', // optional
      accountType: 'Agency',
      role: 'developer',
      message: 'Join our team!', // optional
      inviteToken: 'abc123',
      expiresAt: new Date().toISOString(),
    });
  }
}
```

## Module Setup

```typescript
import { EmailService } from '../../services/email.service';

@Module({
  imports: [FluxezModule, ConfigModule],
  providers: [YourService, EmailService],
})
export class YourModule {}
```

## Environment Variables

```bash
# .env
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
FLUXEZ_API_KEY=service_xxxxx
FLUXEZ_ANON_KEY=anon_xxxxx
```

## Files Structure

```
backend/src/
├── templates/emails/
│   └── workspace-invitation.html    # HTML email template
├── services/
│   └── email.service.ts             # Email sending service
└── utils/
    └── email-template.util.ts       # Template utilities
```

## Common Template Variables

```typescript
{
  frontendUrl: string;      // Base URL
  inviteUrl: string;        // Full invite URL
  inviteeName: string;      // Recipient name
  inviteeEmail: string;     // Recipient email
  inviterName: string;      // Sender name
  companyName: string;      // Company name
  companyLogo?: string;     // Logo URL (optional)
  accountType: string;      // Account type
  role: string;             // Role name
  message?: string;         // Personal message (optional)
  expiryDays: string;       // Days until expiry
  expiryDate: string;       // Formatted date
  year: string;             // Current year
}
```

## Utility Functions

```typescript
import {
  renderEmailTemplate,
  htmlToPlainText,
  isValidEmail,
  formatEmailDate,
  getCompanyInitial,
} from '../utils/email-template.util';

// Render template
const html = renderEmailTemplate('workspace-invitation', variables);

// Convert HTML to text
const text = htmlToPlainText(html);

// Validate email
if (isValidEmail('user@example.com')) { /* valid */ }

// Format date
const date = formatEmailDate(new Date(), 'en-US');

// Get initial
const initial = getCompanyInitial('Acme Corp'); // 'A'
```

## Error Handling

```typescript
try {
  const success = await emailService.sendWorkspaceInvitation(data);

  if (!success) {
    console.warn('Email failed but operation continues');
  }
} catch (error) {
  // Errors are logged internally, won't block operation
  console.error('Email service error:', error);
}
```

## Testing

```typescript
// Send test email
await emailService.sendTestEmail('test@example.com');
```

## Template Syntax

### Variables
```html
<h1>Welcome to {{companyName}}</h1>
```

### Conditionals
```html
{{#if message}}
  <p>{{message}}</p>
{{/if}}
```

## Common Roles

- `owner` → "Owner"
- `admin` → "Administrator"
- `developer` → "Developer"
- `designer` → "Designer"
- `qa` → "QA Engineer"
- `project-manager` → "Project Manager"
- `team-lead` → "Team Lead"
- `member` → "Team Member"

## Account Types

- `freelancer` → "Freelancer"
- `agency` → "Agency"
- `company` → "Company"
- `enterprise` → "Enterprise"

## Troubleshooting

### Email not sending?
1. Check Fluxez API keys in `.env`
2. Verify EmailService is in module providers
3. Check console for error logs

### Template not found?
1. Verify file exists: `ls backend/src/templates/emails/`
2. Check template name matches (without `.html`)

### Variables not rendering?
1. Check variable names match template
2. Verify values are not `null` or `undefined`
3. Test with console.log

## Brand Colors

- Primary: `#667eea`
- Secondary: `#764ba2`
- Gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Background: `#f4f7f9`
- Text: `#333333`

## Email Best Practices

1. ✅ Always include plain text version
2. ✅ Validate email addresses before sending
3. ✅ Use inline CSS for styling
4. ✅ Test on multiple email clients
5. ✅ Keep max-width at 600px
6. ✅ Handle errors gracefully (don't block operations)
7. ✅ Include unsubscribe link (if applicable)
8. ✅ Use descriptive subject lines

---

**See**: [EMAIL_SERVICE_DOCUMENTATION.md](./EMAIL_SERVICE_DOCUMENTATION.md) for full details
