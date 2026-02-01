import {
  getSocrataClient,
  SOCRATA_HOSTS,
  SOCRATA_DATASETS,
  WaStatewideSale,
  parseSocrataMoney,
} from '../lib/socrata-client';
import { getDb, updateSyncState } from '../lib/db';
import { normalizeVendorName } from '../lib/normalizers/vendors';

interface SyncOptions {
  fullSync?: boolean;
  fiscalYear?: number;
}

export async function syncWaStatewideSales(
  options: SyncOptions = {}
): Promise<void> {
  const db = getDb();
  const socrata = getSocrataClient();

  console.log('Starting WA Statewide Contract Sales sync...');
  console.log('Note: This is a large dataset (172K+ records). Using batch processing.');

  await updateSyncState(db, 'wa-statewide-sales', 'running');

  try {
    let totalSynced = 0;
    let totalSkipped = 0;

    // Determine fiscal years to sync
    const currentFiscalYear = getCurrentFiscalYear();
    let whereClause: string | undefined;

    if (options.fiscalYear) {
      whereClause = `fiscal_year = '${options.fiscalYear}'`;
      console.log(`Syncing fiscal year ${options.fiscalYear}`);
    } else if (!options.fullSync) {
      // Default: current and previous 2 fiscal years for quarterly sync
      const years = [currentFiscalYear, currentFiscalYear - 1, currentFiscalYear - 2];
      whereClause = `fiscal_year IN ('${years.join("','")}')`;
      console.log(`Syncing fiscal years: ${years.join(', ')}`);
    } else {
      console.log('Full sync - all fiscal years');
    }

    // Use generator for memory-efficient pagination
    const batches = socrata.fetchAll<WaStatewideSale>(
      SOCRATA_HOSTS.waData,
      SOCRATA_DATASETS.waStatewideSales,
      {
        $where: whereClause,
        $order: 'fiscal_year DESC, fiscal_month DESC',
      },
      { batchSize: 1000 }
    );

    // Process batches and aggregate by contract/vendor/agency
    // Statewide sales data is often per-month, so we aggregate to avoid duplicate contracts
    const contractAggregates = new Map<
      string,
      {
        vendorName: string;
        vendorCity: string | undefined;
        vendorState: string | undefined;
        contractNumber: string | undefined;
        contractTitle: string | undefined;
        purchasingAgency: string | undefined;
        fiscalYear: number;
        totalAmount: number;
        records: WaStatewideSale[];
      }
    >();

    for await (const batch of batches) {
      console.log(`Processing batch of ${batch.length} records...`);

      for (const record of batch) {
        const vendorName = record.vendor_name || '';

        if (!vendorName) {
          totalSkipped++;
          continue;
        }

        const fiscalYear = parseInt(record.fiscal_year || '0', 10);
        if (!fiscalYear) {
          totalSkipped++;
          continue;
        }

        const amount = parseSocrataMoney(record.sales_amount);
        if (amount <= 0) {
          totalSkipped++;
          continue;
        }

        // Create aggregate key: contract + vendor + agency + fiscal year
        const key = `${record.contract_number || 'no-contract'}-${vendorName}-${record.purchasing_agency || 'unknown'}-${fiscalYear}`.toLowerCase();

        if (contractAggregates.has(key)) {
          const existing = contractAggregates.get(key)!;
          existing.totalAmount += amount;
          existing.records.push(record);
        } else {
          contractAggregates.set(key, {
            vendorName,
            vendorCity: record.vendor_city,
            vendorState: record.vendor_state,
            contractNumber: record.contract_number,
            contractTitle: record.contract_title,
            purchasingAgency: record.purchasing_agency,
            fiscalYear,
            totalAmount: amount,
            records: [record],
          });
        }
      }
    }

    console.log(`Aggregated ${contractAggregates.size} unique contracts from sales data`);

    // Now insert/update aggregated contracts
    for (const [key, aggregate] of Array.from(contractAggregates.entries())) {
      const normalizedName = normalizeVendorName(aggregate.vendorName);

      // Generate unique ID
      const waDataId = `wa-sales-${hashContractKey(
        aggregate.vendorName,
        aggregate.purchasingAgency || '',
        aggregate.contractNumber || '',
        aggregate.fiscalYear.toString()
      )}`;

      // Derive fiscal year dates
      const startDate = new Date(aggregate.fiscalYear - 1, 6, 1); // July 1 of prior year
      const endDate = new Date(aggregate.fiscalYear, 5, 30); // June 30 of fiscal year

      await db.query(
        `INSERT INTO contracts (
          wa_data_id, recipient_name, recipient_city, recipient_state,
          awarding_agency, award_type, amount, start_date, end_date,
          description, place_of_performance_state,
          source_type, awarding_agency_type, contract_number, fiscal_year,
          source_url, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (wa_data_id) WHERE wa_data_id IS NOT NULL DO UPDATE SET
          recipient_name = EXCLUDED.recipient_name,
          amount = EXCLUDED.amount,
          description = EXCLUDED.description,
          raw_data = EXCLUDED.raw_data,
          updated_at = NOW()`,
        [
          waDataId,
          normalizedName,
          aggregate.vendorCity || null,
          aggregate.vendorState || 'WA',
          aggregate.purchasingAgency || 'State of Washington',
          'statewide-contract', // award_type - indicates this is from statewide contract sales
          aggregate.totalAmount,
          startDate,
          endDate,
          aggregate.contractTitle || null,
          'WA', // place_of_performance_state
          'state', // source_type
          'state', // awarding_agency_type
          aggregate.contractNumber || null,
          aggregate.fiscalYear,
          `https://data.wa.gov/resource/${SOCRATA_DATASETS.waStatewideSales}`,
          JSON.stringify({
            aggregated_from_records: aggregate.records.length,
            sample_record: aggregate.records[0],
          }),
        ]
      );

      // Insert into contract_sources
      await db.query(
        `INSERT INTO contract_sources (
          contract_id, source_name, source_record_id, source_url, raw_data
        )
        SELECT c.id, 'wa-statewide-sales', $1, $2, $3
        FROM contracts c
        WHERE c.wa_data_id = $1
        ON CONFLICT (source_name, source_record_id) DO UPDATE SET
          raw_data = EXCLUDED.raw_data,
          fetched_at = NOW()`,
        [
          waDataId,
          `https://data.wa.gov/resource/${SOCRATA_DATASETS.waStatewideSales}`,
          JSON.stringify({
            aggregated_from_records: aggregate.records.length,
            fiscal_year: aggregate.fiscalYear,
          }),
        ]
      );

      totalSynced++;

      // Log progress every 1000 records
      if (totalSynced % 1000 === 0) {
        console.log(`Synced ${totalSynced} aggregated contracts...`);
      }
    }

    await updateSyncState(db, 'wa-statewide-sales', 'idle', totalSynced);
    console.log(
      `WA Statewide Sales sync complete. Created ${totalSynced} aggregated contracts from ${totalSkipped + contractAggregates.size} records (${totalSkipped} skipped).`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('WA Statewide Sales sync failed:', message);
    await updateSyncState(db, 'wa-statewide-sales', 'failed', 0, message);
    throw error;
  }
}

/**
 * Get current Washington State fiscal year
 */
function getCurrentFiscalYear(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 6 ? year + 1 : year;
}

/**
 * Generate a hash-based ID for records
 */
function hashContractKey(
  vendor: string,
  agency: string,
  contractNumber: string,
  fiscalYear: string
): string {
  const key = `${vendor}-${agency}-${contractNumber}-${fiscalYear}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
