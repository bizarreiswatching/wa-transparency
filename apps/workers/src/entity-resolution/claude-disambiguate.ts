import { disambiguateEntities } from '../lib/gemini';

interface EntityForDisambiguation {
  name: string;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  metadata?: Record<string, unknown>;
}

interface DisambiguationContext {
  sourceType: string;
  sourceId: string;
}

interface DisambiguationResult {
  isMatch: boolean;
  confidence: number;
  reasoning: string;
  needsReview: boolean;
}

/**
 * Use Claude to disambiguate between two potentially matching entities
 */
export async function claudeDisambiguate(
  entity1: EntityForDisambiguation,
  entity2: EntityForDisambiguation,
  context?: DisambiguationContext
): Promise<DisambiguationResult> {
  const address1 = formatAddress(entity1);
  const address2 = formatAddress(entity2);

  const result = await disambiguateEntities(
    {
      name: entity1.name,
      type: entity1.type,
      address: address1,
      metadata: entity1.metadata,
    },
    {
      name: entity2.name,
      type: entity2.type,
      address: address2,
      metadata: entity2.metadata,
    }
  );

  return {
    isMatch: result.isMatch,
    confidence: result.confidence,
    reasoning: result.reasoning,
    needsReview: result.confidence >= 0.5 && result.confidence < 0.8,
  };
}

/**
 * Batch disambiguation for multiple candidate matches
 */
export async function batchDisambiguate(
  sourceEntity: EntityForDisambiguation,
  candidates: EntityForDisambiguation[],
  maxConcurrent = 3
): Promise<Array<{ candidate: EntityForDisambiguation; result: DisambiguationResult }>> {
  const results: Array<{ candidate: EntityForDisambiguation; result: DisambiguationResult }> = [];

  // Process in batches to avoid rate limits
  for (let i = 0; i < candidates.length; i += maxConcurrent) {
    const batch = candidates.slice(i, i + maxConcurrent);

    const batchResults = await Promise.all(
      batch.map(async (candidate) => {
        const result = await claudeDisambiguate(sourceEntity, candidate);
        return { candidate, result };
      })
    );

    results.push(...batchResults);

    // Rate limit: wait between batches
    if (i + maxConcurrent < candidates.length) {
      await sleep(1000);
    }
  }

  return results.sort((a, b) => b.result.confidence - a.result.confidence);
}

/**
 * Determine if Claude disambiguation is needed
 */
export function needsClaudeDisambiguation(
  matchScore: number,
  hasAddressMatch: boolean
): boolean {
  // High confidence - no need for Claude
  if (matchScore >= 0.95) return false;

  // Very low confidence - not worth checking
  if (matchScore < 0.5) return false;

  // Medium confidence range - use Claude
  if (matchScore >= 0.7 && matchScore < 0.95) {
    return true;
  }

  // Lower confidence but address matches - worth checking
  if (matchScore >= 0.5 && hasAddressMatch) {
    return true;
  }

  return false;
}

function formatAddress(entity: EntityForDisambiguation): string {
  const parts = [entity.address, entity.city, entity.state, entity.zip].filter(Boolean);
  return parts.join(', ');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
