import { getPdcClient } from '../lib/pdc-client';
import { getDb, updateSyncState } from '../lib/db';

interface SyncOptions {
  fullSync?: boolean;
}

export async function syncPdcLobbying(options: SyncOptions = {}): Promise<void> {
  const db = getDb();
  const pdc = getPdcClient();

  console.log('Starting PDC lobbying sync...');

  await updateSyncState(db, 'pdc-lobbying', 'running');

  try {
    let totalSynced = 0;

    // Fetch lobbying registrations
    const registrations = await pdc.getLobbyingRegistrations({
      status: 'active',
    });

    for (const reg of registrations) {
      await db.query(
        `INSERT INTO lobbying_registrations (
          pdc_id, lobbyist_name, employer_name, registration_date,
          termination_date, status, subjects, source_url, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (pdc_id) DO UPDATE SET
          status = EXCLUDED.status,
          termination_date = EXCLUDED.termination_date,
          subjects = EXCLUDED.subjects,
          raw_data = EXCLUDED.raw_data,
          updated_at = NOW()`,
        [
          reg.id,
          reg.lobbyist_name,
          reg.employer_name,
          reg.registration_date,
          reg.termination_date,
          reg.status,
          reg.subjects,
          reg.source_url,
          reg,
        ]
      );

      totalSynced++;
    }

    // Fetch lobbying activities (compensation data)
    console.log('Fetching lobbying activities (compensation data)...');
    const activities = await pdc.getLobbyingActivities();
    console.log(`Fetched ${activities.length} activity records from PDC.`);

    let activitiesMatched = 0;
    let activitiesUnmatched = 0;
    let activitiesSkipped = 0;

    for (const activity of activities) {
      // Skip activities with no compensation data
      if (!activity.compensation && !activity.expenses) {
        activitiesSkipped++;
        continue;
      }

      // Find registration by lobbyist name and employer name
      // The compensation dataset uses different IDs than the registration dataset,
      // so we match by names instead of by registration_id
      // Use case-insensitive matching since name formats may differ between datasets
      const regResult = await db.query(
        `SELECT id FROM lobbying_registrations
         WHERE LOWER(TRIM(lobbyist_name)) = LOWER(TRIM($1))
           AND LOWER(TRIM(employer_name)) = LOWER(TRIM($2))
         LIMIT 1`,
        [activity.lobbyist_name, activity.employer_name]
      );

      if (regResult.rows.length > 0) {
        await db.query(
          `INSERT INTO lobbying_activities (
            registration_id, activity_date, description, compensation, expenses
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (registration_id, activity_date) DO UPDATE SET
            compensation = COALESCE(EXCLUDED.compensation, lobbying_activities.compensation),
            expenses = COALESCE(EXCLUDED.expenses, lobbying_activities.expenses),
            description = COALESCE(EXCLUDED.description, lobbying_activities.description)`,
          [
            regResult.rows[0].id,
            activity.date,
            activity.description,
            activity.compensation,
            activity.expenses,
          ]
        );
        activitiesMatched++;
      } else {
        activitiesUnmatched++;
      }
    }

    console.log(`Activity matching: ${activitiesMatched} matched, ${activitiesUnmatched} unmatched, ${activitiesSkipped} skipped (no compensation).`);

    await updateSyncState(db, 'pdc-lobbying', 'idle', totalSynced);
    console.log(`PDC lobbying sync complete. Synced ${totalSynced} registrations.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncState(db, 'pdc-lobbying', 'failed', 0, message);
    throw error;
  }
}
