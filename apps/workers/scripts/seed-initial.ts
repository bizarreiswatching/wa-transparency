import 'dotenv/config';
import { getDb } from '../src/lib/db';
import { slugify } from '../src/lib/normalizers/names';

async function seedInitial() {
  const db = getDb();

  console.log('Starting initial seed...');

  try {
    // Seed sync state entries
    console.log('Seeding sync state entries...');
    const sources = [
      'pdc-contributions',
      'pdc-lobbying',
      'pdc-candidates',
      'usaspending',
      'wa-legislature',
      'wa-sos',
      'entity-resolution',
      'compute-aggregates',
      'trigger-rebuild',
    ];

    for (const source of sources) {
      await db.query(
        `INSERT INTO sync_state (source, status, records_synced)
         VALUES ($1, 'idle', 0)
         ON CONFLICT (source) DO NOTHING`,
        [source]
      );
    }

    // Seed example entities for testing
    console.log('Seeding example entities...');

    // Example organization
    await db.query(
      `INSERT INTO entities (type, name, slug, description, metadata)
       VALUES ('organization', 'Example Corporation', 'o-example-corporation',
               'An example organization for testing', '{}')
       ON CONFLICT (slug) DO NOTHING`
    );

    // Example person (legislator)
    await db.query(
      `INSERT INTO entities (type, name, slug, metadata)
       VALUES ('person', 'Jane Smith', 'p-jane-smith',
               '{"chamber": "senate", "district": 1, "party": "D"}')
       ON CONFLICT (slug) DO NOTHING`
    );

    // Example committee
    await db.query(
      `INSERT INTO entities (type, name, slug, metadata)
       VALUES ('committee', 'Citizens for Good Government', 'o-citizens-for-good-government',
               '{"committee_type": "PAC"}')
       ON CONFLICT (slug) DO NOTHING`
    );

    console.log('Initial seed complete.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedInitial();
