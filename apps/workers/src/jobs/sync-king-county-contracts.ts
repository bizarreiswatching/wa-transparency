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
      whereClause = `start_date >= '${dateStr}'`;
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
        $order: 'start_date DESC',
      },
      { batchSize: 1000 }
    );

    for await (const batch of batches) {
      console.log(`Processing batch of ${batch.length} records...`);

      for (const record of batch) {
        // Extract vendor name (dataset uses vendor_supplier_name)
        const vendorName = record.vendor_supplier_name || '';

        if (!vendorName) {
          totalSkipped++;
          continue;
        }

        // Generate unique ID from contract data
        // Use contract number (procnum) or generate hash
        const contractId =
          record.procnum ||
          record.contract ||
          `kc-${hashContractKey(
            vendorName,
            record.agency || '',
            record.not_to_exceed || record.spend_to_date || '0',
            record.start_date || ''
          )}`;

        // Parse and normalize data
        const normalizedName = normalizeVendorName(vendorName);
        // No address fields in this dataset
        const normalizedAddress = normalizeAddress(undefined, undefined, 'WA', undefined);

        // Use not_to_exceed or spend_to_date for amount
        const amount = parseSocrataMoney(record.not_to_exceed || record.spend_to_date);
        const startDate = parseSocrataDate(record.start_date);
        const endDate = parseSocrataDate(record.expires);

        // Skip records without essential data (allow $0 contracts)
        if (!startDate) {
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
            source_type, awarding_agency_type, contract_number, procurement_method,
            source_url, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          ON CONFLICT (king_county_id) WHERE king_county_id IS NOT NULL DO UPDATE SET
            recipient_name = EXCLUDED.recipient_name,
            amount = EXCLUDED.amount,
            end_date = EXCLUDED.end_date,
            description = EXCLUDED.description,
            procurement_method = EXCLUDED.procurement_method,
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
            record.agency || null, // awarding_sub_agency (department/agency)
            record.type || 'contract', // award_type
            amount,
            startDate,
            endDate || null,
            record.description || null, // description
            'WA', // place_of_performance_state
            'King County', // place_of_performance_city (general area)
            'county', // source_type
            'county', // awarding_agency_type
            record.contract || record.procnum || null, // contract_number
            record.procurement_method || null, // procurement_method
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
