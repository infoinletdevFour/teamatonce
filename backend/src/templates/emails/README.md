# Email Templates

This directory contains HTML email templates for the Team@Once platform.

## Available Templates

### workspace-invitation.html
Professional team invitation email template featuring:
- Responsive design (mobile-optimized)
- Company branding (logo/initial)
- Role badge and invitation details
- Personal message section (optional)
- Clear call-to-action button
- Expiry notice
- Information cards
- Professional footer

## Template Syntax

### Variables
```html
<h1>{{variableName}}</h1>
```

### Conditional Blocks
```html
{{#if variableName}}
  <p>Content shown if variable is truthy</p>
{{/if}}
```

## Creating New Templates

1. **Create HTML file** in this directory
2. **Use inline CSS** for maximum email client compatibility
3. **Keep max-width at 600px** for standard email width
4. **Test on multiple email clients** (Gmail, Outlook, Apple Mail)
5. **Provide both HTML and plain text** versions

## Template Guidelines

### Styling
- Use inline CSS (external stylesheets are stripped)
- Avoid complex CSS (flexbox, grid may not work)
- Use tables for complex layouts (optional but more compatible)
- Test on multiple email clients

### Images
- Use absolute URLs for images
- Provide alt text for accessibility
- Consider fallbacks for blocked images
- Optimize image sizes for faster loading

### Links
- Use absolute URLs
- Include descriptive link text
- Avoid using link shorteners
- Test all links before sending

### Text
- Keep subject lines under 50 characters
- Use clear, concise copy
- Include call-to-action above the fold
- Provide plain text alternative

## Testing Templates

### Method 1: Test Controller (Development)
```bash
curl -X POST http://localhost:3001/api/v1/test/email/quick \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

### Method 2: Copy HTML to File
1. Copy template HTML
2. Replace `{{variables}}` with actual values
3. Open in browser
4. Test responsive design

### Method 3: Email Testing Services
- [Litmus](https://litmus.com/) - Professional email testing
- [Email on Acid](https://www.emailonacid.com/) - Multi-client testing
- [Mail Tester](https://www.mail-tester.com/) - Spam score checking

## Brand Colors

Use these colors for consistency:

- **Primary**: `#667eea` (Purple)
- **Secondary**: `#764ba2` (Dark Purple)
- **Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Background**: `#f4f7f9` (Light Gray)
- **Text**: `#333333` (Dark Gray)
- **Muted**: `#6c757d` (Gray)
- **White**: `#ffffff`

## Typography

- **Font Family**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`
- **Line Height**: `1.6` (body text)
- **Font Sizes**:
  - Heading: `24-32px`
  - Body: `16px`
  - Small: `14px`
  - Tiny: `12px`

## Common Components

### Header
```html
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
  <a href="{{frontendUrl}}" style="font-size: 32px; font-weight: bold; color: #ffffff; text-decoration: none;">
    Team@Once
  </a>
</div>
```

### Button
```html
<a href="{{url}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
  Button Text
</a>
```

### Card
```html
<div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 25px 0;">
  <!-- Card content -->
</div>
```

### Footer
```html
<div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
  <p style="color: #6c757d; font-size: 14px; margin: 10px 0;">
    Footer text
  </p>
  <p style="font-size: 12px; color: #999999;">
    © {{year}} Team@Once. All rights reserved.
  </p>
</div>
```

## Email Client Support

Test these email clients for maximum compatibility:

### Desktop Clients
- Outlook 2016+ (Windows)
- Apple Mail (macOS)
- Thunderbird

### Webmail Clients
- Gmail
- Outlook.com
- Yahoo Mail
- Apple iCloud Mail

### Mobile Clients
- iOS Mail
- Gmail (Android)
- Samsung Email

## Accessibility

Make emails accessible:

1. **Use semantic HTML** (headings, paragraphs, lists)
2. **Provide alt text** for images
3. **Use sufficient color contrast** (4.5:1 minimum)
4. **Make links descriptive** (avoid "click here")
5. **Use readable font sizes** (minimum 14px)
6. **Test with screen readers**

## Best Practices

1. ✅ Use inline CSS
2. ✅ Keep width at 600px max
3. ✅ Test on multiple clients
4. ✅ Provide plain text version
5. ✅ Use absolute URLs
6. ✅ Optimize images
7. ✅ Include unsubscribe link (if applicable)
8. ✅ Test spam score
9. ✅ Use responsive design
10. ✅ Keep file size under 100KB

## Common Issues

### Images Not Loading
- Check if URLs are absolute (not relative)
- Verify images are publicly accessible
- Provide alt text for blocked images

### Layout Breaking
- Use tables for complex layouts
- Test in Outlook (often the most problematic)
- Avoid using float, flexbox, or grid

### Styling Not Applied
- Ensure CSS is inline (not in `<style>` tags)
- Use simple, well-supported CSS properties
- Test on multiple email clients

### Spam Filters
- Avoid spam trigger words
- Balance text-to-image ratio
- Include plain text version
- Test spam score before sending

## Resources

- [Email Client CSS Support](https://www.campaignmonitor.com/css/)
- [Can I Email](https://www.caniemail.com/) - CSS support checker
- [Really Good Emails](https://reallygoodemails.com/) - Inspiration
- [Email Design Reference](https://www.emaildesignreview.com/) - Examples

---

**Location**: `/backend/src/templates/emails/`
**Service**: `/backend/src/services/email.service.ts`
**Utilities**: `/backend/src/utils/email-template.util.ts`
