import { query } from '../db';
import type { Entity, Contribution, EntityType, Bill } from '@wa-transparency/db';

export async function getPerson(slug: string): Promise<Entity | null> {
  const result = await query<Entity>(
    `SELECT * FROM entities WHERE slug = $1 AND type = 'person' LIMIT 1`,
    [slug]
  );
  return result.rows[0] || null;
}

export async function getPersonById(id: string): Promise<Entity | null> {
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

export async function getPersonContributions(
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
     WHERE c.recipient_entity_id = $1
     ORDER BY c.contribution_date DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getPersonSponsoredBills(entityId: string, limit = 50): Promise<Bill[]> {
  const result = await query<Bill>(
    `SELECT b.* FROM bills b
     JOIN bill_sponsors bs ON b.id = bs.bill_id
     WHERE bs.entity_id = $1
     ORDER BY b.introduced_date DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getPersonVotes(entityId: string, limit = 100) {
  const result = await query(
    `SELECT v.*, b.bill_number, b.title as bill_title
     FROM votes v
     JOIN bills b ON v.bill_id = b.id
     WHERE v.entity_id = $1
     ORDER BY v.vote_date DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getAllPersonSlugs(): Promise<string[]> {
  const result = await query<{ slug: string }>(
    `SELECT slug FROM entities WHERE type = 'person'`
  );
  return result.rows.map((row) => row.slug);
}

export async function getLegislators() {
  const result = await query<Entity>(
    `SELECT * FROM entities
     WHERE type = 'person'
     AND metadata->>'chamber' IS NOT NULL
     ORDER BY name`
  );
  return result.rows;
}

export interface TopDonor {
  donor_id: string;
  donor_name: string;
  donor_slug: string;
  donor_type: EntityType;
  total_amount: number;
  contribution_count: number;
}

export async function getTopDonorsForPerson(entityId: string, limit = 10): Promise<TopDonor[]> {
  const result = await query<TopDonor>(
    `SELECT
      cc.donor_id,
      e.name as donor_name,
      e.slug as donor_slug,
      e.type as donor_type,
      cc.total_amount,
      cc.contribution_count
     FROM contribution_connections cc
     JOIN entities e ON cc.donor_id = e.id
     WHERE cc.recipient_id = $1
     ORDER BY cc.total_amount DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}
