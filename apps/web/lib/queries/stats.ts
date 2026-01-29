import { query } from '../db';
import type { EntityAggregate } from '@wa-transparency/db';

export interface GlobalStats {
  total_contributions: number;
  org_count: number;
  lobbyist_count: number;
  bill_count: number;
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const result = await query<GlobalStats>(
    `SELECT
      (SELECT COALESCE(SUM(amount), 0) FROM contributions) as total_contributions,
      (SELECT COUNT(*) FROM entities WHERE type = 'organization') as org_count,
      (SELECT COUNT(DISTINCT lobbyist_entity_id) FROM lobbying_registrations WHERE status = 'active') as lobbyist_count,
      (SELECT COUNT(*) FROM bills) as bill_count`
  );

  const row = result.rows[0];
  return {
    total_contributions: Number(row?.total_contributions ?? 0),
    org_count: Number(row?.org_count ?? 0),
    lobbyist_count: Number(row?.lobbyist_count ?? 0),
    bill_count: Number(row?.bill_count ?? 0),
  };
}

export async function getEntityAggregates(entityId: string): Promise<EntityAggregate | null> {
  const result = await query<EntityAggregate>(
    `SELECT * FROM entity_aggregates WHERE entity_id = $1`,
    [entityId]
  );
  return result.rows[0] || null;
}

export async function getVoteCountForEntity(entityId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM votes WHERE entity_id = $1`,
    [entityId]
  );
  return parseInt(result.rows[0]?.count ?? '0', 10);
}

export async function getLobbyingSpendForEntity(entityId: string): Promise<number> {
  const result = await query<{ total: string }>(
    `SELECT COALESCE(SUM(la.compensation), 0) as total
     FROM lobbying_activities la
     JOIN lobbying_registrations lr ON la.registration_id = lr.id
     WHERE lr.employer_entity_id = $1`,
    [entityId]
  );
  return Number(result.rows[0]?.total ?? 0);
}
