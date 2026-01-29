import { query } from '../db';
import type { Entity } from '@wa-transparency/db';

interface SearchResult extends Entity {
  rank: number;
}

export async function searchEntities(
  searchQuery: string,
  type?: string,
  limit = 20
): Promise<SearchResult[]> {
  let sql = `
    SELECT
      e.*,
      similarity(e.name, $1) as rank
    FROM entities e
    WHERE e.name % $1
  `;

  const params: unknown[] = [searchQuery];

  if (type) {
    sql += ` AND e.type = $${params.length + 1}`;
    params.push(type);
  }

  sql += `
    ORDER BY rank DESC, e.name
    LIMIT $${params.length + 1}
  `;
  params.push(limit);

  const result = await query<SearchResult>(sql, params);
  return result.rows;
}

export async function searchAll(searchQuery: string, limit = 20) {
  // Search entities
  const entities = await searchEntities(searchQuery, undefined, limit);

  // Search bills
  const billsResult = await query<{
    id: string;
    bill_number: string;
    title: string;
    session: string;
    rank: number;
  }>(
    `SELECT
      id, bill_number, title, session,
      similarity(title, $1) as rank
     FROM bills
     WHERE title % $1 OR bill_number ILIKE $2
     ORDER BY rank DESC
     LIMIT $3`,
    [searchQuery, `%${searchQuery}%`, limit]
  );

  return {
    entities,
    bills: billsResult.rows,
  };
}

export async function autocomplete(
  searchQuery: string,
  limit = 10
): Promise<Array<{ name: string; type: string; slug: string }>> {
  const result = await query<{ name: string; type: string; slug: string }>(
    `SELECT name, type, slug
     FROM entities
     WHERE name ILIKE $1
     ORDER BY
       CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END,
       name
     LIMIT $3`,
    [`%${searchQuery}%`, `${searchQuery}%`, limit]
  );
  return result.rows;
}
