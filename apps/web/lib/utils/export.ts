import { query } from '../db';

export async function exportContributions(
  entityId?: string,
  format: 'csv' | 'json' = 'csv'
): Promise<string> {
  let sql = `
    SELECT
      contribution_date,
      contributor_name,
      recipient_name,
      amount,
      contribution_type,
      election_year,
      description
    FROM contributions
  `;

  const params: unknown[] = [];

  if (entityId) {
    sql += ` WHERE contributor_entity_id = $1 OR recipient_entity_id = $1`;
    params.push(entityId);
  }

  sql += ` ORDER BY contribution_date DESC LIMIT 10000`;

  const result = await query(sql, params);

  if (format === 'json') {
    return JSON.stringify(result.rows, null, 2);
  }

  return toCsv(result.rows);
}

export async function exportContracts(
  entityId?: string,
  format: 'csv' | 'json' = 'csv'
): Promise<string> {
  let sql = `
    SELECT
      recipient_name,
      awarding_agency,
      award_type,
      amount,
      start_date,
      end_date,
      description,
      naics_code
    FROM contracts
  `;

  const params: unknown[] = [];

  if (entityId) {
    sql += ` WHERE recipient_entity_id = $1`;
    params.push(entityId);
  }

  sql += ` ORDER BY start_date DESC LIMIT 10000`;

  const result = await query(sql, params);

  if (format === 'json') {
    return JSON.stringify(result.rows, null, 2);
  }

  return toCsv(result.rows);
}

export async function exportLobbying(
  entityId?: string,
  format: 'csv' | 'json' = 'csv'
): Promise<string> {
  let sql = `
    SELECT
      lr.lobbyist_name,
      lr.employer_name,
      lr.registration_date,
      lr.termination_date,
      lr.status,
      lr.subjects
    FROM lobbying_registrations lr
  `;

  const params: unknown[] = [];

  if (entityId) {
    sql += ` WHERE lr.lobbyist_entity_id = $1 OR lr.employer_entity_id = $1`;
    params.push(entityId);
  }

  sql += ` ORDER BY lr.registration_date DESC LIMIT 10000`;

  const result = await query(sql, params);

  if (format === 'json') {
    return JSON.stringify(result.rows, null, 2);
  }

  return toCsv(result.rows);
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string') {
            // Escape quotes and wrap in quotes if contains comma or quote
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }
          if (Array.isArray(value)) {
            return `"${value.join('; ')}"`;
          }
          return String(value);
        })
        .join(',')
    ),
  ];

  return csvRows.join('\n');
}
