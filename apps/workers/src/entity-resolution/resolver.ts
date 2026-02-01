import { exactMatch, fuzzyMatch, FuzzyMatchResult } from './matchers';
import { calculateMatchScore, MatchScoreInput } from './scorers';
import { disambiguateEntities } from '../lib/gemini';
import type { getDb } from '../lib/db';

interface ResolverOptions {
  batchSize: number;
  matchThreshold: number;
}

export class EntityResolver {
  private db: ReturnType<typeof getDb>;
  private options: ResolverOptions;

  constructor(db: ReturnType<typeof getDb>, options: ResolverOptions) {
    this.db = db;
    this.options = options;
  }

  async resolveContributionContributors(): Promise<number> {
    let totalMatched = 0;

    // Get unmatched contributions
    const unmatched = await this.db.query(
      `SELECT id, contributor_name, contributor_address, contributor_city,
              contributor_state, contributor_zip, contributor_employer
       FROM contributions
       WHERE contributor_entity_id IS NULL
       LIMIT $1`,
      [this.options.batchSize]
    );

    for (const contribution of unmatched.rows) {
      const match = await this.findEntityMatch({
        name: contribution.contributor_name,
        address: contribution.contributor_address,
        city: contribution.contributor_city,
        state: contribution.contributor_state,
        zip: contribution.contributor_zip,
        employer: contribution.contributor_employer,
      });

      if (match) {
        await this.db.query(
          `UPDATE contributions SET contributor_entity_id = $1, updated_at = NOW()
           WHERE id = $2`,
          [match.entityId, contribution.id]
        );
        totalMatched++;
      }
    }

    return totalMatched;
  }

  async resolveContributionRecipients(): Promise<number> {
    let totalMatched = 0;

    const unmatched = await this.db.query(
      `SELECT id, recipient_name, recipient_type
       FROM contributions
       WHERE recipient_entity_id IS NULL
       LIMIT $1`,
      [this.options.batchSize]
    );

    for (const contribution of unmatched.rows) {
      const match = await this.findEntityMatch({
        name: contribution.recipient_name,
        type: contribution.recipient_type === 'candidate' ? 'person' : 'committee',
      });

      if (match) {
        await this.db.query(
          `UPDATE contributions SET recipient_entity_id = $1, updated_at = NOW()
           WHERE id = $2`,
          [match.entityId, contribution.id]
        );
        totalMatched++;
      }
    }

    return totalMatched;
  }

  async resolveContractRecipients(): Promise<number> {
    let totalMatched = 0;

    const unmatched = await this.db.query(
      `SELECT id, recipient_name, recipient_address, recipient_city,
              recipient_state, recipient_zip
       FROM contracts
       WHERE recipient_entity_id IS NULL
         AND place_of_performance_state = 'WA'
       LIMIT $1`,
      [this.options.batchSize]
    );

    for (const contract of unmatched.rows) {
      const match = await this.findEntityMatch({
        name: contract.recipient_name,
        address: contract.recipient_address,
        city: contract.recipient_city,
        state: contract.recipient_state,
        zip: contract.recipient_zip,
        type: 'organization',
      });

      if (match) {
        await this.db.query(
          `UPDATE contracts SET recipient_entity_id = $1, updated_at = NOW()
           WHERE id = $2`,
          [match.entityId, contract.id]
        );
        totalMatched++;
      }
    }

    return totalMatched;
  }

  /**
   * Resolve WA state and local government contract recipients
   * Handles state, county, and city contracts from data.wa.gov and local sources
   */
  async resolveWaContractRecipients(): Promise<number> {
    let totalMatched = 0;

    // Get unmatched contracts from state/county/city sources
    const unmatched = await this.db.query(
      `SELECT id, recipient_name, recipient_address, recipient_city,
              recipient_state, recipient_zip, source_type, vendor_certifications
       FROM contracts
       WHERE recipient_entity_id IS NULL
         AND source_type IN ('state', 'county', 'city')
       LIMIT $1`,
      [this.options.batchSize]
    );

    console.log(`Processing ${unmatched.rows.length} unmatched WA contract recipients...`);

    for (const contract of unmatched.rows) {
      const match = await this.findEntityMatch({
        name: contract.recipient_name,
        address: contract.recipient_address,
        city: contract.recipient_city,
        state: contract.recipient_state,
        zip: contract.recipient_zip,
        type: 'organization',
      });

      if (match) {
        await this.db.query(
          `UPDATE contracts SET recipient_entity_id = $1, updated_at = NOW()
           WHERE id = $2`,
          [match.entityId, contract.id]
        );
        totalMatched++;

        // Update entity metadata with vendor certifications if available
        if (contract.vendor_certifications && contract.vendor_certifications.length > 0) {
          await this.updateEntityCertifications(match.entityId, contract.vendor_certifications);
        }
      }
    }

    return totalMatched;
  }

  /**
   * Update entity metadata with vendor certifications from contract data
   */
  private async updateEntityCertifications(entityId: string, certifications: string[]): Promise<void> {
    if (!certifications || certifications.length === 0) return;

    // Get current entity metadata
    const result = await this.db.query(
      `SELECT metadata FROM entities WHERE id = $1`,
      [entityId]
    );

    if (result.rows.length === 0) return;

    const currentMetadata = result.rows[0].metadata || {};
    const existingCerts = currentMetadata.certifications || [];

    // Merge certifications (avoid duplicates)
    const allCerts = Array.from(new Set([...existingCerts, ...certifications]));

    await this.db.query(
      `UPDATE entities
       SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{certifications}', $2::jsonb),
           updated_at = NOW()
       WHERE id = $1`,
      [entityId, JSON.stringify(allCerts)]
    );
  }

  async resolveLobbyingEmployers(): Promise<number> {
    let totalMatched = 0;

    const unmatched = await this.db.query(
      `SELECT id, employer_name
       FROM lobbying_registrations
       WHERE employer_entity_id IS NULL
       LIMIT $1`,
      [this.options.batchSize]
    );

    for (const registration of unmatched.rows) {
      const match = await this.findEntityMatch({
        name: registration.employer_name,
        type: 'organization',
      });

      if (match) {
        await this.db.query(
          `UPDATE lobbying_registrations SET employer_entity_id = $1, updated_at = NOW()
           WHERE id = $2`,
          [match.entityId, registration.id]
        );
        totalMatched++;
      }
    }

    return totalMatched;
  }

  private async findEntityMatch(input: MatchScoreInput): Promise<{ entityId: string; score: number } | null> {
    // First, try exact match on name
    const exact = await this.tryExactMatch(input.name);
    if (exact) {
      return { entityId: exact, score: 1.0 };
    }

    // Try alias match
    const aliasMatch = await this.tryAliasMatch(input.name);
    if (aliasMatch) {
      return aliasMatch;
    }

    // Try fuzzy match
    const fuzzyMatches = await this.tryFuzzyMatch(input);
    if (fuzzyMatches.length > 0) {
      const best = fuzzyMatches[0];
      if (best.score >= this.options.matchThreshold) {
        return best;
      }

      // If score is in uncertain range, use Claude for disambiguation
      if (best.score >= 0.7) {
        const confirmed = await this.tryClaudeDisambiguation(input, best);
        if (confirmed) {
          return best;
        }
      }
    }

    return null;
  }

  private async tryExactMatch(name: string): Promise<string | null> {
    const result = await this.db.query(
      `SELECT id FROM entities WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [name]
    );
    return result.rows[0]?.id || null;
  }

  private async tryAliasMatch(name: string): Promise<{ entityId: string; score: number } | null> {
    const result = await this.db.query(
      `SELECT entity_id, confidence FROM entity_aliases
       WHERE LOWER(alias) = LOWER($1)
       ORDER BY confidence DESC
       LIMIT 1`,
      [name]
    );

    if (result.rows.length > 0) {
      return {
        entityId: result.rows[0].entity_id,
        score: result.rows[0].confidence,
      };
    }

    return null;
  }

  private async tryFuzzyMatch(input: MatchScoreInput): Promise<Array<{ entityId: string; score: number }>> {
    // Use trigram similarity for fuzzy matching
    const result = await this.db.query(
      `SELECT id, name, type, address, city, state, zip,
              similarity(name, $1) as name_similarity
       FROM entities
       WHERE similarity(name, $1) > 0.3
       ORDER BY name_similarity DESC
       LIMIT 10`,
      [input.name]
    );

    return result.rows.map((row) => ({
      entityId: row.id,
      score: calculateMatchScore(input, {
        name: row.name,
        type: row.type,
        address: row.address,
        city: row.city,
        state: row.state,
        zip: row.zip,
      }),
    })).sort((a, b) => b.score - a.score);
  }

  private async tryClaudeDisambiguation(
    input: MatchScoreInput,
    candidate: { entityId: string; score: number }
  ): Promise<boolean> {
    // Get candidate entity details
    const result = await this.db.query(
      `SELECT name, type, address, city, state, zip, metadata
       FROM entities WHERE id = $1`,
      [candidate.entityId]
    );

    if (result.rows.length === 0) return false;

    const entity = result.rows[0];

    const disambiguationResult = await disambiguateEntities(
      {
        name: input.name,
        type: input.type || 'unknown',
        address: [input.address, input.city, input.state, input.zip].filter(Boolean).join(', '),
      },
      {
        name: entity.name,
        type: entity.type,
        address: [entity.address, entity.city, entity.state, entity.zip].filter(Boolean).join(', '),
        metadata: entity.metadata,
      }
    );

    // Log the match attempt
    await this.db.query(
      `INSERT INTO entity_matches
       (source_name, source_type, source_record_id, matched_entity_id, match_score, match_method, status)
       VALUES ($1, $2, $3, $4, $5, 'claude', $6)
       ON CONFLICT (source_type, source_record_id) DO UPDATE SET
         matched_entity_id = EXCLUDED.matched_entity_id,
         match_score = EXCLUDED.match_score,
         status = EXCLUDED.status,
         updated_at = NOW()`,
      [
        input.name,
        input.type || 'unknown',
        `${input.name}-${Date.now()}`,
        candidate.entityId,
        disambiguationResult.confidence,
        disambiguationResult.isMatch ? 'matched' : 'rejected',
      ]
    );

    return disambiguationResult.isMatch && disambiguationResult.confidence >= 0.8;
  }
}
