# Email Testing Guide

## Quick Start Testing

### 1. Preview the Email Template

Open the preview file in your browser:

```bash
open backend/src/templates/emails/PREVIEW.html
# or
firefox backend/src/templates/emails/PREVIEW.html
# or
chrome backend/src/templates/emails/PREVIEW.html
```

This shows exactly how the email looks with sample data.

### 2. Test with API (Development Mode)

#### Step 1: Start the Backend

```bash
cd backend
npm run start:dev
```

#### Step 2: Send Test Email

**Quick Test (Default Values):**
```bash
curl -X POST http://localhost:3001/api/v1/test/email/quick \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

**Custom Test:**
```bash
curl -X POST http://localhost:3001/api/v1/test/email/invitation \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "inviteeName": "John Doe",
    "inviterName": "Jane Smith",
    "companyName": "Acme Corp",
    "role": "developer",
    "message": "Looking forward to working with you!"
  }'
```

#### Step 3: Check Console Output

In development mode, emails are logged to console:

```
================================================================================
[EMAIL] To: your-email@example.com
[EMAIL] Subject: You've been invited to join Acme Corp on Team@Once
[EMAIL] Text: You've been invited to join Acme Corp!...
================================================================================
```

### 3. Test with Swagger UI

1. Go to: http://localhost:3001/api
2. Find section: **"Email Testing (Dev Only)"**
3. Expand: `POST /api/v1/test/email/quick`
4. Click: **"Try it out"**
5. Enter your email in the request body
6. Click: **"Execute"**
7. Check response and your inbox

## Testing Scenarios

### Scenario 1: Basic Invitation

Test the basic email with minimal data:

```bash
curl -X POST http://localhost:3001/api/v1/test/email/invitation \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "inviteeName": "Test User",
    "inviterName": "Admin",
    "companyName": "Test Company",
    "role": "developer"
  }'
```

**Expected**: Email with default styling, no custom message.

### Scenario 2: Invitation with Personal Message

Test with a custom message:

```bash
curl -X POST http://localhost:3001/api/v1/test/email/invitation \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "inviteeName": "Jane Developer",
    "inviterName": "John Manager",
    "companyName": "Acme Corporation",
    "role": "designer",
    "message": "We are excited to have you join our creative team!"
  }'
```

**Expected**: Email includes the personal message section.

### Scenario 3: Different Roles

Test how different roles are displayed:

```bash
# Developer Role
curl -X POST http://localhost:3001/api/v1/test/email/invitation \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "role": "developer"}'

# Designer Role
curl -X POST http://localhost:3001/api/v1/test/email/invitation \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "role": "designer"}'

# QA Engineer Role
curl -X POST http://localhost:3001/api/v1/test/email/invitation \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "role": "qa"}'

# Admin Role
curl -X POST http://localhost:3001/api/v1/test/email/invitation \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "role": "admin"}'
```

**Expected**: Each role is properly formatted and displayed.

### Scenario 4: Real Invitation Flow

Test through the actual invitation endpoint:

```bash
# 1. Login and get JWT token
TOKEN="your-jwt-token"

# 2. Create actual invitation
curl -X POST http://localhost:3001/api/v1/company/{companyId}/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "newmember@example.com",
    "name": "New Member",
    "role": "developer",
    "message": "Welcome to our team!"
  }'
```

**Expected**: Invitation created and email sent automatically.

## Testing Checklist

### Visual Testing

- [ ] Preview file opens correctly
- [ ] Template renders without errors
- [ ] Colors match brand guidelines
- [ ] Text is readable
- [ ] Images/icons display properly
- [ ] Layout is clean and organized
- [ ] Mobile responsive (resize browser)
- [ ] No broken elements

### Functional Testing

- [ ] Quick test endpoint works
- [ ] Custom test endpoint works
- [ ] Variables are substituted correctly
- [ ] Conditional sections work (message, logo)
- [ ] Links are functional
- [ ] Email validation works
- [ ] Invalid email returns error
- [ ] Success response returned

### Integration Testing

- [ ] EmailService is properly injected
- [ ] InvitationService uses EmailService
- [ ] Email sent on invitation creation
- [ ] Email failures don't block operations
- [ ] Errors are logged properly
- [ ] Company details fetched correctly
- [ ] Inviter details fetched correctly

### Content Testing

- [ ] Subject line is clear
- [ ] Greeting includes invitee name
- [ ] Company name is displayed
- [ ] Role is formatted properly
- [ ] Personal message appears (if provided)
- [ ] Expiry date is calculated correctly
- [ ] Footer links are correct
- [ ] Plain text version generated

### Email Client Testing

Test in these email clients:

#### Desktop Webmail
- [ ] Gmail (web)
- [ ] Outlook.com (web)
- [ ] Yahoo Mail (web)
- [ ] Apple iCloud Mail (web)

#### Desktop Clients
- [ ] Outlook (Windows)
- [ ] Apple Mail (macOS)
- [ ] Thunderbird

#### Mobile Clients
- [ ] Gmail (iOS)
- [ ] Gmail (Android)
- [ ] Apple Mail (iOS)
- [ ] Samsung Email (Android)

## Testing Tools

### 1. Browser Developer Tools

Test responsive design:
1. Open preview file in browser
2. Open developer tools (F12)
3. Toggle device toolbar (Ctrl+Shift+M)
4. Test different screen sizes

### 2. Email Testing Services

#### Litmus (Professional)
```
1. Copy email HTML
2. Go to litmus.com
3. Paste HTML
4. Test across 90+ email clients
```

#### Mail Tester (Free)
```
1. Send test email to provided address
2. Go to mail-tester.com
3. Check spam score
4. Review recommendations
```

#### Email on Acid (Professional)
```
1. Copy email HTML
2. Go to emailonacid.com
3. Run email preview test
4. Check rendering and compatibility
```

### 3. Console Logging

In development mode, check console for:
- Email content preview
- Template variables
- Error messages
- Success confirmations

### 4. Swagger UI

Interactive API testing:
1. Navigate to http://localhost:3001/api
2. Find "Email Testing" section
3. Test endpoints interactively
4. View request/response details

## Common Issues & Solutions

### Issue: Email Not Sending

**Symptoms**: No email received, no error in console

**Solutions**:
1. Check Fluxez API keys:
   ```bash
   echo $FLUXEZ_API_KEY
   echo $FLUXEZ_ANON_KEY
   ```

2. Verify EmailService is registered:
   ```typescript
   // In company.module.ts
   providers: [EmailService]
   ```

3. Check console for errors:
   ```
   [EmailService] Failed to send...
   ```

4. Test with quick endpoint first:
   ```bash
   curl -X POST http://localhost:3001/api/v1/test/email/quick \
     -H "Content-Type: application/json" \
     -d '{"to": "test@example.com"}'
   ```

### Issue: Template Not Rendering

**Symptoms**: Variables show as {{variable}} in email

**Solutions**:
1. Check template file exists:
   ```bash
   ls -la backend/src/templates/emails/workspace-invitation.html
   ```

2. Verify variable names match:
   ```typescript
   // Template: {{companyName}}
   // Code: companyName: 'Acme Corp'
   ```

3. Check for syntax errors:
   ```html
   <!-- Correct -->
   {{#if message}}...{{/if}}

   <!-- Incorrect -->
   {{#if message}}...{{/endif}}
   ```

### Issue: Styling Broken

**Symptoms**: Email looks plain or unstyled

**Solutions**:
1. Ensure CSS is inline:
   ```html
   <!-- Correct -->
   <div style="color: #333;">Text</div>

   <!-- Incorrect -->
   <div class="text">Text</div>
   ```

2. Use simple CSS properties:
   - Avoid: flexbox, grid, transform
   - Use: table layouts, inline-block

3. Test in Outlook (most restrictive client)

### Issue: Images Not Loading

**Symptoms**: Broken image icons in email

**Solutions**:
1. Use absolute URLs:
   ```html
   <!-- Correct -->
   <img src="https://example.com/logo.png">

   <!-- Incorrect -->
   <img src="/logo.png">
   ```

2. Verify image URLs are accessible:
   ```bash
   curl -I https://example.com/logo.png
   ```

3. Provide fallback for company logo:
   ```html
   {{#if companyLogo}}
     <img src="{{companyLogo}}">
   {{else}}
     <div>{{companyInitial}}</div>
   {{/if}}
   ```

## Performance Testing

### Test Email Delivery Time

```bash
time curl -X POST http://localhost:3001/api/v1/test/email/quick \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

**Expected**: < 2 seconds

### Test Email Size

```bash
# Check HTML size
wc -c backend/src/templates/emails/workspace-invitation.html
```

**Recommended**: < 100KB

### Test Template Rendering

```typescript
import { renderEmailTemplate } from './utils/email-template.util';

const start = Date.now();
const html = renderEmailTemplate('workspace-invitation', variables);
const duration = Date.now() - start;

console.log(`Rendering took ${duration}ms`);
```

**Expected**: < 10ms

## Automated Testing

### Unit Tests

Create tests for email utilities:

```typescript
// email-template.util.spec.ts
describe('Email Template Utils', () => {
  it('should render template with variables', () => {
    const template = '<h1>{{name}}</h1>';
    const result = renderTemplate(template, { name: 'John' });
    expect(result).toBe('<h1>John</h1>');
  });

  it('should handle conditional blocks', () => {
    const template = '{{#if show}}<p>Visible</p>{{/if}}';
    const result = renderTemplate(template, { show: true });
    expect(result).toContain('<p>Visible</p>');
  });

  it('should validate email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });
});
```

### Integration Tests

Test email service:

```typescript
// email.service.spec.ts
describe('EmailService', () => {
  it('should send workspace invitation', async () => {
    const result = await emailService.sendWorkspaceInvitation({
      to: 'test@example.com',
      inviteeName: 'Test',
      // ... other fields
    });
    expect(result).toBe(true);
  });

  it('should handle invalid email', async () => {
    const result = await emailService.sendWorkspaceInvitation({
      to: 'invalid-email',
      // ... other fields
    });
    expect(result).toBe(false);
  });
});
```

## Production Testing

Before deploying to production:

1. **Test with Real Email Addresses**
   - Send to multiple email providers
   - Verify receipt in inbox (not spam)
   - Test all links work

2. **Test Email Deliverability**
   - Check spam score
   - Verify SPF/DKIM/DMARC settings
   - Test with spam filter testing tools

3. **Monitor Email Sending**
   - Set up logging/monitoring
   - Track delivery rates
   - Monitor bounce rates
   - Track open rates (if applicable)

4. **Load Testing**
   - Test bulk invitation sending
   - Verify email queue handling
   - Check for rate limiting issues

## Test Reporting

### Test Report Template

```markdown
## Email Test Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Development/Staging/Production]

### Test Results

- ✅ Template Preview: PASS
- ✅ Quick Test Endpoint: PASS
- ✅ Custom Test Endpoint: PASS
- ✅ Variable Substitution: PASS
- ✅ Conditional Rendering: PASS
- ✅ Mobile Responsive: PASS
- ✅ Email Validation: PASS
- ✅ Error Handling: PASS

### Email Client Testing

- ✅ Gmail (web): PASS
- ✅ Outlook (web): PASS
- ✅ Apple Mail: PASS
- ✅ Mobile (iOS): PASS

### Issues Found

1. [Issue description]
   - Severity: High/Medium/Low
   - Status: Fixed/Pending
   - Notes: [Details]

### Recommendations

- [Recommendation 1]
- [Recommendation 2]

### Sign-off

Tested by: [Name]
Date: [Date]
Status: Ready for Production ✅
```

## Next Steps After Testing

1. ✅ All tests pass
2. ✅ Email template approved
3. ✅ Documentation reviewed
4. ✅ Production deployment planned
5. ✅ Monitoring configured
6. ✅ Rollback plan ready

---

**Happy Testing!** 🚀

For questions, see:
- [EMAIL_SERVICE_DOCUMENTATION.md](./EMAIL_SERVICE_DOCUMENTATION.md)
- [EMAIL_QUICK_REFERENCE.md](./EMAIL_QUICK_REFERENCE.md)
