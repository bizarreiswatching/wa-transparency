import { getPool, query, transaction } from '@wa-transparency/db';

export function getDb() {
  return {
    query,
    transaction,
    pool: getPool(),
  };
}

export async function updateSyncState(
  db: ReturnType<typeof getDb>,
  source: string,
  status: 'running' | 'idle' | 'failed',
  recordsSynced = 0,
  errorMessage?: string
): Promise<void> {
  if (status === 'running') {
    await db.query(
      `INSERT INTO sync_state (source, status, last_sync_at, records_synced)
       VALUES ($1, $2, NOW(), 0)
       ON CONFLICT (source) DO UPDATE SET
         status = $2,
         last_sync_at = NOW(),
         error_message = NULL,
         updated_at = NOW()`,
      [source, status]
    );
  } else if (status === 'idle') {
    await db.query(
      `UPDATE sync_state SET
         status = $2,
         last_successful_sync_at = NOW(),
         records_synced = $3,
         error_message = NULL,
         updated_at = NOW()
       WHERE source = $1`,
      [source, status, recordsSynced]
    );
  } else if (status === 'failed') {
    await db.query(
      `UPDATE sync_state SET
         status = $2,
         error_message = $3,
         updated_at = NOW()
       WHERE source = $1`,
      [source, status, errorMessage]
    );
  }
}

export async function getSyncState(db: ReturnType<typeof getDb>, source: string) {
  const result = await db.query(
    `SELECT * FROM sync_state WHERE source = $1`,
    [source]
  );
  return result.rows[0] || null;
}
