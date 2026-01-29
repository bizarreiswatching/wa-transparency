import { fuzzyMatch } from './matchers';

export interface MatchScoreInput {
  name: string;
  type?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  employer?: string;
}

interface MatchWeights {
  name: number;
  type: number;
  address: number;
  city: number;
  state: number;
  zip: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  name: 0.5,
  type: 0.1,
  address: 0.15,
  city: 0.1,
  state: 0.05,
  zip: 0.1,
};

/**
 * Calculate overall match score between two entities
 */
export function calculateMatchScore(
  input: MatchScoreInput,
  candidate: MatchScoreInput,
  weights: MatchWeights = DEFAULT_WEIGHTS
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  // Name similarity (required)
  const nameSimilarity = fuzzyMatch(input.name, candidate.name).similarity;
  weightedScore += nameSimilarity * weights.name;
  totalWeight += weights.name;

  // Type match (if available)
  if (input.type && candidate.type) {
    const typeMatch = input.type.toLowerCase() === candidate.type.toLowerCase() ? 1 : 0;
    weightedScore += typeMatch * weights.type;
    totalWeight += weights.type;
  }

  // Address similarity (if available)
  if (input.address && candidate.address) {
    const addressSimilarity = fuzzyMatch(input.address, candidate.address).similarity;
    weightedScore += addressSimilarity * weights.address;
    totalWeight += weights.address;
  }

  // City match (if available)
  if (input.city && candidate.city) {
    const citySimilarity = fuzzyMatch(input.city, candidate.city).similarity;
    weightedScore += citySimilarity * weights.city;
    totalWeight += weights.city;
  }

  // State match (if available)
  if (input.state && candidate.state) {
    const stateMatch = input.state.toUpperCase() === candidate.state.toUpperCase() ? 1 : 0;
    weightedScore += stateMatch * weights.state;
    totalWeight += weights.state;
  }

  // ZIP match (if available)
  if (input.zip && candidate.zip) {
    const zip1 = input.zip.substring(0, 5);
    const zip2 = candidate.zip.substring(0, 5);
    const zipMatch = zip1 === zip2 ? 1 : 0;
    weightedScore += zipMatch * weights.zip;
    totalWeight += weights.zip;
  }

  // Normalize to account for missing fields
  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

/**
 * Score specifically for organization matches
 */
export function calculateOrganizationScore(
  input: MatchScoreInput,
  candidate: MatchScoreInput
): number {
  return calculateMatchScore(input, candidate, {
    name: 0.6,
    type: 0.05,
    address: 0.15,
    city: 0.1,
    state: 0.05,
    zip: 0.05,
  });
}

/**
 * Score specifically for person matches
 */
export function calculatePersonScore(
  input: MatchScoreInput,
  candidate: MatchScoreInput
): number {
  return calculateMatchScore(input, candidate, {
    name: 0.7,
    type: 0.05,
    address: 0.1,
    city: 0.05,
    state: 0.05,
    zip: 0.05,
  });
}

/**
 * Determine match confidence level
 */
export function getMatchConfidence(score: number): 'high' | 'medium' | 'low' | 'none' {
  if (score >= 0.95) return 'high';
  if (score >= 0.85) return 'medium';
  if (score >= 0.70) return 'low';
  return 'none';
}

/**
 * Check if match score meets threshold for auto-matching
 */
export function shouldAutoMatch(score: number, threshold = 0.85): boolean {
  return score >= threshold;
}

/**
 * Check if match needs human review
 */
export function needsReview(score: number): boolean {
  return score >= 0.70 && score < 0.85;
}
