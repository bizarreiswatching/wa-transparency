import { query } from '../db';

interface SpendingByYear {
  year: number;
  contributions_given: number;
  contributions_received: number;
  contracts_received: number;
}

export async function getEntitySpendingByYear(entityId: string): Promise<SpendingByYear[]> {
  // Get contributions given by year
  const contributionsGiven = await query<{ year: number; total: number }>(
    `SELECT EXTRACT(YEAR FROM contribution_date)::int as year, SUM(amount) as total
     FROM contributions
     WHERE contributor_entity_id = $1
     GROUP BY EXTRACT(YEAR FROM contribution_date)
     ORDER BY year`,
    [entityId]
  );

  // Get contributions received by year
  const contributionsReceived = await query<{ year: number; total: number }>(
    `SELECT EXTRACT(YEAR FROM contribution_date)::int as year, SUM(amount) as total
     FROM contributions
     WHERE recipient_entity_id = $1
     GROUP BY EXTRACT(YEAR FROM contribution_date)
     ORDER BY year`,
    [entityId]
  );

  // Get contracts received by year
  const contractsReceived = await query<{ year: number; total: number }>(
    `SELECT EXTRACT(YEAR FROM start_date)::int as year, SUM(amount) as total
     FROM contracts
     WHERE recipient_entity_id = $1
     GROUP BY EXTRACT(YEAR FROM start_date)
     ORDER BY year`,
    [entityId]
  );

  // Combine all years
  const allYears = new Set<number>();
  contributionsGiven.rows.forEach((r) => allYears.add(r.year));
  contributionsReceived.rows.forEach((r) => allYears.add(r.year));
  contractsReceived.rows.forEach((r) => allYears.add(r.year));

  const givenByYear = new Map(contributionsGiven.rows.map((r) => [r.year, Number(r.total)]));
  const receivedByYear = new Map(contributionsReceived.rows.map((r) => [r.year, Number(r.total)]));
  const contractsByYear = new Map(contractsReceived.rows.map((r) => [r.year, Number(r.total)]));

  return Array.from(allYears)
    .sort((a, b) => a - b)
    .map((year) => ({
      year,
      contributions_given: givenByYear.get(year) || 0,
      contributions_received: receivedByYear.get(year) || 0,
      contracts_received: contractsByYear.get(year) || 0,
    }));
}

interface ActivityTimeline {
  date: string;
  count: number;
  amount: number;
}

export async function getEntityActivityTimeline(
  entityId: string,
  months = 12
): Promise<ActivityTimeline[]> {
  const result = await query<{ month: string; count: number; total: number }>(
    `SELECT
      TO_CHAR(DATE_TRUNC('month', activity_date), 'YYYY-MM') as month,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total
     FROM activity_log
     WHERE (entity_id = $1 OR related_entity_id = $1)
       AND activity_date >= NOW() - INTERVAL '${months} months'
     GROUP BY DATE_TRUNC('month', activity_date)
     ORDER BY month`,
    [entityId]
  );

  return result.rows.map((r) => ({
    date: r.month,
    count: Number(r.count),
    amount: Number(r.total),
  }));
}
