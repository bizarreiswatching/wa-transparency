import { query } from '../db';
import type { Contract } from '@wa-transparency/db';

interface TopContractor {
  id: string;
  name: string;
  slug: string;
  type: string;
  total_amount: number;
  contract_count: number;
}

export async function getContract(id: string): Promise<Contract | null> {
  const result = await query<Contract>(
    `SELECT * FROM contracts WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getTopContractors(limit = 100): Promise<TopContractor[]> {
  const result = await query<TopContractor>(
    `SELECT
      e.id,
      e.name,
      e.slug,
      e.type,
      SUM(c.amount) as total_amount,
      COUNT(*) as contract_count
     FROM contracts c
     JOIN entities e ON c.recipient_entity_id = e.id
     WHERE c.place_of_performance_state = 'WA'
     GROUP BY e.id, e.name, e.slug, e.type
     ORDER BY total_amount DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getContractsByEntity(
  entityId: string,
  limit = 50
): Promise<Contract[]> {
  const result = await query<Contract>(
    `SELECT * FROM contracts
     WHERE recipient_entity_id = $1
     ORDER BY start_date DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getContractsByAgency(agency: string, limit = 100): Promise<Contract[]> {
  const result = await query<Contract>(
    `SELECT * FROM contracts
     WHERE awarding_agency ILIKE $1
     ORDER BY start_date DESC
     LIMIT $2`,
    [`%${agency}%`, limit]
  );
  return result.rows;
}

export async function getAllContractIds(): Promise<string[]> {
  const result = await query<{ id: string }>(`SELECT id FROM contracts`);
  return result.rows.map((row) => row.id);
}
