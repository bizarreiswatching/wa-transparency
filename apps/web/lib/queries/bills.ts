import { query } from '../db';
import type { Bill, BillSponsor, Vote } from '@wa-transparency/db';

export async function getBill(session: string, number: string): Promise<Bill | null> {
  const result = await query<Bill>(
    `SELECT * FROM bills WHERE session = $1 AND bill_number = $2 LIMIT 1`,
    [session, number]
  );
  return result.rows[0] || null;
}

export async function getBillById(id: string): Promise<Bill | null> {
  const result = await query<Bill>(
    `SELECT * FROM bills WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getBillBySlug(slug: string): Promise<Bill | null> {
  const result = await query<Bill>(
    `SELECT * FROM bills WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return result.rows[0] || null;
}

export async function getBillSponsors(billId: string): Promise<BillSponsor[]> {
  const result = await query<BillSponsor>(
    `SELECT bs.*, e.name as sponsor_name, e.slug as sponsor_slug
     FROM bill_sponsors bs
     JOIN entities e ON bs.entity_id = e.id
     WHERE bs.bill_id = $1
     ORDER BY
       CASE bs.sponsor_type
         WHEN 'primary' THEN 1
         WHEN 'co-sponsor' THEN 2
         ELSE 3
       END`,
    [billId]
  );
  return result.rows;
}

export async function getBillVotes(billId: string): Promise<Vote[]> {
  const result = await query<Vote>(
    `SELECT v.*, e.name as voter_name, e.slug as voter_slug
     FROM votes v
     JOIN entities e ON v.entity_id = e.id
     WHERE v.bill_id = $1
     ORDER BY v.vote_date DESC, e.name`,
    [billId]
  );
  return result.rows;
}

export async function getBillsBySession(session: string, limit = 100): Promise<Bill[]> {
  const result = await query<Bill>(
    `SELECT * FROM bills
     WHERE session = $1
     ORDER BY introduced_date DESC
     LIMIT $2`,
    [session, limit]
  );
  return result.rows;
}

export async function getBillsBySubject(subject: string, limit = 100): Promise<Bill[]> {
  const result = await query<Bill>(
    `SELECT * FROM bills
     WHERE $1 = ANY(subjects)
     ORDER BY introduced_date DESC
     LIMIT $2`,
    [subject, limit]
  );
  return result.rows;
}

export async function getRecentBills(limit = 20): Promise<Bill[]> {
  const result = await query<Bill>(
    `SELECT * FROM bills
     ORDER BY last_action_date DESC NULLS LAST
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getAllBillSlugs(): Promise<Array<{ session: string; number: string }>> {
  const result = await query<{ session: string; bill_number: string }>(
    `SELECT session, bill_number FROM bills`
  );
  return result.rows.map((row) => ({
    session: row.session,
    number: row.bill_number,
  }));
}
