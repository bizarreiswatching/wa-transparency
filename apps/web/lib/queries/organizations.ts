import { query } from '../db';
import type { Entity, Contribution, EntityType } from '@wa-transparency/db';

export async function getOrganization(slug: string): Promise<Entity | null> {
  const result = await query<Entity>(
    `SELECT * FROM entities WHERE slug = $1 AND type IN ('organization', 'committee', 'government') LIMIT 1`,
    [slug]
  );
  return result.rows[0] || null;
}

export async function getOrganizationById(id: string): Promise<Entity | null> {
  const result = await query<Entity>(
    `SELECT * FROM entities WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

interface ContributionWithEntities extends Contribution {
  contributor_entity_type?: EntityType;
  contributor_entity_slug?: string;
  recipient_entity_type?: EntityType;
  recipient_entity_slug?: string;
}

export async function getOrganizationContributions(
  entityId: string,
  limit = 50
): Promise<ContributionWithEntities[]> {
  const result = await query<ContributionWithEntities>(
    `SELECT c.*,
            ce.type as contributor_entity_type,
            ce.slug as contributor_entity_slug,
            re.type as recipient_entity_type,
            re.slug as recipient_entity_slug
     FROM contributions c
     LEFT JOIN entities ce ON c.contributor_entity_id = ce.id
     LEFT JOIN entities re ON c.recipient_entity_id = re.id
     WHERE c.contributor_entity_id = $1
     ORDER BY c.contribution_date DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getOrganizationContracts(entityId: string, limit = 50) {
  const result = await query(
    `SELECT * FROM contracts
     WHERE recipient_entity_id = $1
     ORDER BY start_date DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getOrganizationLobbying(entityId: string, limit = 50) {
  const result = await query(
    `SELECT * FROM lobbying_registrations
     WHERE employer_entity_id = $1
     ORDER BY registration_date DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getAllOrganizationSlugs(): Promise<string[]> {
  const result = await query<{ slug: string }>(
    `SELECT slug FROM entities WHERE type IN ('organization', 'committee', 'government')`
  );
  return result.rows.map((row) => row.slug);
}
