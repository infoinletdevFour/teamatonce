import * as fs from 'fs';
import * as path from 'path';

/**
 * Email Template Utility
 * Handles loading and rendering HTML email templates with variable substitution
 */

export interface EmailTemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Simple template engine that replaces {{variable}} and {{#if condition}}...{{/if}}
 * @param template - HTML template string
 * @param variables - Object with variable values
 * @returns Rendered HTML string
 */
export function renderTemplate(template: string, variables: EmailTemplateVariables): string {
  let rendered = template;

  // Handle {{#if variable}}...{{/if}} blocks
  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  rendered = rendered.replace(ifRegex, (match, variable, content) => {
    const value = variables[variable];
    // Show content if variable is truthy (exists and not empty)
    return value ? content : '';
  });

  // Handle {{variable}} replacements
  const variableRegex = /\{\{(\w+)\}\}/g;
  rendered = rendered.replace(variableRegex, (match, variable) => {
    const value = variables[variable];
    return value !== null && value !== undefined ? String(value) : '';
  });

  return rendered;
}

/**
 * Load an email template from the templates directory
 * @param templateName - Name of the template file (without .html extension)
 * @returns HTML template string
 */
export function loadEmailTemplate(templateName: string): string {
  const templatesDir = path.join(__dirname, '..', 'templates', 'emails');
  const templatePath = path.join(templatesDir, `${templateName}.html`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templateName}`);
  }

  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Render an email template with variables
 * @param templateName - Name of the template file (without .html extension)
 * @param variables - Object with variable values
 * @returns Rendered HTML string
 */
export function renderEmailTemplate(
  templateName: string,
  variables: EmailTemplateVariables,
): string {
  const template = loadEmailTemplate(templateName);
  return renderTemplate(template, variables);
}

/**
 * Extract plain text from HTML (basic implementation)
 * @param html - HTML string
 * @returns Plain text version
 */
export function htmlToPlainText(html: string): string {
  return (
    html
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format date for email display
 * @param date - Date to format
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string
 */
export function formatEmailDate(date: Date | string, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get company initial letter for logo placeholder
 * @param companyName - Company name
 * @returns First letter of company name
 */
export function getCompanyInitial(companyName: string): string {
  return companyName?.charAt(0)?.toUpperCase() || 'C';
}
