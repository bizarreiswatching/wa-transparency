import {
  getSocrataClient,
  SOCRATA_HOSTS,
  SOCRATA_DATASETS,
  WaAgencyContract,
  parseSocrataDate,
  parseSocrataMoney,
  extractCertifications,
} from '../lib/socrata-client';
import { getDb, updateSyncState, getSyncState } from '../lib/db';
import { normalizeVendorName } from '../lib/normalizers/vendors';
import { normalizeAddress } from '../lib/normalizers/addresses';

interface SyncOptions {
  fullSync?: boolean;
  fiscalYear?: number;
}

export async function syncWaAgencyContracts(
  options: SyncOptions = {}
): Promise<void> {
  const db = getDb();
  const socrata = getSocrataClient();

  console.log('Starting WA Agency Contracts sync...');

  await updateSyncState(db, 'wa-agency-contracts', 'running');

  try {
    let totalSynced = 0;
    let totalSkipped = 0;

    // Get last sync state for incremental sync
    const syncState = await getSyncState(db, 'wa-agency-contracts');

    // Determine fiscal years to sync
    const currentFiscalYear = getCurrentFiscalYear();
    let fiscalYears: number[];

    if (options.fiscalYear) {
      fiscalYears = [options.fiscalYear];
    } else if (options.fullSync || !syncState?.cursor) {
      // Full sync: last 5 fiscal years
      fiscalYears = Array.from({ length: 5 }, (_, i) => currentFiscalYear - i);
      console.log('Full sync for fiscal years:', fiscalYears.join(', '));
    } else {
      // Incremental: current and previous fiscal year only
      fiscalYears = [currentFiscalYear, currentFiscalYear - 1];
      console.log('Incremental sync for fiscal years:', fiscalYears.join(', '));
    }

    for (const fiscalYear of fiscalYears) {
      console.log(`Processing fiscal year ${fiscalYear}...`);

      const whereClause = `fiscal_year = '${fiscalYear}'`;

      // Use generator for memory-efficient pagination
      const batches = socrata.fetchAll<WaAgencyContract>(
        SOCRATA_HOSTS.waData,
        SOCRATA_DATASETS.waAgencyContracts,
        {
          $where: whereClause,
          $order: 'contract_start_date DESC',
        },
        { batchSize: 1000 }
      );

      for await (const batch of batches) {
        console.log(`Processing batch of ${batch.length} records for FY${fiscalYear}...`);

        for (const record of batch) {
          // Extract vendor name
          const vendorName =
            record.contractor_name ||
            record.vendor_name ||
            '';

          if (!vendorName) {
            totalSkipped++;
            continue;
          }

          // Generate unique ID from contract data
          const waDataId =
            record.contract_number ||
            `wa-${hashContractKey(
              vendorName,
              record.agency_name || '',
              record.total_contract_value || record.original_contract_value || record.award_amount || '0',
              record.contract_start_date || '',
              fiscalYear.toString()
            )}`;

          // Parse and normalize data
          const normalizedName = normalizeVendorName(vendorName);
          const normalizedAddress = normalizeAddress(
            record.contractor_address,
            record.contractor_city,
            record.contractor_state,
            record.contractor_zip
          );

          const amount = parseSocrataMoney(
            record.total_contract_value ||
              record.original_contract_value ||
              record.award_amount
          );
          const startDate = parseSocrataDate(record.contract_start_date);
          const endDate = parseSocrataDate(record.contract_end_date);

          // Extract vendor certifications
          const certifications = extractCertifications(record);

          // Skip records without essential data
          if (!startDate || amount <= 0) {
            totalSkipped++;
            continue;
          }

          // Upsert contract record
          await db.query(
            `INSERT INTO contracts (
              wa_data_id, recipient_name, recipient_address, recipient_city,
              recipient_state, recipient_zip, awarding_agency, awarding_sub_agency,
              award_type, amount, start_date, end_date, description,
              place_of_performance_state,
              source_type, awarding_agency_type, contract_number,
              procurement_method, fiscal_year, vendor_certifications,
              source_url, raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            ON CONFLICT (wa_data_id) WHERE wa_data_id IS NOT NULL DO UPDATE SET
              recipient_name = EXCLUDED.recipient_name,
              recipient_address = EXCLUDED.recipient_address,
              recipient_city = EXCLUDED.recipient_city,
              recipient_state = EXCLUDED.recipient_state,
              recipient_zip = EXCLUDED.recipient_zip,
              amount = EXCLUDED.amount,
              end_date = EXCLUDED.end_date,
              description = EXCLUDED.description,
              vendor_certifications = EXCLUDED.vendor_certifications,
              raw_data = EXCLUDED.raw_data,
              updated_at = NOW()`,
            [
              waDataId,
              normalizedName,
              normalizedAddress.address || null,
              normalizedAddress.city || null,
              normalizedAddress.state || 'WA',
              normalizedAddress.zip || null,
              record.agency_name || 'State of Washington', // awarding_agency
              null, // awarding_sub_agency
              'contract', // award_type
              amount,
              startDate,
              endDate || null,
              record.contract_description || null, // description
              'WA', // place_of_performance_state
              'state', // source_type
              'state', // awarding_agency_type
              record.contract_number || null, // contract_number
              record.procurement_method || null, // procurement_method
              fiscalYear, // fiscal_year
              JSON.stringify(certifications), // vendor_certifications
              `https://data.wa.gov/resource/${SOCRATA_DATASETS.waAgencyContracts}`, // source_url
              JSON.stringify(record), // raw_data
            ]
          );

          // Also insert into contract_sources for provenance tracking
          await db.query(
            `INSERT INTO contract_sources (
              contract_id, source_name, source_record_id, source_url, raw_data
            )
            SELECT c.id, 'wa-agency-contracts', $1, $2, $3
            FROM contracts c
            WHERE c.wa_data_id = $1
            ON CONFLICT (source_name, source_record_id) DO UPDATE SET
              raw_data = EXCLUDED.raw_data,
              fetched_at = NOW()`,
            [
              waDataId,
              `https://data.wa.gov/resource/${SOCRATA_DATASETS.waAgencyContracts}`,
              JSON.stringify(record),
            ]
          );

          totalSynced++;
        }

        console.log(`Synced ${totalSynced} contracts (${totalSkipped} skipped)...`);
      }
    }

    // Update cursor to track last synced fiscal year
    await db.query(
      `UPDATE sync_state SET cursor = $2 WHERE source = $1`,
      ['wa-agency-contracts', currentFiscalYear.toString()]
    );

    await updateSyncState(db, 'wa-agency-contracts', 'idle', totalSynced);
    console.log(
      `WA Agency Contracts sync complete. Synced ${totalSynced} contracts, skipped ${totalSkipped}.`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('WA Agency Contracts sync failed:', message);
    await updateSyncState(db, 'wa-agency-contracts', 'failed', 0, message);
    throw error;
  }
}

/**
 * Get current Washington State fiscal year
 * WA fiscal year runs July 1 - June 30
 */
function getCurrentFiscalYear(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();

  // If July or later, we're in FY starting that July
  // FY is named for the year it ends, so July 2024 is FY 2025
  return month >= 6 ? year + 1 : year;
}

/**
 * Generate a hash-based ID for records without a unique identifier
 */
function hashContractKey(
  vendor: string,
  agency: string,
  amount: string,
  date: string,
  fiscalYear: string
): string {
  const key = `${vendor}-${agency}-${amount}-${date}-${fiscalYear}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
