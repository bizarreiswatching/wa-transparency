/**
 * Entity matching utilities
 */

export interface ExactMatchInput {
  name: string;
  ein?: string;
  address?: string;
}

export interface FuzzyMatchResult {
  similarity: number;
  matchedField: string;
}

/**
 * Check for exact match on key identifiers
 */
export function exactMatch(input: ExactMatchInput, candidate: ExactMatchInput): boolean {
  // Exact name match (case-insensitive)
  if (input.name.toLowerCase() === candidate.name.toLowerCase()) {
    return true;
  }

  // EIN match (if available)
  if (input.ein && candidate.ein && input.ein === candidate.ein) {
    return true;
  }

  return false;
}

/**
 * Calculate fuzzy match similarity
 */
export function fuzzyMatch(str1: string, str2: string): FuzzyMatchResult {
  const s1 = normalizeForComparison(str1);
  const s2 = normalizeForComparison(str2);

  // Calculate various similarity metrics
  const jaroWinkler = jaroWinklerSimilarity(s1, s2);
  const levenshtein = levenshteinSimilarity(s1, s2);
  const tokenSort = tokenSortSimilarity(s1, s2);

  // Take the best score
  const scores = [
    { similarity: jaroWinkler, matchedField: 'jaro-winkler' },
    { similarity: levenshtein, matchedField: 'levenshtein' },
    { similarity: tokenSort, matchedField: 'token-sort' },
  ];

  return scores.reduce((best, current) =>
    current.similarity > best.similarity ? current : best
  );
}

/**
 * Normalize string for comparison
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Jaro-Winkler similarity
 */
function jaroWinklerSimilarity(s1: string, s2: string): number {
  const jaro = jaroSimilarity(s1, s2);
  const prefixLength = commonPrefixLength(s1, s2, 4);
  const scalingFactor = 0.1;

  return jaro + prefixLength * scalingFactor * (1 - jaro);
}

function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matchWindow = Math.max(0, Math.floor(Math.max(s1.length, s2.length) / 2) - 1);
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3
  );
}

function commonPrefixLength(s1: string, s2: string, maxLength: number): number {
  let i = 0;
  while (i < Math.min(s1.length, s2.length, maxLength) && s1[i] === s2[i]) {
    i++;
  }
  return i;
}

/**
 * Levenshtein similarity (normalized)
 */
function levenshteinSimilarity(s1: string, s2: string): number {
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
}

/**
 * Token sort ratio - useful for names in different orders
 */
function tokenSortSimilarity(s1: string, s2: string): number {
  const tokens1 = s1.split(' ').sort().join(' ');
  const tokens2 = s2.split(' ').sort().join(' ');
  return levenshteinSimilarity(tokens1, tokens2);
}
