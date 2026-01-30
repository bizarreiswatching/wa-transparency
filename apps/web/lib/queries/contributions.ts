import { query } from '../db';
import type { Contribution } from '@wa-transparency/db';

interface TopDonor {
  id: string;
  name: string;
  slug: string;
  type: string;
  total_amount: number;
  contribution_count: number;
  recipient_count: number;
}

interface TopRecipient {
  id: string;
  name: string;
  slug: string;
  type: string;
  total_amount: number;
  contribution_count: number;
  donor_count: number;
}

export async function getTopDonors(year?: number, limit = 100): Promise<TopDonor[]> {
  // For "All Time", use pre-computed entity_aggregates for performance
  if (!year) {
    const sql = `
      SELECT
        e.id,
        e.name,
        e.slug,
        e.type,
        COALESCE(ea.total_contributions_given, 0) as total_amount,
        COALESCE(ea.contribution_count_given, 0) as contribution_count,
        0 as recipient_count
      FROM entity_aggregates ea
      JOIN entities e ON ea.entity_id = e.id
      WHERE ea.total_contributions_given > 0
      ORDER BY ea.total_contributions_given DESC
      LIMIT $1
    `;
    const result = await query<TopDonor>(sql, [limit]);
    return result.rows;
  }

  // For specific year, query contributions table with year filter
  const sql = `
    SELECT
      e.id,
      e.name,
      e.slug,
      e.type,
      SUM(c.amount) as total_amount,
      COUNT(*) as contribution_count,
      COUNT(DISTINCT c.recipient_entity_id) as recipient_count
    FROM contributions c
    JOIN entities e ON c.contributor_entity_id = e.id
    WHERE c.election_year = $1
    GROUP BY e.id, e.name, e.slug, e.type
    ORDER BY total_amount DESC
    LIMIT $2
  `;

  const result = await query<TopDonor>(sql, [year, limit]);
  return result.rows;
}

export async function getTopRecipients(year?: number, limit = 100): Promise<TopRecipient[]> {
  // For "All Time", use pre-computed entity_aggregates for performance
  if (!year) {
    const sql = `
      SELECT
        e.id,
        e.name,
        e.slug,
        e.type,
        COALESCE(ea.total_contributions_received, 0) as total_amount,
        COALESCE(ea.contribution_count_received, 0) as contribution_count,
        0 as donor_count
      FROM entity_aggregates ea
      JOIN entities e ON ea.entity_id = e.id
      WHERE ea.total_contributions_received > 0
      ORDER BY ea.total_contributions_received DESC
      LIMIT $1
    `;
    const result = await query<TopRecipient>(sql, [limit]);
    return result.rows;
  }

  // For specific year, query contributions table with year filter
  const sql = `
    SELECT
      e.id,
      e.name,
      e.slug,
      e.type,
      SUM(c.amount) as total_amount,
      COUNT(*) as contribution_count,
      COUNT(DISTINCT c.contributor_entity_id) as donor_count
    FROM contributions c
    JOIN entities e ON c.recipient_entity_id = e.id
    WHERE c.election_year = $1
    GROUP BY e.id, e.name, e.slug, e.type
    ORDER BY total_amount DESC
    LIMIT $2
  `;

  const result = await query<TopRecipient>(sql, [year, limit]);
  return result.rows;
}

export async function getContributionsByEntity(
  entityId: string,
  role: 'contributor' | 'recipient',
  limit = 100
): Promise<Contribution[]> {
  const column = role === 'contributor' ? 'contributor_entity_id' : 'recipient_entity_id';

  const result = await query<Contribution>(
    `SELECT * FROM contributions
     WHERE ${column} = $1
     ORDER BY contribution_date DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getContributionStats(entityId: string) {
  const result = await query<{
    total_given: number;
    total_received: number;
    given_count: number;
    received_count: number;
  }>(
    `SELECT
      COALESCE(SUM(CASE WHEN contributor_entity_id = $1 THEN amount ELSE 0 END), 0) as total_given,
      COALESCE(SUM(CASE WHEN recipient_entity_id = $1 THEN amount ELSE 0 END), 0) as total_received,
      COUNT(CASE WHEN contributor_entity_id = $1 THEN 1 END) as given_count,
      COUNT(CASE WHEN recipient_entity_id = $1 THEN 1 END) as received_count
     FROM contributions
     WHERE contributor_entity_id = $1 OR recipient_entity_id = $1`,
    [entityId]
  );
  return result.rows[0];
}
