import { getDb, updateSyncState } from '../lib/db';

export async function computeAggregates(): Promise<void> {
  const db = getDb();

  console.log('Starting aggregate computation...');

  await updateSyncState(db, 'compute-aggregates', 'running');

  try {
    // Refresh all materialized views
    // Note: Using non-concurrent refresh since views lack unique indexes
    console.log('Refreshing entity_aggregates...');
    await db.query('REFRESH MATERIALIZED VIEW entity_aggregates');

    console.log('Refreshing top_donors_by_year...');
    await db.query('REFRESH MATERIALIZED VIEW top_donors_by_year');

    console.log('Refreshing top_recipients_by_year...');
    await db.query('REFRESH MATERIALIZED VIEW top_recipients_by_year');

    console.log('Refreshing contribution_connections...');
    await db.query('REFRESH MATERIALIZED VIEW contribution_connections');

    console.log('Refreshing active_lobbyists...');
    await db.query('REFRESH MATERIALIZED VIEW active_lobbyists');

    // Generate activity log entries for recent changes
    await generateActivityLog(db);

    await updateSyncState(db, 'compute-aggregates', 'idle', 5);
    console.log('Aggregate computation complete.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncState(db, 'compute-aggregates', 'failed', 0, message);
    throw error;
  }
}

async function generateActivityLog(db: ReturnType<typeof getDb>): Promise<void> {
  console.log('Generating activity log entries...');

  // Log recent contributions
  await db.query(`
    INSERT INTO activity_log (activity_type, entity_id, related_entity_id, title, amount, activity_date, metadata)
    SELECT
      'contribution',
      c.contributor_entity_id,
      c.recipient_entity_id,
      c.contributor_name || ' contributed to ' || c.recipient_name,
      c.amount,
      c.contribution_date,
      jsonb_build_object('contribution_id', c.id)
    FROM contributions c
    WHERE c.created_at > NOW() - INTERVAL '1 day'
    AND NOT EXISTS (
      SELECT 1 FROM activity_log al
      WHERE al.metadata->>'contribution_id' = c.id::text
    )
    LIMIT 100
  `);

  // Log recent contracts
  await db.query(`
    INSERT INTO activity_log (activity_type, entity_id, title, amount, activity_date, metadata)
    SELECT
      'contract',
      c.recipient_entity_id,
      c.awarding_agency || ' awarded contract to ' || c.recipient_name,
      c.amount,
      c.start_date,
      jsonb_build_object('contract_id', c.id)
    FROM contracts c
    WHERE c.created_at > NOW() - INTERVAL '1 day'
    AND NOT EXISTS (
      SELECT 1 FROM activity_log al
      WHERE al.metadata->>'contract_id' = c.id::text
    )
    LIMIT 100
  `);

  console.log('Activity log updated.');
}
