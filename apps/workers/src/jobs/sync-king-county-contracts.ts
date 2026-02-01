import {
  getSocrataClient,
  SOCRATA_HOSTS,
  SOCRATA_DATASETS,
  KingCountyContract,
  parseSocrataDate,
  parseSocrataMoney,
} from '../lib/socrata-client';
import { getDb, updateSyncState, getSyncState } from '../lib/db';
import { normalizeVendorName } from '../lib/normalizers/vendors';
import { normalizeAddress } from '../lib/normalizers/addresses';

interface SyncOptions {
  fullSync?: boolean;
}

export async function syncKingCountyContracts(
  options: SyncOptions = {}
): Promise<void> {
  const db = getDb();
  const socrata = getSocrataClient();

  console.log('Starting King County contracts sync...');

  await updateSyncState(db, 'king-county-contracts', 'running');

  try {
    let totalSynced = 0;
    let totalSkipped = 0;

    // Get last sync state for incremental sync
    const syncState = await getSyncState(db, 'king-county-contracts');
    const lastSyncDate = options.fullSync
      ? null
      : syncState?.last_successful_sync_at;

    // Build where clause for incremental sync
    let whereClause: string | undefined;
    if (lastSyncDate && !options.fullSync) {
      // Sync records updated since last successful sync
      const dateStr = new Date(lastSyncDate).toISOString().split('T')[0];
      whereClause = `execution_date >= '${dateStr}'`;
      console.log(`Incremental sync from ${dateStr}`);
    } else {
      console.log('Full sync');
    }

    // Use generator for memory-efficient pagination
    const batches = socrata.fetchAll<KingCountyContract>(
      SOCRATA_HOSTS.kingCounty,
      SOCRATA_DATASETS.kingCountyProcurement,
      {
        $where: whereClause,
        $order: 'execution_date DESC',
      },
      { batchSize: 1000 }
    );

    for await (const batch of batches) {
      console.log(`Processing batch of ${batch.length} records...`);

      for (const record of batch) {
        // Extract vendor name from various possible fields
        const vendorName =
          record.supplier_name ||
          record.vendor_name ||
          record.vendor ||
          '';

        if (!vendorName) {
          totalSkipped++;
          continue;
        }

        // Generate unique ID from contract data
        const contractId =
          record.contract_id ||
          `kc-${hashContractKey(
            vendorName,
            record.department || '',
            record.contract_amount || record.award_amount || record.amount || '0',
            record.execution_date || ''
          )}`;

        // Parse and normalize data
        const normalizedName = normalizeVendorName(vendorName);
        const normalizedAddress = normalizeAddress(
          record.supplier_address,
          record.supplier_city,
          record.supplier_state,
          record.supplier_zip
        );

        const amount = parseSocrataMoney(
          record.contract_amount || record.award_amount || record.amount
        );
        const startDate = parseSocrataDate(record.execution_date);
        const endDate = parseSocrataDate(record.expiration_date);

        // Skip records without essential data
        if (!startDate || amount <= 0) {
          totalSkipped++;
          continue;
        }

        // Upsert contract record
        await db.query(
          `INSERT INTO contracts (
            king_county_id, recipient_name, recipient_address, recipient_city,
            recipient_state, recipient_zip, awarding_agency, awarding_sub_agency,
            award_type, amount, start_date, end_date, description,
            place_of_performance_state, place_of_performance_city,
            source_type, awarding_agency_type, contract_number,
            source_url, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          ON CONFLICT (king_county_id) WHERE king_county_id IS NOT NULL DO UPDATE SET
            recipient_name = EXCLUDED.recipient_name,
            recipient_address = EXCLUDED.recipient_address,
            recipient_city = EXCLUDED.recipient_city,
            recipient_state = EXCLUDED.recipient_state,
            recipient_zip = EXCLUDED.recipient_zip,
            amount = EXCLUDED.amount,
            end_date = EXCLUDED.end_date,
            description = EXCLUDED.description,
            raw_data = EXCLUDED.raw_data,
            updated_at = NOW()`,
          [
            contractId,
            normalizedName,
            normalizedAddress.address || null,
            normalizedAddress.city || null,
            normalizedAddress.state || 'WA',
            normalizedAddress.zip || null,
            'King County', // awarding_agency
            record.department || null, // awarding_sub_agency
            record.contract_type || 'contract', // award_type
            amount,
            startDate,
            endDate || null,
            record.contract_title || null, // description
            'WA', // place_of_performance_state
            'King County', // place_of_performance_city (general area)
            'county', // source_type
            'county', // awarding_agency_type
            record.contract_id || null, // contract_number
            `https://data.kingcounty.gov/resource/${SOCRATA_DATASETS.kingCountyProcurement}`, // source_url
            JSON.stringify(record), // raw_data
          ]
        );

        // Also insert into contract_sources for provenance tracking
        await db.query(
          `INSERT INTO contract_sources (
            contract_id, source_name, source_record_id, source_url, raw_data
          )
          SELECT c.id, 'king-county-procurement', $1, $2, $3
          FROM contracts c
          WHERE c.king_county_id = $1
          ON CONFLICT (source_name, source_record_id) DO UPDATE SET
            raw_data = EXCLUDED.raw_data,
            fetched_at = NOW()`,
          [
            contractId,
            `https://data.kingcounty.gov/resource/${SOCRATA_DATASETS.kingCountyProcurement}`,
            JSON.stringify(record),
          ]
        );

        totalSynced++;
      }

      console.log(`Synced ${totalSynced} contracts (${totalSkipped} skipped)...`);
    }

    await updateSyncState(db, 'king-county-contracts', 'idle', totalSynced);
    console.log(
      `King County contracts sync complete. Synced ${totalSynced} contracts, skipped ${totalSkipped}.`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('King County contracts sync failed:', message);
    await updateSyncState(db, 'king-county-contracts', 'failed', 0, message);
    throw error;
  }
}

/**
 * Generate a hash-based ID for records without a unique identifier
 */
function hashContractKey(
  vendor: string,
  department: string,
  amount: string,
  date: string
): string {
  const key = `${vendor}-${department}-${amount}-${date}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
