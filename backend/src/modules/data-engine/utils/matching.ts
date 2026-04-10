/**
 * Fuzzy Matching Utilities for Entity Resolution
 * Provides string similarity algorithms for comparing names, locations, etc.
 */

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits required to change one string into another
 */
export function levenshteinDistance(a: string, b: string): number {
  if (!a || !b) return Math.max(a?.length || 0, b?.length || 0);

  const matrix: number[][] = [];

  // Initialize first row and column
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1,     // deletion
        );
      }
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Calculate normalized Levenshtein similarity (0 to 1)
 * Higher values indicate more similarity
 */
export function levenshteinSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);

  return 1 - distance / maxLength;
}

/**
 * Calculate Jaro similarity between two strings
 * Returns a value between 0 and 1
 */
export function jaroSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;

  const matchWindow = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, b.length);

    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  return (
    (matches / a.length +
      matches / b.length +
      (matches - transpositions / 2) / matches) /
    3
  );
}

/**
 * Calculate Jaro-Winkler similarity
 * An extension of Jaro similarity that gives extra weight to common prefixes
 * Particularly useful for name matching
 */
export function jaroWinkler(a: string, b: string, prefixScale: number = 0.1): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;

  const jaroScore = jaroSimilarity(a, b);

  // Find common prefix (up to 4 characters)
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(a.length, b.length));

  for (let i = 0; i < maxPrefix; i++) {
    if (a[i] === b[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  return jaroScore + prefixLength * prefixScale * (1 - jaroScore);
}

/**
 * Calculate name match score using multiple algorithms
 * Returns a confidence score between 0 and 1
 */
export function calculateNameMatch(name1: string | null, name2: string | null): number {
  if (!name1 || !name2) return 0;

  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  if (n1 === n2) return 1.0;

  // Calculate Jaro-Winkler (best for names)
  const jwScore = jaroWinkler(n1, n2);

  // Also check if one name contains the other (partial match)
  const containsScore = n1.includes(n2) || n2.includes(n1) ? 0.8 : 0;

  // Check if first/last names match
  const parts1 = n1.split(' ').filter(p => p.length > 0);
  const parts2 = n2.split(' ').filter(p => p.length > 0);

  let partMatchScore = 0;
  if (parts1.length > 0 && parts2.length > 0) {
    // First name match
    if (parts1[0] === parts2[0]) {
      partMatchScore += 0.4;
    } else if (jaroWinkler(parts1[0], parts2[0]) > 0.9) {
      partMatchScore += 0.3;
    }

    // Last name match (if available)
    if (parts1.length > 1 && parts2.length > 1) {
      const last1 = parts1[parts1.length - 1];
      const last2 = parts2[parts2.length - 1];
      if (last1 === last2) {
        partMatchScore += 0.4;
      } else if (jaroWinkler(last1, last2) > 0.9) {
        partMatchScore += 0.3;
      }
    }
  }

  // Return the best score
  return Math.max(jwScore, containsScore, partMatchScore);
}

/**
 * Calculate location match score
 * Returns a confidence score between 0 and 1
 */
export function calculateLocationMatch(loc1: string | null, loc2: string | null): number {
  if (!loc1 || !loc2) return 0;

  const l1 = loc1.toLowerCase().trim();
  const l2 = loc2.toLowerCase().trim();

  if (l1 === l2) return 1.0;

  // Split into parts
  const parts1 = l1.split(/[,;]\s*/).map(p => p.trim()).filter(p => p.length > 0);
  const parts2 = l2.split(/[,;]\s*/).map(p => p.trim()).filter(p => p.length > 0);

  let matchScore = 0;
  let totalParts = Math.max(parts1.length, parts2.length);

  // Check for matching parts
  for (const p1 of parts1) {
    for (const p2 of parts2) {
      if (p1 === p2) {
        matchScore += 1;
        break;
      } else if (jaroWinkler(p1, p2) > 0.9) {
        matchScore += 0.8;
        break;
      } else if (p1.includes(p2) || p2.includes(p1)) {
        matchScore += 0.7;
        break;
      }
    }
  }

  // Also check overall similarity
  const overallSimilarity = jaroWinkler(l1, l2);

  return Math.max(matchScore / totalParts, overallSimilarity);
}

/**
 * Calculate company match score
 */
export function calculateCompanyMatch(company1: string | null, company2: string | null): number {
  if (!company1 || !company2) return 0;

  const c1 = company1.toLowerCase().trim();
  const c2 = company2.toLowerCase().trim();

  if (c1 === c2) return 1.0;

  // Check contains
  if (c1.includes(c2) || c2.includes(c1)) {
    return 0.9;
  }

  return jaroWinkler(c1, c2);
}

/**
 * Calculate overall match score between two profiles
 * Uses a weighted combination of different identifiers
 */
export function calculateProfileMatchScore(
  profile1: {
    name: string | null;
    location: string | null;
    company: string | null;
  },
  profile2: {
    name: string | null;
    location: string | null;
    company: string | null;
  },
): { score: number; breakdown: Record<string, number> } {
  const nameScore = calculateNameMatch(profile1.name, profile2.name);
  const locationScore = calculateLocationMatch(profile1.location, profile2.location);
  const companyScore = calculateCompanyMatch(profile1.company, profile2.company);

  // Weighted combination
  // Name is most important, then company, then location
  const weights = {
    name: 0.5,
    location: 0.2,
    company: 0.3,
  };

  // Only count scores where both values exist
  let totalWeight = 0;
  let weightedScore = 0;

  if (profile1.name && profile2.name) {
    weightedScore += nameScore * weights.name;
    totalWeight += weights.name;
  }

  if (profile1.location && profile2.location) {
    weightedScore += locationScore * weights.location;
    totalWeight += weights.location;
  }

  if (profile1.company && profile2.company) {
    weightedScore += companyScore * weights.company;
    totalWeight += weights.company;
  }

  // Normalize by total weight used
  const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  return {
    score: finalScore,
    breakdown: {
      name: nameScore,
      location: locationScore,
      company: companyScore,
    },
  };
}

/**
 * Check if two strings are likely the same with typo tolerance
 * Uses a combination of edit distance and character frequency
 */
export function isFuzzyMatch(a: string | null, b: string | null, threshold: number = 0.85): boolean {
  if (!a || !b) return false;

  const similarity = jaroWinkler(a.toLowerCase(), b.toLowerCase());
  return similarity >= threshold;
}

/**
 * Find best match from a list of candidates
 */
export function findBestMatch(
  target: string,
  candidates: string[],
  minThreshold: number = 0.7,
): { match: string | null; score: number; index: number } {
  let bestMatch: string | null = null;
  let bestScore = 0;
  let bestIndex = -1;

  for (let i = 0; i < candidates.length; i++) {
    const score = jaroWinkler(target.toLowerCase(), candidates[i].toLowerCase());
    if (score > bestScore && score >= minThreshold) {
      bestScore = score;
      bestMatch = candidates[i];
      bestIndex = i;
    }
  }

  return { match: bestMatch, score: bestScore, index: bestIndex };
}
