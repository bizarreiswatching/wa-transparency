import { getPdcClient } from '../lib/pdc-client';
import { getDb, updateSyncState } from '../lib/db';
import { normalizeContributorName } from '../lib/normalizers/names';
import { normalizeAddress } from '../lib/normalizers/addresses';

interface SyncOptions {
  startDate?: string;
  endDate?: string;
  fullSync?: boolean;
}

export async function syncPdcContributions(options: SyncOptions = {}): Promise<void> {
  const db = getDb();
  const pdc = getPdcClient();

  console.log('Starting PDC contributions sync...');

  await updateSyncState(db, 'pdc-contributions', 'running');

  try {
    // Get last sync cursor
    const syncState = await db.query(
      `SELECT cursor FROM sync_state WHERE source = 'pdc-contributions'`
    );
    const cursor = options.fullSync ? null : syncState.rows[0]?.cursor;

    // Fetch contributions from PDC API
    let page = 1;
    let totalSynced = 0;
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching page ${page}...`);

      const contributions = await pdc.getContributions({
        startDate: options.startDate,
        endDate: options.endDate,
        cursor,
        page,
        limit: 1000,
      });

      if (contributions.length === 0) {
        hasMore = false;
        break;
      }

      // Process and insert contributions
      for (const contrib of contributions) {
        // Skip records without a valid date
        if (!contrib.date || contrib.date.trim() === '') {
          console.log(`Skipping contribution ${contrib.id} - missing date`);
          continue;
        }

        const normalizedName = normalizeContributorName(contrib.contributor_name);
        const normalizedAddress = normalizeAddress(
          contrib.contributor_address,
          contrib.contributor_city,
          contrib.contributor_state,
          contrib.contributor_zip
        );

        try {
          await db.query(
            `INSERT INTO contributions (
              pdc_id, contributor_name, contributor_address, contributor_city,
              contributor_state, contributor_zip, contributor_employer,
              contributor_occupation, recipient_name, recipient_type, amount,
              contribution_date, election_year, contribution_type, description,
              source_url, raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (pdc_id) DO UPDATE SET
              amount = EXCLUDED.amount,
              contribution_type = EXCLUDED.contribution_type,
              raw_data = EXCLUDED.raw_data,
              updated_at = NOW()`,
            [
              contrib.id,
              normalizedName,
              normalizedAddress.address || null,
              normalizedAddress.city || null,
              normalizedAddress.state || null,
              normalizedAddress.zip || null,
              contrib.employer || null,
              contrib.occupation || null,
              contrib.recipient_name,
              contrib.recipient_type,
              contrib.amount,
              contrib.date,
              contrib.election_year,
              contrib.type || null,
              contrib.description || null,
              contrib.source_url || null,
              contrib,
            ]
          );
          totalSynced++;
        } catch (err) {
          console.error(`Error inserting contribution ${contrib.id}:`, err);
        }
      }

      console.log(`Synced ${totalSynced} contributions...`);
      page++;

      // Update cursor for incremental syncs
      if (contributions.length > 0) {
        const lastContrib = contributions[contributions.length - 1];
        await db.query(
          `UPDATE sync_state SET cursor = $1, records_synced = $2, updated_at = NOW()
           WHERE source = 'pdc-contributions'`,
          [lastContrib.id, totalSynced]
        );
      }
    }

    await updateSyncState(db, 'pdc-contributions', 'idle', totalSynced);
    console.log(`PDC contributions sync complete. Synced ${totalSynced} records.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncState(db, 'pdc-contributions', 'failed', 0, message);
    throw error;
  }
}
