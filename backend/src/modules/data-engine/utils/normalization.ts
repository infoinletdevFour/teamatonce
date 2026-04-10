/**
 * String Normalization Utilities for Entity Resolution
 * Provides consistent normalization of identifiers for cross-source matching
 */

/**
 * Normalize email address
 * - Lowercase
 * - Trim whitespace
 * - Handle Gmail dot trick (optional)
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') return null;

  let normalized = email.toLowerCase().trim();

  // Remove invalid emails
  if (!normalized.includes('@') || normalized.length < 5) {
    return null;
  }

  return normalized;
}

/**
 * Normalize GitHub URL or username to username only
 * Handles formats:
 * - https://github.com/username
 * - http://github.com/username
 * - github.com/username
 * - @username
 * - username
 */
export function normalizeGithubUrl(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;

  let normalized = input.trim().toLowerCase();

  // Remove common prefixes
  normalized = normalized.replace(/^https?:\/\//, '');
  normalized = normalized.replace(/^(www\.)?github\.com\//, '');
  normalized = normalized.replace(/^@/, '');

  // Remove trailing slashes and query params
  normalized = normalized.split('/')[0].split('?')[0];

  // Filter invalid usernames
  if (!normalized || normalized.length < 1 || normalized.length > 39) {
    return null;
  }

  // GitHub usernames can only contain alphanumeric characters and hyphens
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Normalize Twitter handle
 * Handles formats:
 * - https://twitter.com/username
 * - https://x.com/username
 * - @username
 * - username
 */
export function normalizeTwitterHandle(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;

  let normalized = input.trim().toLowerCase();

  // Remove URLs
  normalized = normalized.replace(/^https?:\/\//, '');
  normalized = normalized.replace(/^(www\.)?(twitter|x)\.com\//, '');
  normalized = normalized.replace(/^@/, '');

  // Remove trailing paths and query params
  normalized = normalized.split('/')[0].split('?')[0];

  // Filter invalid handles
  if (!normalized || normalized.length < 1 || normalized.length > 15) {
    return null;
  }

  // Twitter handles can only contain alphanumeric characters and underscores
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Normalize LinkedIn URL to profile identifier
 * Handles formats:
 * - https://linkedin.com/in/profile-id
 * - https://www.linkedin.com/in/profile-id
 * - linkedin.com/in/profile-id
 */
export function normalizeLinkedInUrl(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;

  let normalized = input.trim().toLowerCase();

  // Remove URL prefix
  normalized = normalized.replace(/^https?:\/\//, '');
  normalized = normalized.replace(/^(www\.)?linkedin\.com\/in\//, '');

  // Remove trailing slashes and query params
  normalized = normalized.split('/')[0].split('?')[0];

  // Filter invalid profiles
  if (!normalized || normalized.length < 2) {
    return null;
  }

  return normalized;
}

/**
 * Normalize location string
 * Attempts to extract city and country
 */
export function normalizeLocation(location: string | null | undefined): string | null {
  if (!location || typeof location !== 'string') return null;

  let normalized = location.trim();

  // Return null for empty or too short
  if (normalized.length < 2) {
    return null;
  }

  // Convert to lowercase for consistency
  normalized = normalized.toLowerCase();

  // Common location normalizations
  const locationMappings: Record<string, string> = {
    'usa': 'united states',
    'us': 'united states',
    'u.s.': 'united states',
    'u.s.a.': 'united states',
    'uk': 'united kingdom',
    'u.k.': 'united kingdom',
    'england': 'united kingdom',
    'nyc': 'new york, united states',
    'sf': 'san francisco, united states',
    'la': 'los angeles, united states',
  };

  // Apply mappings
  for (const [key, value] of Object.entries(locationMappings)) {
    if (normalized === key || normalized.endsWith(`, ${key}`)) {
      normalized = normalized.replace(new RegExp(`(, )?${key}$`), '') + (normalized === key ? value : `, ${value}`);
      if (normalized === key) normalized = value;
    }
  }

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized || null;
}

/**
 * Normalize a person's name
 * - Handle title removal (Dr., Mr., Mrs., etc.)
 * - Normalize case
 * - Handle middle names/initials consistently
 */
export function normalizeName(name: string | null | undefined): string | null {
  if (!name || typeof name !== 'string') return null;

  let normalized = name.trim();

  // Return null for empty
  if (normalized.length < 1) {
    return null;
  }

  // Remove common titles
  const titles = ['dr.', 'dr', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms', 'prof.', 'prof'];
  const lowered = normalized.toLowerCase();
  for (const title of titles) {
    if (lowered.startsWith(title + ' ')) {
      normalized = normalized.substring(title.length + 1);
      break;
    }
  }

  // Remove suffixes
  const suffixes = ['jr.', 'jr', 'sr.', 'sr', 'iii', 'ii', 'iv', 'phd', 'ph.d.', 'md', 'm.d.'];
  for (const suffix of suffixes) {
    const regex = new RegExp(`,?\\s*${suffix.replace('.', '\\.')}$`, 'i');
    normalized = normalized.replace(regex, '');
  }

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Convert to lowercase for comparison
  normalized = normalized.toLowerCase();

  return normalized || null;
}

/**
 * Extract name parts for comparison
 */
export function extractNameParts(name: string | null | undefined): {
  first: string | null;
  middle: string | null;
  last: string | null;
} {
  const normalizedName = normalizeName(name);

  if (!normalizedName) {
    return { first: null, middle: null, last: null };
  }

  const parts = normalizedName.split(' ').filter(p => p.length > 0);

  if (parts.length === 1) {
    return { first: parts[0], middle: null, last: null };
  } else if (parts.length === 2) {
    return { first: parts[0], middle: null, last: parts[1] };
  } else {
    return {
      first: parts[0],
      middle: parts.slice(1, -1).join(' '),
      last: parts[parts.length - 1],
    };
  }
}

/**
 * Normalize website URL for deduplication
 * - Strips protocol (http/https)
 * - Removes www prefix
 * - Removes trailing slashes
 * - Lowercases
 */
export function normalizeWebsite(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  let normalized = url.trim().toLowerCase();

  // Must look like a URL
  if (!normalized.includes('.')) return null;

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '');

  // Remove www prefix
  normalized = normalized.replace(/^www\./, '');

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  // Remove query string and fragment
  normalized = normalized.split('?')[0].split('#')[0];

  // Remove trailing slashes again after query/fragment removal
  normalized = normalized.replace(/\/+$/, '');

  if (!normalized || normalized.length < 3) return null;

  return normalized;
}

/**
 * Normalize company name
 */
export function normalizeCompany(company: string | null | undefined): string | null {
  if (!company || typeof company !== 'string') return null;

  let normalized = company.trim().toLowerCase();

  if (normalized.length < 1) {
    return null;
  }

  // Remove common suffixes
  const suffixes = [
    ' inc.', ' inc', ' llc', ' ltd.', ' ltd', ' corp.', ' corp',
    ' corporation', ' limited', ' co.', ' co', ' gmbh', ' ag',
  ];

  for (const suffix of suffixes) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length);
      break;
    }
  }

  // Remove @ prefix (common in GitHub company field)
  normalized = normalized.replace(/^@/, '');

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized || null;
}

/**
 * Extract all identifiers from profile structured data
 */
export function extractIdentifiers(structuredData: any, rawData: any): {
  email: string | null;
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  website: string | null;
  name: string | null;
  location: string | null;
  company: string | null;
} {
  const socialAccounts = structuredData?.socialAccounts || {};

  return {
    email: normalizeEmail(socialAccounts.email || rawData?.email),
    github: normalizeGithubUrl(
      socialAccounts.github || rawData?.login || rawData?.htmlUrl || rawData?.html_url
    ),
    twitter: normalizeTwitterHandle(socialAccounts.twitter || rawData?.twitterUsername || rawData?.twitter_username),
    linkedin: normalizeLinkedInUrl(socialAccounts.linkedin),
    website: normalizeWebsite(socialAccounts.website || structuredData?.website || rawData?.website || rawData?.url),
    name: normalizeName(rawData?.name || structuredData?.canonicalName),
    location: normalizeLocation(structuredData?.location || rawData?.location),
    company: normalizeCompany(structuredData?.company || rawData?.company),
  };
}
