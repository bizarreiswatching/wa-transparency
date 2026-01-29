import { getUsaspendingClient } from '../lib/usaspending-client';
import { getDb, updateSyncState } from '../lib/db';

interface SyncOptions {
  startDate?: string;
  endDate?: string;
  fullSync?: boolean;
}

export async function syncUsaspending(options: SyncOptions = {}): Promise<void> {
  const db = getDb();
  const usaspending = getUsaspendingClient();

  console.log('Starting USASpending sync...');

  await updateSyncState(db, 'usaspending', 'running');

  try {
    let totalSynced = 0;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching page ${page}...`);

      const contracts = await usaspending.getWashingtonContracts({
        startDate: options.startDate,
        endDate: options.endDate,
        page,
        limit: 100,
      });

      if (contracts.length === 0) {
        hasMore = false;
        break;
      }

      for (const contract of contracts) {
        await db.query(
          `INSERT INTO contracts (
            usaspending_id, recipient_name, recipient_address, recipient_city,
            recipient_state, recipient_zip, awarding_agency, awarding_sub_agency,
            award_type, amount, start_date, end_date, description,
            naics_code, naics_description, place_of_performance_state,
            place_of_performance_city, source_url, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          ON CONFLICT (usaspending_id) DO UPDATE SET
            amount = EXCLUDED.amount,
            end_date = EXCLUDED.end_date,
            description = EXCLUDED.description,
            raw_data = EXCLUDED.raw_data,
            updated_at = NOW()`,
          [
            contract.id,
            contract.recipient_name,
            contract.recipient_address,
            contract.recipient_city,
            contract.recipient_state,
            contract.recipient_zip,
            contract.awarding_agency,
            contract.awarding_sub_agency,
            contract.award_type,
            contract.amount,
            contract.start_date,
            contract.end_date,
            contract.description,
            contract.naics_code,
            contract.naics_description,
            contract.place_of_performance_state,
            contract.place_of_performance_city,
            contract.source_url,
            contract,
          ]
        );

        totalSynced++;
      }

      console.log(`Synced ${totalSynced} contracts...`);
      page++;
    }

    await updateSyncState(db, 'usaspending', 'idle', totalSynced);
    console.log(`USASpending sync complete. Synced ${totalSynced} contracts.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncState(db, 'usaspending', 'failed', 0, message);
    throw error;
  }
}
