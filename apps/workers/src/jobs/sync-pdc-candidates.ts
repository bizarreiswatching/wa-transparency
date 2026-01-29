import { getPdcClient } from '../lib/pdc-client';
import { getDb, updateSyncState } from '../lib/db';
import { slugify } from '../lib/normalizers/names';

interface SyncOptions {
  electionYear?: number;
}

export async function syncPdcCandidates(options: SyncOptions = {}): Promise<void> {
  const db = getDb();
  const pdc = getPdcClient();

  console.log('Starting PDC candidates sync...');

  await updateSyncState(db, 'pdc-candidates', 'running');

  try {
    let totalSynced = 0;
    const currentYear = new Date().getFullYear();
    const electionYear = options.electionYear || currentYear;

    // Fetch candidates from PDC
    const candidates = await pdc.getCandidates({
      electionYear,
    });

    for (const candidate of candidates) {
      const slug = `p-${slugify(candidate.name)}`;

      await db.query(
        `INSERT INTO entities (
          type, name, slug, address, city, state, zip, metadata
        ) VALUES ('person', $1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (slug) DO UPDATE SET
          address = COALESCE(EXCLUDED.address, entities.address),
          city = COALESCE(EXCLUDED.city, entities.city),
          state = COALESCE(EXCLUDED.state, entities.state),
          zip = COALESCE(EXCLUDED.zip, entities.zip),
          metadata = entities.metadata || EXCLUDED.metadata,
          updated_at = NOW()`,
        [
          candidate.name,
          slug,
          candidate.address,
          candidate.city,
          candidate.state,
          candidate.zip,
          {
            pdc_id: candidate.id,
            office: candidate.office,
            party: candidate.party,
            election_year: electionYear,
          },
        ]
      );

      // Add alias for matching
      await db.query(
        `INSERT INTO entity_aliases (entity_id, alias, source, confidence)
         SELECT id, $1, 'pdc-candidates', 1.0
         FROM entities WHERE slug = $2
         ON CONFLICT DO NOTHING`,
        [candidate.name, slug]
      );

      totalSynced++;
    }

    await updateSyncState(db, 'pdc-candidates', 'idle', totalSynced);
    console.log(`PDC candidates sync complete. Synced ${totalSynced} candidates.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncState(db, 'pdc-candidates', 'failed', 0, message);
    throw error;
  }
}
