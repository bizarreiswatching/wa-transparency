import { getLegislatureClient } from '../lib/legislature-client';
import { getDb, updateSyncState } from '../lib/db';
import { slugify } from '../lib/normalizers/names';

interface SyncOptions {
  session?: string;
}

export async function syncWaLegislature(options: SyncOptions = {}): Promise<void> {
  const db = getDb();
  const legislature = getLegislatureClient();

  console.log('Starting WA Legislature sync...');

  await updateSyncState(db, 'wa-legislature', 'running');

  try {
    let totalSynced = 0;

    // Sync legislators
    const legislators = await legislature.getLegislators();

    for (const legislator of legislators) {
      const slug = `p-${slugify(legislator.name)}`;

      await db.query(
        `INSERT INTO entities (
          type, name, slug, metadata
        ) VALUES ('person', $1, $2, $3)
        ON CONFLICT (slug) DO UPDATE SET
          metadata = entities.metadata || EXCLUDED.metadata,
          updated_at = NOW()`,
        [
          legislator.name,
          slug,
          {
            leg_id: legislator.id,
            chamber: legislator.chamber,
            district: legislator.district,
            party: legislator.party,
            email: legislator.email,
          },
        ]
      );

      totalSynced++;
    }

    // Sync bills
    const currentSession = options.session || getCurrentSession();
    const bills = await legislature.getBills({ session: currentSession });

    for (const bill of bills) {
      const billSlug = `${currentSession.toLowerCase()}-${slugify(bill.bill_number)}`;

      await db.query(
        `INSERT INTO bills (
          session, bill_number, slug, title, short_description,
          long_description, status, introduced_date, last_action_date,
          last_action, subjects, source_url, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (session, bill_number) DO UPDATE SET
          status = EXCLUDED.status,
          last_action_date = EXCLUDED.last_action_date,
          last_action = EXCLUDED.last_action,
          raw_data = EXCLUDED.raw_data,
          updated_at = NOW()`,
        [
          currentSession,
          bill.bill_number,
          billSlug,
          bill.title,
          bill.short_description,
          bill.long_description,
          bill.status,
          bill.introduced_date,
          bill.last_action_date,
          bill.last_action,
          bill.subjects,
          bill.source_url,
          bill,
        ]
      );

      // Sync sponsors
      for (const sponsor of bill.sponsors || []) {
        const sponsorSlug = `p-${slugify(sponsor.name)}`;

        // Get entity ID
        const entityResult = await db.query(
          `SELECT id FROM entities WHERE slug = $1`,
          [sponsorSlug]
        );

        if (entityResult.rows.length > 0) {
          // Get bill ID
          const billResult = await db.query(
            `SELECT id FROM bills WHERE slug = $1`,
            [billSlug]
          );

          if (billResult.rows.length > 0) {
            await db.query(
              `INSERT INTO bill_sponsors (bill_id, entity_id, sponsor_type)
               VALUES ($1, $2, $3)
               ON CONFLICT (bill_id, entity_id) DO NOTHING`,
              [billResult.rows[0].id, entityResult.rows[0].id, sponsor.type]
            );
          }
        }
      }

      totalSynced++;
    }

    await updateSyncState(db, 'wa-legislature', 'idle', totalSynced);
    console.log(`WA Legislature sync complete. Synced ${totalSynced} records.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncState(db, 'wa-legislature', 'failed', 0, message);
    throw error;
  }
}

function getCurrentSession(): string {
  // WA Legislature uses biennium format (e.g., "2025-26")
  const year = new Date().getFullYear();
  // Bienniums start in odd-numbered years
  const startYear = year % 2 === 0 ? year - 1 : year;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}
